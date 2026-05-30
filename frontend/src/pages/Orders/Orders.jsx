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

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const getToken = () =>
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    ''

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError('')

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

      setOrders(list)
    } catch (err) {
      setError('No se pudieron cargar los pedidos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
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

      setMessage('Estado actualizado')
      loadOrders()
    } catch {
      setError('No se pudo actualizar el pedido')
    }
  }

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Gestión de Pedidos" />

        <div className="main-content space-y-6">

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-poppins font-bold">
                  Pedidos
                </h2>

                <p className="text-gray-600">
                  Total de pedidos: {orders.length}
                </p>
              </div>

              <button
                onClick={loadOrders}
                className="bg-black text-yellow-400 px-4 py-2 rounded-lg font-bold"
              >
                Actualizar
              </button>
            </div>

            {loading ? (
              <div className="text-center py-10">
                Cargando pedidos...
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No existen pedidos registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="py-3">Pedido</th>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Cliente</th>
                      <th>Estado</th>
                      <th>Total</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order, index) => (
                      <tr
                        key={order.id || index}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-3 font-semibold">
                          #{order.order_number || order.number || index + 1}
                        </td>

                        <td>
                          {new Date(
                            order.created_at || Date.now()
                          ).toLocaleString('es-CL')}
                        </td>

                        <td>
                          {order.type ||
                            order.order_type ||
                            'Mostrador'}
                        </td>

                        <td>
                          {order.customer?.name ||
                            order.customer_name ||
                            '-'}
                        </td>

                        <td>
                          <span className="font-bold">
                            {order.status || 'Pendiente'}
                          </span>
                        </td>

                        <td className="font-bold">
                          {money(
                            order.total ||
                              order.total_amount ||
                              0
                          )}
                        </td>

                        <td>
                          <select
                            className="input"
                            value={order.status || 'pending'}
                            onChange={(e) =>
                              updateStatus(
                                order.id,
                                e.target.value
                              )
                            }
                          >
                            <option value="pending">
                              Pendiente
                            </option>

                            <option value="preparing">
                              Preparando
                            </option>

                            <option value="ready">
                              Listo
                            </option>

                            <option value="completed">
                              Entregado
                            </option>

                            <option value="cancelled">
                              Cancelado
                            </option>
                          </select>
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

export default Orders
