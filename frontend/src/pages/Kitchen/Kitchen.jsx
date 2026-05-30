import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const Kitchen = () => {
  return (
    <div className="page-container">
      <Sidebar />
      <div className="page-content">
        <Navbar title="KDS - Cocina" />
        <div className="main-content">
          <div className="card">
            <h2 className="text-2xl font-poppins font-bold mb-4">KDS - Kitchen Display System</h2>
            <p className="text-gray-600">Pantalla de cocina en desarrollo...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Kitchen
