import express from 'express'
import { supabase } from '../config/supabase.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/', verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    return res.status(500).json({ success: false, message: error.message })
  }

  res.json({ success: true, customers: data || [] })
})

export default router
