import {
  useEffect,
  useRef,
  useState
} from 'react'

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

const formatChilePhone = (value = '') => {
  const digits = normalizeChilePhone(value)

  if (!digits) {
    return '+56 '
  }

  const part1 = digits.slice(0, 1)
  const part2 = digits.slice(1, 5)
  const part3 = digits.slice(5, 9)

  let formatted = '+56 '

  if (part1) {
    formatted += part1
  }

  if (part2) {
    formatted += ` ${part2}`
  }

  if (part3) {
    formatted += ` ${part3}`
  }

  return formatted
}

const EMPTY_ERRORS = {
  general: '',
  name: '',
  phone: '',
  address: '',
  cashAmount: ''
}

function CheckoutDrawer({
  open = false,
  customer = {
    name: '',
    phone: '',
    address: '',
    deliveryType: 'pickup',
    paymentMethod: 'cash',
    cashAmount: '',
    notes: ''
  },
  setCustomer,
  subtotal = 0,
  deliveryFee = 0,
  total = 0,
  sending = false,
  storeClosed = false,
  storeClosedMessage = '',
  message = '',
  onClose,
  onSubmit,
  onCopyBankInfo
}) {
  const [errors, setErrors] =
    useState(EMPTY_ERRORS)

  const scrollContainerRef =
    useRef(null)

  const nameInputRef = useRef(null)
  const phoneInputRef = useRef(null)
  const addressInputRef = useRef(null)
  const cashInputRef = useRef(null)

  const cashAmount = Number(
    onlyNumbers(customer.cashAmount || 0)
  )

  const changeAmount =
    cashAmount - Number(total || 0)

  const closedMessage =
    storeClosedMessage ||
    'American Burger no está recibiendo pedidos en este momento porque la caja está cerrada.'

  useEffect(() => {
    if (!open) {
      setErrors(EMPTY_ERRORS)
    }
  }, [open])

  const updateCustomer = (
    field,
    value
  ) => {
    if (
      typeof setCustomer !==
      'function'
    ) {
      return
    }

    setCustomer({
      ...customer,
      [field]: value
    })

    setErrors((current) => ({
      ...current,
      general: '',
      [field]: ''
    }))
  }

  const focusFirstError = (
    validationErrors
  ) => {
    window.setTimeout(() => {
      if (
        validationErrors.name &&
        nameInputRef.current
      ) {
        nameInputRef.current.focus()
        return
      }

      if (
        validationErrors.phone &&
        phoneInputRef.current
      ) {
        phoneInputRef.current.focus()
        return
      }

      if (
        validationErrors.address &&
        addressInputRef.current
      ) {
        addressInputRef.current.focus()
        return
      }

      if (
        validationErrors.cashAmount &&
        cashInputRef.current
      ) {
        cashInputRef.current.focus()
      }
    }, 100)
  }

  const validateCheckout = () => {
    const validationErrors = {
      ...EMPTY_ERRORS
    }

    const customerName =
      String(customer.name || '').trim()

    const phoneDigits =
      normalizeChilePhone(
        customer.phone
      )

    const customerAddress =
      String(
        customer.address || ''
      ).trim()

    if (storeClosed) {
      validationErrors.general =
        closedMessage
    }

    if (!customerName) {
      validationErrors.name =
        'Ingresa tu nombre para continuar.'
    }

    if (!phoneDigits) {
      validationErrors.phone =
        'Ingresa tu número de teléfono.'
    } else if (
      phoneDigits.length !== 9
    ) {
      validationErrors.phone =
        'El teléfono debe tener 9 números. Ejemplo: +56 9 4579 9597.'
    } else if (
      !phoneDigits.startsWith('9')
    ) {
      validationErrors.phone =
        'Ingresa un número móvil chileno que comience con 9.'
    }

    if (
      customer.deliveryType ===
        'delivery' &&
      !customerAddress
    ) {
      validationErrors.address =
        'Ingresa la dirección donde debemos entregar el pedido.'
    }

    if (
      customer.paymentMethod ===
        'cash' &&
      cashAmount > 0 &&
      cashAmount <
        Number(total || 0)
    ) {
      validationErrors.cashAmount =
        `El monto ingresado es menor que el total de ${money(
          total
        )}.`
    }

    const hasErrors =
      Object.values(
        validationErrors
      ).some(Boolean)

    return {
      validationErrors,
      hasErrors
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const {
      validationErrors,
      hasErrors
    } = validateCheckout()

    setErrors(validationErrors)

    if (hasErrors) {
      focusFirstError(
        validationErrors
      )

      if (
        scrollContainerRef.current
      ) {
        scrollContainerRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      }

      return
    }

    if (
      typeof onSubmit ===
      'function'
    ) {
      onSubmit(event)
    }
  }

  const handleClose = () => {
    setErrors(EMPTY_ERRORS)

    if (
      typeof onClose ===
      'function'
    ) {
      onClose()
    }
  }

  return (
    <>
      {open && (
        <div
          onClick={handleClose}
          className="
            fixed
            inset-0
            z-50
            bg-black/70
            backdrop-blur-sm
          "
        />
      )}

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Finalizar pedido"
        className={`
          fixed
          right-0
          top-0
          z-[70]
          h-full
          w-full
          border-l
          border-white/10
          bg-[#101010]
          shadow-2xl
          transition-transform
          duration-300
          sm:w-[520px]
          ${
            open
              ? 'translate-x-0'
              : 'translate-x-full'
          }
        `}
      >
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex h-full flex-col"
        >
          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-white/10
              p-6
            "
          >
            <div>
              <p
                className="
                  text-sm
                  font-black
                  tracking-widest
                  text-yellow-400
                "
              >
                CHECKOUT
              </p>

              <h2
                className="
                  text-3xl
                  font-black
                  text-white
                "
              >
                Finalizar pedido
              </h2>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar checkout"
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-white/10
                text-white
                font-black
                transition
                hover:bg-white/20
              "
            >
              ✕
            </button>
          </div>

          <div
            ref={scrollContainerRef}
            className="
              flex-1
              space-y-5
              overflow-y-auto
              p-6
            "
          >
            {(errors.general ||
              message ||
              storeClosed) && (
              <div
                role="alert"
                aria-live="assertive"
                className="
                  rounded-2xl
                  border
                  border-red-400/40
                  bg-red-500/15
                  px-5
                  py-4
                  text-white
                "
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="text-2xl"
                  >
                    ⚠️
                  </span>

                  <div>
                    <p
                      className="
                        font-black
                        text-red-300
                      "
                    >
                      Revisa los datos del pedido
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        font-semibold
                        leading-relaxed
                        text-white
                      "
                    >
                      {errors.general ||
                        message ||
                        closedMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3
                className="
                  text-xl
                  font-black
                  text-white
                "
              >
                Datos del cliente
              </h3>

              <div>
                <label
                  htmlFor="checkout-name"
                  className="
                    mb-2
                    block
                    text-sm
                    font-bold
                    text-neutral-300
                  "
                >
                  Nombre
                </label>

                <input
                  ref={nameInputRef}
                  id="checkout-name"
                  type="text"
                  autoComplete="name"
                  value={
                    customer.name || ''
                  }
                  onChange={(event) =>
                    updateCustomer(
                      'name',
                      event.target.value
                    )
                  }
                  placeholder="Ingresa tu nombre"
                  className={`
                    w-full
                    rounded-2xl
                    border
                    bg-neutral-900
                    px-4
                    py-4
                    text-white
                    outline-none
                    transition
                    placeholder:text-neutral-500
                    ${
                      errors.name
                        ? 'border-red-500 focus:border-red-400'
                        : 'border-white/10 focus:border-yellow-400'
                    }
                  `}
                />

                {errors.name && (
                  <p
                    role="alert"
                    className="
                      mt-2
                      flex
                      items-center
                      gap-2
                      text-sm
                      font-bold
                      text-red-400
                    "
                  >
                    <span>⚠</span>
                    <span>
                      {errors.name}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="checkout-phone"
                  className="
                    mb-2
                    block
                    text-sm
                    font-bold
                    text-neutral-300
                  "
                >
                  Teléfono
                </label>

                <input
                  ref={phoneInputRef}
                  id="checkout-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={formatChilePhone(
                    customer.phone
                  )}
                  onChange={(event) =>
                    updateCustomer(
                      'phone',
                      normalizeChilePhone(
                        event.target.value
                      )
                    )
                  }
                  placeholder="+56 9 XXXX XXXX"
                  className={`
                    w-full
                    rounded-2xl
                    border
                    bg-neutral-900
                    px-4
                    py-4
                    text-white
                    outline-none
                    transition
                    placeholder:text-neutral-500
                    ${
                      errors.phone
                        ? 'border-red-500 focus:border-red-400'
                        : 'border-white/10 focus:border-yellow-400'
                    }
                  `}
                />

                {errors.phone && (
                  <p
                    role="alert"
                    className="
                      mt-2
                      flex
                      items-start
                      gap-2
                      text-sm
                      font-bold
                      text-red-400
                    "
                  >
                    <span>⚠</span>

                    <span>
                      {errors.phone}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3
                className="
                  text-xl
                  font-black
                  text-white
                "
              >
                Tipo de entrega
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    updateCustomer(
                      'deliveryType',
                      'pickup'
                    )

                    setErrors(
                      (current) => ({
                        ...current,
                        address: ''
                      })
                    )
                  }}
                  className={`
                    rounded-2xl
                    border
                    px-4
                    py-4
                    font-black
                    transition
                    ${
                      customer.deliveryType ===
                      'pickup'
                        ? 'border-yellow-400 bg-yellow-400 text-black'
                        : 'border-white/10 bg-neutral-900 text-white'
                    }
                  `}
                >
                  🛍️ Retiro
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateCustomer(
                      'deliveryType',
                      'delivery'
                    )
                  }
                  className={`
                    rounded-2xl
                    border
                    px-4
                    py-4
                    font-black
                    transition
                    ${
                      customer.deliveryType ===
                      'delivery'
                        ? 'border-yellow-400 bg-yellow-400 text-black'
                        : 'border-white/10 bg-neutral-900 text-white'
                    }
                  `}
                >
                  🛵 Delivery
                </button>
              </div>

              {customer.deliveryType ===
                'delivery' && (
                <div>
                  <label
                    htmlFor="checkout-address"
                    className="
                      mb-2
                      block
                      text-sm
                      font-bold
                      text-neutral-300
                    "
                  >
                    Dirección de entrega
                  </label>

                  <input
                    ref={addressInputRef}
                    id="checkout-address"
                    type="text"
                    autoComplete="street-address"
                    value={
                      customer.address ||
                      ''
                    }
                    onChange={(event) =>
                      updateCustomer(
                        'address',
                        event.target.value
                      )
                    }
                    placeholder="Calle, número y sector"
                    className={`
                      w-full
                      rounded-2xl
                      border
                      bg-neutral-900
                      px-4
                      py-4
                      text-white
                      outline-none
                      transition
                      placeholder:text-neutral-500
                      ${
                        errors.address
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-white/10 focus:border-yellow-400'
                      }
                    `}
                  />

                  {errors.address && (
                    <p
                      role="alert"
                      className="
                        mt-2
                        flex
                        items-center
                        gap-2
                        text-sm
                        font-bold
                        text-red-400
                      "
                    >
                      <span>⚠</span>

                      <span>
                        {errors.address}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3
                className="
                  text-xl
                  font-black
                  text-white
                "
              >
                Forma de pago
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    updateCustomer(
                      'paymentMethod',
                      'cash'
                    )
                  }
                  className={`
                    rounded-2xl
                    border
                    px-4
                    py-4
                    font-black
                    transition
                    ${
                      customer.paymentMethod ===
                      'cash'
                        ? 'border-yellow-400 bg-yellow-400 text-black'
                        : 'border-white/10 bg-neutral-900 text-white'
                    }
                  `}
                >
                  💵 Efectivo
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateCustomer(
                      'paymentMethod',
                      'transfer'
                    )

                    setErrors(
                      (current) => ({
                        ...current,
                        cashAmount: ''
                      })
                    )
                  }}
                  className={`
                    rounded-2xl
                    border
                    px-4
                    py-4
                    font-black
                    transition
                    ${
                      customer.paymentMethod ===
                      'transfer'
                        ? 'border-yellow-400 bg-yellow-400 text-black'
                        : 'border-white/10 bg-neutral-900 text-white'
                    }
                  `}
                >
                  🏦 Transferencia
                </button>
              </div>

              {customer.paymentMethod ===
                'cash' && (
                <div
                  className="
                    space-y-3
                    rounded-2xl
                    border
                    border-white/10
                    bg-neutral-900
                    p-4
                  "
                >
                  <label
                    htmlFor="checkout-cash"
                    className="
                      block
                      font-black
                      text-yellow-400
                    "
                  >
                    ¿Con cuánto pagas?
                  </label>

                  <input
                    ref={cashInputRef}
                    id="checkout-cash"
                    type="text"
                    inputMode="numeric"
                    value={
                      customer.cashAmount ||
                      ''
                    }
                    onChange={(event) =>
                      updateCustomer(
                        'cashAmount',
                        onlyNumbers(
                          event.target.value
                        )
                      )
                    }
                    placeholder="Ejemplo: 20000"
                    className={`
                      w-full
                      rounded-2xl
                      border
                      bg-black
                      px-4
                      py-4
                      text-white
                      outline-none
                      transition
                      placeholder:text-neutral-500
                      ${
                        errors.cashAmount
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-white/10 focus:border-yellow-400'
                      }
                    `}
                  />

                  {errors.cashAmount && (
                    <p
                      role="alert"
                      className="
                        flex
                        items-start
                        gap-2
                        text-sm
                        font-bold
                        text-red-400
                      "
                    >
                      <span>⚠</span>

                      <span>
                        {
                          errors.cashAmount
                        }
                      </span>
                    </p>
                  )}

                  {cashAmount > 0 &&
                    !errors.cashAmount && (
                      <p className="font-bold text-white">
                        Vuelto estimado:{' '}
                        <span className="text-yellow-400">
                          {money(
                            Math.max(
                              changeAmount,
                              0
                            )
                          )}
                        </span>
                      </p>
                    )}
                </div>
              )}

              {customer.paymentMethod ===
                'transfer' && (
                <div
                  className="
                    space-y-2
                    rounded-2xl
                    border
                    border-white/10
                    bg-neutral-900
                    p-4
                    text-neutral-300
                  "
                >
                  <h3
                    className="
                      font-black
                      text-yellow-400
                    "
                  >
                    Datos para transferencia
                  </h3>

                  <p>
                    Banco: {BANK_INFO.bank}
                  </p>

                  <p>
                    Titular:{' '}
                    {BANK_INFO.holder}
                  </p>

                  <p>
                    Tipo:{' '}
                    {BANK_INFO.accountType}
                  </p>

                  <p>
                    Cuenta:{' '}
                    {BANK_INFO.accountNumber}
                  </p>

                  <p>
                    RUT: {BANK_INFO.rut}
                  </p>

                  <p>
                    Correo:{' '}
                    {BANK_INFO.email}
                  </p>

                  <p className="font-black text-yellow-400">
                    Monto: {money(total)}
                  </p>

                  <button
                    type="button"
                    onClick={
                      onCopyBankInfo
                    }
                    className="
                      w-full
                      rounded-2xl
                      bg-yellow-400
                      py-3
                      font-black
                      text-black
                      transition
                      hover:bg-yellow-300
                    "
                  >
                    Copiar datos bancarios
                  </button>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="checkout-notes"
                className="
                  mb-2
                  block
                  text-sm
                  font-bold
                  text-neutral-300
                "
              >
                Notas del pedido
              </label>

              <textarea
                id="checkout-notes"
                value={
                  customer.notes || ''
                }
                onChange={(event) =>
                  updateCustomer(
                    'notes',
                    event.target.value
                  )
                }
                placeholder="Ejemplo: sin cebolla, agregar servilletas..."
                className="
                  min-h-[120px]
                  w-full
                  rounded-2xl
                  border
                  border-white/10
                  bg-neutral-900
                  px-4
                  py-4
                  text-white
                  outline-none
                  transition
                  placeholder:text-neutral-500
                  focus:border-yellow-400
                "
              />
            </div>
          </div>

          <div
            className="
              border-t
              border-white/10
              bg-black/60
              p-6
              pb-[calc(1.5rem+env(safe-area-inset-bottom))]
            "
          >
            <div className="mb-5 space-y-2">
              <div
                className="
                  flex
                  justify-between
                  text-neutral-300
                "
              >
                <span>Subtotal</span>

                <strong>
                  {money(subtotal)}
                </strong>
              </div>

              <div
                className="
                  flex
                  justify-between
                  text-neutral-300
                "
              >
                <span>Delivery</span>

                <strong>
                  {money(deliveryFee)}
                </strong>
              </div>

              <div
                className="
                  flex
                  justify-between
                  border-t
                  border-white/10
                  pt-3
                  text-3xl
                  font-black
                  text-yellow-400
                "
              >
                <span>Total</span>

                <strong>
                  {money(total)}
                </strong>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                sending ||
                storeClosed
              }
              className="
                w-full
                rounded-2xl
                bg-yellow-400
                py-5
                text-lg
                font-black
                text-black
                transition
                hover:bg-yellow-300
                disabled:cursor-not-allowed
                disabled:bg-neutral-700
                disabled:text-neutral-400
              "
            >
              {storeClosed
                ? 'PEDIDOS CERRADOS'
                : sending
                  ? 'Enviando pedido...'
                  : 'Enviar pedido al POS'}
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}

export default CheckoutDrawer
