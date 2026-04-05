import React, { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useLanguage } from '../contexts/LanguageContext'
import { 
  Wallet, TrendingUp, AlertCircle, Download, Plus, 
  Edit2, Trash2, Calendar, Database, ArrowUpRight,
  Filter, BarChart2
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Area, ComposedChart, Line
} from 'recharts'
import BudgetModal from '../components/modals/BudgetModal'
import BudgetMonthModal from '../components/modals/BudgetMonthModal'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
        <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs text-gray-500">
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: p.color || p.stroke || p.fill }} />
            {p.name}: <span className="font-medium text-gray-700">{p.value.toLocaleString()} DH</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Budget() {
  const { 
    budget, loading, 
    addBudgetEntry, updateBudgetEntry, deleteBudgetEntry,
    addBudgetMonth, updateBudgetMonth, deleteBudgetMonth
  } = useData()
  const { t } = useLanguage()

  // Modal States
  const [allocationModal, setAllocationModal] = useState({ open: false, entry: null })
  const [monthModal, setMonthModal] = useState({ open: false, entry: null })
  const [filterSource, setFilterSource] = useState('All')

  if (loading || !budget) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 text-green-600 border-4 border-t-transparent rounded-full" />
      </div>
    )
  }

  const sources = ['All', ...new Set(budget.byProgramme.map(b => b.source).filter(Boolean))]

  const filteredProgrammes = filterSource === 'All' 
    ? budget.byProgramme 
    : budget.byProgramme.filter(p => p.source === filterSource)

  const budgetData = filteredProgrammes.map(p => ({
    name: p.name.length > 20 ? p.name.substring(0, 20) + '…' : p.name,
    budget: Math.round(p.budget / 1000000),
    engaged: Math.round(p.engaged / 1000000),
    spent: Math.round(p.spent / 1000000),
  }))

  const monthlyData = budget.byMonth.map(m => ({
    ...m,
    budget: Math.round(m.budget / 1000000),
    spent: Math.round(m.spent / 1000000),
    cumulative: +(budget.byMonth
      .slice(0, budget.byMonth.indexOf(m) + 1)
      .reduce((acc, curr) => acc + curr.spent, 0) / 1000000).toFixed(1)
  }))

  const executionRate = Math.round((budget.engaged / budget.total) * 100) || 0
  const consumptionRate = Math.round((budget.spent / budget.total) * 100) || 0

  const summaryCards = [
    { label: 'Budget total', value: (budget.total / 1000000).toFixed(1), icon: Wallet, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
    { label: 'Crédits engagés', value: (budget.engaged / 1000000).toFixed(1), icon: TrendingUp, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', badge: `${executionRate}%` },
    { label: 'Crédits consommés', value: (budget.spent / 1000000).toFixed(1), icon: BarChart2, iconBg: 'bg-purple-50', iconColor: 'text-purple-600', badge: `${consumptionRate}%` },
    { label: 'Restant à engager', value: (budget.remaining / 1000000).toFixed(1), icon: Wallet, iconBg: 'bg-gray-50', iconColor: 'text-gray-600' }
  ]

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Pilotage Financier</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Suivi Budgétaire
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Live CRUD</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setMonthModal({ open: true, entry: null })} className="btn-secondary text-blue-600 border-blue-100 hover:bg-blue-50">
            <Calendar className="w-4 h-4" />
            Suivi mensuel
          </button>
          <button onClick={() => setAllocationModal({ open: true, entry: null })} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nouvelle allocation
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {summaryCards.map((c, i) => (
          <div key={c.label} className="card-static p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center`}>
                <c.icon className={`w-5 h-5 ${c.iconColor}`} />
              </div>
              {c.badge && (
                <span className="badge bg-green-50 text-green-600 text-[10px] font-bold">
                  {c.badge}
                </span>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {c.value} <span className="text-xs font-medium text-gray-400 uppercase ml-1">MDH</span>
              </p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
        <div className="px-3 py-1.5 flex items-center gap-2 text-gray-400 border-r border-gray-100 mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Source</span>
        </div>
        {sources.map(s => (
          <button
            key={s}
            onClick={() => setFilterSource(s)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterSource === s 
              ? 'bg-green-600 text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-static p-6">
          <h3 className="section-title mb-6">
            <span className="w-1.5 h-5 rounded-full bg-green-500" />
            Répartition par programme (MDH)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} angle={-15} textAnchor="end" height={70} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
              <Bar dataKey="budget" fill="#006233" name="Budget" radius={[4, 4, 0, 0]} />
              <Bar dataKey="engaged" fill="#0284c7" name="Engagé" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" fill="#059669" name="Consommé" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-static p-6">
          <h3 className="section-title mb-6">
            <span className="w-1.5 h-5 rounded-full bg-blue-500" />
            Exécution mensuelle cumulée (MDH)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
              <Area type="monotone" dataKey="cumulative" fill="#f0fdf4" stroke="#059669" strokeWidth={2} name="Cumulé" />
              <Bar dataKey="budget" fill="#006233" name="Budget mensuel" radius={[3, 3, 0, 0]} barSize={10} />
              <Line type="monotone" dataKey="spent" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 4, fill: '#0284c7', strokeWidth: 2, stroke: '#fff' }} name="Dépensé" />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-end">
             <button onClick={() => setMonthModal({ open: true, entry: null })} className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">
               Gérer l'historique mensuel ❯
             </button>
          </div>
        </div>
      </div>

      {/* Detailed table */}
      <div className="card-static overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm tracking-tight">Détail des allocations</h3>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            {filteredProgrammes.length} lignes
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Libellé / Programme</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Source</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Budget (DH)</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Engagé</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Consommé</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Exécution</th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProgrammes.map((p) => {
                const engRate = Math.round((p.engaged / p.budget) * 100) || 0
                const spentRate = Math.round((p.spent / p.budget) * 100) || 0
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-800">{p.name}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-lighter ${
                        p.source === 'PNUD' ? 'bg-blue-50 text-blue-600' :
                        p.source === 'MDD' ? 'bg-green-50 text-green-600' :
                        p.source === 'INVEST' ? 'bg-purple-50 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {p.source}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                      {p.budget.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-600">
                      {p.engaged.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-600">
                      {p.spent.toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                       <div className="flex items-center justify-center gap-2">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                             <div className="h-full bg-green-500 rounded-full" style={{ width: `${spentRate}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-500">{spentRate}%</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setAllocationModal({ open: true, entry: p })}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => { if(window.confirm('Supprimer cette ligne ?')) deleteBudgetEntry(p.id) }}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredProgrammes.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm">
              Aucune donnée budgétaire trouvée.
            </div>
          )}
        </div>
      </div>

      {/* Monthly Management Section (Optional/Hidden in drawer or visible) */}
      <div className="card-static p-6">
        <h3 className="section-title mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-blue-500" />
            Suivi Mensuel Détaillé
          </span>
          <button onClick={() => setMonthModal({ open: true, entry: null })} className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Ajouter un mois
          </button>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {budget.byMonth.map(m => (
            <div key={m.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors relative group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{m.month} {m.year}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => setMonthModal({ open: true, entry: m })} className="text-blue-600 p-0.5"><Edit2 className="w-2.5 h-2.5" /></button>
                   <button onClick={() => { if(window.confirm('Supprimer ?')) deleteBudgetMonth(m.id) }} className="text-red-500 p-0.5"><Trash2 className="w-2.5 h-2.5" /></button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-800">{(m.spent / 1000000).toFixed(2)} MDH</p>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (m.spent/m.budget)*100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <BudgetModal 
        isOpen={allocationModal.open}
        onClose={() => setAllocationModal({ open: false, entry: null })}
        entry={allocationModal.entry}
        onSave={(data) => {
          if (allocationModal.entry) updateBudgetEntry(allocationModal.entry.id, data)
          else addBudgetEntry(data)
          setAllocationModal({ open: false, entry: null })
        }}
      />

      <BudgetMonthModal 
        isOpen={monthModal.open}
        onClose={() => setMonthModal({ open: false, entry: null })}
        entry={monthModal.entry}
        onSave={(data) => {
          if (monthModal.entry) updateBudgetMonth(monthModal.entry.id, data)
          else addBudgetMonth(data)
          setMonthModal({ open: false, entry: null })
        }}
      />
    </div>
  )
}
