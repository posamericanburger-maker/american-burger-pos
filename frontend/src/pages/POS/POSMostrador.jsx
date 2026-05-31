import { useEffect, useMemo, useState } from 'react'
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

const getToken = () => {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    ''
  )
}

const getList = (data, keys = []) => {
  if (Array.isArray(data)) return data

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
  }

  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items

  return []
}

const normalizeText = (value = '') => {
  return String(value)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

const categoryLabel = (name = '') => {
  const normalized = normalizeText(name)

  if (normalized.includes('HAMBURGUESA') || normalized.includes('BURGER')) {
    return '🍔 HAMBURGUESAS'
  }

  if (
    normalized.includes('PAPA') ||
    normalized.includes('SNACK') ||
    normalized.includes('FRITA')
  ) {
    return '🍟 PAPAS & SNACKS'
  }

  if (normalized.includes('BEBIDA')) {
    return '🥤 BEBIDAS'
  }

  if (
    normalized.includes('INGREDIENTE') ||
    normalized.includes('EXTRA') ||
    normalized.includes('+')
  ) {
    return '➕ INGREDIENTES'
  }

  if (
    normalized.includes('POLLO') ||
    normalized.includes('CHICKEN') ||
    normalized.includes('CRISPY') ||
    normalized.includes('ALITA') ||
    normalized.includes('TENDER')
  ) {
    return '🍗 POLLO CRISPY'
  }

  if (normalized.includes('COMBO')) {
    return '🎯 COMBOS'
  }

  return name
}

const categoryOrderIndex = (name = '') => {
  const label = categoryLabel(name)

  const order = [
    '🍔 HAMBURGUESAS',
    '🍟 PAPAS & SNACKS',
    '🥤 BEBIDAS',
    '➕ INGREDIENTES',
    '🍗 POLLO CRISPY',
    '🎯 COMBOS'
  ]

  const index = order.indexOf(label)
  return index === -1 ? 999 : index
}

const POSMostrador = () => {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

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

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [productsData, categoriesData, ordersData] = await Promise.allSettled([
        request('/products'),
        request('/categories'),
        request('/orders')
      ])

      if (productsData.status === 'fulfilled') {
        const list = getList(productsData.value, ['products'])
        setProducts(list.filter((product) => product.active !== false))
      }

      if (categoriesData.status === 'fulfilled') {
        const list = getList(categoriesData.value, ['categories'])
        setCategories(list.filter((category) => category.active !== false))
      }

      if (ordersData.status === 'fulfilled') {
        const list = getList(ordersData.value, ['orders'])
        setOrders(list)
      }
    } catch (err) {
      setError(err.message || 'No se pudieron cargar datos del POS')
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

  const topProducts = useMemo(() => {
    const salesMap = {}

    orders.forEach((order) => {
      const items = order.items || order.order_items || []

      items.forEach((item) => {
        const name = item.name || item.product_name || item.name_snapshot || 'Producto'
        const quantity = Number(item.quantity || 1)

        salesMap[name] = (salesMap[name] || 0) + quantity
      })
    })

    return Object.entries(salesMap)
      .map(([name, quantity]) => {
        const product = products.find((item) => item.name === name)
        return {
          name,
          quantity,
          product
        }
      })
      .filter((item) => item.product)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [orders, products])

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
          category_name: productCategoryName(product)
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

  const clearOrder = () => {
    setCart([])
    setNotes('')
    setPaymentMethod('cash')
  }

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  )

  const submitOrder = async () => {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (cart.length === 0) {
        throw new Error('Agrega productos al pedido')
      }

      const payload = {
        type: 'counter',
        order_type: 'counter',
        status: 'paid',
        payment_method: paymentMethod,
        subtotal: total,
        total,
        total_amount: total,
        notes: notes.trim(),
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

      setMessage('Venta de mostrador registrada correctamente')
      clearOrder()
      loadData()
    } catch (err) {
      setError(err.message || 'No se pudo registrar la venta')
    } finally {
      setSaving(false)
    }
  }

  const printTicket = () => {
    const lines = cart
      .map((item) => `${item.quantity} x ${item.name} - ${money(item.price * item.quantity)}`)
      .join('\n')

    const ticket = `
AMERICAN BURGER
VENTA MOSTRADOR

${lines}

TOTAL: ${money(total)}
PAGO: ${paymentMethod.toUpperCase()}
`

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`<pre style="font-size:14px;font-family:monospace">${ticket}</pre>`)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="POS - Mostrador" />

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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div className="card">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-2xl font-poppins font-bold">
                      Punto de Venta - Mostrador
                    </h2>
                    <p className="text-gray-600">
                      Selecciona productos, arma el pedido y registra el pago.
                    </p>
                  </div>

                  <input
                    className="input md:max-w-xs"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar producto..."
                  />
                </div>

                <div className="mb-6">
                  <h3 className="font-bold mb-3">Categorías rápidas</h3>

                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {sortedCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-5 py-3 rounded-xl font-bold whitespace-nowrap border ${
                          selectedCategory === category.id
                            ? 'bg-black text-yellow-400 border-black'
                            : 'bg-yellow-50 text-black border-yellow-300'
                        }`}
                      >
                        {categoryLabel(category.name)}
                      </button>
                    ))}
                  </div>
                </div>

                {topProducts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-bold mb-3">🔥 5 productos más vendidos</h3>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {topProducts.map(({ product, quantity }) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addToCart(product)}
                          className="border border-yellow-400 bg-yellow-50 rounded-xl p-3 text-left hover:bg-yellow-100"
                        >
                          <p className="font-bold text-sm line-clamp-2">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Vendidos: {quantity}
                          </p>
                          <p className="font-bold mt-2">
                            {money(product.price)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-10 text-gray-500">
                    Cargando productos...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    No hay productos disponibles.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addToCart(product)}
                        className="border rounded-xl p-4 text-left hover:bg-yellow-50 hover:border-yellow-400 transition-all"
                      >
                        <div className="flex justify-between gap-3">
                          <h3 className="font-poppins font-bold text-lg">
                            {product.name}
                          </h3>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full h-fit">
                            {categoryLabel(productCategoryName(product))}
                          </span>
                        </div>

                        {product.description && (
                          <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                            {product.description}
                          </p>
                        )}

                        <p className="font-bold text-black mt-3">
                          {money(product.price)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h2 className="text-2xl font-poppins font-bold mb-4">
                Pedido actual
              </h2>

              {cart.length === 0 ? (
                <div className="text-gray-500 text-center py-6">
                  El pedido está vacío.
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="border-b pb-3">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            {money(item.price)} c/u
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 font-bold"
                        >
                          X
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <input
                          type="number"
                          min="1"
                          className="input max-w-[90px]"
                          value={item.quantity}
                          onChange={(event) =>
                            updateQuantity(item.id, event.target.value)
                          }
                        />

                        <strong>
                          {money(Number(item.price || 0) * Number(item.quantity || 0))}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t mt-5 pt-5 space-y-4">
                <div>
                  <label className="label">Notas</label>
                  <textarea
                    className="input min-h-[80px]"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Sin cebolla, extra salsa, etc."
                  />
                </div>

                <div>
                  <label className="label">Medio de pago</label>
                  <select
                    className="input"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  >
                    <option value="cash">Efectivo</option>
                    <option value="debit">Débito</option>
                    <option value="credit">Crédito</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </div>

                <div className="flex justify-between text-2xl font-bold">
                  <span>Total</span>
                  <span>{money(total)}</span>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={submitOrder}
                  className="w-full bg-black text-yellow-400 font-poppins font-bold py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50"
                >
                  {saving ? 'Registrando...' : 'Pagar y registrar'}
                </button>

                <button
                  type="button"
                  onClick={printTicket}
                  disabled={cart.length === 0}
                  className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Imprimir ticket
                </button>

                <button
                  type="button"
                  onClick={clearOrder}
                  className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-100"
                >
                  Limpiar pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default POSMostrador
