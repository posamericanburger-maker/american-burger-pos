import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// ============================================================
// UTILIDADES
// ============================================================

const cleanPhone = (phone = '') =>
  String(phone || '').replace(/[^0-9]/g, '')

const num = (value) => {
  const result = Number(value || 0)
  return Number.isFinite(result) ? result : 0
}

const roundNumber = (value, decimals = 4) => {
  const factor = 10 ** decimals

  return (
    Math.round(
      (num(value) + Number.EPSILON) * factor
    ) / factor
  )
}

const isValidUuid = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )

const normalizeText = (value = '') =>
  String(value || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const getInventoryCost = (inventoryItem = {}) =>
  num(
    inventoryItem.average_cost ??
      inventoryItem.unit_cost ??
      inventoryItem.last_purchase_price ??
      0
  )

// ============================================================
// CAJA ACTIVA
// ============================================================

const getActiveCashSession = async () => {
  const { data, error } = await supabase
    .from('cash_sessions')
    .select('*')
    .eq('status', 'open')
    .order('opened_at', {
      ascending: false
    })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  return data || null
}

// ============================================================
// BUSCAR PRODUCTO INTERNO
// ============================================================

const findProductByName = async (name = '') => {
  const normalizedName = normalizeText(name)

  if (!normalizedName) {
    return null
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)

  if (error) throw error

  const products = data || []

  return (
    products.find(
      (product) =>
        normalizeText(product.name) ===
        normalizedName
    ) ||
    products.find((product) =>
      normalizeText(product.name).includes(
        normalizedName
      )
    ) ||
    products.find((product) =>
      normalizedName.includes(
        normalizeText(product.name)
      )
    ) ||
    null
  )
}

const findInternalProduct = async (
  rawProductId,
  productName
) => {
  if (isValidUuid(rawProductId)) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', rawProductId)
      .maybeSingle()

    if (error) throw error

    if (data) {
      return data
    }
  }

  return findProductByName(productName)
}

// ============================================================
// NORMALIZAR PRODUCTO EXTERNO
// ============================================================

const normalizeExternalItem = async (
  item = {}
) => {
  const quantity = Math.max(
    1,
    num(item.quantity || 1)
  )

  const suppliedPrice = num(
    item.unit_price ??
      item.price ??
      0
  )

  const rawProductId =
    item.product_id ||
    item.id ||
    null

  const externalName =
    item.name ||
    item.product_name ||
    item.name_snapshot ||
    ''

  const product =
    await findInternalProduct(
      rawProductId,
      externalName
    )

  const productName =
    product?.name ||
    externalName ||
    'Producto externo'

  const finalPrice =
    suppliedPrice ||
    num(product?.price)

  const subtotal = num(
    item.subtotal ||
      quantity * finalPrice
  )

  return {
    product_id:
      product?.id || null,

    name:
      productName,

    product_name:
      productName,

    name_snapshot:
      productName,

    category_name:
      item.category_name ||
      product?.category_name ||
      'Pedido externo',

    quantity,

    unit_price:
      finalPrice,

    price:
      finalPrice,

    subtotal,

    sold_at:
      item.sold_at ||
      new Date().toISOString()
  }
}

// ============================================================
// EVITAR DESCUENTOS DUPLICADOS
// ============================================================

const hasInventoryAlreadyApplied = async (
  orderId
) => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('id')
    .eq('order_id', orderId)
    .eq(
      'movement_source',
      'external_order_discount'
    )
    .limit(1)
    .maybeSingle()

  if (error) throw error

  return Boolean(data)
}

// ============================================================
// RESTAURAR MOVIMIENTOS PARCIALES
// Se usa si falla el descuento a mitad del proceso.
// ============================================================

const rollbackInventoryMovements = async (
  movements = []
) => {
  for (
    let index = movements.length - 1;
    index >= 0;
    index -= 1
  ) {
    const movement = movements[index]

    try {
      await supabase
        .from('inventory')
        .update({
          current_stock:
            movement.previous_stock,

          stock:
            movement.previous_stock,

          updated_at:
            new Date().toISOString()
        })
        .eq(
          'id',
          movement.item_id
        )

      if (movement.id) {
        await supabase
          .from('inventory_movements')
          .delete()
          .eq(
            'id',
            movement.id
          )
      }
    } catch (rollbackError) {
      console.error(
        'Error restaurando movimiento parcial:',
        rollbackError?.message ||
          rollbackError
      )
    }
  }
}

// ============================================================
// DESCONTAR INVENTARIO POR RECETAS
// ============================================================

const applyInventoryForItems = async ({
  items = [],
  orderId,
  cashSessionId
}) => {
  if (!orderId) {
    throw new Error(
      'No se recibió el ID del pedido externo'
    )
  }

  if (!cashSessionId) {
    throw new Error(
      'El pedido externo no está asociado a una caja'
    )
  }

  const alreadyApplied =
    await hasInventoryAlreadyApplied(
      orderId
    )

  if (alreadyApplied) {
    return {
      applied: false,
      already_applied: true,
      movements: []
    }
  }

  const registeredMovements = []

  try {
    for (const item of items) {
      const productId =
        item.product_id

      if (!productId) {
        console.warn(
          `Producto externo sin coincidencia interna: ${
            item.name ||
            item.product_name ||
            'Sin nombre'
          }`
        )

        continue
      }

      const {
        data: recipeItems,
        error: recipeError
      } = await supabase
        .from('product_recipes')
        .select('*')
        .eq(
          'product_id',
          productId
        )

      if (recipeError) {
        throw recipeError
      }

      if (
        !Array.isArray(recipeItems) ||
        recipeItems.length === 0
      ) {
        console.warn(
          `Producto sin receta: ${
            item.name ||
            productId
          }`
        )

        continue
      }

      for (const recipe of recipeItems) {
        const inventoryItemId =
          recipe.inventory_item_id ||
          recipe.item_id ||
          recipe.ingredient_id

        if (!inventoryItemId) {
          continue
        }

        const recipeQuantity = num(
          recipe.quantity ??
            recipe.required_quantity ??
            recipe.amount ??
            0
        )

        const soldQuantity = num(
          item.quantity || 1
        )

        const quantityToMove =
          roundNumber(
            recipeQuantity *
              soldQuantity,
            4
          )

        if (quantityToMove <= 0) {
          continue
        }

        const {
          data: inventoryItem,
          error: inventoryError
        } = await supabase
          .from('inventory')
          .select('*')
          .eq(
            'id',
            inventoryItemId
          )
          .single()

        if (inventoryError) {
          throw inventoryError
        }

        if (!inventoryItem) {
          throw new Error(
            `No existe el insumo ${inventoryItemId}`
          )
        }

        const currentStock =
          roundNumber(
            inventoryItem.current_stock ??
              inventoryItem.stock ??
              0,
            4
          )

        const newStock =
          roundNumber(
            Math.max(
              0,
              currentStock -
                quantityToMove
            ),
            4
          )

        const unitCost =
          getInventoryCost(
            inventoryItem
          )

        const totalCost =
          roundNumber(
            quantityToMove *
              unitCost,
            4
          )

        const now =
          new Date().toISOString()

        const {
          error: updateStockError
        } = await supabase
          .from('inventory')
          .update({
            current_stock:
              newStock,

            stock:
              newStock,

            updated_at:
              now
          })
          .eq(
            'id',
            inventoryItemId
          )

        if (updateStockError) {
          throw updateStockError
        }

        const orderLabel =
          String(orderId).slice(0, 8)

        const movementPayload = {
          item_id:
            inventoryItemId,

          cash_session_id:
            cashSessionId,

          order_id:
            orderId,

          product_id:
            productId,

          order_item_id:
            item.id || null,

          // Se deja null para evitar conflictos
          // con la relación de usuarios existente.
          user_id:
            null,

          // Usa un valor permitido por el
          // check constraint de la tabla.
          type:
            'out',

          movement_source:
            'external_order_discount',

          quantity:
            quantityToMove,

          previous_stock:
            currentStock,

          new_stock:
            newStock,

          unit_cost:
            unitCost,

          total_cost:
            totalCost,

          description:
            `Descuento automático por pedido externo ${orderLabel}`,

          created_at:
            now,

          updated_at:
            now
        }

        const {
          data: movement,
          error: movementError
        } = await supabase
          .from(
            'inventory_movements'
          )
          .insert(
            movementPayload
          )
          .select()
          .single()

        if (movementError) {
          await supabase
            .from('inventory')
            .update({
              current_stock:
                currentStock,

              stock:
                currentStock,

              updated_at:
                new Date().toISOString()
            })
            .eq(
              'id',
              inventoryItemId
            )

          throw movementError
        }

        registeredMovements.push(
          movement
        )
      }
    }

    return {
      applied: true,
      already_applied: false,
      movements:
        registeredMovements
    }
  } catch (error) {
    await rollbackInventoryMovements(
      registeredMovements
    )

    throw error
  }
}

// ============================================================
// HEALTH
// ============================================================

router.get(
  '/health',
  async (req, res) => {
    return res.json({
      success: true,
      module:
        'external-orders',
      status:
        'OK',
      timestamp:
        new Date().toISOString()
    })
  }
)

// ============================================================
// RECIBIR PEDIDO EXTERNO
// ============================================================

router.post(
  '/',
  async (req, res) => {
    let createdOrderId = null
    let inventoryApplied = false

    try {
      const secret =
        process.env
          .EXTERNAL_ORDER_SECRET

      const receivedSecret =
        req.headers[
          'x-external-order-secret'
        ]

      if (
        !secret ||
        receivedSecret !== secret
      ) {
        return res.status(401).json({
          success: false,
          message:
            'No autorizado'
        })
      }

      /*
       * La venta debe pertenecer a una caja
       * abierta para que el consumo quede
       * registrado dentro de la jornada.
       */
      const activeCash =
        await getActiveCashSession()

      if (!activeCash) {
        return res.status(400).json({
          success: false,
          message:
            'No se pueden recibir pedidos externos porque la caja está cerrada'
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
      } = req.body || {}

      if (!external_order_id) {
        return res.status(400).json({
          success: false,
          message:
            'Falta external_order_id'
        })
      }

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'El pedido externo debe tener productos'
        })
      }

      const marker =
        `EXTERNAL_ID:${external_order_id}`

      // ========================================================
      // EVITAR PEDIDOS DUPLICADOS
      // ========================================================

      const {
        data: existingOrder,
        error: existingError
      } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          cash_session_id
        `)
        .ilike(
          'notes',
          `%${marker}%`
        )
        .limit(1)
        .maybeSingle()

      if (existingError) {
        throw existingError
      }

      if (existingOrder) {
        return res.status(409).json({
          success: false,
          message:
            'Pedido externo ya existe',
          order_id:
            existingOrder.id
        })
      }

      // ========================================================
      // NORMALIZAR PRODUCTOS
      // ========================================================

      const cleanItems = []

      for (const item of items) {
        const normalizedItem =
          await normalizeExternalItem(
            item
          )

        cleanItems.push(
          normalizedItem
        )
      }

      const unresolvedItems =
        cleanItems.filter(
          (item) =>
            !item.product_id
        )

      if (
        unresolvedItems.length > 0
      ) {
        const names =
          unresolvedItems
            .map(
              (item) =>
                item.name
            )
            .join(', ')

        return res.status(400).json({
          success: false,

          message:
            `No fue posible relacionar estos productos externos con productos del POS: ${names}`
        })
      }

      const subtotal =
        cleanItems.reduce(
          (sum, item) =>
            sum +
            num(
              item.subtotal
            ),
          0
        )

      const finalDeliveryFee =
        num(delivery_fee)

      const total =
        subtotal +
        finalDeliveryFee

      const finalAddress =
        delivery_address ||
        customer_address ||
        ''

      const finalNotes = [
        `CANAL:${channel}`,
        marker,
        notes
          ? `NOTAS:${notes}`
          : '',
        finalAddress
          ? `DIRECCION:${finalAddress}`
          : ''
      ]
        .filter(Boolean)
        .join(' | ')

      // ========================================================
      // CREAR PEDIDO ASOCIADO A LA CAJA
      // ========================================================

      const {
        data: order,
        error: orderError
      } = await supabase
        .from('orders')
        .insert({
          cash_session_id:
            activeCash.id,

          type:
            'external',

          order_type:
            'delivery',

          status:
            status ||
            'received',

          payment_method:
            payment_method ||
            'app',

          subtotal,

          delivery_fee:
            finalDeliveryFee,

          total,

          total_amount:
            total,

          customer_name:
            customer_name ||
            null,

          customer_phone:
            customer_phone
              ? cleanPhone(
                  customer_phone
                )
              : null,

          customer_address:
            finalAddress ||
            null,

          notes:
            finalNotes,

          user_id:
            null
        })
        .select()
        .single()

      if (orderError) {
        throw orderError
      }

      createdOrderId =
        order.id

      // ========================================================
      // CREAR ÍTEMS DEL PEDIDO
      // ========================================================

      const orderItemsPayload =
        cleanItems.map(
          (item) => ({
            ...item,
            order_id:
              order.id
          })
        )

      const {
        data: insertedItems,
        error: itemsError
      } = await supabase
        .from('order_items')
        .insert(
          orderItemsPayload
        )
        .select()

      if (itemsError) {
        throw itemsError
      }

      // ========================================================
      // DESCONTAR INVENTARIO Y ESPERAR RESULTADO
      // ========================================================

      const inventoryResult =
        await applyInventoryForItems({
          items:
            insertedItems ||
            orderItemsPayload,

          orderId:
            order.id,

          cashSessionId:
            activeCash.id
        })

      inventoryApplied =
        inventoryResult.applied ||
        inventoryResult.already_applied

      // ========================================================
      // LEER PEDIDO COMPLETO
      // ========================================================

      const {
        data: completeOrder,
        error: completeOrderError
      } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items (*)
        `)
        .eq(
          'id',
          order.id
        )
        .single()

      if (completeOrderError) {
        throw completeOrderError
      }

      return res.status(201).json({
        success: true,

        message:
          'Pedido externo recibido e inventario descontado correctamente',

        order:
          completeOrder,

        cash_session_id:
          activeCash.id,

        inventory_applied:
          inventoryApplied,

        inventory_movements:
          inventoryResult
            .movements
            .length
      })
    } catch (error) {
      console.error(
        'Error recibiendo pedido externo:',
        error?.message ||
          error
      )

      /*
       * Si la venta no terminó correctamente,
       * se eliminan el pedido y sus ítems.
       */
      if (
        createdOrderId &&
        !inventoryApplied
      ) {
        await supabase
          .from('order_items')
          .delete()
          .eq(
            'order_id',
            createdOrderId
          )

        await supabase
          .from('orders')
          .delete()
          .eq(
            'id',
            createdOrderId
          )
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          'Error al recibir pedido externo'
      })
    }
  }
)

export default router
