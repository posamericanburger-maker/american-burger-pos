import { useEffect, useMemo, useState } from 'react'
import { createPublicOrder, getPublicProducts } from '../publicStoreApi'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'

const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

function Home() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    deliveryType: 'pickup',
    notes: ''
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
      setMessage('No se pudieron cargar los productos')
    } finally {
      setLoading(false)
    }
  }

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
          product_id: product.id,
          name: product.name,
          product_name: product.name,
          category_name: product.category_name,
          price: Number(product.price || 0),
          unit_price: Number(product.price || 0),
          quantity: 1
        }
      ]
    })
  }

  const decreaseItem = (id) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const increaseItem = (id) => {
    setCart((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    )
  }

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    )
  }, [cart])

  const deliveryFee = customer.deliveryType === 'delivery' ? 1500 : 0
  const total = subtotal + deliveryFee

  const submitOrder = async (event) => {
    event.preventDefault()
    setMessage('')

    if (cart.length === 0) {
      setMessage('Agrega productos al pedido')
      return
    }

    if (!customer.name.trim()) {
      setMessage('Ingresa tu nombre')
      return
    }

    if (!customer.phone.trim()) {
      setMessage('Ingresa tu teléfono')
      return
    }

    if (customer.deliveryType === 'delivery' && !customer.address.trim()) {
      setMessage('Ingresa la dirección para delivery')
      return
    }

    try {
      setSending(true)

      const items = cart.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        product_name: item.product_name,
        category_name: item.category_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        price: item.price,
        subtotal: Number(item.price) * Number(item.quantity)
      }))

      const response = await createPublicOrder({
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address,
        delivery_type: customer.deliveryType,
        notes: customer.notes,
        payment_method: 'pending',
        items,
        subtotal,
        delivery_fee: deliveryFee,
        total
      })

      setCart([])
      setCustomer({
        name: '',
        phone: '',
        address: '',
        deliveryType: 'pickup',
        notes: ''
      })

      setMessage(`Pedido enviado correctamente al POS. Código: ${response?.order?.id}`)
    } catch (error) {
      setMessage(error?.response?.data?.message || 'No se pudo enviar el pedido')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <Hero />

      <section id="menu" className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-black mb-10">Menú American Burger</h2>

        {message && (
          <div className="mb-6 bg-yellow-400 text-black rounded-xl px-5 py-4 font-black">
            {message}
          </div>
        )}

        {loading ? (
          <p>Cargando productos...</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <article
                key={product.id}
                className="bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 hover:border-yellow-400 transition"
              >
                <div className="h-56 bg-neutral-800 flex items-center justify-center">
                  <span className="text-8xl">🍔</span>
                </div>

                <div className="p-6">
                  <p className="text-yellow-400 text-sm font-black">
                    {product.category_name}
                  </p>

                  <h3 className="text-2xl font-black mt-2">
                    {product.name}
                  </h3>

                  <p className="text-neutral-400 mt-3 min-h-[70px]">
                    {product.description || 'Producto American Burger'}
                  </p>

                  <div className="flex justify-between items-center mt-6">
                    <strong className="text-3xl text-yellow-400">
                      {money(product.price)}
                    </strong>

                    <button
                      onClick={() => addToCart(product)}
                      className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-black"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="pedido" className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black mb-6">Tu pedido</h2>

            {cart.length === 0 ? (
              <p className="text-neutral-400">Aún no agregaste productos.</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center border-b border-neutral-800 pb-4"
                  >
                    <div>
                      <h3 className="font-black">{item.name}</h3>
                      <p className="text-neutral-400">
                        {money(item.price)} x {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => decreaseItem(item.id)}
                        className="bg-neutral-700 w-9 h-9 rounded-full font-black"
                      >
                        -
                      </button>

                      <span className="font-black">{item.quantity}</span>

                      <button
                        onClick={() => increaseItem(item.id)}
                        className="bg-neutral-700 w-9 h-9 rounded-full font-black"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}

                <div className="pt-6 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <strong>{money(subtotal)}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <strong>{money(deliveryFee)}</strong>
                  </div>

                  <div className="flex justify-between text-3xl text-yellow-400 font-black">
                    <span>Total</span>
                    <strong>{money(total)}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={submitOrder}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4"
          >
            <h2 className="text-3xl font-black mb-4">Datos del cliente</h2>

            <input
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              placeholder="Nombre"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-4 outline-none"
            />

            <input
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              placeholder="Teléfono"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-4 outline-none"
            />

            <select
              value={customer.deliveryType}
              onChange={(e) =>
                setCustomer({ ...customer, deliveryType: e.target.value })
              }
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-4 outline-none"
            >
              <option value="pickup">Retiro en local</option>
              <option value="delivery">Delivery</option>
            </select>

            {customer.deliveryType === 'delivery' && (
              <input
                value={customer.address}
                onChange={(e) =>
                  setCustomer({ ...customer, address: e.target.value })
                }
                placeholder="Dirección"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-4 outline-none"
              />
            )}

            <textarea
              value={customer.notes}
              onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
              placeholder="Notas del pedido"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-4 outline-none"
            />

            <button
              disabled={sending || cart.length === 0}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black py-5 rounded-2xl font-black text-xl"
            >
              {sending ? 'Enviando pedido...' : 'Enviar pedido al POS'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default Home
