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

const typeLabel = (type) => {
  const cleanType = String(type || '').toLowerCase()

  if (cleanType === 'counter') return 'Mostrador'
  if (cleanType === 'delivery') return 'Delivery'

  return type || 'Mostrador'
}

const statusLabel = (status) => {
  const cleanStatus = String(status || '').toLowerCase()

  if (cleanStatus === 'paid') return 'Pendiente'
  if (cleanStatus === 'pending') return 'Pendiente'
  if (cleanStatus === 'preparing') return 'Preparando'
  if (cleanStatus === 'ready') return 'Listo'
  if (cleanStatus === 'completed') return 'Entregado'
  if (cleanStatus === 'cancelled') return 'Cancelado'

  return status || 'Pendiente'
}

const getMinutesAgo = (dateValue) => {
  const created = new Date(dateValue || Date.now()).getTime()
  const now = Date.now()
  const diff = Math.max(0, Math.floor((now - created) / 60000))

  if (diff <= 0) return 'Ahora'
  if (diff === 1) return '1 min'

  return `${diff} min`
}

const getOrderPriority = (order) => {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(order.created_at || Date.now()).getTime()) / 60000)
  )

  if (minutes >= 20) return 'danger'
  if (minutes >= 10) return 'warning'

  return 'normal'
}

const getCardStyle = (order) => {
  const status = String(order.status || '').toLowerCase()
  const priority = getOrderPriority(order)

  if (status === 'ready') {
    return 'border-l-8 border-green-600 bg-green-50'
  }

  if (status === 'preparing') {
    return 'border-l-8 border-yellow-400 bg-yellow-50'
  }

  if (priority === 'danger') {
    return 'border-l-8 border-red-600 bg-red-50'
  }

  if (priority === 'warning') {
    return 'border-l-8 border-orange-400 bg-orange-50'
  }

  return 'border-l-8 border-black bg-white'
}

const Kitchen = () => {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  const getToken = () =>
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    ''

  const loadOrders = async () => {
    try {
      const token = getToken()

      const response = await fetch(`${API_URL}/orders`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })

      const data = await response.json()

      const list =
        data.orders ||
        data.data ||
        data.items ||
        (Array.isArray(data) ? data : [])

      const kitchenOrders = list.filter((order) => {
        const status = String(order.status || '').toLowerCase()

        return status !== 'completed' && status !== 'cancelled'
      })

      setOrders(kitchenOrders)
      setError('')
      setLastUpdate(new Date())
    } catch {
      setError('No se pudieron cargar pedidos de cocina')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()

    const interval = setInterval(loadOrders, 7000)

    return () => clearInterval(interval)
  }, [])

  const updateStatus = async (id, status) => {
    try {
      const token = getToken()

      await fetch(`${API_URL}/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      })

      loadOrders()
    } catch {
      setError('No se pudo actualizar el pedido')
    }
  }

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders

    return orders.filter((order) => {
      const type = String(order.type || order.order_type || '').toLowerCase()

      return type === filter
    })
  }, [orders, filter])

  const stats = useMemo(() => {
    return {
      total: orders.length,
      counter: orders.filter((order) => String(order.type || order.order_type || '').toLowerCase() === 'counter').length,
      delivery: orders.filter((order) => String(order.type || order.order_type || '').toLowerCase() === 'delivery').length,
      preparing: orders.filter((order) => String(order.status || '').toLowerCase() === 'preparing').length,
      ready: orders.filter((order) => String(order.status || '').toLowerCase() === 'ready').length
    }
  }, [orders])

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="KDS - Cocina" />

        <div className="main-content space-y-5 bg-gray-100">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-5 py-4 rounded-xl font-bold">
              {error}
            </div>
          )}

          <div className="bg-black text-white rounded-2xl shadow-lg p-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <p className="text-yellow-400 font-bold tracking-wide">
                AMERICAN BURGER KDS
              </p>

              <h2 className="text-4xl font-black mt-1">
                Cocina en tiempo real
              </h2>

              <p className="text-gray-300 mt-1">
                Pedidos activos para preparación y entrega.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-3">
                <p className="text-gray-400 text-sm">Última actualización</p>
                <p className="font-bold">
                  {lastUpdate
                    ? lastUpdate.toLocaleTimeString('es-CL')
                    : 'Cargando...'}
                </p>
              </div>

              <button
                onClick={loadOrders}
                className="bg-yellow-400 text-black px-6 py-3 rounded-xl font-black hover:bg-white transition-all"
              >
                🔄 Actualizar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-black">
              <p className="text-gray-500 font-bold">Activos</p>
              <h3 className="text-4xl font-black">{stats.total}</h3>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-yellow-400">
              <p className="text-gray-500 font-bold">Mostrador</p>
              <h3 className="text-4xl font-black">{stats.counter}</h3>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-blue-500">
              <p className="text-gray-500 font-bold">Delivery</p>
              <h3 className="text-4xl font-black">{stats.delivery}</h3>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-orange-400">
              <p className="text-gray-500 font-bold">Preparando</p>
              <h3 className="text-4xl font-black">{stats.preparing}</h3>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-green-600">
              <p className="text-gray-500 font-bold">Listos</p>
              <h3 className="text-4xl font-black">{stats.ready}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex flex-wrap gap-3">
              {[
                ['all', '📋 Todos', stats.total],
                ['counter', '🛒 Mostrador', stats.counter],
                ['delivery', '🚗 Delivery', stats.delivery]
              ].map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`px-5 py-3 rounded-xl font-black border ${
                    filter === value
                      ? 'bg-black text-yellow-400 border-black'
                      : 'bg-yellow-50 text-black border-yellow-300 hover:bg-yellow-100'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-md text-center py-14 text-gray-500 font-bold">
              Cargando pedidos de cocina...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md text-center py-14">
              <p className="text-5xl mb-3">✅</p>
              <p className="text-2xl font-black">
                No hay pedidos pendientes en cocina.
              </p>
              <p className="text-gray-500 mt-1">
                Todo está al día.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
              {filteredOrders.map((order, index) => {
                const items = order.items || order.order_items || []
                const status = String(order.status || '').toLowerCase()
                const orderType = String(order.type || order.order_type || 'counter').toLowerCase()
                const priority = getOrderPriority(order)

                return (
                  <div
                    key={order.id || index}
                    className={`rounded-2xl shadow-md p-5 ${getCardStyle(order)}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-3xl font-black">
                            Pedido #{order.order_number || order.number || index + 1}
                          </h3>

                          {priority === 'danger' && (
                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black">
                              URGENTE
                            </span>
                          )}

                          {priority === 'warning' && (
                            <span className="bg-orange-400 text-black px-3 py-1 rounded-full text-xs font-black">
                              ATENCIÓN
                            </span>
                          )}
                        </div>

                        <p className="text-gray-500 font-bold">
                          {new Date(order.created_at || Date.now()).toLocaleTimeString('es-CL')}
                          {' '}• Hace {getMinutesAgo(order.created_at)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-4 py-2 rounded-full text-sm font-black ${
                            orderType === 'delivery'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {orderType === 'delivery' ? '🚗 DELIVERY' : '🛒 MOSTRADOR'}
                        </span>

                        <p className="mt-2 text-sm text-gray-500 font-bold">
                          {statusLabel(order.status)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      {items.length > 0 ? (
                        items.map((item, itemIndex) => (
                          <div
                            key={item.id || itemIndex}
                            className="flex justify-between gap-3 border-b pb-3"
                          >
                            <div className="flex gap-3">
                              <div className="bg-black text-yellow-400 rounded-xl min-w-12 h-12 flex items-center justify-center text-xl font-black">
                                {item.quantity || 1}x
                              </div>

                              <div>
                                <p className="text-xl font-black">
                                  {item.name || item.product_name || 'Producto'}
                                </p>

                                {item.category_name && (
                                  <p className="text-sm text-gray-500">
                                    {item.category_name}
                                  </p>
                                )}
                              </div>
                            </div>

                            <strong className="text-lg">
                              {money(item.subtotal || item.price || item.unit_price || 0)}
                            </strong>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">
                          Sin detalle de productos.
                        </p>
                      )}
                    </div>

                    {order.notes && (
                      <div className="bg-white border-l-4 border-red-500 p-4 rounded-xl mb-4">
                        <p className="font-black text-red-600 mb-1">
                          NOTA IMPORTANTE
                        </p>
                        <p className="text-lg font-bold">
                          {order.notes}
                        </p>
                      </div>
                    )}

                    {order.customer_address && (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-4">
                        <p className="font-black text-blue-700 mb-1">
                          DIRECCIÓN DELIVERY
                        </p>
                        <p className="font-bold">
                          {order.customer_address}
                        </p>

                        {order.customer_phone && (
                          <p className="text-sm text-blue-700 mt-1">
                            WhatsApp: {order.customer_phone}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => updateStatus(order.id, 'preparing')}
                        disabled={status === 'preparing'}
                        className="bg-yellow-400 text-black font-black py-4 rounded-xl disabled:opacity-50"
                      >
                        🔥 Preparando
                      </button>

                      <button
                        onClick={() => updateStatus(order.id, 'ready')}
                        disabled={status === 'ready'}
                        className="bg-green-600 text-white font-black py-4 rounded-xl disabled:opacity-50"
                      >
                        ✅ Listo
                      </button>

                      <button
                        onClick={() => updateStatus(order.id, 'completed')}
                        className="bg-black text-yellow-400 font-black py-4 rounded-xl col-span-2"
                      >
                        📦 Entregado / Finalizar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Kitchen
