import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const Categories = () => {
  return (
    <div className="page-container">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Gestión de Categorías" />
        <div className="main-content">
          <div className="card">
            <h2 className="text-2xl font-poppins font-bold mb-4">Categorías</h2>
            <p className="text-gray-600">Módulo de categorías en desarrollo...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Categories
