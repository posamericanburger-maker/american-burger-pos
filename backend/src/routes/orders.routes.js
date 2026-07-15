import express from 'express'
import { supabase } from '../config/supabase.js'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()

const num = (value) => {
  const result = Number(value || 0)
  return Number.isFinite(result) ? result : 0
}

const roundQuantity = (value, decimals = 4) => {
  const factor = 10 ** decimals
  return Math.round((num(value) + Number.EPSILON) * factor) / factor
}

const cleanPhone = (phone = '') =>
  String(phone || '').replace(/[^0-9]/g, '')

const normalizeOrderItem = (item, orderId = null) => {
  const productName =
    item.name ||
    item.product_name ||
    item.name_snapshot ||
    'Producto'

  const categoryName =
    item.category_name ||
    item.category?.name ||
    'Sin categoría'

  const quantity = Math.max(1, num(item.quantity || 1))
  const unitPrice = num(item.unit_price ?? item.price ?? 0)
  const itemSubtotal = num(item.subtotal || unitPrice * quantity)

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

const getActiveCashSession = async () => {
  const { data, error } = await supabase
    .from('cash_sessions')
    .select('*')
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  return data || null
}

const requireActiveCashSession = async () => {
  const session = await getActiveCashSession()

  if (!session) {
    const error = new Error(
      'Debes abrir caja antes de registrar una venta'
    )

    error.statusCode = 400
    throw error
  }

  return session
}

const canEditOrderInOpenCash = async (order) => {
  const activeCash = await getActiveCashSession()

  if (!activeCash) {
    return {
      allowed: false,
      message: 'No puedes editar ventas porque la caja está cerrada'
    }
  }

  if (
    order.cash_session_id &&
    String(order.cash_session_id) !== String(activeCash.id)
  ) {
    return {
      allowed: false,
      message: 'No puedes editar ventas pertenecientes a una caja anterior'
    }
  }

  const cashOpenDate = new Date(
    activeCash.opened_at ||
    activeCash.created_at
  )

  const orderDate = new Date(order.created_at)

  if (
    !Number.isNaN(cashOpenDate.getTime()) &&
    !Number.isNaN(orderDate.getTime()) &&
    orderDate < cashOpenDate
  ) {
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

const getInventoryCost = (inventoryItem = {}) =>
  num(
    inventoryItem.average_cost ??
    inventoryItem.unit_cost ??
    inventoryItem.last_purchase_price ??
    0
  )

const applyInventoryForItems = async ({
  items = [],
  action = 'discount',
  orderId,
  cashSessionId,
  userId = null
}) => {
  const isRestore = action === 'restore'
  const registeredMovements = []

  for (const item of items) {
    const productId = item.product_id

    if (!productId) continue

    const { data: recipeItems, error: recipeError } = await supabase
      .from('product_recipes')
      .select('*')
      .eq('product_id', productId)

    if (recipeError) throw recipeError
    if (!Array.isArray(recipeItems) || recipeItems.length === 0) continue

    for (const recipe of recipeItems) {
      const inventoryItemId =
        recipe.inventory_item_id ||
        recipe.item_id ||
        recipe.ingredient_id

      if (!inventoryItemId) continue

      const recipeQuantity = num(
        recipe.quantity ??
        recipe.required_quantity ??
        recipe.amount ??
        0
      )

      const soldQuantity = num(item.quantity || 1)

      const quantityToMove = roundQuantity(
        recipeQuantity * soldQuantity
      )

      if (quantityToMove <= 0) continue

      const { data: inventoryItem, error: inventoryError } =
        await supabase
          .from('inventory')
          .select('*')
          .eq('id', inventoryItemId)
          .single()

      if (inventoryError) throw inventoryError
      if (!inventoryItem) continue

      const currentStock = roundQuantity(
        inventoryItem.current_stock ??
        inventoryItem.stock ??
        0
      )

      const calculatedStock = isRestore
        ? currentStock + quantityToMove
        : currentStock - quantityToMove

      const newStock = roundQuantity(
        Math.max(0, calculatedStock)
      )

      const unitCost = getInventoryCost(inventoryItem)

      const totalCost = roundQuantity(
        quantityToMove * unitCost,
        4
      )

      const now = new Date().toISOString()

      const { error: updateStockError } = await supabase
        .from('inventory')
        .update({
          current_stock: newStock,
          stock: newStock,
          updated_at: now
        })
        .eq('id', inventoryItemId)

      if (updateStockError) throw updateStockError

      const movementSource = isRestore
        ? 'sale_edit_restore'
        : 'sale_discount'

      const movementType = isRestore ? 'in' : 'out'

      const orderLabel = String(orderId || '').slice(0, 8)

      const description = isRestore
        ? `Devolución automática por edición del pedido ${orderLabel}`
        : `Consumo automático por venta del pedido ${orderLabel}`

      const movementPayload = {
        item_id: inventoryItemId,
        cash_session_id: cashSessionId || null,
        order_id: orderId || null,
        product_id: productId || null,
        order_item_id: item.id || null,
        user_id: userId || null,

        type: movementType,
        movement_source: movementSource,

        quantity: quantityToMove,
        previous_stock: currentStock,
        new_stock: newStock,

        unit_cost: unitCost,
        total_cost: totalCost,

        description,
        created_at: now,
        updated_at: now
      }

      const { data: movement, error: movementError } = await supabase
        .from('inventory_movements')
        .insert(movementPayload)
        .select()
        .single()

      if (movementError) throw movementError

      registeredMovements.push(movement)
    }
  }

  return registeredMovements
}

router.get('/', verifyToken, async (req, res) => {
  try {
    const { cash_session_id, status, limit = 500 } = req.query

    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items (*)
      `)
      .order('created_at', { ascending: false })
      .limit(Math.min(Number(limit || 500), 2000))

    if (cash_session_id) {
      query = query.eq('cash_session_id', cash_session_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

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

router.post(
  '/',
  verifyToken,
  verifyRole(['cajero', 'admin']),
  async (req, res) => {
    let createdOrderId = null

    try {
      const activeCash = await requireActiveCashSession()

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
          const { error: customerError } = await supabase
            .from('customers')
            .upsert(
              {
                name: customer.name || '',
                phone: cleanCustomerPhone,
                address: customer.address || '',
                reference: customer.reference || '',
                updated_at: new Date().toISOString()
              },
              {
                onConflict: 'phone'
              }
            )

          if (customerError) {
            console.error(
              'No se pudo actualizar cliente:',
              customerError.message
            )
          }
        }
      }

      const normalizedSubtotal = num(subtotal)
      const normalizedDeliveryFee = num(delivery_fee)

      const normalizedTotal = num(
        total ||
        total_amount ||
        normalizedSubtotal + normalizedDeliveryFee
      )

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          cash_session_id: activeCash.id,

          type,
          order_type,
          status,
          payment_method,

          subtotal: normalizedSubtotal,
          delivery_fee: normalizedDeliveryFee,
          total: normalizedTotal,
          total_amount: normalizedTotal,

          customer_name: customer?.name || null,
          customer_phone: customer?.phone
            ? cleanPhone(customer.phone)
            : null,
          customer_address: customer?.address || null,

          notes,
          user_id: req.user?.id || null
        })
        .select()
        .single()

      if (orderError) throw orderError

      createdOrderId = order.id

      const orderItemsPayload = items.map((item) =>
        normalizeOrderItem(item, order.id)
      )

      const {
        data: insertedOrderItems,
        error: itemsError
      } = await supabase
        .from('order_items')
        .insert(orderItemsPayload)
        .select()

      if (itemsError) throw itemsError

      const inventoryMovements = await applyInventoryForItems({
        items: insertedOrderItems || orderItemsPayload,
        action: 'discount',
        orderId: order.id,
        cashSessionId: activeCash.id,
        userId: req.user?.id || null
      })

      const { data: completeOrder, error: completeOrderError } =
        await supabase
          .from('orders')
          .select(`
            *,
            items:order_items (*)
          `)
          .eq('id', order.id)
          .single()

      if (completeOrderError) throw completeOrderError

      return res.status(201).json({
        success: true,
        message: 'Pedido creado e inventario descontado correctamente',
        order: completeOrder,
        inventory_movements: inventoryMovements.length,
        cash_session_id: activeCash.id
      })
    } catch (error) {
      console.error(
        'Error creando pedido:',
        error?.message || error
      )

      /*
       * Si el pedido alcanzó a crearse pero falló la inserción
       * de los ítems, se elimina para evitar pedidos vacíos.
       *
       * Si el error ocurrió después de comenzar el descuento,
       * no se elimina automáticamente, porque podría haber
       * movimientos ya registrados que requieren auditoría.
       */
      if (createdOrderId) {
        const { data: existingItems } = await supabase
          .from('order_items')
          .select('id')
          .eq('order_id', createdOrderId)

        if (!existingItems?.length) {
          await supabase
            .from('orders')
            .delete()
            .eq('id', createdOrderId)
        }
      }

      return res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message ||
          'Error al crear el pedido y descontar inventario'
      })
    }
  }
)

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

router.put(
  '/:id/edit',
  verifyToken,
  verifyRole(['cajero', 'admin']),
  async (req, res) => {
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

      const { data: existingOrder, error: orderFetchError } =
        await supabase
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

      const activeCash = permission.activeCash
      const oldItems = existingOrder.items || []

      await applyInventoryForItems({
        items: oldItems,
        action: 'restore',
        orderId: id,
        cashSessionId:
          existingOrder.cash_session_id ||
          activeCash.id,
        userId: req.user?.id || null
      })

      const { error: deleteItemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', id)

      if (deleteItemsError) throw deleteItemsError

      const cleanItemsPayload = items.map((item) =>
        normalizeOrderItem(item, id)
      )

      const newSubtotal = cleanItemsPayload.reduce(
        (sum, item) => sum + num(item.subtotal),
        0
      )

      const deliveryFee = num(existingOrder.delivery_fee)
      const newTotal = newSubtotal + deliveryFee

      const {
        data: insertedItems,
        error: insertItemsError
      } = await supabase
        .from('order_items')
        .insert(cleanItemsPayload)
        .select()

      if (insertItemsError) throw insertItemsError

      await applyInventoryForItems({
        items: insertedItems || cleanItemsPayload,
        action: 'discount',
        orderId: id,
        cashSessionId: activeCash.id,
        userId: req.user?.id || null
      })

      const updatePayload = {
        cash_session_id: activeCash.id,
        subtotal: newSubtotal,
        total: newTotal,
        total_amount: newTotal,
        updated_at: new Date().toISOString()
      }

      if (notes !== undefined) {
        updatePayload.notes = notes
      }

      if (payment_method) {
        updatePayload.payment_method = payment_method
      }

      const { data: updatedOrder, error: updateOrderError } =
        await supabase
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
        message:
          'Venta editada correctamente e inventario actualizado',
        order: updatedOrder
      })
    } catch (error) {
      console.error(
        'Error editando venta:',
        error?.message || error
      )

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error al editar la venta'
      })
    }
  }
)

router.put(
  '/:id',
  verifyToken,
  verifyRole(['cajero', 'admin']),
  async (req, res) => {
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
        message:
          error.message ||
          'Error al actualizar pedido'
      })
    }
  }
)

router.put(
  '/:id/status',
  verifyToken,
  verifyRole(['cajero', 'admin']),
  async (req, res) => {
    try {
      const { id } = req.params
      const { status } = req.body

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Debes indicar el nuevo estado'
        })
      }

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
        message:
          error.message ||
          'Error al actualizar estado'
      })
    }
  }
)

export default router
