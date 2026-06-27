import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import logo from '../NNN.png'

const Sidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
    { label: 'Finanzas', path: '/finanzas', icon: '📊', roles: ['admin'] },
    { label: 'Categorías', path: '/categorias', icon: '📂', roles: ['admin'] },
    { label: 'Combos', path: '/combos', icon: '🍱', roles: ['admin'] },
    { label: 'Inventario', path: '/inventario', icon: '📈', roles: ['admin'] },
    { label: 'Clientes', path: '/clientes', icon: '👥', roles: ['admin', 'cajero'] },
    { label: 'Pedidos', path: '/pedidos', icon: '📋', roles: ['admin', 'cajero'] },
    { label: 'Reportes', path: '/reportes', icon: '📈', roles: ['admin'] },
    { label: 'Usuarios', path: '/usuarios', icon: '👤', roles: ['admin'] },
    { label: 'Configuración', path: '/configuracion', icon: '⚙️', roles: ['admin'] },
    { label: 'Diagnóstico', path: '/diagnostico', icon: '🔧', roles: ['admin'] }
  ]

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user?.role?.toLowerCase())
  )

  return (
    <aside className="w-64 bg-black text-white shadow-xl flex flex-col h-screen border-r border-yellow-400">
      <div className="p-4 border-b border-yellow-400">
        <div className="bg-black rounded-2xl p-3 flex flex-col items-center">
          <img
            src={logo}
            alt="American Burger"
            className="w-36 h-auto object-contain mb-2"
          />

          <div className="text-center">
            <p className="text-[11px] tracking-[0.25em] text-gray-400 font-bold">
              SISTEMA POS
            </p>
            <p className="text-sm font-bold text-yellow-400">
              American Burger
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredMenu.map((item) => {
          const active =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
                active
                  ? 'bg-yellow-400 text-black shadow-md'
                  : 'text-white hover:bg-zinc-900 hover:text-yellow-400'
              }`}
            >
              <span className="text-xl w-6 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-yellow-400 p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 mb-3">
          <p className="text-xs text-gray-400">Sesión</p>
          <p className="text-sm font-bold text-yellow-400 leading-tight">
            {user?.full_name || 'Administrador American Burger'}
          </p>
          <p className="text-xs text-gray-400 capitalize mt-1">
            {user?.role || 'admin'}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all"
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
