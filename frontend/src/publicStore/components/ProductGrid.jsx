import ProductCard from './ProductCard'

function ProductGrid({ products = [], loading = false, onAdd }) {
  if (loading) {
    return (
      <div className="text-center text-neutral-400 py-10">
        Cargando menú...
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className="text-center text-neutral-400 py-10">
        No encontramos productos.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
