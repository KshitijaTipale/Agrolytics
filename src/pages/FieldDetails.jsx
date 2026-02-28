import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import FieldConfigurationForm from '../components/FieldConfigurationForm'
import PredictionPanel from '../components/PredictionPanel'
import FieldMap from '../components/FieldMap'
import { useTranslation } from 'react-i18next'
import LanguageToggle from '../components/LanguageToggle'

const FieldDetails = () => {
  const { t } = useTranslation()
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
    { id: 'main-menu', label: t('fieldDetails.nav.allFields'), path: '/farmer' },
    { id: 'dashboard', label: t('fieldDetails.nav.dashboard'), onClick: () => setActiveTab('dashboard'), active: activeTab === 'dashboard' },
    { id: 'map', label: t('fieldDetails.nav.map'), onClick: () => setActiveTab('map'), active: activeTab === 'map' },
    { id: 'details', label: t('fieldDetails.nav.config'), onClick: () => setActiveTab('details'), active: activeTab === 'details' },
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

  const handleSaveMap = async ({ coordinates, acreage, center }) => {
    setSaving(true)
    try {
        // 1. Update Field Table with new coordinates and area
        const updates = { 
            coordinates: coordinates,
            area_size: acreage 
        };
        
        await supabase.from('fields').update(updates).eq('id', id);
        
        // 2. Reverse Geocode for Taluka (if center available)
        let detectedTaluka = null;
        if (center) {
            try {
                // Nominatim Reverse Geocoding
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${center[0]}&lon=${center[1]}`);
                const data = await res.json();
                
                // Naive Taluka detection from address components
                // Nominatim usually returns 'county' or 'state_district' or 'city'
                const addr = data.address;
                const talukaList = ['Akole', 'Sangamner', 'Kopargaon', 'Rahata', 'Shrirampur', 'Nevasa', 'Shevgaon', 'Pathardi', 'Jamkhed', 'Karjat', 'Shrigonda', 'Parner', 'Ahmednagar', 'Rahuri'];
                
                // Check all address fields
                const addressValues = Object.values(addr);
                detectedTaluka = talukaList.find(t => addressValues.some(v => typeof v === 'string' && v.includes(t)));
                
                if (detectedTaluka) {
                    // Update field_details if we found a taluka
                    await supabase.from('field_details').upsert({
                        field_id: id,
                        taluka: detectedTaluka
                    }, { onConflict: 'field_id' });
                }
            } catch (err) {
                console.error("Reverse geocoding failed", err);
            }
        }

        alert(`Field boundary saved! Area: ${acreage} Acres. ${detectedTaluka ? 'Detected Taluka: ' + detectedTaluka : ''}`);
        
        // 3. Refresh and switch back to Configuration
        await fetchFieldDetails();
        setActiveTab('details'); // Switch back to config form
        
    } catch (error) {
        console.error('Save map error:', error)
        alert('Failed to save map.')
    } finally {
        setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) {
      return <div className="loading-screen">{t('loading')}</div>
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
        <img src="/agrolytics.png" alt="Agrolytics" style={{ height: '32px', objectFit: 'contain' }} />
      </div>

      {/* Sidebar / Mobile Menu */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
            <img src="/agrolytics.png" alt="Agrolytics" style={{ height: '40px', objectFit: 'contain' }} />
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
                {t('fieldDetails.nav.logout')}
            </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="bento-header-card">
            <div className="header-bg-glow"></div>
            <div className="header-content-flex">
                <div className="header-left">
                   <div className="field-badge">{t('fieldDetails.header.sugarcaneField')}</div>
                   <h1 className="field-title">{field.name}</h1>
                </div>
                
                <div className="header-right" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                   <LanguageToggle />
                   <div className="owner-card">
                       <span className="owner-label">{t('fieldDetails.header.ownedBy')}</span>
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
            ) : activeTab === 'map' ? (
                /* Map View */
                <div className="bento-section-card" style={{ height: '800px', display: 'flex', flexDirection: 'column' }}>
                    <h3>{t('fieldDetails.map.title')}</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        {t('fieldDetails.map.desc')}
                    </p>
                    <FieldMap 
                        initialCoordinates={field.coordinates} 
                        onSave={handleSaveMap}
                        saving={saving}
                    />
                </div>
            ) : (
                /* Configuration View */
                <div className="bento-section-card details-card">
                    <h3>{t('fieldDetails.config.title')}</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', marginTop: '0.5rem' }}>
                        {t('fieldDetails.config.desc')}
                    </p>
                    
                    <FieldConfigurationForm 
                        initialData={details} 
                        onSave={handleSave}
                        saving={saving}
                        onFindOnMap={() => setActiveTab('map')}
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
