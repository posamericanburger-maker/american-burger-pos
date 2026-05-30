import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const Diagnostics = () => {
  return (
    <div className="page-container">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Diagnóstico del Sistema" />
        <div className="main-content">
          <div className="card">
            <h2 className="text-2xl font-poppins font-bold mb-4">Diagnóstico</h2>
            <p className="text-gray-600">Módulo de diagnóstico en desarrollo...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Diagnostics
