import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const BusinessSettings = () => {
  const [form, setForm] = useState({
    businessName: 'AMERICAN BURGER',
    address: 'Av. Santa María 2248, Arica',
    phone: '+56 9 3080 9265',
    email: 'americanburgerarica@gmail.com',
    instagram: '@americanburgerarica',
    currency: 'CLP',
    taxRate: '19',
    deliveryDefault: '1500'
  })

  const [message, setMessage] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('business_settings')
    if (saved) setForm(JSON.parse(saved))
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((current) => ({
      ...current,
      [name]: value
    }))
  }

  const saveSettings = (e) => {
    e.preventDefault()
    localStorage.setItem('business_settings', JSON.stringify(form))
    setMessage('Configuración guardada correctamente')
  }

  return (
    <div className="page-container">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Configuración del Negocio" />

        <div className="main-content space-y-6">
          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}

          <div className="card">
            <h2 className="text-2xl font-poppins font-bold mb-4">
              Configuración
            </h2>

            <p className="text-gray-600 mb-6">
              Datos principales de American Burger para el sistema POS.
            </p>

            <form onSubmit={saveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre del negocio</label>
                <input
                  name="businessName"
                  className="input"
                  value={form.businessName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="label">Correo</label>
                <input
                  name="email"
                  className="input"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="label">Teléfono / WhatsApp</label>
                <input
                  name="phone"
                  className="input"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="label">Instagram</label>
                <input
                  name="instagram"
                  className="input"
                  value={form.instagram}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Dirección</label>
                <input
                  name="address"
                  className="input"
                  value={form.address}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="label">Moneda</label>
                <input
                  name="currency"
                  className="input"
                  value={form.currency}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="label">IVA (%)</label>
                <input
                  name="taxRate"
                  type="number"
                  className="input"
                  value={form.taxRate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="label">Delivery por defecto</label>
                <input
                  name="deliveryDefault"
                  type="number"
                  className="input"
                  value={form.deliveryDefault}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-2">
                <button className="bg-black text-yellow-400 font-poppins font-bold px-6 py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition-all">
                  Guardar configuración
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Resumen</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <p><strong>Negocio:</strong> {form.businessName}</p>
              <p><strong>Correo:</strong> {form.email}</p>
              <p><strong>Teléfono:</strong> {form.phone}</p>
              <p><strong>Instagram:</strong> {form.instagram}</p>
              <p><strong>Dirección:</strong> {form.address}</p>
              <p><strong>Moneda:</strong> {form.currency}</p>
              <p><strong>IVA:</strong> {form.taxRate}%</p>
              <p><strong>Delivery:</strong> ${form.deliveryDefault}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessSettings
