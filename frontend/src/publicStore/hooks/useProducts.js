import { useEffect, useMemo, useState } from 'react'
import { getPublicProducts } from '../publicStoreApi'

export const useProducts = () => {
  const [products, setProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('TODOS')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getPublicProducts()
      setProducts(data || [])
    } catch (err) {
      console.error('Error cargando productos:', err)
      setError('No se pudieron cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const categories = useMemo(() => {
    const list = products.map((product) => product.category_name || 'Productos')
    return ['TODOS', ...new Set(list)]
  }, [products])

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'TODOS') return products

    return products.filter(
      (product) => (product.category_name || 'Productos') === selectedCategory
    )
  }, [products, selectedCategory])

  return {
    products,
    filteredProducts,
    categories,
    selectedCategory,
    setSelectedCategory,
    loading,
    error,
    reloadProducts: loadProducts
  }
}
