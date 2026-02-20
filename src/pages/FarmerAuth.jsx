import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const FarmerAuth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Form States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState(null)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        navigate('/farmer')
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              mobile: mobile,
              role: 'farmer',
            },
          },
        })
        if (error) throw error
        navigate('/farmer')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Video Background */}
      <div className="auth-video-wrap">
        <video autoPlay loop muted playsInline className="auth-video">
          <source src="/Works.mp4" type="video/mp4" />
        </video>
        <div className="auth-video-overlay" />
      </div>

      {/* Auth Card */}
      <div className="auth-card">
        <div className="auth-logo-group">
          <img src="/agrolytics.png" alt="Agrolytics" className="auth-logo" />
          <span className="auth-brand">Agrolytics</span>
        </div>

        <h2 className="auth-title">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="auth-subtitle">
          {isLogin ? 'Sign in to access your farm dashboard' : 'Join Agrolytics for smart yield predictions'}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleAuth} className="auth-form">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="auth-input"
              />
              <input
                type="tel"
                placeholder="Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="auth-input"
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
          />

          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-toggle">
          <span>{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
          <button onClick={() => setIsLogin(!isLogin)} className="auth-toggle-btn">
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </div>

        <div className="auth-back">
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}

export default FarmerAuth
