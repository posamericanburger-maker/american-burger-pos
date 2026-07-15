import { useCallback, useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://american-burger-pos-api-d8r1.onrender.com/api'

// ============================================================
// FORMATOS Y UTILIDADES
// ============================================================

const number = (value) => {
  const result = Number(value ?? 0)
  return Number.isFinite(result) ? result : 0
}

const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(number(value))

const formatQuantity = (value, maximumFractionDigits = 4) =>
  new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(number(value))

const formatDateTime = (value) => {
  if (!value) return 'Sin información'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha inválida'
  }

  return date.toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

const formatDate = (value) => {
  if (!value) return 'Sin fecha'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha inválida'
  }

  return date.toLocaleDateString('es-CL', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const getToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('authToken') ||
  localStorage.getItem('access_token') ||
  ''

const getList = (data, keys = []) => {
  if (Array.isArray(data)) return data

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key]
    }
  }

  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items

  return []
}

const getStock = (item = {}) =>
  number(
    item.current_stock ??
      item.stock ??
      item.quantity ??
      0
  )

const getMinimumStock = (item = {}) =>
  number(
    item.minimum_stock ??
      item.min_stock ??
      0
  )

const getInventoryCost = (item = {}) =>
  number(
    item.average_cost ??
      item.unit_cost ??
      item.last_purchase_price ??
      0
  )

const getSessionNumber = (session = {}, index = 0) => {
  if (session.session_number) {
    return session.session_number
  }

  if (session.number) {
    return session.number
  }

  if (session.id) {
    return String(session.id).slice(0, 8).toUpperCase()
  }

  return index + 1
}

const normalizeSummary = (summary = {}) => ({
  cash_session_id: summary.cash_session_id || null,
  status: summary.status || null,
  opened_at: summary.opened_at || null,
  closed_at: summary.closed_at || null,
  ingredients_count: number(summary.ingredients_count),
  orders_count: number(summary.orders_count),
  total_quantity_used: number(summary.total_quantity_used),
  inventory_cost: number(summary.inventory_cost)
})

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('inventario')

  const [items, setItems] = useState([])
  const [movements, setMovements] = useState([])

  const [activeCash, setActiveCash] = useState(null)
  const [activeCashSummary, setActiveCashSummary] = useState(null)
  const [activeConsumption, setActiveConsumption] = useState([])

  const [cashSessions, setCashSessions] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [selectedSession, setSelectedSession] = useState(null)
  const [selectedSessionSummary, setSelectedSessionSummary] = useState(null)
  const [selectedSessionConsumption, setSelectedSessionConsumption] = useState([])
  const [selectedSessionMovements, setSelectedSessionMovements] = useState([])

  const [stockView, setStockView] = useState('actual')

  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    stock: '',
    min_stock: '',
    unit: 'unid.',
    unit_cost: '',
    average_cost: '',
    last_purchase_price: '',
    supplier_name: ''
  })

  const [movement, setMovement] = useState({
    item_id: '',
    type: 'in',
    quantity: '',
    unit_cost: '',
    description: ''
  })

  const [loading, setLoading] = useState(true)
  const [loadingSession, setLoadingSession] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const headers = useMemo(() => {
    const token = getToken()

    return {
      'Content-Type': 'application/json',
      ...(token
        ? {
            Authorization: `Bearer ${token}`
          }
        : {})
    }
  }, [])

  const request = useCallback(
    async (path, options = {}) => {
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
        data = {
          message: text
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            'Error de conexión'
        )
      }

      return data
    },
    [headers]
  )

  // ============================================================
  // CARGA DE DATOS
  // ============================================================

  const loadInventory = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [
        inventoryResult,
        movementsResult,
        activeCashResult,
        sessionsResult
      ] = await Promise.allSettled([
        request('/inventory'),
        request('/inventory/movements?limit=500'),
        request('/inventory/cash-session/active'),
        request('/inventory/cash-sessions/summary?limit=100')
      ])

      if (inventoryResult.status === 'fulfilled') {
        setItems(
          getList(inventoryResult.value, [
            'inventory',
            'items'
          ])
        )
      } else {
        console.error(
          'Error cargando inventario:',
          inventoryResult.reason
        )
      }

      if (movementsResult.status === 'fulfilled') {
        setMovements(
          getList(movementsResult.value, [
            'movements'
          ])
        )
      } else {
        console.error(
          'Error cargando movimientos:',
          movementsResult.reason
        )
      }

      if (activeCashResult.status === 'fulfilled') {
        const activeData = activeCashResult.value || {}

        setActiveCash(
          activeData.is_open
            ? activeData.session || null
            : null
        )

        setActiveCashSummary(
          activeData.is_open
            ? normalizeSummary(activeData.summary || {})
            : null
        )

        setActiveConsumption(
          getList(activeData, ['consumption'])
        )
      } else {
        console.error(
          'Error cargando caja activa:',
          activeCashResult.reason
        )

        setActiveCash(null)
        setActiveCashSummary(null)
        setActiveConsumption([])
      }

      if (sessionsResult.status === 'fulfilled') {
        const sessions = getList(
          sessionsResult.value,
          ['summaries', 'sessions']
        )

        setCashSessions(sessions)
      } else {
        console.error(
          'Error cargando sesiones:',
          sessionsResult.reason
        )
      }

      const failedResults = [
        inventoryResult,
        movementsResult,
        activeCashResult,
        sessionsResult
      ].filter((result) => result.status === 'rejected')

      if (failedResults.length === 4) {
        throw new Error(
          'No fue posible cargar la información de inventario'
        )
      }
    } catch (err) {
      setError(
        err.message ||
          'No se pudo cargar inventario'
      )
    } finally {
      setLoading(false)
    }
  }, [request])

  const loadSessionDetail = useCallback(
    async (sessionId) => {
      if (!sessionId) {
        setSelectedSessionId('')
        setSelectedSession(null)
        setSelectedSessionSummary(null)
        setSelectedSessionConsumption([])
        setSelectedSessionMovements([])
        return
      }

      setLoadingSession(true)
      setError('')

      try {
        const data = await request(
          `/inventory/cash-session/${sessionId}/consumption`
        )

        setSelectedSessionId(sessionId)
        setSelectedSession(data?.session || null)
        setSelectedSessionSummary(
          normalizeSummary(data?.summary || {})
        )
        setSelectedSessionConsumption(
          getList(data, ['consumption'])
        )
        setSelectedSessionMovements(
          getList(data, ['movements'])
        )
      } catch (err) {
        setError(
          err.message ||
            'No se pudo cargar el detalle de la caja'
        )
      } finally {
        setLoadingSession(false)
      }
    },
    [request]
  )

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  // ============================================================
  // FORMULARIO DE INVENTARIO
  // ============================================================

  const resetForm = () => {
    setEditingId(null)

    setForm({
      name: '',
      stock: '',
      min_stock: '',
      unit: 'unid.',
      unit_cost: '',
      average_cost: '',
      last_purchase_price: '',
      supplier_name: ''
    })
  }

  const startEditItem = (item) => {
    setEditingId(item.id)

    setForm({
      name: item.name || '',
      stock: getStock(item),
      min_stock: getMinimumStock(item),
      unit: item.unit || 'unid.',
      unit_cost: number(item.unit_cost),
      average_cost: number(item.average_cost),
      last_purchase_price: number(
        item.last_purchase_price
      ),
      supplier_name: item.supplier_name || ''
    })

    setActiveTab('inventario')

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const saveItem = async (event) => {
    event.preventDefault()

    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (!form.name.trim()) {
        throw new Error(
          'El nombre del insumo es obligatorio'
        )
      }

      const payload = {
        name: form.name.trim(),

        stock: number(form.stock),
        current_stock: number(form.stock),

        min_stock: number(form.min_stock),
        minimum_stock: number(form.min_stock),

        unit: form.unit,

        unit_cost: number(form.unit_cost),

        average_cost: number(
          form.average_cost ||
            form.unit_cost
        ),

        last_purchase_price: number(
          form.last_purchase_price ||
            form.unit_cost
        ),

        supplier_name:
          form.supplier_name.trim()
      }

      if (editingId) {
        await request(
          `/inventory/${editingId}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload)
          }
        )

        setMessage(
          'Insumo actualizado correctamente'
        )
      } else {
        await request('/inventory', {
          method: 'POST',
          body: JSON.stringify(payload)
        })

        setMessage(
          'Insumo creado correctamente'
        )
      }

      resetForm()
      await loadInventory()
    } catch (err) {
      setError(
        err.message ||
          'No se pudo guardar el insumo'
      )
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (item) => {
    const confirmed = window.confirm(
      `¿Eliminar el insumo "${item.name}"?`
    )

    if (!confirmed) return

    setSaving(true)
    setError('')
    setMessage('')

    try {
      await request(`/inventory/${item.id}`, {
        method: 'DELETE'
      })

      setMessage(
        'Insumo eliminado correctamente'
      )

      await loadInventory()
    } catch (err) {
      setError(
        err.message ||
          'No se pudo eliminar el insumo'
      )
    } finally {
      setSaving(false)
    }
  }

  // ============================================================
  // MOVIMIENTOS MANUALES
  // ============================================================

  const saveMovement = async (event) => {
    event.preventDefault()

    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (!movement.item_id) {
        throw new Error(
          'Selecciona un insumo'
        )
      }

      if (
        !movement.quantity ||
        number(movement.quantity) <= 0
      ) {
        throw new Error(
          'La cantidad debe ser mayor a 0'
        )
      }

      await request('/inventory/movement', {
        method: 'POST',
        body: JSON.stringify({
          item_id: movement.item_id,
          type: movement.type,
          quantity: number(
            movement.quantity
          ),

          unit_cost:
            movement.unit_cost === ''
              ? undefined
              : number(
                  movement.unit_cost
                ),

          description:
            movement.description.trim()
        })
      })

      setMovement({
        item_id: '',
        type: 'in',
        quantity: '',
        unit_cost: '',
        description: ''
      })

      setMessage(
        'Movimiento registrado correctamente'
      )

      await loadInventory()
    } catch (err) {
      setError(
        err.message ||
          'No se pudo registrar el movimiento'
      )
    } finally {
      setSaving(false)
    }
  }

  // ============================================================
  // CÁLCULOS GENERALES
  // ============================================================

  const totalStock = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + getStock(item),
        0
      ),
    [items]
  )

  const totalInventoryValue = useMemo(
    () =>
      items.reduce((sum, item) => {
        const stock = getStock(item)
        const cost = getInventoryCost(item)

        return sum + stock * cost
      }, 0),
    [items]
  )

  const criticalItems = useMemo(
    () =>
      items.filter(
        (item) =>
          getStock(item) <=
          getMinimumStock(item)
      ),
    [items]
  )

  const inventoryStatus =
    criticalItems.length > 0
      ? 'CRÍTICO'
      : 'OK'

  const visibleConsumption =
    stockView === 'actual'
      ? activeConsumption
      : selectedSessionConsumption

  const visibleSummary =
    stockView === 'actual'
      ? activeCashSummary
      : selectedSessionSummary

  const visibleSession =
    stockView === 'actual'
      ? activeCash
      : selectedSession

  const totalConsumptionCost =
    number(
      visibleSummary?.inventory_cost
    ) ||
    visibleConsumption.reduce(
      (sum, item) =>
        sum + number(item.total_cost),
      0
    )

  const totalConsumptionQuantity =
    number(
      visibleSummary?.total_quantity_used
    ) ||
    visibleConsumption.reduce(
      (sum, item) =>
        sum +
        number(
          item.quantity_used ??
            item.total_used
        ),
      0
    )

  const ingredientsCount =
    number(
      visibleSummary?.ingredients_count
    ) ||
    visibleConsumption.length

  const ordersCount = number(
    visibleSummary?.orders_count
  )

  const tabs = [
    {
      id: 'inventario',
      label: 'Inventario',
      icon: '📦'
    },
    {
      id: 'movimiento',
      label: 'Registrar Movimiento',
      icon: '🔁'
    },
    {
      id: 'stock-vendido',
      label: 'Movimiento de Stock',
      icon: '🍔'
    }
  ]

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Gestión de Inventario" />

        <div className="main-content space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl">
              {message}
            </div>
          )}

          {/* ==================================================
              RESUMEN GENERAL
          ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="card">
              <p className="text-gray-500">
                Stock total
              </p>

              <h2 className="text-3xl font-bold">
                {formatQuantity(totalStock)}
              </h2>
            </div>

            <div className="card">
              <p className="text-gray-500">
                Stock crítico
              </p>

              <h2 className="text-3xl font-bold text-red-600">
                {criticalItems.length}
              </h2>
            </div>

            <div className="card">
              <p className="text-gray-500">
                Insumos
              </p>

              <h2 className="text-3xl font-bold">
                {items.length}
              </h2>
            </div>

            <div className="card">
              <p className="text-gray-500">
                Valor inventario
              </p>

              <h2 className="text-3xl font-bold">
                {money(
                  totalInventoryValue
                )}
              </h2>
            </div>

            <div className="card">
              <p className="text-gray-500">
                Estado
              </p>

              <h2
                className={`text-3xl font-bold ${
                  inventoryStatus === 'OK'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {inventoryStatus}
              </h2>
            </div>
          </div>

          {/* ==================================================
              PESTAÑAS
          ================================================== */}

          <div className="card p-3">
            <div className="flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveTab(tab.id)
                  }
                  className={`px-5 py-3 rounded-xl font-bold border transition-all ${
                    activeTab === tab.id
                      ? 'bg-black text-yellow-400 border-black shadow-md'
                      : 'bg-yellow-50 text-black border-yellow-300 hover:bg-yellow-100'
                  }`}
                >
                  <span className="mr-2">
                    {tab.icon}
                  </span>

                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ==================================================
              INVENTARIO
          ================================================== */}

          {activeTab === 'inventario' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="card">
                <h2 className="text-2xl font-bold mb-4">
                  {editingId
                    ? 'Editar insumo'
                    : 'Nuevo insumo'}
                </h2>

                <form
                  onSubmit={saveItem}
                  className="space-y-4"
                >
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
                    step="0.0001"
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
                    step="0.0001"
                    className="input"
                    value={form.min_stock}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        min_stock:
                          event.target.value
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
                    <option value="unid.">
                      unid.
                    </option>

                    <option value="kg">
                      kg
                    </option>

                    <option value="g">
                      g
                    </option>

                    <option value="láminas">
                      láminas
                    </option>

                    <option value="litros">
                      litros
                    </option>

                    <option value="ml">
                      ml
                    </option>

                    <option value="cajas">
                      cajas
                    </option>

                    <option value="bolsas">
                      bolsas
                    </option>

                    <option value="porciones">
                      porciones
                    </option>
                  </select>

                  <input
                    type="number"
                    step="0.0001"
                    className="input"
                    value={form.unit_cost}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        unit_cost:
                          event.target.value
                      }))
                    }
                    placeholder="Costo unitario"
                  />

                  <input
                    type="number"
                    step="0.0001"
                    className="input"
                    value={form.average_cost}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        average_cost:
                          event.target.value
                      }))
                    }
                    placeholder="Costo promedio"
                  />

                  <input
                    type="number"
                    step="0.0001"
                    className="input"
                    value={
                      form.last_purchase_price
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        last_purchase_price:
                          event.target.value
                      }))
                    }
                    placeholder="Último precio de compra"
                  />

                  <input
                    className="input"
                    value={
                      form.supplier_name
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        supplier_name:
                          event.target.value
                      }))
                    }
                    placeholder="Proveedor principal"
                  />

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
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold">
                    Inventario actual
                  </h2>

                  <button
                    type="button"
                    onClick={loadInventory}
                    disabled={loading}
                    className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  >
                    {loading
                      ? 'Actualizando...'
                      : 'Actualizar'}
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
                          <th className="py-3">
                            Insumo
                          </th>

                          <th>Stock</th>
                          <th>Unidad</th>
                          <th>Costo unit.</th>
                          <th>Costo prom.</th>
                          <th>Valor stock</th>
                          <th>Estado</th>

                          <th className="text-right">
                            Acciones
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {items.map((item) => {
                          const stock =
                            getStock(item)

                          const minStock =
                            getMinimumStock(item)

                          const unitCost =
                            number(
                              item.unit_cost
                            )

                          const averageCost =
                            getInventoryCost(item)

                          const stockValue =
                            stock *
                            averageCost

                          const isCritical =
                            stock <= minStock

                          return (
                            <tr
                              key={item.id}
                              className="border-b"
                            >
                              <td className="py-3">
                                <p className="font-semibold">
                                  {item.name}
                                </p>

                                {item.supplier_name && (
                                  <p className="text-xs text-gray-500">
                                    {
                                      item.supplier_name
                                    }
                                  </p>
                                )}
                              </td>

                              <td>
                                {formatQuantity(
                                  stock
                                )}
                              </td>

                              <td>
                                {item.unit ||
                                  'unid.'}
                              </td>

                              <td className="font-bold">
                                {money(unitCost)}
                              </td>

                              <td className="font-bold">
                                {money(
                                  averageCost
                                )}
                              </td>

                              <td className="font-black">
                                {money(
                                  stockValue
                                )}
                              </td>

                              <td
                                className={`font-bold ${
                                  isCritical
                                    ? 'text-red-600'
                                    : 'text-green-600'
                                }`}
                              >
                                {isCritical
                                  ? 'Crítico'
                                  : 'OK'}
                              </td>

                              <td className="text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      startEditItem(
                                        item
                                      )
                                    }
                                    className="bg-yellow-400 text-black px-3 py-2 rounded font-bold"
                                  >
                                    Editar
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteItem(
                                        item
                                      )
                                    }
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

          {/* ==================================================
              MOVIMIENTOS MANUALES
          ================================================== */}

          {activeTab === 'movimiento' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="card">
                <h2 className="text-2xl font-bold mb-4">
                  Movimiento manual
                </h2>

                <form
                  onSubmit={saveMovement}
                  className="space-y-4"
                >
                  <select
                    className="input"
                    value={movement.item_id}
                    onChange={(event) =>
                      setMovement(
                        (current) => ({
                          ...current,
                          item_id:
                            event.target.value
                        })
                      )
                    }
                  >
                    <option value="">
                      Selecciona insumo
                    </option>

                    {items.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name} (
                        {formatQuantity(
                          getStock(item)
                        )}{' '}
                        {item.unit})
                      </option>
                    ))}
                  </select>

                  <select
                    className="input"
                    value={movement.type}
                    onChange={(event) =>
                      setMovement(
                        (current) => ({
                          ...current,
                          type: event.target.value
                        })
                      )
                    }
                  >
                    <option value="in">
                      Entrada / compra
                    </option>

                    <option value="out">
                      Salida / uso
                    </option>

                    <option value="waste">
                      Merma
                    </option>

                    <option value="adjustment">
                      Ajuste
                    </option>
                  </select>

                  <input
                    type="number"
                    step="0.0001"
                    className="input"
                    value={
                      movement.quantity
                    }
                    onChange={(event) =>
                      setMovement(
                        (current) => ({
                          ...current,
                          quantity:
                            event.target.value
                        })
                      )
                    }
                    placeholder="Cantidad"
                  />

                  <input
                    type="number"
                    step="0.0001"
                    className="input"
                    value={
                      movement.unit_cost
                    }
                    onChange={(event) =>
                      setMovement(
                        (current) => ({
                          ...current,
                          unit_cost:
                            event.target.value
                        })
                      )
                    }
                    placeholder="Costo unitario de compra"
                  />

                  <textarea
                    className="input min-h-[90px]"
                    value={
                      movement.description
                    }
                    onChange={(event) =>
                      setMovement(
                        (current) => ({
                          ...current,
                          description:
                            event.target.value
                        })
                      )
                    }
                    placeholder="Ej: Compra semanal, merma o ajuste"
                  />

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-black text-yellow-400 font-bold py-3 rounded-lg disabled:opacity-50"
                  >
                    {saving
                      ? 'Registrando...'
                      : 'Registrar movimiento'}
                  </button>
                </form>
              </div>

              <div className="card xl:col-span-2">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold">
                    Historial de movimientos
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
                  <div className="text-center py-10 text-gray-500">
                    Cargando movimientos...
                  </div>
                ) : movements.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    No hay movimientos registrados.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[560px]">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b text-gray-500">
                          <th className="py-3">
                            Fecha
                          </th>

                          <th>Insumo</th>
                          <th>Tipo</th>
                          <th>Origen</th>
                          <th>Cantidad</th>
                          <th>Stock anterior</th>
                          <th>Stock nuevo</th>
                          <th>Costo</th>
                          <th>Descripción</th>
                        </tr>
                      </thead>

                      <tbody>
                        {movements.map(
                          (item) => (
                            <tr
                              key={item.id}
                              className="border-b"
                            >
                              <td className="py-3 whitespace-nowrap">
                                {formatDateTime(
                                  item.created_at
                                )}
                              </td>

                              <td className="font-semibold">
                                {item.inventory
                                  ?.name ||
                                  'Sin insumo'}
                              </td>

                              <td>
                                {item.type ||
                                  ''}
                              </td>

                              <td>
                                {item.movement_source ||
                                  'manual'}
                              </td>

                              <td className="font-bold">
                                {formatQuantity(
                                  item.quantity
                                )}{' '}
                                {item.inventory
                                  ?.unit || ''}
                              </td>

                              <td>
                                {formatQuantity(
                                  item.previous_stock
                                )}
                              </td>

                              <td>
                                {formatQuantity(
                                  item.new_stock
                                )}
                              </td>

                              <td className="font-bold">
                                {money(
                                  item.total_cost ||
                                    item.unit_cost ||
                                    0
                                )}
                              </td>

                              <td>
                                {item.description ||
                                  ''}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================
              MOVIMIENTO DE STOCK POR CAJA
          ================================================== */}

          {activeTab === 'stock-vendido' && (
            <div className="space-y-6">
              {/* Selector caja actual / historial */}

              <div className="card">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black">
                      Consumo de inventario
                    </h2>

                    <p className="text-gray-600">
                      Insumos descontados por las
                      ventas desde la apertura hasta
                      el cierre de caja.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadInventory}
                    disabled={loading}
                    className="bg-black text-yellow-400 px-5 py-3 rounded-xl font-bold disabled:opacity-50"
                  >
                    {loading
                      ? 'Actualizando...'
                      : 'Actualizar datos'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() =>
                      setStockView('actual')
                    }
                    className={`px-5 py-3 rounded-xl font-bold border ${
                      stockView === 'actual'
                        ? 'bg-yellow-400 text-black border-yellow-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Caja actual
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setStockView('historial')
                    }
                    className={`px-5 py-3 rounded-xl font-bold border ${
                      stockView === 'historial'
                        ? 'bg-yellow-400 text-black border-yellow-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Historial por caja
                  </button>
                </div>
              </div>

              {/* Historial de cajas */}

              {stockView === 'historial' && (
                <div className="card">
                  <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                    <div>
                      <h3 className="text-xl font-bold">
                        Seleccionar cierre de caja
                      </h3>

                      <p className="text-sm text-gray-500">
                        Puedes consultar cajas
                        abiertas o cerradas.
                      </p>
                    </div>

                    <select
                      className="input max-w-md"
                      value={selectedSessionId}
                      onChange={(event) =>
                        loadSessionDetail(
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        Selecciona una caja
                      </option>

                      {cashSessions.map(
                        (session, index) => (
                          <option
                            key={
                              session.cash_session_id ||
                              session.id
                            }
                            value={
                              session.cash_session_id ||
                              session.id
                            }
                          >
                            Caja{' '}
                            {getSessionNumber(
                              session,
                              index
                            )}{' '}
                            —{' '}
                            {formatDate(
                              session.opened_at
                            )}{' '}
                            —{' '}
                            {session.status ===
                            'open'
                              ? 'Abierta'
                              : 'Cerrada'}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {cashSessions.length ===
                    0 && (
                    <div className="text-center text-gray-500 py-8">
                      Todavía no hay sesiones de
                      caja registradas.
                    </div>
                  )}

                  {loadingSession && (
                    <div className="text-center text-gray-500 py-8">
                      Cargando detalle de caja...
                    </div>
                  )}
                </div>
              )}

              {/* Estado sin caja */}

              {stockView === 'actual' &&
                !activeCash &&
                !loading && (
                  <div className="card border-2 border-dashed border-gray-300">
                    <div className="text-center py-10">
                      <div className="text-5xl mb-4">
                        🔒
                      </div>

                      <h3 className="text-2xl font-bold">
                        No hay caja abierta
                      </h3>

                      <p className="text-gray-500 mt-2">
                        Abre la caja para comenzar
                        a registrar el consumo de
                        ingredientes de esta jornada.
                      </p>
                    </div>
                  </div>
                )}

              {stockView === 'historial' &&
                !selectedSession &&
                !loadingSession && (
                  <div className="card border-2 border-dashed border-gray-300">
                    <div className="text-center py-10">
                      <div className="text-5xl mb-4">
                        🗂️
                      </div>

                      <h3 className="text-2xl font-bold">
                        Selecciona una caja
                      </h3>

                      <p className="text-gray-500 mt-2">
                        Elige una sesión para ver
                        todos los insumos consumidos
                        en esa jornada.
                      </p>
                    </div>
                  </div>
                )}

              {/* Datos de caja */}

              {visibleSession && (
                <>
                  <div
                    className={`card border-l-8 ${
                      visibleSession.status ===
                      'open'
                        ? 'border-green-500'
                        : 'border-gray-700'
                    }`}
                  >
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl font-black">
                            Caja{' '}
                            {getSessionNumber(
                              visibleSession
                            )}
                          </h2>

                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold ${
                              visibleSession.status ===
                              'open'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {visibleSession.status ===
                            'open'
                              ? 'ABIERTA'
                              : 'CERRADA'}
                          </span>
                        </div>

                        <p className="text-gray-600 mt-2">
                          Apertura:{' '}
                          <span className="font-semibold">
                            {formatDateTime(
                              visibleSession.opened_at ||
                                visibleSession.created_at
                            )}
                          </span>
                        </p>

                        {visibleSession.closed_at && (
                          <p className="text-gray-600">
                            Cierre:{' '}
                            <span className="font-semibold">
                              {formatDateTime(
                                visibleSession.closed_at
                              )}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Costo de recetas
                        </p>

                        <p className="text-3xl font-black">
                          {money(
                            totalConsumptionCost
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Indicadores */}

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="card">
                      <p className="text-gray-500">
                        Ingredientes usados
                      </p>

                      <h2 className="text-3xl font-bold">
                        {ingredientsCount}
                      </h2>
                    </div>

                    <div className="card">
                      <p className="text-gray-500">
                        Cantidad total utilizada
                      </p>

                      <h2 className="text-3xl font-bold text-red-600">
                        {formatQuantity(
                          totalConsumptionQuantity
                        )}
                      </h2>
                    </div>

                    <div className="card">
                      <p className="text-gray-500">
                        Pedidos relacionados
                      </p>

                      <h2 className="text-3xl font-bold">
                        {ordersCount}
                      </h2>
                    </div>

                    <div className="card">
                      <p className="text-gray-500">
                        Costo usado por ventas
                      </p>

                      <h2 className="text-3xl font-bold">
                        {money(
                          totalConsumptionCost
                        )}
                      </h2>
                    </div>
                  </div>

                  {/* Tabla de consumo */}

                  <div className="card">
                    <div className="mb-5">
                      <h2 className="text-2xl font-bold">
                        Insumos consumidos
                      </h2>

                      <p className="text-gray-600">
                        Resumen real guardado por
                        cada venta asociada a esta
                        caja.
                      </p>
                    </div>

                    {visibleConsumption.length ===
                    0 ? (
                      <div className="text-center text-gray-500 py-10">
                        No se han registrado
                        consumos por ventas en esta
                        caja.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b text-gray-500">
                              <th className="py-3">
                                Ingrediente
                              </th>

                              <th>Unidad</th>
                              <th>
                                Pedidos
                              </th>

                              <th>
                                Total usado
                              </th>

                              <th>
                                Costo usado
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {visibleConsumption.map(
                              (item) => (
                                <tr
                                  key={
                                    item.item_id ||
                                    item.id
                                  }
                                  className="border-b"
                                >
                                  <td className="py-4 font-bold">
                                    {item.ingredient_name ||
                                      item.name ||
                                      'Sin nombre'}
                                  </td>

                                  <td>
                                    {item.unit ||
                                      'unid.'}
                                  </td>

                                  <td>
                                    {formatQuantity(
                                      item.orders_count,
                                      0
                                    )}
                                  </td>

                                  <td className="text-red-600 font-black">
                                    {formatQuantity(
                                      item.quantity_used ??
                                        item.total_used
                                    )}{' '}
                                    {item.unit ||
                                      ''}
                                  </td>

                                  <td className="font-black">
                                    {money(
                                      item.total_cost
                                    )}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>

                          <tfoot>
                            <tr className="border-t-2 border-black bg-gray-50">
                              <td
                                colSpan="3"
                                className="py-4 font-black text-lg"
                              >
                                TOTAL
                              </td>

                              <td className="font-black text-red-600 text-lg">
                                {formatQuantity(
                                  totalConsumptionQuantity
                                )}
                              </td>

                              <td className="font-black text-lg">
                                {money(
                                  totalConsumptionCost
                                )}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Auditoría de movimientos */}

                  {stockView === 'historial' &&
                    selectedSessionMovements.length >
                      0 && (
                      <div className="card">
                        <h2 className="text-2xl font-bold mb-4">
                          Auditoría de movimientos
                        </h2>

                        <div className="overflow-x-auto max-h-[520px]">
                          <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white">
                              <tr className="border-b text-gray-500">
                                <th className="py-3">
                                  Fecha
                                </th>

                                <th>
                                  Insumo
                                </th>

                                <th>
                                  Origen
                                </th>

                                <th>
                                  Cantidad
                                </th>

                                <th>
                                  Stock anterior
                                </th>

                                <th>
                                  Stock nuevo
                                </th>

                                <th>
                                  Costo
                                </th>

                                <th>
                                  Descripción
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {selectedSessionMovements.map(
                                (item) => (
                                  <tr
                                    key={item.id}
                                    className="border-b"
                                  >
                                    <td className="py-3 whitespace-nowrap">
                                      {formatDateTime(
                                        item.created_at
                                      )}
                                    </td>

                                    <td className="font-semibold">
                                      {item.inventory
                                        ?.name ||
                                        'Sin insumo'}
                                    </td>

                                    <td>
                                      {item.movement_source ||
                                        item.type ||
                                        ''}
                                    </td>

                                    <td className="font-bold">
                                      {formatQuantity(
                                        item.quantity
                                      )}{' '}
                                      {item.inventory
                                        ?.unit || ''}
                                    </td>

                                    <td>
                                      {formatQuantity(
                                        item.previous_stock
                                      )}
                                    </td>

                                    <td>
                                      {formatQuantity(
                                        item.new_stock
                                      )}
                                    </td>

                                    <td className="font-bold">
                                      {money(
                                        item.total_cost
                                      )}
                                    </td>

                                    <td>
                                      {item.description ||
                                        ''}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Inventory
