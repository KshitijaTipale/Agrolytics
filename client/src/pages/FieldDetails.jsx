import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import FieldConfigurationForm from '../components/FieldConfigurationForm'
import PredictionPanel from '../components/PredictionPanel'

const FieldDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [field, setField] = useState(null)
  const [details, setDetails] = useState(null) // Field Details (Crop info)
  const [farmerName, setFarmerName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const [activeTab, setActiveTab] = useState('dashboard') // Default to Dashboard as accessed via Dashboard
  
  // Navigation Items
  const navItems = [
    { id: 'main-menu', label: '← All Fields', path: '/farmer' },
    { id: 'dashboard', label: 'Field Dashboard', onClick: () => setActiveTab('dashboard'), active: activeTab === 'dashboard' },
    { id: 'details', label: 'Configuration', onClick: () => setActiveTab('details'), active: activeTab === 'details' },
  ]

  useEffect(() => {
    fetchFieldDetails()
  }, [id])

  // ... (fetchFieldDetails and handleSave remain same) ...
  const fetchFieldDetails = async () => {
    try {
      // 1. Fetch Field Info + Farmer Name
      const { data: fieldData, error: fieldError } = await supabase
        .from('fields')
        .select(`
          *,
          farmers (
            users (
              full_name
            )
          )
        `)
        .eq('id', id)
        .single()

      if (fieldError) throw fieldError
      setField(fieldData)
      
      if (fieldData?.farmers?.users?.full_name) {
          setFarmerName(fieldData.farmers.users.full_name)
      } else {
          setFarmerName('Farmer') 
      }

      // 2. Fetch Field Details (if exists)
      const { data: detailsData, error: detailsError } = await supabase
        .from('field_details')
        .select('*')
        .eq('field_id', id)
        .maybeSingle() // Use maybeSingle as it might not exist yet

      if (!detailsError && detailsData) {
          setDetails({
              ...detailsData,
              area_size: fieldData.area_size // Merge area_size from parent table
          }) 
      } else {
          // If no details, passing area_size from field if available
          setDetails({ area_size: fieldData.area_size })
      }

    } catch (error) {
      console.error('Error fetching details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formData) => {
    setSaving(true)
    try {
        // 1. Update Field Table (Area Size)
        if (formData.area_size) {
            await supabase.from('fields').update({ area_size: formData.area_size }).eq('id', id)
        }

        // 2. Upsert Field Details
        const { error } = await supabase.from('field_details').upsert({
            field_id: id,
            taluka: formData.taluka,
            season: formData.season,
            variety: formData.variety,
            soil_type: formData.soil_type,
            irrigation_method: formData.irrigation_method,
            planting_date: formData.planting_date
        }, { onConflict: 'field_id' })

        if (error) throw error

        alert('Farm configuration saved successfully!')
        
        // Refresh
        fetchFieldDetails()

    } catch (error) {
        console.error('Save error:', error)
        alert('Failed to save details.')
    } finally {
        setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) {
      return <div className="loading-screen">Loading Field Details...</div>
  }

  if (!field) {
      return <div className="error-screen">Field not found</div>
  }

  return (
    <div className="field-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="menu-btn">
            ☰
        </button>
        <span className="mobile-title">Agrolytics</span>
      </div>

      {/* Sidebar / Mobile Menu */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
            <h2>Agrolytics 🌾</h2>
        </div>
        
        <nav className="sidebar-nav">
            {navItems.map(item => (
                item.path ? (
                    <Link key={item.id} to={item.path} className="nav-item">
                        {item.label}
                    </Link>
                ) : (
                    <div 
                        key={item.id} 
                        className={`nav-item ${item.active ? 'active' : ''}`}
                        onClick={item.onClick}
                    >
                        {item.label}
                    </div>
                )
            ))}
            
            <button onClick={handleLogout} className="nav-item logout">
                Logout
            </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="bento-header-card">
            <div className="header-bg-glow"></div>
            <div className="header-content-flex">
                <div className="header-left">
                   <div className="field-badge">Sugarcane Field</div>
                   <h1 className="field-title">{field.name}</h1>
                </div>
                
                <div className="header-right">
                   <div className="owner-card">
                       <span className="owner-label">Owned By</span>
                       <div className="owner-info">
                           <div className="avatar-circle">{farmerName.charAt(0).toUpperCase()}</div>
                           <span className="owner-name">{farmerName}</span>
                       </div>
                   </div>
                </div>
            </div>
        </header>

        <div className="content-body">
            {activeTab === 'dashboard' ? (
                /* Dashboard View */
                <div className="dashboard-container">
                    <PredictionPanel details={details} />
                </div>
            ) : (
                /* Configuration View */
                <div className="bento-section-card details-card">
                    <h3>Farm Configuration</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', marginTop: '0.5rem' }}>
                        Setup your crop details (Soil, Season, Variety) here to enable accurate yield predictions.
                    </p>
                    
                    <FieldConfigurationForm 
                        initialData={details} 
                        onSave={handleSave}
                        saving={saving}
                    />
                </div>
            )}
        </div>
      </main>
      
      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
          <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
    </div>
  )
}

export default FieldDetails
