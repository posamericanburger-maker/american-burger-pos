const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

function ComboProductRow({
  product,
  emoji,
  label
}) {
  if (!product) {
    return null
  }

  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="text-2xl"
          aria-hidden="true"
        >
          {emoji}
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">
            {product.name ||
              product.product_name ||
              label}
          </p>

          <p className="text-xs text-neutral-400">
            {label}
          </p>
        </div>
      </div>

      <strong className="ml-3 shrink-0 text-yellow-400">
        {money(
          product.price ||
            product.unit_price ||
            0
        )}
      </strong>
    </div>
  )
}

function ComboSuggestion({
  open = false,
  burger = null,
  fries = null,
  drink = null,
  onClose = () => {},
  onAddCombo = () => {}
}) {
  const suggestedProducts = [
    fries,
    drink
  ].filter(Boolean)

  if (
    !open ||
    suggestedProducts.length === 0
  ) {
    return null
  }

  const suggestionTotal =
    suggestedProducts.reduce(
      (sum, product) =>
        sum +
        Number(
          product.price ||
            product.unit_price ||
            0
        ),
      0
    )

  const title =
    fries && drink
      ? '¿Agregamos papas y bebida?'
      : fries
        ? '¿Agregamos unas papas?'
        : '¿Agregamos una bebida?'

  const buttonText =
    fries && drink
      ? 'AGREGAR AMBOS'
      : 'AGREGAR AL PEDIDO'

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label="Sugerencia para completar el pedido"
      className="
        fixed
        bottom-[112px]
        left-4
        right-4
        z-[70]
        mx-auto
        max-w-md
        overflow-hidden
        rounded-[26px]
        border
        border-yellow-300
        bg-[#111111]
        text-white
        shadow-[0_24px_70px_rgba(0,0,0,0.5)]

        sm:bottom-[118px]
        sm:left-auto
        sm:right-6
        sm:mx-0
        sm:w-[390px]
      "
    >
      <div className="h-1.5 w-full bg-yellow-400" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
              Completa tu pedido
            </p>

            <h3 className="mt-2 text-xl font-black leading-tight">
              {title}
            </h3>

            {burger?.name && (
              <p className="mt-1 text-sm text-neutral-400">
                Ideal para acompañar tu{' '}
                {burger.name}.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar sugerencia"
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-white/10
              text-xl
              text-white
              transition
              hover:bg-white/20
              active:scale-95
            "
          >
            ×
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <ComboProductRow
            product={fries}
            emoji="🍟"
            label="Papas fritas"
          />

          <ComboProductRow
            product={drink}
            emoji="🥤"
            label="Bebida"
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
          <div>
            <p className="text-xs font-bold uppercase text-neutral-500">
              Agregar al pedido
            </p>

            <p className="mt-1 text-2xl font-black text-yellow-400">
              {money(suggestionTotal)}
            </p>
          </div>

          <button
            type="button"
            onClick={onAddCombo}
            className="
              rounded-2xl
              bg-yellow-400
              px-5
              py-3.5
              text-sm
              font-black
              text-black
              shadow-lg
              shadow-yellow-400/20
              transition
              hover:bg-yellow-300
              active:scale-[0.97]
            "
          >
            {buttonText}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="
            mt-3
            w-full
            py-2
            text-xs
            font-black
            uppercase
            tracking-wide
            text-neutral-500
            transition
            hover:text-white
          "
        >
          No, gracias
        </button>
      </div>
    </aside>
  )
}

export default ComboSuggestion
