const API_BASE = 'http://localhost:3001/api'

// Helper to build full file preview/download URL
export function buildFileUrl(fileUrl, download = false, originalName = '') {
  if (!fileUrl) return ''
  let url = `${API_BASE}${fileUrl}`
  if (download) {
    url += `?dl=1`
    if (originalName) url += `&name=${encodeURIComponent(originalName)}`
  }
  return url
}

function getToken() {
  return localStorage.getItem('sgg_token')
}

export async function request(endpoint, options = {}) {
  const token = getToken()
  const isFormData = options.body instanceof FormData
  
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  }

  // Set default JSON Content-Type only if it's not FormData
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const config = { ...options, headers }

  const response = await fetch(`${API_BASE}${endpoint}`, config)

  if (response.status === 401) {
    localStorage.removeItem('sgg_token')
    localStorage.removeItem('sgg_user')
    window.location.href = '/'
    throw new Error('Session expirée')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur réseau' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// ─── Auth ───
export const authAPI = {
  login: (email, password, profileId) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, profileId })
    }),
  me: () => request('/auth/me'),
  register: (data) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) })
}

// ─── Projects ───
export const projectsAPI = {
  getAll: () => request('/projects'),
  getById: (id) => request(`/projects/${id}`),
  create: (data) =>
    request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    request(`/projects/${id}`, { method: 'DELETE' }),
  updateProgress: (id, data) =>
    request(`/projects/${id}/progress`, { method: 'PUT', body: JSON.stringify(data) }),

  // Comments
  getComments: (id) => request(`/projects/${id}/comments`),
  addComment: (id, content) =>
    request(`/projects/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Phases
  addPhase: (projectId, data) =>
    request(`/projects/${projectId}/phases`, { method: 'POST', body: JSON.stringify(data) }),
  updatePhase: (projectId, phaseId, data) =>
    request(`/projects/${projectId}/phases/${phaseId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePhase: (projectId, phaseId) =>
    request(`/projects/${projectId}/phases/${phaseId}`, { method: 'DELETE' }),

  // Milestones
  addMilestone: (projectId, data) =>
    request(`/projects/${projectId}/milestones`, { method: 'POST', body: JSON.stringify(data) }),
  updateMilestone: (projectId, milestoneId, data) =>
    request(`/projects/${projectId}/milestones/${milestoneId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMilestone: (projectId, milestoneId) =>
    request(`/projects/${projectId}/milestones/${milestoneId}`, { method: 'DELETE' }),

  // Deliverables
  addDeliverable: (projectId, data) => {
    // data can be FormData (if with file) or an object
    let body = data;
    if (!(data instanceof FormData)) {
      body = JSON.stringify(data);
    }
    return request(`/projects/${projectId}/deliverables`, { method: 'POST', body });
  },
  deleteDeliverable: (projectId, delId) =>
    request(`/projects/${projectId}/deliverables/${delId}`, { method: 'DELETE' }),
  attachDeliverableFile: (projectId, delId, formData) =>
    request(`/projects/${projectId}/deliverables/${delId}/attach`, { method: 'PATCH', body: formData }),

  // Documents
  addDocument: (projectId, formData) =>
    request(`/projects/${projectId}/documents`, { method: 'POST', body: formData }),
  deleteDocument: (projectId, docId) =>
    request(`/projects/${projectId}/documents/${docId}`, { method: 'DELETE' })
}

// ─── Risks ───
export const risksAPI = {
  getAll: () => request('/risks'),
  create: (data) =>
    request('/risks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/risks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    request(`/risks/${id}`, { method: 'DELETE' })
}

// ─── Budget ───
export const budgetAPI = {
  getAll: () => request('/budget'),
  create: (data) => request('/budget', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/budget/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/budget/${id}`, { method: 'DELETE' }),

  // Monthly monitoring
  createMonth: (data) => request('/budget/month', { method: 'POST', body: JSON.stringify(data) }),
  updateMonth: (id, data) => request(`/budget/month/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMonth: (id) => request(`/budget/month/${id}`, { method: 'DELETE' }),
}

// ─── KPIs ───
export const kpisAPI = {
  getAll: () => request('/kpis'),
  update: (id, data) =>
    request(`/kpis/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

// ─── Health check ───
export const healthAPI = {
  check: () => fetch(`${API_BASE}/health`).then(r => r.json()).catch(() => null)
}

// ─── Notifications ───
export const notificationsAPI = {
  getAll: () => request('/notifications'),
  markAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' })
}

// ─── Strategic LdF Hierarchy ───
export const strategicAPI = {
  getTree: () => request('/strategic'),
  createAxe: (data) => request('/strategic/axes', { method: 'POST', body: JSON.stringify(data) }),
  updateAxe: (id, data) => request(`/strategic/axes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAxe: (id) => request(`/strategic/axes/${id}`, { method: 'DELETE' }),

  linkAxeToProgramme: (pbId, axeId) => request(`/strategic/programmes/${pbId}/link-axe`, { method: 'PUT', body: JSON.stringify({ axeId }) }),

  createObjectif: (data) => request('/strategic/objectifs', { method: 'POST', body: JSON.stringify(data) }),
  updateObjectif: (id, data) => request(`/strategic/objectifs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteObjectif: (id) => request(`/strategic/objectifs/${id}`, { method: 'DELETE' }),

  createIndicateur: (data) => request('/strategic/indicateurs', { method: 'POST', body: JSON.stringify(data) }),
  updateIndicateur: (id, data) => request(`/strategic/indicateurs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteIndicateur: (id) => request(`/strategic/indicateurs/${id}`, { method: 'DELETE' }),

  createMesure: (data) => request('/strategic/mesures', { method: 'POST', body: JSON.stringify(data) }),
  updateMesure: (id, data) => request(`/strategic/mesures/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMesure: (id) => request(`/strategic/mesures/${id}`, { method: 'DELETE' }),

  getProgrammesBudgetaires: () => request('/strategic/programmes-budgetaires'),
}

// ─── BI ───
export const biAPI = {
  getSnapshots: (programmeBudgetaireId) => request(`/bi/snapshots${programmeBudgetaireId ? `?programmeBudgetaireId=${programmeBudgetaireId}` : ''}`),
  createSnapshot: (programmeBudgetaireId) => request('/bi/snapshot', { method: 'POST', body: JSON.stringify({ programmeBudgetaireId }) })
}

// ─── Alert Rules ───
export const alertRulesAPI = {
  getRules: () => request('/alert-rules'),
  createRule: (data) => request('/alert-rules', { method: 'POST', body: JSON.stringify(data) }),
  updateRule: (id, data) => request(`/alert-rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRule: (id) => request(`/alert-rules/${id}`, { method: 'DELETE' }),
  evaluate: () => request('/alert-rules/evaluate'),
}

// ─── Programmes Budgétaires ───
export const programmesAPI = {
  getAll: () => request('/programmes'),
  getOne: (id) => request(`/programmes/${id}`),
  create: (data) => request('/programmes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/programmes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/programmes/${id}`, { method: 'DELETE' }),
  getResponsables: () => request('/programmes/meta/responsables'),
  getChefsProjet: () => request('/programmes/meta/chefs-projet'),
}
