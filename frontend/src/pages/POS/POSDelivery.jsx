import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const POSDelivery = () => {
  return (
    <div className="page-container">
      <Sidebar />
      <div className="page-content">
        <Navbar title="POS - Delivery" />
        <div className="main-content">
          <div className="card">
            <h2 className="text-2xl font-poppins font-bold mb-4">Punto de Venta - Delivery</h2>
            <p className="text-gray-600">Módulo de ventas para delivery en desarrollo...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default POSDelivery
