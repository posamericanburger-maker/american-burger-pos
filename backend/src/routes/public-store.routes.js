import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

const cleanPhone = (phone = '') => String(phone).replace(/[^0-9]/g, '')
const moneyNumber = (value) => {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number : 0
}

const normalizeOrderItem = (item, orderId = null) => {
  const productName = item.name || item.product_name || item.name_snapshot || 'Producto'
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

      const currentStock = Number(inventoryItem.current_stock ?? inventoryItem.stock ?? 0)
      const newStock = action === 'restore' ? currentStock + quantityToMove : currentStock - quantityToMove

      const { error: updateStockError } = await supabase
        .from('inventory')
        .update({
          current_stock: newStock,
          stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', recipe.inventory_item_id)

      if (updateStockError) throw updateStockError

      await supabase.from('inventory_movements').insert({
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
    success: true,
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
        *,
        categories (
          id,
          name
        )
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error

    const products = (data || []).map((product) => ({
      id: product.id,
      name: product.name || product.product_name || 'Producto',
      product_name: product.name || product.product_name || 'Producto',
      description: product.description || product.detail || '',
      price: moneyNumber(product.price || product.unit_price || product.sale_price || 0),
      unit_price: moneyNumber(product.price || product.unit_price || product.sale_price || 0),
      category_id: product.category_id || null,
      category_name: product.category_name || product.categories?.name || 'Menú',
      image_url: product.image_url || product.image || '',
      is_active: product.is_active !== false,
      stock: product.stock ?? product.current_stock ?? null
    }))

    return res.json({ success: true, products })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener productos de tienda web'
    })
  }
})

router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    return res.json({ success: true, categories: data || [] })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener categorías'
    })
  }
})

router.post('/orders', async (req, res) => {
  try {
    const {
      order_type = 'pickup',
      delivery_type = order_type,
      payment_method = 'pending',
      payment_status = 'pending',
      subtotal = 0,
      delivery_fee = 0,
      total = 0,
      total_amount = total,
      customer = null,
      customer_name = customer?.name || '',
      customer_phone = customer?.phone || '',
      customer_address = customer?.address || '',
      notes = '',
      items = []
    } = req.body || {}

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'El pedido debe tener productos' })
    }

    const cleanCustomerPhone = cleanPhone(customer_phone)

    if (!String(customer_name || '').trim()) {
      return res.status(400).json({ success: false, message: 'Falta el nombre del cliente' })
    }

    if (!cleanCustomerPhone) {
      return res.status(400).json({ success: false, message: 'Falta el teléfono del cliente' })
    }

    await supabase.from('customers').upsert(
      {
        name: String(customer_name).trim(),
        phone: cleanCustomerPhone,
        address: customer_address || '',
        reference: customer?.reference || '',
        updated_at: new Date().toISOString()
      },
      { onConflict: 'phone' }
    )

    const cleanItemsPreview = items.map((item) => normalizeOrderItem(item))
    const calculatedSubtotal = cleanItemsPreview.reduce((sum, item) => sum + moneyNumber(item.subtotal), 0)
    const finalSubtotal = moneyNumber(subtotal || calculatedSubtotal)
    const finalDeliveryFee = moneyNumber(delivery_fee)
    const finalTotal = moneyNumber(total || total_amount || finalSubtotal + finalDeliveryFee)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        type: delivery_type === 'delivery' ? 'delivery' : 'web',
        order_type: delivery_type || order_type || 'pickup',
        channel: 'web',
        source: 'web',
        status: 'pending',
        payment_status,
        payment_method,
        subtotal: finalSubtotal,
        delivery_fee: finalDeliveryFee,
        total: finalTotal,
        total_amount: finalTotal,
        customer_name: String(customer_name).trim(),
        customer_phone: cleanCustomerPhone,
        customer_address: customer_address || null,
        notes,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError) throw orderError

    const orderItems = items.map((item) => normalizeOrderItem(item, order.id))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    applyInventoryForItems(orderItems, 'discount', order.id).catch((err) => {
      console.error('Error descontando inventario pedido web:', err?.message || err)
    })

    return res.status(201).json({
      success: true,
      message: 'Pedido web creado correctamente',
      order: { ...order, items: orderItems }
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al crear pedido web'
    })
  }
})

export default router
