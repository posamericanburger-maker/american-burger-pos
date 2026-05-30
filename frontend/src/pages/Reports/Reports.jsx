import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL = import.meta.env.VITE_API_URL || 'https://american-burger-pos-api-d8r1.onrender.com/api'

const money = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

const Reports = () => {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
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

  useEffect(() => {
    const load = async () => {
      setError('')

      const [ordersResult, productsResult] = await Promise.allSettled([
        request('/orders'),
        request('/products')
      ])

      if (ordersResult.status === 'fulfilled') {
        setOrders(getList(ordersResult.value, ['orders']))
      }

      if (productsResult.status === 'fulfilled') {
        setProducts(getList(productsResult.value, ['products']))
      }

      if (ordersResult.status === 'rejected' && productsResult.status === 'rejected') {
        setError('No se pudieron cargar los reportes')
      }
    }

    load()
  }, [])

  const totalSales = orders.reduce(
    (sum, order) => sum + Number(order.total || order.total_amount || 0),
    0
  )

  const completedOrders = orders.filter((order) => {
    const status = String(order.status || '').toLowerCase()
    return status === 'paid' || status === 'completed' || status === 'entregado'
  })

  const pendingOrders = orders.filter((order) => {
    const status = String(order.status || '').toLowerCase()
    return status !== 'paid' && status !== 'completed' && status !== 'entregado'
  })

  const averageTicket = orders.length > 0 ? totalSales / orders.length : 0

  const salesByPayment = orders.reduce((acc, order) => {
    const method = order.payment_method || order.paymentMethod || 'Sin medio'
    acc[method] = (acc[method] || 0) + Number(order.total || order.total_amount || 0)
    return acc
  }, {})

  const exportCSV = () => {
    const rows = [
      ['Fecha', 'Pedido', 'Tipo', 'Medio pago', 'Estado', 'Total'],
      ...orders.map((order, index) => [
        new Date(order.created_at || Date.now()).toLocaleString('es-CL'),
        order.order_number || order.number || index + 1,
        order.type || order.order_type || 'Mostrador',
        order.payment_method || 'Sin medio',
        order.status || 'Sin estado',
        Number(order.total || order.total_amount || 0)
      ])
    ]

    const csv = rows.map((row) => row.join(';')).join('\\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `reporte-american-burger-${Date.now()}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-container">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Reportes" />

        <div className="main-content space-y-6">
          {error && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-gray-500">Ventas totales</p>
              <h2 className="text-3xl font-bold">{money(totalSales)}</h2>
            </div>

            <div className="card">
              <p className="text-gray-500">Pedidos</p>
              <h2 className="text-3xl font-bold">{orders.length}</h2>
            </div>

            <div className="card">
              <p className="text-gray-500">Ticket promedio</p>
              <h2 className="text-3xl font-bold">{money(averageTicket)}</h2>
            </div>

            <div className="card">
              <p className="text-gray-500">Productos</p>
              <h2 className="text-3xl font-bold">{products.length}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="text-2xl font-poppins font-bold mb-4">
                Estado de pedidos
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span>Completados / pagados</span>
                  <strong className="text-green-600">{completedOrders.length}</strong>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span>Pendientes</span>
                  <strong className="text-yellow-600">{pendingOrders.length}</strong>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span>Total pedidos</span>
                  <strong>{orders.length}</strong>
                </div>
              </div>
            </div>

            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-poppins font-bold">
                  Ventas por medio de pago
                </h2>

                <button
                  onClick={exportCSV}
                  className="bg-black text-yellow-400 font-bold px-4 py-2 rounded-lg"
                >
                  Exportar CSV
                </button>
              </div>

              {Object.keys(salesByPayment).length === 0 ? (
                <p className="text-gray-500">Sin ventas registradas.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(salesByPayment).map(([method, total]) => (
                    <div key={method} className="flex justify-between border-b pb-2">
                      <span>{method}</span>
                      <strong>{money(total)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-2xl font-poppins font-bold mb-4">
              Últimos pedidos
            </h2>

            {orders.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                No hay pedidos registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="py-3">Fecha</th>
                      <th>Pedido</th>
                      <th>Tipo</th>
                      <th>Medio pago</th>
                      <th>Estado</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.slice(0, 20).map((order, index) => (
                      <tr key={order.id || index} className="border-b">
                        <td className="py-3">
                          {new Date(order.created_at || Date.now()).toLocaleString('es-CL')}
                        </td>
                        <td>#{order.order_number || order.number || index + 1}</td>
                        <td>{order.type || order.order_type || 'Mostrador'}</td>
                        <td>{order.payment_method || 'Sin medio'}</td>
                        <td>{order.status || 'Sin estado'}</td>
                        <td className="text-right font-bold">
                          {money(order.total || order.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
