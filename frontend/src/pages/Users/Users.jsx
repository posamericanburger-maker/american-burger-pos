import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL = import.meta.env.VITE_API_URL || 'https://american-burger-pos-api-d8r1.onrender.com/api'

const Users = () => {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'cajero'
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const getToken = () =>
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    ''

  const loadUsers = async () => {
    try {
      const token = getToken()

      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })

      const data = await response.json()
      setUsers(data.users || data.data || (Array.isArray(data) ? data : []))
    } catch {
      setUsers([])
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const saveUser = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    try {
      const token = getToken()

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo crear usuario')
      }

      setMessage('Usuario creado correctamente')
      setForm({
        full_name: '',
        email: '',
        password: '',
        role: 'cajero'
      })

      loadUsers()
    } catch (err) {
      setError(err.message)
    }
  }

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
                Nuevo usuario
              </h2>

              <form onSubmit={saveUser} className="space-y-4">
                <div>
                  <label className="label">Nombre completo</label>
                  <input
                    className="input"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Correo</label>
                  <input
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Contraseña</label>
                  <input
                    type="password"
                    className="input"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Rol</label>
                  <select
                    className="input"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="admin">Administrador</option>
                    <option value="cajero">Cajero</option>
                    <option value="kitchen">Cocina</option>
                  </select>
                </div>

                <button className="w-full bg-black text-yellow-400 font-poppins font-bold py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition-all">
                  Crear usuario
                </button>
              </form>
            </div>

            <div className="card lg:col-span-2">
              <h2 className="text-2xl font-poppins font-bold mb-4">
                Usuarios registrados
              </h2>

              {users.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  No hay usuarios cargados o la ruta /users no está disponible.
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="py-3">Nombre</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id || user.email} className="border-b">
                        <td className="py-3 font-semibold">
                          {user.full_name || user.name}
                        </td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{user.active === false ? 'Inactivo' : 'Activo'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
