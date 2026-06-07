import { useEffect, useMemo, useState } from 'react'
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
  const [editingOrder, setEditingOrder] = useState(null)
  const [editItems, setEditItems] = useState([])
  const [editNotes, setEditNotes] = useState('')
  const [editPaymentMethod, setEditPaymentMethod] = useState('cash')
  const [editProductSearch, setEditProductSearch] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
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

      const [ordersData, productsData, cashData] = await Promise.all([
        request('/orders'),
        request('/products'),
        request('/cash/sessions')
      ])

      setOrders(ordersData.orders || [])
      setProducts((productsData.products || []).filter((product) => product.active !== false))
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

  const canEditOrder = (order) => {
    if (!activeCash || !cashOpenDate) return false

    const orderDate = new Date(order.created_at)

    return orderDate >= cashOpenDate
  }

  const editSubtotal = useMemo(() => {
    return editItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    )
  }, [editItems])

  const editDeliveryFee = Number(editingOrder?.delivery_fee || 0)
  const editTotal = editSubtotal + editDeliveryFee

  const filteredEditProducts = products.filter((product) => {
    const text = `${product.name || ''} ${product.description || ''}`.toLowerCase()
    return text.includes(editProductSearch.toLowerCase())
  })

  const openEditOrder = (order) => {
    setError('')
    setMessage('')

    if (!canEditOrder(order)) {
      alert('No puedes editar esta venta. Solo se editan ventas de la caja abierta actual.')
      return
    }

    const items = order.items || []

    setEditingOrder(order)
    setEditNotes(order.notes || '')
    setEditPaymentMethod(order.payment_method || 'cash')
    setEditItems(
      items.map((item) => ({
        row_id: item.id || `${item.product_id}-${Date.now()}`,
        product_id: item.product_id || null,
        name: item.name || item.product_name || item.name_snapshot || 'Producto',
        category_name: item.category_name || 'Sin categoría',
        quantity: Number(item.quantity || 1),
        price: Number(item.unit_price || item.price || 0)
      }))
    )
  }

  const closeEditModal = () => {
    setEditingOrder(null)
    setEditItems([])
    setEditNotes('')
    setEditPaymentMethod('cash')
    setEditProductSearch('')
  }

  const updateEditQuantity = (rowId, quantity) => {
    const nextQuantity = Number(quantity)

    if (nextQuantity <= 0) {
      setEditItems((current) => current.filter((item) => item.row_id !== rowId))
      return
    }

    setEditItems((current) =>
      current.map((item) =>
        item.row_id === rowId
          ? { ...item, quantity: nextQuantity }
          : item
      )
    )
  }

  const removeEditItem = (rowId) => {
    setEditItems((current) => current.filter((item) => item.row_id !== rowId))
  }

  const addProductToEdit = (product) => {
    setEditItems((current) => {
      const exists = current.find((item) => item.product_id === product.id)

      if (exists) {
        return current.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...current,
        {
          row_id: `${product.id}-${Date.now()}`,
          product_id: product.id,
          name: product.name,
          category_name: product.category?.name || product.category_name || 'Sin categoría',
          quantity: 1,
          price: Number(product.price || 0)
        }
      ]
    })
  }

  const saveEditedOrder = async () => {
    setSavingEdit(true)
    setError('')
    setMessage('')

    try {
      if (!editingOrder) {
        throw new Error('No hay venta seleccionada')
      }

      if (!canEditOrder(editingOrder)) {
        throw new Error('No puedes editar ventas de una caja cerrada o anterior')
      }

      if (editItems.length === 0) {
        throw new Error('La venta debe tener al menos un producto')
      }

      const cleanItems = editItems.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        product_name: item.name,
        name_snapshot: item.name,
        category_name: item.category_name || 'Sin categoría',
        quantity: Number(item.quantity || 1),
        unit_price: Number(item.price || 0),
        price: Number(item.price || 0),
        subtotal: Number(item.price || 0) * Number(item.quantity || 1)
      }))

      const data = await request(`/orders/${editingOrder.id}/edit`, {
        method: 'PUT',
        body: JSON.stringify({
          items: cleanItems,
          notes: editNotes,
          payment_method: editPaymentMethod
        })
      })

      setMessage(data.message || 'Venta editada correctamente')
      closeEditModal()
      setSelectedOrder(null)
      await loadDashboard()
    } catch (err) {
      setError(err.message || 'No se pudo editar la venta')
    } finally {
      setSavingEdit(false)
    }
  }

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
          Producto:
            item.name || item.product_name || item.name_snapshot || '',
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

━━━━━━━━━━━━━━━━━━

Hola ${order.customer_name || 'cliente'} 👋

✅ Tu pedido fue recibido correctamente.

━━━━━━━━━━━━━━━━━━
🧾 RESUMEN DEL PEDIDO
━━━━━━━━━━━━━━━━━━

${productsText}

━━━━━━━━━━━━━━━━━━
💰 RESUMEN DE PAGO
━━━━━━━━━━━━━━━━━━

Subtotal: ${money(subtotal)}
Delivery: ${money(deliveryFee)}
TOTAL: ${money(total)}

💳 Pago: ${paymentLabel(order.payment_method)}

━━━━━━━━━━━━━━━━━━
📍 ENTREGA
━━━━━━━━━━━━━━━━━━

Dirección: ${order.customer_address || 'No registrada'}

━━━━━━━━━━━━━━━━━━
📝 INDICACIONES
━━━━━━━━━━━━━━━━━━

${order.notes || 'Sin observaciones'}

━━━━━━━━━━━━━━━━━━

Precios con IVA incluido.

Gracias por preferir 🍔 AMERICAN BURGER

¡Buen provecho! 😋`)

    const finalPhone = phone.startsWith('56') ? phone : `56${phone}`

    window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank')
  }

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Dashboard" />

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
              <h2
                className={`text-3xl font-bold ${
                  activeCash ? 'text-green-600' : 'text-red-600'
                }`}
              >
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
              {Object.entries(salesByType).length === 0 ? (
                <div className="border rounded-lg p-4">
                  <p>Mostrador</p>
                  <h3 className="text-2xl font-bold">{money(0)}</h3>
                </div>
              ) : (
                Object.entries(salesByType).map(([type, total]) => (
                  <div key={type} className="border rounded-lg p-4">
                    <p>{typeLabel(type)}</p>
                    <h3 className="text-2xl font-bold">{money(total)}</h3>
                  </div>
                ))
              )}
            </div>

            <h3 className="font-bold mb-2">Por medio de pago</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(salesByPayment).length === 0 ? (
                <div className="border rounded-lg p-4">
                  <p>Efectivo</p>
                  <h3 className="text-2xl font-bold">{money(0)}</h3>
                </div>
              ) : (
                Object.entries(salesByPayment).map(([method, total]) => (
                  <div key={method} className="border rounded-lg p-4">
                    <p>{paymentLabel(method)}</p>
                    <h3 className="text-2xl font-bold">{money(total)}</h3>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold">Registro de ventas</h2>
                <p className="text-gray-600">
                  Edita solo ventas de la caja abierta actual.
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
                      const editable = canEditOrder(order)

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

                          <td className="text-right">
                            <div className="flex justify-end gap-2 flex-wrap">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="bg-yellow-400 text-black px-3 py-2 rounded font-bold"
                              >
                                Ver
                              </button>

                              <button
                                onClick={() => openEditOrder(order)}
                                disabled={!editable}
                                className="bg-blue-600 text-white px-3 py-2 rounded font-bold disabled:opacity-40"
                              >
                                Editar
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

                {canEditOrder(selectedOrder) && (
                  <button
                    onClick={() => {
                      setSelectedOrder(null)
                      openEditOrder(selectedOrder)
                    }}
                    className="bg-blue-600 text-white px-5 py-3 rounded-lg font-bold"
                  >
                    Editar venta
                  </button>
                )}

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

        {editingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[92vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Editar venta</h2>
                  <p className="text-gray-600">
                    Solo ventas de la caja abierta actual. El inventario se ajustará automáticamente.
                  </p>
                </div>

                <button
                  onClick={closeEditModal}
                  className="text-red-600 font-bold text-xl"
                >
                  X
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <h3 className="text-xl font-bold mb-3">Productos de la venta</h3>

                  {editItems.length === 0 ? (
                    <div className="text-center text-gray-500 py-8 border rounded-lg">
                      No hay productos en la venta.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {editItems.map((item) => (
                        <div key={item.row_id} className="border rounded-xl p-4">
                          <div className="flex justify-between gap-3">
                            <div>
                              <h4 className="font-bold">{item.name}</h4>
                              <p className="text-sm text-gray-500">
                                {item.category_name || 'Sin categoría'}
                              </p>
                              {!item.product_id && (
                                <p className="text-xs text-red-600 font-bold">
                                  Producto sin ID: no ajustará receta de inventario.
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => removeEditItem(item.row_id)}
                              className="bg-red-600 text-white px-3 py-2 rounded font-bold h-fit"
                            >
                              Eliminar
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                            <div>
                              <label className="label">Cantidad</label>
                              <input
                                type="number"
                                min="1"
                                className="input"
                                value={item.quantity}
                                onChange={(event) =>
                                  updateEditQuantity(item.row_id, event.target.value)
                                }
                              />
                            </div>

                            <div>
                              <label className="label">Precio</label>
                              <input
                                type="number"
                                min="0"
                                className="input"
                                value={item.price}
                                onChange={(event) =>
                                  setEditItems((current) =>
                                    current.map((row) =>
                                      row.row_id === item.row_id
                                        ? { ...row, price: Number(event.target.value || 0) }
                                        : row
                                    )
                                  )
                                }
                              />
                            </div>

                            <div>
                              <label className="label">Subtotal</label>
                              <div className="border rounded-lg px-4 py-2 font-bold bg-gray-50">
                                {money(Number(item.price || 0) * Number(item.quantity || 0))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t mt-5 pt-5">
                    <h3 className="text-xl font-bold mb-3">Agregar producto</h3>

                    <input
                      className="input mb-3"
                      value={editProductSearch}
                      onChange={(event) => setEditProductSearch(event.target.value)}
                      placeholder="Buscar producto para agregar..."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                      {filteredEditProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addProductToEdit(product)}
                          className="border rounded-lg p-3 text-left hover:bg-yellow-50 hover:border-yellow-400"
                        >
                          <p className="font-bold">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            {product.category?.name || product.category_name || 'Sin categoría'}
                          </p>
                          <p className="font-bold mt-2">{money(product.price)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card h-fit">
                  <h3 className="text-xl font-bold mb-4">Resumen edición</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="label">Medio de pago</label>
                      <select
                        className="input"
                        value={editPaymentMethod}
                        onChange={(event) => setEditPaymentMethod(event.target.value)}
                      >
                        <option value="cash">Efectivo</option>
                        <option value="debit">Débito</option>
                        <option value="credit">Crédito</option>
                        <option value="transfer">Transferencia</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Notas</label>
                      <textarea
                        className="input min-h-[90px]"
                        value={editNotes}
                        onChange={(event) => setEditNotes(event.target.value)}
                        placeholder="Notas de la venta"
                      />
                    </div>

                    <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <strong>{money(editSubtotal)}</strong>
                      </div>

                      {editDeliveryFee > 0 && (
                        <div className="flex justify-between">
                          <span>Delivery</span>
                          <strong>{money(editDeliveryFee)}</strong>
                        </div>
                      )}

                      <div className="flex justify-between text-2xl font-bold border-t pt-2">
                        <span>Total</span>
                        <span>{money(editTotal)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={saveEditedOrder}
                      disabled={savingEdit || editItems.length === 0}
                      className="w-full bg-black text-yellow-400 font-bold py-3 rounded-lg disabled:opacity-50"
                    >
                      {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                    </button>

                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="w-full border py-3 rounded-lg"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
