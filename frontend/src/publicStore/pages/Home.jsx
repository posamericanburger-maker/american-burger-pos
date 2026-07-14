import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

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
import ComboSuggestion from '../components/ComboSuggestion'
import Footer from '../components/Footer'

import { useCart } from '../hooks/useCart'
import { useProducts } from '../hooks/useProducts'

const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const onlyNumbers = (value = '') =>
  String(value).replace(/[^0-9]/g, '')

const normalizeChilePhone = (value = '') => {
  let digits = onlyNumbers(value)

  if (digits.startsWith('56')) {
    digits = digits.slice(2)
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  return digits.slice(0, 9)
}

const buildFinalPhone = (value = '') => {
  const digits = normalizeChilePhone(value)

  return digits ? `56${digits}` : ''
}

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const getProductText = (product = {}) =>
  normalizeText(
    `${product.name || ''} ${product.category_name || ''} ${
      product.description || ''
    }`
  )

const isAvailableProduct = (product = {}) =>
  product.available !== false &&
  product.active !== false &&
  product.is_active !== false

const isBurgerProduct = (product = {}) => {
  const text = getProductText(product)

  return (
    text.includes('burger') ||
    text.includes('hamburguesa')
  )
}

const isFriesProduct = (product = {}) => {
  const text = getProductText(product)

  return (
    text.includes('papa') ||
    text.includes('fries') ||
    text.includes('frita')
  )
}

const isDrinkProduct = (product = {}) => {
  const text = getProductText(product)

  return (
    text.includes('bebida') ||
    text.includes('coca') ||
    text.includes('sprite') ||
    text.includes('fanta') ||
    text.includes('pepsi') ||
    text.includes('lata') ||
    text.includes('jugo') ||
    text.includes('agua')
  )
}

const getReducedMotion = () => {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false
  }

  return window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches
}

function Home() {
  const {
    products,
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

  const [checkoutOpen, setCheckoutOpen] =
    useState(false)

  const [successOpen, setSuccessOpen] =
    useState(false)

  const [lastOrder, setLastOrder] =
    useState(null)

  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [addedProduct, setAddedProduct] =
    useState('')

  const [comboSuggestion, setComboSuggestion] =
    useState({
      open: false,
      burger: null,
      fries: null,
      drink: null
    })

  const addedTimeoutRef = useRef(null)
  const comboTimeoutRef = useRef(null)
  const cartButtonRef = useRef(null)

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
    return () => {
      if (addedTimeoutRef.current) {
        window.clearTimeout(
          addedTimeoutRef.current
        )
      }

      if (comboTimeoutRef.current) {
        window.clearTimeout(
          comboTimeoutRef.current
        )
      }
    }
  }, [])

  const searchedProducts = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return filteredProducts
    }

    return filteredProducts.filter((product) => {
      const name = String(
        product.name || ''
      ).toLowerCase()

      const description = String(
        product.description || ''
      ).toLowerCase()

      const category = String(
        product.category_name || ''
      ).toLowerCase()

      return (
        name.includes(term) ||
        description.includes(term) ||
        category.includes(term)
      )
    })
  }, [filteredProducts, search])

  const suggestionProducts = useMemo(() => {
    const availableProducts = (
      Array.isArray(products) ? products : []
    ).filter(isAvailableProduct)

    const fries =
      availableProducts.find((product) => {
        const text = getProductText(product)

        return (
          isFriesProduct(product) &&
          (text.includes('200') ||
            text.includes('papas fritas'))
        )
      }) ||
      availableProducts.find(isFriesProduct) ||
      null

    const drink =
      availableProducts.find((product) => {
        const text = getProductText(product)

        return (
          isDrinkProduct(product) &&
          (text.includes('lata') ||
            text.includes('330') ||
            text.includes('350') ||
            text.includes('355'))
        )
      }) ||
      availableProducts.find(isDrinkProduct) ||
      null

    return {
      fries,
      drink
    }
  }, [products])

  const deliveryFee =
    customer.deliveryType === 'delivery'
      ? 1500
      : 0

  const total =
    Number(subtotal || 0) +
    Number(deliveryFee || 0)

  const cashAmount = Number(
    onlyNumbers(customer.cashAmount || 0)
  )

  const changeAmount =
    customer.paymentMethod === 'cash'
      ? cashAmount - total
      : 0

  const closeComboSuggestion = () => {
    setComboSuggestion({
      open: false,
      burger: null,
      fries: null,
      drink: null
    })

    if (comboTimeoutRef.current) {
      window.clearTimeout(
        comboTimeoutRef.current
      )

      comboTimeoutRef.current = null
    }
  }

  const openComboSuggestion = (burger) => {
    if (
      !isBurgerProduct(burger) ||
      !suggestionProducts.fries ||
      !suggestionProducts.drink
    ) {
      return
    }

    setComboSuggestion({
      open: true,
      burger,
      fries: suggestionProducts.fries,
      drink: suggestionProducts.drink
    })

    if (comboTimeoutRef.current) {
      window.clearTimeout(
        comboTimeoutRef.current
      )
    }

    comboTimeoutRef.current =
      window.setTimeout(() => {
        closeComboSuggestion()
      }, 9000)
  }

  const bounceCart = () => {
    const cartButton = cartButtonRef.current

    if (
      !cartButton ||
      typeof cartButton.animate !== 'function'
    ) {
      return
    }

    cartButton.animate(
      [
        {
          transform: 'scale(1) translateY(0)'
        },
        {
          transform:
            'scale(1.08) translateY(-8px)'
        },
        {
          transform:
            'scale(0.97) translateY(2px)'
        },
        {
          transform: 'scale(1) translateY(0)'
        }
      ],
      {
        duration: 520,
        easing:
          'cubic-bezier(0.22, 1, 0.36, 1)'
      }
    )
  }

  const animateProductToCart = (
    animationData = {}
  ) => {
    const cartButton = cartButtonRef.current
    const sourceRect = animationData.sourceRect

    if (!cartButton) {
      return
    }

    if (getReducedMotion()) {
      bounceCart()
      return
    }

    const targetRect =
      cartButton.getBoundingClientRect()

    if (
      !sourceRect ||
      !Number.isFinite(sourceRect.left) ||
      !Number.isFinite(sourceRect.top)
    ) {
      bounceCart()
      return
    }

    const flyingElement =
      document.createElement('div')

    const startSize = Math.max(
      64,
      Math.min(
        110,
        Number(sourceRect.width || 80) * 0.42
      )
    )

    const startX =
      sourceRect.left +
      sourceRect.width / 2 -
      startSize / 2

    const startY =
      sourceRect.top +
      sourceRect.height / 2 -
      startSize / 2

    const targetX =
      targetRect.left +
      targetRect.width / 2 -
      startSize / 2

    const targetY =
      targetRect.top +
      targetRect.height / 2 -
      startSize / 2

    flyingElement.setAttribute(
      'aria-hidden',
      'true'
    )

    Object.assign(flyingElement.style, {
      position: 'fixed',
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${startSize}px`,
      height: `${startSize}px`,
      zIndex: '9999',
      borderRadius: '9999px',
      overflow: 'hidden',
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background:
        'linear-gradient(135deg, #fef3c7, #ffffff, #fee2e2)',
      border:
        '3px solid rgba(250, 204, 21, 0.95)',
      boxShadow:
        '0 18px 45px rgba(0, 0, 0, 0.32)',
      willChange:
        'transform, opacity, filter'
    })

    if (animationData.imageUrl) {
      const image =
        document.createElement('img')

      image.src = animationData.imageUrl
      image.alt = ''

      Object.assign(image.style, {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      })

      flyingElement.appendChild(image)
    } else {
      flyingElement.textContent =
        animationData.emoji || '🍔'

      flyingElement.style.fontSize = `${Math.round(
        startSize * 0.58
      )}px`
    }

    document.body.appendChild(
      flyingElement
    )

    const deltaX = targetX - startX
    const deltaY = targetY - startY

    const middleX = deltaX * 0.52

    const middleY =
      deltaY * 0.32 -
      Math.min(
        110,
        Math.abs(deltaX) * 0.15
      )

    let animation

    try {
      animation = flyingElement.animate(
        [
          {
            transform:
              'translate3d(0, 0, 0) scale(1) rotate(0deg)',
            opacity: 1,
            filter: 'blur(0px)'
          },
          {
            transform: `translate3d(${middleX}px, ${middleY}px, 0) scale(0.78) rotate(8deg)`,
            opacity: 0.96,
            filter: 'blur(0px)',
            offset: 0.52
          },
          {
            transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.2) rotate(18deg)`,
            opacity: 0.15,
            filter: 'blur(1px)'
          }
        ],
        {
          duration: 680,
          easing:
            'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards'
        }
      )
    } catch {
      flyingElement.remove()
      bounceCart()
      return
    }

    animation.onfinish = () => {
      flyingElement.remove()
      bounceCart()
    }

    animation.oncancel = () => {
      flyingElement.remove()
    }
  }

  const showAddedMessage = (text) => {
    setAddedProduct(text)

    if (addedTimeoutRef.current) {
      window.clearTimeout(
        addedTimeoutRef.current
      )
    }

    addedTimeoutRef.current =
      window.setTimeout(() => {
        setAddedProduct('')
      }, 1800)
  }

  const handleAddToCart = (
    product,
    animationData = {}
  ) => {
    addToCart(product)
    setCartOpen(false)

    showAddedMessage(
      `${product?.name || 'Producto'} agregado al pedido`
    )

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        animateProductToCart(animationData)
      })
    })

    openComboSuggestion(product)
  }

  const handleAddSuggestedCombo = () => {
    const fries = comboSuggestion.fries
    const drink = comboSuggestion.drink

    if (!fries || !drink) {
      closeComboSuggestion()
      return
    }

    addToCart(fries)
    addToCart(drink)
    setCartOpen(false)

    showAddedMessage(
      `${fries.name} y ${drink.name} agregados`
    )

    closeComboSuggestion()

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        bounceCart()
      })
    })
  }

  const handleOpenCart = () => {
    closeComboSuggestion()
    setCheckoutOpen(false)
    setCartOpen(true)
  }

  const handleCloseCart = () => {
    setCartOpen(false)
  }

  const handleContinueToCheckout = () => {
    closeComboSuggestion()
    setCartOpen(false)
    setCheckoutOpen(true)
  }

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

      setMessage(
        'Datos bancarios copiados'
      )
    } catch {
      setMessage(
        'No se pudieron copiar los datos bancarios'
      )
    }
  }

  const submitOrder = async (event) => {
    event.preventDefault()
    setMessage('')

    const finalPhone = buildFinalPhone(
      customer.phone
    )

    if (cart.length === 0) {
      setMessage(
        'Agrega productos al pedido'
      )
      return
    }

    if (!customer.name.trim()) {
      setMessage('Ingresa tu nombre')
      return
    }

    if (
      normalizeChilePhone(
        customer.phone
      ).length !== 9
    ) {
      setMessage(
        'Ingresa un teléfono válido. Ejemplo: +56 9 4579 9597'
      )
      return
    }

    if (
      customer.deliveryType === 'delivery' &&
      !customer.address.trim()
    ) {
      setMessage(
        'Ingresa la dirección para delivery'
      )
      return
    }

    if (
      customer.paymentMethod === 'cash' &&
      cashAmount > 0 &&
      cashAmount < total
    ) {
      setMessage(
        'El monto en efectivo no puede ser menor al total'
      )
      return
    }

    try {
      setSending(true)

      const items = cart.map((item) => ({
        product_id:
          item.product_id ||
          item.id ||
          null,

        name: item.name,

        product_name:
          item.product_name ||
          item.name,

        category_name:
          item.category_name || '',

        quantity: Number(
          item.quantity || 1
        ),

        unit_price: Number(
          item.unit_price ||
            item.price ||
            0
        ),

        price: Number(
          item.price || 0
        ),

        subtotal:
          Number(item.price || 0) *
          Number(item.quantity || 1)
      }))

      const paymentLabel =
        customer.paymentMethod === 'cash'
          ? `EFECTIVO${
              cashAmount > 0
                ? ` | Paga con: ${money(
                    cashAmount
                  )} | Vuelto: ${money(
                    Math.max(
                      changeAmount,
                      0
                    )
                  )}`
                : ''
            }`
          : 'TRANSFERENCIA | Esperando comprobante/confirmación'

      const notes = [
        customer.notes || '',
        `Pago: ${paymentLabel}`
      ]
        .filter(Boolean)
        .join(' | ')

      const response =
        await createPublicOrder({
          customer_name:
            customer.name.trim(),

          customer_phone:
            finalPhone,

          customer_address:
            customer.address.trim(),

          delivery_type:
            customer.deliveryType,

          notes,

          payment_method:
            customer.paymentMethod,

          items,

          subtotal: Number(
            subtotal || 0
          ),

          delivery_fee:
            deliveryFee,

          total
        })

      clearCart()
      closeComboSuggestion()
      setCartOpen(false)
      setCheckoutOpen(false)

      setLastOrder(
        response?.order || null
      )

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
    } catch (requestError) {
      console.error(
        'Error enviando pedido:',
        requestError
      )

      setMessage(
        requestError?.response?.data
          ?.message ||
          'No se pudo enviar el pedido'
      )
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

      <section className="sticky top-0 z-40 border-b border-black/10 bg-[#f6f6f6]/95 backdrop-blur">
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-4">
          <SearchBar
            value={search}
            onChange={setSearch}
          />

          <CategoryTabs
            categories={categories}
            selectedCategory={
              selectedCategory
            }
            onSelect={
              setSelectedCategory
            }
          />
        </div>
      </section>

      <section
        id="menu"
        className="mx-auto max-w-4xl px-4 py-8 pb-40 sm:pb-32"
      >
        <div className="mb-6">
          <p className="text-xs font-black tracking-widest text-red-600">
            MENÚ ONLINE
          </p>

          <h2 className="mt-1 text-3xl font-black md:text-4xl">
            Elige fácil y rápido
          </h2>

          <p className="mt-2 text-neutral-600">
            Agrega todos tus productos y
            revisa tu pedido cuando estés
            listo.
          </p>
        </div>

        {(message || error) && (
          <div className="mb-6 rounded-2xl bg-yellow-400 px-5 py-4 font-black text-black">
            {message || error}
          </div>
        )}

        <ProductGrid
          products={searchedProducts}
          loading={loading}
          onAdd={handleAddToCart}
        />
      </section>

      {addedProduct && (
        <div
          role="status"
          aria-live="polite"
          className="
            fixed
            left-1/2
            top-5
            z-[100]
            w-[calc(100%-32px)]
            max-w-sm
            -translate-x-1/2
            rounded-2xl
            border
            border-green-400/30
            bg-green-600
            px-5
            py-4
            text-center
            font-black
            text-white
            shadow-2xl
          "
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl">
              ✓
            </span>

            <span>{addedProduct}</span>
          </div>
        </div>
      )}

      <ComboSuggestion
        open={comboSuggestion.open}
        burger={comboSuggestion.burger}
        fries={comboSuggestion.fries}
        drink={comboSuggestion.drink}
        onClose={closeComboSuggestion}
        onAddCombo={
          handleAddSuggestedCombo
        }
      />

      <FloatingCart
        ref={cartButtonRef}
        itemCount={itemCount}
        total={total}
        onClick={handleOpenCart}
      />

      <CartDrawer
        open={cartOpen}
        cart={cart}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        total={total}
        onClose={handleCloseCart}
        onIncrease={increaseItem}
        onDecrease={decreaseItem}
        onContinue={
          handleContinueToCheckout
        }
      />

      <CheckoutDrawer
        open={checkoutOpen}
        customer={customer}
        setCustomer={setCustomer}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        total={total}
        sending={sending}
        onClose={() =>
          setCheckoutOpen(false)
        }
        onSubmit={submitOrder}
        onCopyBankInfo={copyBankInfo}
      />

      <OrderSuccessModal
        open={successOpen}
        order={lastOrder}
        onClose={() =>
          setSuccessOpen(false)
        }
      />

      <Footer />
    </div>
  )
}

export default Home
