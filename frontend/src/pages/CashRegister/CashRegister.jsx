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

const getToken = () => {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    ''
  )
}

const getList = (data, keys = []) => {
  if (Array.isArray(data)) return data
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  return []
}

const CashRegister = () => {
  const [sessions, setSessions] = useState([])
  const [movements, setMovements] = useState([])
  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
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
      const [sessionsResult, movementsResult] = await Promise.allSettled([
        request('/cash/sessions'),
        request('/cash/movements')
      ])

      if (sessionsResult.status === 'fulfilled') {
        setSessions(getList(sessionsResult.value, ['sessions', 'cash_sessions']))
      }

      if (movementsResult.status === 'fulfilled') {
        setMovements(getList(movementsResult.value, ['movements', 'cash_movements']))
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
    return status === 'open' || status === 'abierta' || (!session.closed_at && !session.closedAt)
  })

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
      await request('/cash/close', {
        method: 'POST',
        body: JSON.stringify({
          closing_amount: Number(closingAmount || 0),
          final_amount: Number(closingAmount || 0)
        })
      })

      setClosingAmount('')
      setMessage('Caja cerrada correctamente')
      await loadCash()
    } catch (err) {
      setError(err.message || 'No se pudo cerrar caja')
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

  const totalIncome = movements
    .filter((item) => ['income', 'sale', 'venta', 'ingreso'].includes(String(item.type || '').toLowerCase()))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const totalExpenses = movements
    .filter((item) => ['expense', 'egreso', 'retiro', 'withdrawal'].includes(String(item.type || '').toLowerCase()))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const expectedCash =
    Number(activeSession?.opening_amount || activeSession?.initial_amount || 0) +
    totalIncome -
    totalExpenses

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Gestión de Caja" />

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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-gray-500">Estado</p>
              <h2 className={`text-2xl font-bold ${activeSession ? 'text-green-600' : 'text-red-600'}`}>
                {activeSession ? 'Caja abierta' : 'Caja cerrada'}
              </h2>
            </div>

            <div className="card">
              <p className="text-gray-500">Monto inicial</p>
              <h2 className="text-2xl font-bold">
                {money(activeSession?.opening_amount || activeSession?.initial_amount || 0)}
              </h2>
            </div>

            <div className="card">
              <p className="text-gray-500">Ingresos</p>
              <h2 className="text-2xl font-bold text-green-600">
                {money(totalIncome)}
              </h2>
            </div>

            <div className="card">
              <p className="text-gray-500">Caja esperada</p>
              <h2 className="text-2xl font-bold">
                {money(expectedCash)}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="text-2xl font-poppins font-bold mb-4">
                Abrir / cerrar caja
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="label">Monto inicial</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={openingAmount}
                    onChange={(event) => setOpeningAmount(event.target.value)}
                    placeholder="Ej: 50000"
                  />
                </div>

                <button
                  type="button"
                  disabled={saving || Boolean(activeSession)}
                  onClick={openCash}
                  className="w-full bg-black text-yellow-400 font-poppins font-bold py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50"
                >
                  Abrir caja
                </button>

                <div>
                  <label className="label">Monto cierre real</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={closingAmount}
                    onChange={(event) => setClosingAmount(event.target.value)}
                    placeholder="Ej: 125000"
                  />
                </div>

                <button
                  type="button"
                  disabled={saving || !activeSession}
                  onClick={closeCash}
                  className="w-full border border-gray-300 font-bold py-3 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Cerrar caja
                </button>
              </div>
            </div>

            <div className="card">
              <h2 className="text-2xl font-poppins font-bold mb-4">
                Registrar movimiento
              </h2>

              <form onSubmit={saveMovement} className="space-y-4">
                <div>
                  <label className="label">Tipo</label>
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
                    <option value="income">Ingreso</option>
                    <option value="expense">Egreso / gasto</option>
                    <option value="withdrawal">Retiro</option>
                  </select>
                </div>

                <div>
                  <label className="label">Monto</label>
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
                    placeholder="Ej: 10000"
                  />
                </div>

                <div>
                  <label className="label">Descripción</label>
                  <textarea
                    className="input min-h-[90px]"
                    value={movement.description}
                    onChange={(event) =>
                      setMovement((current) => ({
                        ...current,
                        description: event.target.value
                      }))
                    }
                    placeholder="Ej: Compra de insumos"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-black text-yellow-400 font-poppins font-bold py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50"
                >
                  Registrar movimiento
                </button>
              </form>
            </div>

            <div className="card">
              <h2 className="text-2xl font-poppins font-bold mb-4">
                Resumen de caja
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span>Inicial</span>
                  <strong>{money(activeSession?.opening_amount || activeSession?.initial_amount || 0)}</strong>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span>Ingresos</span>
                  <strong className="text-green-600">{money(totalIncome)}</strong>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span>Egresos</span>
                  <strong className="text-red-600">{money(totalExpenses)}</strong>
                </div>

                <div className="flex justify-between text-xl font-bold">
                  <span>Esperado</span>
                  <span>{money(expectedCash)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-poppins font-bold">
                  Movimientos de caja
                </h2>
                <p className="text-gray-600">
                  Entradas, salidas y retiros registrados.
                </p>
              </div>

              <button
                type="button"
                onClick={loadCash}
                className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Actualizar
              </button>
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-500">
                Cargando caja...
              </div>
            ) : movements.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No hay movimientos registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-sm text-gray-500">
                      <th className="py-3 pr-4">Fecha</th>
                      <th className="py-3 pr-4">Tipo</th>
                      <th className="py-3 pr-4">Descripción</th>
                      <th className="py-3 pr-4 text-right">Monto</th>
                    </tr>
                  </thead>

                  <tbody>
                    {movements.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 pr-4">
                          {new Date(item.created_at || Date.now()).toLocaleString('es-CL')}
                        </td>

                        <td className="py-4 pr-4">
                          {item.type || 'Movimiento'}
                        </td>

                        <td className="py-4 pr-4">
                          {item.description || item.notes || 'Sin descripción'}
                        </td>

                        <td className="py-4 pr-4 text-right font-bold">
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
      </div>
    </div>
  )
}

export default CashRegister
