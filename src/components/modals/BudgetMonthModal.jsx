import React, { useState, useEffect } from 'react'
import { X, Calendar, TrendingDown } from 'lucide-react'

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

const EMPTY_FORM = {
  month: 'Jan',
  year: new Date().getFullYear(),
  budget: '',
  spent: ''
}

export default function BudgetMonthModal({ isOpen, onClose, onSave, entry = null }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  useEffect(() => {
    if (entry) {
      setForm({
        month: entry.month || 'Jan',
        year: entry.year || new Date().getFullYear(),
        budget: entry.budget || '',
        spent: entry.spent || ''
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setError('')
  }, [entry, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.budget && !form.spent) {
      setError('Budget ou Consommé requis')
      return
    }
    onSave({
      ...form,
      budget: parseFloat(form.budget) || 0,
      spent: parseFloat(form.spent) || 0,
      year: parseInt(form.year)
    })
  }

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {entry ? 'Modifier un mois' : 'Nouveau suivi mensuel'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mois</label>
              <select value={form.month} onChange={e => set('month', e.target.value)} className="input-field" disabled={!!entry}>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Année</label>
              <input
                type="number"
                value={form.year}
                onChange={e => set('year', e.target.value)}
                className="input-field"
                placeholder="2024"
                disabled={!!entry}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-bold text-green-700">
                Budget (DH)
              </label>
              <input
                type="number"
                value={form.budget}
                onChange={e => set('budget', e.target.value)}
                className="input-field"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-bold text-blue-700">
                Consommé (DH)
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
