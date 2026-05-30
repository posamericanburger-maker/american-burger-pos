import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    res.json({
      success: true,
      categories: data || []
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías'
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

    if (error) throw error

    res.status(201).json({
      success: true,
      category: data
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría'
    })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description = '', active = true } = req.body

    const { data, error } = await supabase
      .from('categories')
      .update({
        name,
        description,
        active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      category: data
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría'
    })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({
      success: true,
      message: 'Categoría eliminada'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría'
    })
  }
})

export default router
