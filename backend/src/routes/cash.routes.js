import express from 'express'
import { supabase } from '../config/supabase.js'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/sessions', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cash_sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return res.json({
      success: true,
      sessions: data || []
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener sesiones de caja'
    })
  }
})

router.post('/open', verifyToken, verifyRole(['cajero', 'admin']), async (req, res) => {
  try {
    const openingAmount = Number(req.body.opening_amount || req.body.initial_amount || 0)

    const { data: existingOpen, error: existingError } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingError) throw existingError

    if (existingOpen) {
      return res.json({
        success: true,
        message: 'Ya existe una caja abierta',
        session: existingOpen
      })
    }

    const { data, error } = await supabase
      .from('cash_sessions')
      .insert({
        opening_amount: openingAmount,
        initial_amount: openingAmount,
        status: 'open',
        opened_at: new Date().toISOString(),
        opened_by: req.user?.id || null
      })
      .select()
      .single()

    if (error) throw error

    return res.status(201).json({
      success: true,
      message: 'Caja abierta correctamente',
      session: data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al abrir caja'
    })
  }
})

router.post('/close', verifyToken, verifyRole(['cajero', 'admin']), async (req, res) => {
  try {
    const body = req.body || {}

    const closingAmount = Number(body.closing_amount || body.final_amount || 0)

    const { data: session, error: sessionError } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (sessionError) throw sessionError

    if (!session) {
      return res.status(400).json({
        success: false,
        message: 'No hay caja abierta'
      })
    }

    const updateData = {
      closing_amount: closingAmount,
      final_amount: closingAmount,
      status: 'closed',
      closed_at: new Date().toISOString(),
      closed_by: req.user?.id || null
    }

    const optionalFields = [
      'sales_cash',
      'sales_debit',
      'sales_credit',
      'sales_transfer',
      'total_sales',
      'income',
      'expenses',
      'withdrawals',
      'expected_cash',
      'expected_debit',
      'expected_credit',
      'expected_transfer',
      'expected_total',
      'real_cash',
      'real_debit',
      'real_credit',
      'real_transfer',
      'real_total',
      'difference'
    ]

    optionalFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = Number(body[field] || 0)
      }
    })

    const { data, error } = await supabase
      .from('cash_sessions')
      .update(updateData)
      .eq('id', session.id)
      .select()
      .single()

    if (error) throw error

    return res.json({
      success: true,
      message: 'Caja cerrada correctamente',
      session: data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al cerrar caja'
    })
  }
})

router.get('/movements', verifyToken, async (req, res) => {
  try {
    const { session_id } = req.query

    let query = supabase
      .from('cash_movements')
      .select('*')
      .order('created_at', { ascending: false })

    if (session_id) {
      query = query.eq('cash_session_id', session_id)
    }

    const { data, error } = await query

    if (error) throw error

    return res.json({
      success: true,
      movements: data || []
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener movimientos'
    })
  }
})

router.post('/movements', verifyToken, verifyRole(['cajero', 'admin']), async (req, res) => {
  try {
    const { type = 'expense', description = '', reason = '' } = req.body
    const amount = Number(req.body.amount || 0)

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      })
    }

    const { data: session, error: sessionError } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (sessionError) throw sessionError

    if (!session) {
      return res.status(400).json({
        success: false,
        message: 'Debes abrir caja antes de registrar movimientos'
      })
    }

    const { data, error } = await supabase
      .from('cash_movements')
      .insert({
        cash_session_id: session.id,
        user_id: req.user?.id || null,
        type,
        amount,
        description,
        reason: reason || description || null
      })
      .select()
      .single()

    if (error) throw error

    return res.status(201).json({
      success: true,
      message: 'Movimiento registrado correctamente',
      movement: data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al registrar movimiento'
    })
  }
})

router.post('/movement', verifyToken, verifyRole(['cajero', 'admin']), async (req, res) => {
  req.url = '/movements'
  return router.handle(req, res)
})

export default router
