import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { projectsAPI, buildFileUrl } from '../services/api'
import ProjectModal from '../components/modals/ProjectModal'
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal'
import GanttChart from '../components/GanttChart'
import ProjectPrintTemplate from '../components/ProjectPrintTemplate'
import { strategicAPI } from '../services/api'
import { useReactToPrint } from 'react-to-print'
import {
  ArrowLeft, Calendar, User, Wallet, FolderOpen, MessageSquare, Paperclip,
  CheckCircle, Clock, AlertCircle, FileText, TrendingUp, Upload, Download, Printer,
  Plus, Pencil, Trash2, X, Save, Send, Link as LinkIcon,
  Check, Search, Flag, BarChart3, Target as TargetIcon, 
  Layers
} from 'lucide-react'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { projects, risks, updateProject, deleteProject, apiMode, reload } = useData()
  const { user } = useAuth()
  const { t } = useLanguage()

  const project = projects.find(p => p.id === id)

  // ─── Print & PDF ───────────────────────────────────────
  const componentRef = useRef(null)
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Fiche_Projet_${project?.code || 'SGG'}`
  })

  // ─── State ─────────────────────────────────────────────
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Phases inline editing
  const [editingPhase, setEditingPhase] = useState(null)
  const [newPhaseName, setNewPhaseName] = useState('')
  const [addingPhase, setAddingPhase] = useState(false)

  // Milestones
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [newMilestone, setNewMilestone] = useState({ name: '', date: '' })

  // Deliverables
  const [addingDeliverable, setAddingDeliverable] = useState(false)
  const [newDeliverableName, setNewDeliverableName] = useState('')
  const [newDeliverableFile, setNewDeliverableFile] = useState(null)
  const [uploadingDeliverable, setUploadingDeliverable] = useState(false)
  const [attachingToId, setAttachingToId] = useState(null)
  const fileInputRef = useRef(null)
  const attachInputRef = useRef(null)

  // Documents
  const [addingDocument, setAddingDocument] = useState(false)
  const docInputRef = useRef(null)

  // Financial editing
  const [editingFinancial, setEditingFinancial] = useState(false)
  const [financialForm, setFinancialForm] = useState({ consumed: 0, financialProgress: 0 })

  // Comments
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  // Strategic/LdF state
  const [addingObj, setAddingObj] = useState(false)
  const [objForm, setObjForm] = useState({ label: '' })
  const [addingIndicateur, setAddingIndicateur] = useState(null)
  const [indicateurForm, setIndicateurForm] = useState({ label: '', unite: '' })
  const [addingMesure, setAddingMesure] = useState(null)
  const [mesureForm, setMesureForm] = useState({ annee: new Date().getFullYear(), valeurCible: '', valeurReel: '' })

  // ─── Load comments ─────────────────────────────────────
  const loadComments = useCallback(async () => {
    if (!id || apiMode !== 'api') return
    setLoadingComments(true)
    try {
      const data = await projectsAPI.getComments(id)
      setComments(data)
    } catch { /* ignore */ }
    finally { setLoadingComments(false) }
  }, [id, apiMode])

  useEffect(() => { loadComments() }, [loadComments])

  // ─── Not found ─────────────────────────────────────────
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <FolderOpen className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-400 font-medium mb-2">Projet non trouvé</p>
        <Link to="/projects" className="text-sm text-green-600 hover:text-green-700 font-medium">
          ← Retour aux projets
        </Link>
      </div>
    )
  }

  const projectRisks = risks.filter(r => r.projectId === project.id)

  // ─── Handlers ──────────────────────────────────────────

  const handleEditSave = async (data) => {
    setSaving(true)
    try {
      await updateProject(id, data)
      setEditModalOpen(false)
    } catch (err) { alert('Erreur: ' + err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteProject(id)
      navigate('/projects')
    } catch (err) { alert('Erreur: ' + err.message) }
    finally { setSaving(false) }
  }

  // Phases
  const handlePhaseProgress = async (phase, newProgress) => {
    try {
      if (apiMode === 'api') {
        await projectsAPI.updatePhase(id, phase.id, { progress: newProgress })
        await reload()
      }
    } catch (err) { console.error(err) }
  }

  const handlePhaseStatus = async (phase, newStatus) => {
    try {
      const progress = newStatus === 'done' ? 100 : newStatus === 'pending' ? 0 : phase.progress
      if (apiMode === 'api') {
        await projectsAPI.updatePhase(id, phase.id, { status: newStatus, progress })
        await reload()
      }
    } catch (err) { console.error(err) }
  }

  const handleAddPhase = async () => {
    if (!newPhaseName.trim()) return
    try {
      if (apiMode === 'api') {
        await projectsAPI.addPhase(id, { name: newPhaseName })
        await reload()
      }
      setNewPhaseName('')
      setAddingPhase(false)
    } catch (err) { alert('Erreur: ' + err.message) }
  }

  const handleDeletePhase = async (phaseId) => {
    try {
      if (apiMode === 'api') {
        await projectsAPI.deletePhase(id, phaseId)
        await reload()
      }
    } catch (err) { alert('Erreur: ' + err.message) }
  }

  // Milestones
  const handleAddMilestone = async () => {
    if (!newMilestone.name.trim() || !newMilestone.date) return
    try {
      if (apiMode === 'api') {
        await projectsAPI.addMilestone(id, newMilestone)
        await reload()
      }
      setNewMilestone({ name: '', date: '' })
      setAddingMilestone(false)
    } catch (err) { alert('Erreur: ' + err.message) }
  }

  const handleMilestoneStatus = async (milestone, newStatus) => {
    try {
      if (apiMode === 'api') {
        await projectsAPI.updateMilestone(id, milestone.id, { status: newStatus })
        await reload()
      }
    } catch (err) { console.error(err) }
  }

  const handleDeleteMilestone = async (milestoneId) => {
    try {
      if (apiMode === 'api') {
        await projectsAPI.deleteMilestone(id, milestoneId)
        await reload()
      }
    } catch (err) { alert('Erreur: ' + err.message) }
  }

  // Deliverables
  const handleAddDeliverable = async () => {
    if (!newDeliverableName.trim() && !newDeliverableFile) return
    try {
      setUploadingDeliverable(true)
      if (apiMode === 'api') {
        if (newDeliverableFile) {
          const formData = new FormData()
          formData.append('file', newDeliverableFile)
          if (newDeliverableName.trim()) formData.append('name', newDeliverableName.trim())
          await projectsAPI.addDeliverable(id, formData)
        } else {
          await projectsAPI.addDeliverable(id, { name: newDeliverableName })
        }
        await reload()
      }
      setNewDeliverableName('')
      setNewDeliverableFile(null)
      setAddingDeliverable(false)
    } catch (err) { alert('Erreur: ' + err.message) } finally {
      setUploadingDeliverable(false)
    }
  }

  const handleAttachFile = async (deliverableId, file) => {
    if (!file) return
    try {
      setAttachingToId(deliverableId)
      const formData = new FormData()
      formData.append('file', file)
      await projectsAPI.attachDeliverableFile(id, deliverableId, formData)
      await reload()
    } catch (err) { alert('Erreur upload: ' + err.message) } finally {
      setAttachingToId(null)
    }
  }

  const handleDeleteDeliverable = async (delName, delIndex, directId = null) => {
    try {
      if (apiMode === 'api') {
        let delId = directId
        if (!delId) {
          // Fallback: fetch from server to find id
          const fullProject = await projectsAPI.getById(id)
          const deliverable = fullProject.deliverables?.find((d, i) =>
            typeof d === 'string' ? d === delName : d.name === delName
          ) || fullProject.deliverables?.[delIndex]
          delId = deliverable?.id
        }
        if (delId) {
          await projectsAPI.deleteDeliverable(id, delId)
          await reload()
        }
      }
    } catch (err) { alert('Erreur: ' + err.message) }
  }

  // Documents
  const handleAddDocument = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      setAddingDocument(true)
      if (apiMode === 'api') {
        const formData = new FormData()
        formData.append('file', file)
        await projectsAPI.addDocument(id, formData)
        await reload()
      }
    } catch (err) { alert('Erreur: ' + err.message) } finally {
      setAddingDocument(false)
    }
  }

  const handleDeleteDocument = async (docId) => {
    try {
      if (apiMode === 'api') {
        await projectsAPI.deleteDocument(id, docId)
        await reload()
      }
    } catch (err) { alert('Erreur: ' + err.message) }
  }

  // Financial update
  const handleFinancialSave = async () => {
    try {
      if (apiMode === 'api') {
        await projectsAPI.updateProgress(id, {
          consumed: financialForm.consumed,
          financialProgress: financialForm.financialProgress
        })
        await reload()
      }
      setEditingFinancial(false)
    } catch (err) { alert('Erreur: ' + err.message) }
  }

  // Comments
  const handleAddComment = async () => {
    if (!commentText.trim()) return
    try {
      if (apiMode === 'api') {
        const comment = await projectsAPI.addComment(id, commentText)
        setComments(prev => [comment, ...prev])
      }
      setCommentText('')
    } catch (err) { alert('Erreur: ' + err.message) }
  }

  // ─── Strategic Handlers ───
  const handleCreateObj = async () => {
    if (!objForm.label) return
    try {
      await strategicAPI.createObjectif({ label: objForm.label, projectId: id })
      setAddingObj(false); setObjForm({ label: '' }); reload()
    } catch (err) { alert(err.message) }
  }
  const handleCreateInd = async (objId) => {
    if (!indicateurForm.label) return
    try {
      await strategicAPI.createIndicateur({ ...indicateurForm, objectifId: objId })
      setAddingIndicateur(null); setIndicateurForm({ label: '', unite: '' }); reload()
    } catch (err) { alert(err.message) }
  }
  const handleCreateMesure = async (indId) => {
    if (!mesureForm.annee) return
    try {
      await strategicAPI.createMesure({ ...mesureForm, indicateurId: indId })
      setAddingMesure(null); setMesureForm({ annee: new Date().getFullYear(), valeurCible: '', valeurReel: '' }); reload()
    } catch (err) { alert(err.message) }
  }
  const handleUpdateMesure = async (mid, data) => {
    try { await strategicAPI.updateMesure(mid, data); reload() } catch (err) { alert(err.message) }
  }
  const handleDeleteMesure = async (mid) => {
    try { await strategicAPI.deleteMesure(mid); reload() } catch (err) { alert(err.message) }
  }

  // ─── Helpers ───────────────────────────────────────────
  const getStatusIcon = (status) => {
    switch (status) {
      case 'done': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />
      default: return <AlertCircle className="w-4 h-4 text-gray-300" />
    }
  }

  const statusConfig = {
    done: { label: 'Terminé', bg: 'bg-green-50', text: 'text-green-700' },
    in_progress: { label: 'En cours', bg: 'bg-blue-50', text: 'text-blue-700' },
    pending: { label: 'En attente', bg: 'bg-gray-100', text: 'text-gray-500' }
  }

  const projectStatusConfig = {
    en_cours: { label: 'En cours', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    planification: { label: 'Planification', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    termine: { label: 'Terminé', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
    en_retard: { label: 'En retard', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' }
  }

  const psc = projectStatusConfig[project.status] || projectStatusConfig.en_cours

  const infoCards = [
    { label: 'Chef de projet', value: project.manager, icon: User, iconBg: 'icon-bg-blue', iconColor: 'text-blue-600' },
    { label: 'Source', value: project.sourceBudget || 'MDD', icon: Layers, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
    { label: 'Budget', value: `${(project.budget / 1000000).toFixed(1)} MDH`, icon: Wallet, iconBg: 'icon-bg-green', iconColor: 'text-green-600' },
    { label: 'Période', value: `${new Date(project.startDate).toLocaleDateString('fr-FR')} — ${new Date(project.endDate).toLocaleDateString('fr-FR')}`, icon: Calendar, iconBg: 'icon-bg-purple', iconColor: 'text-purple-600', small: true },
    { label: 'Risques', value: `${projectRisks.length} identifié(s)`, icon: AlertCircle, iconBg: 'icon-bg-red', iconColor: 'text-red-600' }
  ]

  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
    if (mins < 1) return "À l'instant"
    if (mins < 60) return `Il y a ${mins}min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `Il y a ${hrs}h`
    return new Date(date).toLocaleDateString('fr-FR')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Retour aux projets
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs text-gray-300 font-mono">{project.code}</span>
              <span className={`badge ${psc.bg} ${psc.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${psc.dot}`} />
                {psc.label}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {project.name}
            </h1>
            <p className="text-gray-400 mt-1 text-sm leading-relaxed max-w-2xl">{project.description}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => handlePrint()} className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-xl font-medium text-sm transition-colors border border-gray-200">
              <Printer className="w-4 h-4" /> Fiche Projet
            </button>
            <button onClick={() => setEditModalOpen(true)} className="btn-secondary">
              <Pencil className="w-4 h-4" /> Modifier
            </button>
            <button onClick={() => setDeleteModalOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium text-sm transition-colors">
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Key info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {infoCards.map((c, i) => (
          <div key={c.label} className={`stat-card stagger-${i+1} animate-slide-up`} style={{ padding: '1rem 1.25rem' }}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <c.icon className={`w-5 h-5 ${c.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400">{c.label}</p>
                <p className={`font-semibold text-gray-900 truncate ${c.small ? 'text-xs' : 'text-sm'}`}>{c.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <GanttChart project={project} />

      {/* ═══ Progress section ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Phases ── */}
        <div className="card-static p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <FolderOpen className="w-4 h-4 text-gray-400" />
              Phases du projet
            </h3>
            <button onClick={() => setAddingPhase(true)} className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-medium">
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>

          <div className="space-y-2">
            {project.phases.map((phase) => {
              const sc = statusConfig[phase.status] || statusConfig.pending
              return (
                <div key={phase.id} className="p-3 bg-gray-50/60 rounded-xl hover:bg-gray-100/60 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      {getStatusIcon(phase.status)}
                      <span className="font-medium text-sm text-gray-800">{phase.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={phase.status}
                        onChange={(e) => handlePhaseStatus(phase, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-1.5 py-0.5 bg-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <option value="pending">En attente</option>
                        <option value="in_progress">En cours</option>
                        <option value="done">Terminé</option>
                      </select>
                      <button
                        onClick={() => handleDeletePhase(phase.id)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="Supprimer la phase"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 progress-track h-1.5">
                      <div className="progress-bar h-1.5" style={{
                        width: `${phase.progress}%`,
                        background: phase.status === 'done' ? '#22c55e' : 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                      }} />
                    </div>
                    <input
                      type="number"
                      min="0" max="100"
                      value={phase.progress}
                      onChange={(e) => handlePhaseProgress(phase, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-12 text-xs text-center border border-gray-200 rounded-lg py-0.5 font-mono bg-white"
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                </div>
              )
            })}

            {/* Project Dependencies (Axe 4) */}
            {project.dependencies && project.dependencies.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" />
                  Projets Prérequis ({project.dependencies.length})
                </h4>
                {/* Blocking alert */}
                {project.dependencies.some(depId => {
                  const dep = projects.find(p => p.id === depId)
                  return dep && dep.status !== 'termine'
                }) && (
                  <div className="mb-3 flex items-center gap-2.5 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-700 font-medium">
                      Ce projet dépend de projets non encore terminés. Risque de blocage.
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  {project.dependencies.map(depId => {
                    const dep = projects.find(p => p.id === depId)
                    if (!dep) return null
                    const isDone = dep.status === 'termine'
                    const isLate = dep.status === 'en_retard'
                    return (
                      <Link 
                        key={depId} 
                        to={`/projects/${depId}`}
                        className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-green-200 hover:bg-green-50/20 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isDone ? 'bg-green-100' : isLate ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            {isDone 
                              ? <CheckCircle className="w-4 h-4 text-green-600" />
                              : isLate 
                                ? <AlertCircle className="w-4 h-4 text-red-500" />
                                : <Clock className="w-4 h-4 text-blue-500" />
                            }
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 group-hover:text-green-700 transition-colors">{dep.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400 font-mono">{dep.code}</span>
                              <span className="text-[10px] text-gray-300">•</span>
                              <span className="text-[10px] text-gray-500">{dep.manager}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs font-bold text-gray-800">{dep.physicalProgress}%</p>
                            <p className="text-[10px] text-gray-400">avancement</p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                            isDone ? 'bg-green-100 text-green-700' :
                            isLate ? 'bg-red-100 text-red-700' :
                            dep.status === 'en_cours' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {isDone ? 'Terminé' : isLate ? 'En retard' : dep.status === 'en_cours' ? 'En cours' : 'Planification'}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}


            {/* Add phase form */}
            {addingPhase && (
              <div className="flex items-center gap-2 p-3 bg-green-50/40 rounded-xl border border-green-100">
                <input
                  type="text"
                  value={newPhaseName}
                  onChange={e => setNewPhaseName(e.target.value)}
                  placeholder="Nom de la phase"
                  className="input-field flex-1 text-sm"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleAddPhase()}
                />
                <button onClick={handleAddPhase} className="btn-primary py-1.5 px-3 text-xs">
                  <Save className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setAddingPhase(false); setNewPhaseName('') }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4" style={{ borderTop: '2px solid #f1f5f9' }}>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400 font-medium">Progression globale</span>
              <span className="font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{project.physicalProgress}%</span>
            </div>
            <div className="progress-track h-2.5">
              <div className="progress-bar h-2.5" style={{ width: `${project.physicalProgress}%`, background: 'linear-gradient(90deg, #059669, #34d399)' }} />
            </div>
          </div>
        </div>

        {/* ── Milestones ── */}
        <div className="card-static p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <Clock className="w-4 h-4 text-gray-400" />
              Jalons
            </h3>
            <button onClick={() => setAddingMilestone(true)} className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-medium">
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>

          <div className="space-y-2">
            {project.milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50/60 rounded-xl hover:bg-gray-100/60 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleMilestoneStatus(milestone, milestone.status === 'done' ? 'pending' : milestone.status === 'pending' ? 'in_progress' : 'done')}
                    className="hover:scale-110 transition-transform"
                    title="Changer le statut"
                  >
                    {getStatusIcon(milestone.status)}
                  </button>
                  <span className={`font-medium text-sm ${milestone.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{milestone.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">
                    {new Date(milestone.date).toLocaleDateString('fr-FR')}
                  </span>
                  <button
                    onClick={() => handleDeleteMilestone(milestone.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add milestone form */}
            {addingMilestone && (
              <div className="p-3 bg-green-50/40 rounded-xl border border-green-100 space-y-2">
                <input
                  type="text"
                  value={newMilestone.name}
                  onChange={e => setNewMilestone(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom du jalon"
                  className="input-field text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newMilestone.date}
                    onChange={e => setNewMilestone(prev => ({ ...prev, date: e.target.value }))}
                    className="input-field text-sm flex-1"
                  />
                  <button onClick={handleAddMilestone} className="btn-primary py-1.5 px-3 text-xs">
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setAddingMilestone(false); setNewMilestone({ name: '', date: '' }) }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {project.milestones.length === 0 && !addingMilestone && (
              <p className="text-sm text-gray-300 text-center py-6">Aucun jalon</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Financial and Risks ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Financial ── */}
        <div className="card-static p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              Suivi financier
            </h3>
            {!editingFinancial ? (
              <button
                onClick={() => {
                  setFinancialForm({ consumed: project.consumed, financialProgress: project.financialProgress })
                  setEditingFinancial(true)
                }}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
              >
                <Pencil className="w-3.5 h-3.5" /> Modifier
              </button>
            ) : (
              <div className="flex gap-1">
                <button onClick={handleFinancialSave} className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-medium">
                  <Save className="w-3.5 h-3.5" /> Enregistrer
                </button>
                <button onClick={() => setEditingFinancial(false)} className="text-xs text-gray-400 hover:text-gray-600 ml-2">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {editingFinancial ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Budget engagé (DH)</label>
                <input
                  type="number"
                  value={financialForm.consumed}
                  onChange={e => setFinancialForm(prev => ({ ...prev, consumed: parseFloat(e.target.value) || 0 }))}
                  className="input-field"
                />
                <p className="text-xs text-gray-400 mt-1">{(financialForm.consumed / 1000000).toFixed(2)} MDH sur {(project.budget / 1000000).toFixed(2)} MDH</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Taux d'exécution (%)</label>
                <input
                  type="range" min="0" max="100"
                  value={financialForm.financialProgress}
                  onChange={e => setFinancialForm(prev => ({ ...prev, financialProgress: parseInt(e.target.value) }))}
                  className="w-full accent-blue-600"
                />
                <p className="text-xs text-gray-900 font-bold text-right mt-1">{financialForm.financialProgress}%</p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {[
                  { label: 'Budget total', value: `${(project.budget / 1000000).toFixed(2)} MDH` },
                  { label: 'Engagé', value: `${(project.consumed / 1000000).toFixed(2)} MDH` },
                  { label: 'Restant', value: `${((project.budget - project.consumed) / 1000000).toFixed(2)} MDH` }
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center p-3 bg-gray-50/60 rounded-xl">
                    <span className="text-sm text-gray-400">{item.label}</span>
                    <span className="font-semibold text-gray-900 text-sm">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4" style={{ borderTop: '2px solid #f1f5f9' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400 font-medium">Taux d'exécution</span>
                  <span className="font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{project.financialProgress}%</span>
                </div>
                <div className="progress-track h-2.5">
                  <div className="progress-bar h-2.5" style={{ width: `${project.financialProgress}%`, background: 'linear-gradient(90deg, #0284c7, #38bdf8)' }} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Risks ── */}
        <div className="card-static p-6">
          <h3 className="section-title">
            <AlertCircle className="w-4 h-4 text-gray-400" />
            Risques associés
          </h3>
          {projectRisks.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <AlertCircle className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm">Aucun risque identifié</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projectRisks.map((risk) => (
                <div key={risk.id} className={`p-4 rounded-xl border ${
                  risk.level === 'élevé' ? 'bg-red-50/40 border-red-100' : risk.level === 'moyen' ? 'bg-amber-50/40 border-amber-100' : 'bg-green-50/40 border-green-100'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-sm text-gray-900">{risk.title}</p>
                    <span className={`badge ${
                      risk.level === 'élevé' ? 'bg-red-100 text-red-700' : risk.level === 'moyen' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>{risk.level}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{risk.description}</p>
                  <div className="pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                    <p className="text-xs text-gray-400 mb-1">
                      <span className="font-medium">Mitigation:</span> {risk.mitigation}
                    </p>
                    <div className="flex items-center justify-between text-xs mt-2 mb-1">
                      <span className="text-gray-400">Progression</span>
                      <span className="font-bold text-gray-600">{risk.mitigationProgress}%</span>
                    </div>
                    <div className="progress-track h-1">
                      <div className="progress-bar h-1" style={{ width: `${risk.mitigationProgress}%`, background: '#22c55e' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Deliverables ═══ */}
      <div className="card-static p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">
            <FileText className="w-4 h-4 text-gray-400" />
            {t('project.deliverables')}
          </h3>
          <button onClick={() => setAddingDeliverable(true)} className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-medium">
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>

        {/* Hidden file input for attach-to-existing */}
        <input
          type="file"
          ref={attachInputRef}
          className="hidden"
          onChange={e => {
            if (e.target.files[0] && attachingToId) {
              handleAttachFile(attachingToId, e.target.files[0])
            }
            e.target.value = ''
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {project.deliverables.map((deliverable, index) => {
            const isObj = typeof deliverable === 'object'
            const name = isObj ? deliverable.name : deliverable
            const hasFile = isObj && deliverable.fileUrl
            const isAttaching = attachingToId === deliverable?.id

            return (
              <div key={deliverable?.id || index} className={`flex items-center justify-between gap-3 p-3 rounded-xl transition-colors group border ${
                hasFile ? 'bg-blue-50/40 border-blue-100 hover:bg-blue-50/60' : 'bg-gray-50/60 border-gray-100 hover:bg-gray-100/60'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    hasFile ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {hasFile
                      ? <Paperclip className="w-4 h-4 text-blue-600" />
                      : <FileText className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="min-w-0">
                    {hasFile ? (
                      <a
                        href={buildFileUrl(deliverable.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline block truncate"
                        title={deliverable.originalName || name}
                      >
                        {name}
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-gray-700 block truncate">{name}</span>
                    )}
                    {hasFile && (
                      <span className="text-[10px] text-gray-400">{(deliverable.fileSize / 1024).toFixed(0)} Ko • {deliverable.fileType?.split('/')[1] || 'Fichier'}</span>
                    )}
                    {!hasFile && (
                      <span className="text-[10px] text-amber-500">Aucun fichier joint</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {isAttaching && (
                    <span className="animate-spin w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent" />
                  )}
                  {!isAttaching && !hasFile && (
                    <button
                      onClick={() => {
                        setAttachingToId(deliverable.id)
                        attachInputRef.current?.click()
                      }}
                      className="p-1 text-amber-500 hover:text-amber-700 opacity-0 group-hover:opacity-100 transition-all"
                      title="Attacher un fichier"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {hasFile && (
                    <a
                      href={buildFileUrl(deliverable.fileUrl, true, deliverable.originalName)}
                      className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                      title="Télécharger"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteDeliverable(name, index, deliverable?.id)}
                    className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}

          {addingDeliverable && (
            <div className="flex flex-col gap-2 p-2.5 bg-green-50/40 rounded-xl border border-green-100 col-span-1 sm:col-span-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newDeliverableName}
                  onChange={e => setNewDeliverableName(e.target.value)}
                  placeholder="Nom du livrable (optionnel si fichier)"
                  className="input-field flex-1 text-sm"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleAddDeliverable()}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-1.5 border rounded-lg transition-colors ${
                    newDeliverableFile
                      ? 'bg-blue-50 border-blue-300 text-blue-600'
                      : 'bg-white border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200'
                  }`}
                  title="Joindre un fichier"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={e => setNewDeliverableFile(e.target.files[0])}
                />
                <button
                  onClick={handleAddDeliverable}
                  disabled={uploadingDeliverable}
                  className="btn-primary py-1.5 px-3 text-xs flex-shrink-0 flex items-center gap-1 disabled:opacity-60"
                >
                  {uploadingDeliverable
                    ? <span className="animate-spin w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent" />
                    : <Save className="w-3.5 h-3.5" />}
                  {newDeliverableFile ? 'Uploader' : 'Valider'}
                </button>
                <button onClick={() => { setAddingDeliverable(false); setNewDeliverableName(''); setNewDeliverableFile(null) }} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {newDeliverableFile && (
                <div className="text-xs text-blue-600 bg-blue-50 py-1 px-2 rounded-md flex items-center gap-1.5">
                  <Paperclip className="w-3 h-3" />
                  {newDeliverableFile.name} ({(newDeliverableFile.size / 1024).toFixed(0)} Ko)
                </div>
              )}
            </div>
          )}

          {project.deliverables.length === 0 && !addingDeliverable && (
            <div className="col-span-full flex flex-col items-center py-8 text-gray-400">
              <FileText className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm">Aucun livrable défini</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Objectifs & Indicateurs (LdF) ═══ */}
      <div className="card-static p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            Performance & Objectifs Stratégiques (LdF)
          </h3>
          <button onClick={() => setAddingObj(true)} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-bold">
            <Plus className="w-3.5 h-3.5" /> Nouvel Objectif
          </button>
        </div>

        <div className="space-y-4">
          {addingObj && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl animate-slide-down">
               <input className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 flex-1 bg-white" placeholder="Définir un objectif budgétaire/métier pour ce projet..." value={objForm.label} onChange={e => setObjForm({label: e.target.value})} autoFocus />
               <button onClick={handleCreateObj} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"><Check className="w-4 h-4"/></button>
               <button onClick={() => setAddingObj(false)} className="p-1.5 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition-colors"><X className="w-4 h-4"/></button>
            </div>
          )}

          {!project.objectifs?.length && !addingObj ? (
            <div className="py-8 text-center text-gray-400 italic text-sm bg-gray-50/50 rounded-xl border border-dashed border-gray-100">
               <TargetIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
              Aucun objectif stratégique défini pour ce projet. Les indicateurs de performance (KPI) permettent de mesurer l'impact de cette action.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.objectifs?.map(obj => (
                <div key={obj.id} className="bg-gray-50/40 border border-gray-100 rounded-xl p-4 group">
                  <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-2">
                       <BarChart3 className="w-4 h-4 text-emerald-500" />
                       <span className="font-bold text-gray-800 text-sm tracking-tight capitalize">{obj.label}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => setAddingIndicateur(obj.id)} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded" title="Ajouter un KPI"><Flag className="w-3.5 h-3.5"/></button>
                       <button onClick={() => strategicAPI.deleteObjectif(obj.id).then(reload)} className="p-1 text-red-300 hover:text-red-500 rounded" title="Supprimer l'objectif"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {addingIndicateur === obj.id && (
                      <div className="p-2 bg-amber-50 border border-amber-100 rounded-lg space-y-2 shadow-sm">
                         <div className="flex gap-2">
                           <input className="text-xs border border-gray-200 rounded px-1.5 py-1 flex-1 bg-white" placeholder="Nom du KPI *" value={indicateurForm.label} onChange={e => setIndicateurForm(f => ({...f, label: e.target.value}))} autoFocus />
                           <input className="text-xs border border-gray-200 rounded px-1.5 py-1 w-16 bg-white" placeholder="Unité" value={indicateurForm.unite} onChange={e => setIndicateurForm(f => ({...f, unite: e.target.value}))} />
                         </div>
                         <div className="flex justify-end gap-1">
                           <button onClick={() => handleCreateInd(obj.id)} className="p-1 bg-amber-600 text-white rounded text-[10px] px-2 font-bold transition-all">Créer le KPI</button>
                           <button onClick={() => setAddingIndicateur(null)} className="p-1 bg-gray-200 text-gray-400 rounded text-[10px] px-2">Annuler</button>
                         </div>
                      </div>
                    )}

                    {obj.indicateurs?.map(ind => (
                      <div key={ind.id} className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm group/ind hover:border-amber-200 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-1.5 font-bold text-[10px] text-gray-600 uppercase tracking-tighter">
                             <Flag className="w-3 h-3 text-amber-500" />
                             {ind.label} {ind.unite ? `(${ind.unite})` : ''}
                           </div>
                           <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover/ind:opacity-100 transition-all">
                              <button onClick={() => setAddingMesure(ind.id)} className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 rounded-full hover:bg-blue-100 transition-colors">Mesure annuelle</button>
                              <button onClick={() => strategicAPI.deleteIndicateur(ind.id).then(reload)} className="p-0.5 text-gray-200 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                           </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          {addingMesure === ind.id && (
                            <div className="flex items-center gap-1.5 py-1 bg-gray-50 rounded px-2">
                              <input className="text-[10px] border border-gray-200 rounded px-1 w-12" type="number" value={mesureForm.annee} onChange={e => setMesureForm(f => ({...f, annee: e.target.value}))} />
                              <input className="text-[10px] border border-gray-200 rounded px-1 w-14" type="number" placeholder="Cible" value={mesureForm.valeurCible} onChange={e => setMesureForm(f => ({...f, valeurCible: e.target.value}))} />
                              <input className="text-[10px] border border-gray-200 rounded px-1 w-14" type="number" placeholder="Réel" value={mesureForm.valeurReel} onChange={e => setMesureForm(f => ({...f, valeurReel: e.target.value}))} />
                              <button onClick={() => handleCreateMesure(ind.id)} className="p-1 bg-blue-600 text-white rounded"><Check className="w-2.5 h-2.5"/></button>
                            </div>
                          )}
                          {ind.mesures?.map(mes => {
                            const achievement = mes.valeurCible > 0 ? Math.min((mes.valeurReel || 0) / mes.valeurCible * 100, 100) : 0
                            return (
                              <div key={mes.id} className="flex items-center justify-between text-[11px] hover:bg-gray-50/50 p-1 rounded transition-colors group/mes">
                                <span className="font-mono text-gray-400 font-bold">{mes.annee}</span>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-gray-700">{mes.valeurReel ?? '—'} / {mes.valeurCible}</span>
                                  <div className="w-16 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                     <div className={`h-full ${achievement >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${achievement}%` }} />
                                  </div>
                                  <span className={`w-8 text-right font-bold ${achievement >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>{Math.round(achievement)}%</span>
                                  <button onClick={() => handleDeleteMesure(mes.id)} className="text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover/mes:opacity-100"><X className="w-2.5 h-2.5"/></button>
                                </div>
                              </div>
                            )
                          })}
                          {!ind.mesures?.length && !addingMesure && <div className="text-[10px] text-gray-300 italic pl-5">Aucune mesure</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Espace Collaboratif ═══ */}
      <div className="card-static p-6">
        <h3 className="section-title">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          {t('project.collaborative_space')}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Documents / Files */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 text-sm flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-gray-400" />
              Documents de travail ({project.documents?.length || 0})
            </h4>

            {/* List of documents */}
            {project.documents?.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto mb-3 pr-1">
                {project.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group border border-gray-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <a 
                        href={`http://localhost:3001/api${doc.fileUrl}?dl=1&name=${encodeURIComponent(doc.originalName || doc.name)}`}
                        className="text-sm text-gray-700 hover:text-blue-600 truncate font-medium transition-colors"
                        title={doc.originalName || doc.name}
                      >
                        {doc.originalName || doc.name}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{(doc.fileSize / 1024).toFixed(0)} Ko</span>
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Zone */}
            <div 
              onClick={() => !addingDocument && docInputRef.current?.click()}
              className={`p-6 border-2 border-dashed ${addingDocument ? 'border-gray-200 bg-gray-50 cursor-wait' : 'border-gray-200 hover:border-green-300 hover:bg-green-50/30 cursor-pointer'} rounded-xl text-center transition-all group relative`}
            >
              <input 
                type="file" 
                ref={docInputRef}
                onChange={handleAddDocument}
                className="hidden" 
              />
              <Upload className={`w-8 h-8 mx-auto mb-2 transition-colors ${addingDocument ? 'text-gray-300' : 'text-gray-300 group-hover:text-green-400'}`} />
              {addingDocument ? (
                <p className="text-sm text-gray-400 font-medium">Chargement en cours...</p>
              ) : (
                <p className="text-sm text-gray-400 group-hover:text-green-600 transition-colors">
                  Cliquez ici pour <span className="font-medium underline">parcourir</span> vos fichiers
                </p>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 text-sm flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
              {t('project.comments')} ({comments.length})
            </h4>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {comments.length === 0 && (
                <p className="text-sm text-gray-300 text-center py-4">Aucun commentaire pour le moment</p>
              )}
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50/60 p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                      {comment.user?.name?.charAt(0) || '?'}
                    </div>
                    <span className="font-semibold text-gray-700 text-xs">{comment.user?.name || 'Utilisateur'}</span>
                    <span className="text-gray-300 text-[0.6875rem]">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{comment.content}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={t('project.add_comment')}
                className="input-field flex-1"
                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
              />
              <button onClick={handleAddComment} className="btn-primary px-4" disabled={!commentText.trim()}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Modals ═══ */}
      <ProjectModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleEditSave}
        project={project}
        loading={saving}
      />
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={project.name}
        itemType="le projet"
        loading={saving}
      />

      {/* ═══ Hidden Print Template ═══ */}
      <div style={{ display: 'none' }}>
        <ProjectPrintTemplate ref={componentRef} project={project} />
      </div>

    </div>
  )
}
