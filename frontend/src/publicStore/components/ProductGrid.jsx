import ProductCard from './ProductCard'

function ProductGrid({ products = [], loading = false, onAdd }) {
  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="h-[460px] rounded-[32px] bg-neutral-900 border border-white/10 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className="bg-neutral-900 border border-white/10 rounded-[32px] p-12 text-center">
        <div className="text-6xl mb-4">🍔</div>
        <h3 className="text-2xl font-black text-white">
          No hay productos disponibles
        </h3>
        <p className="text-neutral-400 mt-2">
          Intenta nuevamente más tarde.
        </p>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAdd={onAdd}
        />
      ))}
    </div>
  )
}

export default ProductGrid
