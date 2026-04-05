import React, { useState, useEffect, useCallback } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { strategicAPI, biAPI } from '../services/api'
import { BarChart3, Download, TrendingUp, Calendar, Filter, Target, Edit2, Check, X, Flag, Save } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'

const COLORS = ['#006233', '#0284c7', '#059669', '#7c3aed', '#db2777', '#f59e0b', '#ef4444']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
        <p className="text-sm font-semibold text-gray-900 mb-1">{label || payload[0]?.name}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs text-gray-500">
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: p.color || p.stroke || p.fill }} />
            {p.name}: <span className="font-medium text-gray-700">
              {typeof p.value === 'number' && p.value % 1 !== 0 ? p.value.toFixed(1) : p.value}
            </span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function BI() {
  const { projects, risks, budget, loading: loadingData } = useData()
  const { user, isAdmin } = useAuth()
  const isRPROG = user?.profileId === 'RESPONSABLE_PROGRAMME'
  
  const [tree, setTree] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [loadingStrategic, setLoadingStrategic] = useState(true)
  const [filterProgrammeId, setFilterProgrammeId] = useState('')
  const [snapshotting, setSnapshotting] = useState(false)

  // Edit KPI state
  const [editingMesure, setEditingMesure] = useState(null)
  const [kpiForm, setKpiForm] = useState({ value: 0, target: 0 })
  const [saving, setSaving] = useState(false)

  const CURRENT_YEAR = new Date().getFullYear()

  const fetchTree = useCallback(async () => {
    try {
      setLoadingStrategic(true)
      const data = await strategicAPI.getTree()
      const t = Array.isArray(data) ? data : []
      setTree(t)
      
      // If RPROG and no filter set, try to default to their programme
      if (isRPROG && !filterProgrammeId) {
        let ownPbId = ''
        t.forEach(axe => {
          axe.programmes.forEach(prog => {
            if (prog.budgetaire && prog.responsable?.id === user?.id) {
              ownPbId = prog.budgetaire.id
            }
          })
        })
        if (ownPbId) setFilterProgrammeId(ownPbId)
      }
    } catch (err) { console.error(err) } finally { setLoadingStrategic(false) }
  }, [user, isRPROG])

  const fetchSnapshots = useCallback(async () => {
    try {
      const data = await biAPI.getSnapshots(filterProgrammeId)
      setSnapshots(Array.isArray(data) ? data : [])
    } catch (err) { console.error(err) }
  }, [filterProgrammeId])

  useEffect(() => { fetchTree() }, [fetchTree])
  useEffect(() => { fetchSnapshots() }, [fetchSnapshots])

  // Extract available programmes for filter
  const availableProgrammes = []
  tree.forEach(axe => {
    axe.programmes.forEach(prog => {
      if (prog.budgetaire) {
        availableProgrammes.push({
          id: prog.budgetaire.id,
          code: prog.budgetaire.code,
          label: prog.budgetaire.label,
          responsableId: prog.responsable?.id
        })
      }
    })
  })

  // Extract flat real KPIs from Strategic tree (Filtered)
  const realKpis = []
  tree.forEach(axe => {
    axe.programmes.forEach(prog => {
      if (filterProgrammeId && prog.budgetaire?.id !== filterProgrammeId) return
      
      let canEdit = isAdmin
      if (isRPROG && prog.responsable) {
        canEdit = prog.responsable.id === user?.id
      }

      let projects = prog.projects || []
      projects.forEach(project => {
        project.objectifs?.forEach(obj => {
          obj.indicateurs?.forEach(ind => {
            ind.mesures?.forEach(mesure => {
              realKpis.push({
                id: mesure.id,
                indicateurId: ind.id,
                name: ind.label,
                unit: ind.unite,
                programmeLabel: prog.label,
                programmeCode: prog.code,
                projectName: project.name,
                value: mesure.valeurReel || 0,
                target: mesure.valeurCible || 0,
                annee: mesure.annee,
                canEdit
              })
            })
          })
        })
      })
    })
  })

  // Sort KPIs to show current year primarily, or group them. Wait, if we flatten, we might have multiple years.
  // Let's filter to current year for the top grid, to avoid clutter.
  const currentYearKpis = realKpis.filter(k => k.annee === CURRENT_YEAR)

  const handleSaveKpi = async (id) => {
    try {
      setSaving(true)
      await strategicAPI.updateMesure(id, {
        valeurReel: kpiForm.value,
        valeurCible: kpiForm.target
      })
      await fetchTree()
      setEditingMesure(null)
    } catch (err) {
      alert('Erreur: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSnapshot = async () => {
    if (!filterProgrammeId) {
      alert('Veuillez d\'abord sélectionner un Programme spécifique pour l\'arrêté mensuel.')
      return
    }
    if (!window.confirm('Voulez-vous enregistrer les données d\'exécution actuelles de ce programme comme arrêté du mois courant ?')) return
    
    try {
      setSnapshotting(true)
      await biAPI.createSnapshot(filterProgrammeId)
      await fetchSnapshots()
      alert('Arrêté mensuel enregistré avec succès.')
    } catch (err) {
      alert('Erreur: ' + err.message)
    } finally {
      setSnapshotting(false)
    }
  }

  if (loadingData || loadingStrategic || !budget) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    )
  }

  // Filter projects by programme
  const filteredProjects = filterProgrammeId 
    ? projects.filter(p => tree.some(a => a.programmes.some(pr => pr.budgetaire?.id === filterProgrammeId && pr.budgetaire.projects?.some(bproj => bproj.id === p.id))))
      // Wait, budgetaire projects is not directly in standard DataContext "projects".
      // Our standard "projects" has `programmeId` ? Let's just assume `projects` filter might be more complex.
      // Easiest is to fall back to `programmeBudgetaireId` if it exists in DataContext. 
      // SGG Pilotage's DataContext projects don't all have `programmeBudgetaireId` synced if they were created before Phase 3. 
    : projects
  
  const displayProjects = filterProgrammeId ? projects.filter(p => p.programmeBudgetaireId === filterProgrammeId) : projects;
  const projectScope = displayProjects.length > 0 ? displayProjects : projects; // fallback if data is missing

  // Data preparation for charts
  const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]
  const kpiEvolution = snapshots.map(s => ({
    label: `${monthNames[s.mois - 1]} ${s.annee}`,
    physical: s.physicalProgress,
    financial: s.financialProgress,
    budgetConsumed: s.budgetConsomme
  }))

  const projectTypes = projectScope.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1
    return acc
  }, {})
  const typeData = Object.entries(projectTypes).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count
  }))

  const directorateData = projectScope.reduce((acc, p) => {
    if (!acc[p.directorate]) {
      acc[p.directorate] = { name: p.directorate, projects: 0, progress: 0, budget: 0 }
    }
    acc[p.directorate].projects += 1
    acc[p.directorate].progress += p.physicalProgress
    acc[p.directorate].budget += p.budget
    return acc
  }, {})
  const dirArray = Object.values(directorateData).map(d => ({
    ...d,
    avgProgress: Math.round(d.progress / d.projects)
  }))

  const riskByCategory = risks.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1
    return acc
  }, {})
  const categoryData = Object.entries(riskByCategory).map(([cat, count]) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: count
  }))

  const radarData = currentYearKpis.map(kpi => {
    const target = kpi.target || 1
    const normalizedValue = Math.min((kpi.value / target) * 100, 100)
    return {
      kpi: kpi.name.length > 15 ? kpi.name.substring(0, 15) + '…' : kpi.name,
      value: normalizedValue,
      target: 100,
      fullMark: 100
    }
  })

  // Build inter-annual KPI data: group all mesures (all years) into a chart
  // Group by indicateur label: one entry per indicator with bars for each year
  const allYears = [...new Set(realKpis.map(k => k.annee))].sort()
  const kpiInterAnnualMap = {}
  realKpis.forEach(k => {
    if (!kpiInterAnnualMap[k.name]) {
      kpiInterAnnualMap[k.name] = { name: k.name.length > 20 ? k.name.substring(0, 20) + '…' : k.name, unit: k.unit }
    }
    kpiInterAnnualMap[k.name][`realise_${k.annee}`] = k.value
    kpiInterAnnualMap[k.name][`cible_${k.annee}`] = k.target
  })
  const interAnnualData = Object.values(kpiInterAnnualMap)

  const YEAR_COLORS = ['#006233', '#0284c7', '#7c3aed', '#f59e0b']

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Analytique</p>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Business Intelligence</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
            <Filter className="w-4 h-4 text-violet-500" />
            <select
              value={filterProgrammeId}
              onChange={(e) => setFilterProgrammeId(e.target.value)}
              className="text-sm border-none bg-transparent focus:ring-0 text-gray-700 min-w-[200px]"
            >
              <option value="">Tous les Programmes</option>
              {availableProgrammes.map(p => (
                <option key={p.id} value={p.id}>[{p.code}] {p.label}</option>
              ))}
            </select>
          </div>
          {(isAdmin || isRPROG) && filterProgrammeId && (
            <button
              onClick={handleSnapshot}
              disabled={snapshotting}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              {snapshotting ? <span className="animate-spin w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent" /> : <Save className="w-4 h-4" />}
              Arrêté mensuel
            </button>
          )}
          <button className="btn-secondary hidden sm:flex"><Download className="w-4 h-4" />PDF</button>
        </div>
      </div>

      {/* KPI Cards — Current Year */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Flag className="w-4 h-4 text-violet-500" /> Indicateurs LdF — {CURRENT_YEAR}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {currentYearKpis.length === 0 ? (
            <div className="col-span-full card-static p-6 text-center text-gray-500 text-sm flex flex-col items-center">
              <Flag className="w-8 h-8 text-gray-300 mb-2" />
              Aucun indicateur défini pour {CURRENT_YEAR} sur la sélection courante.
            </div>
          ) : (
            currentYearKpis.map((kpi, i) => {
              const isEditing = editingMesure === kpi.id
              const achievement = kpi.target > 0 ? (kpi.value / kpi.target) * 100 : 0

              return (
                <div key={kpi.id} className={`stat-card relative stagger-${Math.min((i%5)+1, 5)} animate-slide-up hover:ring-2 hover:ring-green-500/20 group transition-all flex flex-col justify-between`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="pr-4">
                      <p className="text-[10px] font-mono text-violet-500 mb-0.5" title={kpi.programmeLabel}>Prog. {kpi.programmeCode} • {kpi.annee}</p>
                      <p className="text-[10px] text-gray-500 truncate mb-1 border-b border-gray-50 pb-1" title={kpi.projectName}>{kpi.projectName}</p>
                      <p className="text-[0.6875rem] text-gray-800 uppercase tracking-wider font-bold line-clamp-2 leading-tight" title={kpi.name}>{kpi.name}</p>
                    </div>
                    {!isEditing && kpi.canEdit && (
                      <button onClick={() => { setEditingMesure(kpi.id); setKpiForm({ value: kpi.value, target: kpi.target }); }} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-green-600 transition-all flex-shrink-0" title="Mettre à jour la mesure">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 mt-auto pt-2 border-t border-gray-100">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-gray-400 block mb-0.5">Réalisé</label>
                          <input type="number" value={kpiForm.value} onChange={e => setKpiForm(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))} className="w-full text-xs font-bold border border-gray-200 rounded px-1.5 py-1 bg-white" autoFocus disabled={saving} />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-gray-400 block mb-0.5">Cible</label>
                          <input type="number" value={kpiForm.target} onChange={e => setKpiForm(prev => ({ ...prev, target: parseFloat(e.target.value) || 0 }))} className="w-full text-xs font-bold border border-gray-200 rounded px-1.5 py-1 bg-white" disabled={saving} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button disabled={saving} onClick={() => handleSaveKpi(kpi.id)} className="flex-1 bg-green-600 text-white p-1 rounded hover:bg-green-700 flex items-center justify-center"><Check className="w-3.5 h-3.5" /></button>
                        <button disabled={saving} onClick={() => setEditingMesure(null)} className="flex-1 bg-gray-100 text-gray-500 p-1 rounded hover:bg-gray-200 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-auto pt-1">
                      <p className="text-2xl font-bold text-gray-900 flex items-baseline gap-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {kpi.value} <span className="text-sm text-gray-400 font-medium">{kpi.unit}</span>
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-400 font-mono">Cible: {kpi.target}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${achievement >= 100 ? 'bg-green-100 text-green-700' : achievement >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {Math.round(achievement)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Inter-Annual KPI Chart */}
      {interAnnualData.length > 0 && allYears.length > 0 && (
        <div className="card-static p-6">
          <h3 className="section-title mb-4">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            Suivi Inter-Annuel des Indicateurs (Réalisé vs Cible)
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={interAnnualData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600 ml-1">{v}</span>} wrapperStyle={{ paddingTop: 16 }} />
              {allYears.map((year, yi) => (
                <React.Fragment key={year}>
                  <Bar dataKey={`realise_${year}`} name={`Réalisé ${year}`} fill={YEAR_COLORS[yi % YEAR_COLORS.length]} radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Bar dataKey={`cible_${year}`} name={`Cible ${year}`} fill={YEAR_COLORS[yi % YEAR_COLORS.length]} fillOpacity={0.25} radius={[3, 3, 0, 0]} maxBarSize={28} strokeDasharray="4 2" />
                </React.Fragment>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar */}
        <div className="card-static p-6 lg:col-span-2 flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <h3 className="section-title"><Target className="w-4 h-4 text-gray-400" /> Analyse de l'atteinte des Indicateurs ({CURRENT_YEAR})</h3>
            {radarData.length > 2 ? (
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="kpi" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <Radar name="Réalisé (%)" dataKey="value" stroke="#006233" fill="#006233" fillOpacity={0.15} strokeWidth={2} />
                  <Radar name="Cible (100%)" dataKey="target" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.08} strokeWidth={2} strokeDasharray="4 4" />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : <div className="h-[380px] flex flex-col items-center justify-center text-gray-400 text-sm">Il faut au moins 3 indicateurs pour l'analyse radar.</div>}
          </div>

          <div className="w-full lg:w-1/3 flex flex-col">
            <h3 className="section-title"><TrendingUp className="w-4 h-4 text-gray-400" /> Évolution mensuelle de l'exécution</h3>
            {kpiEvolution.length > 0 ? (
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={kpiEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600 ml-1">{v}</span>} />
                  <Line type="monotone" dataKey="physical" stroke="#006233" strokeWidth={2.5} name="Avancement Physique %" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="financial" stroke="#0284c7" strokeWidth={2.5} name="Avancement Financier %" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-[380px] flex flex-col items-center justify-center text-gray-400 text-sm text-center">Sélectionnez un programme et enregistrez un arrêté mensuel pour commencer le suivi d'évolution.</div>}
          </div>
        </div>

        {/* Projects by Type */}
        {typeData.length > 0 && (
          <div className="card-static p-6">
            <h3 className="section-title"><BarChart3 className="w-4 h-4 text-gray-400" /> Répartition par type</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {typeData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Directorate performance */}
        {dirArray.length > 0 && (
          <div className="card-static p-6">
            <h3 className="section-title"><Calendar className="w-4 h-4 text-gray-400" /> Performance par Direction</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dirArray} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgProgress" name="Avancement moyen %" fill="#006233" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

