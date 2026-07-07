import { useEffect, useMemo, useState } from 'react'
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

const ivaFromGross = (gross) => Math.round(Number(gross || 0) * 19 / 119)

const cleanSupplierName = (supplier) =>
  supplier?.name ||
  supplier?.supplier_name ||
  supplier?.business_name ||
  supplier?.company_name ||
  supplier?.razon_social ||
  'Proveedor'

const AccountingAssistant = () => {
  const [dashboard, setDashboard] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const emptyForm = {
    supplier_id: '',
    supplier_name: '',
    document_type: 'FACTURA',
    document_number: '',
    description: '',
    category: '',
    payment_method: 'transfer',
    expense_date: new Date().toISOString().slice(0, 10),
    total_amount: '',
    notes: ''
  }

  const [form, setForm] = useState(emptyForm)

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

      const [dashboardData, expensesData, suppliersData] = await Promise.all([
        request('/accounting/dashboard'),
        request('/accounting/expenses'),
        request('/suppliers')
      ])

      setDashboard(dashboardData)
      setExpenses(Array.isArray(expensesData) ? expensesData : [])

      setSuppliers(
        Array.isArray(suppliersData)
          ? suppliersData
          : suppliersData.suppliers || suppliersData.data || []
      )
    } catch (err) {
      setError(err.message || 'No se pudo cargar el asistente contable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const preview = useMemo(() => {
    const total = Number(form.total_amount || 0)
    const isInvoice = form.document_type === 'FACTURA'
    const iva = isInvoice ? ivaFromGross(total) : 0
    const net = total - iva

    return {
      total,
      iva,
      net
    }
  }, [form.total_amount, form.document_type])

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    })
  }

  const handleSupplierChange = (event) => {
    const supplierId = event.target.value
    const selected = suppliers.find((item) => String(item.id) === String(supplierId))

    setForm({
      ...form,
      supplier_id: selected?.id || '',
      supplier_name: selected ? cleanSupplierName(selected) : ''
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.total_amount || Number(form.total_amount) <= 0) {
      alert('Ingresa un total válido')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      const payload = {
        ...form,
        total_amount: Number(form.total_amount || 0)
      }

      if (editingId) {
        await request(`/accounting/expenses/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })

        setMessage('Gasto actualizado correctamente')
      } else {
        await request('/accounting/expenses', {
          method: 'POST',
          body: JSON.stringify(payload)
        })

        setMessage('Compra o gasto registrado correctamente')
      }

      resetForm()
      await loadData()
    } catch (err) {
      setError(err.message || 'No se pudo guardar el gasto')
    } finally {
      setSaving(false)
    }
  }

  const editExpense = (item) => {
    setEditingId(item.id)
    setForm({
      supplier_id: item.supplier_id || '',
      supplier_name: item.supplier_name || '',
      document_type: item.document_type || 'BOLETA',
      document_number: item.document_number || '',
      description: item.description || '',
      category: item.category || '',
      payment_method: item.payment_method || 'cash',
      expense_date: item.expense_date || new Date().toISOString().slice(0, 10),
      total_amount: String(item.total_amount || ''),
      notes: item.notes || ''
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
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
              Centro financiero y tributario conectado con Caja y Proveedores.
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

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    <InfoBox
                      title="Gastos del mes"
                      value={money(dashboard.expenses?.gross)}
                      subtitle={`${dashboard.expenses?.count || 0} registros`}
                    />
                    <InfoBox
                      title="Gastos netos"
                      value={money(dashboard.expenses?.net)}
                      subtitle="Sin IVA crédito"
                    />
                    <InfoBox
                      title="Margen estimado"
                      value={`${dashboard.result?.margin_percent || 0}%`}
                      subtitle="Estimado sobre ventas brutas"
                    />
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
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-2xl font-black">
                      🧾 {editingId ? 'Editar compra o gasto' : 'Registrar compra o gasto'}
                    </h2>
                    <p className="text-gray-500">
                      Este registro se guarda en Caja y alimenta Contabilidad automáticamente.
                    </p>
                  </div>

                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="bg-gray-100 hover:bg-gray-200 px-5 py-3 rounded-xl font-bold"
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
                >
                  <select
                    className="input"
                    name="supplier_id"
                    value={form.supplier_id}
                    onChange={handleSupplierChange}
                  >
                    <option value="">Sin proveedor</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {cleanSupplierName(supplier)}
                      </option>
                    ))}
                  </select>

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

                  <div className="xl:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-xl border p-4">
                      <p className="text-gray-500 font-bold">Neto estimado</p>
                      <h3 className="text-2xl font-black">{money(preview.net)}</h3>
                    </div>

                    <div className="bg-gray-50 rounded-xl border p-4">
                      <p className="text-gray-500 font-bold">IVA crédito</p>
                      <h3 className="text-2xl font-black">{money(preview.iva)}</h3>
                    </div>

                    <div className="bg-gray-50 rounded-xl border p-4">
                      <p className="text-gray-500 font-bold">Total</p>
                      <h3 className="text-2xl font-black">{money(preview.total)}</h3>
                    </div>
                  </div>

                  <input
                    className="input xl:col-span-3"
                    name="notes"
                    placeholder="Notas"
                    value={form.notes}
                    onChange={handleChange}
                  />

                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-black text-yellow-400 font-black py-3 rounded-xl disabled:opacity-50"
                  >
                    {saving
                      ? 'Guardando...'
                      : editingId
                        ? 'Actualizar'
                        : 'Guardar'}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-2xl font-black">
                      📑 Compras y gastos registrados
                    </h2>
                    <p className="text-gray-500">
                      Gastos provenientes de Caja y Contabilidad.
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
                        <th className="px-4">Categoría</th>
                        <th className="px-4">Neto</th>
                        <th className="px-4">IVA</th>
                        <th className="px-4">Total</th>
                        <th className="px-4 text-right">Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="text-center text-gray-500 py-10">
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
                            <td className="px-4">{item.category || '-'}</td>
                            <td className="px-4">{money(item.net_amount)}</td>
                            <td className="px-4">{money(item.iva_amount)}</td>
                            <td className="px-4 font-black">
                              {money(item.total_amount)}
                            </td>
                            <td className="px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => editExpense(item)}
                                  className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold"
                                >
                                  Editar
                                </button>

                                <button
                                  onClick={() => deleteExpense(item.id)}
                                  className="bg-red-600 text-white px-3 py-2 rounded-lg font-bold"
                                >
                                  Eliminar
                                </button>
                              </div>
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

function InfoBox({ title, value, subtitle }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      <p className="text-gray-500 font-bold">{title}</p>
      <h2 className="text-3xl font-black mt-2">{value}</h2>
      <p className="text-gray-500 mt-1">{subtitle}</p>
    </div>
  )
}

export default AccountingAssistant
