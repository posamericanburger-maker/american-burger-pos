import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import useAuth from '../hooks/useAuth'

const Dashboard = () => {
  const { user } = useAuth()

  return (
    <div className="page-container">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Dashboard" />
        <div className="main-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="card">
              <div className="text-gray-600 text-sm font-medium">Ventas Hoy</div>
              <div className="text-3xl font-poppins font-bold text-black mt-2">$0</div>
              <div className="text-xs text-gray-500 mt-1">+0% vs ayer</div>
            </div>
            <div className="card">
              <div className="text-gray-600 text-sm font-medium">Pedidos</div>
              <div className="text-3xl font-poppins font-bold text-black mt-2">0</div>
              <div className="text-xs text-gray-500 mt-1">Activos</div>
            </div>
            <div className="card">
              <div className="text-gray-600 text-sm font-medium">Estado Caja</div>
              <div className="text-3xl font-poppins font-bold text-red-600 mt-2">CERRADA</div>
              <div className="text-xs text-gray-500 mt-1">Abre caja para vender</div>
            </div>
            <div className="card">
              <div className="text-gray-600 text-sm font-medium">Productos</div>
              <div className="text-3xl font-poppins font-bold text-black mt-2">0</div>
              <div className="text-xs text-gray-500 mt-1">En stock</div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-2xl font-poppins font-bold mb-4">Bienvenido, {user?.full_name}!</h2>
            <p className="text-gray-600">Sistema completamente funcional y listo para usar.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
