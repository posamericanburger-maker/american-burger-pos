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

const roundNumber = (value, decimals = 2) => {
  const factor = 10 ** decimals

  return (
    Math.round((num(value) + Number.EPSILON) * factor) /
    factor
  )
}

const getSessionOpenDate = (session = {}) =>
  session.opened_at ||
  session.created_at ||
  null

const getSessionCloseDate = (session = {}) =>
  session.closed_at ||
  null

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

const normalizeInventorySummary = (
  summary,
  session = {}
) => {
  const source = summary || {}

  return {
    cash_session_id:
      source.cash_session_id ||
      session.id ||
      null,

    status:
      source.status ||
      session.status ||
      null,

    opened_at:
      source.opened_at ||
      getSessionOpenDate(session),

    closed_at:
      source.closed_at ||
      getSessionCloseDate(session),

    ingredients_count:
      num(source.ingredients_count),

    orders_count:
      num(source.orders_count),

    total_quantity_used:
      roundNumber(
        source.total_quantity_used,
        4
      ),

    inventory_cost:
      roundNumber(
        source.inventory_cost,
        2
      )
  }
}

const normalizeConsumption = (rows = []) =>
  (rows || []).map((row) => ({
    cash_session_id:
      row.cash_session_id,

    item_id:
      row.item_id,

    ingredient_name:
      row.ingredient_name ||
      row.name ||
      'Insumo sin nombre',

    name:
      row.ingredient_name ||
      row.name ||
      'Insumo sin nombre',

    unit:
      row.unit ||
      'unid.',

    orders_count:
      num(row.orders_count),

    quantity_used:
      roundNumber(
        row.quantity_used,
        4
      ),

    total_used:
      roundNumber(
        row.quantity_used,
        4
      ),

    total_cost:
      roundNumber(
        row.total_cost,
        2
      )
  }))

const getInventoryDataForSession = async (
  sessionId,
  session = {}
) => {
  const [
    summaryResult,
    consumptionResult
  ] = await Promise.all([
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
      })
  ])

  if (summaryResult.error) {
    throw summaryResult.error
  }

  if (consumptionResult.error) {
    throw consumptionResult.error
  }

  return {
    summary: normalizeInventorySummary(
      summaryResult.data,
      session
    ),

    consumption: normalizeConsumption(
      consumptionResult.data || []
    )
  }
}

const getOrdersSummaryForSession = async (
  sessionId
) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      total,
      total_amount,
      payment_method,
      status,
      created_at
    `)
    .eq('cash_session_id', sessionId)

  if (error) throw error

  const orders = data || []

  const validOrders = orders.filter(
    (order) =>
      ![
        'cancelled',
        'canceled',
        'anulado',
        'void'
      ].includes(
        String(order.status || '')
          .trim()
          .toLowerCase()
      )
  )

  const totalSales = validOrders.reduce(
    (sum, order) =>
      sum +
      num(
        order.total_amount ??
        order.total ??
        0
      ),
    0
  )

  const paymentTotals = validOrders.reduce(
    (result, order) => {
      const paymentMethod = String(
        order.payment_method || 'pending'
      )
        .trim()
        .toLowerCase()

      const amount = num(
        order.total_amount ??
        order.total ??
        0
      )

      if (
        ['cash', 'efectivo'].includes(
          paymentMethod
        )
      ) {
        result.cash += amount
      } else if (
        [
          'debit',
          'debito',
          'débito'
        ].includes(paymentMethod)
      ) {
        result.debit += amount
      } else if (
        [
          'credit',
          'credito',
          'crédito'
        ].includes(paymentMethod)
      ) {
        result.credit += amount
      } else if (
        [
          'transfer',
          'transferencia'
        ].includes(paymentMethod)
      ) {
        result.transfer += amount
      } else {
        result.pending += amount
      }

      return result
    },
    {
      cash: 0,
      debit: 0,
      credit: 0,
      transfer: 0,
      pending: 0
    }
  )

  return {
    orders_count: validOrders.length,

    total_sales:
      roundNumber(totalSales, 2),

    sales_cash:
      roundNumber(paymentTotals.cash, 2),

    sales_debit:
      roundNumber(paymentTotals.debit, 2),

    sales_credit:
      roundNumber(paymentTotals.credit, 2),

    sales_transfer:
      roundNumber(
        paymentTotals.transfer,
        2
      ),

    sales_pending:
      roundNumber(
        paymentTotals.pending,
        2
      )
  }
}

const getCashMovementsSummary = async (
  sessionId
) => {
  const { data, error } = await supabase
    .from('cash_movements')
    .select('*')
    .eq('cash_session_id', sessionId)

  if (error) throw error

  const movements = data || []

  const summary = movements.reduce(
    (result, movement) => {
      const type = String(
        movement.type || ''
      )
        .trim()
        .toLowerCase()

      const amount = num(
        movement.amount
      )

      if (
        [
          'income',
          'ingreso',
          'cash_in',
          'entrada'
        ].includes(type)
      ) {
        result.income += amount
      } else if (
        [
          'withdrawal',
          'withdrawals',
          'retiro',
          'cash_out'
        ].includes(type)
      ) {
        result.withdrawals += amount
      } else if (
        [
          'expense',
          'expenses',
          'gasto',
          'egreso'
        ].includes(type)
      ) {
        result.expenses += amount
      }

      return result
    },
    {
      income: 0,
      expenses: 0,
      withdrawals: 0
    }
  )

  return {
    movements_count:
      movements.length,

    income:
      roundNumber(summary.income, 2),

    expenses:
      roundNumber(summary.expenses, 2),

    withdrawals:
      roundNumber(
        summary.withdrawals,
        2
      )
  }
}

// ============================================================
// OBTENER CAJA ACTIVA
// ============================================================

router.get(
  '/active',
  verifyToken,
  async (req, res) => {
    try {
      const session =
        await getActiveCashSession()

      if (!session) {
        return res.json({
          success: true,
          is_open: false,
          session: null,
          inventory_summary: null,
          inventory_consumption: []
        })
      }

      const [
        inventoryData,
        ordersSummary,
        cashMovementsSummary
      ] = await Promise.all([
        getInventoryDataForSession(
          session.id,
          session
        ),

        getOrdersSummaryForSession(
          session.id
        ),

        getCashMovementsSummary(
          session.id
        )
      ])

      return res.json({
        success: true,
        is_open: true,
        session,
        orders_summary:
          ordersSummary,
        cash_movements_summary:
          cashMovementsSummary,
        inventory_summary:
          inventoryData.summary,
        inventory_consumption:
          inventoryData.consumption
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error al obtener la caja activa'
      })
    }
  }
)

// ============================================================
// LISTAR SESIONES
// ============================================================

router.get(
  '/sessions',
  verifyToken,
  async (req, res) => {
    try {
      const {
        status,
        limit = 100
      } = req.query

      let sessionsQuery = supabase
        .from('cash_sessions')
        .select('*')
        .order('created_at', {
          ascending: false
        })
        .limit(
          Math.min(
            Math.max(
              Number(limit || 100),
              1
            ),
            500
          )
        )

      if (status) {
        sessionsQuery =
          sessionsQuery.eq(
            'status',
            status
          )
      }

      const [
        sessionsResult,
        summariesResult
      ] = await Promise.all([
        sessionsQuery,

        supabase
          .from(
            'inventory_cash_session_summary'
          )
          .select('*')
      ])

      if (sessionsResult.error) {
        throw sessionsResult.error
      }

      if (summariesResult.error) {
        throw summariesResult.error
      }

      const summariesMap =
        new Map(
          (summariesResult.data || []).map(
            (summary) => [
              String(
                summary.cash_session_id
              ),
              summary
            ]
          )
        )

      const sessions =
        (sessionsResult.data || []).map(
          (session) => ({
            ...session,

            inventory_summary:
              normalizeInventorySummary(
                summariesMap.get(
                  String(session.id)
                ),
                session
              )
          })
        )

      return res.json({
        success: true,
        sessions
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error al obtener sesiones de caja'
      })
    }
  }
)

// ============================================================
// DETALLE COMPLETO DE UNA SESIÓN
// ============================================================

router.get(
  '/sessions/:sessionId',
  verifyToken,
  async (req, res) => {
    try {
      const { sessionId } = req.params

      const { data: session, error } =
        await supabase
          .from('cash_sessions')
          .select('*')
          .eq('id', sessionId)
          .maybeSingle()

      if (error) throw error

      if (!session) {
        return res.status(404).json({
          success: false,
          message:
            'La sesión de caja no existe'
        })
      }

      const [
        inventoryData,
        ordersSummary,
        cashMovementsSummary
      ] = await Promise.all([
        getInventoryDataForSession(
          session.id,
          session
        ),

        getOrdersSummaryForSession(
          session.id
        ),

        getCashMovementsSummary(
          session.id
        )
      ])

      return res.json({
        success: true,
        session,
        orders_summary:
          ordersSummary,
        cash_movements_summary:
          cashMovementsSummary,
        inventory_summary:
          inventoryData.summary,
        inventory_consumption:
          inventoryData.consumption
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error al obtener el detalle de caja'
      })
    }
  }
)

// ============================================================
// ABRIR CAJA
// ============================================================

router.post(
  '/open',
  verifyToken,
  verifyRole([
    'cajero',
    'admin'
  ]),
  async (req, res) => {
    try {
      const openingAmount = Math.max(
        0,
        num(
          req.body.opening_amount ??
          req.body.initial_amount ??
          0
        )
      )

      const existingOpen =
        await getActiveCashSession()

      if (existingOpen) {
        const inventoryData =
          await getInventoryDataForSession(
            existingOpen.id,
            existingOpen
          )

        return res.json({
          success: true,
          already_open: true,
          message:
            'Ya existe una caja abierta',
          session:
            existingOpen,
          inventory_summary:
            inventoryData.summary,
          inventory_consumption:
            inventoryData.consumption
        })
      }

      const openedAt =
        new Date().toISOString()

      const { data, error } =
        await supabase
          .from('cash_sessions')
          .insert({
            opening_amount:
              openingAmount,

            initial_amount:
              openingAmount,

            status:
              'open',

            opened_at:
              openedAt,

            opened_by:
              req.user?.id ||
              null
          })
          .select()
          .single()

      if (error) throw error

      return res.status(201).json({
        success: true,
        already_open: false,
        message:
          'Caja abierta correctamente',
        session: data,
        inventory_summary:
          normalizeInventorySummary(
            null,
            data
          ),
        inventory_consumption: []
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error al abrir caja'
      })
    }
  }
)

// ============================================================
// CERRAR CAJA
// ============================================================

router.post(
  '/close',
  verifyToken,
  verifyRole([
    'cajero',
    'admin'
  ]),
  async (req, res) => {
    try {
      const body = req.body || {}

      const closingAmount = Math.max(
        0,
        num(
          body.closing_amount ??
          body.final_amount ??
          body.real_cash ??
          0
        )
      )

      const session =
        await getActiveCashSession()

      if (!session) {
        return res.status(400).json({
          success: false,
          message:
            'No hay una caja abierta'
        })
      }

      /*
       * Antes de cerrar obtenemos los datos
       * completos de ventas, movimientos de caja
       * y consumo de inventario.
       */
      const [
        ordersSummary,
        cashMovementsSummary,
        inventoryDataBeforeClose
      ] = await Promise.all([
        getOrdersSummaryForSession(
          session.id
        ),

        getCashMovementsSummary(
          session.id
        ),

        getInventoryDataForSession(
          session.id,
          session
        )
      ])

      const openingAmount = num(
        session.opening_amount ??
        session.initial_amount ??
        0
      )

      const calculatedExpectedCash =
        openingAmount +
        ordersSummary.sales_cash +
        cashMovementsSummary.income -
        cashMovementsSummary.expenses -
        cashMovementsSummary.withdrawals

      const realCash =
        body.real_cash !== undefined
          ? num(body.real_cash)
          : closingAmount

      const calculatedDifference =
        realCash -
        calculatedExpectedCash

      const closedAt =
        new Date().toISOString()

      const updateData = {
        closing_amount:
          closingAmount,

        final_amount:
          closingAmount,

        status:
          'closed',

        closed_at:
          closedAt,

        closed_by:
          req.user?.id ||
          null
      }

      /*
       * Estos campos se guardan automáticamente
       * cuando existen en cash_sessions.
       */
      const calculatedFields = {
        sales_cash:
          ordersSummary.sales_cash,

        sales_debit:
          ordersSummary.sales_debit,

        sales_credit:
          ordersSummary.sales_credit,

        sales_transfer:
          ordersSummary.sales_transfer,

        total_sales:
          ordersSummary.total_sales,

        income:
          cashMovementsSummary.income,

        expenses:
          cashMovementsSummary.expenses,

        withdrawals:
          cashMovementsSummary.withdrawals,

        expected_cash:
          calculatedExpectedCash,

        expected_debit:
          ordersSummary.sales_debit,

        expected_credit:
          ordersSummary.sales_credit,

        expected_transfer:
          ordersSummary.sales_transfer,

        expected_total:
          ordersSummary.total_sales,

        real_cash:
          realCash,

        real_debit:
          num(
            body.real_debit ??
            ordersSummary.sales_debit
          ),

        real_credit:
          num(
            body.real_credit ??
            ordersSummary.sales_credit
          ),

        real_transfer:
          num(
            body.real_transfer ??
            ordersSummary.sales_transfer
          ),

        real_total:
          num(
            body.real_total ??
            (
              realCash +
              num(
                body.real_debit ??
                ordersSummary.sales_debit
              ) +
              num(
                body.real_credit ??
                ordersSummary.sales_credit
              ) +
              num(
                body.real_transfer ??
                ordersSummary.sales_transfer
              )
            )
          ),

        difference:
          calculatedDifference
      }

      /*
       * El frontend todavía puede enviar valores
       * manuales. En ese caso tienen prioridad.
       */
      Object.entries(
        calculatedFields
      ).forEach(
        ([field, calculatedValue]) => {
          updateData[field] =
            body[field] !== undefined
              ? num(body[field])
              : roundNumber(
                  calculatedValue,
                  2
                )
        }
      )

      /*
       * Primero intentamos guardar todos los campos.
       */
      let closeResult =
        await supabase
          .from('cash_sessions')
          .update(updateData)
          .eq('id', session.id)
          .select()
          .single()

      /*
       * Compatibilidad:
       * si la tabla antigua no tiene algún campo
       * opcional, cerramos usando solamente los
       * campos esenciales.
       */
      if (
        closeResult.error &&
        String(
          closeResult.error.message || ''
        ).toLowerCase().includes(
          'column'
        )
      ) {
        const essentialUpdate = {
          closing_amount:
            closingAmount,

          final_amount:
            closingAmount,

          status:
            'closed',

          closed_at:
            closedAt,

          closed_by:
            req.user?.id ||
            null
        }

        closeResult =
          await supabase
            .from('cash_sessions')
            .update(
              essentialUpdate
            )
            .eq('id', session.id)
            .select()
            .single()
      }

      if (closeResult.error) {
        throw closeResult.error
      }

      const closedSession =
        closeResult.data

      /*
       * Después del cierre volvemos a leer las
       * vistas para que su estado aparezca cerrado.
       */
      const inventoryDataAfterClose =
        await getInventoryDataForSession(
          session.id,
          closedSession
        )

      return res.json({
        success: true,

        message:
          'Caja cerrada correctamente',

        session:
          closedSession,

        orders_summary:
          ordersSummary,

        cash_movements_summary:
          cashMovementsSummary,

        inventory_summary:
          inventoryDataAfterClose.summary,

        inventory_consumption:
          inventoryDataAfterClose.consumption,

        closing_report: {
          cash_session_id:
            session.id,

          opened_at:
            getSessionOpenDate(
              session
            ),

          closed_at:
            closedAt,

          opening_amount:
            roundNumber(
              openingAmount,
              2
            ),

          closing_amount:
            roundNumber(
              closingAmount,
              2
            ),

          expected_cash:
            roundNumber(
              calculatedExpectedCash,
              2
            ),

          real_cash:
            roundNumber(
              realCash,
              2
            ),

          difference:
            roundNumber(
              calculatedDifference,
              2
            ),

          orders_count:
            ordersSummary.orders_count,

          total_sales:
            ordersSummary.total_sales,

          ingredients_count:
            inventoryDataBeforeClose
              .summary
              .ingredients_count,

          total_quantity_used:
            inventoryDataBeforeClose
              .summary
              .total_quantity_used,

          inventory_cost:
            inventoryDataBeforeClose
              .summary
              .inventory_cost
        }
      })
    } catch (error) {
      console.error(
        'Error cerrando caja:',
        error?.message || error
      )

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error al cerrar caja'
      })
    }
  }
)

// ============================================================
// OBTENER MOVIMIENTOS DE CAJA
// ============================================================

router.get(
  '/movements',
  verifyToken,
  async (req, res) => {
    try {
      const {
        session_id,
        type,
        limit = 500
      } = req.query

      let query = supabase
        .from('cash_movements')
        .select('*')
        .order('created_at', {
          ascending: false
        })
        .limit(
          Math.min(
            Math.max(
              Number(limit || 500),
              1
            ),
            2000
          )
        )

      if (session_id) {
        query = query.eq(
          'cash_session_id',
          session_id
        )
      }

      if (type) {
        query = query.eq(
          'type',
          type
        )
      }

      const { data, error } =
        await query

      if (error) throw error

      const movements =
        (data || []).map(
          (movement) => ({
            ...movement,
            amount:
              roundNumber(
                movement.amount,
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
          'Error al obtener movimientos de caja'
      })
    }
  }
)

// ============================================================
// REGISTRAR MOVIMIENTO DE CAJA
// ============================================================

const createCashMovement = async (
  req,
  res
) => {
  try {
    const {
      type = 'expense',
      description = '',
      reason = ''
    } = req.body || {}

    const amount = Math.max(
      0,
      num(req.body?.amount)
    )

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message:
          'El monto debe ser mayor a 0'
      })
    }

    const session =
      await getActiveCashSession()

    if (!session) {
      return res.status(400).json({
        success: false,
        message:
          'Debes abrir caja antes de registrar movimientos'
      })
    }

    const { data, error } =
      await supabase
        .from('cash_movements')
        .insert({
          cash_session_id:
            session.id,

          user_id:
            req.user?.id ||
            null,

          type:
            String(type || 'expense')
              .trim()
              .toLowerCase(),

          amount:
            roundNumber(
              amount,
              2
            ),

          description:
            String(
              description || ''
            ).trim(),

          reason:
            String(
              reason ||
              description ||
              ''
            ).trim() ||
            null
        })
        .select()
        .single()

    if (error) throw error

    return res.status(201).json({
      success: true,
      message:
        'Movimiento registrado correctamente',
      movement: data,
      session
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

router.post(
  '/movements',
  verifyToken,
  verifyRole([
    'cajero',
    'admin'
  ]),
  createCashMovement
)

router.post(
  '/movement',
  verifyToken,
  verifyRole([
    'cajero',
    'admin'
  ]),
  createCashMovement
)

export default router
