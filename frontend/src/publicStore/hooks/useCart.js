import { useMemo, useState } from 'react'

export const useCart = () => {
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  const addToCart = (product) => {
    setCartOpen(true)

    setCart((current) => {
      const exists = current.find((item) => item.id === product.id)

      if (exists) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...current,
        {
          id: product.id,
          product_id: product.id,
          name: product.name,
          product_name: product.name,
          category_name: product.category_name,
          price: Number(product.price || 0),
          unit_price: Number(product.price || 0),
          quantity: 1
        }
      ]
    })
  }

  const decreaseItem = (id) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const increaseItem = (id) => {
    setCart((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
    setCartOpen(false)
  }

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    )
  }, [cart])

  const itemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
  }, [cart])

  return {
    cart,
    cartOpen,
    setCartOpen,
    addToCart,
    decreaseItem,
    increaseItem,
    clearCart,
    subtotal,
    itemCount
  }
}
