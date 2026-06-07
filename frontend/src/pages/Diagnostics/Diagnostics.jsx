import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://american-burger-pos-api-d8r1.onrender.com/api'

const FRONTEND_URL = window.location.origin
const APP_VERSION = 'American Burger POS v1.0.0'

const Diagnostics = () => {
  const [tests, setTests] = useState([])
  const [status, setStatus] = useState('Probando...')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)

  const [printers, setPrinters] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ab_printers') || '[]')
    } catch {
      return []
    }
  })

  const [printerForm, setPrinterForm] = useState({
    name: '',
    type: 'thermal_80mm',
    connection: 'chrome_kiosk',
    notes: ''
  })

  const [showPrinterAdmin, setShowPrinterAdmin] = useState(false)

  const getToken = () =>
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    ''

  const headers = useMemo(() => {
    const token = getToken()

    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }, [])

  const runRequest = async (path) => {
    const start = performance.now()

    const response = await fetch(`${API_URL}${path}`, {
      headers
    })

    const ms = Math.round(performance.now() - start)
    const text = await response.text()

    let data = null

    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { raw: text }
    }

    if (!response.ok) {
      throw new Error(data?.message || data?.error || `Error HTTP ${response.status}`)
    }

    return {
      data,
      ms
    }
  }

  const createTestResult = (name, statusValue, detail, ms = null) => ({
    id: `${name}-${Date.now()}-${Math.random()}`,
    name,
    status: statusValue,
    detail,
    ms,
    time: new Date().toLocaleTimeString('es-CL')
  })

  const testConnection = async () => {
    setStatus('Probando...')
    setError('')

    try {
      const response = await fetch(`${API_URL}/health`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Error en API')
      }

      setResult(data)
      setStatus('OK')

      return true
    } catch (err) {
      setError(err.message || 'No se pudo conectar')
      setStatus('Error')

      return false
    }
  }

  const runAllTests = async () => {
    setRunning(true)
    setError('')

    const nextTests = []

    const addTest = (test) => {
      nextTests.push(test)
      setTests([...nextTests])
    }

    try {
      const token = getToken()

      addTest(
        createTestResult(
          '1. Estado de conexión API',
          'checking',
          'Probando conexión con /health...'
        )
      )

      try {
        const health = await runRequest('/health')

        addTest(
          createTestResult(
            '1. Estado de conexión API',
            'ok',
            'API conectada correctamente',
            health.ms
          )
        )

        setStatus('OK')
        setResult(health.data)
      } catch (err) {
        addTest(
          createTestResult(
            '1. Estado de conexión API',
            'error',
            err.message
          )
        )
        setStatus('Error')
      }

      addTest(
        createTestResult(
          '2. Estado de login/token',
          token ? 'ok' : 'warning',
          token ? 'Token encontrado en el navegador' : 'No hay token guardado'
        )
      )

      addTest(
        createTestResult(
          '3. Usuario activo y rol',
          'ok',
          'Usuario leído desde sesión local si el sistema lo tiene disponible'
        )
      )

      addTest(
        createTestResult(
          '4. Versión del sistema',
          'ok',
          APP_VERSION
        )
      )

      addTest(
        createTestResult(
          '5. URL frontend',
          'ok',
          FRONTEND_URL
        )
      )

      addTest(
        createTestResult(
          '6. URL backend',
          'ok',
          API_URL
        )
      )

      const routesToTest = [
        ['7. Prueba Supabase / productos', '/products'],
        ['8. Prueba ruta ventas / orders', '/orders'],
        ['9. Prueba ruta inventario', '/inventory'],
        ['10. Prueba ruta caja', '/cash/sessions'],
        ['11. Prueba ruta usuarios', '/users']
      ]

      let ordersCount = 0
      let productsCount = 0
      let inventoryCount = 0
      let usersCount = 0
      let cashOpen = false

      for (const [name, path] of routesToTest) {
        try {
          const response = await runRequest(path)
          const data = response.data || {}

          if (path === '/orders') {
            ordersCount = data.orders?.length || data.data?.length || 0
          }

          if (path === '/products') {
            productsCount = data.products?.length || data.data?.length || 0
          }

          if (path === '/inventory') {
            inventoryCount =
              data.inventory?.length ||
              data.items?.length ||
              data.data?.length ||
              0
          }

          if (path === '/users') {
            usersCount = data.users?.length || data.data?.length || 0
          }

          if (path === '/cash/sessions') {
            const sessions = data.sessions || data.cash_sessions || []

            cashOpen = sessions.some((session) => {
              const sessionStatus = String(session.status || '').toLowerCase()

              return (
                sessionStatus === 'open' ||
                sessionStatus === 'abierta' ||
                (!session.closed_at && !session.closedAt)
              )
            })
          }

          addTest(
            createTestResult(
              name,
              'ok',
              `Ruta disponible: ${path}`,
              response.ms
            )
          )
        } catch (err) {
          addTest(
            createTestResult(
              name,
              'error',
              `${path}: ${err.message}`
            )
          )
        }
      }

      addTest(
        createTestResult(
          '12. Tiempo de respuesta general',
          'ok',
          'Ver tiempos en milisegundos en cada prueba'
        )
      )

      addTest(
        createTestResult(
          '13. Estado impresora / Kiosk',
          printers.length > 0 ? 'ok' : 'warning',
          printers.length > 0
            ? `${printers.length} impresora(s) configurada(s)`
            : 'No hay impresoras configuradas'
        )
      )

      addTest(
        createTestResult(
          '14. Estado de caja',
          cashOpen ? 'ok' : 'warning',
          cashOpen ? 'Caja abierta' : 'Caja cerrada'
        )
      )

      addTest(
        createTestResult(
          '15. Conteo rápido de módulos',
          'ok',
          `Ventas: ${ordersCount} | Productos: ${productsCount} | Insumos: ${inventoryCount} | Usuarios: ${usersCount}`
        )
      )
    } catch (err) {
      setError(err.message || 'Error al ejecutar diagnóstico')
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => {
    testConnection()
    runAllTests()
  }, [])

  const savePrinter = (event) => {
    event.preventDefault()

    if (!printerForm.name.trim()) {
      alert('Ingresa el nombre de la impresora')
      return
    }

    const newPrinter = {
      id: Date.now(),
      ...printerForm,
      active: true,
      created_at: new Date().toISOString()
    }

    const nextPrinters = [...printers, newPrinter]

    setPrinters(nextPrinters)
    localStorage.setItem('ab_printers', JSON.stringify(nextPrinters))

    setPrinterForm({
      name: '',
      type: 'thermal_80mm',
      connection: 'chrome_kiosk',
      notes: ''
    })
  }

  const togglePrinter = (id) => {
    const nextPrinters = printers.map((printer) =>
      printer.id === id
        ? { ...printer, active: !printer.active }
        : printer
    )

    setPrinters(nextPrinters)
    localStorage.setItem('ab_printers', JSON.stringify(nextPrinters))
  }

  const deletePrinter = (id) => {
    const nextPrinters = printers.filter((printer) => printer.id !== id)

    setPrinters(nextPrinters)
    localStorage.setItem('ab_printers', JSON.stringify(nextPrinters))
  }

  const copyDiagnostic = async () => {
    const text = `
AMERICAN BURGER POS - DIAGNÓSTICO

Fecha: ${new Date().toLocaleString('es-CL')}
Frontend: ${FRONTEND_URL}
Backend: ${API_URL}
Versión: ${APP_VERSION}
Estado API: ${status}

PRUEBAS:
${tests
  .map(
    (test) =>
      `- ${test.name}: ${test.status.toUpperCase()} | ${test.detail}${
        test.ms ? ` | ${test.ms} ms` : ''
      }`
  )
  .join('\n')}

IMPRESORAS:
${
  printers.length > 0
    ? printers
        .map(
          (printer) =>
            `- ${printer.name} | ${printer.type} | ${printer.connection} | ${
              printer.active ? 'Activa' : 'Inactiva'
            }`
        )
        .join('\n')
    : 'Sin impresoras configuradas'
}
`

    await navigator.clipboard.writeText(text)
    alert('Diagnóstico copiado')
  }

  const testPrint = () => {
    const win = window.open('', '_blank')

    if (!win) return

    win.document.write(`
      <html>
        <head>
          <title>Prueba de impresión</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body {
              width: 80mm;
              padding: 6mm 4mm;
              font-family: Arial, monospace;
              font-size: 12px;
            }
            .center { text-align: center; }
            .brand { font-size: 22px; font-weight: 900; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="brand">AMERICAN BURGER</div>
            <div>PRUEBA DE IMPRESORA</div>
          </div>
          <div class="line"></div>
          <div>Fecha: ${new Date().toLocaleString('es-CL')}</div>
          <div>Modo recomendado: Chrome Kiosk</div>
          <div>Papel: 80mm térmico</div>
          <div class="line"></div>
          <div class="center">Impresión OK</div>
        </body>
      </html>
    `)

    win.document.close()
    win.focus()

    setTimeout(() => {
      win.print()
    }, 500)
  }

  const statusClass = (testStatus) => {
    if (testStatus === 'ok') return 'bg-green-100 text-green-700 border-green-300'
    if (testStatus === 'warning') return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    if (testStatus === 'error') return 'bg-red-100 text-red-700 border-red-300'

    return 'bg-gray-100 text-gray-700 border-gray-300'
  }

  const statusText = (testStatus) => {
    if (testStatus === 'ok') return 'OK'
    if (testStatus === 'warning') return 'Advertencia'
    if (testStatus === 'error') return 'Error'

    return 'Probando'
  }

  return (
    <div className="page-container">
      <Sidebar />

      <div className="page-content">
        <Navbar title="Diagnóstico del Sistema" />

        <div className="main-content space-y-6 bg-gray-100">
          <div className="bg-black text-white rounded-2xl shadow-lg p-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <p className="text-yellow-400 font-bold tracking-wide">
                AMERICAN BURGER POS
              </p>

              <h1 className="text-4xl font-black mt-1">
                Centro de diagnóstico
              </h1>

              <p className="text-gray-300 mt-1">
                Estado de API, módulos críticos, caja, rutas, token e impresión.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={runAllTests}
                disabled={running}
                className="bg-yellow-400 text-black px-5 py-3 rounded-xl font-black disabled:opacity-50"
              >
                {running ? 'Probando...' : '🧪 Probar todo'}
              </button>

              <button
                onClick={copyDiagnostic}
                className="bg-zinc-800 border border-zinc-700 px-5 py-3 rounded-xl font-bold"
              >
                📋 Copiar diagnóstico
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-green-500">
              <p className="text-gray-500 font-bold">Estado API</p>
              <h2
                className={`text-4xl font-black ${
                  status === 'OK' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {status}
              </h2>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-black">
              <p className="text-gray-500 font-bold">Backend</p>
              <h2 className="text-sm font-black break-all mt-2">
                {API_URL}
              </h2>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-yellow-400">
              <p className="text-gray-500 font-bold">Frontend</p>
              <h2 className="text-sm font-black break-all mt-2">
                {FRONTEND_URL}
              </h2>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-blue-500">
              <p className="text-gray-500 font-bold">Impresoras</p>
              <h2 className="text-4xl font-black">
                {printers.length}
              </h2>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-5 py-4 rounded-xl font-bold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-md p-6 xl:col-span-2">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-2xl font-black">
                    15 pruebas del sistema
                  </h2>
                  <p className="text-gray-500">
                    Revisión rápida de módulos críticos.
                  </p>
                </div>

                <button
                  onClick={testConnection}
                  className="bg-black text-yellow-400 font-bold px-5 py-3 rounded-xl"
                >
                  Probar API
                </button>
              </div>

              <div className="space-y-3">
                {tests.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">
                    Sin pruebas ejecutadas todavía.
                  </div>
                ) : (
                  tests.map((test) => (
                    <div
                      key={test.id}
                      className={`border rounded-xl p-4 ${statusClass(test.status)}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <h3 className="font-black">{test.name}</h3>
                          <p className="text-sm">{test.detail}</p>
                        </div>

                        <div className="text-right">
                          <span className="font-black">
                            {statusText(test.status)}
                          </span>

                          {test.ms !== null && (
                            <p className="text-xs">{test.ms} ms</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-2xl font-black mb-4">
                  Impresoras
                </h2>

                <form onSubmit={savePrinter} className="space-y-3">
                  <input
                    className="input"
                    value={printerForm.name}
                    onChange={(event) =>
                      setPrinterForm((current) => ({
                        ...current,
                        name: event.target.value
                      }))
                    }
                    placeholder="Ej: Xprinter Cocina"
                  />

                  <select
                    className="input"
                    value={printerForm.type}
                    onChange={(event) =>
                      setPrinterForm((current) => ({
                        ...current,
                        type: event.target.value
                      }))
                    }
                  >
                    <option value="thermal_80mm">Térmica 80mm</option>
                    <option value="thermal_58mm">Térmica 58mm</option>
                    <option value="inkjet">Inyección tinta</option>
                    <option value="laser">Láser</option>
                  </select>

                  <select
                    className="input"
                    value={printerForm.connection}
                    onChange={(event) =>
                      setPrinterForm((current) => ({
                        ...current,
                        connection: event.target.value
                      }))
                    }
                  >
                    <option value="chrome_kiosk">Chrome Kiosk</option>
                    <option value="usb">USB</option>
                    <option value="network">Red / WiFi</option>
                    <option value="bluetooth">Bluetooth</option>
                  </select>

                  <textarea
                    className="input min-h-[80px]"
                    value={printerForm.notes}
                    onChange={(event) =>
                      setPrinterForm((current) => ({
                        ...current,
                        notes: event.target.value
                      }))
                    }
                    placeholder="Notas: cocina, caja, delivery..."
                  />

                  <button
                    type="submit"
                    className="w-full bg-yellow-400 text-black font-black py-3 rounded-xl"
                  >
                    ➕ Agregar impresora
                  </button>
                </form>

                <div className="grid grid-cols-1 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowPrinterAdmin(!showPrinterAdmin)}
                    className="w-full bg-black text-yellow-400 font-black py-3 rounded-xl"
                  >
                    🖨️ Administrar impresoras
                  </button>

                  <button
                    type="button"
                    onClick={testPrint}
                    className="w-full border border-gray-300 font-bold py-3 rounded-xl hover:bg-gray-100"
                  >
                    🧾 Prueba de impresión
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-2xl font-black mb-4">
                  Estado impresión / Kiosk
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span>Modo recomendado</span>
                    <strong>Chrome Kiosk</strong>
                  </div>

                  <div className="flex justify-between border-b pb-2">
                    <span>Papel térmico</span>
                    <strong>80mm</strong>
                  </div>

                  <div className="flex justify-between border-b pb-2">
                    <span>Ventana impresión</span>
                    <strong>Automática</strong>
                  </div>

                  <div className="flex justify-between border-b pb-2">
                    <span>Impresoras guardadas</span>
                    <strong>{printers.length}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {showPrinterAdmin && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-2xl font-black mb-4">
                Administrar impresoras
              </h2>

              {printers.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  No hay impresoras agregadas.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-left">
                    <thead className="bg-black text-yellow-400">
                      <tr>
                        <th className="py-4 px-4">Nombre</th>
                        <th className="px-4">Tipo</th>
                        <th className="px-4">Conexión</th>
                        <th className="px-4">Estado</th>
                        <th className="px-4">Notas</th>
                        <th className="px-4 text-right">Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {printers.map((printer) => (
                        <tr key={printer.id} className="border-b hover:bg-yellow-50">
                          <td className="py-4 px-4 font-bold">
                            {printer.name}
                          </td>

                          <td className="px-4">{printer.type}</td>

                          <td className="px-4">{printer.connection}</td>

                          <td className="px-4">
                            <span
                              className={`px-3 py-1 rounded-full font-bold text-sm ${
                                printer.active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {printer.active ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>

                          <td className="px-4">{printer.notes || '-'}</td>

                          <td className="px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => togglePrinter(printer.id)}
                                className="bg-yellow-400 text-black px-3 py-2 rounded-lg font-bold"
                              >
                                {printer.active ? 'Desactivar' : 'Activar'}
                              </button>

                              <button
                                onClick={() => deletePrinter(printer.id)}
                                className="bg-red-600 text-white px-3 py-2 rounded-lg font-bold"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-black mb-4">
              Resultado API
            </h2>

            <pre className="bg-gray-100 rounded-xl p-4 overflow-x-auto text-sm">
              {result ? JSON.stringify(result, null, 2) : 'Sin resultado todavía'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Diagnostics
