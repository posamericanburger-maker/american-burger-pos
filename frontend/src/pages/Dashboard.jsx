import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import useAuth from '../hooks/useAuth'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://american-burger-pos-api-d8r1.onrender.com/api'

const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

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

const Dashboard = () => {
  const { user } = useAuth()

  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [cashSessions, setCashSessions] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const getToken = () =>
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    ''

  const request = async (path, options = {}) => {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
        ...(options.headers || {})
      }
    })

    const text = await res.text()
    let data = null

    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { message: text }
    }

    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Error de conexión')
    }

    return data
  }

  const loadDashboard = async () => {
    try {
      setError('')
      setMessage('')

      const [ordersData, productsData, cashData] = await Promise.all([
        request('/orders'),
        request('/products'),
        request('/cash/sessions')
      ])

      setOrders(ordersData.orders || [])
      setProducts((productsData.products || []).filter((p) => p.active !== false))
      setCashSessions(cashData.sessions || cashData.cash_sessions || [])
    } catch (err) {
      setError(err.message || 'No se pudo cargar el dashboard')
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const activeCash = cashSessions.find((s) => {
    const status = String(s.status || '').toLowerCase()
    return status === 'open' || status === 'abierta'
  })

  const cashOpenDate = activeCash
    ? new Date(
        activeCash.opened_at ||
          activeCash.created_at ||
          activeCash.start_date ||
          activeCash.fecha_apertura
      )
    : null

  const todayOrders = activeCash
    ? orders.filter((order) => {
        const orderDate = new Date(order.created_at)
        return cashOpenDate && orderDate >= cashOpenDate
      })
    : []

  const salesToday = todayOrders.reduce(
    (sum, order) => sum + Number(order.total || order.total_amount || 0),
    0
  )

  const salesByType = todayOrders.reduce((acc, order) => {
    const type = order.order_type || order.type || 'counter'
    acc[type] = (acc[type] || 0) + Number(order.total || order.total_amount || 0)
    return acc
  }, {})

  const salesByPayment = todayOrders.reduce((acc, order) => {
    const method = order.payment_method || 'Sin medio'
    acc[method] =
      (acc[method] || 0) + Number(order.total || order.total_amount || 0)
    return acc
  }, {})

  const avgTicket =
    todayOrders.length > 0 ? salesToday / todayOrders.length : 0

  const exportExcel = () => {
    const detalleVentas = []

    orders.forEach((order) => {
      const fecha = new Date(order.created_at)
      const items = order.items || []

      items.forEach((item) => {
        detalleVentas.push({
          Fecha: fecha.toLocaleDateString('es-CL'),
          Hora: fecha.toLocaleTimeString('es-CL'),
          TipoVenta: typeLabel(order.order_type || order.type),
          MedioPago: paymentLabel(order.payment_method),
          Cliente: order.customer_name || '',
          WhatsApp: order.customer_phone || '',
          Direccion: order.customer_address || '',
          Producto: item.name || item.product_name || item.name_snapshot || '',
          Categoria: item.category_name || 'Sin categoría',
          Cantidad: Number(item.quantity || 1),
          PrecioUnitario: Number(item.unit_price || item.price || 0),
          Subtotal: Number(item.subtotal || 0),
          TotalPedido: Number(order.total || order.total_amount || 0),
          Notas: order.notes || ''
        })
      })
    })

    const workbook = XLSX.utils.book_new()
    const wsDetalle = XLSX.utils.json_to_sheet(detalleVentas)

    XLSX.utils.book_append_sheet(workbook, wsDetalle, 'Detalle Ventas')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    })

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    saveAs(blob, `Ventas_American_Burger_${Date.now()}.xlsx`)
  }

  const printCustomerReceipt = (order) => {
    const items = order.items || []
    const total = Number(order.total || order.total_amount || 0)

    const productLines = items
      .map((item) => {
        const quantity = Number(item.quantity || 1)
        const price = Number(item.unit_price || item.price || 0)
        const lineTotal = Number(item.subtotal || quantity * price)

        return `
          <div class="product">
            <div>
              <strong>${quantity} x ${
                item.name ||
                item.product_name ||
                item.name_snapshot ||
                'Producto'
              }</strong>
              <br />
              <span>${money(price)} c/u</span>
            </div>
            <div class="right">${money(lineTotal)}</div>
          </div>
        `
      })
      .join('')

    const html = `
      <html>
        <head>
          <title>Recibo Cliente</title>
          <style>
            @page { size: 80mm auto; margin: 0; }

            body {
              width: 80mm;
              margin: 0;
              padding: 6mm 4mm;
              font-family: Arial, monospace;
              font-size: 12px;
              color: #000;
              background: #fff;
            }

            .center { text-align: center; }
            .brand { font-size: 22px; font-weight: 900; margin: 0; }
            .small { font-size: 11px; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }

            .row,
            .product {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              margin: 6px 0;
            }

            .right {
              text-align: right;
              white-space: nowrap;
            }

            .total {
              font-size: 18px;
              font-weight: 900;
            }

            .thanks {
              font-size: 12px;
              margin-top: 10px;
              text-align: center;
            }
          </style>
        </head>

        <body>
          <div class="center">
            <h1 class="brand">AMERICAN BURGER</h1>
            <div>ARICA - CHILE</div>
            <div class="small">RECIBO DE COMPRA</div>
          </div>

          <div class="line"></div>

          <div class="row">
            <span>Fecha</span>
            <span>${new Date(order.created_at).toLocaleDateString('es-CL')}</span>
          </div>

          <div class="row">
            <span>Hora</span>
            <span>${new Date(order.created_at).toLocaleTimeString('es-CL')}</span>
          </div>

          <div class="row">
            <span>Tipo</span>
            <span>${typeLabel(order.order_type || order.type)}</span>
          </div>

          <div class="row">
            <span>Pago</span>
            <span>${paymentLabel(order.payment_method)}</span>
          </div>

          <div class="line"></div>

          ${productLines}

          <div class="line"></div>

          <div class="row total">
            <span>TOTAL</span>
            <span>${money(total)}</span>
          </div>

          <div class="center small">Precios con IVA incluido</div>

          <div class="line"></div>

          <div class="thanks">
            Gracias por tu compra<br />
            🍔 American Burger 🍔
          </div>
        </body>
      </html>
    `

    const win = window.open('', '_blank')
    if (!win) return

    win.document.write(html)
    win.document.close()
    win.focus()

    setTimeout(() => {
      win.print()
    }, 500)
  }

  const sendOrderWhatsApp = (order) => {
    const phone = String(order.customer_phone || '').replace(/\D/g, '')

    if (!phone) {
      alert('Esta venta no tiene número de WhatsApp registrado')
      return
    }

    const items = order.items || []
    const total = Number(order.total || order.total_amount || 0)
    const deliveryFee = Number(order.delivery_fee || 0)
    const subtotal = Number(order.subtotal || total - deliveryFee)

    const productsText = items
      .map((item) => {
        const qty = Number(item.quantity || 1)
        const price = Number(item.unit_price || item.price || 0)
        const lineTotal = Number(item.subtotal || qty * price)
        const name =
          item.name || item.product_name || item.name_snapshot || 'Producto'

        return `🍔 ${name}

${qty} x ${money(price)} = ${money(lineTotal)}`
      })
      .join('\n\n')

    const message = encodeURIComponent(`🍔 AMERICAN BURGER

Hola ${order.customer_name || 'cliente'} 👋

Tu pedido fue recibido correctamente.

${productsText}

Subtotal: ${money(subtotal)}
Delivery: ${money(deliveryFee)}
TOTAL: ${money(total)}

Pago: ${paymentLabel(order.payment_method)}

Dirección:
${order.customer_address || 'No registrada'}

Notas:
${order.notes || 'Sin observaciones'}

Gracias por preferir American Burger 🍔`)

    const finalPhone = phone.startsWith('56') ? phone : `56${phone}`

    window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank')
  }

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Dashboard" />

        <div className="main-content space-y-6 bg-gray-100">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-5 py-4 rounded-xl font-bold">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-5 py-4 rounded-xl font-bold">
              {message}
            </div>
          )}

          <div className="bg-black text-white rounded-2xl shadow-lg p-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <p className="text-yellow-400 font-bold tracking-wide">
                AMERICAN BURGER POS
              </p>
              <h1 className="text-3xl font-black mt-1">
                Resumen operativo del día
              </h1>
              <p className="text-gray-300 mt-1">
                Control de ventas, caja, medios de pago y registro de pedidos.
              </p>
            </div>

            <div
              className={`px-5 py-3 rounded-xl font-black text-lg ${
                activeCash
                  ? 'bg-green-500 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {activeCash ? '🟢 CAJA ABIERTA' : '🔴 CAJA CERRADA'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-yellow-400">
              <p className="text-gray-500 font-bold">Ventas caja actual</p>
              <h2 className="text-4xl font-black mt-2">{money(salesToday)}</h2>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-black">
              <p className="text-gray-500 font-bold">Pedidos</p>
              <h2 className="text-4xl font-black mt-2">{todayOrders.length}</h2>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-green-500">
              <p className="text-gray-500 font-bold">Ticket promedio</p>
              <h2 className="text-4xl font-black mt-2">{money(avgTicket)}</h2>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-red-500">
              <p className="text-gray-500 font-bold">Estado caja</p>
              <h2
                className={`text-3xl font-black mt-2 ${
                  activeCash ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {activeCash ? 'ABIERTA' : 'CERRADA'}
              </h2>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-gray-400">
              <p className="text-gray-500 font-bold">Productos activos</p>
              <h2 className="text-4xl font-black mt-2">{products.length}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-2xl font-black">Ventas por canal</h2>
                  <p className="text-gray-500">
                    Mostrador y delivery de la caja abierta.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(salesByType).length === 0 ? (
                  <div className="border rounded-xl p-5">
                    <p className="text-gray-500">Sin ventas</p>
                    <h3 className="text-3xl font-black">{money(0)}</h3>
                  </div>
                ) : (
                  Object.entries(salesByType).map(([type, total]) => (
                    <div
                      key={type}
                      className="border rounded-xl p-5 bg-gray-50"
                    >
                      <p className="text-gray-500 font-bold">
                        {typeLabel(type)}
                      </p>
                      <h3 className="text-3xl font-black mt-2">
                        {money(total)}
                      </h3>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-2xl font-black">Medios de pago</h2>
                  <p className="text-gray-500">
                    Distribución de ventas por forma de pago.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(salesByPayment).length === 0 ? (
                  <div className="border rounded-xl p-5">
                    <p className="text-gray-500">Sin pagos</p>
                    <h3 className="text-3xl font-black">{money(0)}</h3>
                  </div>
                ) : (
                  Object.entries(salesByPayment).map(([method, total]) => (
                    <div
                      key={method}
                      className="border rounded-xl p-5 bg-gray-50"
                    >
                      <p className="text-gray-500 font-bold">
                        {paymentLabel(method)}
                      </p>
                      <h3 className="text-3xl font-black mt-2">
                        {money(total)}
                      </h3>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-black">Registro de ventas</h2>
                <p className="text-gray-500">
                  Historial completo de ventas. Puedes ver, imprimir o reenviar por WhatsApp.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={loadDashboard}
                  className="bg-gray-100 hover:bg-gray-200 text-black px-5 py-3 rounded-xl font-bold"
                >
                  🔄 Actualizar
                </button>

                <button
                  onClick={exportExcel}
                  className="bg-black text-yellow-400 px-5 py-3 rounded-xl font-bold"
                >
                  📊 Descargar Excel
                </button>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="text-center text-gray-500 py-12 border rounded-xl">
                No hay ventas registradas.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left">
                  <thead className="bg-black text-yellow-400">
                    <tr>
                      <th className="py-4 px-4">Fecha</th>
                      <th className="px-4">Hora</th>
                      <th className="px-4">Canal</th>
                      <th className="px-4">Pago</th>
                      <th className="px-4">Productos</th>
                      <th className="px-4">Total</th>
                      <th className="px-4 text-right">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order) => {
                      const date = new Date(order.created_at)
                      const items = order.items || []
                      const total = Number(order.total || order.total_amount || 0)

                      return (
                        <tr key={order.id} className="border-b hover:bg-yellow-50">
                          <td className="py-4 px-4 font-semibold">
                            {date.toLocaleDateString('es-CL')}
                          </td>

                          <td className="px-4">
                            {date.toLocaleTimeString('es-CL')}
                          </td>

                          <td className="px-4">
                            <span className="bg-gray-100 px-3 py-1 rounded-full font-bold text-sm">
                              {typeLabel(order.order_type || order.type)}
                            </span>
                          </td>

                          <td className="px-4">
                            {paymentLabel(order.payment_method)}
                          </td>

                          <td className="px-4">{items.length}</td>

                          <td className="px-4 font-black">
                            {money(total)}
                          </td>

                          <td className="px-4 text-right">
                            <div className="flex justify-end gap-2 flex-wrap">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="bg-yellow-400 text-black px-3 py-2 rounded-lg font-bold"
                              >
                                Ver
                              </button>

                              <button
                                onClick={() => printCustomerReceipt(order)}
                                className="bg-black text-yellow-400 px-3 py-2 rounded-lg font-bold"
                              >
                                Imprimir
                              </button>

                              <button
                                onClick={() => sendOrderWhatsApp(order)}
                                className="bg-green-600 text-white px-3 py-2 rounded-lg font-bold"
                              >
                                WhatsApp
                              </button>
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

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-black">
              Bienvenido, {user?.full_name || 'Administrador American Burger'}
            </h2>

            <p className="text-gray-500 mt-2">
              Sistema POS conectado a Supabase y Render.
            </p>
          </div>
        </div>

        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-3xl font-black">Detalle de venta</h2>
                  <p className="text-gray-500">
                    {new Date(selectedOrder.created_at).toLocaleString('es-CL')}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold"
                >
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="border rounded-xl p-4 bg-gray-50">
                  <p className="text-gray-500 font-bold">Canal</p>
                  <h3 className="text-xl font-black">
                    {typeLabel(selectedOrder.order_type || selectedOrder.type)}
                  </h3>
                </div>

                <div className="border rounded-xl p-4 bg-gray-50">
                  <p className="text-gray-500 font-bold">Pago</p>
                  <h3 className="text-xl font-black">
                    {paymentLabel(selectedOrder.payment_method)}
                  </h3>
                </div>

                <div className="border rounded-xl p-4 bg-gray-50">
                  <p className="text-gray-500 font-bold">Total</p>
                  <h3 className="text-xl font-black">
                    {money(selectedOrder.total || selectedOrder.total_amount || 0)}
                  </h3>
                </div>
              </div>

              <h3 className="text-2xl font-black mb-3">Productos</h3>

              <div className="overflow-x-auto mb-6 rounded-xl border">
                <table className="w-full text-left">
                  <thead className="bg-black text-yellow-400">
                    <tr>
                      <th className="py-4 px-4">Producto</th>
                      <th className="px-4">Categoría</th>
                      <th className="px-4">Cantidad</th>
                      <th className="px-4">Precio</th>
                      <th className="px-4">Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(selectedOrder.items || []).map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-4 px-4 font-bold">
                          {item.name || item.product_name || item.name_snapshot}
                        </td>

                        <td className="px-4">
                          {item.category_name || 'Sin categoría'}
                        </td>

                        <td className="px-4">{item.quantity}</td>

                        <td className="px-4">
                          {money(item.unit_price || item.price || 0)}
                        </td>

                        <td className="px-4 font-bold">
                          {money(item.subtotal || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedOrder.notes && (
                <div className="border rounded-xl p-4 mb-6 bg-gray-50">
                  <p className="text-gray-500 font-bold">Notas</p>
                  <p className="font-semibold">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 flex-wrap">
                <button
                  onClick={() => sendOrderWhatsApp(selectedOrder)}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-bold"
                >
                  WhatsApp Cliente
                </button>

                <button
                  onClick={() => printCustomerReceipt(selectedOrder)}
                  className="bg-black text-yellow-400 px-5 py-3 rounded-xl font-bold"
                >
                  Imprimir recibo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
