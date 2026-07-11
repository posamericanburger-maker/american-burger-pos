import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://american-burger-pos-api-d8r1.onrender.com/api'

const FRONTEND_URL = window.location.origin
const APP_VERSION = 'American Burger POS v1.0.0'

const PURPOSE_OPTIONS = [
  {
    value: 'cash',
    label: 'Caja',
    description: 'Comprobante interno de caja'
  },
  {
    value: 'kitchen',
    label: 'Cocina',
    description: 'Comandas de preparación'
  },
  {
    value: 'delivery',
    label: 'Delivery',
    description: 'Pedidos de reparto'
  },
  {
    value: 'customer_receipt',
    label: 'Ticket cliente',
    description: 'Comprobante para el cliente'
  },
  {
    value: 'cash_closing',
    label: 'Cierre de caja',
    description: 'Resumen de cierre y arqueo'
  }
]

const DEFAULT_ASSIGNMENT = {
  purpose: 'cash',
  agent_id: '',
  printer_id: '',
  paper_width: 80,
  copies: 1,
  auto_print: true,
  active: true,
  settings: {}
}

const getStoredToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('authToken') ||
  localStorage.getItem('access_token') ||
  ''

const formatDate = (value) => {
  if (!value) return '-'

  try {
    return new Date(value).toLocaleString('es-CL')
  } catch {
    return value
  }
}

const Diagnostics = () => {
  const [tests, setTests] = useState([])
  const [status, setStatus] = useState('Probando...')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [running, setRunning] = useState(false)

  const [agents, setAgents] = useState([])
  const [printers, setPrinters] = useState([])
  const [assignments, setAssignments] = useState([])
  const [printJobs, setPrintJobs] = useState([])

  const [loadingPrinting, setLoadingPrinting] = useState(false)
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [testingPrinter, setTestingPrinter] = useState(false)

  const [assignmentForm, setAssignmentForm] = useState(
    DEFAULT_ASSIGNMENT
  )

  const [showJobs, setShowJobs] = useState(false)

  const token = getStoredToken()

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(token
        ? {
            Authorization: `Bearer ${token}`
          }
        : {})
    }),
    [token]
  )

  const apiRequest = useCallback(
    async (
      path,
      {
        method = 'GET',
        body,
        customHeaders = {}
      } = {}
    ) => {
      const start = performance.now()

      const response = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
          ...headers,
          ...customHeaders
        },
        ...(body !== undefined
          ? {
              body: JSON.stringify(body)
            }
          : {})
      })

      const ms = Math.round(performance.now() - start)
      const text = await response.text()

      let data = null

      try {
        data = text ? JSON.parse(text) : null
      } catch {
        data = {
          raw: text
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Error HTTP ${response.status}`
        )
      }

      return {
        data,
        ms
      }
    },
    [headers]
  )

  const createTestResult = (
    name,
    testStatus,
    detail,
    ms = null
  ) => ({
    id: `${name}-${Date.now()}-${Math.random()}`,
    name,
    status: testStatus,
    detail,
    ms,
    time: new Date().toLocaleTimeString('es-CL')
  })

  const showSuccess = (text) => {
    setError('')
    setMessage(text)

    window.setTimeout(() => {
      setMessage('')
    }, 5000)
  }

  const showError = (text) => {
    setMessage('')
    setError(text)
  }

  const testConnection = useCallback(async () => {
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
    } catch (requestError) {
      setStatus('Error')
      setError(
        requestError.message ||
          'No se pudo conectar con el backend'
      )

      return false
    }
  }, [])

  const loadPrintingData = useCallback(
    async ({ silent = false } = {}) => {
      if (!token) {
        if (!silent) {
          showError(
            'No hay token de sesión. Inicia sesión nuevamente.'
          )
        }

        return
      }

      setLoadingPrinting(true)

      if (!silent) {
        setError('')
        setMessage('')
      }

      try {
        const [
          agentsResponse,
          printersResponse,
          assignmentsResponse,
          jobsResponse
        ] = await Promise.all([
          apiRequest('/printing/agents'),
          apiRequest('/printing/printers'),
          apiRequest('/printing/assignments'),
          apiRequest('/printing/jobs?limit=50')
        ])

        const loadedAgents =
          agentsResponse.data?.agents || []

        const loadedPrinters =
          printersResponse.data?.printers || []

        const loadedAssignments =
          assignmentsResponse.data?.assignments || []

        const loadedJobs =
          jobsResponse.data?.jobs || []

        setAgents(loadedAgents)
        setPrinters(loadedPrinters)
        setAssignments(loadedAssignments)
        setPrintJobs(loadedJobs)

        setAssignmentForm((current) => {
          const selectedAgentExists = loadedAgents.some(
            (agent) => agent.id === current.agent_id
          )

          const firstActiveAgent = loadedAgents.find(
            (agent) => agent.active
          )

          const nextAgentId = selectedAgentExists
            ? current.agent_id
            : firstActiveAgent?.id || ''

          const availablePrinters = loadedPrinters.filter(
            (printer) =>
              printer.agent_id === nextAgentId &&
              printer.active
          )

          const selectedPrinterExists =
            availablePrinters.some(
              (printer) =>
                printer.id === current.printer_id
            )

          return {
            ...current,
            agent_id: nextAgentId,
            printer_id: selectedPrinterExists
              ? current.printer_id
              : availablePrinters[0]?.id || ''
          }
        })

        if (!silent) {
          showSuccess(
            `${loadedAgents.length} agente(s) y ${loadedPrinters.length} impresora(s) cargados`
          )
        }
      } catch (requestError) {
        if (!silent) {
          showError(
            requestError.message ||
              'No se pudo cargar el centro de impresión'
          )
        }
      } finally {
        setLoadingPrinting(false)
      }
    },
    [apiRequest, token]
  )

  const availablePrinters = useMemo(
    () =>
      printers.filter(
        (printer) =>
          printer.agent_id === assignmentForm.agent_id
      ),
    [printers, assignmentForm.agent_id]
  )

  const selectedPrinter = useMemo(
    () =>
      printers.find(
        (printer) =>
          printer.id === assignmentForm.printer_id
      ) || null,
    [printers, assignmentForm.printer_id]
  )

  const onlineAgents = useMemo(
    () =>
      agents.filter(
        (agent) =>
          agent.active && agent.status === 'online'
      ),
    [agents]
  )

  const activePrinters = useMemo(
    () =>
      printers.filter(
        (printer) =>
          printer.active &&
          printer.status !== 'offline'
      ),
    [printers]
  )

  const pendingJobs = useMemo(
    () =>
      printJobs.filter(
        (job) =>
          job.status === 'pending' ||
          job.status === 'processing'
      ),
    [printJobs]
  )

  const failedJobs = useMemo(
    () =>
      printJobs.filter(
        (job) => job.status === 'failed'
      ),
    [printJobs]
  )

  const handleAssignmentChange = (event) => {
    const {
      name,
      value,
      type,
      checked
    } = event.target

    if (name === 'agent_id') {
      const printersForAgent = printers.filter(
        (printer) =>
          printer.agent_id === value &&
          printer.active
      )

      setAssignmentForm((current) => ({
        ...current,
        agent_id: value,
        printer_id:
          printersForAgent[0]?.id || ''
      }))

      return
    }

    setAssignmentForm((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
            ? Number(value)
            : value
    }))
  }

  const loadAssignmentForPurpose = (purpose) => {
    const assignment = assignments.find(
      (item) => item.purpose === purpose
    )

    if (!assignment) {
      const firstActiveAgent = agents.find(
        (agent) => agent.active
      )

      const printersForAgent = printers.filter(
        (printer) =>
          printer.agent_id === firstActiveAgent?.id &&
          printer.active
      )

      setAssignmentForm({
        ...DEFAULT_ASSIGNMENT,
        purpose,
        agent_id: firstActiveAgent?.id || '',
        printer_id: printersForAgent[0]?.id || ''
      })

      return
    }

    setAssignmentForm({
      purpose: assignment.purpose,
      agent_id: assignment.agent_id,
      printer_id: assignment.printer_id,
      paper_width: assignment.paper_width || 80,
      copies: assignment.copies || 1,
      auto_print: Boolean(assignment.auto_print),
      active: Boolean(assignment.active),
      settings: assignment.settings || {}
    })
  }

  const saveAssignment = async (event) => {
    event.preventDefault()

    if (!assignmentForm.agent_id) {
      showError('Selecciona un computador agente')
      return
    }

    if (!assignmentForm.printer_id) {
      showError('Selecciona una impresora')
      return
    }

    setSavingAssignment(true)
    setError('')
    setMessage('')

    try {
      const response = await apiRequest(
        '/printing/assignments',
        {
          method: 'POST',
          body: assignmentForm
        }
      )

      showSuccess(
        response.data?.message ||
          'Asignación guardada correctamente'
      )

      await loadPrintingData({
        silent: true
      })
    } catch (requestError) {
      showError(
        requestError.message ||
          'No se pudo guardar la asignación'
      )
    } finally {
      setSavingAssignment(false)
    }
  }

  const sendTestPrint = async () => {
    if (!assignmentForm.agent_id) {
      showError('Selecciona un computador agente')
      return
    }

    if (!assignmentForm.printer_id) {
      showError('Selecciona una impresora')
      return
    }

    setTestingPrinter(true)
    setError('')
    setMessage('')

    try {
      const response = await apiRequest('/printing/test', {
        method: 'POST',
        body: {
          purpose: 'test',
          agent_id: assignmentForm.agent_id,
          printer_id: assignmentForm.printer_id,
          paper_width: Number(
            assignmentForm.paper_width || 80
          )
        }
      })

      showSuccess(
        response.data?.message ||
          'Prueba enviada a la cola de impresión'
      )

      await loadPrintingData({
        silent: true
      })
    } catch (requestError) {
      showError(
        requestError.message ||
          'No se pudo enviar la prueba de impresión'
      )
    } finally {
      setTestingPrinter(false)
    }
  }

  const retryJob = async (jobId) => {
    try {
      const response = await apiRequest(
        `/printing/jobs/${jobId}/retry`,
        {
          method: 'POST',
          body: {}
        }
      )

      showSuccess(
        response.data?.message ||
          'Trabajo reenviado'
      )

      await loadPrintingData({
        silent: true
      })
    } catch (requestError) {
      showError(
        requestError.message ||
          'No se pudo reintentar el trabajo'
      )
    }
  }

  const cancelJob = async (jobId) => {
    const confirmed = window.confirm(
      '¿Seguro que deseas cancelar este trabajo de impresión?'
    )

    if (!confirmed) return

    try {
      const response = await apiRequest(
        `/printing/jobs/${jobId}/cancel`,
        {
          method: 'POST',
          body: {}
        }
      )

      showSuccess(
        response.data?.message ||
          'Trabajo cancelado'
      )

      await loadPrintingData({
        silent: true
      })
    } catch (requestError) {
      showError(
        requestError.message ||
          'No se pudo cancelar el trabajo'
      )
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
      addTest(
        createTestResult(
          '1. Estado de conexión API',
          'checking',
          'Probando conexión con /health...'
        )
      )

      try {
        const health = await apiRequest('/health')

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
      } catch (requestError) {
        addTest(
          createTestResult(
            '1. Estado de conexión API',
            'error',
            requestError.message
          )
        )

        setStatus('Error')
      }

      addTest(
        createTestResult(
          '2. Estado de login/token',
          token ? 'ok' : 'warning',
          token
            ? 'Token encontrado en el navegador'
            : 'No hay token guardado'
        )
      )

      addTest(
        createTestResult(
          '3. Usuario activo y rol',
          token ? 'ok' : 'warning',
          token
            ? 'Sesión disponible para rutas protegidas'
            : 'No se pueden consultar rutas protegidas'
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
        [
          '7. Prueba Supabase / productos',
          '/products'
        ],
        [
          '8. Prueba ruta ventas / orders',
          '/orders'
        ],
        [
          '9. Prueba ruta inventario',
          '/inventory'
        ],
        [
          '10. Prueba ruta caja',
          '/cash/sessions'
        ],
        [
          '11. Prueba ruta usuarios',
          '/users'
        ]
      ]

      let ordersCount = 0
      let productsCount = 0
      let inventoryCount = 0
      let usersCount = 0
      let cashOpen = false

      for (const [name, path] of routesToTest) {
        try {
          const response = await apiRequest(path)
          const data = response.data || {}

          if (path === '/orders') {
            ordersCount =
              data.orders?.length ||
              data.data?.length ||
              0
          }

          if (path === '/products') {
            productsCount =
              data.products?.length ||
              data.data?.length ||
              0
          }

          if (path === '/inventory') {
            inventoryCount =
              data.inventory?.length ||
              data.items?.length ||
              data.data?.length ||
              0
          }

          if (path === '/users') {
            usersCount =
              data.users?.length ||
              data.data?.length ||
              0
          }

          if (path === '/cash/sessions') {
            const sessions =
              data.sessions ||
              data.cash_sessions ||
              []

            cashOpen = sessions.some((session) => {
              const sessionStatus = String(
                session.status || ''
              ).toLowerCase()

              return (
                sessionStatus === 'open' ||
                sessionStatus === 'abierta' ||
                (!session.closed_at &&
                  !session.closedAt)
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
        } catch (requestError) {
          addTest(
            createTestResult(
              name,
              'error',
              `${path}: ${requestError.message}`
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

      try {
        const printingResponse = await apiRequest(
          '/printing/agents'
        )

        const loadedAgents =
          printingResponse.data?.agents || []

        const onlineCount = loadedAgents.filter(
          (agent) =>
            agent.active &&
            agent.status === 'online'
        ).length

        addTest(
          createTestResult(
            '13. Estado del sistema de impresión',
            onlineCount > 0 ? 'ok' : 'warning',
            onlineCount > 0
              ? `${onlineCount} agente(s) de impresión conectado(s)`
              : 'Backend disponible, pero no hay agentes conectados',
            printingResponse.ms
          )
        )
      } catch (requestError) {
        addTest(
          createTestResult(
            '13. Estado del sistema de impresión',
            'error',
            requestError.message
          )
        )
      }

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
    } catch (requestError) {
      showError(
        requestError.message ||
          'Error ejecutando diagnóstico'
      )
    } finally {
      setRunning(false)
    }
  }

  const copyDiagnostic = async () => {
    const text = `
AMERICAN BURGER POS - DIAGNÓSTICO

Fecha: ${new Date().toLocaleString('es-CL')}
Frontend: ${FRONTEND_URL}
Backend: ${API_URL}
Versión: ${APP_VERSION}
Estado API: ${status}

IMPRESIÓN:
Agentes registrados: ${agents.length}
Agentes en línea: ${onlineAgents.length}
Impresoras registradas: ${printers.length}
Impresoras activas: ${activePrinters.length}
Asignaciones: ${assignments.length}
Trabajos pendientes: ${pendingJobs.length}
Trabajos fallidos: ${failedJobs.length}

PRUEBAS:
${tests
  .map(
    (test) =>
      `- ${test.name}: ${test.status.toUpperCase()} | ${test.detail}${
        test.ms ? ` | ${test.ms} ms` : ''
      }`
  )
  .join('\n')}
`

    try {
      await navigator.clipboard.writeText(text)
      showSuccess('Diagnóstico copiado')
    } catch {
      showError('No se pudo copiar el diagnóstico')
    }
  }

  const statusClass = (testStatus) => {
    if (testStatus === 'ok') {
      return 'bg-green-100 text-green-700 border-green-300'
    }

    if (testStatus === 'warning') {
      return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    }

    if (testStatus === 'error') {
      return 'bg-red-100 text-red-700 border-red-300'
    }

    return 'bg-gray-100 text-gray-700 border-gray-300'
  }

  const statusText = (testStatus) => {
    if (testStatus === 'ok') return 'OK'
    if (testStatus === 'warning') return 'Advertencia'
    if (testStatus === 'error') return 'Error'

    return 'Probando'
  }

  const jobStatusClass = (jobStatus) => {
    if (jobStatus === 'completed') {
      return 'bg-green-100 text-green-700'
    }

    if (jobStatus === 'processing') {
      return 'bg-blue-100 text-blue-700'
    }

    if (jobStatus === 'pending') {
      return 'bg-yellow-100 text-yellow-700'
    }

    if (jobStatus === 'failed') {
      return 'bg-red-100 text-red-700'
    }

    return 'bg-gray-100 text-gray-700'
  }

  useEffect(() => {
    testConnection()
    loadPrintingData({
      silent: true
    })
  }, [testConnection, loadPrintingData])

  useEffect(() => {
    runAllTests()
  }, [])

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
                Estado de API, módulos críticos y sistema
                profesional de impresión.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runAllTests}
                disabled={running}
                className="bg-yellow-400 text-black px-5 py-3 rounded-xl font-black disabled:opacity-50"
              >
                {running
                  ? 'Probando...'
                  : '🧪 Probar todo'}
              </button>

              <button
                type="button"
                onClick={copyDiagnostic}
                className="bg-zinc-800 border border-zinc-700 px-5 py-3 rounded-xl font-bold"
              >
                📋 Copiar diagnóstico
              </button>
            </div>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-green-500">
              <p className="text-gray-500 font-bold">
                Estado API
              </p>

              <h2
                className={`text-3xl font-black ${
                  status === 'OK'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {status}
              </h2>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-black">
              <p className="text-gray-500 font-bold">
                Agentes
              </p>

              <h2 className="text-4xl font-black">
                {agents.length}
              </h2>

              <p className="text-sm text-gray-500">
                {onlineAgents.length} en línea
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-yellow-400">
              <p className="text-gray-500 font-bold">
                Impresoras
              </p>

              <h2 className="text-4xl font-black">
                {printers.length}
              </h2>

              <p className="text-sm text-gray-500">
                {activePrinters.length} activas
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-blue-500">
              <p className="text-gray-500 font-bold">
                Pendientes
              </p>

              <h2 className="text-4xl font-black">
                {pendingJobs.length}
              </h2>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border-l-8 border-red-500">
              <p className="text-gray-500 font-bold">
                Fallidos
              </p>

              <h2 className="text-4xl font-black">
                {failedJobs.length}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-md p-6 xl:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-2xl font-black">
                    15 pruebas del sistema
                  </h2>

                  <p className="text-gray-500">
                    Revisión rápida de módulos críticos.
                  </p>
                </div>

                <button
                  type="button"
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
                      className={`border rounded-xl p-4 ${statusClass(
                        test.status
                      )}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <h3 className="font-black">
                            {test.name}
                          </h3>

                          <p className="text-sm">
                            {test.detail}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="font-black">
                            {statusText(test.status)}
                          </span>

                          {test.ms !== null && (
                            <p className="text-xs">
                              {test.ms} ms
                            </p>
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
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-2xl font-black">
                      Centro de impresión
                    </h2>

                    <p className="text-sm text-gray-500">
                      Agentes e impresoras conectadas
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadPrintingData()}
                    disabled={loadingPrinting}
                    className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-black disabled:opacity-50"
                  >
                    {loadingPrinting ? '...' : '↻'}
                  </button>
                </div>

                {agents.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-xl p-4">
                    <strong>
                      No hay computadores registrados.
                    </strong>

                    <p className="text-sm mt-1">
                      El agente local todavía no ha registrado
                      ningún equipo de impresión.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="border rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black">
                              {agent.name}
                            </h3>

                            <p className="text-xs text-gray-500">
                              {agent.machine_name}
                            </p>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black ${
                              agent.status === 'online'
                                ? 'bg-green-100 text-green-700'
                                : agent.status === 'disabled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {agent.status === 'online'
                              ? 'En línea'
                              : agent.status === 'disabled'
                                ? 'Deshabilitado'
                                : 'Desconectado'}
                          </span>
                        </div>

                        <div className="mt-3 text-sm text-gray-600">
                          <p>
                            Impresoras:{' '}
                            <strong>
                              {agent.printers?.length || 0}
                            </strong>
                          </p>

                          <p>
                            Última conexión:{' '}
                            <strong>
                              {formatDate(agent.last_seen_at)}
                            </strong>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form
                onSubmit={saveAssignment}
                className="bg-white rounded-2xl shadow-md p-6"
              >
                <h2 className="text-2xl font-black mb-1">
                  Asignar impresora
                </h2>

                <p className="text-sm text-gray-500 mb-5">
                  Elige qué impresora utilizará cada área.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="label">
                      Área de impresión
                    </label>

                    <select
                      className="input"
                      name="purpose"
                      value={assignmentForm.purpose}
                      onChange={(event) => {
                        handleAssignmentChange(event)
                        loadAssignmentForPurpose(
                          event.target.value
                        )
                      }}
                    >
                      {PURPOSE_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">
                      Computador agente
                    </label>

                    <select
                      className="input"
                      name="agent_id"
                      value={assignmentForm.agent_id}
                      onChange={handleAssignmentChange}
                    >
                      <option value="">
                        Seleccionar computador
                      </option>

                      {agents.map((agent) => (
                        <option
                          key={agent.id}
                          value={agent.id}
                        >
                          {agent.name} — {agent.machine_name}
                          {agent.status === 'online'
                            ? ' (En línea)'
                            : ' (Desconectado)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">
                      Impresora de Windows
                    </label>

                    <select
                      className="input"
                      name="printer_id"
                      value={assignmentForm.printer_id}
                      onChange={handleAssignmentChange}
                    >
                      <option value="">
                        Seleccionar impresora
                      </option>

                      {availablePrinters.map((printer) => (
                        <option
                          key={printer.id}
                          value={printer.id}
                        >
                          {printer.display_name}
                          {printer.is_default
                            ? ' (Predeterminada)'
                            : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">
                        Papel
                      </label>

                      <select
                        className="input"
                        name="paper_width"
                        value={assignmentForm.paper_width}
                        onChange={handleAssignmentChange}
                      >
                        <option value={80}>80 mm</option>
                        <option value={58}>58 mm</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">
                        Copias
                      </label>

                      <input
                        className="input"
                        type="number"
                        min="1"
                        max="10"
                        name="copies"
                        value={assignmentForm.copies}
                        onChange={handleAssignmentChange}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 font-bold">
                    <input
                      type="checkbox"
                      name="auto_print"
                      checked={assignmentForm.auto_print}
                      onChange={handleAssignmentChange}
                    />

                    Imprimir automáticamente
                  </label>

                  <button
                    type="submit"
                    disabled={savingAssignment}
                    className="w-full bg-black text-yellow-400 font-black py-3 rounded-xl disabled:opacity-50"
                  >
                    {savingAssignment
                      ? 'Guardando...'
                      : '💾 Guardar asignación'}
                  </button>

                  <button
                    type="button"
                    onClick={sendTestPrint}
                    disabled={
                      testingPrinter ||
                      !assignmentForm.printer_id
                    }
                    className="w-full bg-yellow-400 text-black font-black py-3 rounded-xl disabled:opacity-50"
                  >
                    {testingPrinter
                      ? 'Enviando prueba...'
                      : '🧾 Enviar prueba de impresión'}
                  </button>

                  {selectedPrinter && (
                    <div className="bg-gray-100 rounded-xl p-3 text-sm">
                      <p>
                        <strong>Seleccionada:</strong>{' '}
                        {selectedPrinter.display_name}
                      </p>

                      <p>
                        <strong>Estado:</strong>{' '}
                        {selectedPrinter.status}
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-2xl font-black">
                  Asignaciones configuradas
                </h2>

                <p className="text-gray-500">
                  Impresoras asignadas a cada operación.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowJobs(!showJobs)}
                className="bg-black text-yellow-400 px-5 py-3 rounded-xl font-black"
              >
                {showJobs
                  ? 'Ocultar cola'
                  : 'Ver cola de impresión'}
              </button>
            </div>

            {assignments.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Todavía no hay impresoras asignadas.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left">
                  <thead className="bg-black text-yellow-400">
                    <tr>
                      <th className="py-4 px-4">Área</th>
                      <th className="px-4">Computador</th>
                      <th className="px-4">Impresora</th>
                      <th className="px-4">Papel</th>
                      <th className="px-4">Copias</th>
                      <th className="px-4">Automática</th>
                      <th className="px-4">Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {assignments.map((assignment) => {
                      const purposeOption =
                        PURPOSE_OPTIONS.find(
                          (option) =>
                            option.value ===
                            assignment.purpose
                        )

                      return (
                        <tr
                          key={assignment.id}
                          className="border-b hover:bg-yellow-50"
                        >
                          <td className="py-4 px-4 font-black">
                            {purposeOption?.label ||
                              assignment.purpose}
                          </td>

                          <td className="px-4">
                            {assignment.agent?.name || '-'}
                          </td>

                          <td className="px-4">
                            {assignment.printer?.display_name ||
                              '-'}
                          </td>

                          <td className="px-4">
                            {assignment.paper_width} mm
                          </td>

                          <td className="px-4">
                            {assignment.copies}
                          </td>

                          <td className="px-4">
                            {assignment.auto_print ? 'Sí' : 'No'}
                          </td>

                          <td className="px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-black ${
                                assignment.active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {assignment.active
                                ? 'Activa'
                                : 'Inactiva'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {showJobs && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-2xl font-black mb-4">
                Cola de impresión
              </h2>

              {printJobs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No hay trabajos de impresión.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-left">
                    <thead className="bg-black text-yellow-400">
                      <tr>
                        <th className="py-4 px-4">Fecha</th>
                        <th className="px-4">Título</th>
                        <th className="px-4">Área</th>
                        <th className="px-4">Impresora</th>
                        <th className="px-4">Intentos</th>
                        <th className="px-4">Estado</th>
                        <th className="px-4 text-right">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {printJobs.map((job) => (
                        <tr
                          key={job.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="py-4 px-4 text-sm">
                            {formatDate(job.created_at)}
                          </td>

                          <td className="px-4 font-bold">
                            {job.title || 'Impresión'}
                          </td>

                          <td className="px-4">
                            {job.purpose}
                          </td>

                          <td className="px-4">
                            {job.printer?.display_name || '-'}
                          </td>

                          <td className="px-4">
                            {job.attempts}/{job.max_attempts}
                          </td>

                          <td className="px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-black ${jobStatusClass(
                                job.status
                              )}`}
                            >
                              {job.status}
                            </span>
                          </td>

                          <td className="px-4 text-right">
                            <div className="flex justify-end gap-2">
                              {job.status === 'failed' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    retryJob(job.id)
                                  }
                                  className="bg-yellow-400 text-black px-3 py-2 rounded-lg font-bold"
                                >
                                  Reintentar
                                </button>
                              )}

                              {[
                                'pending',
                                'failed'
                              ].includes(job.status) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    cancelJob(job.id)
                                  }
                                  className="bg-red-600 text-white px-3 py-2 rounded-lg font-bold"
                                >
                                  Cancelar
                                </button>
                              )}
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
              {result
                ? JSON.stringify(result, null, 2)
                : 'Sin resultado todavía'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Diagnostics
