import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

const num = (value) => Number(value || 0)

const today = () => new Date().toISOString().slice(0, 10)

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

router.get('/dashboard', async (req, res) => {
  try {
    const range = getMonthRange(req.query)

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', range.fromISO)
      .lte('created_at', range.toISO)

    if (ordersError) throw ordersError

    const { data: expenses, error: expensesError } = await supabase
      .from('accounting_expenses')
      .select('*')
      .gte('expense_date', range.fromDate)
      .lte('expense_date', range.toDate)

    if (expensesError) throw expensesError

    const totalSales = (orders || []).reduce((sum, item) => {
      return sum + num(item.total || item.total_amount || item.amount)
    }, 0)

    const totalExpenses = (expenses || []).reduce((sum, item) => {
      return sum + num(item.total_amount)
    }, 0)

    const ivaDebit = ivaFromGross(totalSales)
    const netSales = netFromGross(totalSales)

    const ivaCredit = (expenses || []).reduce((sum, item) => {
      return sum + num(item.iva_amount)
    }, 0)

    const netExpenses = totalExpenses - ivaCredit
    const ivaToPay = ivaDebit - ivaCredit
    const estimatedProfit = netSales - netExpenses

    const salesByPayment = {}

    ;(orders || []).forEach((order) => {
      const method = order.payment_method || order.paymentMethod || 'Sin método'
      const amount = num(order.total || order.total_amount || order.amount)
      salesByPayment[method] = (salesByPayment[method] || 0) + amount
    })

    const expensesByCategory = {}

    ;(expenses || []).forEach((expense) => {
      const category = expense.category || 'Sin categoría'
      expensesByCategory[category] = (expensesByCategory[category] || 0) + num(expense.total_amount)
    })

    const alerts = []

    if (ivaToPay > 0) {
      alerts.push({
        type: 'IVA',
        level: 'warning',
        title: 'IVA estimado a pagar',
        message: `Según ventas y compras registradas, el IVA estimado a pagar es $${ivaToPay.toLocaleString('es-CL')}.`
      })
    }

    if ((expenses || []).length === 0) {
      alerts.push({
        type: 'COMPRAS',
        level: 'info',
        title: 'Sin compras registradas',
        message: 'Este mes no tienes compras o gastos registrados en el asistente contable.'
      })
    }

    if (totalSales > 0 && estimatedProfit <= 0) {
      alerts.push({
        type: 'UTILIDAD',
        level: 'danger',
        title: 'Utilidad baja o negativa',
        message: 'Las ventas del mes no están cubriendo los gastos registrados.'
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
        orders_count: orders?.length || 0,
        by_payment_method: salesByPayment
      },
      expenses: {
        gross: totalExpenses,
        net: netExpenses,
        iva_credit: ivaCredit,
        count: expenses?.length || 0,
        by_category: expensesByCategory
      },
      taxes: {
        iva_debit: ivaDebit,
        iva_credit: ivaCredit,
        iva_to_pay: ivaToPay
      },
      result: {
        gross_profit_estimated: estimatedProfit,
        margin_percent: totalSales > 0 ? Number(((estimatedProfit / totalSales) * 100).toFixed(2)) : 0
      },
      alerts
    })
  } catch (error) {
    console.error('Accounting dashboard error:', error)
    res.status(500).json({
      message: 'Error generando dashboard contable',
      error: error.message
    })
  }
})

router.get('/expenses', async (req, res) => {
  try {
    const { from, to } = req.query

    let query = supabase
      .from('accounting_expenses')
      .select('*')
      .order('expense_date', { ascending: false })

    if (from) query = query.gte('expense_date', from)
    if (to) query = query.lte('expense_date', to)

    const { data, error } = await query

    if (error) throw error

    res.json(data || [])
  } catch (error) {
    console.error('Accounting expenses list error:', error)
    res.status(500).json({
      message: 'Error cargando compras y gastos',
      error: error.message
    })
  }
})

router.get('/expenses/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accounting_expenses')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Accounting expense detail error:', error)
    res.status(500).json({
      message: 'Error cargando detalle del gasto',
      error: error.message
    })
  }
})

router.post('/expenses', async (req, res) => {
  try {
    const body = req.body || {}

    const totalAmount = num(body.total_amount)

    const netAmount = body.net_amount !== undefined && body.net_amount !== ''
      ? num(body.net_amount)
      : Math.round(totalAmount / 1.19)

    const ivaAmount = body.iva_amount !== undefined && body.iva_amount !== ''
      ? num(body.iva_amount)
      : totalAmount - netAmount

    const payload = {
      supplier_id: body.supplier_id || null,
      supplier_name: body.supplier_name || '',
      document_type: body.document_type || 'FACTURA',
      document_number: body.document_number || '',
      description: body.description || '',
      category: body.category || '',
      payment_method: body.payment_method || '',
      expense_date: body.expense_date || today(),
      net_amount: netAmount,
      iva_amount: ivaAmount,
      total_amount: totalAmount,
      file_url: body.file_url || null,
      notes: body.notes || ''
    }

    const { data, error } = await supabase
      .from('accounting_expenses')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (error) {
    console.error('Accounting expense create error:', error)
    res.status(500).json({
      message: 'Error registrando compra o gasto',
      error: error.message
    })
  }
})

router.put('/expenses/:id', async (req, res) => {
  try {
    const body = req.body || {}

    const totalAmount = num(body.total_amount)

    const netAmount = body.net_amount !== undefined && body.net_amount !== ''
      ? num(body.net_amount)
      : Math.round(totalAmount / 1.19)

    const ivaAmount = body.iva_amount !== undefined && body.iva_amount !== ''
      ? num(body.iva_amount)
      : totalAmount - netAmount

    const payload = {
      supplier_id: body.supplier_id || null,
      supplier_name: body.supplier_name || '',
      document_type: body.document_type || 'FACTURA',
      document_number: body.document_number || '',
      description: body.description || '',
      category: body.category || '',
      payment_method: body.payment_method || '',
      expense_date: body.expense_date || today(),
      net_amount: netAmount,
      iva_amount: ivaAmount,
      total_amount: totalAmount,
      file_url: body.file_url || null,
      notes: body.notes || ''
    }

    const { data, error } = await supabase
      .from('accounting_expenses')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Accounting expense update error:', error)
    res.status(500).json({
      message: 'Error actualizando compra o gasto',
      error: error.message
    })
  }
})

router.delete('/expenses/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('accounting_expenses')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error

    res.json({ ok: true })
  } catch (error) {
    console.error('Accounting expense delete error:', error)
    res.status(500).json({
      message: 'Error eliminando compra o gasto',
      error: error.message
    })
  }
})

router.get('/iva', async (req, res) => {
  try {
    const range = getMonthRange(req.query)

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', range.fromISO)
      .lte('created_at', range.toISO)

    if (ordersError) throw ordersError

    const { data: expenses, error: expensesError } = await supabase
      .from('accounting_expenses')
      .select('*')
      .gte('expense_date', range.fromDate)
      .lte('expense_date', range.toDate)

    if (expensesError) throw expensesError

    const grossSales = (orders || []).reduce((sum, order) => {
      return sum + num(order.total || order.total_amount || order.amount)
    }, 0)

    const ivaDebit = ivaFromGross(grossSales)

    const ivaCredit = (expenses || []).reduce((sum, expense) => {
      return sum + num(expense.iva_amount)
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
      purchases_gross: (expenses || []).reduce((sum, expense) => {
        return sum + num(expense.total_amount)
      }, 0)
    })
  } catch (error) {
    console.error('Accounting IVA error:', error)
    res.status(500).json({
      message: 'Error calculando IVA',
      error: error.message
    })
  }
})

router.get('/profit-loss', async (req, res) => {
  try {
    const range = getMonthRange(req.query)

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', range.fromISO)
      .lte('created_at', range.toISO)

    if (ordersError) throw ordersError

    const { data: expenses, error: expensesError } = await supabase
      .from('accounting_expenses')
      .select('*')
      .gte('expense_date', range.fromDate)
      .lte('expense_date', range.toDate)

    if (expensesError) throw expensesError

    const grossSales = (orders || []).reduce((sum, order) => {
      return sum + num(order.total || order.total_amount || order.amount)
    }, 0)

    const ivaDebit = ivaFromGross(grossSales)
    const netSales = grossSales - ivaDebit

    const grossExpenses = (expenses || []).reduce((sum, expense) => {
      return sum + num(expense.total_amount)
    }, 0)

    const ivaCredit = (expenses || []).reduce((sum, expense) => {
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
        margin_percent: grossSales > 0 ? Number(((utility / grossSales) * 100).toFixed(2)) : 0
      }
    })
  } catch (error) {
    console.error('Accounting profit-loss error:', error)
    res.status(500).json({
      message: 'Error generando estado de resultados',
      error: error.message
    })
  }
})

router.get('/alerts', async (req, res) => {
  try {
    const range = getMonthRange(req.query)

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', range.fromISO)
      .lte('created_at', range.toISO)

    if (ordersError) throw ordersError

    const { data: expenses, error: expensesError } = await supabase
      .from('accounting_expenses')
      .select('*')
      .gte('expense_date', range.fromDate)
      .lte('expense_date', range.toDate)

    if (expensesError) throw expensesError

    const totalSales = (orders || []).reduce((sum, order) => {
      return sum + num(order.total || order.total_amount || order.amount)
    }, 0)

    const totalExpenses = (expenses || []).reduce((sum, expense) => {
      return sum + num(expense.total_amount)
    }, 0)

    const ivaDebit = ivaFromGross(totalSales)
    const ivaCredit = (expenses || []).reduce((sum, expense) => {
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
        type: 'COMPRAS',
        level: 'warning',
        title: 'No hay compras registradas',
        message: 'Registra tus facturas de compras para estimar correctamente el IVA crédito.'
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
        message: 'Los gastos registrados superan las ventas del periodo.'
      })
    }

    res.json(alerts)
  } catch (error) {
    console.error('Accounting alerts error:', error)
    res.status(500).json({
      message: 'Error generando alertas',
      error: error.message
    })
  }
})

export default router
