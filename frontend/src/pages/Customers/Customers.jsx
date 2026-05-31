import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL = import.meta.env.VITE_API_URL || 'https://american-burger-pos-api-d8r1.onrender.com/api'

const getToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('authToken') ||
  localStorage.getItem('access_token') ||
  ''

const Customers = () => {
  const [customers, setCustomers] = useState([])
  const [error, setError] = useState('')

  const loadCustomers = async () => {
    try {
      const token = getToken()

      const response = await fetch(`${API_URL}/customers`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Error al cargar clientes')
      }

      setCustomers(data.customers || [])
    } catch (err) {
      setError(err.message || 'No se pudieron cargar clientes')
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const whatsappUrl = (phone) => {
    const clean = String(phone || '').replace(/[^0-9]/g, '')
    const number = clean.startsWith('56') ? clean : `56${clean}`
    return `https://wa.me/${number}`
  }

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Gestión de Clientes" />

        <div className="main-content space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-poppins font-bold">
                  Clientes registrados
                </h2>
                <p className="text-gray-600">
                  {customers.length} cliente(s) guardado(s)
                </p>
              </div>

              <button
                onClick={loadCustomers}
                className="bg-black text-yellow-400 font-bold px-5 py-3 rounded-lg"
              >
                Actualizar
              </button>
            </div>

            {customers.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                No hay clientes registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="py-3">Nombre</th>
                      <th>WhatsApp</th>
                      <th>Dirección</th>
                      <th>Referencia</th>
                      <th>Actualizado</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id || customer.phone} className="border-b">
                        <td className="py-3 font-semibold">
                          {customer.name || 'Sin nombre'}
                        </td>

                        <td>{customer.phone}</td>

                        <td>{customer.address || 'Sin dirección'}</td>

                        <td>{customer.reference || 'Sin referencia'}</td>

                        <td>
                          {customer.updated_at
                            ? new Date(customer.updated_at).toLocaleString('es-CL')
                            : '-'}
                        </td>

                        <td className="text-right">
                          <a
                            href={whatsappUrl(customer.phone)}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-green-600 text-white px-3 py-2 rounded"
                          >
                            WhatsApp
                          </a>
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
  )
}

export default Customers
