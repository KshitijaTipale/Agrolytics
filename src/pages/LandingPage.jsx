import { Link } from 'react-router-dom'
import { useState, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { CheckCircle, Star, Menu, X } from 'lucide-react'
import AgroScroll from '../components/AgroScroll'

const benefits = [
  {
    title: 'AI-Powered Yield Prediction',
    description: 'Machine learning models trained on real agricultural data deliver accurate per-acre yield estimates.'
  },
  {
    title: 'Satellite & Weather Integration',
    description: 'Real-time satellite imagery and weather data ensure predictions reflect current field conditions.'
  },
  {
    title: 'Actionable Farm Insights',
    description: 'Get data-driven recommendations to optimize planting, harvest timing, and resource allocation.'
  }
]

const testimonials = [
  {
    name: 'Rajesh Patil',
    rating: 5,
    text: 'Agrolytics helped me plan my harvest logistics much better. The yield prediction was within 5% of actual output — impressive for our region.',
    avatar: 'R'
  },
  {
    name: 'Sunita Deshmukh',
    rating: 5,
    text: 'As a factory manager, knowing expected supply in advance has transformed our scheduling. Agrolytics is a game-changer for the sugar industry.',
    avatar: 'S'
  }
]

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Parallax for benefits section
  const benefitsRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: benefitsRef,
    offset: ['start end', 'end start']
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['-15%', '15%'])
  const textY = useTransform(scrollYProgress, [0, 1], ['0px', '-120px'])

  return (
    <div className="lp-root">
      {/* ─── Navigation ─── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-nav-row">
            {/* Logo */}
            <div className="lp-logo-group">
              <img src="/agrolytics.png" alt="Agrolytics" className="lp-logo-img" />
              <span className="lp-logo-text">Agrolytics</span>
            </div>

            {/* Desktop Links */}
            <div className="lp-nav-links">
              <a href="#home" className="lp-nav-link">Home</a>
              <a href="#how-it-works" className="lp-nav-link">How It Works</a>
              <a href="#features" className="lp-nav-link">Features</a>
              <a href="#testimonials" className="lp-nav-link">Testimonials</a>
            </div>

            {/* CTA Buttons */}
            <div className="lp-nav-cta">
              <Link to="/farmer/auth" className="lp-btn lp-btn-ghost">Farmer Login</Link>
              <Link to="/factory/auth" className="lp-btn lp-btn-primary">Factory Login</Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="lp-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lp-mobile-menu">
            <a href="#home" className="lp-mobile-link" onClick={() => setMobileMenuOpen(false)}>Home</a>
            <a href="#how-it-works" className="lp-mobile-link" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#features" className="lp-mobile-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#testimonials" className="lp-mobile-link" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
            <div className="lp-mobile-cta">
              <Link to="/farmer/auth" className="lp-btn lp-btn-primary lp-btn-block">Farmer Login</Link>
              <Link to="/factory/auth" className="lp-btn lp-btn-outline lp-btn-block">Factory Login</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero Section ─── */}
      <section id="home" className="lp-hero">
        <div className="lp-hero-bg" style={{ backgroundImage: "url('/herobg.png')" }} />
        <div className="lp-hero-content">
          <div className="lp-hero-text">
            <h1 className="lp-hero-title">
              Smart Sugarcane<br />
              <span className="text-accent">Yield Prediction</span>
            </h1>
            <p className="lp-hero-subtitle">
              Agrolytics combines satellite imagery, weather data, and AI to deliver precise sugarcane yield predictions — empowering farmers and factories to plan smarter.
            </p>
            <div className="lp-hero-actions">
              <Link to="/farmer/auth" className="lp-btn lp-btn-hero-primary">
                I'm a Farmer 🌾
              </Link>
              <a href="#how-it-works" className="lp-btn lp-btn-hero-outline">
                <span>👁️</span> See How It Works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <AgroScroll />

      {/* ─── Key Benefits (Parallax) ─── */}
      <section ref={benefitsRef} id="features" className="lp-benefits">
        <motion.div
          className="lp-benefits-bg"
          style={{
            backgroundImage: "url('/benefits.png')",
            y: bgY
          }}
        />
        <motion.div className="lp-benefits-content" style={{ y: textY }}>
          <div className="lp-benefits-inner">
            <h2 className="lp-section-title">
              Why Choose <span className="text-accent">Agrolytics</span>?
            </h2>
            <p className="lp-benefits-desc">
              Data-driven agriculture for better outcomes.
            </p>

            <div className="lp-benefits-list">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="lp-benefit-item">
                  <div className="lp-benefit-icon">
                    <CheckCircle size={20} color="#fff" />
                  </div>
                  <div>
                    <h4 className="lp-benefit-title">{benefit.title}</h4>
                    <p className="lp-benefit-desc">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="lp-benefits-cta">
              <Link to="/farmer/auth" className="lp-btn lp-btn-hero-primary">
                Start Predicting
              </Link>
              <Link to="/factory/auth" className="lp-btn lp-btn-hero-outline">
                Factory Dashboard
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="lp-testimonials">
        <div className="lp-testimonials-bg" style={{ backgroundImage: "url('/feedback.png')" }} />
        <div className="lp-testimonials-content">
          <div className="lp-testimonials-header">
            <h2 className="lp-section-title">
              Trusted by Farmers & <span className="text-accent">Factories</span>
            </h2>
            <p className="lp-testimonials-subtitle">
              Real results from the sugarcane belt.
            </p>
          </div>

          <div className="lp-testimonials-grid">
            {testimonials.map((t) => (
              <div key={t.name} className="lp-testimonial-card">
                <div className="lp-testimonial-header">
                  <div className="lp-avatar">{t.avatar}</div>
                  <div>
                    <h4 className="lp-testimonial-name">{t.name}</h4>
                    <div className="lp-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < t.rating ? 'star-filled' : 'star-empty'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="lp-testimonial-text">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo-group">
            <img src="/agrolytics.png" alt="Agrolytics" className="lp-footer-logo" />
            <span className="lp-footer-brand">Agrolytics</span>
          </div>
          <p className="lp-footer-credit">
            Built with ❤️ for Smart Agriculture
          </p>
          <div className="lp-footer-links">
            <a href="#" className="lp-footer-link">Privacy</a>
            <a href="#" className="lp-footer-link">Terms</a>
            <a href="#" className="lp-footer-link">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
