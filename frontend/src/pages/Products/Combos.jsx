import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const Combos = () => {
  return (
    <div className="page-container">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Gestión de Combos" />
        <div className="main-content">
          <div className="card">
            <h2 className="text-2xl font-poppins font-bold mb-4">Combos</h2>
            <p className="text-gray-600">Módulo de combos en desarrollo...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Combos
