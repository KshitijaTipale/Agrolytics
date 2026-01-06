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
        // Login Logic
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        navigate('/farmer')
      } else {
        // Signup Logic
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
        navigate('/farmer') // Or show "Check email" if email confirm is on
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing-container" style={{ minHeight: '100vh', justifyContent: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2rem', margin: '0 auto' }}>
            
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.8rem' }}>
                {isLogin ? 'Farmer Login' : 'Create Account'}
            </h2>

            {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {!isLogin && (
                    <>
                        <input 
                            type="text" 
                            placeholder="Full Name" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #ccc' }}
                        />
                        <input 
                            type="tel" 
                            placeholder="Mobile Number" 
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            required
                            style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #ccc' }}
                        />
                    </>
                )}

                <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #ccc' }}
                />
                
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #ccc' }}
                />

                <button 
                    type="submit" 
                    disabled={loading}
                    style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'var(--primary)',
                        color: 'white',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginTop: '0.5rem'
                    }}
                >
                    {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                </span>
                <button 
                    onClick={() => setIsLogin(!isLogin)}
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--primary)', 
                        fontWeight: '600',
                        textDecoration: 'underline'
                    }}
                >
                    {isLogin ? 'Sign Up' : 'Login'}
                </button>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>← Back to Home</Link>
            </div>
        </div>
    </div>
  )
}

export default FarmerAuth
