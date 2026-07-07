import express from 'express'
import { supabase } from '../config/supabase.js'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()
const num = (v) => Number(v || 0)

router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true })

    if (error) throw error

    return res.json({ success: true, inventory: data || [], items: data || [] })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error al obtener inventario' })
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
      unit = 'unid.',
      unit_cost = 0,
      last_purchase_price = unit_cost,
      average_cost = unit_cost,
      supplier_name = ''
    } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre del insumo es obligatorio' })
    }

    const { data, error } = await supabase
      .from('inventory')
      .insert({
        name: name.trim(),
        stock: num(current_stock || stock),
        current_stock: num(current_stock || stock),
        min_stock: num(minimum_stock || min_stock),
        minimum_stock: num(minimum_stock || min_stock),
        unit,
        unit_cost: num(unit_cost),
        last_purchase_price: num(last_purchase_price),
        average_cost: num(average_cost),
        supplier_name,
        active: true
      })
      .select()
      .single()

    if (error) throw error

    return res.status(201).json({ success: true, message: 'Insumo creado correctamente', item: data })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error al crear insumo' })
  }
})

router.put('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      stock = 0,
      current_stock = stock,
      min_stock = 0,
      minimum_stock = min_stock,
      unit = 'unid.',
      unit_cost = 0,
      last_purchase_price = unit_cost,
      average_cost = unit_cost,
      supplier_name = ''
    } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre del insumo es obligatorio' })
    }

    const { data, error } = await supabase
      .from('inventory')
      .update({
        name: name.trim(),
        stock: num(current_stock || stock),
        current_stock: num(current_stock || stock),
        min_stock: num(minimum_stock || min_stock),
        minimum_stock: num(minimum_stock || min_stock),
        unit,
        unit_cost: num(unit_cost),
        last_purchase_price: num(last_purchase_price),
        average_cost: num(average_cost),
        supplier_name,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return res.json({ success: true, message: 'Insumo actualizado correctamente', item: data })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error al actualizar insumo' })
  }
})

router.delete('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('inventory')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return res.json({ success: true, message: 'Insumo eliminado correctamente' })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error al eliminar insumo' })
  }
})

router.post('/movement', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { item_id, type, quantity, description = '', unit_cost } = req.body

    if (!item_id) return res.status(400).json({ success: false, message: 'Debes seleccionar un insumo' })
    if (!quantity || num(quantity) <= 0) return res.status(400).json({ success: false, message: 'La cantidad debe ser mayor a 0' })

    const cleanType = String(type || '').toLowerCase()
    const qty = num(quantity)

    const { data: item, error: itemError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', item_id)
      .single()

    if (itemError) throw itemError

    const currentStock = num(item.current_stock ?? item.stock)
    let newStock = currentStock

    if (['in', 'entrada', 'purchase'].includes(cleanType)) newStock = currentStock + qty
    if (['out', 'salida', 'waste', 'merma'].includes(cleanType)) newStock = currentStock - qty
    if (['adjustment', 'ajuste'].includes(cleanType)) newStock = qty
    if (newStock < 0) newStock = 0

    const movementUnitCost = unit_cost !== undefined && unit_cost !== '' ? num(unit_cost) : num(item.unit_cost)

    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        item_id,
        type: cleanType,
        quantity: qty,
        description,
        unit_cost: movementUnitCost
      })

    if (movementError) throw movementError

    const updatePayload = {
      stock: newStock,
      current_stock: newStock,
      updated_at: new Date().toISOString()
    }

    if (['in', 'entrada', 'purchase'].includes(cleanType) && movementUnitCost > 0) {
      const oldValue = currentStock * num(item.average_cost || item.unit_cost || 0)
      const newValue = qty * movementUnitCost
      const averageCost = newStock > 0 ? (oldValue + newValue) / newStock : movementUnitCost

      updatePayload.unit_cost = movementUnitCost
      updatePayload.last_purchase_price = movementUnitCost
      updatePayload.average_cost = averageCost
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from('inventory')
      .update(updatePayload)
      .eq('id', item_id)
      .select()
      .single()

    if (updateError) throw updateError

    return res.json({ success: true, message: 'Movimiento registrado correctamente', item: updatedItem })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error al registrar movimiento' })
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

    return res.json({ success: true, movements: data || [] })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error al obtener movimientos' })
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
      const stock = num(item.current_stock || item.stock)
      const minStock = num(item.minimum_stock || item.min_stock)
      return stock <= minStock
    })

    return res.json({ success: true, alerts })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error al obtener alertas' })
  }
})

export default router
