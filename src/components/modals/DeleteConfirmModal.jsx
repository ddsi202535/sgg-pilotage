import React from 'react'
import { X, Trash2, AlertTriangle } from 'lucide-react'

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemName = '', itemType = 'élément', loading = false }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up">
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Supprimer {itemType}
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Êtes-vous sûr de vouloir supprimer <br />
            <span className="font-semibold text-gray-800">"{itemName}"</span> ?<br />
            <span className="text-red-500 text-xs mt-1 inline-block">Cette action est irréversible.</span>
          </p>
        </div>
        <div className="px-6 pb-6 flex items-center gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm transition-all"
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {loading ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}
