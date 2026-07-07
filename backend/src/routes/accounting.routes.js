import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

const num = (value) => Number(value || 0)

const getMonthRange = (query = {}) => {
  const now = new Date()
  const year = Number(query.year || now.getFullYear())
  const month = Number(query.month || now.getMonth() + 1)

  const from = new Date(year, month - 1, 1)
  const to = new Date(year, month, 0)

  return {
    year,
    month,
    fromDate: from.toISOString().slice(0, 10),
    toDate: to.toISOString().slice(0, 10),
    fromISO: from.toISOString(),
    toISO: new Date(year, month, 0, 23, 59, 59).toISOString()
  }
}

const ivaFromGross = (gross) => Math.round(num(gross) * 19 / 119)
const netFromGross = (gross) => num(gross) - ivaFromGross(gross)

const isExpenseMovement = (movement) => {
  const type = String(movement.type || '').toLowerCase()
  return ['expense', 'gasto', 'withdrawal', 'retiro'].includes(type)
}

const normalizeExpense = (movement) => {
  const gross = num(
    movement.total_amount ||
    movement.amount ||
    movement.monto ||
    0
  )

  const documentType = String(
    movement.document_type ||
    movement.documentType ||
    'BOLETA'
  ).toUpperCase()

  const hasInvoice = documentType === 'FACTURA'

  const iva = movement.iva_amount !== null && movement.iva_amount !== undefined
    ? num(movement.iva_amount)
    : hasInvoice
      ? ivaFromGross(gross)
      : 0

  const net = movement.net_amount !== null && movement.net_amount !== undefined
    ? num(movement.net_amount)
    : gross - iva

  return {
    id: movement.id,
    source: 'cash_movements',
    cash_session_id: movement.cash_session_id,
    user_id: movement.user_id,
    type: movement.type,
    supplier_id: movement.supplier_id || null,
    supplier_name: movement.supplier_name || movement.provider_name || '',
    document_type: documentType,
    document_number: movement.document_number || movement.invoice_number || '',
    description: movement.description || movement.reason || '',
    category: movement.category || 'Caja',
    payment_method: movement.payment_method || 'cash',
    expense_date: String(movement.created_at || '').slice(0, 10),
    created_at: movement.created_at,
    net_amount: net,
    iva_amount: iva,
    total_amount: gross,
    notes: movement.notes || movement.reason || ''
  }
}

const loadMonthlyData = async (query = {}) => {
  const range = getMonthRange(query)

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', range.fromISO)
    .lte('created_at', range.toISO)

  if (ordersError) throw ordersError

  const { data: movements, error: movementsError } = await supabase
    .from('cash_movements')
    .select('*')
    .gte('created_at', range.fromISO)
    .lte('created_at', range.toISO)
    .order('created_at', { ascending: false })

  if (movementsError) throw movementsError

  const expenses = (movements || [])
    .filter(isExpenseMovement)
    .map(normalizeExpense)

  return {
    range,
    orders: orders || [],
    movements: movements || [],
    expenses
  }
}

router.get('/dashboard', async (req, res) => {
  try {
    const { range, orders, expenses } = await loadMonthlyData(req.query)

    const totalSales = orders.reduce((sum, order) => {
      return sum + num(order.total || order.total_amount || order.amount)
    }, 0)

    const totalExpenses = expenses.reduce((sum, item) => {
      return sum + num(item.total_amount)
    }, 0)

    const ivaDebit = ivaFromGross(totalSales)
    const netSales = netFromGross(totalSales)

    const ivaCredit = expenses.reduce((sum, item) => {
      return sum + num(item.iva_amount)
    }, 0)

    const netExpenses = totalExpenses - ivaCredit
    const ivaToPay = ivaDebit - ivaCredit
    const estimatedProfit = netSales - netExpenses

    const salesByPayment = {}

    orders.forEach((order) => {
      const method = order.payment_method || order.paymentMethod || 'Sin método'
      const amount = num(order.total || order.total_amount || order.amount)
      salesByPayment[method] = (salesByPayment[method] || 0) + amount
    })

    const expensesByCategory = {}
    const expensesBySupplier = {}

    expenses.forEach((expense) => {
      const category = expense.category || 'Sin categoría'
      const supplier = expense.supplier_name || 'Sin proveedor'

      expensesByCategory[category] =
        (expensesByCategory[category] || 0) + num(expense.total_amount)

      expensesBySupplier[supplier] =
        (expensesBySupplier[supplier] || 0) + num(expense.total_amount)
    })

    const alerts = []

    if (ivaToPay > 0) {
      alerts.push({
        type: 'IVA',
        level: 'warning',
        title: 'IVA estimado a pagar',
        message: `Según ventas y gastos de Caja, el IVA estimado a pagar es $${ivaToPay.toLocaleString('es-CL')}.`
      })
    }

    if (expenses.length === 0) {
      alerts.push({
        type: 'GASTOS',
        level: 'info',
        title: 'Sin gastos registrados en Caja',
        message: 'Este mes no tienes gastos registrados en el módulo Caja.'
      })
    }

    if (totalSales > 0 && estimatedProfit <= 0) {
      alerts.push({
        type: 'UTILIDAD',
        level: 'danger',
        title: 'Utilidad baja o negativa',
        message: 'Las ventas del mes no están cubriendo los gastos registrados en Caja.'
      })
    }

    res.json({
      period: {
        year: range.year,
        month: range.month,
        from: range.fromDate,
        to: range.toDate
      },
      sales: {
        gross: totalSales,
        net: netSales,
        iva_debit: ivaDebit,
        orders_count: orders.length,
        by_payment_method: salesByPayment
      },
      expenses: {
        gross: totalExpenses,
        net: netExpenses,
        iva_credit: ivaCredit,
        count: expenses.length,
        by_category: expensesByCategory,
        by_supplier: expensesBySupplier
      },
      taxes: {
        iva_debit: ivaDebit,
        iva_credit: ivaCredit,
        iva_to_pay: ivaToPay
      },
      result: {
        gross_profit_estimated: estimatedProfit,
        margin_percent: totalSales > 0
          ? Number(((estimatedProfit / totalSales) * 100).toFixed(2))
          : 0
      },
      alerts
    })
  } catch (error) {
    console.error('Accounting dashboard error:', error)
    res.status(500).json({
      message: 'Error generando dashboard contable conectado a Caja',
      error: error.message
    })
  }
})

router.get('/expenses', async (req, res) => {
  try {
    const { from, to } = req.query

    let query = supabase
      .from('cash_movements')
      .select('*')
      .order('created_at', { ascending: false })

    if (from) query = query.gte('created_at', `${from}T00:00:00.000Z`)
    if (to) query = query.lte('created_at', `${to}T23:59:59.999Z`)

    const { data, error } = await query

    if (error) throw error

    const expenses = (data || [])
      .filter(isExpenseMovement)
      .map(normalizeExpense)

    res.json(expenses)
  } catch (error) {
    console.error('Accounting expenses list error:', error)
    res.status(500).json({
      message: 'Error cargando gastos desde Caja',
      error: error.message
    })
  }
})

router.get('/expenses/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cash_movements')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) throw error

    res.json(normalizeExpense(data))
  } catch (error) {
    console.error('Accounting expense detail error:', error)
    res.status(500).json({
      message: 'Error cargando detalle del gasto desde Caja',
      error: error.message
    })
  }
})

router.post('/expenses', async (req, res) => {
  res.status(405).json({
    message: 'Los gastos ahora se registran desde el módulo Caja. Contabilidad solo analiza los gastos de Caja.'
  })
})

router.put('/expenses/:id', async (req, res) => {
  res.status(405).json({
    message: 'Los gastos se editan desde el módulo Caja.'
  })
})

router.delete('/expenses/:id', async (req, res) => {
  res.status(405).json({
    message: 'Los gastos se eliminan desde el módulo Caja.'
  })
})

router.get('/iva', async (req, res) => {
  try {
    const { range, orders, expenses } = await loadMonthlyData(req.query)

    const grossSales = orders.reduce((sum, order) => {
      return sum + num(order.total || order.total_amount || order.amount)
    }, 0)

    const ivaDebit = ivaFromGross(grossSales)

    const ivaCredit = expenses.reduce((sum, expense) => {
      return sum + num(expense.iva_amount)
    }, 0)

    const purchasesGross = expenses.reduce((sum, expense) => {
      return sum + num(expense.total_amount)
    }, 0)

    res.json({
      period: {
        year: range.year,
        month: range.month,
        from: range.fromDate,
        to: range.toDate
      },
      iva_debit: ivaDebit,
      iva_credit: ivaCredit,
      iva_to_pay: ivaDebit - ivaCredit,
      sales_gross: grossSales,
      purchases_gross: purchasesGross
    })
  } catch (error) {
    console.error('Accounting IVA error:', error)
    res.status(500).json({
      message: 'Error calculando IVA desde Caja',
      error: error.message
    })
  }
})

router.get('/profit-loss', async (req, res) => {
  try {
    const { range, orders, expenses } = await loadMonthlyData(req.query)

    const grossSales = orders.reduce((sum, order) => {
      return sum + num(order.total || order.total_amount || order.amount)
    }, 0)

    const ivaDebit = ivaFromGross(grossSales)
    const netSales = grossSales - ivaDebit

    const grossExpenses = expenses.reduce((sum, expense) => {
      return sum + num(expense.total_amount)
    }, 0)

    const ivaCredit = expenses.reduce((sum, expense) => {
      return sum + num(expense.iva_amount)
    }, 0)

    const netExpenses = grossExpenses - ivaCredit
    const utility = netSales - netExpenses

    res.json({
      period: {
        year: range.year,
        month: range.month,
        from: range.fromDate,
        to: range.toDate
      },
      income_statement: {
        gross_sales: grossSales,
        iva_debit: ivaDebit,
        net_sales: netSales,
        gross_expenses: grossExpenses,
        iva_credit: ivaCredit,
        net_expenses: netExpenses,
        estimated_profit: utility,
        margin_percent: grossSales > 0
          ? Number(((utility / grossSales) * 100).toFixed(2))
          : 0
      }
    })
  } catch (error) {
    console.error('Accounting profit-loss error:', error)
    res.status(500).json({
      message: 'Error generando estado de resultados desde Caja',
      error: error.message
    })
  }
})

router.get('/alerts', async (req, res) => {
  try {
    const { orders, expenses } = await loadMonthlyData(req.query)

    const totalSales = orders.reduce((sum, order) => {
      return sum + num(order.total || order.total_amount || order.amount)
    }, 0)

    const totalExpenses = expenses.reduce((sum, expense) => {
      return sum + num(expense.total_amount)
    }, 0)

    const ivaDebit = ivaFromGross(totalSales)
    const ivaCredit = expenses.reduce((sum, expense) => {
      return sum + num(expense.iva_amount)
    }, 0)

    const alerts = []

    if (totalSales === 0) {
      alerts.push({
        type: 'VENTAS',
        level: 'info',
        title: 'Sin ventas en el periodo',
        message: 'No hay ventas registradas para este mes.'
      })
    }

    if (expenses.length === 0) {
      alerts.push({
        type: 'GASTOS',
        level: 'warning',
        title: 'No hay gastos en Caja',
        message: 'Registra gastos desde Caja para que Contabilidad pueda calcular costos e IVA crédito.'
      })
    }

    if (ivaDebit - ivaCredit > 0) {
      alerts.push({
        type: 'IVA',
        level: 'warning',
        title: 'IVA estimado pendiente',
        message: `El IVA estimado a pagar es $${(ivaDebit - ivaCredit).toLocaleString('es-CL')}.`
      })
    }

    if (totalExpenses > totalSales && totalSales > 0) {
      alerts.push({
        type: 'UTILIDAD',
        level: 'danger',
        title: 'Gastos mayores a ventas',
        message: 'Los gastos registrados en Caja superan las ventas del periodo.'
      })
    }

    res.json(alerts)
  } catch (error) {
    console.error('Accounting alerts error:', error)
    res.status(500).json({
      message: 'Error generando alertas desde Caja',
      error: error.message
    })
  }
})

export default router
