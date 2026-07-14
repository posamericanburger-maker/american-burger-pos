const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

function FloatingCart({
  itemCount = 0,
  total = 0,
  onClick = () => {}
}) {
  const safeItemCount = Math.max(0, Number(itemCount || 0))
  const safeTotal = Number(total || 0)

  if (safeItemCount <= 0) {
    return null
  }

  return (
    <div
      className="
        pointer-events-none
        fixed
        inset-x-0
        bottom-0
        z-40
        px-4
        pb-[calc(14px+env(safe-area-inset-bottom))]
        pt-3
        sm:inset-x-auto
        sm:bottom-6
        sm:right-6
        sm:p-0
      "
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`Ver pedido con ${safeItemCount} ${
          safeItemCount === 1 ? 'producto' : 'productos'
        }, total ${money(safeTotal)}`}
        className="
          pointer-events-auto
          flex
          w-full
          items-center
          justify-between
          gap-4
          rounded-2xl
          border
          border-yellow-300
          bg-yellow-400
          px-4
          py-3.5
          text-black
          shadow-[0_12px_35px_rgba(250,204,21,0.35)]
          transition
          hover:bg-yellow-300
          active:scale-[0.98]

          sm:w-auto
          sm:min-w-[250px]
          sm:rounded-3xl
          sm:px-5
          sm:py-4
          sm:hover:scale-[1.03]
        "
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="
              relative
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-black
              text-xl
            "
          >
            🛒

            <span
              className="
                absolute
                -right-2
                -top-2
                flex
                h-6
                min-w-6
                items-center
                justify-center
                rounded-full
                bg-red-600
                px-1.5
                text-xs
                font-black
                text-white
                ring-2
                ring-yellow-400
              "
            >
              {safeItemCount > 99 ? '99+' : safeItemCount}
            </span>
          </div>

          <div className="min-w-0 text-left">
            <p className="text-xs font-black uppercase leading-none tracking-wide">
              Mi pedido
            </p>

            <p className="mt-1 truncate text-base font-black leading-tight sm:text-lg">
              {safeItemCount}{' '}
              {safeItemCount === 1 ? 'producto' : 'productos'}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-bold uppercase leading-none opacity-70">
            Ver pedido
          </p>

          <p className="mt-1 text-xl font-black leading-none">
            {money(safeTotal)}
          </p>
        </div>
      </button>
    </div>
  )
}

export default FloatingCart
