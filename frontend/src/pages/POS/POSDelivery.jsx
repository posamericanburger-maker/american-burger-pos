import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://american-burger-pos-api-d8r1.onrender.com/api'

const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const getToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('authToken') ||
  localStorage.getItem('access_token') ||
  ''

const getList = (data, keys = []) => {
  if (Array.isArray(data)) return data

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
  }

  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items

  return []
}

const normalizeText = (value = '') =>
  String(value)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const categoryLabel = (name = '') => {
  const normalized = normalizeText(name)

  if (normalized.includes('HAMBURGUESA') || normalized.includes('BURGER')) return '🍔 BURGERS'
  if (normalized.includes('PAPA') || normalized.includes('SNACK') || normalized.includes('FRITA')) return '🍟 PAPAS'
  if (normalized.includes('BEBIDA')) return '🥤 BEBIDAS'
  if (normalized.includes('INGREDIENTE') || normalized.includes('EXTRA') || normalized.includes('+')) return '➕ EXTRAS'
  if (normalized.includes('POLLO') || normalized.includes('CHICKEN') || normalized.includes('CRISPY') || normalized.includes('ALITA') || normalized.includes('TENDER')) return '🍗 POLLO'
  if (normalized.includes('COMBO')) return '🎯 COMBOS'

  return `📦 ${name}`
}

const productIcon = (product = {}) => {
  const text = normalizeText(
    `${product.name || ''} ${product.category_name || ''} ${product.category?.name || ''}`
  )

  if (text.includes('BEBIDA') || text.includes('LATA') || text.includes('COCA')) return '🥤'
  if (text.includes('PAPA') || text.includes('FRITA')) return '🍟'
  if (text.includes('ALITA') || text.includes('POLLO') || text.includes('CRISPY') || text.includes('TENDER')) return '🍗'
  if (text.includes('BACON') || text.includes('TOCINO')) return '🥓'
  if (text.includes('QUESO') || text.includes('CHEESE')) return '🧀'
  if (text.includes('COMBO')) return '🎯'
  if (text.includes('SALSA')) return '🥫'

  return '🍔'
}

const categoryOrderIndex = (name = '') => {
  const label = categoryLabel(name)

  const order = [
    '🍔 BURGERS',
    '🍟 PAPAS',
    '🥤 BEBIDAS',
    '🍗 POLLO',
    '➕ EXTRAS',
    '🎯 COMBOS'
  ]

  const index = order.indexOf(label)

  return index === -1 ? 999 : index
}

const POSDelivery = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cashOpen, setCashOpen] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    reference: '',
    deliveryFee: '1500',
    paymentMethod: 'cash',
    notes: ''
  })

  const headers = useMemo(() => {
    const token = getToken()

    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }, [])

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    })

    const text = await response.text()
    let data = null

    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { message: text }
    }

    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Error de conexión')
    }

    return data
  }

  const checkCashStatus = async () => {
    try {
      const data = await request('/cash/sessions')
      const sessions = getList(data, ['sessions', 'cash_sessions'])

      const activeSession = sessions.find((session) => {
        const status = String(session.status || '').toLowerCase()

        return (
          status === 'open' ||
          status === 'abierta' ||
          (!session.closed_at && !session.closedAt)
        )
      })

      const isOpen = Boolean(activeSession)
      setCashOpen(isOpen)

      return isOpen
    } catch (err) {
      console.error('Error verificando caja:', err)
      setCashOpen(false)

      return false
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [productsData, categoriesData] = await Promise.allSettled([
        request('/products'),
        request('/categories')
      ])

      if (productsData.status === 'fulfilled') {
        const list = getList(productsData.value, ['products'])
        setProducts(list.filter((product) => product.active !== false))
      }

      if (categoriesData.status === 'fulfilled') {
        const list = getList(categoriesData.value, ['categories'])
        setCategories(list.filter((category) => category.active !== false))
      }

      await checkCashStatus()
    } catch (err) {
      setError(err.message || 'No se pudieron cargar productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const orderA = categoryOrderIndex(a.name)
      const orderB = categoryOrderIndex(b.name)

      if (orderA !== orderB) return orderA - orderB

      return normalizeText(a.name).localeCompare(normalizeText(b.name))
    })
  }, [categories])

  const productCategoryName = (product) => {
    if (product.category?.name) return product.category.name
    if (product.category_name) return product.category_name

    const category = categories.find((item) => item.id === product.category_id)

    return category?.name || 'Sin categoría'
  }

  const filteredProducts = products.filter((product) => {
    const text = `${product.name || ''} ${product.description || ''}`.toLowerCase()
    const matchesSearch = text.includes(search.toLowerCase())

    const categoryName = productCategoryName(product)
    const matchesCategory =
      selectedCategory === 'all' ||
      product.category_id === selectedCategory ||
      categoryName === selectedCategory

    return matchesSearch && matchesCategory
  })

  const addToCart = (product) => {
    setCart((current) => {
      const exists = current.find((item) => item.id === product.id)

      if (exists) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price || 0),
          quantity: 1,
          category_name: productCategoryName(product),
          icon: productIcon(product)
        }
      ]
    })
  }

  const updateQuantity = (id, quantity) => {
    const nextQuantity = Number(quantity)

    if (nextQuantity <= 0) {
      setCart((current) => current.filter((item) => item.id !== id))
      return
    }

    setCart((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: nextQuantity } : item
      )
    )
  }

  const removeItem = (id) => {
    setCart((current) => current.filter((item) => item.id !== id))
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  )

  const deliveryFee = Number(customer.deliveryFee || 0)
  const total = subtotal + deliveryFee

  const paymentMethodText =
    {
      cash: 'Efectivo',
      debit: 'Débito',
      credit: 'Crédito',
      transfer: 'Transferencia'
    }[customer.paymentMethod] || customer.paymentMethod

  const handleCustomerChange = (event) => {
    const { name, value } = event.target

    setCustomer((current) => ({
      ...current,
      [name]: value
    }))
  }

  const clearOrder = () => {
    setCart([])
    setCustomer({
      name: '',
      phone: '',
      address: '',
      reference: '',
      deliveryFee: '1500',
      paymentMethod: 'cash',
      notes: ''
    })
  }

  const printKitchenTicket = () => {
    const productLines = cart
      .map(
        (item) => `
        <div class="item">
          <div class="qty">${item.quantity} x</div>
          <div class="name">${item.name}</div>
        </div>
      `
      )
      .join('')

    const html = `
      <html>
        <head>
          <title>Comanda Delivery</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body {
              width: 80mm;
              margin: 0;
              padding: 6mm 4mm;
              font-family: Arial, monospace;
              color: #000;
              background: #fff;
            }
            .center { text-align: center; }
            .title { font-size: 24px; font-weight: 900; margin: 0; }
            .subtitle { font-size: 14px; font-weight: 700; margin-top: 4px; }
            .line { border-top: 2px dashed #000; margin: 10px 0; }
            .item {
              display: flex;
              gap: 8px;
              font-size: 20px;
              font-weight: 900;
              margin: 12px 0;
            }
            .qty { min-width: 42px; }
            .name { flex: 1; }
            .notes-title { font-size: 16px; font-weight: 900; margin-bottom: 4px; }
            .notes { font-size: 17px; font-weight: 900; white-space: pre-wrap; }
            .footer { font-size: 12px; margin-top: 10px; }
          </style>
        </head>

        <body>
          <div class="center">
            <h1 class="title">COMANDA</h1>
            <div class="subtitle">COCINA - DELIVERY</div>
            <div class="footer">${new Date().toLocaleString('es-CL')}</div>
          </div>

          <div class="line"></div>
          ${productLines}
          <div class="line"></div>

          <div class="notes-title">NOTAS DEL PEDIDO:</div>
          <div class="notes">${customer.notes.trim() || 'SIN NOTAS'}</div>

          <div class="line"></div>
          <div class="center footer">AMERICAN BURGER</div>
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
    }, 400)
  }

  const printDeliveryGuide = () => {
    const productLines = cart
      .map((item) => {
        const lineTotal = Number(item.price || 0) * Number(item.quantity || 0)

        return `
          <div class="product">
            <div>
              <strong>${item.quantity} x ${item.name}</strong>
              <br />
              <span>${money(item.price)} c/u</span>
            </div>
            <div class="right">${money(lineTotal)}</div>
          </div>
        `
      })
      .join('')

    const html = `
      <html>
        <head>
          <title>Guía Delivery</title>
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
            .section-title { font-size: 13px; font-weight: 900; margin-bottom: 4px; }
            .row,
            .product {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              margin: 6px 0;
            }
            .right { text-align: right; white-space: nowrap; }
            .total { font-size: 18px; font-weight: 900; }
            .important { font-size: 15px; font-weight: 900; white-space: pre-wrap; }
            .thanks { font-size: 12px; margin-top: 10px; text-align: center; }
          </style>
        </head>

        <body>
          <div class="center">
            <h1 class="brand">AMERICAN BURGER</h1>
            <div>ARICA - CHILE</div>
            <div class="small">GUÍA DE DESPACHO DELIVERY</div>
          </div>

          <div class="line"></div>

          <div class="section-title">DATOS DEL NEGOCIO</div>
          <div>American Burger Arica</div>
          <div>Av. Santa María 2248</div>
          <div>Arica - Chile</div>

          <div class="line"></div>

          <div class="section-title">DATOS DEL CLIENTE</div>
          <div><strong>Nombre:</strong> ${customer.name || ''}</div>
          <div><strong>WhatsApp:</strong> ${customer.phone || ''}</div>
          <div><strong>Dirección:</strong></div>
          <div class="important">${customer.address || ''}</div>
          <div><strong>Referencia:</strong></div>
          <div>${customer.reference || 'Sin referencia'}</div>

          <div class="line"></div>

          <div class="section-title">PRODUCTOS</div>
          ${productLines}

          <div class="line"></div>

          <div class="row">
            <span>Subtotal</span>
            <strong>${money(subtotal)}</strong>
          </div>

          <div class="row">
            <span>Delivery</span>
            <strong>${money(deliveryFee)}</strong>
          </div>

          <div class="row total">
            <span>TOTAL</span>
            <span>${money(total)}</span>
          </div>

          <div class="center small">Precios con IVA incluido</div>

          <div class="line"></div>

          <div class="row">
            <span>Forma de pago</span>
            <strong>${paymentMethodText}</strong>
          </div>

          <div class="line"></div>

          <div class="section-title">NOTAS</div>
          <div>${customer.notes || 'Sin observaciones'}</div>

          <div class="line"></div>

          <div class="thanks">
            Entregar pedido al cliente indicado<br />
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
    }, 900)
  }

  const submitOrder = async () => {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const isCashOpen = await checkCashStatus()

      if (!isCashOpen) {
        throw new Error('Debes abrir caja antes de registrar pedidos delivery')
      }

      if (cart.length === 0) throw new Error('Agrega productos al pedido')
      if (!customer.name.trim()) throw new Error('Ingresa el nombre del cliente')
      if (!customer.phone.trim()) throw new Error('Ingresa el teléfono del cliente')
      if (!customer.address.trim()) throw new Error('Ingresa la dirección de entrega')

      const payload = {
        type: 'delivery',
        order_type: 'delivery',
        status: 'pending',
        payment_method: customer.paymentMethod,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        total_amount: total,
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          address: customer.address.trim(),
          reference: customer.reference.trim()
        },
        notes: customer.notes.trim(),
        items: cart.map((item) => ({
          product_id: item.id,
          name: item.name,
          quantity: Number(item.quantity || 1),
          unit_price: Number(item.price || 0),
          price: Number(item.price || 0),
          subtotal: Number(item.price || 0) * Number(item.quantity || 1),
          category_name: item.category_name || 'Sin categoría'
        }))
      }

      await request('/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      printKitchenTicket()

      setTimeout(() => {
        printDeliveryGuide()
      }, 900)

      setMessage('Pedido delivery registrado correctamente. Comanda y guía enviadas a impresión.')
    } catch (err) {
      setError(err.message || 'No se pudo registrar el pedido')
    } finally {
      setSaving(false)
    }
  }

  const orderDetailText = cart
    .map((item) => {
      const quantity = Number(item.quantity || 1)
      const price = Number(item.price || 0)
      const lineTotal = quantity * price

      return `• ${quantity} x ${item.name} = ${money(lineTotal)}`
    })
    .join('\n')

  const whatsappMessage = encodeURIComponent(`
🍔 AMERICAN BURGER

Hola ${customer.name || ''}

Tu pedido fue registrado correctamente.

━━━━━━━━━━━━━━━
DETALLE DEL PEDIDO
━━━━━━━━━━━━━━━

${orderDetailText}

━━━━━━━━━━━━━━━

Subtotal: ${money(subtotal)}
Delivery: ${money(deliveryFee)}
TOTAL: ${money(total)}

━━━━━━━━━━━━━━━

Dirección:
${customer.address || ''}

Referencia:
${customer.reference || 'Sin referencia'}

Medio de pago:
${paymentMethodText}

Notas:
${customer.notes || 'Sin observaciones'}

Gracias por preferir American Burger 🍔
`)

  const whatsappPhone = customer.phone.replace(/[^0-9]/g, '')
  const whatsappUrl = whatsappPhone
    ? `https://wa.me/${
        whatsappPhone.startsWith('56') ? whatsappPhone : `56${whatsappPhone}`
      }?text=${whatsappMessage}`
    : '#'

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="POS - Delivery" />

        <div className="main-content space-y-5">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded font-bold">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded font-bold">
              {message}
            </div>
          )}

          <div
            className={`rounded-2xl px-5 py-4 font-bold border ${
              cashOpen
                ? 'bg-green-50 border-green-400 text-green-700'
                : 'bg-red-50 border-red-400 text-red-700'
            }`}
          >
            {cashOpen
              ? '🟢 CAJA ABIERTA — Puedes registrar delivery'
              : '🔴 CAJA CERRADA — Abre caja antes de registrar delivery'}
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-12 gap-5">
            <div className="2xl:col-span-7 space-y-5">
              <div className="card">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-3xl font-poppins font-bold">
                      Productos Delivery
                    </h2>
                    <p className="text-gray-600">
                      Toca un producto para agregarlo al pedido del cliente.
                    </p>
                  </div>

                  <input
                    className="input xl:max-w-md text-lg"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="🔍 Buscar producto..."
                  />
                </div>

                <div className="flex flex-wrap gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-5 py-4 rounded-xl font-bold border text-lg ${
                      selectedCategory === 'all'
                        ? 'bg-black text-yellow-400 border-black shadow-md'
                        : 'bg-white text-black border-gray-300 hover:bg-yellow-50'
                    }`}
                  >
                    ⭐ TODOS
                  </button>

                  {sortedCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-5 py-4 rounded-xl font-bold border text-lg ${
                        selectedCategory === category.id
                          ? 'bg-black text-yellow-400 border-black shadow-md'
                          : 'bg-yellow-50 text-black border-yellow-300 hover:bg-yellow-100'
                      }`}
                    >
                      {categoryLabel(category.name)}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="text-center py-10 text-gray-500">
                    Cargando productos...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    No hay productos disponibles.
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-xl mb-3">
                      Productos disponibles
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addToCart(product)}
                          className="border rounded-2xl p-4 text-left hover:bg-yellow-50 hover:border-yellow-400 transition-all bg-white min-h-[170px] flex flex-col justify-between"
                        >
                          <div>
                            <div className="text-5xl text-center mb-3">
                              {productIcon(product)}
                            </div>

                            <h3 className="font-poppins font-bold text-lg leading-tight">
                              {product.name}
                            </h3>

                            <p className="text-xs text-gray-500 mt-1">
                              {categoryLabel(productCategoryName(product))}
                            </p>
                          </div>

                          <div className="mt-3">
                            <p className="font-bold text-xl">
                              {money(product.price)}
                            </p>

                            <div className="mt-2 bg-yellow-400 text-black text-center py-2 rounded-lg font-bold">
                              + Agregar
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="2xl:col-span-5 space-y-5">
              <div className="card">
                <h2 className="text-2xl font-poppins font-bold mb-4">
                  Datos del cliente
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nombre</label>
                    <input
                      name="name"
                      className="input"
                      value={customer.name}
                      onChange={handleCustomerChange}
                      placeholder="Nombre del cliente"
                    />
                  </div>

                  <div>
                    <label className="label">WhatsApp</label>
                    <input
                      name="phone"
                      className="input"
                      value={customer.phone}
                      onChange={handleCustomerChange}
                      placeholder="+56 9..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Dirección</label>
                    <input
                      name="address"
                      className="input"
                      value={customer.address}
                      onChange={handleCustomerChange}
                      placeholder="Dirección de entrega"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Referencia</label>
                    <input
                      name="reference"
                      className="input"
                      value={customer.reference}
                      onChange={handleCustomerChange}
                      placeholder="Casa, depto, local, color de puerta..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Nota del pedido</label>
                    <textarea
                      name="notes"
                      className="input min-h-[80px]"
                      value={customer.notes}
                      onChange={handleCustomerChange}
                      placeholder="Sin cebolla, extra salsa, llamar al llegar..."
                    />
                  </div>
                </div>
              </div>

              <div className="card sticky top-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-3xl font-poppins font-bold">
                    Pedido delivery
                  </h2>

                  <button
                    type="button"
                    onClick={clearOrder}
                    disabled={cart.length === 0}
                    className="border px-3 py-2 rounded-lg disabled:opacity-40"
                  >
                    Limpiar
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="text-gray-500 text-center py-10 border rounded-xl">
                    El pedido está vacío.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={item.id} className="border rounded-xl p-3">
                        <div className="flex justify-between gap-3">
                          <div className="flex gap-3">
                            <div className="text-3xl">{item.icon || '🍔'}</div>

                            <div>
                              <p className="font-bold">{item.name}</p>
                              <p className="text-sm text-gray-500">
                                {money(item.price)} c/u
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 font-bold"
                          >
                            🗑
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-3 py-2 bg-gray-100 font-bold"
                            >
                              -
                            </button>

                            <input
                              type="number"
                              min="1"
                              className="w-14 text-center py-2 outline-none"
                              value={item.quantity}
                              onChange={(event) =>
                                updateQuantity(item.id, event.target.value)
                              }
                            />

                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-3 py-2 bg-gray-100 font-bold"
                            >
                              +
                            </button>
                          </div>

                          <strong>
                            {money(Number(item.price || 0) * Number(item.quantity || 0))}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t mt-5 pt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Subtotal</label>
                      <div className="border rounded-xl px-4 py-3 font-bold bg-gray-50">
                        {money(subtotal)}
                      </div>
                    </div>

                    <div>
                      <label className="label">Delivery</label>
                      <input
                        name="deliveryFee"
                        type="number"
                        min="0"
                        className="input"
                        value={customer.deliveryFee}
                        onChange={handleCustomerChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Medio de pago</label>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['cash', '💵 Efectivo'],
                        ['debit', '💳 Débito'],
                        ['credit', '💳 Crédito'],
                        ['transfer', '🏦 Transferencia']
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setCustomer((current) => ({
                              ...current,
                              paymentMethod: value
                            }))
                          }
                          className={`py-3 rounded-xl border font-bold ${
                            customer.paymentMethod === value
                              ? 'bg-yellow-400 text-black border-yellow-500'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 border rounded-2xl p-4">
                    <p className="text-gray-500 font-bold">TOTAL DELIVERY</p>
                    <div className="text-4xl font-black text-right">
                      {money(total)}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={saving || !cashOpen || cart.length === 0}
                    onClick={submitOrder}
                    className="w-full bg-yellow-400 text-black font-poppins font-black py-4 rounded-xl hover:bg-black hover:text-yellow-400 transition-all disabled:opacity-50 text-xl"
                  >
                    {!cashOpen
                      ? '🔴 Caja cerrada'
                      : saving
                        ? 'Registrando...'
                        : `🚗 REGISTRAR ${money(total)}`}
                  </button>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`block text-center border font-bold py-3 rounded-xl ${
                      customer.phone
                        ? 'border-green-600 text-green-700 hover:bg-green-50'
                        : 'border-gray-300 text-gray-400 pointer-events-none'
                    }`}
                  >
                    📲 Enviar WhatsApp
                  </a>

                  <button
                    type="button"
                    onClick={clearOrder}
                    className="w-full border border-gray-300 py-3 rounded-xl hover:bg-gray-100 font-bold"
                  >
                    Limpiar pedido
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default POSDelivery
