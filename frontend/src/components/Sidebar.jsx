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

    { label: 'Pedidos Externos', path: '/pedidos-externos', icon: '🛵', roles: ['admin', 'cajero'] },
    { label: 'Canales', path: '/canales', icon: '🔌', roles: ['admin'] },

    { label: 'Reportes', path: '/reportes', icon: '📈', roles: ['admin'] },
    { label: 'Usuarios', path: '/usuarios', icon: '👤', roles: ['admin'] },
    { label: 'Configuración', path: '/configuracion', icon: '⚙️', roles: ['admin'] },
    { label: 'Diagnóstico', path: '/diagnostico', icon: '🔧', roles: ['admin'] }
  ]

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user?.role?.toLowerCase())
  )

  const mainMobileItems = filteredMenu.filter((item) =>
    ['/', '/pos/mostrador', '/pos/delivery', '/caja', '/cocina'].includes(item.path)
  )

  const isActive = (path) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path))

  return (
    <>
      <aside className="hidden lg:flex w-64 bg-black text-white shadow-xl flex-col h-screen border-r border-yellow-400 fixed left-0 top-0 z-40">
        <div className="p-4 border-b border-yellow-400">
          <div className="bg-black rounded-2xl p-3 flex flex-col items-center">
            <img src={logo} alt="American Burger" className="w-36 h-auto object-contain mb-2" />

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
          {filteredMenu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
                isActive(item.path)
                  ? 'bg-yellow-400 text-black shadow-md'
                  : 'text-white hover:bg-zinc-900 hover:text-yellow-400'
              }`}
            >
              <span className="text-xl w-6 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
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

      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black border-b border-yellow-400 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="American Burger" className="w-24 h-auto object-contain" />
          <div>
            <p className="text-[10px] tracking-[0.18em] text-gray-400 font-bold">
              SISTEMA POS
            </p>
            <p className="text-xs font-bold text-yellow-400">
              American Burger
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg"
        >
          Salir
        </button>
      </header>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-yellow-400 z-50 grid grid-cols-5">
        {mainMobileItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center py-2 text-[11px] font-bold ${
              isActive(item.path)
                ? 'text-yellow-400 bg-zinc-900'
                : 'text-white'
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="mt-1 truncate max-w-[65px]">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}

export default Sidebar
