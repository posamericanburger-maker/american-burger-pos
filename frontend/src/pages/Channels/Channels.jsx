import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL = import.meta.env.VITE_API_URL || 'https://american-burger-pos-api-d8r1.onrender.com/api'
const STORE_URL = 'https://american-burger-pos-web-mhc6.onrender.com/tienda'

const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const isWebOrder = (order) => String(order.notes || '').includes('[WEB]')

const Channels = () => {
  const [selected, setSelected] = useState(null)
  const [orders, setOrders] = useState([])
  const [message, setMessage] = useState('')

  const channels = [
    { key: 'pedidosya', name: 'PedidosYa', icon: '🛵', status: 'Desconectado' },
    { key: 'ubereats', name: 'Uber Eats', icon: '🚗', status: 'Desconectado' },
    { key: 'web', name: 'Página Web', icon: '🌐', status: 'Conectado' },
    { key: 'whatsapp', name: 'WhatsApp', icon: '📱', status: 'Preparado' }
  ]

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

      setOrders(list)
    } catch {
      setOrders([])
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const webStats = useMemo(() => {
    const webOrders = orders.filter(isWebOrder)

    const today = new Date().toISOString().slice(0, 10)

    const todayOrders = webOrders.filter((order) =>
      String(order.created_at || '').startsWith(today)
    )

    const pending = webOrders.filter((order) =>
      String(order.status || '').toLowerCase() === 'pending'
    )

    const salesToday = todayOrders.reduce(
      (sum, order) => sum + Number(order.total || order.total_amount || 0),
      0
    )

    const lastOrder = [...webOrders].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    )[0]

    return {
      totalWeb: webOrders.length,
      today: todayOrders.length,
      pending: pending.length,
      salesToday,
      lastOrder
    }
  }, [orders])

  const copyStoreLink = async () => {
    try {
      await navigator.clipboard.writeText(STORE_URL)
      setMessage('Link de tienda copiado')
    } catch {
      setMessage('No se pudo copiar el link')
    }
  }

  const openStore = () => {
    window.open(STORE_URL, '_blank')
  }

  const openQr = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=700x700&data=${encodeURIComponent(STORE_URL)}`
    window.open(qrUrl, '_blank')
  }

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Canales de Venta" />

        <div className="main-content space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Canales de Venta
            </h1>

            <p className="mt-3 text-gray-600">
              Administra la tienda online, WhatsApp y futuras integraciones externas.
            </p>
          </div>

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl font-bold">
              {message}
            </div>
          )}

          <div className="bg-black text-white rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <p className="text-yellow-400 font-black tracking-widest text-sm">
                  CENTRO DE CONTROL DIGITAL
                </p>

                <h2 className="text-3xl font-black mt-2">
                  Tienda Online American Burger
                </h2>

                <p className="text-gray-300 mt-2">
                  Canal conectado al POS para recibir pedidos web directamente.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openStore}
                  className="bg-yellow-400 text-black px-5 py-3 rounded-xl font-black"
                >
                  🌐 Abrir tienda
                </button>

                <button
                  type="button"
                  onClick={copyStoreLink}
                  className="bg-white text-black px-5 py-3 rounded-xl font-black"
                >
                  Copiar link
                </button>

                <button
                  type="button"
                  onClick={openQr}
                  className="bg-red-600 text-white px-5 py-3 rounded-xl font-black"
                >
                  Generar QR
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4 mt-8">
              <div className="bg-white/10 border border-white/10 rounded-2xl p-5">
                <p className="text-gray-300 font-bold">Estado</p>
                <p className="text-green-400 text-2xl font-black mt-2">
                  🟢 Conectado
                </p>
              </div>

              <div className="bg-white/10 border border-white/10 rounded-2xl p-5">
                <p className="text-gray-300 font-bold">Pedidos web hoy</p>
                <p className="text-yellow-400 text-3xl font-black mt-2">
                  {webStats.today}
                </p>
              </div>

              <div className="bg-white/10 border border-white/10 rounded-2xl p-5">
                <p className="text-gray-300 font-bold">Pendientes</p>
                <p className="text-yellow-400 text-3xl font-black mt-2">
                  {webStats.pending}
                </p>
              </div>

              <div className="bg-white/10 border border-white/10 rounded-2xl p-5">
                <p className="text-gray-300 font-bold">Ventas web hoy</p>
                <p className="text-yellow-400 text-2xl font-black mt-2">
                  {money(webStats.salesToday)}
                </p>
              </div>

              <div className="bg-white/10 border border-white/10 rounded-2xl p-5">
                <p className="text-gray-300 font-bold">Total web</p>
                <p className="text-yellow-400 text-3xl font-black mt-2">
                  {webStats.totalWeb}
                </p>
              </div>
            </div>

            <div className="mt-6 bg-white/10 border border-white/10 rounded-2xl p-5">
              <p className="text-gray-300 font-bold">
                URL pública
              </p>

              <p className="text-yellow-400 font-black break-all mt-2">
                {STORE_URL}
              </p>

              {webStats.lastOrder && (
                <p className="text-gray-300 mt-4">
                  Último pedido web:{' '}
                  <span className="text-white font-black">
                    #{webStats.lastOrder.order_number || webStats.lastOrder.number || webStats.lastOrder.id}
                  </span>{' '}
                  — {money(webStats.lastOrder.total || webStats.lastOrder.total_amount || 0)}
                </p>
              )}
            </div>
          </div>

          {selected && (
            <div className="bg-white border border-yellow-400 rounded-2xl p-6 shadow">
              <h2 className="text-2xl font-bold">
                Configurar {selected.name}
              </h2>

              {selected.key === 'web' ? (
                <>
                  <p className="mt-3 text-gray-600">
                    Tu página web ya está conectada al POS. Desde aquí puedes abrirla, copiar el link o generar un QR para clientes.
                  </p>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-xl p-4">
                      <p className="font-bold">Estado</p>
                      <p className="text-green-600 font-black">Conectado</p>
                    </div>

                    <div className="border rounded-xl p-4">
                      <p className="font-bold">Ruta pública</p>
                      <p className="text-sm text-gray-600 break-all">
                        /tienda
                      </p>
                    </div>

                    <div className="border rounded-xl p-4">
                      <p className="font-bold">Pedidos pendientes</p>
                      <p className="text-2xl font-black text-yellow-500">
                        {webStats.pending}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={openStore}
                      className="bg-yellow-400 text-black rounded-xl px-5 py-3 font-bold"
                    >
                      Abrir tienda
                    </button>

                    <button
                      type="button"
                      onClick={copyStoreLink}
                      className="bg-black text-yellow-400 rounded-xl px-5 py-3 font-bold"
                    >
                      Copiar link
                    </button>

                    <button
                      type="button"
                      onClick={openQr}
                      className="bg-red-600 text-white rounded-xl px-5 py-3 font-bold"
                    >
                      Generar QR
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="bg-gray-200 text-black rounded-xl px-5 py-3 font-bold"
                    >
                      Cerrar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-3 text-gray-600">
                    Este canal está preparado en el POS. Para conectarlo realmente se necesitan las credenciales/API del proveedor.
                  </p>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-xl p-4">
                      <p className="font-bold">Estado</p>
                      <p className="text-red-600">{selected.status}</p>
                    </div>

                    <div className="border rounded-xl p-4">
                      <p className="font-bold">Endpoint interno</p>
                      <p className="text-sm text-gray-600 break-all">
                        /api/external-orders
                      </p>
                    </div>

                    <div className="border rounded-xl p-4">
                      <p className="font-bold">Canal</p>
                      <p className="text-gray-600">{selected.key}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="mt-5 bg-black text-yellow-400 rounded-xl px-5 py-3 font-bold"
                  >
                    Cerrar
                  </button>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {channels.map((channel) => (
              <button
                key={channel.key}
                type="button"
                onClick={() => setSelected(channel)}
                className="bg-white rounded-2xl shadow p-6 border text-left hover:border-yellow-400 hover:shadow-lg transition-all"
              >
                <div className="text-5xl mb-3">{channel.icon}</div>
                <h2 className="text-xl font-bold">{channel.name}</h2>

                <p
                  className={`mt-2 font-bold ${
                    channel.status === 'Conectado'
                      ? 'text-green-600'
                      : channel.status === 'Preparado'
                        ? 'text-yellow-600'
                        : 'text-gray-500'
                  }`}
                >
                  {channel.status}
                </p>

                <div className="mt-4 w-full bg-yellow-400 rounded-xl py-2 font-bold text-center">
                  Configurar
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Channels
