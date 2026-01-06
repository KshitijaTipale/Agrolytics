import { Link } from 'react-router-dom'

const LandingPage = () => {
  return (
    <div className="landing-container">
      <div className="landing-header">
        <h1 className="app-title">Agrolytics</h1>
        <p className="app-subtitle">Smart Yield Prediction</p>
      </div>

      <div className="role-selection">
        <Link to="/farmer" className="role-card glass-card">
          <div className="role-icon-box">🌾</div>
          <div className="role-info">
            <h3>Farmer</h3>
            <p>Predict yield for your land</p>
          </div>
        </Link>

        <Link to="/factory" className="role-card glass-card">
          <div className="role-icon-box">🏭</div>
          <div className="role-info">
            <h3>Factory</h3>
            <p>Monitor regional supply</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default LandingPage
