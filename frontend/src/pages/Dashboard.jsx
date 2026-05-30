import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import useAuth from '../hooks/useAuth'

const API_URL = import.meta.env.VITE_API_URL || 'https://american-burger-pos-api-d8r1.onrender.com/api'

const money = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

const Dashboard = () => {
  const { user } = useAuth()

  const [salesToday, setSalesToday] = useState(0)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [cashSessions, setCashSessions] = useState([])
  const [error, setError] = useState('')

  const getToken = () =>
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    ''

  const request = async (path) => {
    const token = getToken()

    const response = await fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })

    const text = await response.text()
    let data = null

    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { message: text }
    }

    if (!response.ok) {
      throw new Error(data?.message || 'Error de conexión')
    }

    return data
  }

  const getList = (data, keys = []) => {
    if (Array.isArray(data)) return data

    for (const key of keys) {
      if (Array.isArray(data?.[key])) return data[key]
    }

    if (Array.isArray(data?.data)) return data.data
    if (Array.isArray(data?.items)) return data.items

    return []
  }

  const loadDashboard = async () => {
    setError('')

    const [ordersResult, productsResult, cashResult] = await Promise.allSettled([
      request('/orders'),
      request('/products'),
      request('/cash/sessions')
    ])

    let ordersList = []
    let productsList = []
    let sessionsList = []

    if (ordersResult.status === 'fulfilled') {
      ordersList = getList(ordersResult.value, ['orders'])
      setOrders(ordersList)
    }

    if (productsResult.status === 'fulfilled') {
      productsList = getList(productsResult.value, ['products'])
      setProducts(productsList)
    }

    if (cashResult.status === 'fulfilled') {
      sessionsList = getList(cashResult.value, ['sessions', 'cash_sessions'])
      setCashSessions(sessionsList)
    }

    if (
      ordersResult.status === 'rejected' &&
      productsResult.status === 'rejected' &&
      cashResult.status === 'rejected'
    ) {
      setError('No se pudo cargar el dashboard')
    }

    const today = new Date().toISOString().slice(0, 10)

    const todaySales = ordersList
      .filter((order) => {
        const date = String(order.created_at || '').slice(0, 10)
        const status = String(order.status || '').toLowerCase()

        return (
          date === today &&
          status !== 'cancelled' &&
          status !== 'anulado'
        )
      })
      .reduce(
        (sum, order) =>
          sum + Number(order.total || order.total_amount || 0),
        0
      )

    setSalesToday(todaySales)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const activeCash = cashSessions.find((session) => {
    const status = String(session.status || '').toLowerCase()
    return status === 'open' || status === 'abierta' || (!session.closed_at && status !== 'closed')
  })

  const activeOrders = orders.filter((order) => {
    const status = String(order.status || '').toLowerCase()
    return (
      status !== 'completed' &&
      status !== 'cancelled' &&
      status !== 'entregado' &&
      status !== 'anulado'
    )
  })

  const activeProducts = products.filter((product) => product.active !== false)

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Dashboard" />

        <div className="main-content">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="card">
              <div className="text-gray-600 text-sm font-medium">
                Ventas Hoy
              </div>

              <div className="text-3xl font-poppins font-bold text-black mt-2">
                {money(salesToday)}
              </div>

              <div className="text-xs text-gray-500 mt-1">
                Total vendido hoy
              </div>
            </div>

            <div className="card">
              <div className="text-gray-600 text-sm font-medium">
                Pedidos
              </div>

              <div className="text-3xl font-poppins font-bold text-black mt-2">
                {activeOrders.length}
              </div>

              <div className="text-xs text-gray-500 mt-1">
                Activos
              </div>
            </div>

            <div className="card">
              <div className="text-gray-600 text-sm font-medium">
                Estado Caja
              </div>

              <div
                className={`text-3xl font-poppins font-bold mt-2 ${
                  activeCash ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {activeCash ? 'ABIERTA' : 'CERRADA'}
              </div>

              <div className="text-xs text-gray-500 mt-1">
                {activeCash
                  ? `Inicial: ${money(activeCash.opening_amount || activeCash.initial_amount || 0)}`
                  : 'Abre caja para vender'}
              </div>
            </div>

            <div className="card">
              <div className="text-gray-600 text-sm font-medium">
                Productos
              </div>

              <div className="text-3xl font-poppins font-bold text-black mt-2">
                {activeProducts.length}
              </div>

              <div className="text-xs text-gray-500 mt-1">
                Activos
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-poppins font-bold mb-4">
                  Bienvenido, {user?.full_name || user?.name || 'Administrador'}!
                </h2>

                <p className="text-gray-600">
                  Sistema POS conectado a Supabase y Render.
                </p>
              </div>

              <button
                onClick={loadDashboard}
                className="bg-black text-yellow-400 font-bold px-5 py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition-all"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
