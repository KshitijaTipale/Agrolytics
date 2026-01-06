import { useState } from 'react'

const AddFieldModal = ({ isOpen, onClose, onAdd }) => {
  const [fieldName, setFieldName] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (fieldName.trim()) {
      onAdd(fieldName)
      setFieldName('')
      onClose()
    }
  }

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-content">
        <h3>Add New Field</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Give your field a name to identify it easily.
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="e.g., Backside Plot"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            className="modern-input"
            autoFocus
          />
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="add-btn">
              Add Field
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddFieldModal
