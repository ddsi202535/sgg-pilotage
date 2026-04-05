import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

// ─── Permission matrix (mirrors server/middleware/authorize.js) ───
export const ROLE_PERMISSIONS = {
  SGG:                   ['view_all', 'edit_all', 'validate', 'export', 'admin', 'manage_users', 'manage_chefs', 'view_strategic', 'edit_strategic', 'view_all_readonly', 'view_alerts', 'edit_alerts'],
  RESPONSABLE_PROGRAMME: ['view_programme', 'edit_programme', 'validate_reporting', 'export', 'view_strategic', 'manage_chefs', 'edit_strategic_own', 'view_budget_programme'],
  REFERENT_CONTROLE:     ['view_all', 'edit_operational', 'produce_reports', 'export', 'view_strategic'],
  CONTROLEUR_GESTION:    ['view_all', 'edit_all', 'analyze', 'extract_data', 'export', 'view_strategic', 'view_alerts'],
  CHEF_PROJET:           ['view_project', 'edit_project', 'upload_deliverables', 'export_own'],
  AUDIT:                 ['view_all_readonly', 'extract_reports', 'export']
}

export const USER_PROFILES = {
  SGG:                   { id: 'SGG',                   name: 'SGG',                             description: 'Secrétariat Général du Gouvernement',     color: '#006233' },
  RESPONSABLE_PROGRAMME: { id: 'RESPONSABLE_PROGRAMME', name: 'Responsable de Programme',        description: 'Vue programme + validation reporting',   color: '#0284c7' },
  REFERENT_CONTROLE:     { id: 'REFERENT_CONTROLE',     name: 'Référent de Contrôle',            description: 'Saisie et tableaux de bord',             color: '#059669' },
  CONTROLEUR_GESTION:    { id: 'CONTROLEUR_GESTION',    name: 'Contrôleur de Gestion',           description: 'Accès élargi, consolidation, analyse',    color: '#7c3aed' },
  CHEF_PROJET:           { id: 'CHEF_PROJET',           name: 'Chef de Projet',                  description: 'MAJ avancement, dépôt de livrables',     color: '#db2777' },
  AUDIT:                 { id: 'AUDIT',                 name: 'Inspection / Audit / IGF / Cour', description: 'Lecture seule, extraction de reportings', color: '#6b7280' }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('sgg_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('sgg_token'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Try real API login first, fallback to demo mode
  const login = useCallback(async (email, password, profileId) => {
    setLoading(true)
    setError(null)
    try {
      const data = await authAPI.login(email, password, profileId)
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        profileId: data.user.profileId,
        profile: USER_PROFILES[data.user.profileId] || USER_PROFILES.SGG
      }
      localStorage.setItem('sgg_token', data.token)
      localStorage.setItem('sgg_user', JSON.stringify(userData))
      setUser(userData)
      setIsAuthenticated(true)
      return true
    } catch (err) {
      // Fallback demo mode when API is unavailable
      console.warn('API unavailable, using demo mode:', err.message)
      const profile = USER_PROFILES[profileId]
      if (profile && email && password) {
        const userData = {
          id: `demo_${profileId}`,
          email,
          name: `Utilisateur ${profile.name}`,
          profileId,
          profile
        }
        localStorage.setItem('sgg_user', JSON.stringify(userData))
        setUser(userData)
        setIsAuthenticated(true)
        return true
      }
      setError('Identifiants invalides')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('sgg_token')
    localStorage.removeItem('sgg_user')
  }, [])

  const hasPermission = useCallback((permission) => {
    if (!user) return false
    const granted = ROLE_PERMISSIONS[user.profileId] || []
    return granted.includes(permission)
  }, [user])

  // Helper: can() — check one or multiple permissions (OR logic)
  const can = useCallback((...permissions) => {
    if (!user) return false
    const granted = ROLE_PERMISSIONS[user.profileId] || []
    return permissions.some(p => granted.includes(p))
  }, [user])

  // Computed role values memoized for stability
  const roleFlags = useMemo(() => ({
    isAdmin: user?.profileId === 'SGG',
    isReadOnly: user?.profileId === 'AUDIT',
    isChefProjet: user?.profileId === 'CHEF_PROJET',
    isAudit: user?.profileId === 'AUDIT'
  }), [user?.profileId])

  const contextValue = useMemo(() => ({
    user, isAuthenticated, loading, error,
    login, logout,
    hasPermission, can,
    ...roleFlags,
    USER_PROFILES, ROLE_PERMISSIONS
  }), [user, isAuthenticated, loading, error, login, logout, hasPermission, can, roleFlags])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
