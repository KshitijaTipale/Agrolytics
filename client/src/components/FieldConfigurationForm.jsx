import { useState, useEffect } from 'react'

const TALUKAS = ['Akole', 'Sangamner', 'Kopargaon', 'Rahata', 'Shrirampur', 'Nevasa', 'Shevgaon', 'Pathardi', 'Jamkhed', 'Karjat', 'Shrigonda', 'Parner', 'Ahmednagar', 'Rahuri']
const SEASONS = ['Suru', 'Pre-seasonal', 'Adsali']
const VARIETIES = ['CoM 0265', 'Co 86032', 'Co 92005', 'VSI 434']
const SOIL_TYPES = ['Black Cotton', 'Clay Loam', 'Sandy Loam', 'Medium Black']
const IRRIGATION_METHODS = ['Drip', 'Flood', 'Rainfed']

const FieldConfigurationForm = ({ initialData, onSave, saving }) => {
  const [formData, setFormData] = useState({
    taluka: '',
    season: '',
    variety: '',
    soil_type: '',
    irrigation_method: '',
    planting_date: '',
    area_size: '',
    coordinates: ''
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        taluka: initialData.taluka || '',
        season: initialData.season || '',
        variety: initialData.variety || '',
        soil_type: initialData.soil_type || '',
        irrigation_method: initialData.irrigation_method || '',
        planting_date: initialData.planting_date || '',
        area_size: initialData.area_size || '', // Actually needs to update 'fields' table, but UI wise we can show it here
        coordinates: initialData.coordinates ? JSON.stringify(initialData.coordinates) : ''
      })
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="config-form">
      <div className="form-grid">
        {/* Taluka */}
        <div className="form-group">
          <label>Taluka</label>
          <select name="taluka" value={formData.taluka} onChange={handleChange} required>
            <option value="">Select Taluka</option>
            {TALUKAS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Season */}
        <div className="form-group">
          <label>Season</label>
          <select name="season" value={formData.season} onChange={handleChange} required>
             <option value="">Select Season</option>
             {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Variety */}
        <div className="form-group">
          <label>Sugarcane Variety</label>
          <select name="variety" value={formData.variety} onChange={handleChange} required>
             <option value="">Select Variety</option>
             {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {/* Soil Type */}
        <div className="form-group">
          <label>Soil Type</label>
          <select name="soil_type" value={formData.soil_type} onChange={handleChange} required>
             <option value="">Select Soil Type</option>
             {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Irrigation */}
        <div className="form-group">
          <label>Irrigation Method</label>
          <select name="irrigation_method" value={formData.irrigation_method} onChange={handleChange} required>
             <option value="">Select Method</option>
             {IRRIGATION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Planting Date */}
        <div className="form-group">
          <label>Planting Date</label>
          <input 
            type="date" 
            name="planting_date" 
            value={formData.planting_date} 
            onChange={handleChange} 
            required 
          />
        </div>

        {/* Area Size (Acres) - Note: This technically belongs to 'fields' table but handled here for UI convienience */}
        <div className="form-group">
            <label>Field Area (Acres)</label>
            <input 
                type="number" 
                step="0.01"
                placeholder="e.g. 2.5"
                name="area_size"
                value={formData.area_size}
                onChange={handleChange}
            />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="save-btn" disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </form>
  )
}

export default FieldConfigurationForm
