import { useEffect, useRef, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'https://american-burger-pos-api-d8r1.onrender.com/api'

const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const cleanPhone = (phone = '') => String(phone).replace(/[^0-9]/g, '')

const isWebOrder = (order) => String(order.notes || '').includes('[WEB]')

const getCustomerName = (order) =>
  order.customer?.name || order.customer_name || 'Cliente'

const getCustomerPhone = (order) =>
  cleanPhone(order.customer_phone || order.customer?.phone || '')

const openWhatsApp = (order) => {
  const phone = getCustomerPhone(order)
  if (!phone) return

  const text = encodeURIComponent(
    `Hola ${getCustomerName(order)} 👋\n\nTu pedido fue aceptado en American Burger 🍔.\nYa comenzó su preparación.\n\nTiempo estimado: 20 a 30 minutos.`
  )

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
}

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [newOrderModal, setNewOrderModal] = useState(null)

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
      oscillator.frequency.setValueAtTime(950, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(680, audioContext.currentTime + 0.2)
      oscillator.frequency.setValueAtTime(950, audioContext.currentTime + 0.4)

      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.45, audioContext.currentTime + 0.03)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.9)

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.95)
    } catch (err) {
      console.warn('No se pudo reproducir alerta sonora', err)
    }
  }

  const normalizeOrders = (list = []) => {
    return [...list].sort((a, b) => {
      const aWeb = isWebOrder(a)
      const bWeb = isWebOrder(b)

      if (aWeb && !bWeb) return -1
      if (!aWeb && bWeb) return 1

      const aPending = String(a.status || '').toLowerCase() === 'pending'
      const bPending = String(b.status || '').toLowerCase() === 'pending'

      if (aPending && !bPending) return -1
      if (!aPending && bPending) return 1

      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    })
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

      setOrders(normalizeOrders(list))
    } catch {
      setError('No se pudieron cargar los pedidos')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()

    const channel = supabase
      .channel('orders-live')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          await loadOrders({ silent: true })

          if (initializedRef.current) {
            const order = payload.new

            if (order && isWebOrder(order)) {
              playAlertSound()
              setMessage('🔔 Nuevo pedido web recibido')
              setNewOrderModal(order)
            }
          }

          initializedRef.current = true
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        () => {
          loadOrders({ silent: true })
        }
      )
      .subscribe()

    initializedRef.current = true

    return () => {
      supabase.removeChannel(channel)
    }
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
      await loadOrders({ silent: true })
    } catch {
      setError('No se pudo actualizar el pedido')
    }
  }

  const acceptOrder = async (order) => {
    await updateStatus(order.id, 'preparing')
    setNewOrderModal(null)

    if (getCustomerPhone(order)) {
      openWhatsApp(order)
    }
  }

  const rejectOrder = async (order) => {
    await updateStatus(order.id, 'cancelled')
    setNewOrderModal(null)
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
                  Pedidos en vivo
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
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {orders.map((order, index) => {
                  const web = isWebOrder(order)
                  const phone = getCustomerPhone(order)
                  const status = String(order.status || 'pending').toLowerCase()

                  return (
                    <article
                      key={order.id || index}
                      className={`rounded-2xl border p-5 ${
                        web && status === 'pending'
                          ? 'bg-yellow-50 border-yellow-400'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-500 font-bold">
                            Pedido
                          </p>

                          <h3 className="text-2xl font-black">
                            #{order.order_number || order.number || index + 1}
                          </h3>
                        </div>

                        {web ? (
                          <span className="bg-yellow-400 text-black px-3 py-1 h-fit rounded-full text-xs font-black">
                            WEB
                          </span>
                        ) : (
                          <span className="bg-gray-200 text-gray-700 px-3 py-1 h-fit rounded-full text-xs font-bold">
                            POS
                          </span>
                        )}
                      </div>

                      <div className="mt-4 space-y-2">
                        <p>
                          <span className="font-bold">Cliente:</span>{' '}
                          {getCustomerName(order)}
                        </p>

                        {phone && (
                          <p>
                            <span className="font-bold">Teléfono:</span> +{phone}
                          </p>
                        )}

                        <p>
                          <span className="font-bold">Tipo:</span>{' '}
                          {order.type || order.order_type || 'Mostrador'}
                        </p>

                        {order.customer_address && (
                          <p>
                            <span className="font-bold">Dirección:</span>{' '}
                            {order.customer_address}
                          </p>
                        )}

                        <p>
                          <span className="font-bold">Estado:</span>{' '}
                          {order.status || 'Pendiente'}
                        </p>

                        <p className="text-2xl font-black text-green-700">
                          {money(order.total || order.total_amount || 0)}
                        </p>

                        {order.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                            {order.notes}
                          </p>
                        )}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <select
                          className="input"
                          value={order.status || 'pending'}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="preparing">Preparando</option>
                          <option value="ready">Listo</option>
                          <option value="completed">Entregado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>

                        {status === 'pending' && (
                          <button
                            onClick={() => acceptOrder(order)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-bold"
                          >
                            Aceptar
                          </button>
                        )}

                        {status === 'pending' && (
                          <button
                            onClick={() => rejectOrder(order)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-bold"
                          >
                            Rechazar
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
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {newOrderModal && (
        <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center px-4">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-black text-white p-6">
              <p className="text-yellow-400 font-black tracking-widest">
                🔔 NUEVO PEDIDO WEB
              </p>

              <h2 className="text-3xl font-black mt-2">
                Pedido #{newOrderModal.order_number || newOrderModal.number || 'nuevo'}
              </h2>
            </div>

            <div className="p-6 space-y-3">
              <p>
                <span className="font-black">Cliente:</span>{' '}
                {getCustomerName(newOrderModal)}
              </p>

              {getCustomerPhone(newOrderModal) && (
                <p>
                  <span className="font-black">Teléfono:</span> +{getCustomerPhone(newOrderModal)}
                </p>
              )}

              <p>
                <span className="font-black">Tipo:</span>{' '}
                {newOrderModal.type || newOrderModal.order_type || 'Pedido web'}
              </p>

              {newOrderModal.customer_address && (
                <p>
                  <span className="font-black">Dirección:</span>{' '}
                  {newOrderModal.customer_address}
                </p>
              )}

              <p>
                <span className="font-black">Estado:</span>{' '}
                {newOrderModal.status || 'Pendiente'}
              </p>

              <p className="text-4xl font-black text-green-700">
                {money(newOrderModal.total || newOrderModal.total_amount || 0)}
              </p>

              {newOrderModal.notes && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4 text-sm">
                  {newOrderModal.notes}
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 flex flex-wrap gap-3">
              <button
                onClick={() => acceptOrder(newOrderModal)}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-black"
              >
                Aceptar
              </button>

              <button
                onClick={() => rejectOrder(newOrderModal)}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-black"
              >
                Rechazar
              </button>

              {getCustomerPhone(newOrderModal) && (
                <button
                  onClick={() => openWhatsApp(newOrderModal)}
                  className="bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-black"
                >
                  WhatsApp
                </button>
              )}

              <button
                onClick={() => setNewOrderModal(null)}
                className="bg-gray-200 hover:bg-gray-300 text-black px-5 py-3 rounded-xl font-black"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
