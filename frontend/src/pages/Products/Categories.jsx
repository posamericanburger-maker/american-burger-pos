import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL = import.meta.env.VITE_API_URL || 'https://american-burger-pos-api-d8r1.onrender.com/api'

const getToken = () => {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    ''
  )
}

const request = async (path, options = {}) => {
  const token = getToken()

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

const getList = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.categories)) return data.categories
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  return []
}

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: '',
    description: '',
    active: true
  })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await request('/categories')
      setCategories(getList(data))
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las categorías')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setForm({
      name: '',
      description: '',
      active: true
    })
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        active: Boolean(form.active)
      }

      if (!payload.name) {
        throw new Error('El nombre de la categoría es obligatorio')
      }

      if (editingId) {
        await request(`/categories/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })

        setMessage('Categoría actualizada correctamente')
      } else {
        await request('/categories', {
          method: 'POST',
          body: JSON.stringify(payload)
        })

        setMessage('Categoría creada correctamente')
      }

      resetForm()
      await loadCategories()
    } catch (err) {
      setError(err.message || 'No se pudo guardar la categoría')
    } finally {
      setSaving(false)
    }
  }

  const editCategory = (category) => {
    setEditingId(category.id)
    setForm({
      name: category.name || '',
      description: category.description || '',
      active: category.active !== false
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteCategory = async (category) => {
    const confirmDelete = window.confirm(`¿Eliminar la categoría "${category.name}"?`)
    if (!confirmDelete) return

    try {
      setError('')
      setMessage('')

      await request(`/categories/${category.id}`, {
        method: 'DELETE'
      })

      setMessage('Categoría eliminada correctamente')
      await loadCategories()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la categoría')
    }
  }

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Gestión de Categorías" />

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="text-2xl font-poppins font-bold mb-2">
                {editingId ? 'Editar categoría' : 'Nueva categoría'}
              </h2>

              <p className="text-gray-600 mb-6">
                Crea categorías para ordenar el menú del POS.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nombre</label>
                  <input
                    name="name"
                    className="input"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Ej: Hamburguesas"
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
                    placeholder="Ej: Burgers principales del menú"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    name="active"
                    type="checkbox"
                    checked={form.active}
                    onChange={handleChange}
                  />
                  Categoría activa
                </label>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-black text-yellow-400 font-poppins font-bold px-5 py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear categoría'}
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
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-poppins font-bold">Categorías</h2>
                  <p className="text-gray-600">
                    {categories.length} categoría(s) registrada(s)
                  </p>
                </div>

                <button
                  onClick={loadCategories}
                  className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100"
                >
                  Actualizar
                </button>
              </div>

              {loading ? (
                <div className="text-center py-10 text-gray-500">
                  Cargando categorías...
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No hay categorías registradas.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-sm text-gray-500">
                        <th className="py-3 pr-4">Categoría</th>
                        <th className="py-3 pr-4">Descripción</th>
                        <th className="py-3 pr-4">Estado</th>
                        <th className="py-3 pr-4 text-right">Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {categories.map((category) => (
                        <tr key={category.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 pr-4">
                            <div className="font-semibold text-black">
                              {category.name}
                            </div>
                          </td>

                          <td className="py-4 pr-4 text-gray-700">
                            {category.description || 'Sin descripción'}
                          </td>

                          <td className="py-4 pr-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                category.active !== false
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {category.active !== false ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>

                          <td className="py-4 pr-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => editCategory(category)}
                                className="px-3 py-2 rounded bg-yellow-400 text-black font-semibold hover:bg-yellow-300"
                              >
                                Editar
                              </button>

                              <button
                                onClick={() => deleteCategory(category)}
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

export default Categories
