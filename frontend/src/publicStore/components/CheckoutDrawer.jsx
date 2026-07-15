import {
  useEffect,
  useRef
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

const errorInputClass =
  'border-red-500 focus:border-red-400'

const normalInputClass =
  'border-white/10 focus:border-yellow-400'

function CheckoutDrawer({
  open = false,
  customer,
  setCustomer,
  subtotal = 0,
  deliveryFee = 0,
  total = 0,
  sending = false,
  errors = {},
  message = '',
  storeClosed = false,
  storeClosedMessage = '',
  onClearError,
  onClose,
  onSubmit,
  onCopyBankInfo
}) {
  const contentRef = useRef(null)
  const nameRef = useRef(null)
  const phoneRef = useRef(null)
  const addressRef = useRef(null)
  const cashAmountRef = useRef(null)

  const cashAmount = Number(
    onlyNumbers(customer.cashAmount || 0)
  )

  const changeAmount =
    cashAmount - total

  const finalStoreClosedMessage =
    String(storeClosedMessage || '').trim() ||
    'American Burger no está recibiendo pedidos en este momento porque la caja está cerrada.'

  const updateCustomer = (
    field,
    value
  ) => {
    setCustomer((current) => ({
      ...current,
      [field]: value
    }))

    if (typeof onClearError === 'function') {
      onClearError(field)
      onClearError('general')
    }
  }

  useEffect(() => {
    if (!open) {
      return
    }

    const firstErrorField = [
      'general',
      'name',
      'phone',
      'address',
      'cashAmount'
    ].find((field) => errors?.[field])

    if (!firstErrorField) {
      return
    }

    const targetByField = {
      name: nameRef.current,
      phone: phoneRef.current,
      address: addressRef.current,
      cashAmount: cashAmountRef.current
    }

    const target =
      targetByField[firstErrorField]

    window.requestAnimationFrame(() => {
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })

        target.focus({
          preventScroll: true
        })
      } else if (contentRef.current) {
        contentRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      }
    })
  }, [errors, open])

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        />
      )}

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Finalizar pedido"
        className={`fixed right-0 top-0 z-[70] h-full w-full border-l border-white/10 bg-[#101010] shadow-2xl transition-transform duration-300 sm:w-[520px] ${
          open
            ? 'translate-x-0'
            : 'translate-x-full'
        }`}
      >
        <form
          onSubmit={onSubmit}
          noValidate
          className="flex h-full flex-col"
        >
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <div>
              <p className="text-sm font-black tracking-widest text-yellow-400">
                CHECKOUT
              </p>

              <h2 className="text-3xl font-black text-white">
                Finalizar pedido
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar checkout"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 font-black text-white transition hover:bg-white/20 active:scale-95"
            >
              ✕
            </button>
          </div>

          <div
            ref={contentRef}
            className="flex-1 space-y-5 overflow-y-auto p-6"
          >
            {storeClosed && (
              <div
                role="alert"
                className="rounded-3xl border border-yellow-300/50 bg-yellow-400 px-5 py-5 text-black shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="text-2xl"
                  >
                    🔒
                  </span>

                  <div>
                    <h3 className="text-lg font-black">
                      Pedidos temporalmente cerrados
                    </h3>

                    <p className="mt-1 font-bold leading-relaxed">
                      {finalStoreClosedMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(errors.general || message) && (
              <div
                role="alert"
                aria-live="assertive"
                className={`rounded-2xl border px-5 py-4 font-bold ${
                  errors.general
                    ? 'border-red-400/50 bg-red-500/15 text-red-200'
                    : 'border-yellow-400/40 bg-yellow-400/10 text-yellow-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span aria-hidden="true">
                    {errors.general ? '⚠️' : '✓'}
                  </span>

                  <span>
                    {errors.general || message}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xl font-black text-white">
                Datos del cliente
              </h3>

              <div>
                <label
                  htmlFor="customer-name"
                  className="mb-2 block text-sm font-bold text-neutral-300"
                >
                  Nombre
                </label>

                <input
                  ref={nameRef}
                  id="customer-name"
                  value={customer.name}
                  onChange={(event) =>
                    updateCustomer(
                      'name',
                      event.target.value
                    )
                  }
                  placeholder="Nombre"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name
                      ? 'customer-name-error'
                      : undefined
                  }
                  className={`w-full rounded-2xl border bg-neutral-900 px-4 py-4 text-white outline-none transition ${
                    errors.name
                      ? errorInputClass
                      : normalInputClass
                  }`}
                />

                {errors.name && (
                  <p
                    id="customer-name-error"
                    className="mt-2 flex items-center gap-2 text-sm font-bold text-red-400"
                  >
                    <span aria-hidden="true">
                      ⚠
                    </span>
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="customer-phone"
                  className="mb-2 block text-sm font-bold text-neutral-300"
                >
                  Teléfono
                </label>

                <input
                  ref={phoneRef}
                  id="customer-phone"
                  type="tel"
                  inputMode="numeric"
                  value={formatChilePhone(customer.phone)}
                  onChange={(event) =>
                    updateCustomer(
                      'phone',
                      normalizeChilePhone(
                        event.target.value
                      )
                    )
                  }
                  placeholder="+56 9 XXXX XXXX"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={
                    errors.phone
                      ? 'customer-phone-error'
                      : undefined
                  }
                  className={`w-full rounded-2xl border bg-neutral-900 px-4 py-4 text-white outline-none transition ${
                    errors.phone
                      ? errorInputClass
                      : normalInputClass
                  }`}
                />

                {errors.phone && (
                  <p
                    id="customer-phone-error"
                    className="mt-2 flex items-center gap-2 text-sm font-bold text-red-400"
                  >
                    <span aria-hidden="true">
                      ⚠
                    </span>
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-black text-white">
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
                    updateCustomer(
                      'address',
                      ''
                    )
                  }}
                  className={`rounded-2xl border px-4 py-4 font-black transition ${
                    customer.deliveryType === 'pickup'
                      ? 'border-yellow-400 bg-yellow-400 text-black'
                      : 'border-white/10 bg-neutral-900 text-white'
                  }`}
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
                  className={`rounded-2xl border px-4 py-4 font-black transition ${
                    customer.deliveryType === 'delivery'
                      ? 'border-yellow-400 bg-yellow-400 text-black'
                      : 'border-white/10 bg-neutral-900 text-white'
                  }`}
                >
                  🛵 Delivery
                </button>
              </div>

              {customer.deliveryType === 'delivery' && (
                <div>
                  <label
                    htmlFor="customer-address"
                    className="mb-2 block text-sm font-bold text-neutral-300"
                  >
                    Dirección de entrega
                  </label>

                  <input
                    ref={addressRef}
                    id="customer-address"
                    value={customer.address}
                    onChange={(event) =>
                      updateCustomer(
                        'address',
                        event.target.value
                      )
                    }
                    placeholder="Dirección de entrega"
                    autoComplete="street-address"
                    aria-invalid={Boolean(errors.address)}
                    aria-describedby={
                      errors.address
                        ? 'customer-address-error'
                        : undefined
                    }
                    className={`w-full rounded-2xl border bg-neutral-900 px-4 py-4 text-white outline-none transition ${
                      errors.address
                        ? errorInputClass
                        : normalInputClass
                    }`}
                  />

                  {errors.address && (
                    <p
                      id="customer-address-error"
                      className="mt-2 flex items-center gap-2 text-sm font-bold text-red-400"
                    >
                      <span aria-hidden="true">
                        ⚠
                      </span>
                      {errors.address}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-black text-white">
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
                  className={`rounded-2xl border px-4 py-4 font-black transition ${
                    customer.paymentMethod === 'cash'
                      ? 'border-yellow-400 bg-yellow-400 text-black'
                      : 'border-white/10 bg-neutral-900 text-white'
                  }`}
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
                    updateCustomer(
                      'cashAmount',
                      ''
                    )
                  }}
                  className={`rounded-2xl border px-4 py-4 font-black transition ${
                    customer.paymentMethod === 'transfer'
                      ? 'border-yellow-400 bg-yellow-400 text-black'
                      : 'border-white/10 bg-neutral-900 text-white'
                  }`}
                >
                  🏦 Transferencia
                </button>
              </div>

              {customer.paymentMethod === 'cash' && (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-neutral-900 p-4">
                  <label
                    htmlFor="cash-amount"
                    className="block font-black text-yellow-400"
                  >
                    ¿Con cuánto pagas?
                  </label>

                  <input
                    ref={cashAmountRef}
                    id="cash-amount"
                    inputMode="numeric"
                    value={customer.cashAmount}
                    onChange={(event) =>
                      updateCustomer(
                        'cashAmount',
                        onlyNumbers(
                          event.target.value
                        )
                      )
                    }
                    placeholder="Ej: 20000"
                    aria-invalid={Boolean(errors.cashAmount)}
                    aria-describedby={
                      errors.cashAmount
                        ? 'cash-amount-error'
                        : undefined
                    }
                    className={`w-full rounded-2xl border bg-black px-4 py-4 text-white outline-none transition ${
                      errors.cashAmount
                        ? errorInputClass
                        : normalInputClass
                    }`}
                  />

                  {errors.cashAmount && (
                    <p
                      id="cash-amount-error"
                      className="flex items-center gap-2 text-sm font-bold text-red-400"
                    >
                      <span aria-hidden="true">
                        ⚠
                      </span>
                      {errors.cashAmount}
                    </p>
                  )}

                  {cashAmount > 0 && (
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

              {customer.paymentMethod === 'transfer' && (
                <div className="space-y-2 rounded-2xl border border-white/10 bg-neutral-900 p-4 text-neutral-300">
                  <h3 className="font-black text-yellow-400">
                    Datos para transferencia
                  </h3>

                  <p>Banco: {BANK_INFO.bank}</p>
                  <p>Titular: {BANK_INFO.holder}</p>
                  <p>Tipo: {BANK_INFO.accountType}</p>
                  <p>Cuenta: {BANK_INFO.accountNumber}</p>
                  <p>RUT: {BANK_INFO.rut}</p>
                  <p>Correo: {BANK_INFO.email}</p>

                  <p className="font-black text-yellow-400">
                    Monto: {money(total)}
                  </p>

                  <button
                    type="button"
                    onClick={onCopyBankInfo}
                    className="w-full rounded-2xl bg-yellow-400 py-3 font-black text-black transition hover:bg-yellow-300 active:scale-[0.98]"
                  >
                    Copiar datos bancarios
                  </button>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="order-notes"
                className="mb-2 block text-sm font-bold text-neutral-300"
              >
                Notas del pedido
              </label>

              <textarea
                id="order-notes"
                value={customer.notes}
                onChange={(event) =>
                  updateCustomer(
                    'notes',
                    event.target.value
                  )
                }
                placeholder="Notas del pedido"
                className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-neutral-900 px-4 py-4 text-white outline-none transition focus:border-yellow-400"
              />
            </div>
          </div>

          <div className="border-t border-white/10 bg-black/60 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="mb-5 space-y-2">
              <div className="flex justify-between text-neutral-300">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>

              <div className="flex justify-between text-neutral-300">
                <span>Delivery</span>
                <strong>{money(deliveryFee)}</strong>
              </div>

              <div className="flex justify-between border-t border-white/10 pt-3 text-3xl font-black text-yellow-400">
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>
            </div>

            <button
              type="submit"
              disabled={sending || storeClosed}
              className="w-full rounded-2xl bg-yellow-400 py-5 text-lg font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
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
