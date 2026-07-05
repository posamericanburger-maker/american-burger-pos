import { useEffect, useMemo, useState } from 'react'
import { createPublicOrder, getPublicProducts } from '../publicStoreApi'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'

const BANK_INFO = {
  bank: 'BANCO POR DEFINIR',
  holder: 'AMERICAN BURGER',
  accountType: 'Cuenta Corriente',
  accountNumber: '000000000',
  rut: 'XX.XXX.XXX-X',
  email: 'americanburgerarica@gmail.com'
}

const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const onlyNumbers = (value = '') => String(value).replace(/[^0-9]/g, '')

const normalizeChilePhone = (value = '') => {
  let digits = onlyNumbers(value)

  if (digits.startsWith('56')) {
    digits = digits.slice(2)
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  digits = digits.slice(0, 9)

  return digits
}

const formatChilePhone = (value = '') => {
  const digits = normalizeChilePhone(value)

  if (!digits) return '+56 '

  const part1 = digits.slice(0, 1)
  const part2 = digits.slice(1, 5)
  const part3 = digits.slice(5, 9)

  let formatted = '+56 '

  if (part1) formatted += part1
  if (part2) formatted += ` ${part2}`
  if (part3) formatted += ` ${part3}`

  return formatted
}

const buildFinalPhone = (value = '') => {
  const digits = normalizeChilePhone(value)

  if (!digits) return ''

  return `56${digits}`
}

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
    paymentMethod: 'cash',
    cashAmount: '',
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
      console.error('Error cargando productos:', error)
      setMessage('No se pudieron cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    setMessage('')

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

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    )
  }, [cart])

  const deliveryFee = customer.deliveryType === 'delivery' ? 1500 : 0
  const total = subtotal + deliveryFee
  const cashAmount = Number(onlyNumbers(customer.cashAmount || 0))
  const changeAmount = customer.paymentMethod === 'cash' ? cashAmount - total : 0

  const copyBankInfo = async () => {
    const text = `
TRANSFERENCIA AMERICAN BURGER

Banco: ${BANK_INFO.bank}
Titular: ${BANK_INFO.holder}
Tipo de cuenta: ${BANK_INFO.accountType}
N° Cuenta: ${BANK_INFO.accountNumber}
RUT: ${BANK_INFO.rut}
Correo: ${BANK_INFO.email}
Monto: ${money(total)}
`.trim()

    try {
      await navigator.clipboard.writeText(text)
      setMessage('Datos bancarios copiados')
    } catch {
      setMessage('No se pudieron copiar los datos bancarios')
    }
  }

  const submitOrder = async (event) => {
    event.preventDefault()
    setMessage('')

    const finalPhone = buildFinalPhone(customer.phone)

    if (cart.length === 0) {
      setMessage('Agrega productos al pedido')
      return
    }

    if (!customer.name.trim()) {
      setMessage('Ingresa tu nombre')
      return
    }

    if (normalizeChilePhone(customer.phone).length !== 9) {
      setMessage('Ingresa un teléfono válido. Ejemplo: +56 9 4579 9597')
      return
    }

    if (customer.deliveryType === 'delivery' && !customer.address.trim()) {
      setMessage('Ingresa la dirección para delivery')
      return
    }

    if (customer.paymentMethod === 'cash' && cashAmount > 0 && cashAmount < total) {
      setMessage('El monto en efectivo no puede ser menor al total')
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
        subtotal: Number(item.price || 0) * Number(item.quantity || 1)
      }))

      const paymentLabel =
        customer.paymentMethod === 'cash'
          ? `EFECTIVO${cashAmount > 0 ? ` | Paga con: ${money(cashAmount)} | Vuelto: ${money(Math.max(changeAmount, 0))}` : ''}`
          : 'TRANSFERENCIA | Esperando comprobante/confirmación'

      const notes = [
        customer.notes ? customer.notes : '',
        `Pago: ${paymentLabel}`
      ]
        .filter(Boolean)
        .join(' | ')

      const response = await createPublicOrder({
        customer_name: customer.name,
        customer_phone: finalPhone,
        customer_address: customer.address,
        delivery_type: customer.deliveryType,
        notes,
        payment_method: customer.paymentMethod,
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
        paymentMethod: 'cash',
        cashAmount: '',
        notes: ''
      })

      setMessage(`Pedido enviado correctamente al POS. Código: ${response?.order?.id || 'sin código'}`)
    } catch (error) {
      console.error('Error enviando pedido:', error)
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
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-8xl">🍔</span>
                  )}
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
                      type="button"
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
                        type="button"
                        onClick={() => decreaseItem(item.id)}
                        className="bg-neutral-700 w-9 h-9 rounded-full font-black"
                      >
                        -
                      </button>

                      <span className="font-black">{item.quantity}</span>

                      <button
                        type="button"
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
              value={formatChilePhone(customer.phone)}
              onChange={(e) =>
                setCustomer({ ...customer, phone: normalizeChilePhone(e.target.value) })
              }
              placeholder="+56 9 XXXX XXXX"
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

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCustomer({ ...customer, paymentMethod: 'cash' })}
                className={`rounded-xl px-4 py-4 font-black border ${
                  customer.paymentMethod === 'cash'
                    ? 'bg-yellow-400 text-black border-yellow-400'
                    : 'bg-neutral-800 text-white border-neutral-700'
                }`}
              >
                💵 Efectivo
              </button>

              <button
                type="button"
                onClick={() => setCustomer({ ...customer, paymentMethod: 'transfer' })}
                className={`rounded-xl px-4 py-4 font-black border ${
                  customer.paymentMethod === 'transfer'
                    ? 'bg-yellow-400 text-black border-yellow-400'
                    : 'bg-neutral-800 text-white border-neutral-700'
                }`}
              >
                🏦 Transferencia
              </button>
            </div>

            {customer.paymentMethod === 'cash' && (
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 space-y-3">
                <label className="block font-black text-yellow-400">
                  ¿Con cuánto pagas?
                </label>

                <input
                  value={customer.cashAmount}
                  onChange={(e) =>
                    setCustomer({ ...customer, cashAmount: onlyNumbers(e.target.value) })
                  }
                  placeholder="Ej: 20000"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-4 outline-none"
                />

                {cashAmount > 0 && (
                  <p className="font-bold">
                    Vuelto estimado:{' '}
                    <span className="text-yellow-400">
                      {money(Math.max(changeAmount, 0))}
                    </span>
                  </p>
                )}
              </div>
            )}

            {customer.paymentMethod === 'transfer' && (
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 space-y-2">
                <h3 className="font-black text-yellow-400">Datos para transferencia</h3>
                <p>Banco: {BANK_INFO.bank}</p>
                <p>Titular: {BANK_INFO.holder}</p>
                <p>Tipo: {BANK_INFO.accountType}</p>
                <p>Cuenta: {BANK_INFO.accountNumber}</p>
                <p>RUT: {BANK_INFO.rut}</p>
                <p>Correo: {BANK_INFO.email}</p>
                <p className="font-black text-yellow-400">Monto: {money(total)}</p>

                <button
                  type="button"
                  onClick={copyBankInfo}
                  className="w-full bg-yellow-400 text-black rounded-xl py-3 font-black"
                >
                  Copiar datos bancarios
                </button>
              </div>
            )}

            <textarea
              value={customer.notes}
              onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
              placeholder="Notas del pedido"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-4 outline-none"
            />

            <button
              type="submit"
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
