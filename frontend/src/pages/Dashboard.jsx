import { useEffect, useState } from 'react'
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

const Dashboard = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [cashSessions, setCashSessions] = useState([])

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

  const exportExcel = () => {
    const rows = [
      ['Fecha', 'Hora', 'Tipo venta', 'Medio pago', 'Producto', 'Categoría', 'Cantidad', 'Precio unitario', 'Subtotal']
    ]

    orders.forEach((order) => {
      const date = new Date(order.created_at)
      const items = order.items || []

      items.forEach((item) => {
        rows.push([
          date.toLocaleDateString('es-CL'),
          date.toLocaleTimeString('es-CL'),
          order.order_type || order.type || 'Mostrador',
          order.payment_method || '',
          item.name || item.product_name || item.name_snapshot || '',
          item.category_name || 'Sin categoría',
          item.quantity || 1,
          item.unit_price || item.price || 0,
          item.subtotal || 0
        ])
      })
    })

    const html = `
      <html>
        <head><meta charset="UTF-8"></head>
        <body>
          <table border="1">
            ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </table>
        </body>
      </html>
    `

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ventas-american-burger-${Date.now()}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-container">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Dashboard" />

        <div className="main-content space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <p className="text-gray-600">Ventas Hoy</p>
              <h2 className="text-3xl font-bold">{money(salesToday)}</h2>
            </div>

            <div className="card">
              <p className="text-gray-600">Pedidos</p>
              <h2 className="text-3xl font-bold">{todayOrders.length}</h2>
            </div>

            <div className="card">
              <p className="text-gray-600">Estado Caja</p>
              <h2 className={`text-3xl font-bold ${activeCash ? 'text-green-600' : 'text-red-600'}`}>
                {activeCash ? 'ABIERTA' : 'CERRADA'}
              </h2>
            </div>

            <div className="card">
              <p className="text-gray-600">Productos</p>
              <h2 className="text-3xl font-bold">{products.length}</h2>
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Detalle de ventas</h2>
              <button onClick={exportExcel} className="bg-black text-yellow-400 px-5 py-3 rounded-lg font-bold">
                Descargar Excel
              </button>
            </div>

            <h3 className="font-bold mb-2">Por tipo de venta</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {Object.entries(salesByType).map(([type, total]) => (
                <div key={type} className="border rounded-lg p-4">
                  <p>{type === 'delivery' ? 'Delivery' : 'Mostrador'}</p>
                  <h3 className="text-2xl font-bold">{money(total)}</h3>
                </div>
              ))}
            </div>

            <h3 className="font-bold mb-2">Por medio de pago</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(salesByPayment).map(([method, total]) => (
                <div key={method} className="border rounded-lg p-4">
                  <p>{method}</p>
                  <h3 className="text-2xl font-bold">{money(total)}</h3>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold">
              Bienvenido, {user?.full_name || 'Administrador American Burger'}!
            </h2>
            <p className="text-gray-600 mt-2">Sistema POS conectado a Supabase y Render.</p>
            <button onClick={loadDashboard} className="mt-4 bg-black text-yellow-400 px-5 py-3 rounded-lg font-bold">
              Actualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
