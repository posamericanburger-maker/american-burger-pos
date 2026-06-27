import { useEffect, useMemo, useState } from 'react'
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

const formatMoney = (value) => {
  const n = Number(value || 0)

  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(n)
}

const formatPercent = (value) => {
  const n = Number(value || 0)
  return `${(n * 100).toFixed(1)}%`
}

const currentMonth = () => {
  return new Date().toISOString().slice(0, 7)
}

function Finance() {
  const [month, setMonth] = useState(currentMonth())
  const [summary, setSummary] = useState(null)
  const [fixedCosts, setFixedCosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await financeService.getSummary(month)
      setSummary(data)

      const currentCosts = data.fixedCosts || []

      if (currentCosts.length > 0) {
        setFixedCosts(currentCosts)
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

  const statusColor = useMemo(() => {
    if (totals.status === 'SOBRE EQUILIBRIO') return '#16a34a'
    if (totals.status === 'CERCA DEL EQUILIBRIO') return '#ca8a04'
    return '#dc2626'
  }, [totals.status])

  const updateCost = (index, field, value) => {
    setFixedCosts((prev) => {
      const copy = [...prev]

      copy[index] = {
        ...copy[index],
        [field]: field === 'amount' ? Number(value || 0) : value
      }

      return copy
    })
  }

  const addCost = () => {
    setFixedCosts((prev) => [
      ...prev,
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

    try {
      await financeService.saveFixedCosts(month, fixedCosts)
      await loadData()
      alert('Costos fijos guardados correctamente')
    } catch (err) {
      setError(err.message || 'No se pudieron guardar los costos')
    } finally {
      setSaving(false)
    }
  }

  const downloadExcel = () => {
    window.open(financeService.exportExcelUrl(month), '_blank')
  }

  return (
    <div style={pageStyle}>
      <div style={heroStyle}>
        <div style={brandStyle}>AMERICAN BURGER POS</div>
        <h1 style={titleStyle}>📊 Finanzas</h1>
        <p style={subtitleStyle}>
          Punto de equilibrio, IVA, costos fijos, rentabilidad y respaldo Excel.
        </p>
      </div>

      <div style={toolbarStyle}>
        <label style={{ fontWeight: 700 }}>Mes:</label>

        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={inputTopStyle}
        />

        <button onClick={loadData} style={buttonStyle}>
          Actualizar
        </button>

        <button
          onClick={downloadExcel}
          style={{ ...buttonStyle, background: '#16a34a' }}
        >
          📥 Descargar respaldo Excel
        </button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      {loading ? (
        <div style={cardStyle}>Cargando módulo Finanzas...</div>
      ) : (
        <>
          <div style={gridStyle}>
            <Kpi title="Ventas del mes" value={formatMoney(totals.totalSales)} />
            <Kpi title="Venta neta" value={formatMoney(totals.netSales)} />
            <Kpi title="IVA estimado" value={formatMoney(totals.ivaToPayEstimated)} />
            <Kpi title="Costo variable" value={formatMoney(totals.totalVariableCost)} />
            <Kpi title="Costos fijos" value={formatMoney(totals.totalFixedCosts)} />
            <Kpi title="Utilidad operativa" value={formatMoney(totals.operatingProfit)} />
            <Kpi title="Margen promedio" value={formatPercent(totals.averageMargin)} />
            <Kpi title="Punto equilibrio" value={formatMoney(totals.breakEvenMonthly)} />
          </div>

          <div
            style={{
              ...cardStyle,
              borderLeft: `10px solid ${statusColor}`,
              marginTop: 20
            }}
          >
            <h2 style={{ marginTop: 0 }}>Estado del negocio</h2>

            <div
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: statusColor
              }}
            >
              {totals.status || 'SIN DATOS'}
            </div>

            <p>
              Meta diaria de equilibrio aproximada:{' '}
              <strong>{formatMoney(totals.breakEvenDaily)}</strong>
            </p>

            <p>
              Ventas necesarias para meta de utilidad:{' '}
              <strong>{formatMoney(totals.salesForTargetProfit)}</strong>
            </p>
          </div>

          <div style={{ ...cardStyle, marginTop: 20 }}>
            <h2>Costos fijos mensuales</h2>

            <p>
              Esta es la única parte que debes cargar manualmente una vez al mes.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Concepto</th>
                    <th style={thStyle}>Monto mensual</th>
                    <th style={thStyle}>Notas</th>
                  </tr>
                </thead>

                <tbody>
                  {fixedCosts.map((cost, index) => (
                    <tr key={cost.id || index}>
                      <td style={tdStyle}>
                        <input
                          value={cost.concept || ''}
                          onChange={(e) =>
                            updateCost(index, 'concept', e.target.value)
                          }
                          style={inputStyle}
                        />
                      </td>

                      <td style={tdStyle}>
                        <input
                          type="number"
                          value={cost.amount || 0}
                          onChange={(e) =>
                            updateCost(index, 'amount', e.target.value)
                          }
                          style={inputStyle}
                        />
                      </td>

                      <td style={tdStyle}>
                        <input
                          value={cost.notes || ''}
                          onChange={(e) =>
                            updateCost(index, 'notes', e.target.value)
                          }
                          style={inputStyle}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                onClick={addCost}
                style={{ ...buttonStyle, background: '#374151' }}
              >
                + Agregar gasto
              </button>

              <button onClick={saveCosts} disabled={saving} style={buttonStyle}>
                {saving ? 'Guardando...' : 'Guardar costos fijos'}
              </button>
            </div>
          </div>

          <div style={{ ...cardStyle, marginTop: 20 }}>
            <h2>Rentabilidad por producto</h2>

            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Producto</th>
                    <th style={thStyle}>Cantidad</th>
                    <th style={thStyle}>Ventas</th>
                    <th style={thStyle}>Costo</th>
                    <th style={thStyle}>Contribución</th>
                    <th style={thStyle}>Margen</th>
                  </tr>
                </thead>

                <tbody>
                  {(summary?.profitability || []).map((row, index) => (
                    <tr key={index}>
                      <td style={tdStyle}>{row.producto}</td>
                      <td style={tdStyle}>{row.cantidad}</td>
                      <td style={tdStyle}>{formatMoney(row.ventas)}</td>
                      <td style={tdStyle}>{formatMoney(row.costo)}</td>
                      <td style={tdStyle}>{formatMoney(row.contribucion)}</td>
                      <td style={tdStyle}>{formatPercent(row.margen)}</td>
                    </tr>
                  ))}

                  {(summary?.profitability || []).length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ ...tdStyle, textAlign: 'center', padding: 20 }}>
                        No hay ventas con detalle de productos para este mes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Kpi({ title, value }) {
  return (
    <div style={cardStyle}>
      <div style={kpiTitleStyle}>{title}</div>
      <div style={kpiValueStyle}>{value}</div>
    </div>
  )
}

const pageStyle = {
  padding: 24,
  background: '#f5f5f5',
  minHeight: '100vh'
}

const heroStyle = {
  background: '#000',
  color: '#fff',
  borderRadius: 18,
  padding: 24,
  marginBottom: 24
}

const brandStyle = {
  color: '#FFC72C',
  fontWeight: 800
}

const titleStyle = {
  margin: '8px 0',
  fontSize: 34
}

const subtitleStyle = {
  margin: 0,
  opacity: 0.85
}

const toolbarStyle = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  marginBottom: 20,
  flexWrap: 'wrap'
}

const cardStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: 18,
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 16
}

const buttonStyle = {
  border: 0,
  borderRadius: 10,
  padding: '11px 16px',
  background: '#DA291C',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer'
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse'
}

const thStyle = {
  background: '#DA291C',
  color: '#fff',
  padding: 10,
  textAlign: 'left',
  fontSize: 14
}

const tdStyle = {
  padding: 8,
  borderBottom: '1px solid #eee'
}

const inputStyle = {
  width: '100%',
  padding: 9,
  border: '1px solid #ddd',
  borderRadius: 8
}

const inputTopStyle = {
  padding: 10,
  borderRadius: 10,
  border: '1px solid #ddd'
}

const errorStyle = {
  background: '#fee2e2',
  color: '#991b1b',
  padding: 14,
  borderRadius: 12,
  marginBottom: 18,
  fontWeight: 700
}

const kpiTitleStyle = {
  color: '#666',
  fontWeight: 700,
  fontSize: 14
}

const kpiValueStyle = {
  fontSize: 25,
  fontWeight: 900,
  marginTop: 8
}

export default Finance
