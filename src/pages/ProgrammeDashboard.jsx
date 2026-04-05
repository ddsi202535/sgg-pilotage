import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { programmesAPI } from '../services/api'
import { useAuth, USER_PROFILES } from '../contexts/AuthContext'
import {
  FolderKanban, Users, TrendingUp, Wallet, ChevronRight,
  Plus, Pencil, Trash2, Check, X, AlertCircle, CheckCircle,
  Clock, XCircle, ArrowRight, Target, BarChart3, Shield, Save
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Cell
} from 'recharts'

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  planification: { label: 'Planification', color: 'bg-blue-100 text-blue-700',       icon: Clock },
  en_cours:      { label: 'En cours',      color: 'bg-emerald-100 text-emerald-700', icon: TrendingUp },
  termine:       { label: 'Terminé',       color: 'bg-teal-100 text-teal-700',       icon: CheckCircle },
  suspendu:      { label: 'Suspendu',      color: 'bg-red-100 text-red-700',         icon: XCircle },
  en_retard:     { label: 'En retard',     color: 'bg-amber-100 text-amber-700',     icon: AlertCircle }
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-500', icon: Clock }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      <cfg.icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

function ProgressBar({ value, color = '#006233' }) {
  const pct = Math.min(100, Math.max(0, value))
  const bg = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color || bg }} />
    </div>
  )
}

// ─── Programme Card ───────────────────────────────────────────────────────────
function ProgrammeCard({ programme, onEdit, onDelete, isAdmin }) {
  const [expanded, setExpanded] = useState(false)
  const { stats, projects } = programme

  const statusCounts = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})

  const barData = Object.entries(statusCounts).map(([key, count]) => ({
    name: STATUS_CONFIG[key]?.label || key,
    value: count
  }))

  const budgetPct = stats.totalBudget > 0 ? Math.round((stats.totalConsumed / stats.totalBudget) * 100) : 0

  // Light green gradient variants — stays in SGG theme, brighter and more convivial
  const PROGRAMME_GRADIENTS = [
    'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 50%, #34d399 100%)',   // Emerald mint
    'linear-gradient(135deg, #dcfce7 0%, #86efac 50%, #4ade80 100%)',   // Light green
    'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #059669 100%)',   // Teal emerald
    'linear-gradient(135deg, #ecfdf5 0%, #6ee7b7 50%, #10b981 100%)',   // Fresh mint
  ]
  const gradient = PROGRAMME_GRADIENTS[Math.abs(programme.code?.charCodeAt(0) || 0) % PROGRAMME_GRADIENTS.length]

  return (
    <div className="card-static overflow-hidden">
      {/* Header */}
      <div
        className="p-6 cursor-pointer select-none"
        style={{ background: gradient }}
        onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-800/60 text-xs font-bold tracking-widest uppercase">Programme</span>
              <span className="bg-white/40 text-emerald-900 text-xs font-bold px-2 py-0.5 rounded-full">{programme.code}</span>
            </div>
            <h2 className="text-emerald-950 font-bold text-lg leading-tight">{programme.label}</h2>
            {programme.description && (
              <p className="text-emerald-800/50 text-xs mt-1 leading-relaxed line-clamp-2">{programme.description}</p>
            )}
            {/* Responsable */}
            <div className="flex items-center gap-2 mt-3">
              <div className="w-6 h-6 rounded-full bg-white/40 flex items-center justify-center text-emerald-900 text-[10px] font-bold">
                {programme.responsable?.name?.charAt(0) || '?'}
              </div>
              <span className="text-emerald-800/70 text-xs">
                {programme.responsable ? programme.responsable.name : <span className="italic text-emerald-800/30">Aucun responsable assigné</span>}
              </span>
            </div>
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={e => { e.stopPropagation(); onEdit(programme) }}
                className="p-1.5 text-emerald-700/50 hover:text-emerald-900 hover:bg-white/30 rounded-lg transition-colors"
                title="Modifier"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(programme) }}
                className="p-1.5 text-emerald-700/50 hover:text-red-600 hover:bg-red-100/50 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <ChevronRight className={`w-5 h-5 text-emerald-800/40 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4 mt-5">
          {[
            { label: 'Projets', value: stats.totalProjects, sub: `${stats.activeProjects} actifs` },
            { label: 'Avancement moy.', value: `${stats.avgProgress}%`, sub: 'physique' },
            { label: 'Budget total', value: stats.totalBudget > 0 ? `${(stats.totalBudget/1e6).toFixed(1)}M` : '—', sub: 'MAD' },
            { label: 'Consommé', value: `${budgetPct}%`, sub: `${(stats.totalConsumed/1e6).toFixed(1)}M MAD` }
          ].map(kpi => (
            <div key={kpi.label}>
              <p className="text-emerald-800/50 text-[10px] uppercase tracking-wider">{kpi.label}</p>
              <p className="text-emerald-950 text-xl font-bold mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>{kpi.value}</p>
              <p className="text-emerald-800/50 text-[10px]">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-emerald-800/50 mb-1">
            <span>Avancement global</span>
            <span>{stats.avgProgress}%</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${stats.avgProgress}%`,
                background: stats.avgProgress >= 80 ? '#10b981' : stats.avgProgress >= 50 ? '#f59e0b' : '#f87171'
              }}
            />
          </div>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="animate-fade-in">
          {/* Mini chart */}
          {barData.length > 0 && (
            <div className="px-6 pt-5 pb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Répartition des projets par statut</p>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={barData} layout="vertical" barSize={16}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={4} fill="#059669" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Projects list */}
          <div className="divide-y divide-emerald-50">
            <div className="px-6 py-3 bg-emerald-50/50 flex items-center justify-between">
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                Projets de ce programme ({projects.length})
              </p>
              <Link to="/projects" className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1">
                Voir tous <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {projects.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                Aucun projet dans ce programme
              </div>
            )}
            {projects.map(project => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-emerald-50/40 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 text-xs font-bold flex-shrink-0 ring-1 ring-emerald-200">
                  {project.code}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">{project.name}</p>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] text-emerald-700/70 mb-0.5">
                        <span>Physique</span><span>{project.physicalProgress}%</span>
                      </div>
                      <ProgressBar value={project.physicalProgress} color="#059669" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] text-teal-700/70 mb-0.5">
                        <span>Financier</span><span>{project.financialProgress}%</span>
                      </div>
                      <ProgressBar value={project.financialProgress} color="#0d9488" />
                    </div>
                  </div>
                  {project.manager && (
                    <p className="text-[10px] text-emerald-700/60 mt-1">Chef de projet : {project.manager}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-200 group-hover:text-emerald-600 flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
const EMPTY_FORM = { code: '', label: '', description: '', budget: '', responsableId: '' }

function ProgrammeFormModal({ open, initial, responsables, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { setForm(initial || EMPTY_FORM) }, [initial])
  if (!open) return null

  const handleSave = async () => {
    if (!form.code || !form.label) return
    setSubmitting(true)
    await onSave(form)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-static w-full max-w-lg p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900">{initial?.id ? 'Modifier le programme' : 'Nouveau programme'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Code *</label>
              <input className="input-field" placeholder="Ex: 140" value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Budget (MAD)</label>
              <input className="input-field" type="number" placeholder="0" value={form.budget} onChange={e => setForm(f => ({...f, budget: e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Libellé *</label>
            <input className="input-field" placeholder="Intitulé du programme" value={form.label} onChange={e => setForm(f => ({...f, label: e.target.value}))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Description</label>
            <textarea className="input-field" rows={3} placeholder="Description du programme..." value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Responsable (Profil : Responsable Programme)</label>
            <select className="input-field" value={form.responsableId} onChange={e => setForm(f => ({...f, responsableId: e.target.value}))}>
              <option value="">— Aucun responsable —</option>
              {responsables.map(r => (
                <option key={r.id} value={r.id}>{r.name} — {r.email}</option>
              ))}
            </select>
            {responsables.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">⚠ Aucun utilisateur avec le profil "Responsable de Programme" n'existe. Créez-en un dans Utilisateurs.</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={handleSave} disabled={submitting || !form.code || !form.label} className="btn-primary flex-1">
            <Save className="w-4 h-4" /> {initial?.id ? 'Enregistrer' : 'Créer'}
          </button>
          <button onClick={onClose} className="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProgrammeDashboard() {
  const { isAdmin, can } = useAuth()
  const [programmes, setProgrammes] = useState([])
  const [responsables, setResponsables] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [progs, resps] = await Promise.all([
        programmesAPI.getAll(),
        programmesAPI.getResponsables()
      ])
      setProgrammes(Array.isArray(progs) ? progs : [])
      setResponsables(Array.isArray(resps) ? resps : [])
    } catch(e) { console.error(e) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSave = async (form) => {
    try {
      if (editTarget?.id) {
        await programmesAPI.update(editTarget.id, form)
      } else {
        await programmesAPI.create(form)
      }
      setModalOpen(false); setEditTarget(null); fetchAll()
    } catch(e) { alert(e.message) }
  }

  const handleDelete = async (programme) => {
    if (!window.confirm(`Supprimer le programme "${programme.label}" ? Les projets rattachés seront détachés.`)) return
    await programmesAPI.delete(programme.id); fetchAll()
  }

  // Global stats across all programmes
  const allProjects = programmes.flatMap(p => p.projects || [])
  const globalAvg = allProjects.length ? Math.round(allProjects.reduce((s, p) => s + p.physicalProgress, 0) / allProjects.length) : 0
  const globalBudget = allProjects.reduce((s, p) => s + p.budget, 0)
  const globalConsumed = allProjects.reduce((s, p) => s + p.consumed, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Pilotage stratégique</p>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Programmes Budgétaires
          </h1>
          <p className="text-sm text-gray-500 mt-1">Vue hiérarchique SGG → Programme → Projets</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditTarget(null); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Nouveau programme
          </button>
        )}
      </div>

      {/* Global KPI banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Programmes', value: programmes.length, sub: 'budgétaires', icon: BarChart3, color: '#059669' },
          { label: 'Projets total', value: allProjects.length, sub: `${allProjects.filter(p=>p.status==='en_cours').length} en cours`, icon: FolderKanban, color: '#0284c7' },
          { label: 'Avancement global', value: `${globalAvg}%`, sub: 'moyen physique', icon: TrendingUp, color: globalAvg >= 70 ? '#10b981' : '#f59e0b' },
          { label: 'Budget consommé', value: globalBudget > 0 ? `${Math.round((globalConsumed/globalBudget)*100)}%` : '—', sub: `${(globalConsumed/1e6).toFixed(1)}M / ${(globalBudget/1e6).toFixed(1)}M MAD`, icon: Wallet, color: '#7c3aed' }
        ].map(kpi => (
          <div key={kpi.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[0.6875rem] text-gray-400 uppercase tracking-wider">{kpi.label}</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Programmes list */}
      {loading ? (
        <div className="card-static p-12 text-center text-gray-400">Chargement des programmes...</div>
      ) : programmes.length === 0 ? (
        <div className="card-static p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aucun programme configuré</p>
          {isAdmin && <button onClick={() => setModalOpen(true)} className="btn-primary mt-4"><Plus className="w-4 h-4" /> Créer le premier programme</button>}
        </div>
      ) : (
        <div className="space-y-4">
          {programmes.map(programme => (
            <ProgrammeCard
              key={programme.id}
              programme={programme}
              onEdit={(p) => { setEditTarget({...p, responsableId: p.responsableId || ''}); setModalOpen(true) }}
              onDelete={handleDelete}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ProgrammeFormModal
        open={modalOpen}
        initial={editTarget}
        responsables={responsables}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
      />
    </div>
  )
}
