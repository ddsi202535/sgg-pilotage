import React, { useState, useEffect } from 'react'
import { useData } from '../../contexts/DataContext'
import { X, FolderKanban, Plus, Trash2, Link as LinkIcon, User, GitBranch } from 'lucide-react'
import { programmesAPI } from '../../services/api'

const TYPES = ['informatique', 'juridique', 'communication', 'equipement', 'organisationnel']
const STATUSES = [
  { value: 'planification', label: 'Planification' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminé' },
  { value: 'en_retard', label: 'En retard' }
]
const DIRECTORATES = ['DT', 'DAJ', 'DICOM', 'DLOG', 'DRH', 'DAFBG', 'DGS']

const EMPTY_PROJECT = {
  name: '',
  type: 'informatique',
  programme: '',
  programmeId: '',
  status: 'planification',
  budget: '',
  startDate: '',
  endDate: '',
  directorate: '',
  manager: '',
  managerId: '',
  description: '',
  dependencies: [],
  deliverables: [''],
  phases: [
    { name: 'Planification', status: 'pending', progress: 0 },
    { name: 'Exécution', status: 'pending', progress: 0 },
    { name: 'Clôture', status: 'pending', progress: 0 }
  ]
}

export default function ProjectModal({ isOpen, onClose, onSave, project = null, loading = false }) {
  const { projects } = useData()
  const [form, setForm] = useState(EMPTY_PROJECT)
  const [errors, setErrors] = useState({})
  const [availableProgrammes, setAvailableProgrammes] = useState([])
  const [availableChefs, setAvailableChefs] = useState([])
  const [fetchingMeta, setFetchingMeta] = useState(false)

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        type: project.type || 'informatique',
        programme: project.programme || '',
        programmeId: project.programmeId || '',
        status: project.status || 'planification',
        budget: project.budget || '',
        startDate: project.startDate?.split('T')[0] || '',
        endDate: project.endDate?.split('T')[0] || '',
        directorate: project.directorate || '',
        manager: project.manager || '',
        managerId: project.managerId || '',
        description: project.description || '',
        dependencies: project.dependencies || [],
        deliverables: project.deliverables?.length ? project.deliverables : [''],
        phases: project.phases?.length ? project.phases.map(p => ({ name: p.name, status: p.status, progress: p.progress })) : EMPTY_PROJECT.phases
      })
    } else {
      setForm(EMPTY_PROJECT)
    }
    setErrors({})
  }, [project, isOpen])

  useEffect(() => {
    if (isOpen) {
      const fetchMeta = async () => {
        setFetchingMeta(true)
        try {
          const [progs, chefs] = await Promise.all([
            programmesAPI.getAll(),
            programmesAPI.getChefsProjet()
          ])
          setAvailableProgrammes(Array.isArray(progs) ? progs : [])
          setAvailableChefs(Array.isArray(chefs) ? chefs : [])
        } catch (err) {
          console.error('Error fetching project metadata:', err)
        } finally {
          setFetchingMeta(false)
        }
      }
      fetchMeta()
    }
  }, [isOpen])

  if (!isOpen) return null

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nom requis'
    if (!form.startDate) e.startDate = 'Date de début requise'
    if (!form.endDate) e.endDate = 'Date de fin requise'
    if (form.startDate && form.endDate && form.startDate >= form.endDate) e.endDate = 'La date de fin doit être après le début'
    if (!form.budget || parseFloat(form.budget) <= 0) e.budget = 'Budget requis (> 0)'
    if (!form.manager.trim()) e.manager = 'Chef de projet requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    // Exclude deliverables — they are managed via file uploads on the project detail page
    const { deliverables, ...formData } = form
    onSave({
      ...formData,
      budget: parseFloat(form.budget)
    })
  }

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const updateDeliverable = (i, val) => {
    const updated = [...form.deliverables]
    updated[i] = val
    set('deliverables', updated)
  }

  const addDeliverable = () => set('deliverables', [...form.deliverables, ''])
  const removeDeliverable = (i) => set('deliverables', form.deliverables.filter((_, idx) => idx !== i))

  const updatePhase = (i, field, val) => {
    const updated = form.phases.map((p, idx) => idx === i ? { ...p, [field]: val } : p)
    set('phases', updated)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '2px solid #f1f5f9' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
              <FolderKanban className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {project ? 'Modifier le projet' : 'Nouveau projet'}
              </h2>
              <p className="text-xs text-gray-400">{project ? `Réf: ${project.code}` : 'Remplissez les informations du projet'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nom du projet *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className={`input-field ${errors.name ? 'border-red-400' : ''}`}
              placeholder="Ex: Digitalisation des procédures..."
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Row: type + status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className="input-field">
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Statut</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Programme */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <GitBranch className="w-3 h-3 text-green-600" /> Programme budgétaire
            </label>
            <select
              value={form.programmeId}
              onChange={e => {
                const id = e.target.value
                const prog = availableProgrammes.find(p => p.id === id)
                setForm(prev => ({ ...prev, programmeId: id, programme: prog ? prog.label : '' }))
              }}
              className="input-field"
              disabled={fetchingMeta}
            >
              <option value="">Sélectionner un programme...</option>
              {/* Legacy fallback */}
              {form.programme && !form.programmeId && (
                <option value="" disabled>{form.programme} (Legacy)</option>
              )}
              {availableProgrammes.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Row: directorate + manager */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Direction</label>
              <select value={form.directorate} onChange={e => set('directorate', e.target.value)} className="input-field">
                <option value="">Sélectionner...</option>
                {DIRECTORATES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3 h-3 text-green-600" /> Chef de projet *
              </label>
              <select
                value={form.managerId}
                onChange={e => {
                  const id = e.target.value
                  const chef = availableChefs.find(c => c.id === id)
                  setForm(prev => ({ ...prev, managerId: id, manager: chef ? chef.name : '' }))
                }}
                className={`input-field ${errors.manager ? 'border-red-400' : ''}`}
                disabled={fetchingMeta}
              >
                <option value="">Sélectionner un chef de projet...</option>
                {/* Legacy fallback */}
                {form.manager && !form.managerId && (
                  <option value="" disabled>{form.manager} (Saisie libre)</option>
                )}
                {availableChefs.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.manager && <p className="text-xs text-red-500 mt-1">{errors.manager}</p>}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Budget (DH) *</label>
            <input
              type="number"
              value={form.budget}
              onChange={e => set('budget', e.target.value)}
              className={`input-field ${errors.budget ? 'border-red-400' : ''}`}
              placeholder="Ex: 15000000"
              min="0"
            />
            {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
            {form.budget && !isNaN(form.budget) && (
              <p className="text-xs text-gray-400 mt-1">{(parseFloat(form.budget) / 1000000).toFixed(2)} MDH</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date de début *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
                className={`input-field ${errors.startDate ? 'border-red-400' : ''}`}
              />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date de fin *</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => set('endDate', e.target.value)}
                className={`input-field ${errors.endDate ? 'border-red-400' : ''}`}
              />
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="input-field resize-none"
              rows={3}
              placeholder="Description du projet..."
            />
          </div>

          {/* Dependencies */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" />
              Projets Prérequis (Dépendances)
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto">
              {projects.filter(p => !project || p.id !== project.id).map(p => (
                <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    checked={form.dependencies.includes(p.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        set('dependencies', [...form.dependencies, p.id])
                      } else {
                        set('dependencies', form.dependencies.filter(id => id !== p.id))
                      }
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800 leading-tight">{p.name} <span className="text-xs text-gray-400 font-mono ml-1">({p.code})</span></span>
                  </div>
                </label>
              ))}
              {projects.filter(p => !project || p.id !== project.id).length === 0 && (
                <p className="text-xs text-gray-500 italic p-2">Aucun autre projet disponible.</p>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Sélectionnez les projets qui doivent être complétés avant celui-ci.</p>
          </div>

          {/* Phases */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Phases</label>
            <div className="space-y-2">
              {form.phases.map((phase, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                  <input
                    type="text"
                    value={phase.name}
                    onChange={e => updatePhase(i, 'name', e.target.value)}
                    className="flex-1 text-sm bg-transparent border-0 outline-none font-medium text-gray-700"
                    placeholder="Nom de la phase"
                  />
                  <select
                    value={phase.status}
                    onChange={e => updatePhase(i, 'status', e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                  >
                    <option value="pending">En attente</option>
                    <option value="in_progress">En cours</option>
                    <option value="done">Terminé</option>
                  </select>
                  <input
                    type="number"
                    value={phase.progress}
                    onChange={e => updatePhase(i, 'progress', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1 text-center bg-white"
                    min="0" max="100"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
              ))}
              <button
                type="button"
                onClick={() => set('phases', [...form.phases, { name: '', status: 'pending', progress: 0 }])}
                className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter une phase
              </button>
            </div>
          </div>

          {/* Note: Les livrables sont gérés depuis la page détail du projet (dépôt de fichiers) */}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: '2px solid #f1f5f9' }}>
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary min-w-[120px]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Enregistrement...
              </span>
            ) : project ? 'Enregistrer' : 'Créer le projet'}
          </button>
        </div>
      </div>
    </div>
  )
}
