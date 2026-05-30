import express from 'express'
import { supabase } from '../config/supabase.js'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories (
          id,
          name
        )
      `)
      .order('name', { ascending: true })

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
        details: error
      })
    }

    return res.json({
      success: true,
      products: data || []
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener productos'
    })
  }
})

router.post('/', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const {
      name,
      description = '',
      category_id = null,
      price = 0,
      cost = 0,
      stock = 0,
      active = true
    } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del producto es obligatorio'
      })
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        name: name.trim(),
        description,
        category_id,
        price: Number(price),
        cost: Number(cost),
        stock: Number(stock),
        active
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
        details: error
      })
    }

    return res.status(201).json({
      success: true,
      product: data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al crear producto'
    })
  }
})

router.put('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params

    const {
      name,
      description = '',
      category_id = null,
      price = 0,
      cost = 0,
      stock = 0,
      active = true
    } = req.body

    const { data, error } = await supabase
      .from('products')
      .update({
        name: name?.trim(),
        description,
        category_id,
        price: Number(price),
        cost: Number(cost),
        stock: Number(stock),
        active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
        details: error
      })
    }

    return res.json({
      success: true,
      product: data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar producto'
    })
  }
})

router.delete('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
        details: error
      })
    }

    return res.json({
      success: true,
      message: 'Producto eliminado'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar producto'
    })
  }
})

export default router
