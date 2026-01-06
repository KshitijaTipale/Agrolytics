import React from 'react'

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-content" style={{ maxWidth: '350px', textAlign: 'center' }}>
        <h3 style={{ color: '#d32f2f' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {message}
        </p>
        
        <div className="modal-actions" style={{ justifyContent: 'center' }}>
          <button 
            onClick={onClose} 
            className="cancel-btn"
            style={{ marginRight: '1rem' }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="add-btn"
            style={{ background: '#d32f2f', boxShadow: 'none' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
