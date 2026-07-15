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
  storeClosed = false,
  storeClosedMessage = '',
  onClose,
  onIncrease,
  onDecrease,
  onContinue
}) {
  const defaultClosedMessage =
    'American Burger no está recibiendo pedidos en este momento porque la caja está cerrada.'

  const closedMessage =
    storeClosedMessage || defaultClosedMessage

  const canContinue =
    cart.length > 0 && !storeClosed

  const handleContinue = () => {
    if (!canContinue) {
      return
    }

    if (typeof onContinue === 'function') {
      onContinue()
    }
  }

  const handleIncrease = (itemId) => {
    if (typeof onIncrease === 'function') {
      onIncrease(itemId)
    }
  }

  const handleDecrease = (itemId) => {
    if (typeof onDecrease === 'function') {
      onDecrease(itemId)
    }
  }

  return (
    <>
      {open && (
        <div
          onClick={onClose}
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
        aria-label="Mi pedido"
        className={`
          fixed
          right-0
          top-0
          z-[60]
          h-full
          w-full
          border-l
          border-white/10
          bg-[#111111]
          shadow-2xl
          transition-transform
          duration-300
          sm:w-[440px]
          ${
            open
              ? 'translate-x-0'
              : 'translate-x-full'
          }
        `}
      >
        <div className="flex h-full flex-col">
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
              <h2 className="text-3xl font-black text-white">
                Mi pedido
              </h2>

              <p className="text-sm text-neutral-400">
                American Burger
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar carrito"
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-white/10
                text-xl
                font-black
                text-white
                transition
                hover:bg-white/20
                active:scale-95
              "
            >
              ✕
            </button>
          </div>

          <div
            className="
              flex-1
              space-y-4
              overflow-y-auto
              p-6
            "
          >
            {storeClosed && (
              <div
                role="alert"
                className="
                  rounded-3xl
                  border
                  border-yellow-300/50
                  bg-yellow-400
                  px-5
                  py-5
                  text-black
                  shadow-lg
                "
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
                      {closedMessage}
                    </p>

                    <p className="mt-2 text-sm font-semibold text-black/70">
                      Puedes revisar los productos de tu
                      carrito, pero no podrás finalizar el
                      pedido hasta que la caja vuelva a
                      estar abierta.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {cart.length === 0 ? (
              <div
                className="
                  flex
                  h-full
                  min-h-[350px]
                  flex-col
                  items-center
                  justify-center
                  text-center
                "
              >
                <div className="mb-4 text-7xl">
                  🛒
                </div>

                <h3 className="text-2xl font-black text-white">
                  Tu carrito está vacío
                </h3>

                <p className="mt-2 text-neutral-400">
                  Agrega tus productos favoritos para
                  continuar.
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const itemId =
                  item.id || item.product_id

                const itemPrice = Number(
                  item.price ||
                    item.unit_price ||
                    0
                )

                const itemQuantity = Number(
                  item.quantity || 1
                )

                const itemTotal =
                  itemPrice * itemQuantity

                return (
                  <div
                    key={itemId}
                    className="
                      rounded-3xl
                      border
                      border-white/10
                      bg-black/40
                      p-4
                    "
                  >
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <h3
                          className="
                            break-words
                            font-black
                            text-white
                          "
                        >
                          {item.name ||
                            item.product_name ||
                            'Producto'}
                        </h3>

                        <p className="mt-1 text-sm text-neutral-400">
                          {money(itemPrice)} x{' '}
                          {itemQuantity}
                        </p>
                      </div>

                      <strong
                        className="
                          shrink-0
                          text-yellow-400
                        "
                      >
                        {money(itemTotal)}
                      </strong>
                    </div>

                    <div
                      className="
                        mt-4
                        flex
                        items-center
                        justify-between
                        gap-4
                      "
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleDecrease(itemId)
                          }
                          aria-label={`Disminuir cantidad de ${
                            item.name ||
                            item.product_name ||
                            'producto'
                          }`}
                          className="
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-full
                            bg-neutral-800
                            text-lg
                            font-black
                            text-white
                            transition
                            hover:bg-neutral-700
                            active:scale-95
                          "
                        >
                          −
                        </button>

                        <span
                          className="
                            min-w-6
                            text-center
                            font-black
                            text-white
                          "
                        >
                          {itemQuantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleIncrease(itemId)
                          }
                          aria-label={`Aumentar cantidad de ${
                            item.name ||
                            item.product_name ||
                            'producto'
                          }`}
                          className="
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-full
                            bg-neutral-800
                            text-lg
                            font-black
                            text-white
                            transition
                            hover:bg-neutral-700
                            active:scale-95
                          "
                        >
                          +
                        </button>
                      </div>

                      <span
                        className="
                          text-xs
                          font-bold
                          text-neutral-500
                        "
                      >
                        Editar pronto
                      </span>
                    </div>
                  </div>
                )
              })
            )}
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
            <div className="mb-5 space-y-3">
              <div
                className="
                  flex
                  justify-between
                  text-neutral-300
                "
              >
                <span>Subtotal</span>

                <strong>{money(subtotal)}</strong>
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

                <strong>{money(total)}</strong>
              </div>
            </div>

            {storeClosed && (
              <div
                className="
                  mb-4
                  rounded-2xl
                  border
                  border-yellow-400/30
                  bg-yellow-400/10
                  px-4
                  py-3
                  text-center
                  text-sm
                  font-bold
                  text-yellow-300
                "
              >
                La caja está cerrada. No es posible
                enviar pedidos en este momento.
              </div>
            )}

            <button
              type="button"
              disabled={!canContinue}
              onClick={handleContinue}
              className={`
                w-full
                rounded-2xl
                py-5
                text-lg
                font-black
                transition
                ${
                  canContinue
                    ? `
                      bg-yellow-400
                      text-black
                      hover:bg-yellow-300
                      active:scale-[0.98]
                    `
                    : `
                      cursor-not-allowed
                      bg-neutral-700
                      text-neutral-400
                    `
                }
              `}
            >
              {storeClosed
                ? 'PEDIDOS CERRADOS'
                : cart.length === 0
                  ? 'CARRITO VACÍO'
                  : 'CONTINUAR'}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default CartDrawer
