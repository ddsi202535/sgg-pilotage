import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { projectsAPI, risksAPI, budgetAPI, kpisAPI, healthAPI } from '../services/api'

// ─── Fallback demo data (used when API is unavailable) ───
const DEMO_PROJECTS = [
  {
    id: 'P001', code: 'P001', name: 'Digitalisation des procédures administratives',
    type: 'informatique', programme: "Modernisation de l'administration", status: 'en_cours',
    physicalProgress: 65, financialProgress: 58, budget: 15000000, consumed: 8700000,
    startDate: '2024-01-15', endDate: '2025-12-31', directorate: 'DT', manager: 'Ahmed Bennani',
    description: "Mise en place d'une plateforme de dématérialisation des procédures",
    phases: [
      { id: 1, name: 'Conception', status: 'done', progress: 100 },
      { id: 2, name: 'Développement', status: 'in_progress', progress: 70 },
      { id: 3, name: 'Tests', status: 'pending', progress: 0 },
      { id: 4, name: 'Déploiement', status: 'pending', progress: 0 }
    ],
    milestones: [
      { id: 1, name: 'Cahier des charges', date: '2024-03-01', status: 'done' },
      { id: 2, name: 'Prototype', date: '2024-06-30', status: 'done' },
      { id: 3, name: 'Version Bêta', date: '2024-12-15', status: 'in_progress' },
      { id: 4, name: 'Livraison finale', date: '2025-06-30', status: 'pending' }
    ],
    risks: ['R001', 'R003'], deliverables: ['Cahier des charges', 'Spécifications techniques', 'Manuel utilisateur']
  },
  {
    id: 'P002', code: 'P002', name: 'Réforme du cadre juridique',
    type: 'juridique', programme: 'Modernisation législative', status: 'en_cours',
    physicalProgress: 40, financialProgress: 35, budget: 5000000, consumed: 1750000,
    startDate: '2024-03-01', endDate: '2025-08-31', directorate: 'DAJ', manager: 'Fatima Zahra Alaoui',
    description: 'Élaboration et adoption de nouveaux textes juridiques',
    phases: [
      { id: 1, name: 'Étude comparative', status: 'done', progress: 100 },
      { id: 2, name: 'Rédaction avant-projet', status: 'in_progress', progress: 60 },
      { id: 3, name: 'Consultation', status: 'pending', progress: 0 },
      { id: 4, name: 'Adoption', status: 'pending', progress: 0 }
    ],
    milestones: [
      { id: 1, name: "Rapport d'étude", date: '2024-05-31', status: 'done' },
      { id: 2, name: 'Avant-projet', date: '2024-10-31', status: 'in_progress' },
      { id: 3, name: 'Validation gouvernementale', date: '2025-03-31', status: 'pending' }
    ],
    risks: ['R002'], deliverables: ["Rapport d'étude", 'Avant-projet de loi', 'Note explicative']
  },
  {
    id: 'P003', code: 'P003', name: 'Campagne de communication gouvernementale',
    type: 'communication', programme: 'Communication publique', status: 'en_cours',
    physicalProgress: 80, financialProgress: 75, budget: 8000000, consumed: 6000000,
    startDate: '2024-02-01', endDate: '2024-12-31', directorate: 'DICOM', manager: 'Karim Tazi',
    description: 'Campagne multi-supports de sensibilisation',
    phases: [
      { id: 1, name: 'Stratégie', status: 'done', progress: 100 },
      { id: 2, name: 'Production', status: 'done', progress: 90 },
      { id: 3, name: 'Diffusion', status: 'in_progress', progress: 60 },
      { id: 4, name: 'Évaluation', status: 'pending', progress: 0 }
    ],
    milestones: [
      { id: 1, name: 'Plan média', date: '2024-03-15', status: 'done' },
      { id: 2, name: 'Production contenus', date: '2024-06-30', status: 'done' },
      { id: 3, name: 'Lancement campagne', date: '2024-09-01', status: 'done' }
    ],
    risks: [], deliverables: ['Charte graphique', 'Spots vidéo', 'Affiches', "Rapport d'impact"]
  },
  {
    id: 'P004', code: 'P004', name: 'Équipement des administrations régionales',
    type: 'equipement', programme: 'Infrastructure numérique', status: 'planification',
    physicalProgress: 10, financialProgress: 5, budget: 25000000, consumed: 1250000,
    startDate: '2024-09-01', endDate: '2026-08-31', directorate: 'DLOG', manager: 'Mohammed Amine Iraqi',
    description: 'Équipement en matériel informatique des directions régionales',
    phases: [
      { id: 1, name: 'Audit existant', status: 'done', progress: 100 },
      { id: 2, name: "Appel d'offres", status: 'in_progress', progress: 50 },
      { id: 3, name: 'Livraison', status: 'pending', progress: 0 },
      { id: 4, name: 'Installation', status: 'pending', progress: 0 }
    ],
    milestones: [
      { id: 1, name: "Rapport d'audit", date: '2024-08-31', status: 'done' },
      { id: 2, name: 'Attribution marché', date: '2025-01-31', status: 'pending' }
    ],
    risks: ['R004'], deliverables: ["Rapport d'audit", "Dossier d'appel d'offres"]
  },
  {
    id: 'P005', code: 'P005', name: 'Formation des cadres SGG',
    type: 'organisationnel', programme: 'Développement des compétences', status: 'en_cours',
    physicalProgress: 55, financialProgress: 50, budget: 3000000, consumed: 1500000,
    startDate: '2024-04-01', endDate: '2025-03-31', directorate: 'DRH', manager: 'Salma Benkirane',
    description: 'Programme de formation continue des cadres',
    phases: [
      { id: 1, name: 'Identification besoins', status: 'done', progress: 100 },
      { id: 2, name: 'Planification', status: 'done', progress: 80 },
      { id: 3, name: 'Réalisation formations', status: 'in_progress', progress: 40 },
      { id: 4, name: 'Évaluation', status: 'pending', progress: 0 }
    ],
    milestones: [
      { id: 1, name: 'Catalogue formations', date: '2024-05-31', status: 'done' },
      { id: 2, name: '50% sessions réalisées', date: '2024-09-30', status: 'in_progress' }
    ],
    risks: [], deliverables: ['Plan de formation', 'Supports pédagogiques', 'Attestations']
  }
]

const DEMO_RISKS = [
  { id: 'R001', code: 'R001', title: 'Retard de développement technique', description: "Complexité technique sous-estimée", projectId: 'P001', programme: "Modernisation de l'administration", category: 'technique', probability: 4, impact: 4, level: 'élevé', owner: 'Ahmed Bennani', mitigation: "Renforcer l'équipe", mitigationProgress: 60, status: 'actif', createdAt: '2024-04-15', updatedAt: '2024-10-01' },
  { id: 'R002', code: 'R002', title: 'Opposition syndicale à la réforme', description: 'Résistance potentielle des syndicats', projectId: 'P002', programme: 'Modernisation législative', category: 'social', probability: 3, impact: 5, level: 'élevé', owner: 'Fatima Zahra Alaoui', mitigation: 'Concertations préalables', mitigationProgress: 40, status: 'actif', createdAt: '2024-05-20', updatedAt: '2024-09-15' },
  { id: 'R003', code: 'R003', title: 'Dépassement budgétaire', description: "Inflation des coûts IT", projectId: 'P001', programme: "Modernisation de l'administration", category: 'financier', probability: 3, impact: 3, level: 'moyen', owner: 'Ahmed Bennani', mitigation: 'Contrats cadres', mitigationProgress: 80, status: 'actif', createdAt: '2024-06-10', updatedAt: '2024-10-05' },
  { id: 'R004', code: 'R004', title: 'Délais de livraison fournisseurs', description: "Tensions sur la chaîne d'approvisionnement", projectId: 'P004', programme: 'Infrastructure numérique', category: 'logistique', probability: 4, impact: 3, level: 'moyen', owner: 'Mohammed Amine Iraqi', mitigation: 'Clauses pénalités', mitigationProgress: 30, status: 'actif', createdAt: '2024-09-01', updatedAt: '2024-10-10' },
  { id: 'R005', code: 'R005', title: 'Non-conformité réglementaire', description: 'Évolution de la réglementation', projectId: 'P001', programme: "Modernisation de l'administration", category: 'réglementaire', probability: 2, impact: 4, level: 'moyen', owner: 'Ahmed Bennani', mitigation: 'Veille réglementaire', mitigationProgress: 50, status: 'actif', createdAt: '2024-07-01', updatedAt: '2024-09-20' }
]

const DEMO_KPIS = [
  { id: 'K001', code: 'K001', name: "Taux d'exécution budgétaire", value: 72, unit: '%', target: 80, trend: 'up' },
  { id: 'K002', code: 'K002', name: "Taux d'avancement physique moyen", value: 58, unit: '%', target: 65, trend: 'up' },
  { id: 'K003', code: 'K003', name: 'Nombre de projets en retard', value: 2, unit: '', target: 0, trend: 'down' },
  { id: 'K004', code: 'K004', name: 'Taux de couverture des risques', value: 100, unit: '%', target: 100, trend: 'stable' },
  { id: 'K005', code: 'K005', name: 'Satisfaction des parties prenantes', value: 78, unit: '%', target: 85, trend: 'up' },
  { id: 'K006', code: 'K006', name: 'Délai moyen de réalisation', value: 85, unit: 'jours', target: 90, trend: 'up' }
]

const DEMO_BUDGET = {
  total: 56000000, engaged: 19200000, committed: 28000000, spent: 15500000, remaining: 36800000,
  byProgramme: [
    { id: 'b1', name: "Modernisation de l'administration", budget: 15000000, engaged: 8700000, spent: 7200000 },
    { id: 'b2', name: 'Modernisation législative', budget: 5000000, engaged: 1750000, spent: 1400000 },
    { id: 'b3', name: 'Communication publique', budget: 8000000, engaged: 6000000, spent: 5100000 },
    { id: 'b4', name: 'Infrastructure numérique', budget: 25000000, engaged: 1250000, spent: 900000 },
    { id: 'b5', name: 'Développement des compétences', budget: 3000000, engaged: 1500000, spent: 900000 }
  ],
  byMonth: [
    { id: 'm1', month: 'Jan', budget: 4000000, spent: 3200000 },
    { id: 'm2', month: 'Fév', budget: 4500000, spent: 3800000 },
    { id: 'm3', month: 'Mar', budget: 5000000, spent: 4100000 },
    { id: 'm4', month: 'Avr', budget: 4800000, spent: 3900000 },
    { id: 'm5', month: 'Mai', budget: 5200000, spent: 4200000 },
    { id: 'm6', month: 'Juin', budget: 5500000, spent: 4500000 },
    { id: 'm7', month: 'Juil', budget: 4000000, spent: 3100000 },
    { id: 'm8', month: 'Août', budget: 3500000, spent: 2800000 },
    { id: 'm9', month: 'Sep', budget: 5000000, spent: 4000000 },
    { id: 'm10', month: 'Oct', budget: 5500000, spent: 0 },
    { id: 'm11', month: 'Nov', budget: 5000000, spent: 0 },
    { id: 'm12', month: 'Déc', budget: 4000000, spent: 0 }
  ]
}

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [risks, setRisks] = useState([])
  const [kpis, setKpis] = useState([])
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(false)
  const [apiMode, setApiMode] = useState(null) // 'api' | 'demo'
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  // ─── Load all data ─────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const health = await healthAPI.check()
      if (health?.status === 'ok') {
        const [p, r, k, b] = await Promise.all([
          projectsAPI.getAll(),
          risksAPI.getAll(),
          kpisAPI.getAll(),
          budgetAPI.getAll()
        ])
        setProjects(p)
        setRisks(r)
        setKpis(k)
        setBudget(b)
        setApiMode('api')
      } else {
        throw new Error('API offline')
      }
    } catch {
      setProjects(DEMO_PROJECTS)
      setRisks(DEMO_RISKS)
      setKpis(DEMO_KPIS)
      setBudget(DEMO_BUDGET)
      setApiMode('demo')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  // ─── Projects CRUD ─────────────────────────────────────────
  const addProject = useCallback(async (data) => {
    if (apiMode === 'api') {
      const created = await projectsAPI.create(data)
      setProjects(prev => [created, ...prev])
      showToast('Projet créé avec succès')
      return created
    } else {
      const newP = { ...data, id: `P${Date.now()}`, code: `P${String(projects.length + 1).padStart(3, '0')}`, phases: data.phases || [], milestones: [], risks: [], deliverables: data.deliverables || [] }
      setProjects(prev => [newP, ...prev])
      showToast('Projet créé (mode démo)')
      return newP
    }
  }, [apiMode, projects.length, showToast])

  const updateProject = useCallback(async (id, data) => {
    if (apiMode === 'api') {
      const updated = await projectsAPI.update(id, data)
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p))
      showToast('Projet mis à jour')
      return updated
    } else {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
      showToast('Projet mis à jour (mode démo)')
    }
  }, [apiMode, showToast])

  const deleteProject = useCallback(async (id) => {
    if (apiMode === 'api') {
      await projectsAPI.delete(id)
    }
    setProjects(prev => prev.filter(p => p.id !== id))
    showToast('Projet supprimé', 'error')
  }, [apiMode, showToast])

  // ─── Risks CRUD ────────────────────────────────────────────
  const addRisk = useCallback(async (data) => {
    if (apiMode === 'api') {
      const created = await risksAPI.create(data)
      setRisks(prev => [created, ...prev])
      showToast('Risque créé avec succès')
      return created
    } else {
      const newR = { ...data, id: `R${Date.now()}`, code: `R${String(risks.length + 1).padStart(3, '0')}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      setRisks(prev => [newR, ...prev])
      showToast('Risque créé (mode démo)')
      return newR
    }
  }, [apiMode, risks.length, showToast])

  const updateRisk = useCallback(async (id, data) => {
    if (apiMode === 'api') {
      const updated = await risksAPI.update(id, data)
      setRisks(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r))
      showToast('Risque mis à jour')
      return updated
    } else {
      setRisks(prev => prev.map(r => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r))
      showToast('Risque mis à jour (mode démo)')
    }
  }, [apiMode, showToast])

  const deleteRisk = useCallback(async (id) => {
    if (apiMode === 'api') {
      await risksAPI.delete(id)
    }
    setRisks(prev => prev.filter(r => r.id !== id))
    showToast('Risque supprimé', 'error')
  }, [apiMode, showToast])

  return (
    <DataContext.Provider value={{
      projects, risks, kpis, budget, loading, apiMode, toast,
      addProject, updateProject, deleteProject,
      addRisk, updateRisk, deleteRisk,
      reload: loadData
    }}>
      {children}

      {/* Global Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium text-white flex items-center gap-2.5 animate-slide-up`}
          style={{ background: toast.type === 'error' ? '#dc2626' : '#006233', minWidth: '240px' }}>
          <span>{toast.type === 'error' ? '🗑️' : '✅'}</span>
          {toast.message}
          {apiMode === 'demo' && <span className="ml-auto text-xs opacity-70">démo</span>}
        </div>
      )}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used within DataProvider')
  return context
}
