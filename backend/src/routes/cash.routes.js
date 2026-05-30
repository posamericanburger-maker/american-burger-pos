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

    const { data: existingOpen } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('status', 'open')
      .maybeSingle()

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
        status: 'open',
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
    const closingAmount = Number(req.body.closing_amount || req.body.final_amount || 0)

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

    const { data, error } = await supabase
      .from('cash_sessions')
      .update({
        closing_amount: closingAmount,
        status: 'closed',
        closed_at: new Date().toISOString(),
        closed_by: req.user?.id || null
      })
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
    const { data, error } = await supabase
      .from('cash_movements')
      .select('*')
      .order('created_at', { ascending: false })

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
    const { type = 'expense', description = '' } = req.body
    const amount = Number(req.body.amount || 0)

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      })
    }

    const { data: session } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data, error } = await supabase
      .from('cash_movements')
      .insert({
        cash_session_id: session?.id || null,
        type,
        amount,
        description,
        user_id: req.user?.id || null
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
