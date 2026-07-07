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
  const [activeTab, setActiveTab] = useState('dashboard')
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
      setError(err.message || 'No se pudo cargar el centro financiero')
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

    return { total, iva, net }
  }, [form.total_amount, form.document_type])

  const totals = useMemo(() => {
    const salesGross = Number(dashboard?.sales?.gross || 0)
    const salesNet = Number(dashboard?.sales?.net || 0)
    const expensesGross = Number(dashboard?.expenses?.gross || 0)
    const expensesNet = Number(dashboard?.expenses?.net || 0)
    const ivaDebit = Number(dashboard?.taxes?.iva_debit || 0)
    const ivaCredit = Number(dashboard?.taxes?.iva_credit || 0)
    const ivaToPay = Number(dashboard?.taxes?.iva_to_pay || 0)
    const profit = Number(dashboard?.result?.gross_profit_estimated || 0)

    const projectedSales = salesGross * 1.8
    const projectedIVA = ivaToPay * 1.8

    const businessHealth = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          70 +
            (profit > 0 ? 15 : -20) +
            (ivaToPay >= 0 ? 5 : -5) +
            (expensesGross < salesGross ? 10 : -15)
        )
      )
    )

    return {
      salesGross,
      salesNet,
      salesByPayment: dashboard?.sales?.by_payment_method || {},
      expensesGross,
      expensesNet,
      ivaDebit,
      ivaCredit,
      ivaToPay,
      profit,
      projectedSales,
      projectedIVA,
      businessHealth
    }
  }, [dashboard])

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

    setActiveTab('dashboard')
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

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'pl', label: 'Estado de Resultados', icon: '📑' },
    { id: 'cashflow', label: 'Flujo de Caja', icon: '💰' },
    { id: 'tax', label: 'Control Tributario', icon: '🏛️' },
    { id: 'foodcost', label: 'Food Cost', icon: '🍔' },
    { id: 'ai', label: 'IA Contable', icon: '🤖' },
    { id: 'projections', label: 'Proyecciones', icon: '📈' },
    { id: 'control', label: 'Centro Empresarial', icon: '🎯' }
  ]

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Centro Financiero" />

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
              💼 Centro Financiero
            </h1>
            <p className="text-gray-300 mt-1">
              Contabilidad, caja, impuestos, rentabilidad, food cost y análisis inteligente.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-3 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 rounded-xl font-black ${
                    activeTab === tab.id
                      ? 'bg-black text-yellow-400'
                      : 'bg-gray-100 text-black hover:bg-yellow-100'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-md p-8 font-bold">
              Cargando Centro Financiero...
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <>
                  <DashboardCards dashboard={dashboard} />

                  <ExpenseForm
                    form={form}
                    preview={preview}
                    suppliers={suppliers}
                    saving={saving}
                    editingId={editingId}
                    handleChange={handleChange}
                    handleSupplierChange={handleSupplierChange}
                    handleSubmit={handleSubmit}
                    resetForm={resetForm}
                  />

                  <ExpensesTable
                    expenses={expenses}
                    editExpense={editExpense}
                    deleteExpense={deleteExpense}
                    loadData={loadData}
                  />
                </>
              )}

              {activeTab === 'pl' && (
                <ProfitLoss totals={totals} expenses={expenses} />
              )}

              {activeTab === 'cashflow' && (
                <CashFlow totals={totals} expenses={expenses} />
              )}

              {activeTab === 'tax' && (
                <TaxCenter totals={totals} expenses={expenses} />
              )}

              {activeTab === 'foodcost' && (
                <FoodCost />
              )}

              {activeTab === 'ai' && (
                <AIAccounting totals={totals} expenses={expenses} />
              )}

              {activeTab === 'projections' && (
                <Projections totals={totals} />
              )}

              {activeTab === 'control' && (
                <BusinessControl totals={totals} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardCards({ dashboard }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-5">
        <Card title="Ventas del mes" value={money(dashboard?.sales?.gross)} />
        <Card title="Ventas netas" value={money(dashboard?.sales?.net)} />
        <Card title="IVA débito" value={money(dashboard?.taxes?.iva_debit)} />
        <Card title="IVA crédito" value={money(dashboard?.taxes?.iva_credit)} />
        <Card title="IVA a pagar" value={money(dashboard?.taxes?.iva_to_pay)} danger />
        <Card title="Utilidad estimada" value={money(dashboard?.result?.gross_profit_estimated)} />
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-2xl font-black mb-4">⚠ Alertas contables</h2>

        {dashboard?.alerts?.length > 0 ? (
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
  )
}

function ExpenseForm({
  form,
  preview,
  suppliers,
  saving,
  editingId,
  handleChange,
  handleSupplierChange,
  handleSubmit,
  resetForm
}) {
  return (
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
          <MiniBox title="Neto estimado" value={money(preview.net)} />
          <MiniBox title="IVA crédito" value={money(preview.iva)} />
          <MiniBox title="Total" value={money(preview.total)} />
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
          {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}

function ExpensesTable({ expenses, editExpense, deleteExpense, loadData }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl font-black">📑 Compras y gastos registrados</h2>
          <p className="text-gray-500">Gastos provenientes de Caja y Contabilidad.</p>
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
                  <td className="py-4 px-4 font-semibold">{item.expense_date}</td>
                  <td className="px-4">{item.supplier_name || '-'}</td>
                  <td className="px-4">{item.document_type} {item.document_number}</td>
                  <td className="px-4">{item.description || '-'}</td>
                  <td className="px-4">{item.category || '-'}</td>
                  <td className="px-4">{money(item.net_amount)}</td>
                  <td className="px-4">{money(item.iva_amount)}</td>
                  <td className="px-4 font-black">{money(item.total_amount)}</td>
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
  )
}

function ProfitLoss({ totals, expenses }) {
  return (
    <Panel title="📑 Estado de Resultados (P&L)" subtitle="Rentabilidad estimada del mes.">
      <FinancialRow label="Ventas brutas" value={totals.salesGross} strong />
      <FinancialRow label="(-) IVA débito" value={totals.ivaDebit} negative />
      <FinancialRow label="Ventas netas" value={totals.salesNet} strong />
      <Divider />
      <FinancialRow label="(-) Gastos netos registrados" value={totals.expensesNet} negative />
      <FinancialRow label="Utilidad operacional estimada" value={totals.profit} strong highlight />
      <Divider />
      <h3 className="text-xl font-black mt-6 mb-3">Detalle de gastos</h3>
      {expenses.length === 0 ? (
        <p className="text-gray-500">Sin gastos registrados.</p>
      ) : (
        expenses.map((item) => (
          <FinancialRow
            key={item.id}
            label={`${item.category || 'Gasto'} - ${item.description || 'Sin descripción'}`}
            value={item.net_amount}
            negative
          />
        ))
      )}
    </Panel>
  )
}

function CashFlow({ totals, expenses }) {
  const sales = totals.salesByPayment || {}

  const cashSales = Number(sales.cash || 0)
  const transferSales = Number(sales.transfer || 0)

  const cardSales =
    Number(sales.card || 0) +
    Number(sales.credit || 0) +
    Number(sales.debit || 0)

  const pendingSales = Number(sales.pending || 0)

  const expensesByMethod = {}

  expenses.forEach((expense) => {
    const method = expense.payment_method || 'cash'

    expensesByMethod[method] =
      (expensesByMethod[method] || 0) +
      Number(expense.total_amount || 0)
  })

  const cashExpenses = Number(expensesByMethod.cash || 0)
  const transferExpenses = Number(expensesByMethod.transfer || 0)

  const cardExpenses =
    Number(expensesByMethod.card || 0) +
    Number(expensesByMethod.credit || 0) +
    Number(expensesByMethod.debit || 0)

  const otherExpenses = Number(expensesByMethod.other || 0)

  const netCash = cashSales - cashExpenses
  const netTransfer = transferSales - transferExpenses
  const netCard = cardSales - cardExpenses
  const netTotal = totals.salesGross - totals.expensesGross

  return (
    <Panel
      title="💰 Flujo de Caja"
      subtitle="Entradas y salidas reales de dinero por medio de pago."
    >
      <FinancialRow label="Entradas por ventas" value={totals.salesGross} strong />
      <FinancialRow label="(-) Salidas por gastos" value={totals.expensesGross} negative />
      <FinancialRow label="Flujo neto" value={netTotal} strong highlight />

      <Divider />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MiniBox title="💵 Efectivo recibido" value={money(cashSales)} />
        <MiniBox title="🏦 Transferencias recibidas" value={money(transferSales)} />
        <MiniBox title="💳 Tarjetas recibidas" value={money(cardSales)} />
        <MiniBox title="⏳ Pendiente" value={money(pendingSales)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <MiniBox title="Gastos efectivo" value={money(cashExpenses)} />
        <MiniBox title="Gastos transferencia" value={money(transferExpenses)} />
        <MiniBox title="Gastos tarjeta" value={money(cardExpenses)} />
        <MiniBox title="Otros gastos" value={money(otherExpenses)} />
      </div>

      <Divider />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniBox title="Flujo efectivo" value={money(netCash)} />
        <MiniBox title="Flujo transferencia" value={money(netTransfer)} />
        <MiniBox title="Flujo tarjeta" value={money(netCard)} />
      </div>

      <div className={`rounded-2xl p-6 mt-4 ${netTotal >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
        <p className="font-bold text-gray-600">Resultado de flujo de caja</p>
        <h2 className={`text-4xl font-black mt-2 ${netTotal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          {money(netTotal)}
        </h2>
        <p className="mt-2 font-semibold">
          {netTotal >= 0
            ? 'El negocio generó caja positiva en el periodo.'
            : 'Salió más dinero del que entró en el periodo.'}
        </p>
      </div>
    </Panel>
  )
}

function TaxCenter({ totals, expenses }) {
  const invoiceExpenses = expenses.filter((item) => item.document_type === 'FACTURA')
  const nonInvoiceExpenses = expenses.filter((item) => item.document_type !== 'FACTURA')
  const lostIVA = nonInvoiceExpenses.reduce((sum, item) => sum + ivaFromGross(item.total_amount), 0)

  return (
    <Panel title="🏛 Control Tributario (SII)" subtitle="IVA, compras, ventas y documentos del mes.">
      <FinancialRow label="IVA débito ventas" value={totals.ivaDebit} negative />
      <FinancialRow label="IVA crédito compras/gastos" value={totals.ivaCredit} />
      <FinancialRow label="IVA estimado a pagar" value={totals.ivaToPay} strong highlight />
      <Divider />
      <MiniBox title="Facturas registradas" value={invoiceExpenses.length} />
      <MiniBox title="Boletas / otros" value={nonInvoiceExpenses.length} />
      <MiniBox title="IVA no recuperado estimado" value={money(lostIVA)} />
    </Panel>
  )
}

function FoodCost() {
  return (
    <Panel title="🍔 Food Cost" subtitle="Costo de ingredientes por producto.">
      <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5">
        <h3 className="font-black text-xl">Próxima integración</h3>
        <p className="mt-2">
          Este módulo se conectará con recetas, inventario y productos para calcular el costo real
          de cada hamburguesa, combo, papas, alitas y bebida.
        </p>
      </div>
    </Panel>
  )
}

function AIAccounting({ totals, expenses }) {
  const messages = []

  if (totals.ivaToPay > 0) {
    messages.push(`El IVA estimado a pagar es ${money(totals.ivaToPay)}.`)
  }

  if (totals.profit < 0) {
    messages.push('La utilidad estimada está negativa. Revisa gastos y costos.')
  } else {
    messages.push(`La utilidad estimada del mes es ${money(totals.profit)}.`)
  }

  if (expenses.length === 0) {
    messages.push('Aún no hay gastos registrados. Sin gastos, la utilidad no es realista.')
  }

  return (
    <Panel title="🤖 Inteligencia Artificial Contable" subtitle="Lectura automática de la salud financiera.">
      <div className="space-y-3">
        {messages.map((message, index) => (
          <div key={index} className="bg-gray-50 border rounded-xl p-4 font-semibold">
            {message}
          </div>
        ))}
      </div>
    </Panel>
  )
}

function Projections({ totals }) {
  return (
    <Panel title="📈 Proyecciones" subtitle="Estimación simple del cierre mensual.">
      <MiniBox title="Ventas proyectadas" value={money(totals.projectedSales)} />
      <MiniBox title="IVA proyectado" value={money(totals.projectedIVA)} />
      <MiniBox title="Utilidad actual" value={money(totals.profit)} />
    </Panel>
  )
}

function BusinessControl({ totals }) {
  return (
    <Panel title="🎯 Centro de Control Empresarial" subtitle="Salud general del negocio.">
      <div className="bg-black text-white rounded-2xl p-6 mb-5">
        <p className="text-yellow-400 font-bold">SALUD DEL NEGOCIO</p>
        <h2 className="text-6xl font-black mt-2">{totals.businessHealth}/100</h2>
      </div>

      <Status label="Ventas" ok={totals.salesGross > 0} />
      <Status label="Utilidad" ok={totals.profit > 0} />
      <Status label="IVA controlado" ok={totals.ivaToPay >= 0} />
      <Status label="Gastos controlados" ok={totals.expensesGross < totals.salesGross} />
      <Status label="Food Cost" pending />
      <Status label="Inventario" pending />
    </Panel>
  )
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-3xl font-black">{title}</h2>
      <p className="text-gray-500 mb-6">{subtitle}</p>
      <div className="space-y-3">{children}</div>
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

function MiniBox({ title, value }) {
  return (
    <div className="bg-gray-50 rounded-xl border p-4">
      <p className="text-gray-500 font-bold">{title}</p>
      <h3 className="text-2xl font-black mt-1">{value}</h3>
    </div>
  )
}

function FinancialRow({ label, value, strong, negative, highlight }) {
  return (
    <div
      className={`flex justify-between items-center border-b py-3 ${
        highlight ? 'bg-yellow-50 px-4 rounded-xl border' : ''
      }`}
    >
      <span className={strong ? 'font-black' : 'font-semibold'}>{label}</span>
      <span
        className={`font-black ${
          negative ? 'text-red-600' : highlight ? 'text-green-700' : ''
        }`}
      >
        {negative ? '-' : ''}{money(value)}
      </span>
    </div>
  )
}

function Divider() {
  return <div className="border-t my-4" />
}

function Status({ label, ok, pending }) {
  return (
    <div className="flex justify-between items-center bg-gray-50 border rounded-xl p-4">
      <span className="font-black">{label}</span>
      <span className="font-black">
        {pending ? '🟡 Pendiente' : ok ? '🟢 Correcto' : '🔴 Revisar'}
      </span>
    </div>
  )
}

export default AccountingAssistant
