import { useMemo, useState } from 'react'
import { createPublicOrder } from '../publicStoreApi'

import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import SearchBar from '../components/SearchBar'
import CategoryTabs from '../components/CategoryTabs'
import ProductGrid from '../components/ProductGrid'
import FloatingCart from '../components/FloatingCart'
import CartDrawer from '../components/CartDrawer'
import CheckoutDrawer from '../components/CheckoutDrawer'
import OrderSuccessModal from '../components/OrderSuccessModal'
import Footer from '../components/Footer'

import { useCart } from '../hooks/useCart'
import { useProducts } from '../hooks/useProducts'

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

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
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

    return filteredProducts.filter((product) =>
      String(product.name || '').toLowerCase().includes(term) ||
      String(product.description || '').toLowerCase().includes(term) ||
      String(product.category_name || '').toLowerCase().includes(term)
    )
  }, [filteredProducts, search])

  const deliveryFee = customer.deliveryType === 'delivery' ? 1500 : 0
  const total = subtotal + deliveryFee
  const cashAmount = Number(onlyNumbers(customer.cashAmount || 0))
  const changeAmount = customer.paymentMethod === 'cash' ? cashAmount - total : 0

  const copyBankInfo = async () => {
    const text = `
TRANSFERENCIA AMERICAN BURGER

Banco: BANCO POR DEFINIR
Titular: AMERICAN BURGER
Tipo de cuenta: Cuenta Corriente
N° Cuenta: 000000000
RUT: XX.XXX.XXX-X
Correo: americanburgerarica@gmail.com
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
      setCheckoutOpen(false)
      setLastOrder(response?.order || null)
      setSuccessOpen(true)

      setCustomer({
        name: '',
        phone: '',
        address: '',
        deliveryType: 'pickup',
        paymentMethod: 'cash',
        cashAmount: '',
        notes: ''
      })

      setMessage('')
    } catch (error) {
      console.error('Error enviando pedido:', error)
      setMessage(error?.response?.data?.message || 'No se pudo enviar el pedido')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f6f6] text-black">
      <Navbar />

      <main className="bg-black text-white">
        <Hero />
      </main>

      <section className="sticky top-0 z-40 bg-[#f6f6f6]/95 backdrop-blur border-b border-black/10">
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
          <SearchBar value={search} onChange={setSearch} />

          <CategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>
      </section>

      <section id="menu" className="max-w-4xl mx-auto px-4 py-8 pb-28">
        <div className="mb-6">
          <p className="text-red-600 font-black tracking-widest text-xs">
            MENÚ ONLINE
          </p>

          <h2 className="text-3xl md:text-4xl font-black mt-1">
            Elige fácil y rápido
          </h2>

          <p className="text-neutral-600 mt-2">
            Agrega productos, revisa tu carrito y envía tu pedido al POS.
          </p>
        </div>

        {(message || error) && (
          <div className="mb-6 bg-yellow-400 text-black rounded-2xl px-5 py-4 font-black">
            {message || error}
          </div>
        )}

        <ProductGrid
          products={searchedProducts}
          loading={loading}
          onAdd={addToCart}
        />
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
          setCheckoutOpen(true)
        }}
      />

      <CheckoutDrawer
        open={checkoutOpen}
        customer={customer}
        setCustomer={setCustomer}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        total={total}
        sending={sending}
        onClose={() => setCheckoutOpen(false)}
        onSubmit={submitOrder}
        onCopyBankInfo={copyBankInfo}
      />

      <OrderSuccessModal
        open={successOpen}
        order={lastOrder}
        onClose={() => setSuccessOpen(false)}
      />

      <Footer />
    </div>
  )
}

export default Home
