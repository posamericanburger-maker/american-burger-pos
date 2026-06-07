import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://american-burger-pos-api-d8r1.onrender.com/api'

const getToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('authToken') ||
  localStorage.getItem('access_token') ||
  ''

const getList = (data, keys = []) => {
  if (Array.isArray(data)) return data
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  return []
}

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('inventario')
  const [items, setItems] = useState([])
  const [movements, setMovements] = useState([])
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])

  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    stock: '',
    min_stock: '',
    unit: 'unid.'
  })

  const [movement, setMovement] = useState({
    item_id: '',
    type: 'in',
    quantity: '',
    description: ''
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const headers = useMemo(() => {
    const token = getToken()
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }, [])

  const request = async (path, options = {}) => {
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
      throw new Error(data?.message || data?.error || 'Error de conexión')
    }

    return data
  }

  const loadInventory = async () => {
    setLoading(true)
    setError('')

    try {
      const [inventoryResult, movementsResult, ordersResult, productsResult] =
        await Promise.allSettled([
          request('/inventory'),
          request('/inventory/movements'),
          request('/orders'),
          request('/products')
        ])

      if (inventoryResult.status === 'fulfilled') {
        setItems(getList(inventoryResult.value, ['inventory', 'items', 'products']))
      }

      if (movementsResult.status === 'fulfilled') {
        setMovements(getList(movementsResult.value, ['movements']))
      }

      if (ordersResult.status === 'fulfilled') {
        setOrders(getList(ordersResult.value, ['orders']))
      }

      if (productsResult.status === 'fulfilled') {
        setProducts(getList(productsResult.value, ['products']))
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar inventario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setForm({
      name: '',
      stock: '',
      min_stock: '',
      unit: 'unid.'
    })
  }

  const startEditItem = (item) => {
    setEditingId(item.id)
    setForm({
      name: item.name || '',
      stock: item.stock || item.current_stock || 0,
      min_stock: item.min_stock || item.minimum_stock || 0,
      unit: item.unit || 'unid.'
    })

    setActiveTab('inventario')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveItem = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (!form.name.trim()) {
        throw new Error('El nombre del insumo es obligatorio')
      }

      const payload = {
        name: form.name.trim(),
        stock: Number(form.stock || 0),
        current_stock: Number(form.stock || 0),
        min_stock: Number(form.min_stock || 0),
        minimum_stock: Number(form.min_stock || 0),
        unit: form.unit
      }

      if (editingId) {
        await request(`/inventory/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })

        setMessage('Insumo actualizado correctamente')
      } else {
        await request('/inventory', {
          method: 'POST',
          body: JSON.stringify(payload)
        })

        setMessage('Insumo creado correctamente')
      }

      resetForm()
      await loadInventory()
    } catch (err) {
      setError(err.message || 'No se pudo guardar insumo')
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (item) => {
    const confirmDelete = window.confirm(`¿Eliminar el insumo "${item.name}"?`)
    if (!confirmDelete) return

    setSaving(true)
    setError('')
    setMessage('')

    try {
      await request(`/inventory/${item.id}`, {
        method: 'DELETE'
      })

      setMessage('Insumo eliminado correctamente')
      await loadInventory()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar insumo')
    } finally {
      setSaving(false)
    }
  }

  const saveMovement = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (!movement.item_id) {
        throw new Error('Selecciona un insumo')
      }

      if (!movement.quantity || Number(movement.quantity) <= 0) {
        throw new Error('La cantidad debe ser mayor a 0')
      }

      await request('/inventory/movement', {
        method: 'POST',
        body: JSON.stringify({
          item_id: movement.item_id,
          type: movement.type,
          quantity: Number(movement.quantity),
          description: movement.description.trim()
        })
      })

      setMovement({
        item_id: '',
        type: 'in',
        quantity: '',
        description: ''
      })

      setMessage('Movimiento registrado correctamente')
      await loadInventory()
    } catch (err) {
      setError(err.message || 'No se pudo registrar movimiento')
    } finally {
      setSaving(false)
    }
  }

  const totalStock = items.reduce(
    (sum, item) =>
      sum + Number(item.stock || item.current_stock || item.quantity || 0),
    0
  )

  const criticalItems = items.filter((item) => {
    const stock = Number(item.stock || item.current_stock || item.quantity || 0)
    const minStock = Number(item.min_stock || item.minimum_stock || 0)
    return stock <= minStock
  })

  const inventoryStatus = criticalItems.length > 0 ? 'CRÍTICO' : 'OK'

  const soldStockSummary = useMemo(() => {
    const summary = {}

    orders.forEach((order) => {
      const orderItems = order.items || order.order_items || []

      orderItems.forEach((orderItem) => {
        const productId = orderItem.product_id
        if (!productId) return

        const product = products.find((item) => item.id === productId)
        if (!product || !Array.isArray(product.recipe)) return

        product.recipe.forEach((recipeItem) => {
          const inventoryId = recipeItem.inventory_item_id
          const inventory = recipeItem.inventory || {}

          if (!inventoryId) return

          const ingredientName =
            inventory.name ||
            items.find((item) => item.id === inventoryId)?.name ||
            'Ingrediente sin nombre'

          const unit =
            inventory.unit ||
            recipeItem.unit ||
            items.find((item) => item.id === inventoryId)?.unit ||
            'unid.'

          const quantitySold =
            Number(recipeItem.quantity || 0) *
            Number(orderItem.quantity || 1)

          if (quantitySold <= 0) return

          if (!summary[inventoryId]) {
            summary[inventoryId] = {
              id: inventoryId,
              name: ingredientName,
              unit,
              sold: 0
            }
          }

          summary[inventoryId].sold += quantitySold
        })
      })
    })

    return Object.values(summary).sort((a, b) => b.sold - a.sold)
  }, [orders, products, items])

  const totalSoldIngredients = soldStockSummary.reduce(
    (sum, item) => sum + Number(item.sold || 0),
    0
  )

  const tabs = [
    { id: 'inventario', label: 'Inventario', icon: '📦' },
    { id: 'movimiento', label: 'Registrar Movimiento', icon: '🔁' },
    { id: 'stock-vendido', label: 'Movimiento de Stock', icon: '🍔' }
  ]

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Gestión de Inventario" />

        <div className="main-content space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-gray-500">Stock total</p>
              <h2 className="text-3xl font-bold">{totalStock}</h2>
            </div>

            <div className="card">
              <p className="text-gray-500">Stock crítico</p>
              <h2 className="text-3xl font-bold text-red-600">
                {criticalItems.length}
              </h2>
            </div>

            <div className="card">
              <p className="text-gray-500">Insumos</p>
              <h2 className="text-3xl font-bold">{items.length}</h2>
            </div>

            <div className="card">
              <p className="text-gray-500">Estado</p>
              <h2
                className={`text-3xl font-bold ${
                  inventoryStatus === 'OK' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {inventoryStatus}
              </h2>
            </div>
          </div>

          <div className="card p-3">
            <div className="flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 rounded-xl font-bold border transition-all ${
                    activeTab === tab.id
                      ? 'bg-black text-yellow-400 border-black shadow-md'
                      : 'bg-yellow-50 text-black border-yellow-300 hover:bg-yellow-100'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'inventario' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="card">
                <h2 className="text-2xl font-bold mb-4">
                  {editingId ? 'Editar insumo' : 'Nuevo insumo'}
                </h2>

                <form onSubmit={saveItem} className="space-y-4">
                  <input
                    className="input"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value
                      }))
                    }
                    placeholder="Ej: Carne hamburguesa"
                  />

                  <input
                    type="number"
                    className="input"
                    value={form.stock}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        stock: event.target.value
                      }))
                    }
                    placeholder="Stock actual"
                  />

                  <input
                    type="number"
                    className="input"
                    value={form.min_stock}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        min_stock: event.target.value
                      }))
                    }
                    placeholder="Stock mínimo"
                  />

                  <select
                    className="input"
                    value={form.unit}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        unit: event.target.value
                      }))
                    }
                  >
                    <option value="unid.">unid.</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="láminas">láminas</option>
                    <option value="litros">litros</option>
                    <option value="ml">ml</option>
                    <option value="cajas">cajas</option>
                    <option value="bolsas">bolsas</option>
                  </select>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-black text-yellow-400 font-bold py-3 rounded-lg disabled:opacity-50"
                  >
                    {saving
                      ? 'Guardando...'
                      : editingId
                        ? 'Guardar cambios'
                        : 'Crear insumo'}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-100"
                    >
                      Cancelar edición
                    </button>
                  )}
                </form>
              </div>

              <div className="card xl:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-poppins font-bold">
                    Inventario actual
                  </h2>

                  <button
                    type="button"
                    onClick={loadInventory}
                    className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100"
                  >
                    Actualizar
                  </button>
                </div>

                {loading ? (
                  <div className="text-center text-gray-500 py-10">
                    Cargando inventario...
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">
                    No hay insumos registrados.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b text-gray-500">
                          <th className="py-3">Insumo / Producto</th>
                          <th>Stock actual</th>
                          <th>Stock mínimo</th>
                          <th>Unidad</th>
                          <th>Estado</th>
                          <th className="text-right">Acciones</th>
                        </tr>
                      </thead>

                      <tbody>
                        {items.map((item) => {
                          const stock = Number(
                            item.stock || item.current_stock || item.quantity || 0
                          )
                          const minStock = Number(
                            item.min_stock || item.minimum_stock || 0
                          )
                          const isCritical = stock <= minStock

                          return (
                            <tr key={item.id} className="border-b">
                              <td className="py-3 font-semibold">{item.name}</td>
                              <td>{stock}</td>
                              <td>{minStock}</td>
                              <td>{item.unit || 'unid.'}</td>
                              <td
                                className={`font-bold ${
                                  isCritical ? 'text-red-600' : 'text-green-600'
                                }`}
                              >
                                {isCritical ? 'Crítico' : 'OK'}
                              </td>
                              <td className="text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startEditItem(item)}
                                    className="bg-yellow-400 text-black px-3 py-2 rounded font-bold"
                                  >
                                    Editar
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => deleteItem(item)}
                                    className="bg-red-600 text-white px-3 py-2 rounded font-bold"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'movimiento' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="card">
                <h2 className="text-2xl font-bold mb-4">Movimiento manual</h2>

                <form onSubmit={saveMovement} className="space-y-4">
                  <select
                    className="input"
                    value={movement.item_id}
                    onChange={(event) =>
                      setMovement((current) => ({
                        ...current,
                        item_id: event.target.value
                      }))
                    }
                  >
                    <option value="">Selecciona insumo</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.stock || item.current_stock || 0} {item.unit})
                      </option>
                    ))}
                  </select>

                  <select
                    className="input"
                    value={movement.type}
                    onChange={(event) =>
                      setMovement((current) => ({
                        ...current,
                        type: event.target.value
                      }))
                    }
                  >
                    <option value="in">Entrada / compra</option>
                    <option value="out">Salida / uso</option>
                    <option value="waste">Merma</option>
                    <option value="adjustment">Ajuste</option>
                  </select>

                  <input
                    type="number"
                    className="input"
                    value={movement.quantity}
                    onChange={(event) =>
                      setMovement((current) => ({
                        ...current,
                        quantity: event.target.value
                      }))
                    }
                    placeholder="Cantidad"
                  />

                  <textarea
                    className="input min-h-[90px]"
                    value={movement.description}
                    onChange={(event) =>
                      setMovement((current) => ({
                        ...current,
                        description: event.target.value
                      }))
                    }
                    placeholder="Ej: Compra semanal / merma / ajuste"
                  />

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-black text-yellow-400 font-bold py-3 rounded-lg disabled:opacity-50"
                  >
                    Registrar movimiento
                  </button>
                </form>
              </div>

              <div className="card xl:col-span-2">
                <h2 className="text-2xl font-bold mb-4">Historial de movimientos</h2>

                {loading ? (
                  <div className="text-center py-10 text-gray-500">
                    Cargando movimientos...
                  </div>
                ) : movements.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    No hay movimientos registrados.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[520px]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b text-gray-500">
                          <th className="py-3">Fecha</th>
                          <th>Insumo</th>
                          <th>Tipo</th>
                          <th>Cantidad</th>
                          <th>Descripción</th>
                        </tr>
                      </thead>

                      <tbody>
                        {movements.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-3">
                              {item.created_at
                                ? new Date(item.created_at).toLocaleString('es-CL')
                                : ''}
                            </td>
                            <td>{item.inventory?.name || 'Sin insumo'}</td>
                            <td>{item.type}</td>
                            <td>
                              {item.quantity} {item.inventory?.unit || ''}
                            </td>
                            <td>{item.description || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'stock-vendido' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card">
                  <p className="text-gray-500">Ingredientes vendidos</p>
                  <h2 className="text-3xl font-bold">
                    {soldStockSummary.length}
                  </h2>
                </div>

                <div className="card">
                  <p className="text-gray-500">Total descontado por recetas</p>
                  <h2 className="text-3xl font-bold text-red-600">
                    {totalSoldIngredients}
                  </h2>
                </div>

                <div className="card">
                  <p className="text-gray-500">Origen</p>
                  <h2 className="text-xl font-bold">Ventas + Recetas</h2>
                </div>
              </div>

              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Movimiento de Stock por ventas
                    </h2>
                    <p className="text-gray-600">
                      Cálculo directo desde ventas y recetas de productos.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadInventory}
                    className="bg-black text-yellow-400 px-4 py-2 rounded-lg font-bold"
                  >
                    Actualizar
                  </button>
                </div>

                {soldStockSummary.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">
                    No hay recetas asociadas a las ventas registradas.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b text-gray-500">
                          <th className="py-3">Ingrediente</th>
                          <th>Unidad</th>
                          <th>Total usado por ventas</th>
                        </tr>
                      </thead>

                      <tbody>
                        {soldStockSummary.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-3 font-bold">{item.name}</td>
                            <td>{item.unit}</td>
                            <td className="text-red-600 font-bold">
                              {item.sold} {item.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Inventory
