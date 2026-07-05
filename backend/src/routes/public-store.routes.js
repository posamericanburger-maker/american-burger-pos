import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

const cleanPhone = (phone = '') => String(phone).replace(/[^0-9]/g, '')

const moneyNumber = (value) => {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number : 0
}

const normalizeItem = (item = {}) => {
  const quantity = Number(item.quantity || 1)
  const unitPrice = moneyNumber(item.unit_price || item.price || 0)

  return {
    product_id: item.product_id || item.id || null,
    name: item.name || item.product_name || 'Producto web',
    product_name: item.name || item.product_name || 'Producto web',
    name_snapshot: item.name || item.product_name || 'Producto web',
    category_name: item.category_name || 'Tienda web',
    quantity,
    unit_price: unitPrice,
    price: unitPrice,
    subtotal: moneyNumber(item.subtotal || quantity * unitPrice),
    notes: item.notes || '',
    modifiers: item.modifiers || item.extras || [],
    sold_at: new Date().toISOString()
  }
}

router.get('/products', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      price,
      category_id,
      image_url,
      is_active,
      stock,
      categories (
        id,
        name
      )
    `)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    return res.status(500).json({
      message: 'Error al obtener productos de la tienda',
      error: error.message
    })
  }

  const products = (data || []).map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description || '',
    price: moneyNumber(product.price),
    image_url: product.image_url || '',
    category_id: product.category_id || null,
    category_name: product.categories?.name || 'Productos',
    stock: product.stock ?? null,
    available: product.is_active !== false
  }))

  res.json(products)
})

router.post('/orders', async (req, res) => {
  const {
    customer_name,
    customer_phone,
    customer_address,
    delivery_type,
    notes,
    payment_method,
    items = [],
    subtotal,
    delivery_fee,
    total
  } = req.body || {}

  if (!customer_name || !cleanPhone(customer_phone)) {
    return res.status(400).json({
      message: 'Nombre y teléfono del cliente son obligatorios'
    })
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: 'El pedido debe tener al menos un producto'
    })
  }

  const normalizedItems = items.map(normalizeItem)

  const orderSubtotal = moneyNumber(
    subtotal || normalizedItems.reduce((sum, item) => sum + item.subtotal, 0)
  )

  const orderDeliveryFee = moneyNumber(delivery_fee || 0)
  const orderTotal = moneyNumber(total || orderSubtotal + orderDeliveryFee)

  const orderPayload = {
    customer_name: String(customer_name).trim(),
    customer_phone: cleanPhone(customer_phone),
    customer_address: customer_address || '',
    notes: notes || '',
    payment_method: payment_method || 'pending',
    delivery_type: delivery_type || 'pickup',
    channel: 'web',
    source: 'web',
    status: 'pending',
    payment_status: 'pending',
    subtotal: orderSubtotal,
    delivery_fee: orderDeliveryFee,
    total: orderTotal,
    items: normalizedItems,
    created_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('orders')
    .insert([orderPayload])
    .select()
    .single()

  if (error) {
    return res.status(500).json({
      message: 'Error al crear pedido web',
      error: error.message
    })
  }

  res.status(201).json({
    message: 'Pedido web creado correctamente',
    order: data
  })
})

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    module: 'public-store',
    timestamp: new Date().toISOString()
  })
})

export default router
