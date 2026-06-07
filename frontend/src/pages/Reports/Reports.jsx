import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://american-burger-pos-api-d8r1.onrender.com/api'

const money = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

const paymentLabel = (method) =>
  ({
    cash: 'Efectivo',
    debit: 'Débito',
    credit: 'Crédito',
    transfer: 'Transferencia'
  }[method] || method || 'Sin medio')

const typeLabel = (type) =>
  ({
    counter: 'Mostrador',
    delivery: 'Delivery'
  }[type] || type || 'Mostrador')

const statusLabel = (status) =>
  ({
    paid: 'Pagado',
    pending: 'Pendiente',
    preparing: 'Preparando',
    ready: 'Listo',
    completed: 'Completado',
    cancelled: 'Cancelado',
    entregado: 'Entregado'
  }[String(status || '').toLowerCase()] || status || 'Sin estado')

const Reports = () => {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

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

  const loadReports = async () => {
    setLoading(true)
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

    setLoading(false)
  }

  useEffect(() => {
    loadReports()
  }, [])

  const filteredOrders = useMemo(() => {
    if (!selectedDate) return orders

    return orders.filter((order) => {
      const orderDate = new Date(order.created_at || Date.now())
        .toISOString()
        .slice(0, 10)

      return orderDate === selectedDate
    })
  }, [orders, selectedDate])

  const totalSales = filteredOrders.reduce(
    (sum, order) => sum + Number(order.total || order.total_amount || 0),
    0
  )

  const completedOrders = filteredOrders.filter((order) => {
    const status = String(order.status || '').toLowerCase()
    return status === 'paid' || status === 'completed' || status === 'entregado'
  })

  const pendingOrders = filteredOrders.filter((order) => {
    const status = String(order.status || '').toLowerCase()
    return status !== 'paid' && status !== 'completed' && status !== 'entregado'
  })

  const averageTicket =
    filteredOrders.length > 0 ? totalSales / filteredOrders.length : 0

  const salesByPayment = filteredOrders.reduce((acc, order) => {
    const method = order.payment_method || order.paymentMethod || 'Sin medio'
    acc[method] = (acc[method] || 0) + Number(order.total || order.total_amount || 0)

    return acc
  }, {})

  const salesByType = filteredOrders.reduce((acc, order) => {
    const type = order.type || order.order_type || 'counter'
    acc[type] = (acc[type] || 0) + Number(order.total || order.total_amount || 0)

    return acc
  }, {})

  const topProducts = useMemo(() => {
    const map = {}

    filteredOrders.forEach((order) => {
      const items = order.items || order.order_items || []

      items.forEach((item) => {
        const name =
          item.name ||
          item.product_name ||
          item.name_snapshot ||
          'Producto sin nombre'

        const quantity = Number(item.quantity || 1)
        const unitPrice = Number(item.unit_price || item.price || 0)
        const subtotal = Number(item.subtotal || unitPrice * quantity)

        if (!map[name]) {
          map[name] = {
            name,
            quantity: 0,
            total: 0
          }
        }

        map[name].quantity += quantity
        map[name].total += subtotal
      })
    })

    return Object.values(map)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 15)
      .map((item, index) => ({
        ...item,
        position: index + 1,
        percentage: totalSales > 0 ? (item.total / totalSales) * 100 : 0
      }))
  }, [filteredOrders, totalSales])

  const bestProduct = topProducts[0]

  const exportCSV = () => {
    const rows = [
      ['Fecha', 'Pedido', 'Tipo', 'Medio pago', 'Estado', 'Total'],
      ...filteredOrders.map((order, index) => [
        new Date(order.created_at || Date.now()).toLocaleString('es-CL'),
        order.order_number || order.number || index + 1,
        typeLabel(order.type || order.order_type),
        paymentLabel(order.payment_method),
        statusLabel(order.status),
        Number(order.total || order.total_amount || 0)
      ])
    ]

    const csv = rows.map((row) => row.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `reporte-american-burger-${Date.now()}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  const exportProductsCSV = () => {
    const rows = [
      ['Ranking', 'Producto', 'Cantidad vendida', 'Total vendido', 'Participacion'],
      ...topProducts.map((item) => [
        item.position,
        item.name,
        item.quantity,
        item.total,
        `${item.percentage.toFixed(1)}%`
      ])
    ]

    const csv = rows.map((row) => row.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `top-productos-american-burger-${Date.now()}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Reportes" />

        <div className="main-content space-y-6 bg-gray-100">
          {error && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-5 py-4 rounded-xl font-bold">
              {error}
            </div>
          )}

          <div className="bg-black text-white rounded-2xl shadow-lg p-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <p className="text-yellow-400 font-bold tracking-wide">
                AMERICAN BURGER REPORTES
              </p>

              <h1 className="text-4xl font-black mt-1">
                Reporte ejecutivo de ventas
              </h1>

              <p className="text-gray-300 mt-1">
                Control de pedidos, formas de pago, canales de venta y productos más vendidos.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="date"
                className="px-4 py-3 rounded-xl text-black font-bold"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />

              <button
                onClick={() => setSelectedDate('')}
                className="bg-zinc-800 border border-zinc-700 px-5 py-3 rounded-xl font-bold"
              >
                Ver todo
              </button>

              <button
                onClick={loadReports}
                className="bg-yellow-400 text-black px-5 py-3 rounded-xl font-black"
              >
                🔄 Actualizar
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-md text-center py-14 text-gray-500 font-bold">
              Cargando reportes...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
                <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-yellow-400">
                  <p className="text-gray-500 font-bold">Ventas</p>
                  <h2 className="text-4xl font-black mt-2">{money(totalSales)}</h2>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-black">
                  <p className="text-gray-500 font-bold">Pedidos</p>
                  <h2 className="text-4xl font-black mt-2">
                    {filteredOrders.length}
                  </h2>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-green-500">
                  <p className="text-gray-500 font-bold">Ticket promedio</p>
                  <h2 className="text-4xl font-black mt-2">
                    {money(averageTicket)}
                  </h2>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-blue-500">
                  <p className="text-gray-500 font-bold">Productos activos</p>
                  <h2 className="text-4xl font-black mt-2">{products.length}</h2>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-red-500">
                  <p className="text-gray-500 font-bold">Pendientes</p>
                  <h2 className="text-4xl font-black mt-2">
                    {pendingOrders.length}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <h2 className="text-2xl font-black mb-4">Estado de pedidos</h2>

                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-3">
                      <span>Completados / pagados</span>
                      <strong className="text-green-600">
                        {completedOrders.length}
                      </strong>
                    </div>

                    <div className="flex justify-between border-b pb-3">
                      <span>Pendientes / activos</span>
                      <strong className="text-yellow-600">
                        {pendingOrders.length}
                      </strong>
                    </div>

                    <div className="flex justify-between border-b pb-3">
                      <span>Total pedidos</span>
                      <strong>{filteredOrders.length}</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-6">
                  <h2 className="text-2xl font-black mb-4">Medios de pago</h2>

                  {Object.keys(salesByPayment).length === 0 ? (
                    <p className="text-gray-500">Sin ventas registradas.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(salesByPayment).map(([method, total]) => (
                        <div key={method} className="border-b pb-3">
                          <div className="flex justify-between">
                            <span className="font-bold">
                              {paymentLabel(method)}
                            </span>
                            <strong>{money(total)}</strong>
                          </div>

                          <div className="bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{
                                width: `${totalSales > 0 ? (total / totalSales) * 100 : 0}%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow-md p-6">
                  <h2 className="text-2xl font-black mb-4">Canales de venta</h2>

                  {Object.keys(salesByType).length === 0 ? (
                    <p className="text-gray-500">Sin ventas registradas.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(salesByType).map(([type, total]) => (
                        <div key={type} className="border-b pb-3">
                          <div className="flex justify-between">
                            <span className="font-bold">{typeLabel(type)}</span>
                            <strong>{money(total)}</strong>
                          </div>

                          <div className="bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-black h-2 rounded-full"
                              style={{
                                width: `${totalSales > 0 ? (total / totalSales) * 100 : 0}%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="bg-black text-white rounded-2xl shadow-md p-6">
                  <p className="text-yellow-400 font-bold">Producto estrella</p>

                  {bestProduct ? (
                    <>
                      <h2 className="text-3xl font-black mt-2">
                        {bestProduct.name}
                      </h2>

                      <div className="mt-5 space-y-2">
                        <div className="flex justify-between">
                          <span>Unidades vendidas</span>
                          <strong>{bestProduct.quantity}</strong>
                        </div>

                        <div className="flex justify-between">
                          <span>Total vendido</span>
                          <strong>{money(bestProduct.total)}</strong>
                        </div>

                        <div className="flex justify-between">
                          <span>Participación</span>
                          <strong>{bestProduct.percentage.toFixed(1)}%</strong>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-300 mt-3">Sin ventas de productos.</p>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow-md p-6 xl:col-span-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-black">
                        Top 15 productos más vendidos
                      </h2>
                      <p className="text-gray-500">
                        Ranking por cantidad vendida y facturación.
                      </p>
                    </div>

                    <button
                      onClick={exportProductsCSV}
                      className="bg-black text-yellow-400 font-bold px-4 py-3 rounded-xl"
                    >
                      Exportar Top 15
                    </button>
                  </div>

                  {topProducts.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                      No hay productos vendidos.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border">
                      <table className="w-full text-left">
                        <thead className="bg-black text-yellow-400">
                          <tr>
                            <th className="py-4 px-4">#</th>
                            <th className="px-4">Producto</th>
                            <th className="px-4">Cantidad</th>
                            <th className="px-4">Total vendido</th>
                            <th className="px-4">Participación</th>
                          </tr>
                        </thead>

                        <tbody>
                          {topProducts.map((item) => (
                            <tr key={item.name} className="border-b hover:bg-yellow-50">
                              <td className="py-4 px-4 font-black">
                                {item.position}
                              </td>

                              <td className="px-4 font-bold">{item.name}</td>

                              <td className="px-4">{item.quantity}</td>

                              <td className="px-4 font-black">
                                {money(item.total)}
                              </td>

                              <td className="px-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-gray-200 rounded-full h-2 w-24">
                                    <div
                                      className="bg-yellow-400 h-2 rounded-full"
                                      style={{ width: `${item.percentage}%` }}
                                    />
                                  </div>

                                  <strong>{item.percentage.toFixed(1)}%</strong>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-black">Últimos pedidos</h2>
                    <p className="text-gray-500">
                      Últimas ventas registradas en el sistema.
                    </p>
                  </div>

                  <button
                    onClick={exportCSV}
                    className="bg-black text-yellow-400 font-bold px-4 py-3 rounded-xl"
                  >
                    Exportar CSV
                  </button>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">
                    No hay pedidos registrados.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left">
                      <thead className="bg-black text-yellow-400">
                        <tr>
                          <th className="py-4 px-4">Fecha</th>
                          <th className="px-4">Pedido</th>
                          <th className="px-4">Tipo</th>
                          <th className="px-4">Medio pago</th>
                          <th className="px-4">Estado</th>
                          <th className="px-4 text-right">Total</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredOrders.slice(0, 20).map((order, index) => (
                          <tr key={order.id || index} className="border-b hover:bg-yellow-50">
                            <td className="py-4 px-4">
                              {new Date(order.created_at || Date.now()).toLocaleString('es-CL')}
                            </td>

                            <td className="px-4 font-bold">
                              #{order.order_number || order.number || index + 1}
                            </td>

                            <td className="px-4">
                              {typeLabel(order.type || order.order_type)}
                            </td>

                            <td className="px-4">
                              {paymentLabel(order.payment_method)}
                            </td>

                            <td className="px-4">
                              {statusLabel(order.status)}
                            </td>

                            <td className="px-4 text-right font-black">
                              {money(order.total || order.total_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports
