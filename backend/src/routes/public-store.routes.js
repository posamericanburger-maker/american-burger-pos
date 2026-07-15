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

const getInventoryCost = (inventoryItem = {}) =>
  num(
    inventoryItem.average_cost ??
      inventoryItem.unit_cost ??
      inventoryItem.last_purchase_price ??
      0
  )

// ============================================================
// CAJA ABIERTA
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

  if (error) {
    throw error
  }

  return data || null
}

// ============================================================
// NORMALIZAR ÍTEMS
// ============================================================

const normalizeOrderItem = (
  item,
  orderId = null
) => {
  const productName =
    item.name ||
    item.product_name ||
    item.name_snapshot ||
    'Producto web'

  const categoryName =
    item.category_name ||
    item.category?.name ||
    'Tienda web'

  const quantity = Math.max(
    1,
    num(item.quantity || 1)
  )

  const unitPrice = num(
    item.unit_price ??
      item.price ??
      0
  )

  const itemSubtotal = num(
    item.subtotal ||
      unitPrice * quantity
  )

  return {
    ...(orderId
      ? {
          order_id: orderId
        }
      : {}),

    product_id:
      item.product_id ||
      item.id ||
      null,

    name: productName,
    product_name: productName,
    name_snapshot: productName,

    category_name: categoryName,

    quantity,

    unit_price: unitPrice,
    price: unitPrice,

    subtotal: itemSubtotal,

    sold_at:
      item.sold_at ||
      new Date().toISOString()
  }
}

// ============================================================
// VERIFICAR SI EL PEDIDO YA DESCONTÓ INVENTARIO
// ============================================================

const hasInventoryAlreadyApplied = async (
  orderId
) => {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('id')
    .eq('order_id', orderId)
    .in('movement_source', [
      'web_sale_discount',
      'sale_discount'
    ])
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return Boolean(data)
}

// ============================================================
// DESCONTAR O RESTAURAR INVENTARIO
// ============================================================

const applyInventoryForItems = async ({
  items = [],
  action = 'discount',
  orderId,
  cashSessionId
}) => {
  const isRestore =
    action === 'restore'

  if (!orderId) {
    throw new Error(
      'No se recibió el ID del pedido para actualizar inventario'
    )
  }

  /*
   * Evita descontar dos veces el mismo pedido web.
   */
  if (!isRestore) {
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
  }

  const registeredMovements = []

  for (const item of items) {
    const productId =
      item.product_id

    if (!productId) {
      continue
    }

    const {
      data: recipeItems,
      error: recipeError
    } = await supabase
      .from('product_recipes')
      .select('*')
      .eq('product_id', productId)

    if (recipeError) {
      throw recipeError
    }

    if (
      !Array.isArray(recipeItems) ||
      recipeItems.length === 0
    ) {
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
        .eq('id', inventoryItemId)
        .single()

      if (inventoryError) {
        throw inventoryError
      }

      if (!inventoryItem) {
        continue
      }

      const currentStock =
        roundNumber(
          inventoryItem.current_stock ??
            inventoryItem.stock ??
            0,
          4
        )

      const calculatedStock =
        isRestore
          ? currentStock +
            quantityToMove
          : currentStock -
            quantityToMove

      const newStock =
        roundNumber(
          Math.max(
            0,
            calculatedStock
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

      // ========================================================
      // ACTUALIZAR STOCK
      // ========================================================

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

      const movementSource =
        isRestore
          ? 'web_sale_restore'
          : 'web_sale_discount'

      /*
       * Se usan solamente "in" y "out" en type
       * para respetar el check constraint actual.
       */
      const movementType =
        isRestore
          ? 'in'
          : 'out'

      const orderLabel =
        String(orderId).slice(0, 8)

      const description =
        isRestore
          ? `Devolución automática por pedido web ${orderLabel}`
          : `Descuento automático por pedido web ${orderLabel}`

      const movementPayload = {
        item_id:
          inventoryItemId,

        cash_session_id:
          cashSessionId ||
          null,

        order_id:
          orderId,

        product_id:
          productId,

        order_item_id:
          item.id ||
          null,

        /*
         * Se mantiene null para evitar el error
         * inventory_movements_user_id_fkey.
         */
        user_id:
          null,

        type:
          movementType,

        movement_source:
          movementSource,

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

        description,

        created_at:
          now,

        updated_at:
          now
      }

      const {
        data: movement,
        error: movementError
      } = await supabase
        .from('inventory_movements')
        .insert(
          movementPayload
        )
        .select()
        .single()

      if (movementError) {
        /*
         * Si falla el registro del movimiento,
         * restauramos inmediatamente el stock.
         */
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
}

// ============================================================
// HEALTH
// ============================================================

router.get(
  '/health',
  (req, res) => {
    return res.json({
      status: 'OK',
      module: 'public-store',
      timestamp:
        new Date().toISOString()
    })
  }
)

// ============================================================
// PRODUCTOS DE LA TIENDA
// ============================================================

router.get(
  '/products',
  async (req, res) => {
    try {
      const {
        data,
        error
      } = await supabase
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
        .order('name', {
          ascending: true
        })

      if (error) {
        throw error
      }

      const products =
        (data || []).map(
          (product) => ({
            id:
              product.id,

            name:
              product.name,

            description:
              product.description ||
              '',

            price:
              num(product.price),

            image_url:
              product.image_url ||
              '',

            category_id:
              product.category_id ||
              null,

            category_name:
              product.categories
                ?.name ||
              'Productos',

            available:
              true
          })
        )

      return res.json({
        success: true,
        products
      })
    } catch (error) {
      return res.status(500).json({
        success: false,

        message:
          error.message ||
          'Error al obtener productos de tienda'
      })
    }
  }
)

// ============================================================
// CONSULTAR ESTADO DE PEDIDO
// ============================================================

router.get(
  '/orders/:id/status',
  async (req, res) => {
    try {
      const { id } =
        req.params

      const {
        data: order,
        error
      } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          number,
          cash_session_id,
          status,
          type,
          order_type,
          payment_method,
          subtotal,
          delivery_fee,
          total,
          total_amount,
          customer_name,
          customer_phone,
          customer_address,
          notes,
          created_at,
          updated_at,
          items:order_items (*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        throw error
      }

      return res.json({
        success: true,
        order
      })
    } catch {
      return res.status(404).json({
        success: false,
        message:
          'Pedido no encontrado'
      })
    }
  }
)

// ============================================================
// CREAR PEDIDO WEB
// ============================================================

router.post(
  '/orders',
  async (req, res) => {
    let createdOrderId = null
    let inventoryApplied = false

    try {
      /*
       * Aplicamos la misma regla que el POS:
       * no se puede registrar una venta si
       * no existe una caja abierta.
       */
      const activeCash =
        await getActiveCashSession()

      if (!activeCash) {
        return res.status(400).json({
          success: false,

          message:
            'American Burger no está recibiendo pedidos en este momento porque la caja está cerrada'
        })
      }

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

      if (
        !customer_name ||
        !cleanPhone(
          customer_phone
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            'Nombre y teléfono del cliente son obligatorios'
        })
      }

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            'El pedido debe tener productos'
        })
      }

      const cleanCustomerPhone =
        cleanPhone(
          customer_phone
        )

      // ========================================================
      // GUARDAR CLIENTE
      // ========================================================

      const {
        error: customerError
      } = await supabase
        .from('customers')
        .upsert(
          {
            name:
              String(
                customer_name
              ).trim(),

            phone:
              cleanCustomerPhone,

            address:
              customer_address ||
              '',

            reference:
              '',

            updated_at:
              new Date().toISOString()
          },
          {
            onConflict:
              'phone'
          }
        )

      if (customerError) {
        console.error(
          'No se pudo actualizar cliente web:',
          customerError.message
        )
      }

      const cleanItems =
        items.map((item) =>
          normalizeOrderItem(
            item
          )
        )

      const calculatedSubtotal =
        cleanItems.reduce(
          (sum, item) =>
            sum +
            num(
              item.subtotal
            ),
          0
        )

      const orderSubtotal =
        num(
          subtotal ||
            calculatedSubtotal
        )

      const orderDeliveryFee =
        num(
          delivery_fee
        )

      const orderTotal =
        num(
          total ||
            orderSubtotal +
              orderDeliveryFee
        )

      const normalizedDeliveryType =
        String(
          delivery_type ||
            'pickup'
        )
          .trim()
          .toLowerCase()

      const isDelivery =
        normalizedDeliveryType ===
        'delivery'

      // ========================================================
      // CREAR PEDIDO ASOCIADO A CAJA
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
            isDelivery
              ? 'delivery'
              : 'counter',

          order_type:
            isDelivery
              ? 'delivery'
              : 'pickup',

          /*
           * Se mantiene pendiente para que siga
           * apareciendo en el POS y pueda aceptarse.
           */
          status:
            'pending',

          payment_method:
            payment_method ||
            'pending',

          subtotal:
            orderSubtotal,

          delivery_fee:
            orderDeliveryFee,

          total:
            orderTotal,

          total_amount:
            orderTotal,

          customer_name:
            String(
              customer_name
            ).trim(),

          customer_phone:
            cleanCustomerPhone,

          customer_address:
            customer_address ||
            null,

          notes:
            notes
              ? `[WEB] ${String(
                  notes
                ).trim()}`
              : '[WEB]',

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
      // INSERTAR PRODUCTOS
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
        data: insertedOrderItems,
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
            insertedOrderItems ||
            orderItemsPayload,

          action:
            'discount',

          orderId:
            order.id,

          cashSessionId:
            activeCash.id
        })

      inventoryApplied =
        inventoryResult.applied ||
        inventoryResult.already_applied

      // ========================================================
      // DEVOLVER PEDIDO COMPLETO
      // ========================================================

      const {
        data: completeOrder,
        error:
          completeOrderError
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
          'Pedido web creado e inventario descontado correctamente',

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
        'Error creando pedido web:',
        error?.message ||
          error
      )

      /*
       * Si alcanzó a crear el pedido, pero el
       * inventario todavía no fue aplicado,
       * eliminamos pedido e ítems para evitar
       * una venta incompleta.
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
          'Error al crear pedido web y descontar inventario'
      })
    }
  }
)

export default router
