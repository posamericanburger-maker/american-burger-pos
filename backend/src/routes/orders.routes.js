import express from 'express'
import { supabase } from '../config/supabase.js'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return res.json({
      success: true,
      orders: data || []
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener pedidos'
    })
  }
})

router.post('/', verifyToken, verifyRole(['cajero', 'admin']), async (req, res) => {
  try {
    const {
      type = 'counter',
      order_type = type,
      status = 'paid',
      payment_method = 'cash',
      subtotal = 0,
      delivery_fee = 0,
      total = 0,
      total_amount = total,
      customer = null,
      notes = '',
      items = []
    } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El pedido debe tener productos'
      })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        type,
        order_type,
        status,
        payment_method,
        subtotal: Number(subtotal || 0),
        delivery_fee: Number(delivery_fee || 0),
        total: Number(total || total_amount || 0),
        total_amount: Number(total_amount || total || 0),
        customer_name: customer?.name || null,
        customer_phone: customer?.phone || null,
        customer_address: customer?.address || null,
        notes,
        user_id: req.user?.id || null
      })
      .select()
      .single()

    if (orderError) throw orderError

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id || item.id || null,
      name: item.name || item.product_name || 'Producto',
      quantity: Number(item.quantity || 1),
      unit_price: Number(item.unit_price || item.price || 0),
      price: Number(item.price || item.unit_price || 0),
      subtotal: Number(item.subtotal || 0)
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    return res.status(201).json({
      success: true,
      message: 'Pedido creado correctamente',
      order
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al crear pedido'
    })
  }
})

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return res.json({
      success: true,
      order: data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener pedido'
    })
  }
})

router.put('/:id', verifyToken, verifyRole(['cajero', 'admin']), async (req, res) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    const payload = {
      updated_at: new Date().toISOString()
    }

    if (status) payload.status = status
    if (notes !== undefined) payload.notes = notes

    const { data, error } = await supabase
      .from('orders')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return res.json({
      success: true,
      message: 'Pedido actualizado',
      order: data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar pedido'
    })
  }
})

router.put('/:id/status', verifyToken, verifyRole(['cajero', 'admin']), async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return res.json({
      success: true,
      message: 'Estado actualizado',
      order: data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar estado'
    })
  }
})

export default router
