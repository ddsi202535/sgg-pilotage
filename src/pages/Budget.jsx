import React, { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useLanguage } from '../contexts/LanguageContext'
import { Wallet, TrendingUp, AlertCircle, Download, RefreshCw, CheckCircle, Database, ArrowUpRight } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line, Area, ComposedChart
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
        <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs text-gray-500">
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: p.color || p.stroke || p.fill }} />
            {p.name}: <span className="font-medium text-gray-700">{p.value} MDH</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Budget() {
  const { budget, projects, loading } = useData()
  const { t } = useLanguage()
  const [isSyncing, setIsSyncing] = useState(false)

  if (loading || !budget) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 text-green-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-gray-400 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }
  const [syncSuccess, setSyncSuccess] = useState(false)
  const [lastSync, setLastSync] = useState(new Date().toLocaleString('fr-FR'))

  const handleSync = () => {
    setIsSyncing(true)
    setSyncSuccess(false)
    setTimeout(() => {
      setIsSyncing(false)
      setSyncSuccess(true)
      setLastSync(new Date().toLocaleString('fr-FR'))
      setTimeout(() => setSyncSuccess(false), 3000)
    }, 2000)
  }

  const budgetData = budget.byProgramme.map(p => ({
    name: p.name.length > 20 ? p.name.substring(0, 20) + '…' : p.name,
    budget: Math.round(p.budget / 1000000),
    engaged: Math.round(p.engaged / 1000000),
    spent: Math.round(p.spent / 1000000),
  }))

  const monthlyData = budget.byMonth.map(m => ({
    month: m.month,
    budget: Math.round(m.budget / 1000000),
    spent: Math.round(m.spent / 1000000),
    cumulative: +(budget.byMonth
      .slice(0, budget.byMonth.indexOf(m) + 1)
      .reduce((acc, curr) => acc + curr.spent, 0) / 1000000).toFixed(1)
  }))

  const executionRate = Math.round((budget.engaged / budget.total) * 100)
  const consumptionRate = Math.round((budget.spent / budget.total) * 100)

  const handleExport = () => {
    alert('Fonctionnalité d\'export PDF/Excel en cours de développement')
  }

  const summaryCards = [
    { label: 'Budget total', value: (budget.total / 1000000).toFixed(1), icon: Wallet, iconBg: 'icon-bg-green', iconColor: 'text-green-600' },
    { label: 'Crédits engagés', value: (budget.engaged / 1000000).toFixed(1), icon: TrendingUp, iconBg: 'icon-bg-blue', iconColor: 'text-blue-600', badge: `${executionRate}%` },
    { label: 'Crédits consommés', value: (budget.spent / 1000000).toFixed(1), icon: Wallet, iconBg: 'icon-bg-purple', iconColor: 'text-purple-600', badge: `${consumptionRate}%` },
    { label: 'Restant à engager', value: (budget.remaining / 1000000).toFixed(1), icon: Wallet, iconBg: 'icon-bg-gray', iconColor: 'text-gray-600' }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Finance</p>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {t('nav.budget')}
          </h1>
        </div>
        <button onClick={handleExport} className="btn-secondary">
          <Download className="w-4 h-4" />
          Exporter
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {summaryCards.map((c, i) => (
          <div key={c.label} className={`stat-card stagger-${i+1} animate-slide-up`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-11 h-11 ${c.iconBg} rounded-xl flex items-center justify-center`}>
                <c.icon className={`w-5 h-5 ${c.iconColor}`} />
              </div>
              {c.badge && (
                <span className="badge bg-green-50 text-green-600">
                  <ArrowUpRight className="w-3 h-3" />
                  {c.badge}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {c.value} <span className="text-sm font-medium text-gray-400">MDH</span>
            </p>
            <p className="text-sm text-gray-400 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* API Connector */}
      <div className="card-static p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
              <Database className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {t('budget.api_sync')}
                <span className="badge bg-green-50 text-green-600">
                  <CheckCircle className="w-3 h-3" /> Connecté
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {t('budget.last_sync')}: <span className="font-medium text-gray-600">{lastSync}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="btn-primary"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? t('common.loading') : t('budget.sync_now')}
          </button>
        </div>
        {isSyncing && (
          <div className="mt-4 progress-track h-1">
            <div className="progress-bar h-1 w-full" style={{ background: 'linear-gradient(90deg, #006233, #059669)' }} />
          </div>
        )}
        {syncSuccess && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            Synchronisation réussie
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-static p-6">
          <h3 className="section-title">
            <span className="w-1 h-5 rounded-full bg-green-500" />
            Répartition budgétaire par programme
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} angle={-15} textAnchor="end" height={70} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600 ml-1">{v}</span>} />
              <Bar dataKey="budget" fill="#006233" name="Budget" radius={[4, 4, 0, 0]} />
              <Bar dataKey="engaged" fill="#0284c7" name="Engagé" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" fill="#059669" name="Consommé" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-static p-6">
          <h3 className="section-title">
            <span className="w-1 h-5 rounded-full bg-blue-500" />
            Exécution mensuelle (MDH)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600 ml-1">{v}</span>} />
              <Area type="monotone" dataKey="cumulative" fill="#f3e8ff" stroke="#7c3aed" strokeWidth={2} name="Cumulé" />
              <Bar dataKey="budget" fill="#006233" name="Budget mensuel" radius={[3, 3, 0, 0]} barSize={10} />
              <Line type="monotone" dataKey="spent" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3, fill: '#0284c7' }} name="Dépensé" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed table */}
      <div className="card-static overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '2px solid #f1f5f9' }}>
          <h3 className="font-semibold text-gray-900 text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>Détail par programme</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Programme</th>
                <th className="text-right">Budget (MDH)</th>
                <th className="text-right">Engagé (MDH)</th>
                <th className="text-right">Consommé (MDH)</th>
                <th className="text-right">Taux eng.</th>
                <th className="text-right">Taux cons.</th>
                <th className="text-right">Restant</th>
              </tr>
            </thead>
            <tbody>
              {budget.byProgramme.map((programme, index) => {
                const engRate = Math.round((programme.engaged / programme.budget) * 100)
                const consRate = Math.round((programme.spent / programme.budget) * 100)
                return (
                  <tr key={index}>
                    <td className="font-medium text-gray-800">{programme.name}</td>
                    <td className="text-right font-medium">{(programme.budget / 1000000).toFixed(2)}</td>
                    <td className="text-right">{(programme.engaged / 1000000).toFixed(2)}</td>
                    <td className="text-right">{(programme.spent / 1000000).toFixed(2)}</td>
                    <td className="text-right">
                      <span className={`badge ${
                        engRate >= 80 ? 'bg-green-50 text-green-700' :
                        engRate >= 50 ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {engRate}%
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={`badge ${
                        consRate >= 80 ? 'bg-green-50 text-green-700' :
                        consRate >= 50 ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {consRate}%
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={programme.budget - programme.engaged < 0 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                        {((programme.budget - programme.engaged) / 1000000).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts */}
      <div className="card-static p-6">
        <h3 className="section-title">
          <span className="w-1 h-5 rounded-full bg-amber-500" />
          Alertes budgétaires
        </h3>
        <div className="space-y-3">
          {budget.byProgramme
            .filter(p => (p.engaged / p.budget) > 0.9)
            .map((programme, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-amber-50/60 border border-amber-100 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{programme.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Taux d'engagement élevé: <span className="font-semibold text-amber-700">{Math.round((programme.engaged / programme.budget) * 100)}%</span> du budget engagé
                  </p>
                </div>
              </div>
            ))}
          {budget.byProgramme.filter(p => (p.engaged / p.budget) > 0.9).length === 0 && (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <CheckCircle className="w-8 h-8 text-green-300 mb-2" />
              <p>Aucune alerte budgétaire</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
