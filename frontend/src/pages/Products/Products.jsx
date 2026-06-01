import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL = import.meta.env.VITE_API_URL || 'https://american-burger-pos-api-d8r1.onrender.com/api'

const money = (value) => {
  const number = Number(value || 0)
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(number)
}

const getToken = () => {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    ''
  )
}

const getList = (data, keys = []) => {
  if (Array.isArray(data)) return data

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
  }

  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items

  return []
}

const Products = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [inventoryItems, setInventoryItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    cost: '',
    stock: '',
    active: true
  })

  const [recipe, setRecipe] = useState([
    {
      inventory_item_id: '',
      quantity: '',
      unit: 'unid.'
    }
  ])

  const headers = useMemo(() => {
    const token = getToken()
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }, [])

  const apiRequest = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    })

    const text = await response.text()
    let data = null

    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { message: text }
    }

    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Error en la solicitud')
    }

    return data
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [productsResponse, categoriesResponse, inventoryResponse] =
        await Promise.allSettled([
          apiRequest('/products'),
          apiRequest('/categories'),
          apiRequest('/inventory')
        ])

      if (productsResponse.status === 'fulfilled') {
        const productsData = getList(productsResponse.value, ['products'])
        setProducts(productsData)
      } else {
        setProducts([])
      }

      if (categoriesResponse.status === 'fulfilled') {
        const categoriesData = getList(categoriesResponse.value, ['categories'])
        setCategories(categoriesData)
      } else {
        setCategories([])
      }

      if (inventoryResponse.status === 'fulfilled') {
        const inventoryData = getList(inventoryResponse.value, ['inventory', 'items'])
        setInventoryItems(inventoryData)
      } else {
        setInventoryItems([])
      }
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredProducts = products.filter((product) => {
    const text = `${product.name || ''} ${product.description || ''}`.toLowerCase()
    return text.includes(search.toLowerCase())
  })

  const resetForm = () => {
    setEditingId(null)

    setForm({
      name: '',
      description: '',
      category_id: '',
      price: '',
      cost: '',
      stock: '',
      active: true
    })

    setRecipe([
      {
        inventory_item_id: '',
        quantity: '',
        unit: 'unid.'
      }
    ])
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const addRecipeRow = () => {
    setRecipe((current) => [
      ...current,
      {
        inventory_item_id: '',
        quantity: '',
        unit: 'unid.'
      }
    ])
  }

  const updateRecipe = (index, field, value) => {
    setRecipe((current) =>
      current.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value
            }
          : row
      )
    )
  }

  const removeRecipeRow = (index) => {
    setRecipe((current) => {
      const next = current.filter((_, i) => i !== index)

      return next.length > 0
        ? next
        : [
            {
              inventory_item_id: '',
              quantity: '',
              unit: 'unid.'
            }
          ]
    })
  }

  const cleanRecipe = () => {
    return recipe
      .filter((item) => item.inventory_item_id && Number(item.quantity || 0) > 0)
      .map((item) => ({
        inventory_item_id: item.inventory_item_id,
        quantity: Number(item.quantity || 0),
        unit: item.unit || 'unid.'
      }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category_id: form.category_id || null,
        price: Number(form.price || 0),
        cost: Number(form.cost || 0),
        stock: Number(form.stock || 0),
        active: Boolean(form.active),
        recipe: cleanRecipe()
      }

      if (!payload.name) {
        throw new Error('El nombre del producto es obligatorio')
      }

      if (payload.price <= 0) {
        throw new Error('El precio debe ser mayor a 0')
      }

      if (editingId) {
        await apiRequest(`/products/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })

        setSuccess('Producto y receta actualizados correctamente')
      } else {
        await apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        })

        setSuccess('Producto y receta creados correctamente')
      }

      resetForm()
      await loadData()
    } catch (err) {
      setError(err.message || 'No se pudo guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  const editProduct = async (product) => {
    setEditingId(product.id)

    setForm({
      name: product.name || '',
      description: product.description || '',
      category_id: product.category_id || product.category?.id || '',
      price: product.price || '',
      cost: product.cost || '',
      stock: product.stock || product.current_stock || '',
      active: product.active !== false
    })

    const existingRecipe = product.recipe || []

    if (Array.isArray(existingRecipe) && existingRecipe.length > 0) {
      setRecipe(
        existingRecipe.map((item) => ({
          inventory_item_id: item.inventory_item_id || item.inventory?.id || '',
          quantity: item.quantity || '',
          unit: item.unit || item.inventory?.unit || 'unid.'
        }))
      )
    } else {
      try {
        const data = await apiRequest(`/products/${product.id}/recipe`)
        const recipeData = getList(data, ['recipe'])

        setRecipe(
          recipeData.length > 0
            ? recipeData.map((item) => ({
                inventory_item_id: item.inventory_item_id || item.inventory?.id || '',
                quantity: item.quantity || '',
                unit: item.unit || item.inventory?.unit || 'unid.'
              }))
            : [
                {
                  inventory_item_id: '',
                  quantity: '',
                  unit: 'unid.'
                }
              ]
        )
      } catch {
        setRecipe([
          {
            inventory_item_id: '',
            quantity: '',
            unit: 'unid.'
          }
        ])
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteProduct = async (product) => {
    const confirmDelete = window.confirm(`¿Eliminar "${product.name}"?`)
    if (!confirmDelete) return

    try {
      setError('')
      setSuccess('')

      await apiRequest(`/products/${product.id}`, { method: 'DELETE' })

      setSuccess('Producto eliminado correctamente')
      await loadData()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el producto')
    }
  }

  const categoryName = (product) => {
    if (product.category?.name) return product.category.name

    const category = categories.find((item) => item.id === product.category_id)

    return category?.name || 'Sin categoría'
  }

  const recipeCount = (product) => {
    if (Array.isArray(product.recipe)) return product.recipe.length
    return 0
  }

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Gestión de Productos" />

        <div className="main-content space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card lg:col-span-1">
              <h2 className="text-2xl font-poppins font-bold mb-2">
                {editingId ? 'Editar producto' : 'Nuevo producto'}
              </h2>

              <p className="text-gray-600 mb-6">
                Crea productos y configura su receta para descontar inventario automáticamente.
              </p>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nombre del producto</label>
                  <input
                    name="name"
                    className="input"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Ej: American Burger"
                    required
                  />
                </div>

                <div>
                  <label className="label">Descripción</label>
                  <textarea
                    name="description"
                    className="input min-h-[90px]"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Ingredientes o descripción del producto"
                  />
                </div>

                <div>
                  <label className="label">Categoría</label>
                  <select
                    name="category_id"
                    className="input"
                    value={form.category_id}
                    onChange={handleChange}
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Precio venta</label>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      className="input"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="6900"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Costo</label>
                    <input
                      name="cost"
                      type="number"
                      min="0"
                      className="input"
                      value={form.cost}
                      onChange={handleChange}
                      placeholder="2500"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Stock inicial / actual</label>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    className="input"
                    value={form.stock}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    name="active"
                    type="checkbox"
                    checked={form.active}
                    onChange={handleChange}
                  />
                  Producto activo para vender
                </label>

                <div className="border rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Receta del producto</h3>
                      <p className="text-sm text-gray-500">
                        Insumos que se descuentan al vender este producto.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addRecipeRow}
                      className="bg-yellow-400 text-black font-bold px-3 py-2 rounded-lg"
                    >
                      + Insumo
                    </button>
                  </div>

                  {inventoryItems.length === 0 && (
                    <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-2 rounded mb-3 text-sm">
                      Primero crea insumos en el módulo Inventario.
                    </div>
                  )}

                  <div className="space-y-3">
                    {recipe.map((item, index) => {
                      const selectedInventory = inventoryItems.find(
                        (inv) => inv.id === item.inventory_item_id
                      )

                      return (
                        <div
                          key={index}
                          className="grid grid-cols-12 gap-2 items-center"
                        >
                          <select
                            className="input col-span-6"
                            value={item.inventory_item_id}
                            onChange={(event) => {
                              const inventory = inventoryItems.find(
                                (inv) => inv.id === event.target.value
                              )

                              updateRecipe(index, 'inventory_item_id', event.target.value)
                              updateRecipe(index, 'unit', inventory?.unit || 'unid.')
                            }}
                          >
                            <option value="">Selecciona insumo</option>

                            {inventoryItems.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.name} ({inv.current_stock || inv.stock || 0} {inv.unit})
                              </option>
                            ))}
                          </select>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="input col-span-3"
                            placeholder="Cant."
                            value={item.quantity}
                            onChange={(event) =>
                              updateRecipe(index, 'quantity', event.target.value)
                            }
                          />

                          <input
                            className="input col-span-2"
                            value={item.unit || selectedInventory?.unit || 'unid.'}
                            onChange={(event) =>
                              updateRecipe(index, 'unit', event.target.value)
                            }
                            placeholder="Unidad"
                          />

                          <button
                            type="button"
                            onClick={() => removeRecipeRow(index)}
                            className="bg-red-600 text-white rounded-lg px-2 py-2 font-bold col-span-1"
                          >
                            X
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-black text-yellow-400 font-poppins font-bold px-5 py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear producto'}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="border border-gray-300 px-5 py-3 rounded-lg hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="card lg:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-poppins font-bold">Productos</h2>
                  <p className="text-gray-600">
                    {filteredProducts.length} producto(s) encontrado(s)
                  </p>
                </div>

                <input
                  className="input md:max-w-xs"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar producto..."
                />
              </div>

              {loading ? (
                <div className="text-center py-10 text-gray-500">
                  Cargando productos...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No hay productos registrados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-sm text-gray-500">
                        <th className="py-3 pr-4">Producto</th>
                        <th className="py-3 pr-4">Categoría</th>
                        <th className="py-3 pr-4">Precio</th>
                        <th className="py-3 pr-4">Costo</th>
                        <th className="py-3 pr-4">Receta</th>
                        <th className="py-3 pr-4">Estado</th>
                        <th className="py-3 pr-4 text-right">Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 pr-4">
                            <div className="font-semibold text-black">
                              {product.name}
                            </div>

                            {product.description && (
                              <div className="text-sm text-gray-500 line-clamp-2">
                                {product.description}
                              </div>
                            )}
                          </td>

                          <td className="py-4 pr-4 text-gray-700">
                            {categoryName(product)}
                          </td>

                          <td className="py-4 pr-4 font-semibold">
                            {money(product.price)}
                          </td>

                          <td className="py-4 pr-4 text-gray-700">
                            {money(product.cost)}
                          </td>

                          <td className="py-4 pr-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                recipeCount(product) > 0
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {recipeCount(product) > 0
                                ? `${recipeCount(product)} insumo(s)`
                                : 'Sin receta'}
                            </span>
                          </td>

                          <td className="py-4 pr-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                product.active !== false
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {product.active !== false ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>

                          <td className="py-4 pr-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => editProduct(product)}
                                className="px-3 py-2 rounded bg-yellow-400 text-black font-semibold hover:bg-yellow-300"
                              >
                                Editar
                              </button>

                              <button
                                onClick={() => deleteProduct(product)}
                                className="px-3 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Products
