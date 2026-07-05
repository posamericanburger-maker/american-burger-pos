import { useEffect, useMemo, useState } from 'react'
import { createPublicOrder, getPublicProducts } from './publicStoreApi'

const money = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

function PublicStore() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [category, setCategory] = useState('TODOS')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    deliveryType: 'pickup',
    notes: '',
    paymentMethod: 'pending'
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await getPublicProducts()
      setProducts(data)
    } catch (error) {
      setMessage(error?.response?.data?.message || 'No se pudieron cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  const categories = useMemo(() => {
    const list = products.map((p) => p.category_name || 'Productos')
    return ['TODOS', ...new Set(list)]
  }, [products])

  const filteredProducts = useMemo(() => {
    if (category === 'TODOS') return products
    return products.filter((p) => p.category_name === category)
  }, [products, category])

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0)
  }, [cart])

  const deliveryFee = customer.deliveryType === 'delivery' ? 1500 : 0
  const total = subtotal + deliveryFee

  const addToCart = (product) => {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id)

      if (found) {
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
          product_id: product.id,
          name: product.name,
          product_name: product.name,
          category_name: product.category_name,
          price: Number(product.price || 0),
          unit_price: Number(product.price || 0),
          quantity: 1,
          subtotal: Number(product.price || 0)
        }
      ]
    })
  }

  const decreaseItem = (id) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const increaseItem = (id) => {
    setCart((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    )
  }

  const removeItem = (id) => {
    setCart((current) => current.filter((item) => item.id !== id))
  }

  const submitOrder = async (event) => {
    event.preventDefault()

    if (!customer.name.trim()) {
      setMessage('Debes ingresar tu nombre')
      return
    }

    if (!customer.phone.trim()) {
      setMessage('Debes ingresar tu teléfono')
      return
    }

    if (customer.deliveryType === 'delivery' && !customer.address.trim()) {
      setMessage('Debes ingresar la dirección para delivery')
      return
    }

    if (cart.length === 0) {
      setMessage('Agrega productos al carrito')
      return
    }

    try {
      setSending(true)
      setMessage('')

      const cleanItems = cart.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        product_name: item.product_name,
        category_name: item.category_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        price: item.price,
        subtotal: Number(item.price || 0) * Number(item.quantity || 1)
      }))

      const payload = {
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address,
        delivery_type: customer.deliveryType,
        notes: customer.notes,
        payment_method: customer.paymentMethod,
        items: cleanItems,
        subtotal,
        delivery_fee: deliveryFee,
        total
      }

      const result = await createPublicOrder(payload)

      setCart([])
      setCustomer({
        name: '',
        phone: '',
        address: '',
        deliveryType: 'pickup',
        notes: '',
        paymentMethod: 'pending'
      })

      setMessage(`Pedido creado correctamente. Código: ${result?.order?.id || 'pendiente'}`)
    } catch (error) {
      setMessage(error?.response?.data?.message || 'No se pudo crear el pedido')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="bg-black border-b border-yellow-400/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-yellow-400">AMERICAN BURGER</h1>
            <p className="text-xs text-neutral-300">Tienda online oficial</p>
          </div>

          <div className="text-right">
            <p className="text-sm text-neutral-300">Carrito</p>
            <p className="text-xl font-bold text-yellow-400">{cart.length} productos</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <div className="rounded-3xl bg-gradient-to-r from-red-700 to-yellow-500 p-8 mb-8">
            <h2 className="text-4xl font-black mb-2">Pide online</h2>
            <p className="text-lg font-semibold">Hamburguesas, papas, pollo crispy y bebidas.</p>
          </div>

          {message && (
            <div className="mb-6 rounded-xl bg-yellow-400 text-black px-4 py-3 font-bold">
              {message}
            </div>
          )}

          <div className="flex gap-3 overflow-x-auto pb-4 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-5 py-3 rounded-full font-bold whitespace-nowrap ${
                  category === cat
                    ? 'bg-yellow-400 text-black'
                    : 'bg-neutral-800 text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20 text-neutral-300">Cargando productos...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5"
                >
                  <div className="h-40 rounded-2xl bg-neutral-800 flex items-center justify-center mb-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <span className="text-6xl">🍔</span>
                    )}
                  </div>

                  <p className="text-xs text-yellow-400 font-bold mb-1">
                    {product.category_name}
                  </p>

                  <h3 className="text-xl font-black mb-2">{product.name}</h3>

                  <p className="text-sm text-neutral-300 min-h-[48px]">
                    {product.description || 'Producto American Burger'}
                  </p>

                  <div className="flex items-center justify-between mt-5">
                    <strong className="text-2xl text-yellow-400">
                      {money(product.price)}
                    </strong>

                    <button
                      onClick={() => addToCart(product)}
                      className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-black"
                    >
                      Agregar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 h-fit sticky top-24">
          <h2 className="text-2xl font-black mb-4">Tu pedido</h2>

          {cart.length === 0 ? (
            <p className="text-neutral-400">Tu carrito está vacío.</p>
          ) : (
            <div className="space-y-3 mb-6">
              {cart.map((item) => (
                <div key={item.id} className="bg-neutral-800 rounded-2xl p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <h4 className="font-bold">{item.name}</h4>
                      <p className="text-sm text-neutral-400">{money(item.price)}</p>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 font-bold"
                    >
                      X
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decreaseItem(item.id)}
                        className="w-8 h-8 rounded-full bg-neutral-700 font-bold"
                      >
                        -
                      </button>

                      <span className="font-bold">{item.quantity}</span>

                      <button
                        onClick={() => increaseItem(item.id)}
                        className="w-8 h-8 rounded-full bg-neutral-700 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <strong>{money(item.price * item.quantity)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={submitOrder} className="space-y-3">
            <input
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              placeholder="Nombre"
              className="w-full rounded-xl bg-neutral-800 border border-neutral-700 px-4 py-3 outline-none"
            />

            <input
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              placeholder="Teléfono"
              className="w-full rounded-xl bg-neutral-800 border border-neutral-700 px-4 py-3 outline-none"
            />

            <select
              value={customer.deliveryType}
              onChange={(e) => setCustomer({ ...customer, deliveryType: e.target.value })}
              className="w-full rounded-xl bg-neutral-800 border border-neutral-700 px-4 py-3 outline-none"
            >
              <option value="pickup">Retiro en local</option>
              <option value="delivery">Delivery</option>
            </select>

            {customer.deliveryType === 'delivery' && (
              <input
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                placeholder="Dirección"
                className="w-full rounded-xl bg-neutral-800 border border-neutral-700 px-4 py-3 outline-none"
              />
            )}

            <textarea
              value={customer.notes}
              onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
              placeholder="Notas del pedido"
              className="w-full rounded-xl bg-neutral-800 border border-neutral-700 px-4 py-3 outline-none"
            />

            <div className="border-t border-neutral-700 pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>

              <div className="flex justify-between">
                <span>Delivery</span>
                <strong>{money(deliveryFee)}</strong>
              </div>

              <div className="flex justify-between text-xl text-yellow-400">
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>
            </div>

            <button
              disabled={sending || cart.length === 0}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black py-4 rounded-2xl font-black text-lg"
            >
              {sending ? 'Enviando...' : 'Enviar pedido'}
            </button>
          </form>
        </aside>
      </main>
    </div>
  )
}

export default PublicStore
