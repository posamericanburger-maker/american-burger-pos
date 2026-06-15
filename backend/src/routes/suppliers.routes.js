import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// GET /api/suppliers
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({
      message: 'Error cargando proveedores',
      error: error.message
    })
  }

  res.json({ suppliers: data || [] })
})

// POST /api/suppliers
router.post('/', async (req, res) => {
  const { name, rut, phone, note } = req.body

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'El nombre del proveedor es obligatorio' })
  }

  const { data, error } = await supabase
    .from('suppliers')
    .insert([
      {
        name: name.trim(),
        rut: rut?.trim() || '',
        phone: phone?.trim() || '',
        note: note?.trim() || ''
      }
    ])
    .select()
    .single()

  if (error) {
    return res.status(500).json({
      message: 'Error guardando proveedor',
      error: error.message
    })
  }

  res.status(201).json({
    message: 'Proveedor creado correctamente',
    supplier: data
  })
})

// PUT /api/suppliers/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { name, rut, phone, note } = req.body

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'El nombre del proveedor es obligatorio' })
  }

  const { data, error } = await supabase
    .from('suppliers')
    .update({
      name: name.trim(),
      rut: rut?.trim() || '',
      phone: phone?.trim() || '',
      note: note?.trim() || '',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return res.status(500).json({
      message: 'Error actualizando proveedor',
      error: error.message
    })
  }

  res.json({
    message: 'Proveedor actualizado correctamente',
    supplier: data
  })
})

// DELETE /api/suppliers/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params

  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id)

  if (error) {
    return res.status(500).json({
      message: 'Error eliminando proveedor',
      error: error.message
    })
  }

  res.json({ message: 'Proveedor eliminado correctamente' })
})

export default router
