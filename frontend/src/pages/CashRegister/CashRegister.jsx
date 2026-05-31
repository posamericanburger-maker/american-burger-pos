import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL = import.meta.env.VITE_API_URL || 'https://american-burger-pos-api-d8r1.onrender.com/api'

const money = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

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

const paymentLabel = (method) => ({
  cash: 'Efectivo',
  debit: 'Débito',
  credit: 'Crédito',
  transfer: 'Transferencia'
}[method] || method || 'Sin medio')

const CashRegister = () => {
  const [sessions, setSessions] = useState([])
  const [movements, setMovements] = useState([])
  const [orders, setOrders] = useState([])
  const [cashClosings, setCashClosings] = useState([])
  const [openingAmount, setOpeningAmount] = useState('')

  const [closingAmounts, setClosingAmounts] = useState({
    cash: '',
    debit: '',
    credit: '',
    transfer: ''
  })

  const [movement, setMovement] = useState({
    type: 'expense',
    amount: '',
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
      const [sessionsResult, movementsResult, ordersResult] = await Promise.allSettled([
        request('/cash/sessions'),
        request('/cash/movements'),
        request('/orders')
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

      const savedClosings = JSON.parse(localStorage.getItem('cashClosings') || '[]')
      setCashClosings(savedClosings)
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
    return status === 'open' || status === 'abierta' || (!session.closed_at && !session.closedAt)
  })

  const sessionStart = activeSession?.opened_at || activeSession?.created_at || activeSession?.createdAt || null

  const sessionOrders = orders.filter((order) => {
    if (!activeSession || !sessionStart) return false

    const orderDate = new Date(order.created_at || order.createdAt || Date.now())
    const openDate = new Date(sessionStart)

    return orderDate >= openDate
  })

  const sessionMovements = movements.filter((item) => {
    if (!activeSession || !sessionStart) return false

    const movementDate = new Date(item.created_at || item.createdAt || Date.now())
    const openDate = new Date(sessionStart)

    return movementDate >= openDate
  })

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

  const expectedCash = opening + salesByPayment.cash + totalIncome - totalExpenses - totalWithdrawals
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

      await request('/cash/movements', {
        method: 'POST',
        body: JSON.stringify({
          type: movement.type,
          amount: Number(movement.amount || 0),
          description: movement.description.trim()
        })
      })

      setMovement({
        type: 'expense',
        amount: '',
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

  const printClosingReport = (closing) => {
    const diffText =
      Number(closing.difference || 0) > 0
        ? `SOBRANTE ${money(closing.difference)}`
        : Number(closing.difference || 0) < 0
          ? `FALTANTE ${money(Math.abs(closing.difference))}`
          : 'CAJA CUADRADA'

    const html = `
      <html>
        <head>
          <title>Cierre de Caja</title>
          <style>
            @page { size: 80mm auto; margin: 0; }

            body {
              width: 80mm;
              margin: 0;
              padding: 6mm 4mm;
              font-family: Arial, monospace;
              font-size: 12px;
              color: #000;
            }

            .center { text-align: center; }
            .brand { font-size: 22px; font-weight: 900; margin: 0; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; gap: 8px; margin: 5px 0; }
            .total { font-size: 16px; font-weight: 900; }
            .result { font-size: 18px; font-weight: 900; text-align: center; margin-top: 8px; }
          </style>
        </head>

        <body>
          <div class="center">
            <h1 class="brand">AMERICAN BURGER</h1>
            <div>CIERRE DE CAJA</div>
            <div>${new Date(closing.date).toLocaleString('es-CL')}</div>
          </div>

          <div class="line"></div>

          <div class="row"><span>Monto inicial</span><strong>${money(closing.opening)}</strong></div>

          <div class="line"></div>

          <div class="row"><span>Ventas efectivo</span><strong>${money(closing.sales_cash)}</strong></div>
          <div class="row"><span>Ventas débito</span><strong>${money(closing.sales_debit)}</strong></div>
          <div class="row"><span>Ventas crédito</span><strong>${money(closing.sales_credit)}</strong></div>
          <div class="row"><span>Ventas transferencia</span><strong>${money(closing.sales_transfer)}</strong></div>

          <div class="row total"><span>Total ventas</span><strong>${money(closing.total_sales)}</strong></div>

          <div class="line"></div>

          <div class="row"><span>Ingresos manuales</span><strong>${money(closing.income)}</strong></div>
          <div class="row"><span>Gastos</span><strong>${money(closing.expenses)}</strong></div>
          <div class="row"><span>Retiros</span><strong>${money(closing.withdrawals)}</strong></div>

          <div class="line"></div>

          <div class="row"><span>Esperado efectivo</span><strong>${money(closing.expected_cash)}</strong></div>
          <div class="row"><span>Real efectivo</span><strong>${money(closing.real_cash)}</strong></div>

          <div class="row"><span>Esperado débito</span><strong>${money(closing.expected_debit)}</strong></div>
          <div class="row"><span>Real débito</span><strong>${money(closing.real_debit)}</strong></div>

          <div class="row"><span>Esperado crédito</span><strong>${money(closing.expected_credit)}</strong></div>
          <div class="row"><span>Real crédito</span><strong>${money(closing.real_credit)}</strong></div>

          <div class="row"><span>Esperado transferencia</span><strong>${money(closing.expected_transfer)}</strong></div>
          <div class="row"><span>Real transferencia</span><strong>${money(closing.real_transfer)}</strong></div>

          <div class="line"></div>

          <div class="row total"><span>Esperado total</span><strong>${money(closing.expected_total)}</strong></div>
          <div class="row total"><span>Real total</span><strong>${money(closing.real_total)}</strong></div>

          <div class="line"></div>

          <div class="result">${diffText}</div>

          <div class="line"></div>

          <div class="center">American Burger</div>
        </body>
      </html>
    `

    const win = window.open('', '_blank')
    if (!win) return

    win.document.write(html)
    win.document.close()
    win.focus()

    setTimeout(() => {
      win.print()
    }, 500)
  }

  const closeCash = async () => {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (!activeSession) {
        throw new Error('No hay caja abierta')
      }

      const closingData = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        date: new Date().toISOString(),
        session_id: activeSession.id || '',
        opening,
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
      }

      await request('/cash/close', {
        method: 'POST',
        body: JSON.stringify({
          closing_amount: realTotal,
          final_amount: realTotal
        })
      })

      const updatedClosings = [closingData, ...cashClosings]
      setCashClosings(updatedClosings)
      localStorage.setItem('cashClosings', JSON.stringify(updatedClosings))

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

      printClosingReport(closingData)
      await loadCash()
    } catch (err) {
      setError(err.message || 'No se pudo cerrar caja')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Gestión de Caja" />

        <div className="main-content space-y-4">
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

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
              <h2 className="text-xl font-bold text-red-600">{money(totalExpenses + totalWithdrawals)}</h2>
            </div>

            <div className="card p-4">
              <p className="text-gray-500 text-sm">Esperado total</p>
              <h2 className="text-xl font-bold">{money(expectedTotal)}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
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

              <div className="border-t mt-4 pt-4">
                <h2 className="text-xl font-bold mb-3">Cerrar caja</h2>

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

                <div className="mt-3 border rounded-lg p-3">
                  <div className="flex justify-between">
                    <span>Esperado</span>
                    <strong>{money(expectedTotal)}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Real</span>
                    <strong>{money(realTotal)}</strong>
                  </div>

                  <div className={`flex justify-between font-bold ${difference < 0 ? 'text-red-600' : difference > 0 ? 'text-green-600' : ''}`}>
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
                  Cerrar caja e imprimir cierre
                </button>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold mb-3">Registrar movimiento</h2>

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
                  className="input min-h-[80px]"
                  value={movement.description}
                  onChange={(event) =>
                    setMovement((current) => ({
                      ...current,
                      description: event.target.value
                    }))
                  }
                  placeholder="Descripción"
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

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Historial de cierres</h2>

              <button
                type="button"
                onClick={loadCash}
                className="border px-4 py-2 rounded-lg"
              >
                Actualizar
              </button>
            </div>

            {cashClosings.length === 0 ? (
              <div className="text-center text-gray-500 py-6">
                No hay cierres registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="py-3">Fecha</th>
                      <th>Ventas</th>
                      <th>Esperado</th>
                      <th>Real</th>
                      <th>Diferencia</th>
                      <th className="text-right">Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cashClosings.map((closing) => (
                      <tr key={closing.id} className="border-b">
                        <td className="py-3">{new Date(closing.date).toLocaleString('es-CL')}</td>
                        <td>{money(closing.total_sales)}</td>
                        <td>{money(closing.expected_total)}</td>
                        <td>{money(closing.real_total)}</td>
                        <td className={closing.difference < 0 ? 'text-red-600 font-bold' : closing.difference > 0 ? 'text-green-600 font-bold' : 'font-bold'}>
                          {money(closing.difference)}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => printClosingReport(closing)}
                            className="bg-black text-yellow-400 px-3 py-2 rounded font-bold"
                          >
                            Imprimir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Movimientos de caja</h2>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando caja...</div>
            ) : sessionMovements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hay movimientos registrados.</div>
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
                        <td className="py-3">{new Date(item.created_at || Date.now()).toLocaleString('es-CL')}</td>
                        <td>{item.type}</td>
                        <td>{item.description || item.notes || 'Sin descripción'}</td>
                        <td className="text-right font-bold">{money(item.amount)}</td>
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

export default CashRegister
