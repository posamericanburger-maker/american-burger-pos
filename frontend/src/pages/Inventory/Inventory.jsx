import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL = import.meta.env.VITE_API_URL || 'https://american-burger-pos-api-d8r1.onrender.com/api'

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
  const [items, setItems] = useState([])
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
      const data = await request('/inventory')
      const list = getList(data, ['inventory', 'items', 'products'])

      setItems(list)
    } catch (err) {
      setError(err.message || 'No se pudo cargar inventario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [])

  const totalStock = items.reduce(
    (sum, item) => sum + Number(item.stock || item.current_stock || item.quantity || 0),
    0
  )

  const criticalItems = items.filter((item) => {
    const stock = Number(item.stock || item.current_stock || item.quantity || 0)
    const minStock = Number(item.min_stock || item.minimum_stock || 0)

    return stock <= minStock
  })

  const inventoryStatus = criticalItems.length > 0 ? 'CRÍTICO' : 'OK'

  const createItem = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (!form.name.trim()) {
        throw new Error('El nombre del insumo es obligatorio')
      }

      await request('/inventory', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          stock: Number(form.stock || 0),
          current_stock: Number(form.stock || 0),
          min_stock: Number(form.min_stock || 0),
          minimum_stock: Number(form.min_stock || 0),
          unit: form.unit
        })
      })

      setForm({
        name: '',
        stock: '',
        min_stock: '',
        unit: 'unid.'
      })

      setMessage('Insumo creado correctamente')
      await loadInventory()
    } catch (err) {
      setError(err.message || 'No se pudo crear insumo')
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Nuevo insumo</h2>

              <form onSubmit={createItem} className="space-y-4">
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
                  placeholder="Stock inicial"
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
                  Crear insumo
                </button>
              </form>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Movimiento</h2>

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

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Estado rápido</h2>

              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span>Total insumos</span>
                  <strong>{items.length}</strong>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span>Stock crítico</span>
                  <strong className="text-red-600">{criticalItems.length}</strong>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span>Estado</span>
                  <strong
                    className={
                      inventoryStatus === 'OK' ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {inventoryStatus}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={loadInventory}
                  className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-100"
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-2xl font-poppins font-bold mb-4">
              Inventario
            </h2>

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
                          <td className="py-3 font-semibold">
                            {item.name}
                          </td>

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
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Inventory
