const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

function ComboSuggestion({
  open = false,
  burger = null,
  fries = null,
  drink = null,
  onClose = () => {},
  onAddCombo = () => {}
}) {
  if (!open || !fries || !drink) {
    return null
  }

  const friesPrice = Number(fries.price || 0)
  const drinkPrice = Number(drink.price || 0)
  const comboTotal = friesPrice + drinkPrice

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label="Sugerencia para completar el pedido"
      className="
        fixed
        bottom-[106px]
        left-4
        right-4
        z-[55]
        mx-auto
        max-w-md
        overflow-hidden
        rounded-[26px]
        border
        border-yellow-300
        bg-[#111111]
        text-white
        shadow-[0_24px_70px_rgba(0,0,0,0.45)]

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
              ¿Agregamos papas y bebida?
            </h3>

            {burger?.name && (
              <p className="mt-1 text-sm text-neutral-400">
                Ideal para acompañar tu {burger.name}.
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
          <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="text-2xl">🍟</span>

              <div className="min-w-0">
                <p className="truncate text-sm font-black">
                  {fries.name}
                </p>

                <p className="text-xs text-neutral-400">
                  Papas fritas
                </p>
              </div>
            </div>

            <strong className="shrink-0 text-yellow-400">
              {money(friesPrice)}
            </strong>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="text-2xl">🥤</span>

              <div className="min-w-0">
                <p className="truncate text-sm font-black">
                  {drink.name}
                </p>

                <p className="text-xs text-neutral-400">
                  Bebida
                </p>
              </div>
            </div>

            <strong className="shrink-0 text-yellow-400">
              {money(drinkPrice)}
            </strong>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <div>
            <p className="text-xs font-bold uppercase text-neutral-500">
              Agregar ambos
            </p>

            <p className="mt-1 text-2xl font-black text-yellow-400">
              {money(comboTotal)}
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
            AGREGAR COMBO
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
