import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const TALUKAS = ['Akole', 'Sangamner', 'Kopargaon', 'Rahata', 'Shrirampur', 'Nevasa', 'Shevgaon', 'Pathardi', 'Jamkhed', 'Karjat', 'Shrigonda', 'Parner', 'Ahmednagar', 'Rahuri']
const SEASONS = ['Suru', 'Pre-seasonal', 'Adsali']
const VARIETIES = ['CoM 0265', 'Co 86032', 'Co 92005', 'VSI 434']
const SOIL_TYPES = ['Black Cotton', 'Clay Loam', 'Sandy Loam', 'Medium Black']
const IRRIGATION_METHODS = ['Drip', 'Flood', 'Rainfed']

const FieldConfigurationForm = ({ initialData, onSave, saving, onFindOnMap }) => {
  const { t } = useTranslation()
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
          <label>{t('fieldDetails.config.taluka')}</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
             <select name="taluka" value={formData.taluka} onChange={handleChange} required style={{ flex: 1 }}>
                <option value="">{t('fieldDetails.config.selectTaluka')}</option>
                {TALUKAS.map(t => <option key={t} value={t}>{t}</option>)}
             </select>
             <button type="button" onClick={onFindOnMap} className="btn-secondary" style={{ fontSize: '1.2rem'}} title="Find on Map">
                🗺️
             </button>
          </div>
          <small style={{ color: '#666' }}>{t('fieldDetails.config.orAutoDetect')}</small>
        </div>

        {/* Season */}
        <div className="form-group">
          <label>{t('fieldDetails.config.season')}</label>
          <select name="season" value={formData.season} onChange={handleChange} required>
             <option value="">{t('fieldDetails.config.selectSeason')}</option>
             {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Variety */}
        <div className="form-group">
          <label>{t('fieldDetails.config.variety')}</label>
          <select name="variety" value={formData.variety} onChange={handleChange} required>
             <option value="">{t('fieldDetails.config.selectVariety')}</option>
             {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {/* Soil Type */}
        <div className="form-group">
          <label>{t('fieldDetails.config.soilType')}</label>
          <select name="soil_type" value={formData.soil_type} onChange={handleChange} required>
             <option value="">{t('fieldDetails.config.selectSoilType')}</option>
             {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Irrigation */}
        <div className="form-group">
          <label>{t('fieldDetails.config.irrigationMethod')}</label>
          <select name="irrigation_method" value={formData.irrigation_method} onChange={handleChange} required>
             <option value="">{t('fieldDetails.config.selectMethod')}</option>
             {IRRIGATION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Planting Date */}
        <div className="form-group">
          <label>{t('fieldDetails.config.plantingDate')}</label>
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
            <label>{t('fieldDetails.config.fieldArea')}</label>
            <input 
                type="number" 
                step="0.01"
                placeholder="e.g. 2.5"
                name="area_size"
                value={formData.area_size}
                onChange={handleChange}
                readOnly
                style={{ background: '#f9f9f9', cursor: 'not-allowed' }}
                title="Use the Map to calculate area automatically"
            />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="save-btn" disabled={saving}>
          {saving ? t('fieldDetails.config.savingBtn') : t('fieldDetails.config.saveBtn')}
        </button>
      </div>
    </form>
  )
}

export default FieldConfigurationForm
