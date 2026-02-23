import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import AddFieldModal from '../components/AddFieldModal'
import ConfirmModal from '../components/ConfirmModal'
import { Sprout, Plus, Trash2, MoreVertical, LayoutGrid, Leaf, CloudSun, Droplets, Wind, Activity, AlertCircle, CheckCircle2, MapPin } from 'lucide-react'
import WeatherWidget from '../components/WeatherWidget'
import InsightsWidget from '../components/InsightsWidget'

const FarmerDashboard = () => {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [farmerName, setFarmerName] = useState('Farmer') // Default fallback

  // Delete & Menu State
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Fetch Farmer Name (from users table via farmers table if structure matches, or directly from metadata)
      // Assuming 'users' table holds the profile linked by auth.id or checking metadata first
      if (user.user_metadata?.full_name) {
        setFarmerName(user.user_metadata.full_name.split(' ')[0]) // First name
      } else {
        // Fallback fetch from custom users table if used
        const { data: profile } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id) // Assuming auth.uid matches users.id or handled via foreign key
          .single()

        if (profile?.full_name) {
          setFarmerName(profile.full_name.split(' ')[0])
        }
      }

      // 2. Fetch Fields with details
      const { data, error } = await supabase
        .from('fields')
        .select(`
          *,
          field_details (
            crop_name,
            planting_date,
            is_active
          )
        `)
        .eq('farmer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFields(data || [])
    } catch (error) {
      console.error('Error fetching data:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const handleAddField = async (name) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('fields')
        .insert([{
          name,
          farmer_id: user.id
        }])
        .select()

      if (error) throw error

      setFields([data[0], ...fields])
    } catch (error) {
      console.error('Error adding field:', error.message)
      alert('Failed to add field')
    }
  }

  const toggleMenu = (id, e) => {
    e.stopPropagation()
    setMenuOpenId(menuOpenId === id ? null : id)
  }

  const confirmDelete = (id, e) => {
    e.stopPropagation()
    setDeleteConfirmId(id)
    setMenuOpenId(null)
  }

  const performDelete = async () => {
    try {
      const { error } = await supabase
        .from('fields')
        .delete()
        .eq('id', deleteConfirmId)

      if (error) throw error

      setFields(fields.filter(f => f.id !== deleteConfirmId))
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Error deleting field:', error.message)
      alert('Failed to delete field')
    }
  }

  // Close menus when clicking outside
  const handleOutsideClick = () => {
    if (menuOpenId) setMenuOpenId(null)
  }

  // Date formatter
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  // Calculate Action Items purely on unconfigured items
  const actionItemsCount = fields.filter(f => {
    const details = Array.isArray(f.field_details) ? f.field_details[0] : f.field_details;
    return !details?.planting_date;
  }).length;

  return (
    <div className="dashboard-container" onClick={handleOutsideClick}>

      {/* --- HEADER SECTION --- */}
      <div className="bento-header-card">
        <div className="header-bg-glow"></div>
        <div className="header-content-flex" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <div>
            <div className="field-badge" style={{ marginBottom: '0.5rem' }}>Farmer Portal</div>
            <h1 className="field-title">
              Hello, {farmerName} <span style={{ fontSize: '2rem' }}>👋</span>
            </h1>
            <p style={{ color: '#666', marginTop: '0.5rem' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button onClick={handleLogout} className="logout-btn-subtle">
            Logout
          </button>
        </div>
      </div>

      {/* --- QUICK STATS ROW (A & B) --- */}
      <div className="stats-row">
        {/* Weather Widget */}
        <WeatherWidget />

        {/* Total Fields Widget */}
        <div className="bento-card widget-card">
          <div className="card-label">Total Fields</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <div className="info-value">{fields.length} <small>Active</small></div>
            <div className="icon-box green" style={{ margin: 0 }}><MapPin size={24} /></div>
          </div>
          <div className="subtext" style={{ marginTop: '1rem' }}>All fields are currently being monitored.</div>
        </div>

        {/* Alerts Widget */}
        <div className="bento-card widget-card">
          <div className="card-label">Action Items</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <div className="info-value" style={{ color: actionItemsCount > 0 ? '#e53935' : '#4CAF50' }}>{actionItemsCount} <small style={{ color: actionItemsCount > 0 ? '#ef9a9a' : '#81c784' }}>{actionItemsCount > 0 ? 'Pending' : 'All Clear'}</small></div>
            <div className="icon-box orange" style={{ margin: 0 }}><AlertCircle size={24} /></div>
          </div>
          <div className="subtext" style={{ marginTop: '1rem' }}>Check your insights for details.</div>
        </div>
      </div>

      <div className="dashboard-main-layout">
        {/* --- FIELDS GRID (Left Column) --- */}
        <div className="dashboard-left-col">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#2c3e50', margin: 0 }}>Your Fields</h2>
          </div>
          <div className="field-grid" style={{ marginTop: 0 }}>
            {loading ? (
              <div className="loading-state">
                <Sprout className="spin-slow" size={40} color="#4CAF50" />
                <p>Loading your fields...</p>
              </div>
            ) : fields.length === 0 ? (
              <div className="empty-state-card">
                <div className="icon-circle-large"><Leaf size={40} /></div>
                <h3>No Fields Yet</h3>
                <p>Start by adding your first field to track yield.</p>
              </div>
            ) : (
              fields.map(field => {
                const details = Array.isArray(field.field_details) ? field.field_details[0] : field.field_details;
                const cropName = details?.crop_name || 'Unconfigured';
                const plantingDate = details?.planting_date;
                const isActive = details?.is_active !== false; // true by default unless false

                // Calculate progress simply (Assume roughly 365 days harvest cycle for Sugarcane if planting date is provided)
                let progress = 0;
                let daysPlanted = 0;
                if (plantingDate) {
                  const planted = new Date(plantingDate);
                  const now = new Date();
                  daysPlanted = Math.max(0, Math.floor((now - planted) / (1000 * 60 * 60 * 24)));
                  progress = Math.min(100, Math.max(0, (daysPlanted / 365) * 100)); // Percentage
                }

                return (
                  <div
                    key={field.id}
                    className="bento-card field-card-modern"
                    onClick={() => navigate(`/farmer/field/${field.id}`)}
                  >
                    <div className="card-top">
                      <div className="icon-box green"><Sprout size={24} /></div>

                      {/* Menu */}
                      <div style={{ position: 'relative' }}>
                        <button className="menu-trigger-modern" onClick={(e) => toggleMenu(field.id, e)}>
                          <MoreVertical size={20} />
                        </button>
                        {menuOpenId === field.id && (
                          <div className="dropdown-menu-modern">
                            <button
                              className="dropdown-item-modern delete"
                              onClick={(e) => confirmDelete(field.id, e)}
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card-mid">
                      <h3 style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteWhiteSpace: 'nowrap' }}>{field.name}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div className="chip">{cropName}</div>
                        {plantingDate ? (
                          <div className="chip" style={{ background: isActive ? '#e3f2fd' : '#ffee58', color: isActive ? '#1565c0' : '#f57f17' }}>
                            {isActive ? 'Growing' : 'Harvested'}
                          </div>
                        ) : (
                          <div className="chip" style={{ background: '#fff3e0', color: '#ef6c00' }}>Setup Needed</div>
                        )}
                      </div>
                    </div>

                    <div className="card-bottom">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', width: '80%' }}>
                        <span style={{ fontSize: '0.8rem' }}>Added {formatDate(field.created_at)}</span>
                        {/* Enhanced Progress Bar calculated from dynamic data */}
                        {plantingDate ? (
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.25rem' }}>
                            <div style={{ width: '100%', height: '4px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${progress}%`, height: '100%', background: '#4CAF50', borderRadius: '4px' }}></div>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#aaa' }}>Day {daysPlanted} of ~365</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.2rem' }}>Requires farm configuration</span>
                        )}
                      </div>
                      <div className="arrow-btn">→</div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* --- INSIGHTS & ALERTS (Right Column) --- */}
        <div className="dashboard-right-col">
          <InsightsWidget fields={fields} />
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fab-modern" onClick={() => setIsModalOpen(true)}>
        <Plus size={32} />
      </button>

      {/* Modals */}
      <AddFieldModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddField}
      />

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete Field?"
        message="Are you sure you want to remove this field? This action cannot be undone."
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={performDelete}
      />
    </div>
  )
}

export default FarmerDashboard
