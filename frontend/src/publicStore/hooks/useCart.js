import { useMemo, useState } from 'react'

export const useCart = () => {
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  const addToCart = (product = {}) => {
    const productId = product.id || product.product_id

    if (!productId) {
      console.error('No se pudo agregar el producto: falta el ID', product)
      return
    }

    setCart((current) => {
      const exists = current.find(
        (item) => String(item.id) === String(productId)
      )

      if (exists) {
        return current.map((item) =>
          String(item.id) === String(productId)
            ? {
                ...item,
                quantity: Number(item.quantity || 1) + 1
              }
            : item
        )
      }

      return [
        ...current,
        {
          id: productId,
          product_id: productId,
          name: product.name || 'Producto',
          product_name: product.product_name || product.name || 'Producto',
          category_name: product.category_name || '',
          description: product.description || '',
          image_url: product.image_url || '',
          price: Number(product.price || 0),
          unit_price: Number(product.unit_price || product.price || 0),
          quantity: 1
        }
      ]
    })

    /*
     * Importante:
     * No se abre el carrito automáticamente.
     * El cliente puede continuar agregando productos.
     */
  }

  const decreaseItem = (id) => {
    setCart((current) =>
      current
        .map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                quantity: Math.max(
                  0,
                  Number(item.quantity || 1) - 1
                )
              }
            : item
        )
        .filter((item) => Number(item.quantity || 0) > 0)
    )
  }

  const increaseItem = (id) => {
    setCart((current) =>
      current.map((item) =>
        String(item.id) === String(id)
          ? {
              ...item,
              quantity: Number(item.quantity || 1) + 1
            }
          : item
      )
    )
  }

  const removeItem = (id) => {
    setCart((current) =>
      current.filter(
        (item) => String(item.id) !== String(id)
      )
    )
  }

  const clearCart = () => {
    setCart([])
    setCartOpen(false)
  }

  const openCart = () => {
    setCartOpen(true)
  }

  const closeCart = () => {
    setCartOpen(false)
  }

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = Number(item.price || item.unit_price || 0)
      const quantity = Math.max(
        1,
        Number(item.quantity || 1)
      )

      return sum + price * quantity
    }, 0)
  }, [cart])

  const itemCount = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum + Math.max(1, Number(item.quantity || 1)),
      0
    )
  }, [cart])

  return {
    cart,
    cartOpen,
    setCartOpen,
    openCart,
    closeCart,
    addToCart,
    decreaseItem,
    increaseItem,
    removeItem,
    clearCart,
    subtotal,
    itemCount
  }
}
