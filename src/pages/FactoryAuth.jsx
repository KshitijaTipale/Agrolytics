import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { Factory, Truck, BarChart3, ShieldCheck, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 120 } }
  }

  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "easeIn" } }
  }

  return (
    <div className="factory-auth-split">
      {/* LEFT SIDE: Value Prop & Image */}
      <div className="factory-auth-hero">
        <motion.div
          className="factory-auth-bg"
          style={{ backgroundImage: `url('/new_factory_dashboard_bg.png')` }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        ></motion.div>
        <div className="factory-auth-overlay"></div>

        <motion.div
          className="factory-auth-hero-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="auth-logo-group" style={{ justifyContent: 'flex-start', marginBottom: '3rem' }}>
            <img src="/agrolytics.png" alt="Agrolytics" className="auth-logo" style={{ width: '42px', height: '42px' }} />
            <span className="auth-brand" style={{ fontSize: '1.5rem', fontWeight: '800' }}>Agrolytics</span>
          </motion.div>

          <motion.div variants={itemVariants} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(59,130,246,0.3)', marginBottom: '1.5rem' }}>
            <ShieldCheck size={16} /> Trusted by Top Sugar Mills
          </motion.div>

          <motion.h1 variants={itemVariants} className="hero-title" style={{ fontSize: '3.5rem', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-1px' }}>
            Smart Factory Management <br />
            <span style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Powered by AI.</span>
          </motion.h1>
          <motion.p variants={itemVariants} style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', maxWidth: '400px', lineHeight: 1.6, marginBottom: '3rem' }}>
            Join our platform to optimize cane procurement, monitor supply chains in real-time, and maximize factory efficiency with data-driven insights.
          </motion.p>

          <div className="feature-badges" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.03, x: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}
              className="feature-badge"
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '350px', cursor: 'default' }}
            >
              <div style={{ background: 'rgba(16,185,129,0.2)', padding: '10px', borderRadius: '10px' }}><Factory size={24} color="#34d399" /></div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '1rem' }}>Smart Procurement</h4>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Ensure timely and steady cane supply.</p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.03, x: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}
              className="feature-badge"
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '350px', cursor: 'default' }}
            >
              <div style={{ background: 'rgba(59,130,246,0.2)', padding: '10px', borderRadius: '10px' }}><Truck size={24} color="#60a5fa" /></div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '1rem' }}>Live Harvesting Tracking</h4>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Monitor real-time status of harvesting areas.</p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.03, x: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}
              className="feature-badge"
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '350px', cursor: 'default' }}
            >
              <div style={{ background: 'rgba(245,158,11,0.2)', padding: '10px', borderRadius: '10px' }}><BarChart3 size={24} color="#fbbf24" /></div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '1rem' }}>Yield Analytics</h4>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Data-backed estimates for total processing.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT SIDE: Auth Form */}
      <div className="factory-auth-sidebar">
        <motion.div
          className="factory-auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="auth-header-mobile" style={{ display: 'none', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', justifyContent: 'center' }}>
            <img src="/agrolytics.png" alt="Agrolytics" className="auth-logo" style={{ width: '32px', height: '32px' }} />
            <span className="auth-brand" style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white' }}>Agrolytics</span>
          </div>

          <h2 className="auth-title" style={{ textAlign: 'left', marginBottom: '0.5rem', fontSize: '2rem', color: 'white' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="auth-subtitle" style={{ textAlign: 'left', marginBottom: '2rem', color: '#94a3b8' }}>
            {isLogin ? 'Sign in to access your factory dashboard' : 'Join Agrolytics and streamline procurement'}
          </p>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="auth-error"
                style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuth} className="auth-form-modern">
            <AnimatePresence mode="sync">
              {!isLogin && (
                <motion.div
                  key="signup-fields"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ display: 'flex', gap: '1rem', overflow: 'hidden' }}
                >
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Factory Name</label>
                    <motion.input whileFocus={{ scale: 1.02 }} type="text" placeholder="Agro Mill" value={factoryName} onChange={(e) => setFactoryName(e.target.value)} required className="auth-input-modern" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Reg. Number</label>
                    <motion.input whileFocus={{ scale: 1.02 }} type="text" placeholder="MH-SUGAR-123" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} required className="auth-input-modern" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div layout>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Email Address</label>
              <motion.input whileFocus={{ scale: 1.02 }} type="email" placeholder="factory@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="auth-input-modern" />
            </motion.div>

            <motion.div layout>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Password</label>
              <motion.input whileFocus={{ scale: 1.02 }} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="auth-input-modern" />
            </motion.div>

            <motion.button
              layout
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="auth-submit-modern"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In to Dashboard' : 'Complete Registration')} <ArrowRight size={18} />
            </motion.button>
          </form>

          <motion.div layout style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#94a3b8' }}>
            {isLogin ? "New Factory? " : "Already Registered? "}
            <button onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </motion.div>

          <motion.div layout style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link to="/" style={{ color: '#64748b', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              ← Back to Home
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        .factory-auth-split {
          display: flex;
          min-height: 100vh;
          background: #0f172a;
          font-family: 'Outfit', sans-serif;
        }

        .factory-auth-hero {
          flex: 1;
          position: relative;
          display: none;
          overflow: hidden;
        }

        .factory-auth-bg {
          position: absolute;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 0;
        }

        .factory-auth-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.6) 100%);
          z-index: 1;
        }

        .factory-auth-hero-content {
          position: relative;
          z-index: 2;
          padding: 4rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .factory-auth-sidebar {
          width: 100%;
          max-width: 500px;
          background: rgba(30,41,59,0.5);
          backdrop-filter: blur(20px);
          border-left: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          z-index: 10;
        }

        .factory-auth-card {
          width: 100%;
          max-width: 400px;
        }

        .auth-form-modern {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .auth-input-modern {
          width: 100%;
          padding: 0.8rem 1rem;
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: white;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .auth-input-modern:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
          background: rgba(15,23,42,0.8);
        }

        .auth-submit-modern {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
          box-shadow: 0 4px 15px rgba(37,99,235,0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .auth-submit-modern:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (min-width: 900px) {
          .factory-auth-hero {
            display: flex;
          }
        }

        @media (max-width: 899px) {
          .factory-auth-sidebar {
            max-width: 100%;
            background: #0f172a; /* Solid bg on mobile */
          }
          .auth-header-mobile {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}

export default FactoryAuth
