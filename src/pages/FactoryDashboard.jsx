import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { Users, LayoutDashboard, Map as MapIcon, Sprout, TrendingUp, Search, Filter } from 'lucide-react'

const FactoryDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [factoryName, setFactoryName] = useState('Factory Admin')

  // Data States
  const [fields, setFields] = useState([])
  const [farmersMap, setFarmersMap] = useState(new Map()) // Map of farmerId -> { name, totalArea, fieldCount }
  const [metrics, setMetrics] = useState({
    totalFarmers: 0,
    totalFields: 0,
    totalArea: 0,
    estTotalYield: 0
  })

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/factory/auth')
        return
      }

      // 1. Fetch Factory Profile
      if (user.user_metadata?.factory_name) {
        setFactoryName(user.user_metadata.factory_name)
      } else {
        const { data: factoryProfile } = await supabase
          .from('sugar_factories')
          .select('factory_name')
          .eq('id', user.id)
          .single()
        if (factoryProfile?.factory_name) {
          setFactoryName(factoryProfile.factory_name)
        }
      }

      // 2. Fetch all fields
      // Using a broad query since specific factory-farmer linking wasn't found in schema.
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('fields')
        .select(`
          id,
          name,
          area_size,
          created_at,
          farmer_id,
          field_details ( taluka, variety, season ),
          farmers:farmer_id ( users ( full_name ) )
        `)

      if (fieldsError) throw fieldsError

      const fetchedFields = fieldsData || []

      // 3. Process Data for Metrics and Farmers Directory
      let tArea = 0
      const fMap = new Map()

      const processedFields = fetchedFields.map(field => {
        // Attempt to extract farmer name from nested relational data, fallback to generic
        let fName = 'Unknown Farmer'

        if (field.farmers) {
          if (field.farmers.users && field.farmers.users.full_name) {
            fName = field.farmers.users.full_name
          } else if (field.farmers.full_name) {
            fName = field.farmers.full_name // if linked straight to users table structure
          }
        }

        const area = parseFloat(field.area_size) || 0
        tArea += area

        // Aggregate farmer data
        if (!fMap.has(field.farmer_id)) {
          fMap.set(field.farmer_id, {
            id: field.farmer_id,
            name: fName,
            totalArea: 0,
            fieldCount: 0
          })
        }

        const farmerData = fMap.get(field.farmer_id)
        farmerData.totalArea += area
        farmerData.fieldCount += 1

        // Try to safely access field_details which might be an array or object
        const detailsObj = Array.isArray(field.field_details) ? field.field_details[0] : field.field_details

        return {
          ...field,
          farmerName: fName,
          taluka: detailsObj?.taluka || 'Unknown Location',
          variety: detailsObj?.variety || 'Not specify',
          area: area.toFixed(2)
        }
      })

      // Assuming average yield of 45 tonnes per acre for simple estimation if real ML data isn't joined
      const tYield = tArea * 45

      setFields(processedFields)
      setFarmersMap(fMap)
      setMetrics({
        totalFarmers: fMap.size,
        totalFields: processedFields.length,
        totalArea: tArea.toFixed(2),
        estTotalYield: tYield.toFixed(0)
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  // Derived state for filtered farmers
  const filteredFarmers = Array.from(farmersMap.values()).filter(farmer =>
    (farmer.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="dashboard-container" style={{ paddingBottom: '3rem' }}>

      {/* HEADER */}
      <div className="bento-header-card" style={{ marginBottom: '2rem' }}>
        <div className="header-bg-glow"></div>
        <div className="header-content-flex" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <div>
            <div className="field-badge" style={{ marginBottom: '0.5rem', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              Factory Portal
            </div>
            <h1 className="field-title" style={{ fontSize: '2.5rem' }}>
              {factoryName} <span style={{ fontSize: '2rem' }}>🏭</span>
            </h1>
            <p style={{ color: '#666', marginTop: '0.5rem' }}>
              Operational Overview &bull; {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button onClick={handleLogout} className="logout-btn-subtle" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state" style={{ marginTop: '4rem' }}>
          <Sprout className="spin-slow" size={48} color="#4CAF50" />
          <p style={{ marginTop: '1rem', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Compiling factory data...</p>
        </div>
      ) : (
        <>
          {/* METRICS GRID */}
          <div className="bento-grid" style={{ marginBottom: '2rem' }}>

            {/* Est Total Yield (Hero Card Style) */}
            <div className="bento-card hero-card" style={{ gridColumn: 'span 2' }}>
              <div className="card-bg-glow" style={{ background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.15), transparent 60%)' }}></div>
              <div className="hero-content">
                <div className="hero-top">
                  <div className="icon-box blue" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                    <TrendingUp size={24} />
                  </div>
                  <span className="card-label">Est. Total Expected Yield</span>
                </div>
                <div className="hero-main">
                  <h1 className="hero-value">{metrics.estTotalYield}</h1>
                  <span className="hero-unit">Tonnes</span>
                </div>
                <div className="hero-footer">
                  <span>Based on aggregate field acreage</span>
                </div>
              </div>
            </div>

            {/* Total Farmers */}
            <div className="bento-card info-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="icon-box purple" style={{ marginBottom: '1rem' }}><Users size={24} /></div>
              <span className="card-label" style={{ marginBottom: '0.5rem' }}>Registered Farmers</span>
              <h3 className="info-value" style={{ fontSize: '2.5rem' }}>{metrics.totalFarmers}</h3>
            </div>

            {/* Total Area */}
            <div className="bento-card context-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="icon-box green" style={{ marginBottom: '1rem' }}><MapIcon size={24} /></div>
              <span className="card-label" style={{ marginBottom: '0.5rem' }}>Total Cultivation Area</span>
              <h3 className="info-value" style={{ fontSize: '2.5rem' }}>{metrics.totalArea} <small style={{ fontSize: '1rem' }}>Acres</small></h3>
            </div>

          </div>

          {/* TWO COLUMN LAYOUT: Active Fields & Farmers Directory */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>

            {/* Active Fields Table */}
            <div className="bento-section-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <LayoutDashboard size={20} color="var(--primary)" /> Active Fields ({metrics.totalFields})
                </h3>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Field Name</th>
                      <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Farmer</th>
                      <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Location</th>
                      <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Area</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map(field => (
                      <tr key={field.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>{field.name}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{field.farmerName}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span style={{ background: 'var(--surface-bg)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {field.taluka}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--primary)', fontWeight: 600 }}>{field.area} ac</td>
                      </tr>
                    ))}
                    {fields.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No fields registered yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Farmers Directory */}
            <div className="bento-section-card" style={{ padding: '1.5rem', background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Users size={20} color="#8B5CF6" /> Connected Farmers
                </h3>
                <div style={{ position: 'relative', flex: '1 1 auto', maxWidth: '200px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    placeholder="Search farmers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      padding: '0.5rem 0.5rem 0.5rem 2.2rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface-bg)',
                      width: '100%',
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {filteredFarmers.map(farmer => (
                  <div key={farmer.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--surface-bg)', borderRadius: '12px', border: '1px solid var(--border)', transition: 'transform 0.2s', cursor: 'default' }} className="farmer-card-hover">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '42px', height: '42px', background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {(farmer.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '600' }}>{farmer.name || 'Unknown Farmer'}</h4>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {farmer.fieldCount} Field{farmer.fieldCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>{farmer.totalArea.toFixed(2)} Acres</span>
                      <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem', marginTop: '0.2rem' }}>
                        <TrendingUp size={12} /> {(farmer.totalArea * 45).toFixed(0)} T
                      </span>
                    </div>
                  </div>
                ))}
                {filteredFarmers.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', background: 'var(--surface-bg)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                    <Users size={32} style={{ margin: '0 0 1rem 0', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>No farmers found matching your search.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}
{/* test Changes */}
    </div>
  )
}

export default FactoryDashboard
