import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://american-burger-pos-api-d8r1.onrender.com/api'

const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const AccountingAssistant = () => {
  const [dashboard, setDashboard] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    supplier_name: '',
    document_type: 'FACTURA',
    document_number: '',
    description: '',
    category: '',
    payment_method: 'transfer',
    expense_date: new Date().toISOString().slice(0, 10),
    total_amount: '',
    notes: ''
  })

  const getToken = () =>
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    ''

  const request = async (path, options = {}) => {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
        ...(options.headers || {})
      }
    })

    const text = await res.text()
    let data = null

    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { message: text }
    }

    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Error de conexión')
    }

    return data
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [dashboardData, expensesData] = await Promise.all([
        request('/accounting/dashboard'),
        request('/accounting/expenses')
      ])

      setDashboard(dashboardData)
      setExpenses(Array.isArray(expensesData) ? expensesData : [])
    } catch (err) {
      setError(err.message || 'No se pudo cargar el asistente contable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.total_amount || Number(form.total_amount) <= 0) {
      alert('Ingresa un total válido')
      return
    }

    try {
      setError('')
      setMessage('')

      await request('/accounting/expenses', {
        method: 'POST',
        body: JSON.stringify(form)
      })

      setForm({
        supplier_name: '',
        document_type: 'FACTURA',
        document_number: '',
        description: '',
        category: '',
        payment_method: 'transfer',
        expense_date: new Date().toISOString().slice(0, 10),
        total_amount: '',
        notes: ''
      })

      setMessage('Compra o gasto registrado correctamente')
      await loadData()
    } catch (err) {
      setError(err.message || 'No se pudo guardar el gasto')
    }
  }

  const deleteExpense = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return

    try {
      setError('')
      setMessage('')

      await request(`/accounting/expenses/${id}`, {
        method: 'DELETE'
      })

      setMessage('Registro eliminado correctamente')
      await loadData()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el registro')
    }
  }

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Contabilidad" />

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
            <h1 className="text-3xl font-black mt-1">
              🧾 Asistente Contable
            </h1>
            <p className="text-gray-300 mt-1">
              Centro financiero y tributario de American Burger.
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-md p-8 font-bold">
              Cargando Asistente Contable...
            </div>
          ) : (
            <>
              {dashboard && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-5">
                    <Card title="Ventas del mes" value={money(dashboard.sales?.gross)} />
                    <Card title="Ventas netas" value={money(dashboard.sales?.net)} />
                    <Card title="IVA débito" value={money(dashboard.taxes?.iva_debit)} />
                    <Card title="IVA crédito" value={money(dashboard.taxes?.iva_credit)} />
                    <Card title="IVA a pagar" value={money(dashboard.taxes?.iva_to_pay)} danger />
                    <Card title="Utilidad estimada" value={money(dashboard.result?.gross_profit_estimated)} />
                  </div>

                  <div className="bg-white rounded-2xl shadow-md p-6">
                    <h2 className="text-2xl font-black mb-4">⚠ Alertas contables</h2>

                    {dashboard.alerts?.length > 0 ? (
                      <div className="space-y-3">
                        {dashboard.alerts.map((alert, index) => (
                          <div
                            key={index}
                            className="bg-yellow-50 border border-yellow-300 rounded-xl p-4"
                          >
                            <h3 className="font-black">{alert.title}</h3>
                            <p className="mt-1">{alert.message}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">Sin alertas contables.</p>
                    )}
                  </div>
                </>
              )}

              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-2xl font-black mb-4">
                  🧾 Registrar compra o gasto
                </h2>

                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
                >
                  <input
                    className="input"
                    name="supplier_name"
                    placeholder="Proveedor"
                    value={form.supplier_name}
                    onChange={handleChange}
                  />

                  <select
                    className="input"
                    name="document_type"
                    value={form.document_type}
                    onChange={handleChange}
                  >
                    <option value="FACTURA">Factura</option>
                    <option value="BOLETA">Boleta</option>
                    <option value="RECIBO">Recibo</option>
                    <option value="OTRO">Otro</option>
                  </select>

                  <input
                    className="input"
                    name="document_number"
                    placeholder="N° documento"
                    value={form.document_number}
                    onChange={handleChange}
                  />

                  <input
                    className="input"
                    name="description"
                    placeholder="Descripción"
                    value={form.description}
                    onChange={handleChange}
                  />

                  <input
                    className="input"
                    name="category"
                    placeholder="Categoría: carne, pan, gas..."
                    value={form.category}
                    onChange={handleChange}
                  />

                  <select
                    className="input"
                    name="payment_method"
                    value={form.payment_method}
                    onChange={handleChange}
                  >
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia</option>
                    <option value="card">Tarjeta</option>
                    <option value="other">Otro</option>
                  </select>

                  <input
                    className="input"
                    name="expense_date"
                    type="date"
                    value={form.expense_date}
                    onChange={handleChange}
                  />

                  <input
                    className="input"
                    name="total_amount"
                    type="number"
                    placeholder="Total con IVA"
                    value={form.total_amount}
                    onChange={handleChange}
                  />

                  <input
                    className="input xl:col-span-3"
                    name="notes"
                    placeholder="Notas"
                    value={form.notes}
                    onChange={handleChange}
                  />

                  <button
                    type="submit"
                    className="bg-black text-yellow-400 font-black py-3 rounded-xl"
                  >
                    Guardar
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h2 className="text-2xl font-black">
                      📑 Compras y gastos registrados
                    </h2>
                    <p className="text-gray-500">
                      Facturas, boletas, gastos y respaldos del mes.
                    </p>
                  </div>

                  <button
                    onClick={loadData}
                    className="bg-gray-100 hover:bg-gray-200 text-black px-5 py-3 rounded-xl font-bold"
                  >
                    🔄 Actualizar
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-left">
                    <thead className="bg-black text-yellow-400">
                      <tr>
                        <th className="py-4 px-4">Fecha</th>
                        <th className="px-4">Proveedor</th>
                        <th className="px-4">Documento</th>
                        <th className="px-4">Descripción</th>
                        <th className="px-4">Neto</th>
                        <th className="px-4">IVA</th>
                        <th className="px-4">Total</th>
                        <th className="px-4 text-right">Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center text-gray-500 py-10">
                            Aún no hay compras o gastos registrados.
                          </td>
                        </tr>
                      ) : (
                        expenses.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-yellow-50">
                            <td className="py-4 px-4 font-semibold">
                              {item.expense_date}
                            </td>
                            <td className="px-4">{item.supplier_name || '-'}</td>
                            <td className="px-4">
                              {item.document_type} {item.document_number}
                            </td>
                            <td className="px-4">{item.description || '-'}</td>
                            <td className="px-4">{money(item.net_amount)}</td>
                            <td className="px-4">{money(item.iva_amount)}</td>
                            <td className="px-4 font-black">
                              {money(item.total_amount)}
                            </td>
                            <td className="px-4 text-right">
                              <button
                                onClick={() => deleteExpense(item.id)}
                                className="bg-red-600 text-white px-3 py-2 rounded-lg font-bold"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Card({ title, value, danger }) {
  return (
    <div
      className={`rounded-2xl shadow-md p-5 border-l-8 ${
        danger
          ? 'bg-red-900 text-white border-red-500'
          : 'bg-white text-black border-yellow-400'
      }`}
    >
      <p className={danger ? 'text-red-100 font-bold' : 'text-gray-500 font-bold'}>
        {title}
      </p>
      <h2 className="text-3xl font-black mt-2">{value}</h2>
    </div>
  )
}

export default AccountingAssistant
