import React, { useState, useEffect, useCallback } from 'react'
import { strategicAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import {
  Target, ChevronRight, ChevronDown, Plus, Pencil, Trash2, X, Save, Check,
  BarChart3, FolderKanban, Layers, Flag, Wallet, Users, TrendingUp, LinkIcon, Calendar
} from 'lucide-react'

const CURRENT_YEAR = new Date().getFullYear()

const formatDH = (n) => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M DH`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K DH`
  return `${n} DH`
}

// ─── Mesure Annuelle Row ─────────────────────────────────
function MesureRow({ mesure, indicateurUnit, onUpdate, onDelete, canEdit }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ annee: mesure.annee, valeurCible: mesure.valeurCible, valeurReel: mesure.valeurReel })

  const achievement = form.valeurCible > 0 ? Math.min(((form.valeurReel || 0) / form.valeurCible) * 100, 100) : 0

  const handleSave = async () => {
    await onUpdate(mesure.id, form)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 pl-6 py-1">
        <Calendar className="w-3 h-3 text-gray-400" />
        <input className="text-xs border border-gray-200 rounded px-1.5 py-0.5 w-16" type="number" value={form.annee} onChange={e => setForm(f => ({...f, annee: e.target.value}))} placeholder="Année" />
        <input className="text-xs border border-gray-200 rounded px-1.5 py-0.5 w-20" type="number" value={form.valeurCible || ''} onChange={e => setForm(f => ({...f, valeurCible: e.target.value}))} placeholder="Cible" />
        <input className="text-xs border border-gray-200 rounded px-1.5 py-0.5 w-20" type="number" value={form.valeurReel || ''} onChange={e => setForm(f => ({...f, valeurReel: e.target.value}))} placeholder="Réalisé" />
        <button onClick={handleSave} className="p-0.5 bg-green-600 text-white rounded hover:bg-green-700"><Check className="w-3 h-3"/></button>
        <button onClick={() => setEditing(false)} className="p-0.5 bg-gray-100 text-gray-400 rounded hover:bg-gray-200"><X className="w-3 h-3"/></button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 pl-6 py-1 group transition-all">
      <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
      <span className="text-[10px] font-mono font-bold text-gray-600 w-8">{mesure.annee}</span>
      <div className="flex-1 flex items-center gap-3">
        {mesure.valeurCible != null && (
          <>
            <div className="w-20 bg-gray-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-violet-500" style={{ width: `${achievement}%` }} />
            </div>
            <span className="text-[10px] font-mono text-gray-500">{mesure.valeurReel ?? '—'} / {mesure.valeurCible} {indicateurUnit || ''}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${achievement >= 100 ? 'bg-green-100 text-green-700' : achievement >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
              {Math.round(achievement)}%
            </span>
          </>
        )}
      </div>
      {canEdit && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-blue-500"><Pencil className="w-3 h-3"/></button>
          <button onClick={() => onDelete(mesure.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
        </div>
      )}
    </div>
  )
}

export default function Strategic() {
  const { isAdmin, user } = useAuth()
  const isRPROG = user?.profileId === 'RESPONSABLE_PROGRAMME'

  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [allProgrammes, setAllProgrammes] = useState([])

  const [addingAxe, setAddingAxe] = useState(false)
  const [axeForm, setAxeForm] = useState({ code: '', label: '', description: '' })
  
  const [linkingProgToAxe, setLinkingProgToAxe] = useState(null) // axeId
  const [linkProgId, setLinkProgId] = useState('')

  const [addingObj, setAddingObj] = useState(null) // projectId
  const [objForm, setObjForm] = useState({ label: '' })
  
  const [addingIndicateur, setAddingIndicateur] = useState(null)
  const [indicateurForm, setIndicateurForm] = useState({ label: '', unite: '' })
  
  const [addingMesure, setAddingMesure] = useState(null)
  const [mesureForm, setMesureForm] = useState({ annee: CURRENT_YEAR, valeurCible: '', valeurReel: '' })

  const canEditStructure = isAdmin
  const canEditKPI = (prog) => {
    if (isAdmin) return true
    if (isRPROG) {
      return prog.responsableId === user?.id
    }
    return false
  }

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true)
      const data = await strategicAPI.getTree()
      setTree(Array.isArray(data) ? data : [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [])

  const fetchAllProgrammes = useCallback(async () => {
    try {
      const pbs = await strategicAPI.getProgrammesBudgetaires()
      setAllProgrammes(Array.isArray(pbs) ? pbs : [])
    } catch (err) { console.error(err) }
  }, [])

  useEffect(() => { fetchTree(); fetchAllProgrammes() }, [fetchTree, fetchAllProgrammes])

  const toggleExpand = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const handleCreateAxe = async () => {
    if (!axeForm.code || !axeForm.label) return
    await strategicAPI.createAxe({ ...axeForm, sortOrder: tree.length })
    setAddingAxe(false); setAxeForm({ code: '', label: '', description: '' }); fetchTree()
  }

  const handleLinkProg = async (axeId) => {
    if (!linkProgId) return
    await strategicAPI.linkAxeToProgramme(linkProgId, axeId)
    setLinkingProgToAxe(null); setLinkProgId(''); fetchTree()
  }

  const handleRemoveProgFromAxe = async (pbId) => {
    if (!window.confirm('Retirer ce programme de cet axe ?')) return
    await strategicAPI.linkAxeToProgramme(pbId, null)
    fetchTree()
  }

  const handleCreateObj = async (projectId) => {
    if (!objForm.label) return
    await strategicAPI.createObjectif({ ...objForm, projectId })
    setAddingObj(null); setObjForm({ label: '' }); fetchTree()
  }

  const handleCreateIndicateur = async (objectifId) => {
    if (!indicateurForm.label) return
    await strategicAPI.createIndicateur({ ...indicateurForm, objectifId })
    setAddingIndicateur(null); setIndicateurForm({ label: '', unite: '' }); fetchTree()
  }

  const handleCreateMesure = async (indicateurId) => {
    if (!mesureForm.annee) return
    await strategicAPI.createMesure({ ...mesureForm, indicateurId })
    setAddingMesure(null); setMesureForm({ annee: CURRENT_YEAR, valeurCible: '', valeurReel: '' }); fetchTree()
  }

  const stats = {
    axes: tree.length,
    programmes: tree.reduce((acc, axe) => acc + (axe.programmes?.length || 0), 0),
    projets: tree.reduce((acc, axe) => acc + (axe.programmes?.reduce((a2, p) => a2 + (p.projects?.length || 0), 0) || 0), 0),
    indicateurs: tree.reduce((acc, axe) => acc + (axe.programmes?.reduce((a2, p) => a2 + (p.projects?.reduce((a3, pr) => a3 + (pr.objectifs?.reduce((a4, o) => a4 + (o.indicateurs?.length || 0), 0) || 0), 0) || 0), 0) || 0), 0),
    budget: tree.reduce((acc, axe) => acc + (axe.programmes?.reduce((a2, p) => a2 + (p.stats?.totalBudget || 0), 0) || 0), 0)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Pilotage Stratégique (LOLF)</p>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Suivi Loi de Finances</h1>
          <p className="text-sm text-gray-500 mt-1">Structure : Axe → Programme → Projet/Action → Objectif → Indicateur</p>
        </div>
        {canEditStructure && (
          <button onClick={() => setAddingAxe(true)} className="btn-primary flex-shrink-0">
            <Plus className="w-4 h-4" /> Nouvel axe
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Axes', val: stats.axes, icon: Layers, color: 'bg-violet-50 text-violet-600' },
          { label: 'Programmes', val: stats.programmes, icon: FolderKanban, color: 'bg-blue-50 text-blue-600' },
          { label: 'Projets/Actions', val: stats.projets, icon: Target, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Indicateurs', val: stats.indicateurs, icon: Flag, color: 'bg-amber-50 text-amber-600' },
          { label: 'Budget Total', val: formatDH(stats.budget), icon: Wallet, color: 'bg-rose-50 text-rose-600' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}><c.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-[0.6875rem] text-gray-400 uppercase tracking-wider">{c.label}</p>
                <p className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{c.val}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {addingAxe && (
        <div className="card-static p-5 border-2 border-dashed border-violet-200 bg-violet-50/30">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-violet-500"/> Nouvel Axe Stratégique</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input className="input-field text-sm" placeholder="Code (ex: AXE-1)" value={axeForm.code} onChange={e => setAxeForm(f => ({...f, code: e.target.value}))} />
            <input className="input-field text-sm" placeholder="Libellé de l'axe" value={axeForm.label} onChange={e => setAxeForm(f => ({...f, label: e.target.value}))} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateAxe} className="btn-primary"><Check className="w-4 h-4"/> Créer</button>
            <button onClick={() => setAddingAxe(false)} className="btn-secondary">Annuler</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tree.map(axe => (
          <div key={axe.id} className="card-static overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/80 transition-colors border-b border-gray-50" onClick={() => toggleExpand(`axe-${axe.id}`)}>
              <div className="flex items-center gap-3">
                {expanded[`axe-${axe.id}`] ? <ChevronDown className="w-4 h-4 text-violet-500"/> : <ChevronRight className="w-4 h-4 text-violet-500"/>}
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center"><Layers className="w-4 h-4 text-violet-600" /></div>
                <div>
                  <div className="flex items-center gap-2"><span className="text-[10px] font-mono font-bold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded">{axe.code}</span><span className="font-bold text-gray-900 text-sm">{axe.label}</span></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{axe.programmes?.length || 0} programme(s)</span>
                {canEditStructure && (
                  <button onClick={(e) => { e.stopPropagation(); setLinkingProgToAxe(axe.id) }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Plus className="w-3.5 h-3.5" /></button>
                )}
              </div>
            </div>

            {expanded[`axe-${axe.id}`] && (
              <div className="px-5 py-3 space-y-3 bg-gray-50/10">
                {linkingProgToAxe === axe.id && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 animate-slide-down">
                    <FolderKanban className="w-4 h-4 text-blue-500" />
                    <select className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 flex-1 bg-white focus:ring-2 focus:ring-blue-500" value={linkProgId} onChange={e => setLinkProgId(e.target.value)}>
                      <option value="">Sélectionner un programme budgétaire à lier...</option>
                      {allProgrammes.filter(p => !p.axeId || p.axeId === axe.id).map(p => <option key={p.id} value={p.id}>[{p.code}] {p.label}</option>)}
                    </select>
                    <button onClick={() => handleLinkProg(axe.id)} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><Check className="w-4 h-4"/></button>
                    <button onClick={() => setLinkingProgToAxe(null)} className="p-1.5 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition-colors"><X className="w-4 h-4"/></button>
                  </div>
                )}

                {(axe.programmes || []).map(prog => (
                  <div key={prog.id} className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-blue-50/20 transition-colors" onClick={() => toggleExpand(`prog-${prog.id}`)}>
                      <div className="flex items-center gap-3">
                        {expanded[`prog-${prog.id}`] ? <ChevronDown className="w-3.5 h-3.5 text-blue-400"/> : <ChevronRight className="w-3.5 h-3.5 text-blue-400"/>}
                        <FolderKanban className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{prog.code}</span>
                        <span className="font-semibold text-sm text-gray-800">{prog.label}</span>
                      </div>
                      <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                        <span className="text-xs text-gray-400">{prog.projects?.length || 0} action(s)</span>
                        {canEditStructure && <button onClick={() => handleRemoveProgFromAxe(prog.id)} className="p-1 text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>}
                      </div>
                    </div>

                    {expanded[`prog-${prog.id}`] && (
                      <div className="px-4 pb-4 space-y-3 border-t border-gray-50 bg-gray-50/5">
                        {(prog.projects || []).length === 0 ? (
                          <p className="text-[10px] text-gray-400 italic py-2">Aucun projet (action) rattaché à ce programme.</p>
                        ) : (
                          prog.projects.map(project => {
                            const projectCanEdit = canEditKPI(prog) || project.managerId === user?.id
                            return (
                              <div key={project.id} className="rounded-xl border border-emerald-100 bg-white/60 overflow-hidden">
                                <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-emerald-50/30 transition-colors" onClick={() => toggleExpand(`proj-${project.id}`)}>
                                  <div className="flex items-center gap-2">
                                    {expanded[`proj-${project.id}`] ? <ChevronDown className="w-3 h-3 text-emerald-400"/> : <ChevronRight className="w-3 h-3 text-emerald-400"/>}
                                    <Target className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{project.code}</span>
                                    <span className="text-xs font-bold text-gray-700">{project.name}</span>
                                    <span className={`text-[9px] px-1.5 rounded-full ${project.status === 'en_cours' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{project.status === 'en_cours' ? 'En cours' : project.status}</span>
                                  </div>
                                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <span className="text-[10px] text-gray-400">{project.objectifs?.length || 0} objectifs</span>
                                    {projectCanEdit && <button onClick={() => { setAddingObj(project.id); setExpanded(p => ({...p, [`proj-${project.id}`]: true})) }} className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all"><Plus className="w-3.5 h-3.5" /></button>}
                                  </div>
                                </div>

                                {expanded[`proj-${project.id}`] && (
                                  <div className="px-3 pb-3 pt-1 space-y-3 border-t border-emerald-50/50">
                                    {addingObj === project.id && (
                                      <div className="flex items-center gap-2 animate-slide-down">
                                        <BarChart3 className="w-3.5 h-3.5 text-green-500" />
                                        <input className="text-xs border border-gray-200 rounded-lg px-2 py-1 flex-1 bg-white" placeholder="Définir un objectif budgétaire/métier..." value={objForm.label} onChange={e => setObjForm({label: e.target.value})} autoFocus />
                                        <button onClick={() => handleCreateObj(project.id)} className="p-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"><Check className="w-3.5 h-3.5"/></button>
                                        <button onClick={() => setAddingObj(null)} className="p-1 bg-gray-100 text-gray-400 rounded hover:bg-gray-200 transition-colors"><X className="w-3.5 h-3.5"/></button>
                                      </div>
                                    )}

                                    {project.objectifs?.map(obj => (
                                      <div key={obj.id} className="space-y-2 bg-gray-50/30 rounded-lg p-2">
                                        <div className="flex items-center justify-between cursor-pointer hover:bg-white/80 px-2 py-1.5 rounded-md transition-all group" onClick={() => toggleExpand(`obj-${obj.id}`)}>
                                          <div className="flex items-center gap-2">
                                            {expanded[`obj-${obj.id}`] ? <ChevronDown className="w-3 h-3 text-green-500"/> : <ChevronRight className="w-3 h-3 text-green-500"/>}
                                            <BarChart3 className="w-3.5 h-3.5 text-green-500" />
                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-tight">{obj.label}</span>
                                          </div>
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                            {projectCanEdit && <button onClick={() => { setAddingIndicateur(obj.id); setExpanded(p => ({...p, [`obj-${obj.id}`]: true})) }} className="p-1 text-gray-400 hover:text-green-600"><Plus className="w-3 h-3" /></button>}
                                            {projectCanEdit && <button onClick={() => strategicAPI.deleteObjectif(obj.id).then(fetchTree)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>}
                                          </div>
                                        </div>

                                        {expanded[`obj-${obj.id}`] && (
                                          <div className="pl-6 space-y-2">
                                            {addingIndicateur === obj.id && (
                                              <div className="flex items-center gap-1.5 p-2 bg-amber-50 border border-amber-100 rounded-lg shadow-sm">
                                                <Flag className="w-3 h-3 text-amber-500" />
                                                <input className="text-[10px] border border-gray-200 rounded px-1.5 py-1 flex-1 bg-white" placeholder="Nom du KPI *" value={indicateurForm.label} onChange={e => setIndicateurForm(f => ({...f, label: e.target.value}))} autoFocus />
                                                <input className="text-[10px] border border-gray-200 rounded px-1.5 py-1 w-16 bg-white" placeholder="Unité" value={indicateurForm.unite} onChange={e => setIndicateurForm(f => ({...f, unite: e.target.value}))} />
                                                <button onClick={() => handleCreateIndicateur(obj.id)} className="p-1 bg-amber-600 text-white rounded"><Check className="w-3 h-3"/></button>
                                                <button onClick={() => setAddingIndicateur(null)} className="p-1 bg-gray-100 text-gray-300 rounded"><X className="w-3 h-3"/></button>
                                              </div>
                                            )}

                                            {obj.indicateurs?.map(ind => (
                                              <div key={ind.id} className="bg-white border border-gray-100 rounded-lg p-2 group/ind hover:shadow-md transition-all">
                                                <div className="flex items-center justify-between pb-1.5 mb-1 borders-b border-gray-50">
                                                  <div className="flex items-center gap-1.5">
                                                     <Flag className="w-3 h-3 text-amber-500" />
                                                     <span className="text-[11px] font-bold text-gray-700">{ind.label}</span>
                                                     {ind.unite && <span className="text-[9px] text-gray-400 bg-gray-100 px-1 rounded uppercase">{ind.unite}</span>}
                                                  </div>
                                                  <div className="flex items-center gap-1 opacity-0 group-hover/ind:opacity-100 transition-opacity">
                                                     {projectCanEdit && <button onClick={() => setAddingMesure(ind.id)} className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 rounded-full flex items-center shadow-sm">Lancer une Année</button>}
                                                     {projectCanEdit && <button onClick={() => strategicAPI.deleteIndicateur(ind.id).then(fetchTree)} className="p-0.5 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3"/></button>}
                                                  </div>
                                                </div>
                                                <div className="space-y-1">
                                                  {addingMesure === ind.id && (
                                                    <div className="flex items-center gap-1.5 pl-4 py-1 animate-slide-in">
                                                      <input className="text-[10px] border border-gray-200 rounded px-1.5 w-12" type="number" placeholder="An" value={mesureForm.annee} onChange={e => setMesureForm(f => ({...f, annee: e.target.value}))} />
                                                      <input className="text-[10px] border border-gray-200 rounded px-1.5 w-16" type="number" placeholder="Cible" value={mesureForm.valeurCible} onChange={e => setMesureForm(f => ({...f, valeurCible: e.target.value}))} />
                                                      <input className="text-[10px] border border-gray-200 rounded px-1.5 w-16" type="number" placeholder="Réel" value={mesureForm.valeurReel} onChange={e => setMesureForm(f => ({...f, valeurReel: e.target.value}))} />
                                                      <button onClick={() => handleCreateMesure(ind.id)} className="p-0.5 bg-blue-600 text-white rounded"><Check className="w-3 h-3"/></button>
                                                    </div>
                                                  )}
                                                  {ind.mesures?.map(mes => (
                                                    <MesureRow key={mes.id} mesure={mes} indicateurUnit={ind.unite} onUpdate={strategicAPI.updateMesure} onDelete={strategicAPI.deleteMesure} canEdit={projectCanEdit}/>
                                                  ))}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
