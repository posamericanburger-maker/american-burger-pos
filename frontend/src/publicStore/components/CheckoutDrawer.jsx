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

function CheckoutDrawer({
  open = false,
  customer,
  setCustomer,
  subtotal = 0,
  deliveryFee = 0,
  total = 0,
  sending = false,
  onClose,
  onSubmit,
  onCopyBankInfo
}) {
  const cashAmount = Number(onlyNumbers(customer.cashAmount || 0))
  const changeAmount = cashAmount - total

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        />
      )}

      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-full sm:w-[520px] bg-[#101010] border-l border-white/10 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <form onSubmit={onSubmit} className="h-full flex flex-col">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <p className="text-yellow-400 font-black text-sm tracking-widest">
                CHECKOUT
              </p>
              <h2 className="text-3xl font-black text-white">
                Finalizar pedido
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-white/10 text-white font-black"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="space-y-3">
              <h3 className="text-xl font-black text-white">
                Datos del cliente
              </h3>

              <input
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                placeholder="Nombre"
                className="w-full bg-neutral-900 border border-white/10 focus:border-yellow-400 rounded-2xl px-4 py-4 outline-none text-white"
              />

              <input
                value={formatChilePhone(customer.phone)}
                onChange={(e) =>
                  setCustomer({
                    ...customer,
                    phone: normalizeChilePhone(e.target.value)
                  })
                }
                placeholder="+56 9 XXXX XXXX"
                className="w-full bg-neutral-900 border border-white/10 focus:border-yellow-400 rounded-2xl px-4 py-4 outline-none text-white"
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-black text-white">
                Tipo de entrega
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCustomer({ ...customer, deliveryType: 'pickup' })}
                  className={`rounded-2xl px-4 py-4 font-black border transition ${
                    customer.deliveryType === 'pickup'
                      ? 'bg-yellow-400 text-black border-yellow-400'
                      : 'bg-neutral-900 text-white border-white/10'
                  }`}
                >
                  🛍️ Retiro
                </button>

                <button
                  type="button"
                  onClick={() => setCustomer({ ...customer, deliveryType: 'delivery' })}
                  className={`rounded-2xl px-4 py-4 font-black border transition ${
                    customer.deliveryType === 'delivery'
                      ? 'bg-yellow-400 text-black border-yellow-400'
                      : 'bg-neutral-900 text-white border-white/10'
                  }`}
                >
                  🛵 Delivery
                </button>
              </div>

              {customer.deliveryType === 'delivery' && (
                <input
                  value={customer.address}
                  onChange={(e) =>
                    setCustomer({ ...customer, address: e.target.value })
                  }
                  placeholder="Dirección de entrega"
                  className="w-full bg-neutral-900 border border-white/10 focus:border-yellow-400 rounded-2xl px-4 py-4 outline-none text-white"
                />
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-black text-white">
                Forma de pago
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCustomer({ ...customer, paymentMethod: 'cash' })}
                  className={`rounded-2xl px-4 py-4 font-black border transition ${
                    customer.paymentMethod === 'cash'
                      ? 'bg-yellow-400 text-black border-yellow-400'
                      : 'bg-neutral-900 text-white border-white/10'
                  }`}
                >
                  💵 Efectivo
                </button>

                <button
                  type="button"
                  onClick={() => setCustomer({ ...customer, paymentMethod: 'transfer' })}
                  className={`rounded-2xl px-4 py-4 font-black border transition ${
                    customer.paymentMethod === 'transfer'
                      ? 'bg-yellow-400 text-black border-yellow-400'
                      : 'bg-neutral-900 text-white border-white/10'
                  }`}
                >
                  🏦 Transferencia
                </button>
              </div>

              {customer.paymentMethod === 'cash' && (
                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 space-y-3">
                  <label className="block font-black text-yellow-400">
                    ¿Con cuánto pagas?
                  </label>

                  <input
                    value={customer.cashAmount}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        cashAmount: onlyNumbers(e.target.value)
                      })
                    }
                    placeholder="Ej: 20000"
                    className="w-full bg-black border border-white/10 focus:border-yellow-400 rounded-2xl px-4 py-4 outline-none text-white"
                  />

                  {cashAmount > 0 && (
                    <p className="font-bold text-white">
                      Vuelto estimado:{' '}
                      <span className="text-yellow-400">
                        {money(Math.max(changeAmount, 0))}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {customer.paymentMethod === 'transfer' && (
                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 space-y-2 text-neutral-300">
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
                    className="w-full bg-yellow-400 text-black rounded-2xl py-3 font-black"
                  >
                    Copiar datos bancarios
                  </button>
                </div>
              )}
            </div>

            <textarea
              value={customer.notes}
              onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
              placeholder="Notas del pedido"
              className="w-full bg-neutral-900 border border-white/10 focus:border-yellow-400 rounded-2xl px-4 py-4 outline-none text-white min-h-[120px]"
            />
          </div>

          <div className="p-6 border-t border-white/10 bg-black/50">
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-neutral-300">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>

              <div className="flex justify-between text-neutral-300">
                <span>Delivery</span>
                <strong>{money(deliveryFee)}</strong>
              </div>

              <div className="flex justify-between text-yellow-400 text-3xl font-black pt-3 border-t border-white/10">
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black py-5 rounded-2xl font-black text-lg transition"
            >
              {sending ? 'Enviando pedido...' : 'Enviar pedido al POS'}
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}

export default CheckoutDrawer
