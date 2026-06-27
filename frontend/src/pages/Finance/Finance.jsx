import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import { financeService } from '../../services/financeService'

const defaultCosts = [
  'Sueldos',
  'Cotizaciones',
  'Arriendo',
  'Electricidad',
  'Agua',
  'Gas',
  'Internet',
  'Patente municipal',
  'Publicidad',
  'Contador',
  'Mantención Food Truck',
  'Limpieza',
  'Otros gastos'
]

const money = (value) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const percent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`

const currentMonth = () => new Date().toISOString().slice(0, 7)

const Finance = () => {
  const [month, setMonth] = useState(currentMonth())
  const [summary, setSummary] = useState(null)
  const [fixedCosts, setFixedCosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const data = await financeService.getSummary(month)
      setSummary(data)

      const costs = data.fixedCosts || []

      if (costs.length > 0) {
        setFixedCosts(costs)
      } else {
        setFixedCosts(
          defaultCosts.map((concept) => ({
            concept,
            amount: 0,
            notes: ''
          }))
        )
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar Finanzas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [month])

  const totals = summary?.summary || {}

  const statusData = useMemo(() => {
    if (totals.status === 'SOBRE EQUILIBRIO') {
      return {
        text: 'SOBRE EQUILIBRIO',
        color: 'text-green-600',
        border: 'border-green-500',
        bg: 'bg-green-100'
      }
    }

    if (totals.status === 'CERCA DEL EQUILIBRIO') {
      return {
        text: 'CERCA DEL EQUILIBRIO',
        color: 'text-yellow-600',
        border: 'border-yellow-400',
        bg: 'bg-yellow-100'
      }
    }

    return {
      text: totals.status || 'SIN DATOS',
      color: 'text-red-600',
      border: 'border-red-600',
      bg: 'bg-red-100'
    }
  }, [totals.status])

  const updateCost = (index, field, value) => {
    setFixedCosts((current) => {
      const copy = [...current]

      copy[index] = {
        ...copy[index],
        [field]: field === 'amount' ? Number(value || 0) : value
      }

      return copy
    })
  }

  const addCost = () => {
    setFixedCosts((current) => [
      ...current,
      {
        concept: '',
        amount: 0,
        notes: ''
      }
    ])
  }

  const saveCosts = async () => {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await financeService.saveFixedCosts(month, fixedCosts)
      setMessage('Costos fijos guardados correctamente')
      await loadData()
    } catch (err) {
      setError(err.message || 'No se pudieron guardar los costos fijos')
    } finally {
      setSaving(false)
    }
  }

  const downloadExcel = () => {
    window.open(financeService.exportExcelUrl(month), '_blank')
  }

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Finanzas" />

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

          <div className="bg-black text-white rounded-2xl shadow-lg p-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <p className="text-yellow-400 font-bold tracking-wide">
                AMERICAN BURGER POS
              </p>

              <h1 className="text-3xl font-black mt-1">
                📊 Finanzas
              </h1>

              <p className="text-gray-300 mt-1">
                Punto de equilibrio, IVA, costos fijos, rentabilidad y respaldo Excel.
              </p>
            </div>

            <div className={`px-5 py-3 rounded-xl font-black text-lg ${statusData.bg} ${statusData.color}`}>
              {statusData.text}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col xl:flex-row xl:items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="font-black">Mes:</label>

              <input
                type="month"
                className="input max-w-[220px]"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              />
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-bold disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>

            <button
              onClick={downloadExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-bold"
            >
              📥 Descargar respaldo Excel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <Kpi title="Ventas del mes" value={money(totals.totalSales)} border="border-yellow-400" />
            <Kpi title="Venta neta" value={money(totals.netSales)} border="border-black" />
            <Kpi title="IVA estimado" value={money(totals.ivaToPayEstimated)} border="border-blue-500" />
            <Kpi title="Costo variable" value={money(totals.totalVariableCost)} border="border-orange-500" />
            <Kpi title="Costos fijos" value={money(totals.totalFixedCosts)} border="border-red-500" />
            <Kpi title="Utilidad operativa" value={money(totals.operatingProfit)} border="border-green-500" />
            <Kpi title="Margen promedio" value={percent(totals.averageMargin)} border="border-purple-500" />
            <Kpi title="Punto equilibrio" value={money(totals.breakEvenMonthly)} border="border-gray-500" />
          </div>

          <div className={`bg-white rounded-2xl shadow-md p-6 border-l-8 ${statusData.border}`}>
            <h2 className="text-2xl font-black">Estado del negocio</h2>

            <p className={`text-3xl font-black mt-3 ${statusData.color}`}>
              {statusData.text}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
              <InfoBox
                title="Meta diaria de equilibrio"
                value={money(totals.breakEvenDaily)}
              />

              <InfoBox
                title="Ventas para meta de utilidad"
                value={money(totals.salesForTargetProfit)}
              />

              <InfoBox
                title="Meta utilidad mensual"
                value={money(totals.targetProfit)}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-black">Costos fijos mensuales</h2>
                <p className="text-gray-500">
                  Esta es la única parte que debes cargar manualmente una vez al mes.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={addCost}
                  className="bg-gray-100 hover:bg-gray-200 text-black px-5 py-3 rounded-xl font-bold"
                >
                  + Agregar gasto
                </button>

                <button
                  onClick={saveCosts}
                  disabled={saving}
                  className="bg-black text-yellow-400 px-5 py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar costos fijos'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left">
                <thead className="bg-black text-yellow-400">
                  <tr>
                    <th className="py-4 px-4">Concepto</th>
                    <th className="px-4">Monto mensual</th>
                    <th className="px-4">Notas</th>
                  </tr>
                </thead>

                <tbody>
                  {fixedCosts.map((cost, index) => (
                    <tr key={cost.id || index} className="border-b hover:bg-yellow-50">
                      <td className="py-3 px-4">
                        <input
                          className="input"
                          value={cost.concept || ''}
                          onChange={(event) =>
                            updateCost(index, 'concept', event.target.value)
                          }
                        />
                      </td>

                      <td className="px-4">
                        <input
                          className="input"
                          type="number"
                          min="0"
                          value={cost.amount || 0}
                          onChange={(event) =>
                            updateCost(index, 'amount', event.target.value)
                          }
                        />
                      </td>

                      <td className="px-4">
                        <input
                          className="input"
                          value={cost.notes || ''}
                          onChange={(event) =>
                            updateCost(index, 'notes', event.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-black mb-1">
              Rentabilidad por producto
            </h2>

            <p className="text-gray-500 mb-5">
              Calculada desde las ventas del POS y los costos finales cargados.
            </p>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left">
                <thead className="bg-black text-yellow-400">
                  <tr>
                    <th className="py-4 px-4">Producto</th>
                    <th className="px-4">Cantidad</th>
                    <th className="px-4">Ventas</th>
                    <th className="px-4">Costo</th>
                    <th className="px-4">Contribución</th>
                    <th className="px-4">Margen</th>
                  </tr>
                </thead>

                <tbody>
                  {(summary?.profitability || []).length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-gray-500 py-12">
                        No hay ventas con detalle de productos para este mes.
                      </td>
                    </tr>
                  ) : (
                    summary.profitability.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-yellow-50">
                        <td className="py-4 px-4 font-bold">{row.producto}</td>
                        <td className="px-4">{row.cantidad}</td>
                        <td className="px-4">{money(row.ventas)}</td>
                        <td className="px-4">{money(row.costo)}</td>
                        <td className="px-4 font-black">{money(row.contribucion)}</td>
                        <td className="px-4">{percent(row.margen)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-black mb-5">Resumen tributario estimado</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoBox title="IVA débito" value={money(totals.ivaDebit)} />
              <InfoBox title="IVA crédito estimado" value={money(totals.ivaCreditEstimated)} />
              <InfoBox title="IVA a pagar estimado" value={money(totals.ivaToPayEstimated)} />
            </div>

            <p className="text-gray-500 mt-4">
              Este cálculo es referencial para gestión interna. La declaración oficial debe revisarse con el Registro de Compras y Ventas del SII.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const Kpi = ({ title, value, border }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-5 border-l-8 ${border}`}>
      <p className="text-gray-500 font-bold">{title}</p>
      <h2 className="text-3xl font-black mt-2">{value}</h2>
    </div>
  )
}

const InfoBox = ({ title, value }) => {
  return (
    <div className="border rounded-xl p-5 bg-gray-50">
      <p className="text-gray-500 font-bold">{title}</p>
      <h3 className="text-2xl font-black mt-2">{value}</h3>
    </div>
  )
}

export default Finance
