import express from 'express'
import { supabase } from '../config/supabase.js'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true })

    if (error) throw error

    return res.json({
      success: true,
      inventory: data || [],
      items: data || []
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener inventario'
    })
  }
})

router.post('/', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const {
      name,
      stock = 0,
      current_stock = stock,
      min_stock = 0,
      minimum_stock = min_stock,
      unit = 'unid.'
    } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del insumo es obligatorio'
      })
    }

    const initialStock = Number(current_stock || stock || 0)
    const minStock = Number(minimum_stock || min_stock || 0)

    const { data, error } = await supabase
      .from('inventory')
      .insert({
        name: name.trim(),
        stock: initialStock,
        current_stock: initialStock,
        min_stock: minStock,
        minimum_stock: minStock,
        unit,
        active: true
      })
      .select()
      .single()

    if (error) throw error

    return res.status(201).json({
      success: true,
      message: 'Insumo creado correctamente',
      item: data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al crear insumo'
    })
  }
})

router.post('/movement', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const {
      item_id,
      type,
      quantity,
      description = ''
    } = req.body

    if (!item_id) {
      return res.status(400).json({
        success: false,
        message: 'Debes seleccionar un insumo'
      })
    }

    if (!quantity || Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser mayor a 0'
      })
    }

    const cleanType = String(type || '').toLowerCase()
    const qty = Number(quantity)

    const { data: item, error: itemError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', item_id)
      .single()

    if (itemError) throw itemError

    const currentStock = Number(item.current_stock ?? item.stock ?? 0)

    let newStock = currentStock

    if (cleanType === 'in' || cleanType === 'entrada' || cleanType === 'purchase') {
      newStock = currentStock + qty
    }

    if (
      cleanType === 'out' ||
      cleanType === 'salida' ||
      cleanType === 'waste' ||
      cleanType === 'merma'
    ) {
      newStock = currentStock - qty
    }

    if (cleanType === 'adjustment' || cleanType === 'ajuste') {
      newStock = qty
    }

    if (newStock < 0) newStock = 0

    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        item_id,
        type: cleanType,
        quantity: qty,
        description
      })

    if (movementError) throw movementError

    const { data: updatedItem, error: updateError } = await supabase
      .from('inventory')
      .update({
        stock: newStock,
        current_stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', item_id)
      .select()
      .single()

    if (updateError) throw updateError

    return res.json({
      success: true,
      message: 'Movimiento registrado correctamente',
      item: updatedItem
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al registrar movimiento'
    })
  }
})

router.get('/movements', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        inventory:item_id (
          id,
          name,
          unit
        )
      `)
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

router.get('/alerts', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('active', true)

    if (error) throw error

    const alerts = (data || []).filter((item) => {
      const stock = Number(item.current_stock || item.stock || 0)
      const minStock = Number(item.minimum_stock || item.min_stock || 0)

      return stock <= minStock
    })

    return res.json({
      success: true,
      alerts
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener alertas'
    })
  }
})

export default router
