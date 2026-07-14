import { useEffect, useRef, useState } from 'react'

const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const getProductEmoji = (product = {}) => {
  const text = `${product.name || ''} ${
    product.category_name || ''
  }`.toLowerCase()

  if (
    text.includes('papa') ||
    text.includes('fries') ||
    text.includes('frita')
  ) {
    return '🍟'
  }

  if (
    text.includes('bebida') ||
    text.includes('coca') ||
    text.includes('lata') ||
    text.includes('sprite') ||
    text.includes('fanta')
  ) {
    return '🥤'
  }

  if (
    text.includes('alita') ||
    text.includes('crispy') ||
    text.includes('pollo') ||
    text.includes('tender')
  ) {
    return '🍗'
  }

  return '🍔'
}

function ProductCard({
  product = {},
  onAdd = () => {}
}) {
  const [added, setAdded] = useState(false)
  const [adding, setAdding] = useState(false)
  const timeoutRef = useRef(null)

  const productName = product.name || 'Producto'
  const productPrice = Number(product.price || 0)
  const isAvailable = product.available !== false

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleAdd = async () => {
    if (!isAvailable || adding) {
      return
    }

    try {
      setAdding(true)

      await Promise.resolve(onAdd(product))

      setAdded(true)

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = window.setTimeout(() => {
        setAdded(false)
      }, 1600)
    } catch (error) {
      console.error('Error al agregar el producto:', error)
    } finally {
      setAdding(false)
    }
  }

  return (
    <article
      className="
        group
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-[24px]
        bg-white
        text-black
        shadow-lg
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-2xl
        sm:rounded-[28px]
      "
    >
      <div
        className="
          relative
          flex
          h-44
          items-center
          justify-center
          overflow-hidden
          bg-gradient-to-br
          from-yellow-100
          via-white
          to-red-50
          sm:h-56
        "
      >
        <div
          className="
            absolute
            left-3
            top-3
            z-10
            rounded-full
            bg-red-600
            px-3
            py-1.5
            text-[10px]
            font-black
            uppercase
            tracking-wide
            text-white
            sm:left-4
            sm:top-4
            sm:px-4
            sm:py-2
            sm:text-xs
          "
        >
          Popular
        </div>

        <div
          className={`
            absolute
            right-3
            top-3
            z-10
            rounded-full
            px-3
            py-1.5
            text-[10px]
            font-black
            uppercase
            tracking-wide
            sm:right-4
            sm:top-4
            sm:px-4
            sm:py-2
            sm:text-xs
            ${
              isAvailable
                ? 'bg-black text-yellow-400'
                : 'bg-neutral-600 text-white'
            }
          `}
        >
          {isAvailable ? 'Online' : 'Agotado'}
        </div>

        {product.image_url ? (
          <img
            src={product.image_url}
            alt={productName}
            loading="lazy"
            decoding="async"
            className="
              h-full
              w-full
              object-cover
              transition-transform
              duration-500
              group-hover:scale-105
            "
            onError={(event) => {
              event.currentTarget.style.display = 'none'
              event.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : null}

        <div
          className={`
            text-[88px]
            drop-shadow-xl
            transition-transform
            duration-500
            group-hover:scale-110
            sm:text-[120px]
            ${product.image_url ? 'hidden' : ''}
          `}
        >
          {getProductEmoji(product)}
        </div>

        {!isAvailable && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45">
            <span className="rounded-full bg-white px-5 py-2 text-sm font-black text-black">
              NO DISPONIBLE
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-red-600 sm:text-xs">
          {product.category_name || 'American Burger'}
        </p>

        <h3
          className="
            mt-2
            text-xl
            font-black
            leading-tight
            text-black
            sm:mt-3
            sm:min-h-[58px]
            sm:text-2xl
          "
        >
          {productName}
        </h3>

        <p
          className="
            mt-2
            line-clamp-2
            text-sm
            leading-relaxed
            text-neutral-600
            sm:mt-3
            sm:min-h-[44px]
          "
        >
          {product.description || 'Producto American Burger.'}
        </p>

        <div className="mt-3 flex items-center gap-1 text-yellow-500 sm:mt-5">
          <span aria-hidden="true">★</span>
          <span aria-hidden="true">★</span>
          <span aria-hidden="true">★</span>
          <span aria-hidden="true">★</span>
          <span aria-hidden="true">★</span>

          <span className="ml-1 text-[10px] font-bold text-neutral-500 sm:ml-2 sm:text-xs">
            Recomendado
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5 sm:pt-6">
          <strong className="whitespace-nowrap text-2xl font-black text-black sm:text-3xl">
            {money(productPrice)}
          </strong>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!isAvailable || adding}
            aria-label={`Agregar ${productName} al pedido`}
            className={`
              min-w-[112px]
              rounded-full
              px-5
              py-3.5
              text-sm
              font-black
              shadow-lg
              transition-all
              duration-200
              active:scale-95
              sm:min-w-[126px]
              sm:px-6
              sm:py-4
              sm:text-base
              ${
                added
                  ? 'bg-green-600 text-white shadow-green-600/25'
                  : 'bg-yellow-400 text-black shadow-yellow-400/25 hover:bg-yellow-300'
              }
              disabled:cursor-not-allowed
              disabled:bg-neutral-300
              disabled:text-neutral-600
              disabled:shadow-none
            `}
          >
            {adding
              ? 'Agregando...'
              : added
                ? 'Agregado ✓'
                : isAvailable
                  ? 'Agregar'
                  : 'Agotado'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
