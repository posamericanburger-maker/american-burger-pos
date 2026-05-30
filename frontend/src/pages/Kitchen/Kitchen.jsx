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

const Kitchen = () => {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')

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
    } catch {
      setError('No se pudieron cargar pedidos de cocina')
    }
  }

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 10000)
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

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="KDS - Cocina" />

        <div className="main-content space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-poppins font-bold">
                Kitchen Display System
              </h2>

              <p className="text-gray-600">
                Pedidos activos para preparación.
              </p>
            </div>

            <button
              onClick={loadOrders}
              className="bg-black text-yellow-400 px-4 py-2 rounded-lg font-bold"
            >
              Actualizar
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              No hay pedidos pendientes en cocina.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {orders.map((order, index) => (
                <div
                  key={order.id || index}
                  className="card border-l-4 border-yellow-400"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">
                        Pedido #{order.order_number || order.number || index + 1}
                      </h3>

                      <p className="text-gray-500">
                        {new Date(order.created_at || Date.now()).toLocaleTimeString('es-CL')}
                      </p>
                    </div>

                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                      {order.type || order.order_type || 'Mostrador'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {(order.items || order.order_items || []).length > 0 ? (
                      (order.items || order.order_items || []).map((item, itemIndex) => (
                        <div
                          key={item.id || itemIndex}
                          className="flex justify-between border-b pb-2"
                        >
                          <span>
                            {item.quantity || 1} x {item.name || item.product_name || 'Producto'}
                          </span>

                          <strong>
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
                    <div className="bg-gray-100 p-3 rounded mb-4">
                      <strong>Nota:</strong> {order.notes}
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-4">
                    <span>Estado:</span>
                    <strong>{order.status || 'Pendiente'}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateStatus(order.id, 'preparing')}
                      className="bg-yellow-400 text-black font-bold py-2 rounded"
                    >
                      Preparando
                    </button>

                    <button
                      onClick={() => updateStatus(order.id, 'ready')}
                      className="bg-green-600 text-white font-bold py-2 rounded"
                    >
                      Listo
                    </button>

                    <button
                      onClick={() => updateStatus(order.id, 'completed')}
                      className="bg-black text-yellow-400 font-bold py-2 rounded col-span-2"
                    >
                      Entregado
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Kitchen
