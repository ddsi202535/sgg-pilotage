import React, { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { Plus, Filter, Download, AlertTriangle, Shield, Pencil, Trash2 } from 'lucide-react'
import RiskMatrix from '../components/RiskMatrix'
import RiskModal from '../components/modals/RiskModal'
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal'

export default function Risks() {
  const { risks, projects, addRisk, updateRisk, deleteRisk, apiMode } = useData()
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterProject, setFilterProject] = useState('all')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editRisk, setEditRisk] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const filteredRisks = risks.filter(r => {
    const matchesLevel = filterLevel === 'all' || r.level === filterLevel
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus
    const matchesProject = filterProject === 'all' || r.projectId === filterProject
    return matchesLevel && matchesStatus && matchesProject
  })

  const riskStats = {
    total: risks.length,
    élevé: risks.filter(r => r.level === 'élevé').length,
    moyen: risks.filter(r => r.level === 'moyen').length,
    faible: risks.filter(r => r.level === 'faible').length
  }

  const statCards = [
    { label: 'Total risques', value: riskStats.total, iconBg: 'icon-bg-gray', color: 'text-gray-900' },
    { label: 'Risques élevés', value: riskStats.élevé, iconBg: 'icon-bg-red', color: 'text-red-600', bg: 'bg-red-50/40' },
    { label: 'Risques moyens', value: riskStats.moyen, iconBg: 'icon-bg-orange', color: 'text-orange-600', bg: 'bg-orange-50/40' },
    { label: 'Risques faibles', value: riskStats.faible, iconBg: 'icon-bg-green', color: 'text-green-600', bg: 'bg-green-50/40' }
  ]

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (editRisk) {
        await updateRisk(editRisk.id, data)
      } else {
        await addRisk(data)
      }
      setModalOpen(false)
      setEditRisk(null)
    } catch (err) {
      alert('Erreur: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteRisk(deleteTarget.id)
      setDeleteOpen(false)
      setDeleteTarget(null)
    } catch (err) {
      alert('Erreur: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Gestion {apiMode === 'demo' && <span className="badge bg-amber-50 text-amber-600 ml-2">Mode démo</span>}</p>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Gestion des Risques</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary"><Download className="w-4 h-4" />Exporter</button>
          <button className="btn-primary" onClick={() => { setEditRisk(null); setModalOpen(true) }}>
            <Plus className="w-4 h-4" />Nouveau risque
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <div key={c.label} className={`stat-card text-center stagger-${i+1} animate-slide-up ${c.bg || ''}`}>
            <p className={`text-3xl font-bold ${c.color}`} style={{ fontFamily: 'Outfit, sans-serif' }}>{c.value}</p>
            <p className="text-gray-400 text-sm mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <RiskMatrix risks={filteredRisks} />

      {/* Filters */}
      <div className="card-static p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="input-field w-auto">
              <option value="all">Tous les niveaux</option>
              <option value="élevé">Élevé</option>
              <option value="moyen">Moyen</option>
              <option value="faible">Faible</option>
            </select>
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-auto">
            <option value="all">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="mitigé">Mitigé</option>
            <option value="clos">Clos</option>
          </select>
          <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="input-field w-auto">
            <option value="all">Tous les projets</option>
            {projects.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-400">{filteredRisks.length} risque(s) affiché(s)</p>

      {/* Risks list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredRisks.map((risk) => (
          <div key={risk.id} className="card-static overflow-hidden group">
            <div className="h-1" style={{ background: risk.level === 'élevé' ? '#ef4444' : risk.level === 'moyen' ? '#f59e0b' : '#22c55e' }} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`badge ${risk.level === 'élevé' ? 'bg-red-50 text-red-700' : risk.level === 'moyen' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>{risk.level.toUpperCase()}</span>
                  <span className="text-xs text-gray-300 font-mono">{risk.code || risk.id}</span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Edit / Delete */}
                  <button onClick={() => { setEditRisk(risk); setModalOpen(true) }} className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100" title="Modifier">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setDeleteTarget(risk); setDeleteOpen(true) }} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100" title="Supprimer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className={`badge ml-1 ${risk.status === 'actif' ? 'bg-red-50 text-red-600' : risk.status === 'mitigé' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>{risk.status}</span>
                </div>
              </div>

              <h4 className="font-semibold text-gray-900 mb-1.5 text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>{risk.title}</h4>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">{risk.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[0.6875rem] text-gray-400 mb-1.5 font-medium">Probabilité</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 progress-track h-1.5">
                      <div className="progress-bar h-1.5" style={{ width: `${(risk.probability / 5) * 100}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }} />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-8 text-right">{risk.probability}/5</span>
                  </div>
                </div>
                <div>
                  <p className="text-[0.6875rem] text-gray-400 mb-1.5 font-medium">Impact</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 progress-track h-1.5">
                      <div className="progress-bar h-1.5" style={{ width: `${(risk.impact / 5) * 100}%`, background: 'linear-gradient(90deg, #ef4444, #f87171)' }} />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-8 text-right">{risk.impact}/5</span>
                  </div>
                </div>
              </div>

              <div className="pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                <p className="text-[0.6875rem] text-gray-400 font-medium mb-1">Plan de mitigation</p>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">{risk.mitigation}</p>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-400">Progression</span>
                  <span className="font-bold text-gray-700">{risk.mitigationProgress}%</span>
                </div>
                <div className="progress-track h-1.5">
                  <div className="progress-bar h-1.5" style={{ width: `${risk.mitigationProgress}%`, background: 'linear-gradient(90deg, #059669, #34d399)' }} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>Resp: <span className="font-medium text-gray-600">{risk.owner}</span></span>
                <span>{risk.updatedAt ? new Date(risk.updatedAt).toLocaleDateString('fr-FR') : ''}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRisks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 card-static">
          <Shield className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-400 font-medium">Aucun risque trouvé</p>
        </div>
      )}

      {/* Modals */}
      <RiskModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditRisk(null) }} onSave={handleSave} risk={editRisk} projects={projects} loading={saving} />
      <DeleteConfirmModal isOpen={deleteOpen} onClose={() => { setDeleteOpen(false); setDeleteTarget(null) }} onConfirm={handleDelete} itemName={deleteTarget?.title} itemType="le risque" loading={saving} />
    </div>
  )
}
