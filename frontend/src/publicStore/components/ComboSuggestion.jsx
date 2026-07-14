const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

function SuggestedProductRow({
  product = null,
  emoji = '🍔',
  label = 'Producto'
}) {
  if (!product) {
    return null
  }

  const productName =
    product.name ||
    product.product_name ||
    label

  const productPrice = Number(
    product.price ||
    product.unit_price ||
    0
  )

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="text-2xl"
        >
          {emoji}
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">
            {productName}
          </p>

          <p className="text-xs text-neutral-400">
            {label}
          </p>
        </div>
      </div>

      <strong className="shrink-0 text-yellow-400">
        {money(productPrice)}
      </strong>
    </div>
  )
}

function ComboSuggestion({
  open = false,
  sourceProduct = null,
  suggestionType = '',
  combo = null,
  drink = null,
  onClose = () => {},
  onAdd = () => {}
}) {
  const isComboSuggestion =
    suggestionType === 'combo' &&
    Boolean(combo)

  const isDrinkSuggestion =
    suggestionType === 'drink' &&
    Boolean(drink)

  if (
    !open ||
    (!isComboSuggestion &&
      !isDrinkSuggestion)
  ) {
    return null
  }

  const suggestedProduct =
    isComboSuggestion
      ? combo
      : drink

  const suggestedPrice = Number(
    suggestedProduct?.price ||
    suggestedProduct?.unit_price ||
    0
  )

  const sourceName =
    sourceProduct?.name ||
    sourceProduct?.product_name ||
    'tu pedido'

  const title = isComboSuggestion
    ? 'Convierte tu hamburguesa en combo'
    : '¿Agregamos una bebida?'

  const description = isComboSuggestion
    ? `Agrega papas y bebida a tu ${sourceName}.`
    : `Ideal para acompañar tu ${sourceName}.`

  const buttonText = isComboSuggestion
    ? 'AGREGAR ARMA TU COMBO'
    : 'AGREGAR BEBIDA'

  const productLabel = isComboSuggestion
    ? 'Papas + bebida'
    : 'Bebida'

  const productEmoji = isComboSuggestion
    ? '🍟'
    : '🥤'

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
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
              Completa tu pedido
            </p>

            <h3 className="mt-2 text-xl font-black leading-tight">
              {title}
            </h3>

            <p className="mt-1 text-sm leading-5 text-neutral-400">
              {description}
            </p>
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

        <div className="mt-4">
          <SuggestedProductRow
            product={suggestedProduct}
            emoji={productEmoji}
            label={productLabel}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
          <div>
            <p className="text-xs font-bold uppercase text-neutral-500">
              Agregar al pedido
            </p>

            <p className="mt-1 text-2xl font-black text-yellow-400">
              {money(suggestedPrice)}
            </p>
          </div>

          <button
            type="button"
            onClick={onAdd}
            className="
              max-w-[210px]
              rounded-2xl
              bg-yellow-400
              px-5
              py-3.5
              text-sm
              font-black
              leading-tight
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
