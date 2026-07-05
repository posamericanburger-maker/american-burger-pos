import { useMemo, useState } from 'react'
import { createPublicOrder } from '../publicStoreApi'

import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import PromotionBanner from '../components/PromotionBanner'
import SearchBar from '../components/SearchBar'
import CategoryTabs from '../components/CategoryTabs'
import ProductGrid from '../components/ProductGrid'
import FloatingCart from '../components/FloatingCart'
import CartDrawer from '../components/CartDrawer'
import Footer from '../components/Footer'

import { useCart } from '../hooks/useCart'
import { useProducts } from '../hooks/useProducts'

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

  if (digits.startsWith('56')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = digits.slice(1)

  return digits.slice(0, 9)
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
  return digits ? `56${digits}` : ''
}

function Home() {
  const {
    filteredProducts,
    categories,
    selectedCategory,
    setSelectedCategory,
    loading,
    error
  } = useProducts()

  const {
    cart,
    cartOpen,
    setCartOpen,
    addToCart,
    decreaseItem,
    increaseItem,
    clearCart,
    subtotal,
    itemCount
  } = useCart()

  const [search, setSearch] = useState('')
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

  const searchedProducts = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return filteredProducts

    return filteredProducts.filter((product) => {
      return (
        String(product.name || '').toLowerCase().includes(term) ||
        String(product.description || '').toLowerCase().includes(term) ||
        String(product.category_name || '').toLowerCase().includes(term)
      )
    })
  }, [filteredProducts, search])

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

      clearCart()
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
      <PromotionBanner />

      <CategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <section id="menu" className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-yellow-400 font-black tracking-widest text-sm">
              MENÚ ONLINE
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-2">
              Elige tu favorito
            </h2>

            <p className="text-neutral-400 mt-3">
              Productos conectados directamente al POS American Burger.
            </p>
          </div>

          <div className="w-full md:w-[420px]">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>

        {(message || error) && (
          <div className="mb-8 bg-yellow-400 text-black rounded-2xl px-5 py-4 font-black">
            {message || error}
          </div>
        )}

        <ProductGrid
          products={searchedProducts}
          loading={loading}
          onAdd={addToCart}
        />
      </section>

      <section id="pedido" className="max-w-7xl mx-auto px-4 md:px-6 pb-24">
        <form
          onSubmit={submitOrder}
          className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-6 md:p-8 space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
            <div>
              <p className="text-yellow-400 font-black tracking-widest text-sm">
                CHECKOUT
              </p>
              <h2 className="text-3xl md:text-4xl font-black">
                Finalizar pedido
              </h2>
            </div>

            <div className="text-left md:text-right">
              <p className="text-neutral-400 font-bold">Total</p>
              <p className="text-4xl font-black text-yellow-400">
                {money(total)}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
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
          </div>

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
      </section>

      <FloatingCart
        itemCount={itemCount}
        total={total}
        onClick={() => setCartOpen(true)}
      />

      <CartDrawer
        open={cartOpen}
        cart={cart}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        total={total}
        onClose={() => setCartOpen(false)}
        onIncrease={increaseItem}
        onDecrease={decreaseItem}
        onContinue={() => {
          setCartOpen(false)
          document.getElementById('pedido')?.scrollIntoView({ behavior: 'smooth' })
        }}
      />

      <Footer />
    </div>
  )
}

export default Home
