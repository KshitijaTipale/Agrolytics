import { Link } from 'react-router-dom'

const FactoryDashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <Link to="/" className="back-btn">←</Link>
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Factory Portal</span>
      </div>

      <h1 className="page-title">Factory Overview 🏭</h1>
      
      {/* Content cleared as requested. */}
      <div style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.5 }}>
        <p>Dashboard is empty.</p>
      </div>
    </div>
  )
}

export default FactoryDashboard
