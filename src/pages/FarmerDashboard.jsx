import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import AddFieldModal from '../components/AddFieldModal'
import ConfirmModal from '../components/ConfirmModal'
import { Sprout, Plus, Trash2, MoreVertical, LayoutGrid, Leaf } from 'lucide-react'

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

      // 2. Fetch Fields
      const { data, error } = await supabase
        .from('fields')
        .select('*')
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

      {/* --- FIELDS GRID --- */}
      <div className="field-grid">
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
          fields.map(field => (
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
                  <h3>{field.name}</h3>
                  <div className="chip">Sugarcane</div>
              </div>

              <div className="card-bottom">
                  <span>Added {formatDate(field.created_at)}</span>
                  <div className="arrow-btn">→</div>
              </div>
            </div>
          ))
        )}
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
