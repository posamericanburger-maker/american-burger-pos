import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://american-burger-pos-api-d8r1.onrender.com/api'

const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const Combos = () => {
  const [products, setProducts] = useState([])
  const [combos, setCombos] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    comboPrice: '',
    active: true,
    items: []
  })

  const getToken = () =>
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    ''

  const loadProducts = async () => {
    try {
      const token = getToken()

      const response = await fetch(`${API_URL}/products`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })

      const data = await response.json()
      const list = data.products || data.data || []

      setProducts(list.filter((product) => product.active !== false))
    } catch {
      setError('No se pudieron cargar productos')
    }
  }

  const loadCombos = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('ab_combos') || '[]')
      setCombos(saved)
    } catch {
      setCombos([])
    }
  }

  useEffect(() => {
    loadProducts()
    loadCombos()
  }, [])

  const saveCombos = (nextCombos) => {
    setCombos(nextCombos)
    localStorage.setItem('ab_combos', JSON.stringify(nextCombos))
  }

  const normalPrice = useMemo(() => {
    return form.items.reduce((sum, item) => {
      const product = products.find((productItem) => productItem.id === item.product_id)
      return sum + Number(product?.price || 0) * Number(item.quantity || 1)
    }, 0)
  }, [form.items, products])

  const comboPrice = Number(form.comboPrice || 0)
  const savingAmount = normalPrice - comboPrice
  const marginPercent =
    normalPrice > 0 ? ((savingAmount / normalPrice) * 100).toFixed(1) : 0

  const resetForm = () => {
    setEditingId(null)
    setForm({
      name: '',
      description: '',
      comboPrice: '',
      active: true,
      items: []
    })
  }

  const addProductToCombo = (product) => {
    setForm((current) => {
      const exists = current.items.find((item) => item.product_id === product.id)

      if (exists) {
        return {
          ...current,
          items: current.items.map((item) =>
            item.product_id === product.id
              ? { ...item, quantity: Number(item.quantity || 1) + 1 }
              : item
          )
        }
      }

      return {
        ...current,
        items: [
          ...current.items,
          {
            product_id: product.id,
            quantity: 1
          }
        ]
      }
    })
  }

  const updateQuantity = (productId, quantity) => {
    const nextQuantity = Number(quantity)

    if (nextQuantity <= 0) {
      setForm((current) => ({
        ...current,
        items: current.items.filter((item) => item.product_id !== productId)
      }))
      return
    }

    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: nextQuantity }
          : item
      )
    }))
  }

  const removeProduct = (productId) => {
    setForm((current) => ({
      ...current,
      items: current.items.filter((item) => item.product_id !== productId)
    }))
  }

  const saveCombo = (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!form.name.trim()) {
      setError('Ingresa el nombre del combo')
      return
    }

    if (form.items.length === 0) {
      setError('Agrega productos al combo')
      return
    }

    if (!form.comboPrice || Number(form.comboPrice) <= 0) {
      setError('Ingresa el precio del combo')
      return
    }

    const comboData = {
      id: editingId || Date.now(),
      name: form.name.trim(),
      description: form.description.trim(),
      comboPrice: Number(form.comboPrice),
      normalPrice,
      savingAmount,
      marginPercent,
      active: form.active,
      items: form.items,
      updated_at: new Date().toISOString(),
      created_at: editingId
        ? combos.find((combo) => combo.id === editingId)?.created_at
        : new Date().toISOString()
    }

    if (editingId) {
      saveCombos(
        combos.map((combo) =>
          combo.id === editingId ? comboData : combo
        )
      )
      setMessage('Combo actualizado correctamente')
    } else {
      saveCombos([...combos, comboData])
      setMessage('Combo creado correctamente')
    }

    resetForm()
  }

  const editCombo = (combo) => {
    setEditingId(combo.id)
    setForm({
      name: combo.name || '',
      description: combo.description || '',
      comboPrice: combo.comboPrice || '',
      active: combo.active !== false,
      items: combo.items || []
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteCombo = (combo) => {
    const confirmDelete = window.confirm(`¿Eliminar el combo "${combo.name}"?`)
    if (!confirmDelete) return

    saveCombos(combos.filter((item) => item.id !== combo.id))
    setMessage('Combo eliminado correctamente')
  }

  const duplicateCombo = (combo) => {
    const newCombo = {
      ...combo,
      id: Date.now(),
      name: `${combo.name} copia`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    saveCombos([...combos, newCombo])
    setMessage('Combo duplicado correctamente')
  }

  const getProductName = (productId) => {
    const product = products.find((item) => item.id === productId)
    return product?.name || 'Producto eliminado'
  }

  const getProductPrice = (productId) => {
    const product = products.find((item) => item.id === productId)
    return Number(product?.price || 0)
  }

  const activeCombos = combos.filter((combo) => combo.active !== false)

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Gestión de Combos" />

        <div className="main-content space-y-6 bg-gray-100">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-5 py-4 rounded-xl font-bold">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-5 py-4 rounded-xl font-bold">
              {message}
            </div>
          )}

          <div className="bg-black text-white rounded-2xl shadow-lg p-6">
            <p className="text-yellow-400 font-bold tracking-wide">
              AMERICAN BURGER POS
            </p>
            <h1 className="text-4xl font-black mt-1">
              Gestión profesional de combos
            </h1>
            <p className="text-gray-300 mt-1">
              Crea combos, calcula ahorro, precio normal y precio promocional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-yellow-400">
              <p className="text-gray-500 font-bold">Combos activos</p>
              <h2 className="text-4xl font-black">{activeCombos.length}</h2>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-black">
              <p className="text-gray-500 font-bold">Combos totales</p>
              <h2 className="text-4xl font-black">{combos.length}</h2>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-green-500">
              <p className="text-gray-500 font-bold">Productos disponibles</p>
              <h2 className="text-4xl font-black">{products.length}</h2>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-red-500">
              <p className="text-gray-500 font-bold">Ahorro actual</p>
              <h2 className="text-4xl font-black">{money(savingAmount)}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-2xl font-black mb-4">
                {editingId ? 'Editar combo' : 'Crear combo'}
              </h2>

              <form onSubmit={saveCombo} className="space-y-4">
                <div>
                  <label className="label">Nombre combo</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="Ej: American Combo"
                  />
                </div>

                <div>
                  <label className="label">Descripción</label>
                  <textarea
                    className="input min-h-[80px]"
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    placeholder="Ej: Burger + papas + bebida"
                  />
                </div>

                <div>
                  <label className="label">Precio combo</label>
                  <input
                    type="number"
                    className="input"
                    value={form.comboPrice}
                    onChange={(event) =>
                      setForm({ ...form, comboPrice: event.target.value })
                    }
                    placeholder="Ej: 9900"
                  />
                </div>

                <label className="flex items-center gap-2 font-bold">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      setForm({ ...form, active: event.target.checked })
                    }
                  />
                  Combo activo
                </label>

                <div className="border rounded-xl p-4 bg-gray-50 space-y-2">
                  <div className="flex justify-between">
                    <span>Precio normal</span>
                    <strong>{money(normalPrice)}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Precio combo</span>
                    <strong>{money(comboPrice)}</strong>
                  </div>

                  <div className="flex justify-between text-green-600">
                    <span>Ahorro cliente</span>
                    <strong>{money(savingAmount)}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Descuento</span>
                    <strong>{marginPercent}%</strong>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-yellow-400 font-black py-4 rounded-xl"
                >
                  {editingId ? 'Guardar cambios' : 'Crear combo'}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full border py-3 rounded-xl hover:bg-gray-100"
                  >
                    Cancelar edición
                  </button>
                )}
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 xl:col-span-2">
              <h2 className="text-2xl font-black mb-4">
                Productos incluidos
              </h2>

              {form.items.length === 0 ? (
                <div className="text-center text-gray-500 py-8 border rounded-xl mb-5">
                  Agrega productos al combo.
                </div>
              ) : (
                <div className="space-y-3 mb-5">
                  {form.items.map((item) => (
                    <div key={item.product_id} className="border rounded-xl p-4 bg-gray-50">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-black">{getProductName(item.product_id)}</p>
                          <p className="text-gray-500">
                            {money(getProductPrice(item.product_id))} c/u
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeProduct(item.product_id)}
                          className="bg-red-600 text-white px-3 py-2 rounded-lg font-bold"
                        >
                          Eliminar
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="label">Cantidad</label>
                          <input
                            type="number"
                            min="1"
                            className="input"
                            value={item.quantity}
                            onChange={(event) =>
                              updateQuantity(item.product_id, event.target.value)
                            }
                          />
                        </div>

                        <div>
                          <label className="label">Subtotal</label>
                          <div className="border rounded-lg px-4 py-2 bg-white font-black">
                            {money(getProductPrice(item.product_id) * Number(item.quantity || 1))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <h3 className="text-xl font-black mb-3">
                Agregar productos al combo
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProductToCombo(product)}
                    className="border rounded-xl p-4 text-left hover:bg-yellow-50 hover:border-yellow-400"
                  >
                    <p className="font-black">{product.name}</p>
                    <p className="text-gray-500 text-sm">
                      {product.category?.name || product.category_name || 'Sin categoría'}
                    </p>
                    <p className="font-black mt-2">{money(product.price)}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-black mb-4">
              Combos creados
            </h2>

            {combos.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                No hay combos creados.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {combos.map((combo) => (
                  <div
                    key={combo.id}
                    className={`border rounded-2xl p-5 shadow-sm ${
                      combo.active === false ? 'bg-gray-100 opacity-70' : 'bg-white'
                    }`}
                  >
                    <div className="flex justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-2xl font-black">{combo.name}</h3>
                        <p className="text-gray-500">{combo.description}</p>
                      </div>

                      <span
                        className={`h-fit px-3 py-1 rounded-full text-sm font-bold ${
                          combo.active === false
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {combo.active === false ? 'Inactivo' : 'Activo'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {(combo.items || []).map((item) => (
                        <div key={item.product_id} className="flex justify-between text-sm">
                          <span>
                            {item.quantity} x {getProductName(item.product_id)}
                          </span>
                          <strong>
                            {money(getProductPrice(item.product_id) * Number(item.quantity || 1))}
                          </strong>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between">
                        <span>Precio normal</span>
                        <strong>{money(combo.normalPrice)}</strong>
                      </div>

                      <div className="flex justify-between text-xl">
                        <span>Precio combo</span>
                        <strong>{money(combo.comboPrice)}</strong>
                      </div>

                      <div className="flex justify-between text-green-600">
                        <span>Ahorro</span>
                        <strong>{money(combo.savingAmount)}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-5">
                      <button
                        type="button"
                        onClick={() => editCombo(combo)}
                        className="bg-yellow-400 text-black py-2 rounded-lg font-bold"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => duplicateCombo(combo)}
                        className="bg-black text-yellow-400 py-2 rounded-lg font-bold"
                      >
                        Duplicar
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteCombo(combo)}
                        className="bg-red-600 text-white py-2 rounded-lg font-bold"
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-5">
            <p className="font-bold text-yellow-800">
              Importante: estos combos quedan guardados en el navegador. Para que aparezcan automáticamente en el POS y descuenten inventario como producto vendible, el siguiente paso es crear la tabla/ruta de combos en backend.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Combos
