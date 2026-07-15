import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  getPublicProducts
} from '../publicStoreApi'

const DEFAULT_CLOSED_MESSAGE =
  'American Burger no está recibiendo pedidos en este momento porque la caja está cerrada.'

export const useProducts = () => {
  const [products, setProducts] =
    useState([])

  const [
    selectedCategory,
    setSelectedCategory
  ] = useState('TODOS')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [storeOpen, setStoreOpen] =
    useState(true)

  const [
    storeMessage,
    setStoreMessage
  ] = useState('')

  const loadProducts = useCallback(
    async () => {
      try {
        setLoading(true)
        setError('')

        const result =
          await getPublicProducts()

        const receivedProducts =
          Array.isArray(result?.products)
            ? result.products
            : []

        const receivedStoreOpen =
          result?.storeOpen !== false

        const receivedStoreMessage =
          String(
            result?.storeMessage || ''
          ).trim()

        setProducts(receivedProducts)
        setStoreOpen(
          receivedStoreOpen
        )

        if (!receivedStoreOpen) {
          const closedMessage =
            receivedStoreMessage ||
            DEFAULT_CLOSED_MESSAGE

          setStoreMessage(
            closedMessage
          )

          /*
           * También lo colocamos en error para
           * mantener compatibilidad con el Home.jsx
           * actual, que ya muestra:
           *
           * message || error
           */
          setError(closedMessage)
        } else {
          setStoreMessage(
            receivedStoreMessage
          )

          setError('')
        }
      } catch (err) {
        console.error(
          'Error cargando productos:',
          err
        )

        const backendMessage =
          String(
            err?.response?.data
              ?.message || ''
          ).trim()

        const finalMessage =
          backendMessage ||
          'No se pudieron cargar los productos'

        setError(finalMessage)

        /*
         * Si el backend responde explícitamente
         * que la caja está cerrada, conservamos
         * ese estado para que también se vea
         * dentro del carrito.
         */
        const normalizedMessage =
          finalMessage
            .normalize('NFD')
            .replace(
              /[\u0300-\u036f]/g,
              ''
            )
            .toLowerCase()

        const closed =
          normalizedMessage.includes(
            'caja cerrada'
          ) ||
          normalizedMessage.includes(
            'caja esta cerrada'
          ) ||
          normalizedMessage.includes(
            'no esta recibiendo pedidos'
          ) ||
          normalizedMessage.includes(
            'pedidos cerrados'
          )

        if (closed) {
          setStoreOpen(false)
          setStoreMessage(
            finalMessage
          )
        }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const categories = useMemo(() => {
    const list = products.map(
      (product) =>
        product.category_name ||
        product.category?.name ||
        'Productos'
    )

    return [
      'TODOS',
      ...new Set(list)
    ]
  }, [products])

  const filteredProducts =
    useMemo(() => {
      if (
        selectedCategory ===
        'TODOS'
      ) {
        return products
      }

      return products.filter(
        (product) =>
          (
            product.category_name ||
            product.category?.name ||
            'Productos'
          ) === selectedCategory
      )
    }, [
      products,
      selectedCategory
    ])

  return {
    products,
    filteredProducts,
    categories,
    selectedCategory,
    setSelectedCategory,
    loading,
    error,
    storeOpen,
    storeClosed: !storeOpen,
    storeMessage,
    reloadProducts: loadProducts
  }
}
