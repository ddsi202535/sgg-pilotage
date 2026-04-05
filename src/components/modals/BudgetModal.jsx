import React, { useState, useEffect } from 'react'
import { X, Wallet, Coins } from 'lucide-react'

const SOURCES = ['MDD', 'INVEST', 'PNUD', 'FONDS ANRT', 'DIO', 'Autre']

const EMPTY_FORM = {
  name: '',
  budget: '',
  engaged: '',
  spent: '',
  source: 'MDD'
}

export default function BudgetModal({ isOpen, onClose, onSave, entry = null }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  useEffect(() => {
    if (entry) {
      setForm({
        name: entry.name || '',
        budget: entry.budget || '',
        engaged: entry.engaged || '',
        spent: entry.spent || '',
        source: entry.source || 'MDD'
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setError('')
  }, [entry, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.budget) {
      setError('Libellé et Budget total requis')
      return
    }
    onSave({
      ...form,
      budget: parseFloat(form.budget),
      engaged: parseFloat(form.engaged) || 0,
      spent: parseFloat(form.spent) || 0
    })
  }

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-50">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {entry ? 'Modifier l\'allocation' : 'Nouvelle allocation'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>}
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Libellé / Programme</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="input-field"
              placeholder="Ex: Programme 140..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Source de financement</label>
              <select value={form.source} onChange={e => set('source', e.target.value)} className="input-field">
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Budget Total (DH)</label>
              <input
                type="number"
                value={form.budget}
                onChange={e => set('budget', e.target.value)}
                className="input-field"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3 h-3 text-blue-500" /> Engagé (DH)
              </label>
              <input
                type="number"
                value={form.engaged}
                onChange={e => set('engaged', e.target.value)}
                className="input-field"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3 h-3 text-purple-500" /> Consommé (DH)
              </label>
              <input
                type="number"
                value={form.spent}
                onChange={e => set('spent', e.target.value)}
                className="input-field"
                placeholder="0"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" className="btn-primary flex-1">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  )
}
