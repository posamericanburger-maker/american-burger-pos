import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const Inventory = () => {
  return (
    <div className="page-container">
      <Sidebar />
      <div className="page-content">
        <Navbar title="Gestión de Inventario" />

        <div className="main-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <p className="text-gray-500">Stock total</p>
              <h2 className="text-3xl font-bold">0</h2>
            </div>

            <div className="card">
              <p className="text-gray-500">Stock crítico</p>
              <h2 className="text-3xl font-bold text-red-600">0</h2>
            </div>

            <div className="card">
              <p className="text-gray-500">Insumos</p>
              <h2 className="text-3xl font-bold">0</h2>
            </div>

            <div className="card">
              <p className="text-gray-500">Estado</p>
              <h2 className="text-3xl font-bold text-green-600">OK</h2>
            </div>
          </div>

          <div className="card">
            <h2 className="text-2xl font-poppins font-bold mb-4">
              Inventario
            </h2>

            <p className="text-gray-600 mb-6">
              Control de stock, insumos, mínimos y estado del inventario.
            </p>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3">Insumo / Producto</th>
                  <th>Stock actual</th>
                  <th>Stock mínimo</th>
                  <th>Unidad</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                <tr className="border-b">
                  <td className="py-3 font-semibold">Carne hamburguesa</td>
                  <td>0</td>
                  <td>5</td>
                  <td>kg</td>
                  <td className="text-red-600 font-bold">Crítico</td>
                </tr>

                <tr className="border-b">
                  <td className="py-3 font-semibold">Pan brioche</td>
                  <td>0</td>
                  <td>20</td>
                  <td>unid.</td>
                  <td className="text-red-600 font-bold">Crítico</td>
                </tr>

                <tr className="border-b">
                  <td className="py-3 font-semibold">Queso cheddar</td>
                  <td>0</td>
                  <td>20</td>
                  <td>láminas</td>
                  <td className="text-red-600 font-bold">Crítico</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Inventory
