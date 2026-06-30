import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

const cleanPhone = (phone = '') => String(phone).replace(/[^0-9]/g, '')

const moneyNumber = (value) => Number(value || 0)

const normalizeExternalItem = (item = {}) => {
  const quantity = Number(item.quantity || 1)
  const unitPrice = Number(item.unit_price || item.price || 0)

  return {
    product_id: item.product_id || item.id || null,
    name: item.name || item.product_name || 'Producto externo',
    product_name: item.name || item.product_name || 'Producto externo',
    name_snapshot: item.name || item.product_name || 'Producto externo',
    category_name: item.category_name || 'Pedido externo',
    quantity,
    unit_price: unitPrice,
    price: unitPrice,
    subtotal: moneyNumber(item.subtotal || quantity * unitPrice),
    sold_at: new Date().toISOString()
  }
}

const applyInventoryForItems = async (items = [], orderId = '') => {
  for (const item of items) {
    if (!item.product_id) continue

    const { data: recipeItems, error: recipeError } = await supabase
      .from('product_recipes')
      .select('*')
      .eq('product_id', item.product_id)

    if (recipeError) throw recipeError
    if (!recipeItems?.length) continue

    for (const recipe of recipeItems) {
      const quantityToMove =
        Number(recipe.quantity || 0) * Number(item.quantity || 1)

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

      const newStock = currentStock - quantityToMove

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
          type: 'external_order_discount',
          quantity: quantityToMove,
          description: `Descuento automático por pedido externo ${orderId}`,
          created_at: new Date().toISOString()
        })
    }
  }
}

router.get('/health', async (req, res) => {
  return res.json({
    success: true,
    module: 'external-orders',
    status: 'OK',
    timestamp: new Date().toISOString()
  })
})

router.post('/', async (req, res) => {
  try {
    const secret = process.env.EXTERNAL_ORDER_SECRET
    const receivedSecret = req.headers['x-external-order-secret']

    if (!secret || receivedSecret !== secret) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      })
    }

    const {
      channel = 'external',
      external_order_id = '',
      customer_name = '',
      customer_phone = '',
      customer_address = '',
      delivery_address = '',
      notes = '',
      payment_method = 'app',
      status = 'received',
      delivery_fee = 0,
      items = []
    } = req.body

    if (!external_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Falta external_order_id'
      })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El pedido externo debe tener productos'
      })
    }

    const marker = `EXTERNAL_ID:${external_order_id}`

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .ilike('notes', `%${marker}%`)
      .limit(1)
      .maybeSingle()

    if (existingOrder) {
      return res.status(409).json({
        success: false,
        message: 'Pedido externo ya existe',
        order_id: existingOrder.id
      })
    }

    const cleanItems = items.map(normalizeExternalItem)

    const subtotal = cleanItems.reduce(
      (sum, item) => sum + Number(item.subtotal || 0),
      0
    )

    const finalDeliveryFee = Number(delivery_fee || 0)
    const total = subtotal + finalDeliveryFee

    const finalAddress = delivery_address || customer_address || ''

    const finalNotes = [
      `CANAL:${channel}`,
      `EXTERNAL_ID:${external_order_id}`,
      notes ? `NOTAS:${notes}` : '',
      finalAddress ? `DIRECCION:${finalAddress}` : ''
    ]
      .filter(Boolean)
      .join(' | ')

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        type: 'external',
        order_type: 'delivery',
        status,
        payment_method,
        subtotal,
        delivery_fee: finalDeliveryFee,
        total,
        total_amount: total,
        customer_name: customer_name || null,
        customer_phone: customer_phone ? cleanPhone(customer_phone) : null,
        customer_address: finalAddress || null,
        notes: finalNotes,
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

    applyInventoryForItems(orderItems, order.id).catch((err) => {
      console.error(
        'Error descontando inventario pedido externo:',
        err?.message || err
      )
    })

    return res.status(201).json({
      success: true,
      message: 'Pedido externo recibido correctamente',
      order
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al recibir pedido externo'
    })
  }
})

export default router
