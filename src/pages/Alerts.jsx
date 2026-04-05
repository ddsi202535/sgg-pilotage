import React, { useState, useEffect, useCallback } from 'react'
import { alertRulesAPI } from '../services/api'
import { useData } from '../contexts/DataContext'
import { Bell, Plus, Trash2, Check, X, AlertCircle, AlertTriangle, Info, RefreshCw, ToggleLeft, ToggleRight, Pencil, Save } from 'lucide-react'

const TYPES = [
  { value: 'project_delay',    label: 'Retard de projet (avancement %)',       unit: '%' },
  { value: 'budget_overrun',   label: 'Dépassement budgétaire (%)',             unit: '%' },
  { value: 'milestone_late',   label: 'Jalons en retard (nombre)',              unit: 'jalons' },
  { value: 'kpi_gap',          label: 'Écart indicateur LdF (% de réalisation)', unit: '%' },
  { value: 'risk_critical',    label: 'Risques critiques/élevés actifs (nb)',   unit: 'risques' },
  { value: 'overdue_project',  label: 'Projets hors délai calendaire (nb)',     unit: 'projets' }
]

const OPERATORS = [
  { value: 'lt', label: 'inférieur à (<)' },
  { value: 'lte', label: 'inférieur ou égal à (≤)' },
  { value: 'gt', label: 'supérieur à (>)' },
  { value: 'gte', label: 'supérieur ou égal à (≥)' },
  { value: 'eq', label: 'égal à (=)' }
]

const SEVERITIES = [
  { value: 'info', label: 'Information', color: 'bg-blue-100 text-blue-700', icon: Info },
  { value: 'warning', label: 'Avertissement', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  { value: 'critical', label: 'Critique', color: 'bg-red-100 text-red-700', icon: AlertCircle }
]

const EMPTY_FORM = { label: '', type: 'project_delay', operator: 'lt', threshold: 30, severity: 'warning', projectId: '', kpiId: '', isActive: true }

function SeverityBadge({ severity }) {
  const s = SEVERITIES.find(x => x.value === severity) || SEVERITIES[1]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>
      <s.icon className="w-3 h-3" />
      {s.label}
    </span>
  )
}

export default function Alerts() {
  const { projects, kpis } = useData()
  const [rules, setRules] = useState([])
  const [triggered, setTriggered] = useState([])
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [r, t] = await Promise.all([alertRulesAPI.getRules(), alertRulesAPI.evaluate()])
      setRules(Array.isArray(r) ? r : [])
      setTriggered(Array.isArray(t) ? t : [])
    } catch(err) { console.error(err) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleEvaluate = async () => {
    setEvaluating(true)
    try {
      const t = await alertRulesAPI.evaluate()
      setTriggered(Array.isArray(t) ? t : [])
    } catch(err) {} finally { setEvaluating(false) }
  }

  const handleSave = async () => {
    if (!form.label || !form.threshold) return
    try {
      if (editingId) {
        await alertRulesAPI.updateRule(editingId, form)
      } else {
        await alertRulesAPI.createRule(form)
      }
      setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); fetchAll()
    } catch(err) { alert(err.message) }
  }

  const handleToggle = async (rule) => {
    await alertRulesAPI.updateRule(rule.id, { isActive: !rule.isActive })
    fetchAll()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette règle ?')) return
    await alertRulesAPI.deleteRule(id); fetchAll()
  }

  const startEdit = (rule) => {
    setForm({ label: rule.label, type: rule.type, operator: rule.operator, threshold: rule.threshold, severity: rule.severity, projectId: rule.projectId || '', kpiId: rule.kpiId || '', isActive: rule.isActive })
    setEditingId(rule.id); setShowForm(true)
  }

  const criticalCount = triggered.filter(t => t.severity === 'critical').length
  const warningCount = triggered.filter(t => t.severity === 'warning').length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Business Intelligence</p>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Alertes Intelligentes
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleEvaluate} disabled={evaluating} className="btn-secondary">
            <RefreshCw className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} /> Évaluer maintenant
          </button>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Nouvelle règle
          </button>
        </div>
      </div>

      {/* Alert summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-[0.6875rem] text-gray-400 uppercase tracking-wider mb-2">Règles actives</p>
          <p className="text-3xl font-bold text-gray-900" style={{fontFamily:'Outfit,sans-serif'}}>{rules.filter(r=>r.isActive).length}</p>
          <p className="text-xs text-gray-400 mt-1">sur {rules.length} configurées</p>
        </div>
        <div className={`stat-card ${criticalCount > 0 ? 'border-l-4 border-red-400' : ''}`}>
          <p className="text-[0.6875rem] text-gray-400 uppercase tracking-wider mb-2">Alertes critiques</p>
          <p className={`text-3xl font-bold ${criticalCount > 0 ? 'text-red-600' : 'text-gray-900'}`} style={{fontFamily:'Outfit,sans-serif'}}>{criticalCount}</p>
          <p className="text-xs text-gray-400 mt-1">conditions violées</p>
        </div>
        <div className={`stat-card ${warningCount > 0 ? 'border-l-4 border-amber-400' : ''}`}>
          <p className="text-[0.6875rem] text-gray-400 uppercase tracking-wider mb-2">Avertissements</p>
          <p className={`text-3xl font-bold ${warningCount > 0 ? 'text-amber-600' : 'text-gray-900'}`} style={{fontFamily:'Outfit,sans-serif'}}>{warningCount}</p>
          <p className="text-xs text-gray-400 mt-1">à surveiller</p>
        </div>
      </div>

      {/* Form to create/edit rule */}
      {showForm && (
        <div className="card-static p-6 border-2 border-dashed border-green-200 bg-green-50/20">
          <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Bell className="w-4 h-4 text-green-600" />
            {editingId ? 'Modifier la règle' : 'Nouvelle règle d\'alerte'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Libellé de la règle *</label>
              <input className="input-field" placeholder="Ex: Alerte retard critique" value={form.label} onChange={e => setForm(f => ({...f, label: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Type de condition</label>
              <select className="input-field" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Sévérité</label>
              <select className="input-field" value={form.severity} onChange={e => setForm(f => ({...f, severity: e.target.value}))}>
                {SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Opérateur</label>
              <select className="input-field" value={form.operator} onChange={e => setForm(f => ({...f, operator: e.target.value}))}>
                {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Seuil ({TYPES.find(t => t.value === form.type)?.unit})
              </label>
              <input className="input-field" type="number" value={form.threshold} onChange={e => setForm(f => ({...f, threshold: parseFloat(e.target.value)}))} />
            </div>
            {(form.type === 'project_delay' || form.type === 'budget_overrun' || form.type === 'milestone_late') && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Projet cible (vide = tous)</label>
                <select className="input-field" value={form.projectId} onChange={e => setForm(f => ({...f, projectId: e.target.value}))}>
                  <option value="">— Tous les projets —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                </select>
              </div>
            )}
            {form.type === 'kpi_gap' && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">KPI cible (vide = tous)</label>
                <select className="input-field" value={form.kpiId} onChange={e => setForm(f => ({...f, kpiId: e.target.value}))}>
                  <option value="">— Tous les KPIs —</option>
                  {kpis.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn-primary"><Save className="w-4 h-4"/> {editingId ? 'Enregistrer' : 'Créer la règle'}</button>
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="btn-secondary">Annuler</button>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {triggered.length > 0 && (
        <div className="card-static overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Alertes actives ({triggered.length})
            </h3>
            <button onClick={handleEvaluate} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Actualiser
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {triggered.map((alert, i) => {
              const sev = SEVERITIES.find(s => s.value === alert.severity) || SEVERITIES[1]
              return (
                <div key={i} className={`px-6 py-4 flex items-start gap-4 ${alert.severity === 'critical' ? 'bg-red-50/30' : alert.severity === 'warning' ? 'bg-amber-50/20' : 'bg-blue-50/20'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sev.color}`}>
                    <sev.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{alert.label}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-gray-400">Valeur actuelle : <strong>{alert.current}</strong></span>
                      <span className="text-[10px] text-gray-300">|</span>
                      <span className="text-[10px] text-gray-400">Seuil : <strong>{alert.threshold}</strong></span>
                    </div>
                  </div>
                  <SeverityBadge severity={alert.severity} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {triggered.length === 0 && !loading && (
        <div className="card-static p-8 text-center">
          <Check className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">Aucune alerte active</p>
          <p className="text-sm text-gray-400 mt-1">Toutes les conditions sont respectées</p>
        </div>
      )}

      {/* Rules list */}
      <div className="card-static overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Règles configurées ({rules.length})</h3>
        </div>
        {rules.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucune règle configurée</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4"><Plus className="w-4 h-4"/> Créer la première règle</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {rules.map(rule => {
              const typeInfo = TYPES.find(t => t.value === rule.type)
              const opInfo = OPERATORS.find(o => o.value === rule.operator)
              return (
                <div key={rule.id} className={`px-6 py-4 flex items-center gap-4 ${rule.isActive ? '' : 'opacity-50'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-800">{rule.label}</span>
                      <SeverityBadge severity={rule.severity} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {typeInfo?.label} {opInfo?.label} {rule.threshold} {typeInfo?.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(rule)} title={rule.isActive ? 'Désactiver' : 'Activer'}>
                      {rule.isActive
                        ? <ToggleRight className="w-6 h-6 text-green-500" />
                        : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                    </button>
                    <button onClick={() => startEdit(rule)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(rule.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
