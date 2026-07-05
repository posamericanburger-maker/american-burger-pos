import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { printWebOrderDocuments } from '../utils/orderPrinters'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://american-burger-pos-api-d8r1.onrender.com/api'

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

const getCustomerAddress = (order) =>
  order.customer?.address || order.customer_address || ''

const getOrderItems = (order) =>
  order.items || order.order_items || []

const openWhatsApp = (order) => {
  const phone = getCustomerPhone(order)

  if (!phone) return

  const text = encodeURIComponent(
    `Hola ${getCustomerName(order)} 👋\n\nTu pedido fue aceptado en American Burger 🍔.\nYa comenzó su preparación.\n\nTiempo estimado: 20 a 30 minutos.`
  )

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
}

function GlobalWebOrderAlert() {
  const location = useLocation()

  const [order, setOrder] = useState(null)
  const [visible, setVisible] = useState(false)

  const shownIdsRef = useRef(new Set())

  const getToken = () =>
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    ''

  const isPosArea = () => {
    const path = location.pathname

    return (
      !path.startsWith('/tienda') &&
      !path.startsWith('/seguimiento') &&
      !path.startsWith('/login')
    )
  }

  const playAlertSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(950, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(700, audioContext.currentTime + 0.2)
      oscillator.frequency.setValueAtTime(950, audioContext.currentTime + 0.4)

      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.45, audioContext.currentTime + 0.03)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.95)

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 1)
    } catch {
      // Navegadores pueden bloquear audio hasta interacción del usuario.
    }
  }

  const fetchOrders = async () => {
    const token = getToken()

    if (!token || !isPosArea()) return []

    const response = await fetch(`${API_URL}/orders`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })

    const data = await response.json()

    return (
      data.orders ||
      data.data ||
      data.items ||
      (Array.isArray(data) ? data : [])
    )
  }

  const loadOrderDetail = async (id) => {
    const token = getToken()

    const response = await fetch(`${API_URL}/orders/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })

    const data = await response.json()

    return data.order || data.data || data
  }

  const showOrderAlert = async (rawOrder) => {
    if (!rawOrder?.id) return
    if (!isWebOrder(rawOrder)) return
    if (String(rawOrder.status || '').toLowerCase() !== 'pending') return
    if (shownIdsRef.current.has(rawOrder.id)) return

    shownIdsRef.current.add(rawOrder.id)

    try {
      const fullOrder = await loadOrderDetail(rawOrder.id)

      playAlertSound()
      setOrder(fullOrder)
      setVisible(true)
    } catch {
      playAlertSound()
      setOrder(rawOrder)
      setVisible(true)
    }
  }

  const checkPendingWebOrders = async () => {
    try {
      const orders = await fetchOrders()

      const pendingWeb = orders
        .filter((item) => isWebOrder(item))
        .filter((item) => String(item.status || '').toLowerCase() === 'pending')
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0]

      if (pendingWeb) {
        await showOrderAlert(pendingWeb)
      }
    } catch {
      // Silencioso para no molestar en pantallas del POS.
    }
  }

  const updateStatus = async (id, status) => {
    const token = getToken()

    await fetch(`${API_URL}/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ status })
    })
  }

  const acceptOrder = async () => {
    if (!order?.id) return

    await updateStatus(order.id, 'preparing')

    printWebOrderDocuments(order)

    openWhatsApp(order)

    setVisible(false)
    setOrder(null)
  }

  const rejectOrder = async () => {
    if (!order?.id) return

    await updateStatus(order.id, 'cancelled')

    setVisible(false)
    setOrder(null)
  }

  useEffect(() => {
    if (!isPosArea()) return

    checkPendingWebOrders()

    const channel = supabase
      .channel('global-web-order-alert-v3')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          showOrderAlert(payload.new)
        }
      )
      .subscribe()

    const interval = setInterval(() => {
      checkPendingWebOrders()
    }, 5000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [location.pathname])

  if (!visible || !order) return null

  const items = getOrderItems(order)

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-black text-white p-6">
          <p className="text-yellow-400 font-black tracking-widest">
            🔔 NUEVO PEDIDO WEB
          </p>

          <h2 className="text-3xl font-black mt-2">
            Pedido #{order.order_number || order.number || 'nuevo'}
          </h2>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-3">
            <p>
              <span className="font-black">Cliente:</span>{' '}
              {getCustomerName(order)}
            </p>

            {getCustomerPhone(order) && (
              <p>
                <span className="font-black">WhatsApp:</span>{' '}
                +{getCustomerPhone(order)}
              </p>
            )}

            <p>
              <span className="font-black">Tipo:</span>{' '}
              {order.type || order.order_type || 'Pedido web'}
            </p>

            <p>
              <span className="font-black">Pago:</span>{' '}
              {order.payment_method || 'Pendiente'}
            </p>
          </div>

          {getCustomerAddress(order) && (
            <div className="bg-gray-50 border rounded-2xl p-4">
              <p className="font-black">Dirección</p>
              <p className="text-gray-700 mt-1">
                {getCustomerAddress(order)}
              </p>
            </div>
          )}

          <p className="text-4xl font-black text-green-700">
            {money(order.total || order.total_amount || 0)}
          </p>

          <div className="bg-gray-50 border rounded-2xl p-4">
            <h3 className="font-black mb-3">
              Contenido del pedido
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-gray-500">
                  No se cargaron productos del pedido.
                </p>
              ) : (
                items.map((item, index) => {
                  const quantity = Number(item.quantity || 1)
                  const price = Number(item.price || item.unit_price || 0)
                  const subtotal = Number(item.subtotal || quantity * price)
                  const name =
                    item.name ||
                    item.product_name ||
                    item.name_snapshot ||
                    'Producto'

                  return (
                    <div
                      key={item.id || index}
                      className="flex justify-between gap-3 border-b pb-2 last:border-b-0"
                    >
                      <div>
                        <p className="font-black">
                          {quantity} x {name}
                        </p>

                        <p className="text-sm text-gray-500">
                          {money(price)} c/u
                        </p>
                      </div>

                      <strong>
                        {money(subtotal)}
                      </strong>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {order.notes && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4 text-sm">
              <p className="font-black mb-1">Notas</p>
              {order.notes}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={acceptOrder}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-black"
          >
            Aceptar + Imprimir
          </button>

          <button
            type="button"
            onClick={rejectOrder}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-black"
          >
            Rechazar
          </button>

          {getCustomerPhone(order) && (
            <button
              type="button"
              onClick={() => openWhatsApp(order)}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-black"
            >
              WhatsApp
            </button>
          )}

          <button
            type="button"
            onClick={() => setVisible(false)}
            className="bg-gray-200 hover:bg-gray-300 text-black px-5 py-3 rounded-xl font-black"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default GlobalWebOrderAlert
