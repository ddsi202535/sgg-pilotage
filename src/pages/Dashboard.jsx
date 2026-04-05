import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { useAuth, USER_PROFILES } from '../contexts/AuthContext'
import { strategicAPI } from '../services/api'
import {
  FolderKanban, TrendingUp, AlertTriangle, Wallet,
  ArrowUpRight, ArrowDownRight, Minus, Activity,
  Flag, Target, Clock, CheckCircle, AlertCircle,
  BarChart3, ChevronRight, Calendar
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const COLORS = ['#059669', '#0284c7', '#f59e0b', '#ef4444', '#7c3aed', '#db2777']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
        <p className="text-sm font-semibold text-gray-900 mb-1">{label || payload[0].name}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs text-gray-500">
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: p.color || p.fill }} />
            {p.name}: <span className="font-medium text-gray-700">{p.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function scoreColor(pct) {
  if (pct >= 80) return 'text-emerald-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-red-500'
}
function scoreBg(pct) {
  if (pct >= 80) return 'bg-emerald-50 border-emerald-100 text-emerald-700'
  if (pct >= 50) return 'bg-amber-50 border-amber-100 text-amber-700'
  return 'bg-red-50 border-red-100 text-red-700'
}
function trendIcon(trend) {
  if (trend === 'up') return <ArrowUpRight className="w-3.5 h-3.5" />
  if (trend === 'down') return <ArrowDownRight className="w-3.5 h-3.5" />
  return <Minus className="w-3.5 h-3.5" />
}
function trendClass(trend) {
  if (trend === 'up') return 'bg-emerald-50 text-emerald-600'
  if (trend === 'down') return 'bg-red-50 text-red-500'
  return 'bg-gray-50 text-gray-400'
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { projects, risks, loading } = useData()
  const { user } = useAuth()

  const [tree, setTree] = useState([])
  const [loadingTree, setLoadingTree] = useState(true)

  const fetchTree = useCallback(async () => {
    try {
      setLoadingTree(true)
      const data = await strategicAPI.getTree()
      setTree(Array.isArray(data) ? data : [])
    } catch { setTree([]) } finally { setLoadingTree(false) }
  }, [])

  useEffect(() => { fetchTree() }, [fetchTree])

  const today = new Date()
  const CURRENT_YEAR = today.getFullYear()

  // ────────────────────────────────────────────────────────────────────────────
  // KPI 1 — Taux d'exécution physique global
  const physicalRate = projects.length
    ? Math.round(projects.reduce((s, p) => s + p.physicalProgress, 0) / projects.length)
    : 0

  // KPI 2 — Taux d'exécution budgétaire
  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0)
  const totalConsumed = projects.reduce((s, p) => s + (p.consumed || 0), 0)
  const budgetRate = totalBudget > 0 ? Math.round((totalConsumed / totalBudget) * 100) : 0

  // KPI 3 — Projets en retard (date dépassée ET pas terminé ET <80%)
  const overdueProjects = projects.filter(p => {
    if (p.status === 'termine') return false
    const end = new Date(p.endDate)
    return end < today && p.physicalProgress < 80
  })

  // KPI 4 — Jalons manqués (pending & date dépassée)
  const missedMilestones = projects.flatMap(p =>
    (p.milestones || [])
      .filter(m => m.status === 'pending' && new Date(m.date) < today)
      .map(m => ({ ...m, projectName: p.name, projectId: p.id }))
  )

  // KPI 5 & 6 — Score LdF (atteinte indicateurs annuels courants)
  const allMesures = []
  tree.forEach(axe => {
    axe.programmes?.forEach(prog => {
      prog.projects?.forEach(project => {
        project.objectifs?.forEach(obj => {
          obj.indicateurs?.forEach(ind => {
            ind.mesures?.forEach(m => {
              if (m.annee === CURRENT_YEAR && m.valeurCible > 0) {
                allMesures.push({
                  name: ind.label,
                  unite: ind.unite,
                  valeurReel: m.valeurReel || 0,
                  valeurCible: m.valeurCible,
                  programmCode: prog.code,
                  projectName: project.name,
                  pct: Math.min(100, Math.round(((m.valeurReel || 0) / m.valeurCible) * 100))
                })
              }
            })
          })
        })
      })
    })
  })
  const ldfScore = allMesures.length
    ? Math.round(allMesures.reduce((s, m) => s + m.pct, 0) / allMesures.length)
    : null
  const ldfDanger = allMesures.filter(m => m.pct < 70)

  // KPI 7 — Risques élevés actifs
  const highRisks = risks.filter(r => r.level === 'élevé' && r.status === 'actif')

  // ── Scores KPI cartes ──────────────────────────────────────────────────────
  const kpiCards = [
    {
      id: 'physical',
      name: 'Exécution physique',
      value: physicalRate,
      suffix: '%',
      sub: `${projects.filter(p => p.status === 'en_cours').length} projets actifs / ${projects.length} total`,
      icon: TrendingUp,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      trend: physicalRate >= 70 ? 'up' : physicalRate >= 40 ? 'stable' : 'down',
      trendVal: `${physicalRate}%`,
      pct: physicalRate
    },
    {
      id: 'budget',
      name: 'Exécution budgétaire',
      value: budgetRate,
      suffix: '%',
      sub: `${(totalConsumed / 1e6).toFixed(1)} M / ${(totalBudget / 1e6).toFixed(1)} M MAD`,
      icon: Wallet,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      trend: budgetRate >= 60 ? 'up' : budgetRate >= 30 ? 'stable' : 'down',
      trendVal: `${budgetRate}%`,
      pct: budgetRate
    },
    {
      id: 'overdue',
      name: 'Projets en retard',
      value: overdueProjects.length,
      suffix: '',
      sub: `${missedMilestones.length} jalons manqués`,
      icon: AlertCircle,
      iconBg: overdueProjects.length > 0 ? 'bg-red-100' : 'bg-emerald-100',
      iconColor: overdueProjects.length > 0 ? 'text-red-600' : 'text-emerald-600',
      trend: overdueProjects.length === 0 ? 'up' : overdueProjects.length <= 2 ? 'stable' : 'down',
      trendVal: overdueProjects.length === 0 ? 'OK' : `-${overdueProjects.length}`,
      pct: Math.max(0, 100 - overdueProjects.length * 15)
    },
    {
      id: 'ldf',
      name: 'Score LdF moyen',
      value: ldfScore !== null ? ldfScore : '—',
      suffix: ldfScore !== null ? '%' : '',
      sub: ldfScore !== null
        ? `${allMesures.length} indicateurs · ${ldfDanger.length} en danger`
        : 'Aucun indicateur saisi pour ' + CURRENT_YEAR,
      icon: Flag,
      iconBg: ldfScore === null ? 'bg-gray-100' : ldfScore >= 70 ? 'bg-violet-100' : 'bg-amber-100',
      iconColor: ldfScore === null ? 'text-gray-400' : ldfScore >= 70 ? 'text-violet-700' : 'text-amber-600',
      trend: ldfScore === null ? 'stable' : ldfScore >= 70 ? 'up' : ldfScore >= 40 ? 'stable' : 'down',
      trendVal: ldfScore !== null ? `${ldfScore}%` : '—',
      pct: ldfScore || 0
    }
  ]

  // ── Tableau par programme ──────────────────────────────────────────────────
  const programmeRows = tree.flatMap(axe =>
    (axe.programmes || []).map(prog => {
      const projs = prog.projects || []
      const physAvg = projs.length ? Math.round(projs.reduce((s, p) => s + p.physicalProgress, 0) / projs.length) : 0
      const budgTotal = projs.reduce((s, p) => s + (p.budget || 0), 0)
      const budgConsumed = projs.reduce((s, p) => s + (p.consumed || 0), 0)
      const budgPct = budgTotal > 0 ? Math.round((budgConsumed / budgTotal) * 100) : 0

      const mesures = []
      projs.forEach(project => {
        project.objectifs?.forEach(obj => {
          obj.indicateurs?.forEach(ind => {
            ind.mesures?.filter(m => m.annee === CURRENT_YEAR && m.valeurCible > 0).forEach(m => {
              mesures.push(Math.min(100, Math.round(((m.valeurReel || 0) / m.valeurCible) * 100)))
            })
          })
        })
      })
      const ldf = mesures.length ? Math.round(mesures.reduce((s, v) => s + v, 0) / mesures.length) : null

      return {
        id: prog.id,
        code: prog.code,
        label: prog.label,
        totalProjects: projs.length,
        activeProjects: projs.filter(p => p.status === 'en_cours').length,
        physAvg, budgPct, ldf
      }
    })
  )

  // ── Charts ─────────────────────────────────────────────────────────────────
  const projectByStatus = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})
  const statusLabels = {
    en_cours: 'En cours',
    planification: 'Planification',
    termine: 'Terminé',
    suspendu: 'Suspendu',
    en_retard: 'En retard'
  }
  const statusData = Object.entries(projectByStatus).map(([status, count]) => ({
    name: statusLabels[status] || status,
    value: count
  }))

  const budgetByProg = programmeRows
    .filter(p => p.physAvg > 0 || p.budgPct > 0)
    .map(p => ({
      name: `P${p.code}`,
      label: p.label,
      Physique: p.physAvg,
      Budgétaire: p.budgPct,
      LdF: p.ldf || 0
    }))

  if (loading || loadingTree) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 text-green-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-gray-400 text-sm">Chargement des données...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="text-sm text-gray-400 mb-1">Bienvenue,</p>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Tableau de bord
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Données calculées en temps réel — Année {CURRENT_YEAR}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Activity className="w-4 h-4" />
          <span>{USER_PROFILES[user?.profileId]?.name || user?.profileId}</span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((kpi, i) => (
          <div key={kpi.id} className={`stat-card stagger-${i+1} animate-slide-up`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 ${kpi.iconBg} rounded-xl flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${trendClass(kpi.trend)}`}>
                {trendIcon(kpi.trend)}
                {kpi.trendVal}
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {kpi.value}{kpi.suffix}
            </p>
            <p className="text-sm font-semibold text-gray-600 mt-0.5">{kpi.name}</p>
            <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
            {/* Mini progress bar */}
            <div className="mt-3 w-full bg-gray-100 rounded-full h-1 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${kpi.pct}%`,
                  background: kpi.pct >= 70 ? '#059669' : kpi.pct >= 40 ? '#f59e0b' : '#ef4444'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Tableau performance par Programme ── */}
      {programmeRows.length > 0 && (
        <div className="card-static p-6">
          <h3 className="section-title mb-4">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            Performance par Programme Budgétaire — {CURRENT_YEAR}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Programme</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Projets</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Physique</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Budgétaire</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Score LdF</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {programmeRows.map(prog => {
                  const overall = prog.ldf !== null
                    ? Math.round((prog.physAvg + prog.budgPct + prog.ldf) / 3)
                    : Math.round((prog.physAvg + prog.budgPct) / 2)
                  return (
                    <tr key={prog.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">{prog.code}</span>
                          <span className="text-gray-800 font-medium truncate max-w-[220px]" title={prog.label}>{prog.label}</span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-gray-700 font-semibold">{prog.activeProjects}</span>
                        <span className="text-gray-400 text-xs">/{prog.totalProjects}</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`font-bold text-sm ${scoreColor(prog.physAvg)}`}>{prog.physAvg}%</span>
                        <div className="w-16 mx-auto bg-gray-100 rounded-full h-1 mt-1 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${prog.physAvg}%`, background: prog.physAvg >= 70 ? '#059669' : prog.physAvg >= 40 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`font-bold text-sm ${scoreColor(prog.budgPct)}`}>{prog.budgPct}%</span>
                        <div className="w-16 mx-auto bg-gray-100 rounded-full h-1 mt-1 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${prog.budgPct}%`, background: prog.budgPct >= 70 ? '#059669' : prog.budgPct >= 40 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        {prog.ldf !== null ? (
                          <>
                            <span className={`font-bold text-sm ${scoreColor(prog.ldf)}`}>{prog.ldf}%</span>
                            <div className="w-16 mx-auto bg-gray-100 rounded-full h-1 mt-1 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${prog.ldf}%`, background: prog.ldf >= 70 ? '#059669' : prog.ldf >= 40 ? '#f59e0b' : '#ef4444' }} />
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-300 text-xs italic">—</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${scoreBg(overall)}`}>
                          {overall >= 80 ? <CheckCircle className="w-3 h-3" /> : overall >= 50 ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {overall >= 80 ? 'Sur cible' : overall >= 50 ? 'En cours' : 'Alerte'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Alertes ── */}
      {(overdueProjects.length > 0 || missedMilestones.length > 0 || ldfDanger.length > 0) && (
        <div className="card-static p-6">
          <h3 className="section-title mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Alertes actives
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Projets en retard */}
            {overdueProjects.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Projets en retard ({overdueProjects.length})
                </p>
                {overdueProjects.slice(0, 3).map(p => (
                  <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100/60 transition-colors">
                    <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono flex-shrink-0">{p.code}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-red-500">{p.physicalProgress}% • Fin: {p.endDate}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-red-300 flex-shrink-0 ml-auto" />
                  </Link>
                ))}
              </div>
            )}

            {/* Jalons manqués */}
            {missedMilestones.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Jalons manqués ({missedMilestones.length})
                </p>
                {missedMilestones.slice(0, 3).map((m, i) => (
                  <Link key={i} to={`/projects/${m.projectId}`} className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-100/60 transition-colors">
                    <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{m.name}</p>
                      <p className="text-[10px] text-amber-600 truncate">{m.projectName} · {m.date}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-amber-300 flex-shrink-0 ml-auto" />
                  </Link>
                ))}
              </div>
            )}

            {/* Indicateurs LdF en danger */}
            {ldfDanger.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-violet-600 uppercase tracking-wider flex items-center gap-1">
                  <Flag className="w-3.5 h-3.5" /> Indicateurs LdF en danger ({ldfDanger.length})
                </p>
                {ldfDanger.slice(0, 3).map((m, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-violet-50 border border-violet-100 rounded-lg">
                    <Target className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{m.name}</p>
                      <p className="text-[10px] text-violet-500">{m.pct}% atteint · Prog. {m.programmCode}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${scoreBg(m.pct)}`}>{m.pct}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Répartition projets */}
        <div className="card-static p-6">
          <h3 className="section-title">
            <span className="w-1 h-5 rounded-full bg-emerald-500" />
            Répartition des projets par statut
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={90}
                dataKey="value"
                strokeWidth={3} stroke="#fff"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" iconType="circle" iconSize={8}
                formatter={(v) => <span className="text-xs text-gray-600 ml-1">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance par programme */}
        {budgetByProg.length > 0 ? (
          <div className="card-static p-6">
            <h3 className="section-title">
              <span className="w-1 h-5 rounded-full bg-blue-500" />
              Taux d'exécution par Programme (%)
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={budgetByProg} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v) => <span className="text-xs text-gray-600 ml-1">{v}</span>} />
                <Bar dataKey="Physique" fill="#059669" name="Physique" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Budgétaire" fill="#0284c7" name="Budgétaire" radius={[4, 4, 0, 0]} />
                <Bar dataKey="LdF" fill="#7c3aed" name="Score LdF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="card-static p-6">
            <h3 className="section-title">
              <span className="w-1 h-5 rounded-full bg-blue-500" />
              Risques critiques actifs
            </h3>
            {highRisks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <AlertTriangle className="w-8 h-8 mb-2 text-gray-300" />
                <p>Aucun risque critique</p>
              </div>
            ) : (
              <div className="space-y-3">
                {highRisks.slice(0, 4).map(risk => (
                  <div key={risk.id} className="p-4 bg-red-50/60 border border-red-100 rounded-xl">
                    <p className="font-medium text-gray-900 text-sm">{risk.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{risk.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge bg-red-100 text-red-700">P: {risk.probability}/5</span>
                      <span className="badge bg-red-100 text-red-700">I: {risk.impact}/5</span>
                      <span className="badge bg-red-200 text-red-800 font-bold">Score: {risk.probability * risk.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Risques critiques (si chart prog existe) ── */}
      {budgetByProg.length > 0 && highRisks.length > 0 && (
        <div className="card-static p-6">
          <h3 className="section-title mb-4">
            <span className="w-1 h-5 rounded-full bg-red-500" />
            Risques critiques actifs ({highRisks.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {highRisks.map(risk => (
              <div key={risk.id} className="p-4 bg-red-50/60 border border-red-100 rounded-xl">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-gray-900 text-sm">{risk.title}</p>
                  <span className="badge bg-red-200 text-red-800 font-bold ml-2 flex-shrink-0">{risk.probability * risk.impact}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{risk.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="badge bg-red-100 text-red-700">P: {risk.probability}/5</span>
                  <span className="badge bg-red-100 text-red-700">I: {risk.impact}/5</span>
                  {risk.programme && <span className="badge bg-gray-100 text-gray-600 truncate">{risk.programme}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
