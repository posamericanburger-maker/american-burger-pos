const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

function FloatingCart({ itemCount = 0, total = 0, onClick }) {
  if (itemCount <= 0) return null

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        fixed
        bottom-6
        right-6
        z-50
        bg-yellow-400
        hover:bg-yellow-300
        text-black
        rounded-3xl
        px-5
        py-4
        shadow-2xl
        shadow-yellow-400/30
        border
        border-yellow-300
        transition
        hover:scale-105
      "
    >
      <div className="flex items-center gap-4">
        <div className="relative text-3xl">
          🛒

          <span className="
            absolute
            -top-3
            -right-3
            bg-red-600
            text-white
            text-xs
            w-6
            h-6
            rounded-full
            flex
            items-center
            justify-center
            font-black
          ">
            {itemCount}
          </span>
        </div>

        <div className="text-left">
          <p className="text-xs font-black leading-none">
            Mi pedido
          </p>

          <p className="text-lg font-black leading-tight">
            {money(total)}
          </p>
        </div>
      </div>
    </button>
  )
}

export default FloatingCart
