import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const Sidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: '📊', roles: ['admin', 'cajero', 'cocina'] },
    { label: 'Mostrador', path: '/pos/mostrador', icon: '🛒', roles: ['admin', 'cajero'] },
    { label: 'Delivery', path: '/pos/delivery', icon: '🚗', roles: ['admin', 'cajero'] },
    { label: 'Caja', path: '/caja', icon: '💰', roles: ['admin', 'cajero'] },
    { label: 'Cocina', path: '/cocina', icon: '👨‍🍳', roles: ['admin', 'cocina'] },
    { label: 'Productos', path: '/productos', icon: '📦', roles: ['admin'] },
    { label: 'Categorías', path: '/categorias', icon: '📂', roles: ['admin'] },
    { label: 'Combos', path: '/combos', icon: '🍱', roles: ['admin'] },
    { label: 'Inventario', path: '/inventario', icon: '📈', roles: ['admin'] },
    { label: 'Clientes', path: '/clientes', icon: '👥', roles: ['admin', 'cajero'] },
    { label: 'Pedidos', path: '/pedidos', icon: '📋', roles: ['admin', 'cajero'] },
    { label: 'Reportes', path: '/reportes', icon: '📈', roles: ['admin'] },
    { label: 'Usuarios', path: '/usuarios', icon: '👤', roles: ['admin'] },
    { label: 'Configuración', path: '/configuracion', icon: '⚙️', roles: ['admin'] },
    { label: 'Diagnóstico', path: '/diagnostico', icon: '🔧', roles: ['admin'] },
  ]

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role?.toLowerCase()))

  return (
    <aside className="w-64 bg-black text-white shadow-lg flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-yellow-400">
        <div className="text-center">
          <div className="text-4xl mb-2">🍔</div>
          <h1 className="text-xl font-poppins font-bold text-yellow-400">AMERICAN</h1>
          <h2 className="text-xl font-poppins font-bold text-yellow-400">BURGER</h2>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        {filteredMenu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-yellow-400 hover:text-black transition-all mb-2"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Info */}
      <div className="border-t border-yellow-400 p-4">
        <div className="bg-gray-800 rounded-lg p-3 mb-3">
          <p className="text-xs text-gray-400">Sesión</p>
          <p className="text-sm font-poppins font-bold text-yellow-400">{user?.full_name}</p>
          <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
