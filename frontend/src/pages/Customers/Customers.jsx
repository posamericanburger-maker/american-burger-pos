import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL = import.meta.env.VITE_API_URL || 'https://american-burger-pos-api-d8r1.onrender.com/api'

const Customers = () => {
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    reference: ''
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('customers')
    if (saved) setCustomers(JSON.parse(saved))
  }, [])

  const saveCustomer = (e) => {
    e.preventDefault()

    const newCustomer = {
      id: Date.now(),
      ...form,
      created_at: new Date().toISOString()
    }

    const updated = [newCustomer, ...customers]
    setCustomers(updated)
    localStorage.setItem('customers', JSON.stringify(updated))

    setForm({
      name: '',
      phone: '',
      address: '',
      reference: ''
    })

    setMessage('Cliente guardado correctamente')
  }

  const deleteCustomer = (id) => {
    const updated = customers.filter((customer) => customer.id !== id)
    setCustomers(updated)
    localStorage.setItem('customers', JSON.stringify(updated))
  }

  const whatsappUrl = (phone) => {
    const clean = phone.replace(/[^0-9]/g, '')
    const number = clean.startsWith('56') ? clean : `56${clean}`
    return `https://wa.me/${number}`
  }

  return (
    <div className="page-container">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Gestión de Clientes" />

        <div className="main-content space-y-6">
          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="text-2xl font-poppins font-bold mb-4">
                Nuevo cliente
              </h2>

              <form onSubmit={saveCustomer} className="space-y-4">
                <div>
                  <label className="label">Nombre</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nombre del cliente"
                    required
                  />
                </div>

                <div>
                  <label className="label">WhatsApp</label>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+56 9..."
                    required
                  />
                </div>

                <div>
                  <label className="label">Dirección</label>
                  <input
                    className="input"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Dirección de entrega"
                  />
                </div>

                <div>
                  <label className="label">Referencia</label>
                  <textarea
                    className="input min-h-[90px]"
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    placeholder="Casa, depto, color de puerta, local..."
                  />
                </div>

                <button className="w-full bg-black text-yellow-400 font-poppins font-bold py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition-all">
                  Guardar cliente
                </button>
              </form>
            </div>

            <div className="card lg:col-span-2">
              <h2 className="text-2xl font-poppins font-bold mb-4">
                Clientes registrados
              </h2>

              <p className="text-gray-600 mb-6">
                {customers.length} cliente(s) guardado(s)
              </p>

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
                        <th className="text-right">Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {customers.map((customer) => (
                        <tr key={customer.id} className="border-b">
                          <td className="py-3 font-semibold">{customer.name}</td>
                          <td>{customer.phone}</td>
                          <td>{customer.address || 'Sin dirección'}</td>
                          <td>{customer.reference || 'Sin referencia'}</td>
                          <td className="text-right space-x-2">
                            <a
                              href={whatsappUrl(customer.phone)}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-green-600 text-white px-3 py-2 rounded"
                            >
                              WhatsApp
                            </a>

                            <button
                              onClick={() => deleteCustomer(customer.id)}
                              className="bg-red-600 text-white px-3 py-2 rounded"
                            >
                              Eliminar
                            </button>
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
            <h2 className="text-xl font-bold mb-2">Nota</h2>
            <p className="text-gray-600">
              Este módulo guarda clientes en el navegador usando localStorage.
              Más adelante se puede conectar a Supabase para guardar clientes en la base de datos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Customers
