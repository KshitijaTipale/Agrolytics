import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const steps = [
  {
    icon: '🔍',
    title: 'Observe',
    description: 'Monitors soil, weather, and crop health continuously.'
  },
  {
    icon: '📋',
    title: 'Recommend',
    description: 'Suggests dynamic irrigation and fertilization actions zone-wise.'
  },
  {
    icon: '🌱',
    title: 'Learn',
    description: 'Analyzes crop responses to improve future decisions.'
  },
  {
    icon: '⚡',
    title: 'Adapt',
    description: 'Optimizes strategies for each zone based on real data.'
  }
]

const AgroScroll = () => {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  })

  const lineHeight = useTransform(scrollYProgress, [0.15, 0.5], ['0%', '100%'])

  return (
    <section id="how-it-works" ref={containerRef} className="agro-scroll-section">
      {/* Video Background */}
      <div className="agro-scroll-video-wrap">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="agro-scroll-video"
        >
          <source src="/Works.mp4" type="video/mp4" />
        </video>
        <div className="agro-scroll-video-overlay" />
      </div>

      {/* Content */}
      <div className="agro-scroll-inner">
        {/* Header */}
        <div className="agro-scroll-header">
          <motion.span
            className="agro-scroll-badge"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Process Overview
          </motion.span>
          <motion.h2
            className="agro-scroll-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            How Agrolytics Makes<br />
            <span className="text-accent-glow">Your Farm Smarter</span>
          </motion.h2>
          <motion.p
            className="agro-scroll-subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            A seamless cycle of intelligence that transforms raw data into actionable insights.
          </motion.p>
        </div>

        {/* Flowing line connector */}
        <div className="agro-flow-line-wrap">
          <motion.div className="agro-flow-line" style={{ height: lineHeight }} />
        </div>

        {/* Step Cards */}
        <div className="agro-steps-grid">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              className="agro-step-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: index * 0.15, ease: 'easeOut' }}
            >
              <div className="agro-step-icon-circle">
                <span>{step.icon}</span>
              </div>
              <h3 className="agro-step-title">{step.title}</h3>
              <p className="agro-step-desc">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AgroScroll
