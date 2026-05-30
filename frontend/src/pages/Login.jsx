import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const Login = () => {
  const [email, setEmail] = useState('americanburgerarica@gmail.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(email, password)
    if (result.success) {
      navigate('/')
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="flex h-screen bg-black">
      {/* Left Side - Logo and Info */}
      <div className="w-1/2 flex flex-col items-center justify-center text-white p-8">
        <img
          src="/logo-american-burger.png"
          alt="American Burger"
          className="w-72 h-72 object-contain mx-auto mb-8"
        />

        <p className="text-2xl font-poppins mb-4">
          Sistema POS Gastronómico
        </p>

        <p className="text-gray-400 text-center max-w-md">
          Gestiona tu negocio de comida rápida de forma profesional y eficiente
        </p>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-1/2 flex items-center justify-center bg-gray-100 p-8">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit}>
            <h3 className="text-3xl font-poppins font-bold text-black mb-8 text-center">
              Iniciar Sesión
            </h3>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="label">Correo Electrónico</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-8">
              <label className="label">Contraseña</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-yellow-400 font-poppins font-bold py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6 text-sm">
            ¿Problemas al iniciar sesión? Contacta al administrador
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
