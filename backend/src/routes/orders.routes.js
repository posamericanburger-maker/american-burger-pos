import express from 'express'
import { supabase } from '../config/supabase.js'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()

const cleanPhone = (phone = '') => String(phone).replace(/[^0-9]/g, '')

const normalizeOrderItem = (item, orderId = null) => {
  const productName = item.name || item.product_name || item.name_snapshot || 'Producto'
  const categoryName = item.category_name || item.category?.name || 'Sin categoría'
  const quantity = Number(item.quantity || 1)
  const unitPrice = Number(item.unit_price || item.price || 0)
  const itemSubtotal = Number(item.subtotal || unitPrice * quantity)

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
          type: action === 'restore' ? 'sale_edit_restore' : 'sale_edit_discount',
          quantity: quantityToMove,
          description:
            action === 'restore'
              ? `Devolución automática por edición de venta ${orderId}`
              : `Descuento automático por edición de venta ${orderId}`,
          created_at: new Date().toISOString()
        })
    }
  }
}

const getActiveCashSession = async () => {
  const { data, error } = await supabase
    .from('cash_sessions')
    .select('*')
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  return data
}

const canEditOrderInOpenCash = async (order) => {
  const activeCash = await getActiveCashSession()

  if (!activeCash) {
    return {
      allowed: false,
      message: 'No puedes editar ventas porque la caja está cerrada'
    }
  }

  const cashOpenDate = new Date(
    activeCash.opened_at ||
    activeCash.created_at ||
    activeCash.start_date ||
    activeCash.fecha_apertura
  )

  const orderDate = new Date(order.created_at)

  if (orderDate < cashOpenDate) {
    return {
      allowed: false,
      message: 'No puedes editar ventas de una caja anterior'
    }
  }

  return {
    allowed: true,
    activeCash
  }
}

router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return res.json({
      success: true,
      orders: data || []
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener pedidos'
    })
  }
})

router.post('/', verifyToken, verifyRole(['cajero', 'admin']), async (req, res) => {
  try {
    const {
      type = 'counter',
      order_type = type,
      status = 'paid',
      payment_method = 'cash',
      subtotal = 0,
      delivery_fee = 0,
      total = 0,
      total_amount = total,
      customer = null,
      notes = '',
      items = []
    } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El pedido debe tener productos'
      })
    }

    if (customer?.phone) {
      const cleanCustomerPhone = cleanPhone(customer.phone)

      if (cleanCustomerPhone) {
        await supabase
          .from('customers')
          .upsert(
            {
              name: customer.name || '',
              phone: cleanCustomerPhone,
              address: customer.address || '',
              reference: customer.reference || '',
              updated_at: new Date().toISOString()
            },
            { onConflict: 'phone' }
          )
      }
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        type,
        order_type,
        status,
        payment_method,
        subtotal: Number(subtotal || 0),
        delivery_fee: Number(delivery_fee || 0),
        total: Number(total || total_amount || 0),
        total_amount: Number(total_amount || total || 0),
        customer_name: customer?.name || null,
        customer_phone: customer?.phone ? cleanPhone(customer.phone) : null,
        customer_address: customer?.address || null,
        notes,
        user_id: req.user?.id || null
      })
      .select()
      .single()

    if (orderError) throw orderError

    const orderItems = items.map((item) => normalizeOrderItem(item, order.id))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    await applyInventoryForItems(orderItems, 'discount', order.id)

    return res.status(201).json({
      success: true,
      message: 'Pedido creado correctamente',
      order
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al crear pedido'
    })
  }
})

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return res.json({
      success: true,
      order: data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener pedido'
    })
  }
})

router.put('/:id/edit', verifyToken, verifyRole(['cajero', 'admin']), async (req, res) => {
  try {
    const { id } = req.params
    const {
      items = [],
      notes,
      payment_method
    } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La venta debe tener al menos un producto'
      })
    }

    const { data: existingOrder, error: orderFetchError } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (*)
      `)
      .eq('id', id)
      .single()

    if (orderFetchError) throw orderFetchError

    const permission = await canEditOrderInOpenCash(existingOrder)

    if (!permission.allowed) {
      return res.status(403).json({
        success: false,
        message: permission.message
      })
    }

    const oldItems = existingOrder.items || []

    await applyInventoryForItems(oldItems, 'restore', id)

    const { error: deleteItemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id)

    if (deleteItemsError) throw deleteItemsError

    const cleanItems = items.map((item) => normalizeOrderItem(item, id))

    const newSubtotal = cleanItems.reduce(
      (sum, item) => sum + Number(item.subtotal || 0),
      0
    )

    const deliveryFee = Number(existingOrder.delivery_fee || 0)
    const newTotal = newSubtotal + deliveryFee

    const { error: insertItemsError } = await supabase
      .from('order_items')
      .insert(cleanItems)

    if (insertItemsError) throw insertItemsError

    await applyInventoryForItems(cleanItems, 'discount', id)

    const updatePayload = {
      subtotal: newSubtotal,
      total: newTotal,
      total_amount: newTotal,
      updated_at: new Date().toISOString()
    }

    if (notes !== undefined) updatePayload.notes = notes
    if (payment_method) updatePayload.payment_method = payment_method

    const { data: updatedOrder, error: updateOrderError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        *,
        items:order_items (*)
      `)
      .single()

    if (updateOrderError) throw updateOrderError

    return res.json({
      success: true,
      message: 'Venta editada correctamente e inventario actualizado',
      order: updatedOrder
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al editar la venta'
    })
  }
})

router.put('/:id', verifyToken, verifyRole(['cajero', 'admin']), async (req, res) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    const payload = {
      updated_at: new Date().toISOString()
    }

    if (status) payload.status = status
    if (notes !== undefined) payload.notes = notes

    const { data, error } = await supabase
      .from('orders')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return res.json({
      success: true,
      message: 'Pedido actualizado',
      order: data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar pedido'
    })
  }
})

router.put('/:id/status', verifyToken, verifyRole(['cajero', 'admin']), async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return res.json({
      success: true,
      message: 'Estado actualizado',
      order: data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar estado'
    })
  }
})

export default router
