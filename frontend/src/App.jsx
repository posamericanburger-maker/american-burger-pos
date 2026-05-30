import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import POSMostrador from './pages/POS/POSMostrador'
import POSDelivery from './pages/POS/POSDelivery'
import CashRegister from './pages/CashRegister/CashRegister'
import Kitchen from './pages/Kitchen/Kitchen'
import Products from './pages/Products/Products'
import Categories from './pages/Products/Categories'
import Combos from './pages/Products/Combos'
import Inventory from './pages/Inventory/Inventory'
import Customers from './pages/Customers/Customers'
import Orders from './pages/Orders/Orders'
import Reports from './pages/Reports/Reports'
import Users from './pages/Users/Users'
import BusinessSettings from './pages/Settings/BusinessSettings'
import Diagnostics from './pages/Diagnostics/Diagnostics'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/pos/mostrador" element={<ProtectedRoute roles={['cajero', 'admin']}><POSMostrador /></ProtectedRoute>} />
          <Route path="/pos/delivery" element={<ProtectedRoute roles={['cajero', 'admin']}><POSDelivery /></ProtectedRoute>} />
          <Route path="/caja" element={<ProtectedRoute roles={['cajero', 'admin']}><CashRegister /></ProtectedRoute>} />
          <Route path="/cocina" element={<ProtectedRoute roles={['cocina', 'admin']}><Kitchen /></ProtectedRoute>} />
          <Route path="/productos" element={<ProtectedRoute roles={['admin']}><Products /></ProtectedRoute>} />
          <Route path="/categorias" element={<ProtectedRoute roles={['admin']}><Categories /></ProtectedRoute>} />
          <Route path="/combos" element={<ProtectedRoute roles={['admin']}><Combos /></ProtectedRoute>} />
          <Route path="/inventario" element={<ProtectedRoute roles={['admin']}><Inventory /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute roles={['cajero', 'admin']}><Customers /></ProtectedRoute>} />
          <Route path="/pedidos" element={<ProtectedRoute roles={['cajero', 'admin']}><Orders /></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute roles={['admin']}><Reports /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
          <Route path="/configuracion" element={<ProtectedRoute roles={['admin']}><BusinessSettings /></ProtectedRoute>} />
          <Route path="/diagnostico" element={<ProtectedRoute roles={['admin']}><Diagnostics /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
