import React, { useState, useEffect } from 'react'
import { X, ShieldAlert } from 'lucide-react'

const CATEGORIES = ['technique', 'financier', 'social', 'logistique', 'réglementaire', 'organisationnel']
const STATUSES = [
  { value: 'actif', label: 'Actif' },
  { value: 'mitigé', label: 'Mitigé' },
  { value: 'clos', label: 'Clos' }
]

const EMPTY_RISK = {
  title: '',
  description: '',
  category: 'technique',
  probability: 3,
  impact: 3,
  owner: '',
  mitigation: '',
  mitigationProgress: 0,
  status: 'actif',
  programme: '',
  projectId: ''
}

function calcLevel(p, i) {
  const score = p * i
  if (score >= 12) return { label: 'Élevé', color: 'bg-red-100 text-red-700' }
  if (score >= 6) return { label: 'Moyen', color: 'bg-amber-100 text-amber-700' }
  return { label: 'Faible', color: 'bg-green-100 text-green-700' }
}

export default function RiskModal({ isOpen, onClose, onSave, risk = null, projects = [], loading = false }) {
  const [form, setForm] = useState(EMPTY_RISK)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (risk) {
      setForm({
        title: risk.title || '',
        description: risk.description || '',
        category: risk.category || 'technique',
        probability: risk.probability || 3,
        impact: risk.impact || 3,
        owner: risk.owner || '',
        mitigation: risk.mitigation || '',
        mitigationProgress: risk.mitigationProgress || 0,
        status: risk.status || 'actif',
        programme: risk.programme || '',
        projectId: risk.projectId || ''
      })
    } else {
      setForm(EMPTY_RISK)
    }
    setErrors({})
  }, [risk, isOpen])

  if (!isOpen) return null

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Titre requis'
    if (!form.owner.trim()) e.owner = 'Propriétaire requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const level = calcLevel(form.probability, form.impact)
    onSave({ ...form, level: level.label.toLowerCase() })
  }

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
  const level = calcLevel(form.probability, form.impact)
  const score = form.probability * form.impact

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '2px solid #f1f5f9' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)' }}>
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {risk ? 'Modifier le risque' : 'Nouveau risque'}
              </h2>
              <p className="text-xs text-gray-400">{risk ? `Réf: ${risk.code}` : 'Identifiez et évaluez le risque'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Titre *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className={`input-field ${errors.title ? 'border-red-400' : ''}`}
              placeholder="Titre du risque"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="input-field resize-none"
              rows={2}
              placeholder="Description du risque..."
            />
          </div>

          {/* Row: category + status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Catégorie</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Statut</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Probability & Impact with live score */}
          <div className="p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Évaluation du risque</span>
              <div className="flex items-center gap-2">
                <span className={`badge ${level.color} font-semibold`}>{level.label}</span>
                <span className="text-xs text-gray-400 font-mono">Score: {score}/25</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500">Probabilité</label>
                  <span className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Outfit' }}>{form.probability}</span>
                </div>
                <input type="range" min="1" max="5" value={form.probability} onChange={e => set('probability', parseInt(e.target.value))}
                  className="w-full accent-blue-500" />
                <div className="flex justify-between text-[0.625rem] text-gray-400 mt-1">
                  <span>Rare</span><span>Certain</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500">Impact</label>
                  <span className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Outfit' }}>{form.impact}</span>
                </div>
                <input type="range" min="1" max="5" value={form.impact} onChange={e => set('impact', parseInt(e.target.value))}
                  className="w-full accent-red-500" />
                <div className="flex justify-between text-[0.625rem] text-gray-400 mt-1">
                  <span>Faible</span><span>Critique</span>
                </div>
              </div>
            </div>
          </div>

          {/* Owner */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Propriétaire *</label>
            <input
              type="text"
              value={form.owner}
              onChange={e => set('owner', e.target.value)}
              className={`input-field ${errors.owner ? 'border-red-400' : ''}`}
              placeholder="Responsable du risque"
            />
            {errors.owner && <p className="text-xs text-red-500 mt-1">{errors.owner}</p>}
          </div>

          {/* Project link */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Projet associé</label>
            <select value={form.projectId} onChange={e => set('projectId', e.target.value)} className="input-field">
              <option value="">Aucun projet</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Mitigation */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Plan de mitigation</label>
            <textarea
              value={form.mitigation}
              onChange={e => set('mitigation', e.target.value)}
              className="input-field resize-none"
              rows={2}
              placeholder="Actions de mitigation prévues..."
            />
          </div>

          {/* Mitigation Progress */}
          {risk && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Progression mitigation</label>
                <span className="text-sm font-bold text-gray-700">{form.mitigationProgress}%</span>
              </div>
              <input type="range" min="0" max="100" value={form.mitigationProgress}
                onChange={e => set('mitigationProgress', parseInt(e.target.value))}
                className="w-full accent-green-600" />
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: '2px solid #f1f5f9' }}>
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary min-w-[120px]">
            {loading ? 'Enregistrement...' : risk ? 'Enregistrer' : 'Créer le risque'}
          </button>
        </div>
      </div>
    </div>
  )
}
