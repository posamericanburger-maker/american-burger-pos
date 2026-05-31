import express from 'express'
import { supabase } from '../config/supabase.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

const cleanPhone = (phone = '') => {
  return String(phone).replace(/[^0-9]/g, '')
}

router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error

    return res.json({
      success: true,
      customers: data || []
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener clientes'
    })
  }
})

router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      name = '',
      phone = '',
      address = '',
      reference = ''
    } = req.body

    const normalizedPhone = cleanPhone(phone)

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: 'El WhatsApp del cliente es obligatorio'
      })
    }

    const { data, error } = await supabase
      .from('customers')
      .upsert(
        {
          name,
          phone: normalizedPhone,
          address,
          reference,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'phone'
        }
      )
      .select()
      .single()

    if (error) throw error

    return res.status(201).json({
      success: true,
      customer: data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al guardar cliente'
    })
  }
})

export default router
