const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const getProductEmoji = (product = {}) => {
  const text = `${product.name || ''} ${product.category_name || ''}`.toLowerCase()

  if (text.includes('papa') || text.includes('fries')) return '🍟'
  if (text.includes('bebida') || text.includes('coca') || text.includes('lata')) return '🥤'
  if (text.includes('alita') || text.includes('crispy') || text.includes('pollo')) return '🍗'

  return '🍔'
}

function ProductCard({ product, onAdd }) {
  return (
    <article className="group bg-white rounded-[28px] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-black">
      <div className="relative h-56 bg-gradient-to-br from-yellow-100 via-white to-red-50 flex items-center justify-center overflow-hidden">
        <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full text-xs font-black">
          Popular
        </div>

        <div className="absolute top-4 right-4 bg-black text-yellow-400 px-4 py-2 rounded-full text-xs font-black">
          Online
        </div>

        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="text-[120px] transition duration-500 group-hover:scale-110 drop-shadow-xl">
            {getProductEmoji(product)}
          </div>
        )}
      </div>

      <div className="p-6">
        <p className="text-red-600 text-xs font-black uppercase tracking-widest">
          {product.category_name || 'American Burger'}
        </p>

        <h3 className="mt-3 text-2xl font-black leading-tight min-h-[64px]">
          {product.name}
        </h3>

        <p className="mt-3 text-neutral-600 text-sm leading-relaxed line-clamp-3 min-h-[64px]">
          {product.description || 'Producto American Burger.'}
        </p>

        <div className="mt-5 flex items-center gap-1 text-yellow-500">
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
          <strong className="text-3xl font-black text-black">
            {money(product.price)}
          </strong>

          <button
            type="button"
            onClick={() => onAdd(product)}
            className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-4 rounded-full font-black transition-all duration-300 shadow-lg"
          >
            Agregar
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
