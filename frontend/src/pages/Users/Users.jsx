import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://american-burger-pos-api-d8r1.onrender.com/api'

const Users = () => {
  const [users, setUsers] = useState([])
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'cajero',
    active: true
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const getToken = () =>
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    ''

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

  const loadUsers = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await request('/users')
      setUsers(data.users || data.data || [])
    } catch (err) {
      setUsers([])
      setError(err.message || 'No se pudieron cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setForm({
      full_name: '',
      email: '',
      password: '',
      role: 'cajero',
      active: true
    })
  }

  const saveUser = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)

    try {
      if (!form.full_name.trim()) {
        throw new Error('Ingresa el nombre completo')
      }

      if (!form.email.trim()) {
        throw new Error('Ingresa el correo')
      }

      if (!editingId && !form.password.trim()) {
        throw new Error('Ingresa una contraseña')
      }

      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        active: form.active
      }

      if (form.password.trim()) {
        payload.password = form.password.trim()
      }

      if (editingId) {
        await request(`/users/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })

        setMessage('Usuario actualizado correctamente')
      } else {
        await request('/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        })

        setMessage('Usuario creado correctamente')
      }

      resetForm()
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Error al registrar usuario')
    } finally {
      setSaving(false)
    }
  }

  const editUser = (user) => {
    setEditingId(user.id)

    setForm({
      full_name: user.full_name || user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'cajero',
      active: user.active !== false
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteUser = async (user) => {
    const confirmDelete = window.confirm(
      `¿Desactivar el usuario "${user.full_name || user.email}"?`
    )

    if (!confirmDelete) return

    setError('')
    setMessage('')
    setSaving(true)

    try {
      await request(`/users/${user.id}`, {
        method: 'DELETE'
      })

      setMessage('Usuario desactivado correctamente')
      await loadUsers()
    } catch (err) {
      setError(err.message || 'No se pudo desactivar usuario')
    } finally {
      setSaving(false)
    }
  }

  const roleLabel = (role) =>
    ({
      admin: 'Administrador',
      cajero: 'Cajero',
      cocina: 'Cocina'
    }[role] || role)

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Gestión de Usuarios" />

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
              <h2 className="text-2xl font-poppins font-bold mb-4">
                {editingId ? 'Editar usuario' : 'Nuevo usuario'}
              </h2>

              <form onSubmit={saveUser} className="space-y-4">
                <div>
                  <label className="label">Nombre completo</label>
                  <input
                    className="input"
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">Correo</label>
                  <input
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">
                    {editingId
                      ? 'Nueva contraseña opcional'
                      : 'Contraseña'}
                  </label>
                  <input
                    type="password"
                    className="input"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required={!editingId}
                  />
                </div>

                <div>
                  <label className="label">Rol</label>
                  <select
                    className="input"
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value })
                    }
                  >
                    <option value="admin">Administrador</option>
                    <option value="cajero">Cajero</option>
                    <option value="cocina">Cocina</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm({ ...form, active: e.target.checked })
                    }
                  />
                  Usuario activo
                </label>

                <button
                  disabled={saving}
                  className="w-full bg-black text-yellow-400 font-poppins font-bold py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50"
                >
                  {saving
                    ? 'Guardando...'
                    : editingId
                      ? 'Guardar cambios'
                      : 'Crear usuario'}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full border py-3 rounded-lg hover:bg-gray-100"
                  >
                    Cancelar edición
                  </button>
                )}
              </form>
            </div>

            <div className="card lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-poppins font-bold">
                  Usuarios registrados
                </h2>

                <button
                  type="button"
                  onClick={loadUsers}
                  className="bg-black text-yellow-400 px-4 py-2 rounded-lg font-bold"
                >
                  Actualizar
                </button>
              </div>

              {loading ? (
                <div className="text-center text-gray-500 py-10">
                  Cargando usuarios...
                </div>
              ) : users.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  No hay usuarios registrados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b text-gray-500">
                        <th className="py-3">Nombre</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th className="text-right">Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id || user.email} className="border-b">
                          <td className="py-3 font-semibold">
                            {user.full_name || user.name}
                          </td>

                          <td>{user.email}</td>

                          <td>{roleLabel(user.role)}</td>

                          <td
                            className={
                              user.active === false
                                ? 'text-red-600 font-bold'
                                : 'text-green-600 font-bold'
                            }
                          >
                            {user.active === false ? 'Inactivo' : 'Activo'}
                          </td>

                          <td className="text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => editUser(user)}
                                className="bg-yellow-400 text-black px-3 py-2 rounded font-bold"
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteUser(user)}
                                className="bg-red-600 text-white px-3 py-2 rounded font-bold"
                              >
                                Desactivar
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

          <div className="card">
            <h2 className="text-xl font-bold mb-2">Roles</h2>
            <p className="text-gray-600">
              Administrador: acceso completo. Cajero: ventas y caja. Cocina: KDS.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Users
