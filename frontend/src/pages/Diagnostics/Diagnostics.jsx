import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_URL = import.meta.env.VITE_API_URL || 'https://american-burger-pos-api-d8r1.onrender.com/api'

const Diagnostics = () => {
  const [status, setStatus] = useState('Probando...')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

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
    } catch (err) {
      setError(err.message || 'No se pudo conectar')
      setStatus('Error')
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="page-container">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Diagnóstico del Sistema" />

        <div className="main-content space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <p className="text-gray-500">Estado API</p>
              <h2 className={`text-3xl font-bold ${status === 'OK' ? 'text-green-600' : 'text-red-600'}`}>
                {status}
              </h2>
            </div>

            <div className="card">
              <p className="text-gray-500">Backend</p>
              <h2 className="text-xl font-bold break-all">
                {API_URL}
              </h2>
            </div>

            <div className="card">
              <p className="text-gray-500">Render</p>
              <h2 className="text-3xl font-bold text-green-600">
                Activo
              </h2>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="card">
            <h2 className="text-2xl font-poppins font-bold mb-4">
              Diagnóstico
            </h2>

            <p className="text-gray-600 mb-6">
              Prueba la conexión entre el frontend y el backend.
            </p>

            <button
              onClick={testConnection}
              className="bg-black text-yellow-400 font-poppins font-bold px-5 py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition-all mb-6"
            >
              Probar conexión
            </button>

            <pre className="bg-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
              {result ? JSON.stringify(result, null, 2) : 'Sin resultado todavía'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Diagnostics
