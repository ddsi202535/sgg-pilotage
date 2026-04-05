import React, { useState, useEffect, useCallback } from 'react'
import { useAuth, USER_PROFILES, ROLE_PERMISSIONS } from '../contexts/AuthContext'
import { AdminGuard, PermissionGuard } from '../components/PermissionGuard'
import { request } from '../services/api'
import {
  Users, Plus, Pencil, Trash2, X, Check, KeyRound, Shield, User,
  Eye, EyeOff, Search
} from 'lucide-react'

// API helper using shared request
const usersAPI = {
  getAll: () => request('/users'),
  create: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  resetPassword: (id, newPassword) => request(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) })
}

const EMPTY_FORM = { name: '', email: '', password: '', profileId: 'CHEF_PROJET' }

const PROFILE_BADGES = {
  SGG: 'bg-green-100 text-green-800',
  RESPONSABLE_PROGRAMME: 'bg-blue-100 text-blue-700',
  REFERENT_CONTROLE: 'bg-emerald-100 text-emerald-700',
  CONTROLEUR_GESTION: 'bg-violet-100 text-violet-700',
  CHEF_PROJET: 'bg-pink-100 text-pink-700',
  AUDIT: 'bg-gray-100 text-gray-600'
}

function ProfilePill({ profileId }) {
  const profile = USER_PROFILES[profileId]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${PROFILE_BADGES[profileId] || 'bg-gray-100 text-gray-600'}`}>
      <Shield className="w-3 h-3" />
      {profile?.name || profileId}
    </span>
  )
}

export default function UserManagement() {
  const { user: currentUser, isAdmin, can } = useAuth()
  const isChefManager = can('manage_chefs') && !can('manage_users')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showPwd, setShowPwd] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [newPwd, setNewPwd] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await usersAPI.getAll()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleSave = async () => {
    if (!form.name || !form.email || !form.profileId) return
    if (!editingId && !form.password) return alert('Mot de passe requis')
    setSubmitting(true)
    try {
      if (editingId) {
        const data = { name: form.name, email: form.email, profileId: form.profileId, profileName: USER_PROFILES[form.profileId]?.name || form.profileId }
        await usersAPI.update(editingId, data)
      } else {
        await usersAPI.create({ ...form, profileName: USER_PROFILES[form.profileId]?.name || form.profileId })
      }
      setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); fetchUsers()
    } catch (err) { alert(err.message) } finally { setSubmitting(false) }
  }

  const handleDelete = async (id, name) => {
    if (id === currentUser?.id) return alert('Impossible de supprimer votre propre compte')
    if (!window.confirm(`Supprimer l'utilisateur "${name}" ?`)) return
    await usersAPI.delete(id); fetchUsers()
  }

  const handleResetPwd = async () => {
    if (!newPwd || newPwd.length < 6) return alert('Au moins 6 caractères')
    await usersAPI.resetPassword(resetTarget, newPwd)
    setResetTarget(null); setNewPwd(''); alert('Mot de passe mis à jour')
  }

  const filtered = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.profileId?.toLowerCase().includes(search.toLowerCase())
    
    if (isChefManager) return matchesSearch && u.profileId === 'CHEF_PROJET'
    return matchesSearch
  })

  // Group by profile
  const byProfile = Object.keys(USER_PROFILES).map(key => ({
    key,
    profile: USER_PROFILES[key],
    count: users.filter(u => u.profileId === key).length
  }))

  return (
    <PermissionGuard need={['manage_users', 'manage_chefs']} fallback={
      <div className="card-static p-16 text-center">
        <Shield className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-700">Accès restreint</h2>
        <p className="text-sm text-gray-400 mt-1">Vous n'avez pas les permissions nécessaires pour gérer les utilisateurs.</p>
      </div>
    }>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Administration</p>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {isChefManager ? 'Gestion des Chefs de Projet' : 'Gestion des Utilisateurs'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{users.length} compte(s) enregistré(s)</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Nouvel utilisateur
          </button>
        </div>

        {/* Profile statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {byProfile.map(({ key, profile, count }) => (
            <div key={key} className="stat-card p-4">
              <div className="w-3 h-3 rounded-full mb-2" style={{ background: profile.color }} />
              <p className="text-xs text-gray-500 leading-tight">{profile.name}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: 'Outfit' }}>{count}</p>
            </div>
          ))}
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="card-static p-6 border-2 border-dashed border-green-200 bg-green-50/20">
            <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2">
              <User className="w-4 h-4 text-green-600" />
              {editingId ? 'Modifier l\'utilisateur' : (isChefManager ? 'Nouveau Chef de Projet' : 'Nouvel utilisateur')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Nom complet *</label>
                <input className="input-field" placeholder="Prénom Nom" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Email *</label>
                <input className="input-field" type="email" placeholder="prenom.nom@sgg.gov.ma" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
              </div>
              {!editingId && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Mot de passe *</label>
                  <div className="relative">
                    <input className="input-field pr-10" type={showPwd ? 'text' : 'password'} placeholder="●●●●●●●●" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} />
                    <button onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Profil *</label>
                <select className="input-field" value={form.profileId} onChange={e => setForm(f => ({...f, profileId: e.target.value}))} disabled={isChefManager}>
                  {Object.entries(USER_PROFILES)
                    .filter(([key]) => !isChefManager || key === 'CHEF_PROJET')
                    .map(([key, p]) => (
                      <option key={key} value={key}>{p.name}</option>
                    ))}
                </select>
                {form.profileId && (
                  <p className="text-xs text-gray-400 mt-1 italic">{USER_PROFILES[form.profileId]?.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={submitting} className="btn-primary">
                <Check className="w-4 h-4" /> {editingId ? 'Enregistrer' : 'Créer le compte'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} className="btn-secondary">Annuler</button>
            </div>
          </div>
        )}

        {/* Reset password modal */}
        {resetTarget && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="card-static w-96 p-6 m-4">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" /> Réinitialiser le mot de passe
              </h3>
              <input
                type="password" placeholder="Nouveau mot de passe (6 caractères min)"
                value={newPwd} onChange={e => setNewPwd(e.target.value)}
                className="input-field mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleResetPwd} className="btn-primary flex-1">Confirmer</button>
                <button onClick={() => { setResetTarget(null); setNewPwd('') }} className="btn-secondary flex-1">Annuler</button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-field pl-10"
            placeholder="Rechercher un utilisateur (nom, email, profil)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Users table */}
        <div className="card-static overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">{filtered.length} utilisateur(s)</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Profil</th>
                    {!isChefManager && <th>Permissions</th>}
                    <th>Créé le</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className={u.id === currentUser?.id ? 'bg-green-50/20' : ''}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: USER_PROFILES[u.profileId]?.color || '#6b7280' }}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{u.name}</span>
                          {u.id === currentUser?.id && <span className="text-[10px] text-green-600 font-bold">(vous)</span>}
                        </div>
                      </td>
                      <td className="text-gray-500">{u.email}</td>
                      <td><ProfilePill profileId={u.profileId} /></td>
                      {!isChefManager && (
                        <td>
                          <div className="flex flex-wrap gap-1 max-w-[260px]">
                            {(u.permissions || []).slice(0, 3).map(p => (
                              <span key={p} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{p}</span>
                            ))}
                            {(u.permissions?.length || 0) > 3 && (
                              <span className="text-[10px] text-gray-400">+{u.permissions.length - 3}</span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingId(u.id); setForm({ name: u.name, email: u.email, profileId: u.profileId, password: '' }); setShowForm(true) }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setResetTarget(u.id)}
                            className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Réinitialiser le mot de passe"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            disabled={u.id === currentUser?.id}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Profiles reference card */}
        <div className="card-static p-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Référentiel des profils et droits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Object.entries(USER_PROFILES).map(([key, profile]) => {
              const perms = ROLE_PERMISSIONS[key] || []
              return (
                <div key={key} className="p-4 rounded-xl border border-gray-100 bg-gray-50/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: profile.color }} />
                    <span className="font-semibold text-sm text-gray-800">{profile.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2 italic">{profile.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {perms.map(p => (
                      <span key={p} className="text-[10px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono">{p}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </PermissionGuard>
  )
}
