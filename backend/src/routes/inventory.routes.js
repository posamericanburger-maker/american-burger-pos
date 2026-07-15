import express from 'express'
import { supabase } from '../config/supabase.js'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()

// ============================================================
// UTILIDADES
// ============================================================

const num = (value) => {
  const result = Number(value || 0)
  return Number.isFinite(result) ? result : 0
}

const roundNumber = (value, decimals = 4) => {
  const factor = 10 ** decimals

  return (
    Math.round((num(value) + Number.EPSILON) * factor) /
    factor
  )
}

const positiveNumber = (value) => Math.max(0, num(value))

const getInventoryStock = (item = {}) =>
  num(
    item.current_stock ??
    item.stock ??
    item.quantity ??
    0
  )

const getInventoryMinimumStock = (item = {}) =>
  num(
    item.minimum_stock ??
    item.min_stock ??
    0
  )

const getInventoryCost = (item = {}) =>
  num(
    item.average_cost ??
    item.unit_cost ??
    item.last_purchase_price ??
    0
  )

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

const normalizeMovementType = (type = '') => {
  const cleanType = String(type || '')
    .trim()
    .toLowerCase()

  if (
    [
      'in',
      'entrada',
      'purchase',
      'compra'
    ].includes(cleanType)
  ) {
    return {
      type: 'in',
      source: 'manual_entry',
      direction: 'increase'
    }
  }

  if (
    [
      'out',
      'salida',
      'use',
      'uso'
    ].includes(cleanType)
  ) {
    return {
      type: 'out',
      source: 'manual_output',
      direction: 'decrease'
    }
  }

  if (
    [
      'waste',
      'merma',
      'loss',
      'perdida',
      'pérdida'
    ].includes(cleanType)
  ) {
    return {
      type: 'waste',
      source: 'waste',
      direction: 'decrease'
    }
  }

  if (
    [
      'adjustment',
      'ajuste'
    ].includes(cleanType)
  ) {
    return {
      type: 'adjustment',
      source: 'adjustment',
      direction: 'set'
    }
  }

  return {
    type: cleanType || 'adjustment',
    source: 'manual',
    direction: 'set'
  }
}

const formatConsumptionRows = (rows = []) =>
  (rows || []).map((row) => ({
    cash_session_id: row.cash_session_id,
    item_id: row.item_id,

    ingredient_name:
      row.ingredient_name ||
      row.name ||
      'Insumo sin nombre',

    name:
      row.ingredient_name ||
      row.name ||
      'Insumo sin nombre',

    unit: row.unit || 'unid.',

    orders_count: num(row.orders_count),

    quantity_used: roundNumber(
      row.quantity_used,
      4
    ),

    total_used: roundNumber(
      row.quantity_used,
      4
    ),

    total_cost: roundNumber(
      row.total_cost,
      2
    )
  }))

// ============================================================
// CAJA ACTIVA
// ============================================================

router.get(
  '/cash-session/active',
  verifyToken,
  async (req, res) => {
    try {
      const session = await getActiveCashSession()

      if (!session) {
        return res.json({
          success: true,
          is_open: false,
          session: null,
          summary: null,
          consumption: []
        })
      }

      const [
        summaryResult,
        consumptionResult
      ] = await Promise.all([
        supabase
          .from('inventory_cash_session_summary')
          .select('*')
          .eq('cash_session_id', session.id)
          .maybeSingle(),

        supabase
          .from('inventory_consumption_by_cash_session')
          .select('*')
          .eq('cash_session_id', session.id)
          .order('total_cost', {
            ascending: false
          })
      ])

      if (summaryResult.error) {
        throw summaryResult.error
      }

      if (consumptionResult.error) {
        throw consumptionResult.error
      }

      const summary = summaryResult.data || {
        cash_session_id: session.id,
        status: session.status,
        opened_at: session.opened_at,
        closed_at: session.closed_at,
        ingredients_count: 0,
        orders_count: 0,
        total_quantity_used: 0,
        inventory_cost: 0
      }

      return res.json({
        success: true,
        is_open: true,
        session,
        summary: {
          ...summary,

          ingredients_count: num(
            summary.ingredients_count
          ),

          orders_count: num(
            summary.orders_count
          ),

          total_quantity_used: roundNumber(
            summary.total_quantity_used,
            4
          ),

          inventory_cost: roundNumber(
            summary.inventory_cost,
            2
          )
        },

        consumption: formatConsumptionRows(
          consumptionResult.data || []
        )
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error al obtener el consumo de la caja activa'
      })
    }
  }
)

// ============================================================
// RESUMEN DE TODAS LAS CAJAS
// ============================================================

router.get(
  '/cash-sessions/summary',
  verifyToken,
  async (req, res) => {
    try {
      const {
        status,
        limit = 100
      } = req.query

      let query = supabase
        .from('inventory_cash_session_summary')
        .select('*')
        .order('opened_at', {
          ascending: false
        })
        .limit(
          Math.min(
            Math.max(Number(limit || 100), 1),
            500
          )
        )

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error

      const summaries = (data || []).map(
        (summary) => ({
          ...summary,

          ingredients_count: num(
            summary.ingredients_count
          ),

          orders_count: num(
            summary.orders_count
          ),

          total_quantity_used: roundNumber(
            summary.total_quantity_used,
            4
          ),

          inventory_cost: roundNumber(
            summary.inventory_cost,
            2
          )
        })
      )

      return res.json({
        success: true,
        summaries,
        sessions: summaries
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error al obtener el historial de consumo por caja'
      })
    }
  }
)

// ============================================================
// CONSUMO DE UNA CAJA ESPECÍFICA
// ============================================================

router.get(
  '/cash-session/:sessionId/consumption',
  verifyToken,
  async (req, res) => {
    try {
      const { sessionId } = req.params

      const [
        sessionResult,
        summaryResult,
        consumptionResult,
        movementsResult
      ] = await Promise.all([
        supabase
          .from('cash_sessions')
          .select('*')
          .eq('id', sessionId)
          .maybeSingle(),

        supabase
          .from('inventory_cash_session_summary')
          .select('*')
          .eq('cash_session_id', sessionId)
          .maybeSingle(),

        supabase
          .from('inventory_consumption_by_cash_session')
          .select('*')
          .eq('cash_session_id', sessionId)
          .order('total_cost', {
            ascending: false
          }),

        supabase
          .from('inventory_movements')
          .select(`
            *,
            inventory:item_id (
              id,
              name,
              unit
            )
          `)
          .eq('cash_session_id', sessionId)
          .order('created_at', {
            ascending: false
          })
      ])

      if (sessionResult.error) {
        throw sessionResult.error
      }

      if (!sessionResult.data) {
        return res.status(404).json({
          success: false,
          message: 'La sesión de caja no existe'
        })
      }

      if (summaryResult.error) {
        throw summaryResult.error
      }

      if (consumptionResult.error) {
        throw consumptionResult.error
      }

      if (movementsResult.error) {
        throw movementsResult.error
      }

      const summary = summaryResult.data || {
        cash_session_id: sessionId,
        status: sessionResult.data.status,
        opened_at: sessionResult.data.opened_at,
        closed_at: sessionResult.data.closed_at,
        ingredients_count: 0,
        orders_count: 0,
        total_quantity_used: 0,
        inventory_cost: 0
      }

      return res.json({
        success: true,

        session: sessionResult.data,

        summary: {
          ...summary,

          ingredients_count: num(
            summary.ingredients_count
          ),

          orders_count: num(
            summary.orders_count
          ),

          total_quantity_used: roundNumber(
            summary.total_quantity_used,
            4
          ),

          inventory_cost: roundNumber(
            summary.inventory_cost,
            2
          )
        },

        consumption: formatConsumptionRows(
          consumptionResult.data || []
        ),

        movements: (movementsResult.data || []).map(
          (movement) => ({
            ...movement,

            quantity: roundNumber(
              movement.quantity,
              4
            ),

            previous_stock: roundNumber(
              movement.previous_stock,
              4
            ),

            new_stock: roundNumber(
              movement.new_stock,
              4
            ),

            unit_cost: roundNumber(
              movement.unit_cost,
              4
            ),

            total_cost: roundNumber(
              movement.total_cost,
              2
            )
          })
        )
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error al obtener el consumo de la sesión de caja'
      })
    }
  }
)

// ============================================================
// LISTAR INVENTARIO
// ============================================================

router.get(
  '/',
  verifyToken,
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('active', true)
        .order('name', {
          ascending: true
        })

      if (error) throw error

      const inventory = (data || []).map(
        (item) => ({
          ...item,

          stock: roundNumber(
            getInventoryStock(item),
            4
          ),

          current_stock: roundNumber(
            getInventoryStock(item),
            4
          ),

          min_stock: roundNumber(
            getInventoryMinimumStock(item),
            4
          ),

          minimum_stock: roundNumber(
            getInventoryMinimumStock(item),
            4
          ),

          unit_cost: roundNumber(
            item.unit_cost,
            4
          ),

          average_cost: roundNumber(
            item.average_cost,
            4
          ),

          last_purchase_price: roundNumber(
            item.last_purchase_price,
            4
          )
        })
      )

      return res.json({
        success: true,
        inventory,
        items: inventory
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error al obtener inventario'
      })
    }
  }
)

// ============================================================
// CREAR INSUMO
// ============================================================

router.post(
  '/',
  verifyToken,
  verifyRole(['admin']),
  async (req, res) => {
    try {
      const {
        name,

        stock = 0,
        current_stock = stock,

        min_stock = 0,
        minimum_stock = min_stock,

        unit = 'unid.',

        unit_cost = 0,
        last_purchase_price = unit_cost,
        average_cost = unit_cost,

        supplier_name = ''
      } = req.body

      if (!name || !String(name).trim()) {
        return res.status(400).json({
          success: false,
          message:
            'El nombre del insumo es obligatorio'
        })
      }

      const normalizedStock = positiveNumber(
        current_stock ?? stock
      )

      const normalizedMinimum = positiveNumber(
        minimum_stock ?? min_stock
      )

      const normalizedUnitCost = positiveNumber(
        unit_cost
      )

      const normalizedAverageCost = positiveNumber(
        average_cost || normalizedUnitCost
      )

      const normalizedLastPrice = positiveNumber(
        last_purchase_price || normalizedUnitCost
      )

      const { data, error } = await supabase
        .from('inventory')
        .insert({
          name: String(name).trim(),

          stock: normalizedStock,
          current_stock: normalizedStock,

          min_stock: normalizedMinimum,
          minimum_stock: normalizedMinimum,

          unit:
            String(unit || 'unid.').trim(),

          unit_cost: normalizedUnitCost,

          last_purchase_price:
            normalizedLastPrice,

          average_cost:
            normalizedAverageCost,

          supplier_name:
            String(supplier_name || '').trim(),

          active: true
        })
        .select()
        .single()

      if (error) throw error

      return res.status(201).json({
        success: true,
        message: 'Insumo creado correctamente',
        item: data
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error al crear insumo'
      })
    }
  }
)

// ============================================================
// EDITAR INSUMO
// ============================================================

router.put(
  '/:id',
  verifyToken,
  verifyRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params

      const {
        name,

        stock = 0,
        current_stock = stock,

        min_stock = 0,
        minimum_stock = min_stock,

        unit = 'unid.',

        unit_cost = 0,
        last_purchase_price = unit_cost,
        average_cost = unit_cost,

        supplier_name = ''
      } = req.body

      if (!name || !String(name).trim()) {
        return res.status(400).json({
          success: false,
          message:
            'El nombre del insumo es obligatorio'
        })
      }

      const normalizedStock = positiveNumber(
        current_stock ?? stock
      )

      const normalizedMinimum = positiveNumber(
        minimum_stock ?? min_stock
      )

      const normalizedUnitCost = positiveNumber(
        unit_cost
      )

      const normalizedAverageCost = positiveNumber(
        average_cost || normalizedUnitCost
      )

      const normalizedLastPrice = positiveNumber(
        last_purchase_price || normalizedUnitCost
      )

      const { data, error } = await supabase
        .from('inventory')
        .update({
          name: String(name).trim(),

          stock: normalizedStock,
          current_stock: normalizedStock,

          min_stock: normalizedMinimum,
          minimum_stock: normalizedMinimum,

          unit:
            String(unit || 'unid.').trim(),

          unit_cost:
            normalizedUnitCost,

          last_purchase_price:
            normalizedLastPrice,

          average_cost:
            normalizedAverageCost,

          supplier_name:
            String(supplier_name || '').trim(),

          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return res.json({
        success: true,
        message:
          'Insumo actualizado correctamente',
        item: data
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error al actualizar insumo'
      })
    }
  }
)

// ============================================================
// ELIMINAR INSUMO
// ============================================================

router.delete(
  '/:id',
  verifyToken,
  verifyRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params

      const { error } = await supabase
        .from('inventory')
        .update({
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      return res.json({
        success: true,
        message:
          'Insumo eliminado correctamente'
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error al eliminar insumo'
      })
    }
  }
)

// ============================================================
// REGISTRAR MOVIMIENTO MANUAL
// ============================================================

router.post(
  '/movement',
  verifyToken,
  verifyRole(['admin']),
  async (req, res) => {
    try {
      const {
        item_id,
        type,
        description = '',
        unit_cost
      } = req.body

      const quantity = positiveNumber(
        req.body.quantity
      )

      if (!item_id) {
        return res.status(400).json({
          success: false,
          message:
            'Debes seleccionar un insumo'
        })
      }

      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message:
            'La cantidad debe ser mayor a 0'
        })
      }

      const normalizedType =
        normalizeMovementType(type)

      const { data: item, error: itemError } =
        await supabase
          .from('inventory')
          .select('*')
          .eq('id', item_id)
          .single()

      if (itemError) throw itemError

      if (!item) {
        return res.status(404).json({
          success: false,
          message:
            'El insumo seleccionado no existe'
        })
      }

      const activeCash =
        await getActiveCashSession()

      const currentStock = roundNumber(
        getInventoryStock(item),
        4
      )

      let newStock = currentStock

      if (
        normalizedType.direction === 'increase'
      ) {
        newStock = currentStock + quantity
      }

      if (
        normalizedType.direction === 'decrease'
      ) {
        newStock = currentStock - quantity
      }

      if (
        normalizedType.direction === 'set'
      ) {
        newStock = quantity
      }

      newStock = roundNumber(
        Math.max(0, newStock),
        4
      )

      const movementUnitCost =
        unit_cost !== undefined &&
        unit_cost !== ''
          ? positiveNumber(unit_cost)
          : getInventoryCost(item)

      const now = new Date().toISOString()

      const movementQuantity =
        normalizedType.direction === 'set'
          ? Math.abs(newStock - currentStock)
          : quantity

      const totalCost = roundNumber(
        movementQuantity *
        movementUnitCost,
        4
      )

      const movementPayload = {
        item_id,

        cash_session_id:
          activeCash?.id || null,

        user_id:
          req.user?.id || null,

        type:
          normalizedType.type,

        movement_source:
          normalizedType.source,

        quantity:
          roundNumber(
            movementQuantity,
            4
          ),

        previous_stock:
          currentStock,

        new_stock:
          newStock,

        unit_cost:
          movementUnitCost,

        total_cost:
          totalCost,

        description:
          String(description || '').trim(),

        created_at:
          now,

        updated_at:
          now
      }

      const {
        data: createdMovement,
        error: movementError
      } = await supabase
        .from('inventory_movements')
        .insert(movementPayload)
        .select()
        .single()

      if (movementError) {
        throw movementError
      }

      const updatePayload = {
        stock: newStock,
        current_stock: newStock,
        updated_at: now
      }

      if (
        normalizedType.source ===
          'manual_entry' &&
        movementUnitCost > 0
      ) {
        const oldAverageCost = getInventoryCost(
          item
        )

        const previousInventoryValue =
          currentStock * oldAverageCost

        const purchaseValue =
          quantity * movementUnitCost

        const averageCost =
          newStock > 0
            ? (
                previousInventoryValue +
                purchaseValue
              ) / newStock
            : movementUnitCost

        updatePayload.unit_cost =
          movementUnitCost

        updatePayload.last_purchase_price =
          movementUnitCost

        updatePayload.average_cost =
          roundNumber(
            averageCost,
            4
          )
      }

      const {
        data: updatedItem,
        error: updateError
      } = await supabase
        .from('inventory')
        .update(updatePayload)
        .eq('id', item_id)
        .select()
        .single()

      if (updateError) {
        /*
         * Si no pudo actualizar el inventario,
         * se elimina el movimiento recién creado
         * para evitar una inconsistencia.
         */
        await supabase
          .from('inventory_movements')
          .delete()
          .eq('id', createdMovement.id)

        throw updateError
      }

      return res.json({
        success: true,

        message:
          'Movimiento registrado correctamente',

        item: updatedItem,

        movement: createdMovement,

        cash_session_id:
          activeCash?.id || null
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error al registrar movimiento'
      })
    }
  }
)

// ============================================================
// HISTORIAL DE MOVIMIENTOS
// ============================================================

router.get(
  '/movements',
  verifyToken,
  async (req, res) => {
    try {
      const {
        session_id,
        item_id,
        source,
        type,
        limit = 500
      } = req.query

      let query = supabase
        .from('inventory_movements')
        .select(`
          *,
          inventory:item_id (
            id,
            name,
            unit
          )
        `)
        .order('created_at', {
          ascending: false
        })
        .limit(
          Math.min(
            Math.max(Number(limit || 500), 1),
            2000
          )
        )

      if (session_id) {
        query = query.eq(
          'cash_session_id',
          session_id
        )
      }

      if (item_id) {
        query = query.eq(
          'item_id',
          item_id
        )
      }

      if (source) {
        query = query.eq(
          'movement_source',
          source
        )
      }

      if (type) {
        query = query.eq(
          'type',
          type
        )
      }

      const { data, error } = await query

      if (error) throw error

      const movements = (data || []).map(
        (movement) => ({
          ...movement,

          quantity: roundNumber(
            movement.quantity,
            4
          ),

          previous_stock: roundNumber(
            movement.previous_stock,
            4
          ),

          new_stock: roundNumber(
            movement.new_stock,
            4
          ),

          unit_cost: roundNumber(
            movement.unit_cost,
            4
          ),

          total_cost: roundNumber(
            movement.total_cost,
            2
          )
        })
      )

      return res.json({
        success: true,
        movements
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error al obtener movimientos'
      })
    }
  }
)

// ============================================================
// ALERTAS DE STOCK
// ============================================================

router.get(
  '/alerts',
  verifyToken,
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('active', true)
        .order('name', {
          ascending: true
        })

      if (error) throw error

      const alerts = (data || [])
        .filter((item) => {
          const stock =
            getInventoryStock(item)

          const minimumStock =
            getInventoryMinimumStock(item)

          return stock <= minimumStock
        })
        .map((item) => ({
          ...item,

          stock: roundNumber(
            getInventoryStock(item),
            4
          ),

          current_stock: roundNumber(
            getInventoryStock(item),
            4
          ),

          min_stock: roundNumber(
            getInventoryMinimumStock(item),
            4
          ),

          minimum_stock: roundNumber(
            getInventoryMinimumStock(item),
            4
          )
        }))

      return res.json({
        success: true,
        alerts
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error al obtener alertas'
      })
    }
  }
)

export default router
