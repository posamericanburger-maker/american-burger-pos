import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import logo from '../NNN.png'

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
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* PANEL IZQUIERDO */}
      <div className="w-full lg:w-1/2 bg-black flex flex-col items-center justify-center px-8 py-12">

        <img
          src={logo}
          alt="American Burger"
          className="w-48 sm:w-64 lg:w-[420px] h-auto object-contain mb-8"
        />

        <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-black text-center leading-tight">
          Sistema POS
          <br />
          Gastronómico
        </h1>

        <p className="text-gray-400 text-center mt-6 max-w-md text-base sm:text-lg">
          Gestiona tu negocio de comida rápida de forma profesional y eficiente.
        </p>

      </div>

      {/* PANEL DERECHO */}
      <div className="w-full lg:w-1/2 bg-gray-100 flex items-center justify-center px-5 py-10">

        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-10">

          <h2 className="text-4xl font-black text-center mb-8">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-300 rounded-xl p-3 mb-5 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="mb-5">

              <label className="block mb-2 font-semibold">
                Correo Electrónico
              </label>

              <input
                type="email"
                className="w-full rounded-xl border border-gray-300 px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

            </div>

            <div className="mb-8">

              <label className="block mb-2 font-semibold">
                Contraseña
              </label>

              <input
                type="password"
                className="w-full rounded-xl border border-gray-300 px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black text-yellow-400 py-4 text-xl font-bold hover:bg-yellow-400 hover:text-black transition"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>

          </form>

          <p className="text-center text-gray-500 mt-8">
            ¿Problemas al iniciar sesión?
            <br />
            Contacta al administrador.
          </p>

        </div>

      </div>

    </div>
  )
}

export default Login
