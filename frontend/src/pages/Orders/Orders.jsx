import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const Orders = () => {
  return (
    <div className="page-container">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Gestión de Pedidos" />
        <div className="main-content">
          <div className="card">
            <h2 className="text-2xl font-poppins font-bold mb-4">Pedidos</h2>
            <p className="text-gray-600">Módulo de pedidos en desarrollo...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Orders
