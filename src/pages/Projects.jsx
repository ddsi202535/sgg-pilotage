import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { Search, Plus, Filter, Calendar, User, Wallet, ArrowRight, FolderKanban, Pencil, Trash2 } from 'lucide-react'
import ProjectModal from '../components/modals/ProjectModal'
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal'

export default function Projects() {
  const { projects, addProject, updateProject, deleteProject, apiMode } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.manager.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    const matchesType = typeFilter === 'all' || p.type === typeFilter
    const matchesSource = sourceFilter === 'all' || p.sourceBudget === sourceFilter
    return matchesSearch && matchesStatus && matchesType && matchesSource
  })

  const statusConfig = {
    en_cours: { label: 'En cours', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', color: '#059669' },
    planification: { label: 'Planification', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', color: '#3b82f6' },
    termine: { label: 'Terminé', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', color: '#9ca3af' },
    en_retard: { label: 'En retard', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', color: '#ef4444' }
  }

  const typeConfig = {
    informatique: { label: 'Informatique', bg: 'bg-violet-50', text: 'text-violet-700' },
    juridique: { label: 'Juridique', bg: 'bg-sky-50', text: 'text-sky-700' },
    communication: { label: 'Communication', bg: 'bg-pink-50', text: 'text-pink-700' },
    equipement: { label: 'Équipement', bg: 'bg-amber-50', text: 'text-amber-700' },
    organisationnel: { label: 'Organisationnel', bg: 'bg-teal-50', text: 'text-teal-700' }
  }

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (editProject) {
        await updateProject(editProject.id, data)
      } else {
        await addProject(data)
      }
      setModalOpen(false)
      setEditProject(null)
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
      await deleteProject(deleteTarget.id)
      setDeleteOpen(false)
      setDeleteTarget(null)
    } catch (err) {
      alert('Erreur: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (e, project) => {
    e.preventDefault()
    e.stopPropagation()
    setEditProject(project)
    setModalOpen(true)
  }

  const openDelete = (e, project) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleteTarget(project)
    setDeleteOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Portefeuille {apiMode === 'demo' && <span className="badge bg-amber-50 text-amber-600 ml-2">Mode démo</span>}</p>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Projets
          </h1>
        </div>
        <button className="btn-primary" onClick={() => { setEditProject(null); setModalOpen(true) }}>
          <Plus className="w-4 h-4" />
          Nouveau projet
        </button>
      </div>

      {/* Filters */}
      <div className="card-static p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Rechercher un projet..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-auto">
              <option value="all">Tous les statuts</option>
              <option value="en_cours">En cours</option>
              <option value="planification">Planification</option>
              <option value="termine">Terminé</option>
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field w-auto">
              <option value="all">Tous les types</option>
              <option value="informatique">Informatique</option>
              <option value="juridique">Juridique</option>
              <option value="communication">Communication</option>
              <option value="equipement">Équipement</option>
              <option value="organisationnel">Organisationnel</option>
            </select>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="input-field w-auto">
              <option value="all">Toutes les sources</option>
              <option value="MDD">MDD</option>
              <option value="INVEST">INVEST</option>
              <option value="PNUD">PNUD</option>
              <option value="FONDS ANRT">FONDS ANRT</option>
              <option value="DIO">DIO</option>
            </select>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-400">{filteredProjects.length} projet(s) trouvé(s)</p>

      {/* Projects grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredProjects.map((project, i) => {
          const sc = statusConfig[project.status] || statusConfig.en_cours
          const tc = typeConfig[project.type]
          return (
            <Link key={project.id} to={`/projects/${project.id}`} className={`card p-0 group overflow-hidden stagger-${Math.min(i+1, 4)} animate-slide-up`} style={{ textDecoration: 'none' }}>
              <div className="h-1 w-full" style={{ background: sc.color }} />
              <div className="p-5">
                {/* Badges + actions */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                    {tc && <span className={`badge ${tc.bg} ${tc.text}`}>{tc.label}</span>}
                    {project.sourceBudget && (
                      <span className="badge bg-gray-100 text-gray-500 font-bold uppercase text-[9px] tracking-tight">
                        {project.sourceBudget}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => openEdit(e, project)} className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors" title="Modifier">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => openDelete(e, project)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors" title="Supprimer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-green-700 transition-colors" style={{ fontFamily: 'Outfit, sans-serif' }}>{project.name}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2 leading-relaxed">{project.description}</p>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center text-sm text-gray-500"><User className="w-3.5 h-3.5 mr-2 text-gray-400" />{project.manager}</div>
                  <div className="flex items-center text-sm text-gray-500"><Wallet className="w-3.5 h-3.5 mr-2 text-gray-400" />{(project.budget / 1000000).toFixed(1)} MDH</div>
                  <div className="flex items-center text-sm text-gray-500"><Calendar className="w-3.5 h-3.5 mr-2 text-gray-400" />{new Date(project.startDate).toLocaleDateString('fr-FR')} — {new Date(project.endDate).toLocaleDateString('fr-FR')}</div>
                </div>

                <div className="space-y-3 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-400 font-medium">Physique</span>
                      <span className="font-semibold text-gray-700">{project.physicalProgress}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-bar" style={{ width: `${project.physicalProgress}%`, background: 'linear-gradient(90deg, #059669, #10b981)' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-400 font-medium">Financier</span>
                      <span className="font-semibold text-gray-700">{project.financialProgress}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-bar" style={{ width: `${project.financialProgress}%`, background: 'linear-gradient(90deg, #0284c7, #38bdf8)' }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end mt-4 text-xs text-gray-400 group-hover:text-green-600 transition-colors">
                  <span className="font-medium">Voir détails</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 card-static">
          <FolderKanban className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-400 font-medium">Aucun projet trouvé</p>
          <p className="text-gray-300 text-sm mt-1">Modifiez vos filtres ou créez un nouveau projet</p>
        </div>
      )}

      {/* Modals */}
      <ProjectModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditProject(null) }} onSave={handleSave} project={editProject} loading={saving} />
      <DeleteConfirmModal isOpen={deleteOpen} onClose={() => { setDeleteOpen(false); setDeleteTarget(null) }} onConfirm={handleDelete} itemName={deleteTarget?.name} itemType="le projet" loading={saving} />
    </div>
  )
}
