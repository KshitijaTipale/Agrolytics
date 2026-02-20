import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import FarmerDashboard from './pages/FarmerDashboard'
import FactoryDashboard from './pages/FactoryDashboard'
import FarmerAuth from './pages/FarmerAuth'
import ProtectedRoute from './components/ProtectedRoute'
import FieldDetails from './pages/FieldDetails'
import FactoryAuth from './pages/FactoryAuth'
import FactoryProtectedRoute from './components/FactoryProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth Route */}
        <Route path="/farmer/auth" element={<FarmerAuth />} />
        
        {/* Protected Dashboard */}
        <Route 
          path="/farmer" 
          element={
            <ProtectedRoute>
              <FarmerDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Field Details */}
        <Route 
          path="/farmer/field/:id" 
          element={
            <ProtectedRoute>
              <FieldDetails />
            </ProtectedRoute>
          } 
        />
        

        {/* Factory Routes */}
        <Route path="/factory/auth" element={<FactoryAuth />} />
        
        <Route 
          path="/factory" 
          element={
            <FactoryProtectedRoute>
              <FactoryDashboard />
            </FactoryProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  )
}

export default App
