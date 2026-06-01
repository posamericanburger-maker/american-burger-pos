import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import useAuth from '../hooks/useAuth'

const API_URL = import.meta.env.VITE_API_URL || 'https://american-burger-pos-api-d8r1.onrender.com/api'

const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const paymentLabel = (method) => ({
  cash: 'Efectivo',
  debit: 'Débito',
  credit: 'Crédito',
  transfer: 'Transferencia'
}[method] || method || 'Sin medio')

const typeLabel = (type) => ({
  counter: 'Mostrador',
  delivery: 'Delivery'
}[type] || type || 'Mostrador')

const Dashboard = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [cashSessions, setCashSessions] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)

  const getToken = () => localStorage.getItem('token') || ''

  const request = async (path) => {
    const res = await fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      }
    })

    return res.json()
  }

  const loadDashboard = async () => {
    const ordersData = await request('/orders')
    const productsData = await request('/products')
    const cashData = await request('/cash/sessions')

    setOrders(ordersData.orders || [])
    setProducts(productsData.products || [])
    setCashSessions(cashData.sessions || [])
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  const todayOrders = orders.filter((order) =>
    String(order.created_at || '').slice(0, 10) === today
  )

  const salesToday = todayOrders.reduce(
    (sum, order) => sum + Number(order.total || order.total_amount || 0),
    0
  )

  const activeCash = cashSessions.find((s) => s.status === 'open')

  const salesByType = todayOrders.reduce((acc, order) => {
    const type = order.order_type || order.type || 'counter'
    acc[type] = (acc[type] || 0) + Number(order.total || order.total_amount || 0)
    return acc
  }, {})

  const salesByPayment = todayOrders.reduce((acc, order) => {
    const method = order.payment_method || 'Sin medio'
    acc[method] = (acc[method] || 0) + Number(order.total || order.total_amount || 0)
    return acc
  }, {})

  const getProductEmoji = (name = '') => {
    const text = String(name).toLowerCase()

    if (text.includes('papa')) return '🍟'
    if (text.includes('bebida') || text.includes('lata') || text.includes('coca')) return '🥤'
    if (text.includes('crispy') || text.includes('pollo') || text.includes('alita') || text.includes('tender')) return '🍗'
    if (text.includes('bacon') || text.includes('tocino')) return '🥓'
    if (text.includes('cheese') || text.includes('cheddar')) return '🧀'

    return '🍔'
  }

  const exportExcel = () => {
    const detalleVentas = []

    orders.forEach((order) => {
      const fecha = new Date(order.created_at)
      const items = order.items || []

      items.forEach((item) => {
        detalleVentas.push({
          Fecha: fecha.toLocaleDateString('es-CL'),
          Hora: fecha.toLocaleTimeString('es-CL'),
          TipoVenta: typeLabel(order.order_type || order.type),
          MedioPago: paymentLabel(order.payment_method),
          Cliente: order.customer_name || '',
          WhatsApp: order.customer_phone || '',
          Direccion: order.customer_address || '',
          Producto: item.name || item.product_name || item.name_snapshot || '',
          Categoria: item.category_name || 'Sin categoría',
          Cantidad: Number(item.quantity || 1),
          PrecioUnitario: Number(item.unit_price || item.price || 0),
          Subtotal: Number(item.subtotal || 0),
          TotalPedido: Number(order.total || order.total_amount || 0),
          Notas: order.notes || ''
        })
      })
    })

    const workbook
