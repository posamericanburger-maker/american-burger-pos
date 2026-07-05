const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

function CartDrawer({
  open = false,
  cart = [],
  subtotal = 0,
  deliveryFee = 0,
  total = 0,
  onClose,
  onIncrease,
  onDecrease,
  onContinue
}) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        />
      )}

      <aside
        className={`fixed top-0 right-0 z-[60] h-full w-full sm:w-[440px] bg-[#111111] border-l border-white/10 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-white">Mi pedido</h2>
              <p className="text-neutral-400 text-sm">American Burger</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-white/10 text-white font-black"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="text-7xl mb-4">🛒</div>
                <h3 className="text-2xl font-black text-white">Tu carrito está vacío</h3>
                <p className="text-neutral-400 mt-2">
                  Agrega tus productos favoritos para continuar.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-black/40 border border-white/10 rounded-3xl p-4"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <h3 className="font-black text-white">{item.name}</h3>
                      <p className="text-neutral-400 text-sm">
                        {money(item.price)} x {item.quantity}
                      </p>
                    </div>

                    <strong className="text-yellow-400">
                      {money(Number(item.price || 0) * Number(item.quantity || 1))}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onDecrease(item.id)}
                        className="w-10 h-10 rounded-full bg-neutral-800 text-white font-black"
                      >
                        -
                      </button>

                      <span className="font-black text-white">{item.quantity}</span>

                      <button
                        type="button"
                        onClick={() => onIncrease(item.id)}
                        className="w-10 h-10 rounded-full bg-neutral-800 text-white font-black"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs text-neutral-500 font-bold">
                      Editar pronto
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 border-t border-white/10 bg-black/40">
            <div className="space-y-3 mb-5">
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
              type="button"
              disabled={cart.length === 0}
              onClick={onContinue}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black py-5 rounded-2xl font-black text-lg transition"
            >
              CONTINUAR
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default CartDrawer
