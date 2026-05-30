import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')

    if (error) {
      console.error('SUPABASE CATEGORIES SELECT ERROR:', error)
      return res.status(500).json({
        success: false,
        message: error.message,
        details: error
      })
    }

    return res.json({
      success: true,
      categories: data || []
    })
  } catch (error) {
    console.error('CATEGORIES ROUTE ERROR:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener categorías'
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, description = '', active = true } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es obligatorio'
      })
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        description,
        active
      })
      .select()
      .single()

    if (error) {
      console.error('SUPABASE CATEGORIES INSERT ERROR:', error)
      return res.status(500).json({
        success: false,
        message: error.message,
        details: error
      })
    }

    return res.status(201).json({
      success: true,
      category: data
    })
  } catch (error) {
    console.error('CATEGORIES POST ERROR:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al crear categoría'
    })
  }
})

export default router
