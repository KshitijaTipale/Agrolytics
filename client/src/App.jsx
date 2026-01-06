import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import FarmerDashboard from './pages/FarmerDashboard'
import FactoryDashboard from './pages/FactoryDashboard'
import FarmerAuth from './pages/FarmerAuth'
import ProtectedRoute from './components/ProtectedRoute'
import FieldDetails from './pages/FieldDetails'

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
        
        <Route path="/factory" element={<FactoryDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
