import { useEffect, useRef, useState } from 'react'
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

const openWhatsApp = (order) => {
  const phone = getCustomerPhone(order)

  if (!phone) return

  const text = encodeURIComponent(
    `Hola ${getCustomerName(order)} 👋\n\nTu pedido fue aceptado en American Burger 🍔.\nYa comenzó su preparación.\n\nTiempo estimado: 20 a 30 minutos.`
  )

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
}

function GlobalWebOrderAlert() {
  const [order, setOrder] = useState(null)
  const [visible, setVisible] = useState(false)
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
      oscillator.frequency.setValueAtTime(700, audioContext.currentTime + 0.2)
      oscillator.frequency.setValueAtTime(950, audioContext.currentTime + 0.4)

      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.45, audioContext.currentTime + 0.03)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.95)

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 1)
    } catch (error) {
      console.warn('No se pudo reproducir sonido de alerta', error)
    }
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
    const channel = supabase
      .channel('global-web-order-alert')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          if (!initializedRef.current) {
            initializedRef.current = true
            return
          }

          const newOrder = payload.new

          if (!newOrder || !isWebOrder(newOrder)) return

          try {
            const fullOrder = await loadOrderDetail(newOrder.id)

            playAlertSound()
            setOrder(fullOrder)
            setVisible(true)
          } catch {
            playAlertSound()
            setOrder(newOrder)
            setVisible(true)
          }
        }
      )
      .subscribe()

    initializedRef.current = true

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (!visible || !order) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-black text-white p-6">
          <p className="text-yellow-400 font-black tracking-widest">
            🔔 NUEVO PEDIDO WEB
          </p>

          <h2 className="text-3xl font-black mt-2">
            Pedido #{order.order_number || order.number || 'nuevo'}
          </h2>
        </div>

        <div className="p-6 space-y-3">
          <p>
            <span className="font-black">Cliente:</span>{' '}
            {getCustomerName(order)}
          </p>

          {getCustomerPhone(order) && (
            <p>
              <span className="font-black">WhatsApp:</span> +{getCustomerPhone(order)}
            </p>
          )}

          <p>
            <span className="font-black">Tipo:</span>{' '}
            {order.type || order.order_type || 'Pedido web'}
          </p>

          {order.customer_address && (
            <p>
              <span className="font-black">Dirección:</span>{' '}
              {order.customer_address}
            </p>
          )}

          <p>
            <span className="font-black">Pago:</span>{' '}
            {order.payment_method || 'Pendiente'}
          </p>

          <p className="text-4xl font-black text-green-700">
            {money(order.total || order.total_amount || 0)}
          </p>

          {order.notes && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4 text-sm">
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
