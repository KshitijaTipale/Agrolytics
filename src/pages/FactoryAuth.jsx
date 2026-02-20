import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const FactoryAuth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Form States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [factoryName, setFactoryName] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
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
        navigate('/factory')
      } else {
        // Signup Logic
        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'sugar_factory',
              full_name: factoryName,
              factory_name: factoryName,
              registration_number: registrationNumber,
            },
          },
        })
        if (error) throw error
        
        // Manually update the specific table because the trigger isn't smart enough
        if (authData.user) {
             const { error: updateError } = await supabase
                .from('sugar_factories')
                .update({ 
                    factory_name: factoryName,
                    registration_number: registrationNumber
                })
                .eq('id', authData.user.id)
             
             if (updateError) {
                console.error("Error updating factory details:", updateError)
                // We don't block navigation, but we log the error
             }
        }
        
        navigate('/factory')
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
                {isLogin ? 'Factory Login' : 'Register Factory'}
            </h2>

            {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {!isLogin && (
                    <>
                        <input 
                            type="text" 
                            placeholder="Factory Name" 
                            value={factoryName}
                            onChange={(e) => setFactoryName(e.target.value)}
                            required
                            style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #ccc' }}
                        />
                        <input 
                            type="text" 
                            placeholder="Registration Number" 
                            value={registrationNumber}
                            onChange={(e) => setRegistrationNumber(e.target.value)}
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
                    {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register Factory')}
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                    {isLogin ? "New Factory? " : "Already Registered? "}
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
                    {isLogin ? 'Register' : 'Login'}
                </button>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>← Back to Home</Link>
            </div>
        </div>
    </div>
  )
}

export default FactoryAuth
