const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

function ProductCard({ product, onAdd }) {
  return (
    <article className="group relative bg-[#111111] rounded-[32px] overflow-hidden border border-white/10 hover:border-yellow-400/70 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-500/10">
      <div className="absolute top-4 left-4 z-10 bg-yellow-400 text-black px-4 py-2 rounded-full text-xs font-black shadow-lg">
        POPULAR
      </div>

      <div className="relative h-64 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,199,44,0.18),transparent_55%)]" />

        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="relative w-full h-full object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center transition duration-500 group-hover:scale-110">
            <span className="text-8xl drop-shadow-2xl">🍔</span>
          </div>
        )}
      </div>

      <div className="p-6">
        <p className="text-yellow-400 text-xs font-black uppercase tracking-widest">
          {product.category_name || 'American Burger'}
        </p>

        <h3 className="mt-3 text-2xl font-black text-white leading-tight min-h-[64px]">
          {product.name}
        </h3>

        <p className="mt-3 text-neutral-400 text-sm leading-relaxed line-clamp-3 min-h-[64px]">
          {product.description || 'Producto premium American Burger.'}
        </p>

        <div className="mt-5 flex items-center gap-1 text-yellow-400">
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span className="ml-2 text-xs text-neutral-500 font-bold">
            Recomendado
          </span>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-neutral-500 font-bold">
              Precio
            </p>
            <strong className="text-3xl font-black text-yellow-400">
              {money(product.price)}
            </strong>
          </div>

          <button
            type="button"
            onClick={() => onAdd(product)}
            className="bg-red-600 hover:bg-yellow-400 text-white hover:text-black px-6 py-4 rounded-2xl font-black transition-all duration-300 shadow-lg shadow-red-700/20"
          >
            + Agregar
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
