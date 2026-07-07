import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

const number = (v) => Number(v || 0)

router.get('/summary', async (req, res) => {
  try {
    const now = new Date()
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startMonth)
      .lte('created_at', endMonth)

    if (ordersError) throw ordersError

    const { data: expenses, error: expensesError } = await supabase
      .from('accounting_expenses')
      .select('*')
      .gte('expense_date', startMonth.slice(0, 10))
      .lte('expense_date', endMonth.slice(0, 10))

    if (expensesError) throw expensesError

    const totalSales = (orders || []).reduce((sum, o) => sum + number(o.total), 0)
    const totalExpenses = (expenses || []).reduce((sum, e) => sum + number(e.total_amount), 0)

    const ivaDebit = Math.round(totalSales * 19 / 119)
    const ivaCredit = (expenses || []).reduce((sum, e) => sum + number(e.iva_amount), 0)
    const ivaToPay = ivaDebit - ivaCredit

    const netSales = totalSales - ivaDebit
    const netExpenses = totalExpenses - ivaCredit
    const estimatedProfit = netSales - netExpenses

    res.json({
      period: {
        from: startMonth.slice(0, 10),
        to: endMonth.slice(0, 10)
      },
      sales: {
        total: totalSales,
        net: netSales,
        iva_debit: ivaDebit
      },
      expenses: {
        total: totalExpenses,
        net: netExpenses,
        iva_credit: ivaCredit
      },
      result: {
        iva_to_pay: ivaToPay,
        estimated_profit: estimatedProfit
      },
      counters: {
        orders: orders?.length || 0,
        expenses: expenses?.length || 0
      }
    })
  } catch (error) {
    console.error('Accounting summary error:', error)
    res.status(500).json({ error: 'Error generando resumen contable' })
  }
})

router.get('/expenses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accounting_expenses')
      .select('*')
      .order('expense_date', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    res.status(500).json({ error: 'Error cargando gastos contables' })
  }
})

router.post('/expenses', async (req, res) => {
  try {
    const body = req.body || {}

    const total = number(body.total_amount)
    const net = body.net_amount ? number(body.net_amount) : Math.round(total / 1.19)
    const iva = body.iva_amount ? number(body.iva_amount) : total - net

    const payload = {
      supplier_id: body.supplier_id || null,
      supplier_name: body.supplier_name || '',
      document_type: body.document_type || 'FACTURA',
      document_number: body.document_number || '',
      description: body.description || '',
      net_amount: net,
      iva_amount: iva,
      total_amount: total,
      payment_method: body.payment_method || '',
      expense_date: body.expense_date || new Date().toISOString().slice(0, 10),
      category: body.category || '',
      file_url: body.file_url || null
    }

    const { data, error } = await supabase
      .from('accounting_expenses')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Create accounting expense error:', error)
    res.status(500).json({ error: 'Error creando gasto contable' })
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
    res.status(500).json({ error: 'Error eliminando gasto contable' })
  }
})

router.get('/alerts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accounting_alerts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    res.status(500).json({ error: 'Error cargando alertas contables' })
  }
})

export default router
