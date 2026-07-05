import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

const cleanPhone = (phone = '') => String(phone).replace(/[^0-9]/g, '')

const moneyNumber = (value) => {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number : 0
}

const normalizeOrderItem = (item, orderId = null) => {
  const productName = item.name || item.product_name || item.name_snapshot || 'Producto web'
  const categoryName = item.category_name || item.category?.name || 'Tienda web'
  const quantity = Number(item.quantity || 1)
  const unitPrice = moneyNumber(item.unit_price || item.price || 0)
  const itemSubtotal = moneyNumber(item.subtotal || unitPrice * quantity)

  return {
    ...(orderId ? { order_id: orderId } : {}),
    product_id: item.product_id || item.id || null,
    name: productName,
    product_name: productName,
    name_snapshot: productName,
    category_name: categoryName,
    quantity,
    unit_price: unitPrice,
    price: unitPrice,
    subtotal: itemSubtotal,
    sold_at: item.sold_at || new Date().toISOString()
  }
}

const applyInventoryForItems = async (items = [], action = 'discount', orderId = '') => {
  for (const item of items) {
    if (!item.product_id) continue

    const { data: recipeItems, error: recipeError } = await supabase
      .from('product_recipes')
      .select('*')
      .eq('product_id', item.product_id)

    if (recipeError) throw recipeError
    if (!recipeItems?.length) continue

    for (const recipe of recipeItems) {
      const quantityToMove = Number(recipe.quantity || 0) * Number(item.quantity || 1)

      if (quantityToMove <= 0) continue

      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', recipe.inventory_item_id)
        .single()

      if (inventoryError || !inventoryItem) continue

      const currentStock = Number(
        inventoryItem.current_stock ??
        inventoryItem.stock ??
        0
      )

      const newStock =
        action === 'restore'
          ? currentStock + quantityToMove
          : currentStock - quantityToMove

      const { error: updateStockError } = await supabase
        .from('inventory')
        .update({
          current_stock: newStock,
          stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', recipe.inventory_item_id)

      if (updateStockError) throw updateStockError

      await supabase
        .from('inventory_movements')
        .insert({
          item_id: recipe.inventory_item_id,
          type: action === 'restore' ? 'web_sale_restore' : 'web_sale_discount',
          quantity: quantityToMove,
          description:
            action === 'restore'
              ? `Devolución automática por pedido web ${orderId}`
              : `Descuento automático por pedido web ${orderId}`,
          created_at: new Date().toISOString()
        })
    }
  }
}

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    module: 'public-store',
    timestamp: new Date().toISOString()
  })
})

router.get('/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        category_id,
        image_url,
        categories (
          id,
          name
        )
      `)
      .order('name', { ascending: true })

    if (error) throw error

    const products = (data || []).map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: moneyNumber(product.price),
      image_url: product.image_url || '',
      category_id: product.category_id || null,
      category_name: product.categories?.name || 'Productos',
      available: true
    }))

    return res.json({
      success: true,
      products
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener productos de tienda'
    })
  }
})

router.post('/orders', async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      customer_address,
      delivery_type = 'pickup',
      notes = '',
      payment_method = 'pending',
      items = [],
      subtotal = 0,
      delivery_fee = 0,
      total = 0
    } = req.body || {}

    if (!customer_name || !cleanPhone(customer_phone)) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y teléfono del cliente son obligatorios'
      })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El pedido debe tener productos'
      })
    }

    const cleanCustomerPhone = cleanPhone(customer_phone)

    await supabase
      .from('customers')
      .upsert(
        {
          name: customer_name || '',
          phone: cleanCustomerPhone,
          address: customer_address || '',
          reference: '',
          updated_at: new Date().toISOString()
        },
        { onConflict: 'phone' }
      )

    const cleanItems = items.map((item) => normalizeOrderItem(item))

    const orderSubtotal = moneyNumber(
      subtotal || cleanItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
    )

    const orderDeliveryFee = moneyNumber(delivery_fee || 0)
    const orderTotal = moneyNumber(total || orderSubtotal + orderDeliveryFee)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        type: delivery_type === 'delivery' ? 'delivery' : 'counter',
        order_type: delivery_type === 'delivery' ? 'delivery' : 'pickup',
        status: 'pending',
        payment_method,
        subtotal: orderSubtotal,
        delivery_fee: orderDeliveryFee,
        total: orderTotal,
        total_amount: orderTotal,
        customer_name: String(customer_name).trim(),
        customer_phone: cleanCustomerPhone,
        customer_address: customer_address || null,
        notes: notes ? `[WEB] ${notes}` : '[WEB]',
        source: 'web',
        user_id: null
      })
      .select()
      .single()

    if (orderError) throw orderError

    const orderItems = cleanItems.map((item) => ({
      ...item,
      order_id: order.id
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    applyInventoryForItems(orderItems, 'discount', order.id)
      .catch((err) => {
        console.error('Error descontando inventario pedido web:', err?.message || err)
      })

    return res.status(201).json({
      success: true,
      message: 'Pedido web creado correctamente',
      order
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al crear pedido web'
    })
  }
})

export default router
