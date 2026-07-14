import ProductCard from './ProductCard'

function ProductSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="
        overflow-hidden
        rounded-[24px]
        bg-white
        shadow-lg
        sm:rounded-[28px]
      "
    >
      <div className="h-44 animate-pulse bg-neutral-200 sm:h-56" />

      <div className="p-4 sm:p-6">
        <div className="h-3 w-28 animate-pulse rounded-full bg-neutral-200" />

        <div className="mt-4 h-7 w-3/4 animate-pulse rounded-lg bg-neutral-200" />

        <div className="mt-3 h-4 w-full animate-pulse rounded-lg bg-neutral-200" />

        <div className="mt-2 h-4 w-4/5 animate-pulse rounded-lg bg-neutral-200" />

        <div className="mt-5 flex gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-4 w-4 animate-pulse rounded-full bg-neutral-200"
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="h-8 w-28 animate-pulse rounded-lg bg-neutral-200" />

          <div className="h-12 w-28 animate-pulse rounded-full bg-neutral-200" />
        </div>
      </div>
    </article>
  )
}

function ProductGrid({
  products = [],
  loading = false,
  onAdd = () => {}
}) {
  if (loading) {
    return (
      <div
        aria-label="Cargando menú"
        className="
          grid
          grid-cols-1
          gap-4
          lg:grid-cols-2
        "
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div
        className="
          flex
          min-h-[260px]
          flex-col
          items-center
          justify-center
          rounded-[28px]
          border
          border-dashed
          border-black/15
          bg-white
          px-6
          py-12
          text-center
        "
      >
        <div className="mb-4 text-6xl">🍔</div>

        <h3 className="text-xl font-black text-black">
          No encontramos productos
        </h3>

        <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
          Prueba seleccionando otra categoría o utilizando una búsqueda
          diferente.
        </p>
      </div>
    )
  }

  return (
    <div
      className="
        grid
        grid-cols-1
        items-stretch
        gap-4
        lg:grid-cols-2
      "
    >
      {products.map((product, index) => {
        const productKey =
          product?.id ||
          product?.product_id ||
          `${product?.name || 'producto'}-${index}`

        return (
          <ProductCard
            key={productKey}
            product={product}
            onAdd={onAdd}
          />
        )
      })}
    </div>
  )
}

export default ProductGrid
