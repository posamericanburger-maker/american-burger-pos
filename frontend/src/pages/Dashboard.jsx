import { useEffect, useState } from 'react'import * as XLSX from 'xlsx'import { saveAs } from 'file-saver'import Sidebar from '../components/Sidebar'import Navbar from '../components/Navbar'import useAuth from '../hooks/useAuth'

const API_URL = import.meta.env.VITE_API_URL || 'https://american-burger-pos-api-d8r1.onrender.com/api'

const money = (value) =>new Intl.NumberFormat('es-CL', {style: 'currency',currency: 'CLP',maximumFractionDigits: 0}).format(Number(value || 0))

const paymentLabel = (method) => ({cash: 'Efectivo',debit: 'Débito',credit: 'Crédito',transfer: 'Transferencia'}[method] || method || 'Sin medio')

const typeLabel = (type) => ({counter: 'Mostrador',delivery: 'Delivery'}[type] || type || 'Mostrador')

const Dashboard = () => {const { user } = useAuth()const [orders, setOrders] = useState([])const [products, setProducts] = useState([])const [cashSessions, setCashSessions] = useState([])const [selectedOrder, setSelectedOrder] = useState(null)

const getToken = () => localStorage.getItem('token') || ''

const request = async (path) => {const res = await fetch(${API_URL}${path}, {headers: {'Content-Type': 'application/json',Authorization: Bearer ${getToken()}}})

return res.json()

}

const loadDashboard = async () => {const ordersData = await request('/orders')const productsData = await request('/products')const cashData = await request('/cash/sessions')

setOrders(ordersData.orders || [])
setProducts(productsData.products || [])
setCashSessions(cashData.sessions || [])

}

useEffect(() => {loadDashboard()}, [])

const today = new Date().toISOString().slice(0, 10)

const todayOrders = orders.filter((order) =>String(order.created_at || '').slice(0, 10) === today)

const salesToday = todayOrders.reduce((sum, order) => sum + Number(order.total || order.total_amount || 0),0)

const activeCash = cashSessions.find((s) => s.status === 'open')

const salesByType = todayOrders.reduce((acc, order) => {const type = order.order_type || order.type || 'counter'acc[type] = (acc[type] || 0) + Number(order.total || order.total_amount || 0)return acc}, {})

const salesByPayment = todayOrders.reduce((acc, order) => {const method = order.payment_method || 'Sin medio'acc[method] = (acc[method] || 0) + Number(order.total || order.total_amount || 0)return acc}, {})

const exportExcel = () => {const detalleVentas = []

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

const printCustomerReceipt = (order) => {const items = order.items || []const total = Number(order.total || order.total_amount || 0)

const productLines = items.map((item) => {
  const quantity = Number(item.quantity || 1)
  const price = Number(item.unit_price || item.price || 0)
  const lineTotal = Number(item.subtotal || quantity * price)

  return `
    <div class="product">
      <div>
        <strong>${quantity} x ${item.name || item.product_name || item.name_snapshot || 'Producto'}</strong>
        <br />
        <span>${money(price)} c/u</span>
      </div>
      <div class="right">${money(lineTotal)}</div>
    </div>
  `
}).join('')

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

        .brand {
          font-size: 22px;
          font-weight: 900;
          margin: 0;
        }

        .small { font-size: 11px; }

        .line {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }

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

      <div class="center small">
        Precios con IVA incluido
      </div>

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

const sendOrderWhatsApp = (order) => {const phone = String(order.customer_phone || '').replace(/\D/g, '')

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
    const name = item.name || item.product_name || item.name_snapshot || 'Producto'

    return `🍔 ${name}

${qty} x ${money(price)} = ${money(lineTotal)}`}).join('\n\n')

const message = encodeURIComponent(`🍔 AMERICAN BURGER

━━━━━━━━━━━━━━━━━━

Hola ${order.customer_name || 'cliente'} 👋

✅ Tu pedido fue recibido correctamente.

━━━━━━━━━━━━━━━━━━🧾 RESUMEN DEL PEDIDO━━━━━━━━━━━━━━━━━━

${productsText}

━━━━━━━━━━━━━━━━━━💰 RESUMEN DE PAGO━━━━━━━━━━━━━━━━━━

Subtotal: ${money(subtotal)}Delivery: ${money(deliveryFee)}TOTAL: ${money(total)}

💳 Pago:${paymentLabel(order.payment_method)}

━━━━━━━━━━━━━━━━━━📍 ENTREGA━━━━━━━━━━━━━━━━━━

Dirección:${order.customer_address || 'No registrada'}

━━━━━━━━━━━━━━━━━━📝 INDICACIONES━━━━━━━━━━━━━━━━━━

${order.notes || 'Sin observaciones'}

━━━━━━━━━━━━━━━━━━

Precios con IVA incluido.

Gracias por preferir🍔 AMERICAN BURGER

¡Buen provecho! 😋`)

const finalPhone = phone.startsWith('56') ? phone : `56${phone}`

window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank')

}

return (

  <div className="page-content">
    <Navbar title="Dashboard" />

    <div className="main-content space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-gray-600">Ventas Hoy</p>
          <h2 className="text-3xl font-bold">{money(salesToday)}</h2>
        </div>

        <div className="card">
          <p className="text-gray-600">Pedidos</p>
          <h2 className="text-3xl font-bold">{todayOrders.length}</h2>
        </div>

        <div className="card">
          <p className="text-gray-600">Estado Caja</p>
          <h2 className={`text-3xl font-bold ${activeCash ? 'text-green-600' : 'text-red-600'}`}>
            {activeCash ? 'ABIERTA' : 'CERRADA'}
          </h2>
        </div>

        <div className="card">
          <p className="text-gray-600">Productos</p>
          <h2 className="text-3xl font-bold">{products.length}</h2>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Detalle de ventas</h2>

          <button
            onClick={exportExcel}
            className="bg-black text-yellow-400 px-5 py-3 rounded-lg font-bold"
          >
            Descargar Excel
          </button>
        </div>

        <h3 className="font-bold mb-2">Por tipo de venta</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(salesByType).map(([type, total]) => (
            <div key={type} className="border rounded-lg p-4">
              <p>{typeLabel(type)}</p>
              <h3 className="text-2xl font-bold">{money(total)}</h3>
            </div>
          ))}
        </div>

        <h3 className="font-bold mb-2">Por medio de pago</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(salesByPayment).map(([method, total]) => (
            <div key={method} className="border rounded-lg p-4">
              <p>{paymentLabel(method)}</p>
              <h3 className="text-2xl font-bold">{money(total)}</h3>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold">Registro de ventas</h2>
            <p className="text-gray-600">
              Selecciona una venta para ver sus productos, imprimir o reenviar el detalle al cliente.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="bg-black text-yellow-400 px-5 py-3 rounded-lg font-bold"
          >
            Actualizar
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No hay ventas registradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3">Fecha</th>
                  <th>Hora</th>
                  <th>Tipo</th>
                  <th>Pago</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => {
                  const date = new Date(order.created_at)
                  const items = order.items || []
                  const total = Number(order.total || order.total_amount || 0)

                  return (
                    <tr key={order.id} className="border-b">
                      <td className="py-3">
                        {date.toLocaleDateString('es-CL')}
                      </td>

                      <td>{date.toLocaleTimeString('es-CL')}</td>

                      <td>{typeLabel(order.order_type || order.type)}</td>

                      <td>{paymentLabel(order.payment_method)}</td>

                      <td>{items.length}</td>

                      <td className="font-bold">{money(total)}</td>

                      <td className="text-right space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="bg-yellow-400 text-black px-3 py-2 rounded font-bold"
                        >
                          Ver
                        </button>

                        <button
                          onClick={() => printCustomerReceipt(order)}
                          className="bg-black text-yellow-400 px-3 py-2 rounded font-bold"
                        >
                          Imprimir
                        </button>

                        <button
                          onClick={() => sendOrderWhatsApp(order)}
                          className="bg-green-600 text-white px-3 py-2 rounded font-bold"
                        >
                          WhatsApp
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold">
          Bienvenido, {user?.full_name || 'Administrador American Burger'}!
        </h2>

        <p className="text-gray-600 mt-2">
          Sistema POS conectado a Supabase y Render.
        </p>
      </div>
    </div>

    {selectedOrder && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">Detalle de venta</h2>
              <p className="text-gray-600">
                {new Date(selectedOrder.created_at).toLocaleString('es-CL')}
              </p>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="text-red-600 font-bold text-xl"
            >
              X
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <p className="text-gray-500">Tipo</p>
              <h3 className="font-bold">
                {typeLabel(selectedOrder.order_type || selectedOrder.type)}
              </h3>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-gray-500">Medio de pago</p>
              <h3 className="font-bold">
                {paymentLabel(selectedOrder.payment_method)}
              </h3>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-gray-500">Total</p>
              <h3 className="font-bold">
                {money(selectedOrder.total || selectedOrder.total_amount || 0)}
              </h3>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-3">Productos comprados</h3>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3">Producto</th>
                  <th>Categoría</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>

              <tbody>
                {(selectedOrder.items || []).map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 font-semibold">
                      {item.name || item.product_name || item.name_snapshot}
                    </td>

                    <td>{item.category_name || 'Sin categoría'}</td>

                    <td>{item.quantity}</td>

                    <td>{money(item.unit_price || item.price || 0)}</td>

                    <td>{money(item.subtotal || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedOrder.notes && (
            <div className="border rounded-lg p-4 mb-6">
              <p className="text-gray-500">Notas</p>
              <p className="font-semibold">{selectedOrder.notes}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 flex-wrap">
            <button
              onClick={() => setSelectedOrder(null)}
              className="border px-5 py-3 rounded-lg"
            >
              Cerrar
            </button>

            <button
              onClick={() => sendOrderWhatsApp(selectedOrder)}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-bold"
            >
              WhatsApp Cliente
            </button>

            <button
              onClick={() => printCustomerReceipt(selectedOrder)}
              className="bg-black text-yellow-400 px-5 py-3 rounded-lg font-bold"
            >
              Imprimir recibo cliente
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
</div>

)}

export default Dashboard
