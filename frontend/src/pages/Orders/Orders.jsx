import { useEffect, useRef, useState } from 'react'
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

const cleanPhone = (phone = '') => String(phone).replace(/[^0-9]/g, '')

const isWebOrder = (order) => {
  return String(order.notes || '').includes('[WEB]')
}

const openWhatsApp = (order) => {
  const phone = cleanPhone(order.customer_phone || order.customer?.phone || '')

  if (!phone) return

  const text = encodeURIComponent(
    `Hola ${order.customer_name || order.customer?.name || ''}, recibimos tu pedido en American Burger 🍔. Ya lo estamos preparando.`
  )

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
}

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const knownPendingIdsRef = useRef(new Set())
  const initializedRef = useRef(false)

  const getToken = () =>
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    ''

  const playAlertSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.2)

      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.4, audioContext.currentTime + 0.03)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.7)

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.75)
    } catch (err) {
      console.warn('No se pudo reproducir alerta sonora', err)
    }
  }

  const loadOrders = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
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

      const pendingIds = new Set(
        list
          .filter((order) => String(order.status || '').toLowerCase() === 'pending')
          .map((order) => order.id)
          .filter(Boolean)
      )

      if (initializedRef.current) {
        const hasNewPending = [...pendingIds].some(
          (id) => !knownPendingIdsRef.current.has(id)
        )

        if (hasNewPending) {
          playAlertSound()
          setMessage('🔔 Nuevo pedido recibido')
        }
      }

      knownPendingIdsRef.current = pendingIds
      initializedRef.current = true

      setOrders(list)
    } catch (err) {
      setError('No se pudieron cargar los pedidos')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()

    const interval = setInterval(() => {
      loadOrders({ silent: true })
    }, 15000)

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

      setMessage('Estado actualizado')
      loadOrders()
    } catch {
      setError('No se pudo actualizar el pedido')
    }
  }

  const acceptOrder = async (order) => {
    await updateStatus(order.id, 'preparing')

    const phone = cleanPhone(order.customer_phone || order.customer?.phone || '')

    if (phone) {
      openWhatsApp(order)
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
                onClick={() => loadOrders()}
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
                      <th>Canal</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order, index) => {
                      const web = isWebOrder(order)
                      const phone = cleanPhone(order.customer_phone || order.customer?.phone || '')

                      return (
                        <tr
                          key={order.id || index}
                          className={`border-b ${
                            web && String(order.status).toLowerCase() === 'pending'
                              ? 'bg-yellow-50 hover:bg-yellow-100'
                              : 'hover:bg-gray-50'
                          }`}
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
                            <div className="font-semibold">
                              {order.customer?.name ||
                                order.customer_name ||
                                '-'}
                            </div>

                            {phone && (
                              <div className="text-xs text-gray-500">
                                +{phone}
                              </div>
                            )}
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
                            {web ? (
                              <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-black">
                                WEB
                              </span>
                            ) : (
                              <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
                                POS
                              </span>
                            )}
                          </td>

                          <td>
                            <div className="flex flex-wrap gap-2">
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

                              {String(order.status || '').toLowerCase() === 'pending' && (
                                <button
                                  onClick={() => acceptOrder(order)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-bold"
                                >
                                  Aceptar
                                </button>
                              )}

                              {phone && (
                                <button
                                  onClick={() => openWhatsApp(order)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-bold"
                                >
                                  WhatsApp
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
