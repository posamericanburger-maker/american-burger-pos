import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import logo from '../../NNN.png'
import { supabase } from '../../lib/supabase'

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://american-burger-pos-api-d8r1.onrender.com/api'

const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const steps = [
  { key: 'pending', title: 'Recibido', icon: '✅' },
  { key: 'preparing', title: 'Preparando', icon: '👨‍🍳' },
  { key: 'ready', title: 'Listo', icon: '📦' },
  { key: 'completed', title: 'Entregado', icon: '🍔' }
]

const statusIndex = (status = '') => {
  const current = String(status || '').toLowerCase()

  if (current === 'pending') return 0
  if (current === 'accepted') return 1
  if (current === 'preparing') return 1
  if (current === 'ready') return 2
  if (current === 'completed') return 3
  if (current === 'cancelled') return -1

  return 0
}

function Tracking() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [liveMessage, setLiveMessage] = useState('')

  const loadOrder = async () => {
    try {
      setError('')

      const response = await fetch(
        `${API_BASE_URL}/public-store/orders/${orderId}/status`
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo cargar el pedido')
      }

      setOrder(data.order)
    } catch (err) {
      setError(err.message || 'No se pudo cargar el pedido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()

    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          setOrder((current) => ({
            ...(current || {}),
            ...(payload.new || {})
          }))

          setLiveMessage('Estado actualizado en vivo')

          setTimeout(() => {
            setLiveMessage('')
          }, 3000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  const currentIndex = statusIndex(order?.status)

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-black/95 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <a href="/tienda" className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-yellow-400 p-1">
              <img
                src={logo}
                alt="American Burger"
                className="w-full h-full object-contain rounded-full"
              />
            </div>

            <div>
              <h1 className="text-xl font-black text-white">
                AMERICAN BURGER
              </h1>
              <p className="text-xs text-yellow-400 font-bold">
                Seguimiento en vivo
              </p>
            </div>
          </a>

          <a
            href="/tienda"
            className="bg-yellow-400 text-black px-5 py-3 rounded-2xl font-black"
          >
            Volver
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-12">
        {loading ? (
          <div className="bg-neutral-900 border border-white/10 rounded-[32px] p-10 text-center">
            Cargando pedido...
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 border border-red-400 rounded-[32px] p-10 text-center font-black">
            {error}
          </div>
        ) : (
          <div className="bg-neutral-900 border border-white/10 rounded-[36px] p-6 md:p-10">
            {liveMessage && (
              <div className="mb-6 bg-yellow-400 text-black rounded-2xl px-5 py-4 font-black">
                🔔 {liveMessage}
              </div>
            )}

            <p className="text-yellow-400 font-black tracking-widest text-sm">
              ESTADO DEL PEDIDO
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-3">
              Pedido #{order.order_number || order.number || order.id}
            </h2>

            <p className="text-neutral-400 mt-3">
              Puedes dejar esta página abierta. El estado se actualizará automáticamente.
            </p>

            <div className="mt-8 grid md:grid-cols-3 gap-4">
              <div className="bg-black/40 border border-white/10 rounded-3xl p-5">
                <p className="text-neutral-400 font-bold">Cliente</p>
                <p className="text-xl font-black mt-1">{order.customer_name}</p>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-3xl p-5">
                <p className="text-neutral-400 font-bold">Total</p>
                <p className="text-xl font-black text-yellow-400 mt-1">
                  {money(order.total || order.total_amount)}
                </p>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-3xl p-5">
                <p className="text-neutral-400 font-bold">Estado</p>
                <p className="text-xl font-black mt-1">
                  {order.status}
                </p>
              </div>
            </div>

            {String(order.status).toLowerCase() === 'cancelled' ? (
              <div className="mt-10 bg-red-600/20 border border-red-500 text-red-200 rounded-3xl p-6 font-black">
                Este pedido fue cancelado. Contacta a American Burger si necesitas más información.
              </div>
            ) : (
              <div className="mt-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {steps.map((step, index) => {
                    const active = index <= currentIndex

                    return (
                      <div
                        key={step.key}
                        className={`rounded-3xl p-5 border text-center transition ${
                          active
                            ? 'bg-yellow-400 text-black border-yellow-400 scale-[1.02]'
                            : 'bg-black/40 text-white border-white/10'
                        }`}
                      >
                        <div className="text-4xl">{step.icon}</div>
                        <p className="font-black mt-3">
                          {step.title}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-10 bg-black/40 border border-white/10 rounded-3xl p-6">
              <h3 className="text-2xl font-black mb-4">
                Detalle del pedido
              </h3>

              <div className="space-y-3">
                {(order.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between border-b border-white/10 pb-3"
                  >
                    <div>
                      <p className="font-black">
                        {item.name || item.product_name || item.name_snapshot}
                      </p>
                      <p className="text-neutral-400">
                        {money(item.price || item.unit_price)} x {item.quantity}
                      </p>
                    </div>

                    <strong className="text-yellow-400">
                      {money(item.subtotal)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Tracking
