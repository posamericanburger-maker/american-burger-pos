import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://american-burger-pos-api-d8r1.onrender.com/api'

const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const getToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('authToken') ||
  localStorage.getItem('access_token') ||
  ''

const getList = (data, keys = []) => {
  if (Array.isArray(data)) return data

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
  }

  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items

  return []
}

const typeLabel = (type) =>
  ({
    income: 'Ingreso',
    expense: 'Gasto',
    withdrawal: 'Retiro',
    ingreso: 'Ingreso',
    gasto: 'Gasto',
    egreso: 'Gasto',
    retiro: 'Retiro'
  }[type] || type || 'Movimiento')

const CashRegister = () => {
  const [activeTab, setActiveTab] = useState('caja')
  const [sessions, setSessions] = useState([])
  const [movements, setMovements] = useState([])
  const [orders, setOrders] = useState([])
  const [openingAmount, setOpeningAmount] = useState('')

  const [suppliers, setSuppliers] = useState([])

  const [supplierForm, setSupplierForm] = useState({
    id: '',
    name: '',
    rut: '',
    phone: '',
    note: ''
  })

  const [closingAmounts, setClosingAmounts] = useState({
    cash: '',
    debit: '',
    credit: '',
    transfer: ''
  })

  const [movement, setMovement] = useState({
    type: 'expense',
    amount: '',
    supplierId: '',
    documentNumber: '',
    description: ''
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const headers = useMemo(() => {
    const token = getToken()

    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }, [])

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...headers,
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

  const loadCash = async () => {
    setLoading(true)
    setError('')

    try {
      const [sessionsResult, movementsResult, ordersResult, suppliersResult] =
        await Promise.allSettled([
          request('/cash/sessions'),
          request('/cash/movements'),
          request('/orders'),
          request('/suppliers')
        ])

      if (sessionsResult.status === 'fulfilled') {
        setSessions(getList(sessionsResult.value, ['sessions', 'cash_sessions']))
      }

      if (movementsResult.status === 'fulfilled') {
        setMovements(getList(movementsResult.value, ['movements', 'cash_movements']))
      }

      if (ordersResult.status === 'fulfilled') {
        setOrders(getList(ordersResult.value, ['orders']))
      }

      if (suppliersResult.status === 'fulfilled') {
        setSuppliers(getList(suppliersResult.value, ['suppliers']))
      } else {
        setSuppliers(JSON.parse(localStorage.getItem('cashSuppliers') || '[]'))
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar caja')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCash()
  }, [])

  const activeSession = sessions.find((session) => {
    const status = String(session.status || '').toLowerCase()

    return (
      status === 'open' ||
      status === 'abierta' ||
      (!session.closed_at && !session.closedAt)
    )
  })

  const sessionStart =
    activeSession?.opened_at ||
    activeSession?.created_at ||
    activeSession?.createdAt ||
    null

  const sessionOrders = orders.filter((order) => {
    if (!activeSession || !sessionStart) return false

    const orderDate = new Date(order.created_at || order.createdAt || Date.now())
    const openDate = new Date(sessionStart)

    return orderDate >= openDate
  })

  const sessionMovements = movements.filter(
    (item) => item.cash_session_id === activeSession?.id
  )

  const closedSessions = sessions.filter((session) => {
    const status = String(session.status || '').toLowerCase()
    return status === 'closed' || status === 'cerrada' || Boolean(session.closed_at)
  })

  const expenseRecords = movements.filter((item) =>
    ['expense', 'egreso', 'gasto'].includes(String(item.type || '').toLowerCase())
  )

  const opening = Number(activeSession?.opening_amount || activeSession?.initial_amount || 0)

  const salesByPayment = sessionOrders.reduce(
    (acc, order) => {
      const method = order.payment_method || 'cash'
      const total = Number(order.total || order.total_amount || 0)

      if (method === 'cash') acc.cash += total
      if (method === 'debit') acc.debit += total
      if (method === 'credit') acc.credit += total
      if (method === 'transfer') acc.transfer += total

      return acc
    },
    { cash: 0, debit: 0, credit: 0, transfer: 0 }
  )

  const totalSales =
    salesByPayment.cash +
    salesByPayment.debit +
    salesByPayment.credit +
    salesByPayment.transfer

  const totalIncome = sessionMovements
    .filter((item) => ['income', 'ingreso'].includes(String(item.type || '').toLowerCase()))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const totalExpenses = sessionMovements
    .filter((item) => ['expense', 'egreso', 'gasto'].includes(String(item.type || '').toLowerCase()))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const totalWithdrawals = sessionMovements
    .filter((item) => ['withdrawal', 'retiro'].includes(String(item.type || '').toLowerCase()))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const expectedCash =
    opening +
    salesByPayment.cash +
    totalIncome -
    totalExpenses -
    totalWithdrawals

  const expectedDebit = salesByPayment.debit
  const expectedCredit = salesByPayment.credit
  const expectedTransfer = salesByPayment.transfer

  const expectedTotal =
    expectedCash +
    expectedDebit +
    expectedCredit +
    expectedTransfer

  const realCash = Number(closingAmounts.cash || 0)
  const realDebit = Number(closingAmounts.debit || 0)
  const realCredit = Number(closingAmounts.credit || 0)
  const realTransfer = Number(closingAmounts.transfer || 0)

  const realTotal = realCash + realDebit + realCredit + realTransfer
  const difference = realTotal - expectedTotal

  const openCash = async () => {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await request('/cash/open', {
        method: 'POST',
        body: JSON.stringify({
          opening_amount: Number(openingAmount || 0),
          initial_amount: Number(openingAmount || 0)
        })
      })

      setOpeningAmount('')
      setMessage('Caja abierta correctamente')
      await loadCash()
    } catch (err) {
      setError(err.message || 'No se pudo abrir caja')
    } finally {
      setSaving(false)
    }
  }

  const closeCash = async () => {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (!activeSession) {
        throw new Error('No hay caja abierta')
      }

      await request('/cash/close', {
        method: 'POST',
        body: JSON.stringify({
          closing_amount: realTotal,
          final_amount: realTotal,
          sales_cash: salesByPayment.cash,
          sales_debit: salesByPayment.debit,
          sales_credit: salesByPayment.credit,
          sales_transfer: salesByPayment.transfer,
          total_sales: totalSales,
          income: totalIncome,
          expenses: totalExpenses,
          withdrawals: totalWithdrawals,
          expected_cash: expectedCash,
          expected_debit: expectedDebit,
          expected_credit: expectedCredit,
          expected_transfer: expectedTransfer,
          expected_total: expectedTotal,
          real_cash: realCash,
          real_debit: realDebit,
          real_credit: realCredit,
          real_transfer: realTransfer,
          real_total: realTotal,
          difference
        })
      })

      setClosingAmounts({
        cash: '',
        debit: '',
        credit: '',
        transfer: ''
      })

      setMessage(
        difference > 0
          ? `Caja cerrada con sobrante de ${money(difference)}`
          : difference < 0
            ? `Caja cerrada con faltante de ${money(Math.abs(difference))}`
            : 'Caja cerrada correctamente. Caja cuadrada.'
      )

      await loadCash()
    } catch (err) {
      setError(err.message || 'No se pudo cerrar caja')
    } finally {
      setSaving(false)
    }
  }

  const saveSupplier = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (!supplierForm.name.trim()) {
        throw new Error('Ingresa el nombre del proveedor')
      }

      const body = {
        name: supplierForm.name.trim(),
        rut: supplierForm.rut.trim(),
        phone: supplierForm.phone.trim(),
        note: supplierForm.note.trim()
      }

      if (supplierForm.id) {
        await request(`/suppliers/${supplierForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        })

        setMessage('Proveedor actualizado correctamente')
      } else {
        await request('/suppliers', {
          method: 'POST',
          body: JSON.stringify(body)
        })

        setMessage('Proveedor agregado correctamente')
      }

      setSupplierForm({
        id: '',
        name: '',
        rut: '',
        phone: '',
        note: ''
      })

      await loadCash()
    } catch (err) {
      setError(err.message || 'No se pudo guardar el proveedor')
    } finally {
      setSaving(false)
    }
  }

  const editSupplier = (supplier) => {
    setSupplierForm({
      id: supplier.id,
      name: supplier.name || '',
      rut: supplier.rut || '',
      phone: supplier.phone || '',
      note: supplier.note || ''
    })

    setActiveTab('proveedores')
  }

  const deleteSupplier = async (supplierId) => {
    const confirmDelete = window.confirm('¿Eliminar este proveedor?')
    if (!confirmDelete) return

    setSaving(true)
    setError('')
    setMessage('')

    try {
      await request(`/suppliers/${supplierId}`, {
        method: 'DELETE'
      })

      if (movement.supplierId === supplierId) {
        setMovement((current) => ({ ...current, supplierId: '' }))
      }

      setMessage('Proveedor eliminado')
      await loadCash()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el proveedor')
    } finally {
      setSaving(false)
    }
  }

  const saveMovement = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (!activeSession) {
        throw new Error('Debes abrir caja antes de registrar movimientos')
      }

      if (!movement.amount || Number(movement.amount) <= 0) {
        throw new Error('El monto debe ser mayor a 0')
      }

      const selectedSupplier = suppliers.find(
        (supplier) => supplier.id === movement.supplierId
      )

      const supplierText = selectedSupplier
        ? `Proveedor: ${selectedSupplier.name}${selectedSupplier.rut ? ` | RUT: ${selectedSupplier.rut}` : ''}${selectedSupplier.phone ? ` | Tel: ${selectedSupplier.phone}` : ''}`
        : ''

      const documentText = movement.documentNumber.trim()
        ? `Documento: ${movement.documentNumber.trim()}`
        : ''

      const finalDescription = [
        documentText,
        supplierText,
        movement.description.trim()
      ]
        .filter(Boolean)
        .join(' - ')

      await request('/cash/movements', {
        method: 'POST',
        body: JSON.stringify({
          type: movement.type,
          amount: Number(movement.amount || 0),
          description: finalDescription || 'Movimiento sin descripción'
        })
      })

      setMovement({
        type: 'expense',
        amount: '',
        supplierId: '',
        documentNumber: '',
        description: ''
      })

      setMessage('Movimiento registrado correctamente')
      await loadCash()
    } catch (err) {
      setError(err.message || 'No se pudo registrar movimiento')
    } finally {
      setSaving(false)
    }
  }

  const exportExpensesExcel = () => {
    const rows = expenseRecords.map((item) => ({
      Fecha: new Date(item.created_at).toLocaleDateString('es-CL'),
      Hora: new Date(item.created_at).toLocaleTimeString('es-CL'),
      Tipo: typeLabel(item.type),
      Monto: Number(item.amount || 0),
      Descripcion: item.description || item.reason || '',
      SesionCaja: item.cash_session_id || ''
    }))

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(rows)

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    })

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    saveAs(blob, `Gastos_American_Burger_${Date.now()}.xlsx`)
  }

  const tabs = [
    { id: 'caja', label: 'Caja', icon: '💰' },
    { id: 'gastos', label: 'Gastos', icon: '🧾' },
    { id: 'proveedores', label: 'Proveedores', icon: '🚚' },
    { id: 'cierres', label: 'Cierres', icon: '📋' },
    { id: 'movimientos', label: 'Movimientos', icon: '📊' }
  ]

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Gestión de Caja" />

        <div className="main-content space-y-5">
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

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="card p-4">
              <p className="text-gray-500 text-sm">Estado</p>
              <h2 className={`text-xl font-bold ${activeSession ? 'text-green-600' : 'text-red-600'}`}>
                {activeSession ? 'Abierta' : 'Cerrada'}
              </h2>
            </div>

            <div className="card p-4">
              <p className="text-gray-500 text-sm">Inicial</p>
              <h2 className="text-xl font-bold">{money(opening)}</h2>
            </div>

            <div className="card p-4">
              <p className="text-gray-500 text-sm">Ventas</p>
              <h2 className="text-xl font-bold text-green-600">{money(totalSales)}</h2>
            </div>

            <div className="card p-4">
              <p className="text-gray-500 text-sm">Gastos/Retiros</p>
              <h2 className="text-xl font-bold text-red-600">
                {money(totalExpenses + totalWithdrawals)}
              </h2>
            </div>

            <div className="card p-4">
              <p className="text-gray-500 text-sm">Esperado total</p>
              <h2 className="text-xl font-bold">{money(expectedTotal)}</h2>
            </div>
          </div>

          <div className="card p-3">
            <div className="flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 rounded-xl font-bold border transition-all ${
                    activeTab === tab.id
                      ? 'bg-black text-yellow-400 border-black shadow-md'
                      : 'bg-yellow-50 text-black border-yellow-300 hover:bg-yellow-100'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'caja' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="card">
                <h2 className="text-xl font-bold mb-3">Abrir caja</h2>

                <label className="label">Monto inicial efectivo</label>
                <input
                  type="number"
                  min="0"
                  className="input mb-3"
                  value={openingAmount}
                  onChange={(event) => setOpeningAmount(event.target.value)}
                  placeholder="Ej: 50000"
                />

                <button
                  type="button"
                  disabled={saving || Boolean(activeSession)}
                  onClick={openCash}
                  className="w-full bg-black text-yellow-400 font-bold py-3 rounded-lg disabled:opacity-50"
                >
                  Abrir caja
                </button>

                <div className="border-t mt-5 pt-5">
                  <h3 className="text-lg font-bold mb-3">Cerrar caja</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Efectivo real</label>
                      <input
                        type="number"
                        className="input"
                        value={closingAmounts.cash}
                        onChange={(e) =>
                          setClosingAmounts({ ...closingAmounts, cash: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="label">Débito real</label>
                      <input
                        type="number"
                        className="input"
                        value={closingAmounts.debit}
                        onChange={(e) =>
                          setClosingAmounts({ ...closingAmounts, debit: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="label">Crédito real</label>
                      <input
                        type="number"
                        className="input"
                        value={closingAmounts.credit}
                        onChange={(e) =>
                          setClosingAmounts({ ...closingAmounts, credit: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="label">Transferencia real</label>
                      <input
                        type="number"
                        className="input"
                        value={closingAmounts.transfer}
                        onChange={(e) =>
                          setClosingAmounts({ ...closingAmounts, transfer: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-3 border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between">
                      <span>Esperado</span>
                      <strong>{money(expectedTotal)}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span>Real</span>
                      <strong>{money(realTotal)}</strong>
                    </div>

                    <div className={`flex justify-between font-bold ${
                      difference < 0
                        ? 'text-red-600'
                        : difference > 0
                          ? 'text-green-600'
                          : ''
                    }`}>
                      <span>Diferencia</span>
                      <strong>{money(difference)}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={saving || !activeSession}
                    onClick={closeCash}
                    className="w-full mt-3 bg-red-600 text-white font-bold py-3 rounded-lg disabled:opacity-50"
                  >
                    Cerrar caja
                  </button>
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-bold mb-3">Resumen actual</h2>

                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-1">
                    <span>Inicial</span>
                    <strong>{money(opening)}</strong>
                  </div>

                  <div className="flex justify-between border-b pb-1">
                    <span>Ventas efectivo</span>
                    <strong>{money(salesByPayment.cash)}</strong>
                  </div>

                  <div className="flex justify-between border-b pb-1">
                    <span>Ventas débito</span>
                    <strong>{money(salesByPayment.debit)}</strong>
                  </div>

                  <div className="flex justify-between border-b pb-1">
                    <span>Ventas crédito</span>
                    <strong>{money(salesByPayment.credit)}</strong>
                  </div>

                  <div className="flex justify-between border-b pb-1">
                    <span>Ventas transferencia</span>
                    <strong>{money(salesByPayment.transfer)}</strong>
                  </div>

                  <div className="flex justify-between border-b pb-1 text-red-600">
                    <span>Gastos</span>
                    <strong>{money(totalExpenses)}</strong>
                  </div>

                  <div className="flex justify-between border-b pb-1 text-red-600">
                    <span>Retiros</span>
                    <strong>{money(totalWithdrawals)}</strong>
                  </div>

                  <div className="flex justify-between text-xl font-bold pt-2">
                    <span>Esperado</span>
                    <span>{money(expectedTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gastos' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="card">
                <h2 className="text-xl font-bold mb-3">Registrar gasto / movimiento</h2>

                <form onSubmit={saveMovement} className="space-y-3">
                  <select
                    className="input"
                    value={movement.type}
                    onChange={(event) =>
                      setMovement((current) => ({
                        ...current,
                        type: event.target.value
                      }))
                    }
                  >
                    <option value="income">Ingreso manual</option>
                    <option value="expense">Gasto</option>
                    <option value="withdrawal">Retiro</option>
                  </select>

                  <select
                    className="input"
                    value={movement.supplierId}
                    onChange={(event) =>
                      setMovement((current) => ({
                        ...current,
                        supplierId: event.target.value
                      }))
                    }
                  >
                    <option value="">Sin proveedor</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>

                  <input
                    className="input"
                    value={movement.documentNumber}
                    onChange={(event) =>
                      setMovement((current) => ({
                        ...current,
                        documentNumber: event.target.value
                      }))
                    }
                    placeholder="N° factura o boleta"
                  />

                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={movement.amount}
                    onChange={(event) =>
                      setMovement((current) => ({
                        ...current,
                        amount: event.target.value
                      }))
                    }
                    placeholder="Monto"
                  />

                  <textarea
                    className="input min-h-[90px]"
                    value={movement.description}
                    onChange={(event) =>
                      setMovement((current) => ({
                        ...current,
                        description: event.target.value
                      }))
                    }
                    placeholder="Descripción del gasto o movimiento"
                  />

                  <button
                    type="submit"
                    disabled={saving || !activeSession}
                    className="w-full bg-black text-yellow-400 font-bold py-3 rounded-lg disabled:opacity-50"
                  >
                    Registrar movimiento
                  </button>
                </form>
              </div>

              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Gastos guardados en Supabase</h2>

                  <button
                    type="button"
                    onClick={exportExpensesExcel}
                    disabled={expenseRecords.length === 0}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50"
                  >
                    Descargar Excel
                  </button>
                </div>

                {expenseRecords.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">
                    No hay gastos guardados.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-y-auto">
                    {expenseRecords.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-bold">
                              {item.description || item.reason || 'Gasto sin descripción'}
                            </p>

                            <p className="text-xs text-gray-500">
                              {new Date(item.created_at).toLocaleString('es-CL')}
                            </p>

                            <p className="text-sm text-gray-500">
                              Sesión: {item.cash_session_id || 'Sin sesión'}
                            </p>
                          </div>

                          <div className="text-right">
                            <strong className="text-red-600 text-lg">
                              {money(item.amount)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'proveedores' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="card">
                <h2 className="text-xl font-bold mb-3">
                  {supplierForm.id ? 'Editar proveedor' : 'Agregar proveedor'}
                </h2>

                <form onSubmit={saveSupplier} className="space-y-3">
                  <input
                    className="input"
                    value={supplierForm.name}
                    onChange={(event) =>
                      setSupplierForm({ ...supplierForm, name: event.target.value })
                    }
                    placeholder="Nombre proveedor"
                  />

                  <input
                    className="input"
                    value={supplierForm.rut}
                    onChange={(event) =>
                      setSupplierForm({ ...supplierForm, rut: event.target.value })
                    }
                    placeholder="RUT proveedor"
                  />

                  <input
                    className="input"
                    value={supplierForm.phone}
                    onChange={(event) =>
                      setSupplierForm({ ...supplierForm, phone: event.target.value })
                    }
                    placeholder="Teléfono / WhatsApp"
                  />

                  <textarea
                    className="input min-h-[70px]"
                    value={supplierForm.note}
                    onChange={(event) =>
                      setSupplierForm({ ...supplierForm, note: event.target.value })
                    }
                    placeholder="Nota"
                  />

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-yellow-400 text-black font-bold py-3 rounded-lg disabled:opacity-50"
                  >
                    {supplierForm.id ? 'Guardar cambios' : 'Agregar proveedor'}
                  </button>

                  {supplierForm.id && (
                    <button
                      type="button"
                      onClick={() =>
                        setSupplierForm({
                          id: '',
                          name: '',
                          rut: '',
                          phone: '',
                          note: ''
                        })
                      }
                      className="w-full border py-3 rounded-lg"
                    >
                      Cancelar edición
                    </button>
                  )}
                </form>
              </div>

              <div className="card">
                <h2 className="text-xl font-bold mb-3">Proveedores</h2>

                {suppliers.length === 0 ? (
                  <p className="text-gray-500">No hay proveedores guardados.</p>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-y-auto">
                    {suppliers.map((supplier) => (
                      <div key={supplier.id} className="border rounded-lg p-4 bg-gray-50">
                        <p className="font-bold">{supplier.name}</p>

                        {supplier.rut && (
                          <p className="text-sm text-gray-500">RUT: {supplier.rut}</p>
                        )}

                        {supplier.phone && (
                          <p className="text-sm text-gray-500">Tel: {supplier.phone}</p>
                        )}

                        {supplier.note && (
                          <p className="text-sm text-gray-500">{supplier.note}</p>
                        )}

                        <div className="flex gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => editSupplier(supplier)}
                            className="bg-black text-yellow-400 px-3 py-2 rounded font-bold text-sm"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteSupplier(supplier.id)}
                            className="bg-red-600 text-white px-3 py-2 rounded font-bold text-sm"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cierres' && (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Historial de cierres desde Supabase</h2>

                <button
                  type="button"
                  onClick={loadCash}
                  className="border px-4 py-2 rounded-lg"
                >
                  Actualizar
                </button>
              </div>

              {closedSessions.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  No hay cierres registrados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b text-gray-500">
                        <th className="py-3">Apertura</th>
                        <th>Cierre</th>
                        <th>Inicial</th>
                        <th>Final</th>
                        <th>Diferencia</th>
                      </tr>
                    </thead>

                    <tbody>
                      {closedSessions.map((session) => (
                        <tr key={session.id} className="border-b">
                          <td className="py-3">
                            {new Date(session.opened_at || session.created_at).toLocaleString('es-CL')}
                          </td>
                          <td>
                            {session.closed_at
                              ? new Date(session.closed_at).toLocaleString('es-CL')
                              : '-'}
                          </td>
                          <td>{money(session.opening_amount || session.initial_amount || 0)}</td>
                          <td>{money(session.closing_amount || session.final_amount || 0)}</td>
                          <td
                            className={
                              Number(session.difference || 0) < 0
                                ? 'text-red-600 font-bold'
                                : Number(session.difference || 0) > 0
                                  ? 'text-green-600 font-bold'
                                  : 'font-bold'
                            }
                          >
                            {money(session.difference || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'movimientos' && (
            <div className="space-y-5">
              <div className="card">
                <h2 className="text-xl font-bold mb-4">Movimientos de caja actual</h2>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    Cargando caja...
                  </div>
                ) : sessionMovements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay movimientos registrados en la caja actual.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b text-gray-500">
                          <th className="py-3">Fecha</th>
                          <th>Tipo</th>
                          <th>Descripción</th>
                          <th className="text-right">Monto</th>
                        </tr>
                      </thead>

                      <tbody>
                        {sessionMovements.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-3">
                              {new Date(item.created_at || Date.now()).toLocaleString('es-CL')}
                            </td>
                            <td>{typeLabel(item.type)}</td>
                            <td>{item.description || item.reason || item.notes || 'Sin descripción'}</td>
                            <td className="text-right font-bold">
                              {money(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="card">
                <h2 className="text-xl font-bold mb-4">Historial de movimientos</h2>

                {movements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay movimientos históricos.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b text-gray-500">
                          <th className="py-3">Fecha</th>
                          <th>Tipo</th>
                          <th>Descripción</th>
                          <th>Sesión</th>
                          <th className="text-right">Monto</th>
                        </tr>
                      </thead>

                      <tbody>
                        {movements.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-3">
                              {new Date(item.created_at || Date.now()).toLocaleString('es-CL')}
                            </td>
                            <td>{typeLabel(item.type)}</td>
                            <td>{item.description || item.reason || item.notes || 'Sin descripción'}</td>
                            <td className="text-xs">{item.cash_session_id || '-'}</td>
                            <td className="text-right font-bold">
                              {money(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CashRegister
