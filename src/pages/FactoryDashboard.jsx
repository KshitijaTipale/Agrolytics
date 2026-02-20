import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const FactoryDashboard = () => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Factory Portal</span>
        <button 
          onClick={handleLogout}
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            color: 'var(--error)',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Logout
        </button>
      </div>

      <h1 className="page-title">Factory Overview 🏭</h1>

      {/* Content cleared as requested. */}
      {/*I am kshitija */}
      <div style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.5 }}>
        <p>Dashboard is empty.</p>
      </div>
    </div>
  )
}

export default FactoryDashboard
