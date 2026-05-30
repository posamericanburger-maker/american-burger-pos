import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="text-yellow-400 text-5xl mb-4">🍔</div>
          <div className="text-white text-2xl font-poppins font-bold">AMERICAN BURGER</div>
          <div className="text-white text-sm mt-4">Cargando...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles.length > 0 && !roles.includes(user?.role?.toLowerCase())) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
