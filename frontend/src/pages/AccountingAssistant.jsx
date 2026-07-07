import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

export default function AccountingAssistant() {
  const [dashboard, setDashboard] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

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

  const loadData = async () => {
    try {
      setLoading(true)

      const [dashboardRes, expensesRes] = await Promise.all([
        fetch(`${API_URL}/accounting/dashboard`),
        fetch(`${API_URL}/accounting/expenses`)
      ])

      const dashboardData = await dashboardRes.json()
      const expensesData = await expensesRes.json()

      setDashboard(dashboardData)
      setExpenses(Array.isArray(expensesData) ? expensesData : [])
    } catch (error) {
      console.error('Error cargando asistente contable:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.total_amount || Number(form.total_amount) <= 0) {
      alert('Ingresa un total válido')
      return
    }

    try {
      const res = await fetch(`${API_URL}/accounting/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error guardando gasto')
      }

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

      await loadData()
      alert('Compra o gasto registrado correctamente')
    } catch (error) {
      alert(error.message)
    }
  }

  const deleteExpense = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return

    await fetch(`${API_URL}/accounting/expenses/${id}`, {
      method: 'DELETE'
    })

    await loadData()
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Cargando Asistente Contable...</div>
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>📊 Asistente Contable</h1>
      <p>Centro financiero y tributario de American Burger</p>

      {dashboard && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            margin: '24px 0'
          }}>
            <Card title="Ventas del mes" value={money(dashboard.sales?.gross)} />
            <Card title="Ventas netas" value={money(dashboard.sales?.net)} />
            <Card title="IVA débito" value={money(dashboard.taxes?.iva_debit)} />
            <Card title="IVA crédito" value={money(dashboard.taxes?.iva_credit)} />
            <Card title="IVA estimado a pagar" value={money(dashboard.taxes?.iva_to_pay)} danger />
            <Card title="Utilidad estimada" value={money(dashboard.result?.gross_profit_estimated)} />
          </div>

          <h2>⚠ Alertas</h2>

          {dashboard.alerts?.length > 0 ? (
            <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
              {dashboard.alerts.map((alert, index) => (
                <div key={index} style={{
                  padding: 16,
                  borderRadius: 12,
                  background: '#fff3cd',
                  border: '1px solid #ffeeba'
                }}>
                  <strong>{alert.title}</strong>
                  <p style={{ margin: '6px 0 0' }}>{alert.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>Sin alertas contables.</p>
          )}
        </>
      )}

      <h2>🧾 Registrar compra o gasto</h2>

      <form onSubmit={handleSubmit} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 32,
        background: '#f5f5f5',
        padding: 16,
        borderRadius: 12
      }}>
        <input name="supplier_name" placeholder="Proveedor" value={form.supplier_name} onChange={handleChange} />

        <select name="document_type" value={form.document_type} onChange={handleChange}>
          <option value="FACTURA">Factura</option>
          <option value="BOLETA">Boleta</option>
          <option value="RECIBO">Recibo</option>
          <option value="OTRO">Otro</option>
        </select>

        <input name="document_number" placeholder="N° documento" value={form.document_number} onChange={handleChange} />

        <input name="description" placeholder="Descripción" value={form.description} onChange={handleChange} />

        <input name="category" placeholder="Categoría: carne, pan, gas..." value={form.category} onChange={handleChange} />

        <select name="payment_method" value={form.payment_method} onChange={handleChange}>
          <option value="cash">Efectivo</option>
          <option value="transfer">Transferencia</option>
          <option value="card">Tarjeta</option>
          <option value="other">Otro</option>
        </select>

        <input name="expense_date" type="date" value={form.expense_date} onChange={handleChange} />

        <input name="total_amount" type="number" placeholder="Total con IVA" value={form.total_amount} onChange={handleChange} />

        <input name="notes" placeholder="Notas" value={form.notes} onChange={handleChange} />

        <button type="submit">Guardar</button>
      </form>

      <h2>📑 Compras y gastos registrados</h2>

      <div style={{ overflowX: 'auto' }}>
        <table width="100%" cellPadding="10" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#111', color: '#fff' }}>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Documento</th>
              <th>Descripción</th>
              <th>Neto</th>
              <th>IVA</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td>{item.expense_date}</td>
                <td>{item.supplier_name}</td>
                <td>{item.document_type} {item.document_number}</td>
                <td>{item.description}</td>
                <td>{money(item.net_amount)}</td>
                <td>{money(item.iva_amount)}</td>
                <td><strong>{money(item.total_amount)}</strong></td>
                <td>
                  <button onClick={() => deleteExpense(item.id)}>Eliminar</button>
                </td>
              </tr>
            ))}

            {expenses.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: 24 }}>
                  Aún no hay compras o gastos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Card({ title, value, danger }) {
  return (
    <div style={{
      background: danger ? '#7f1d1d' : '#111',
      color: '#fff',
      padding: 18,
      borderRadius: 14
    }}>
      <div style={{ opacity: 0.75, fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{value}</div>
    </div>
  )
}
