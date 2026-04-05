import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Lock } from 'lucide-react'

/**
 * PermissionGuard — Renders children only if user has required permission(s).
 * @param {string[]} need - array of permissions (OR logic)
 * @param {ReactNode} fallback - optional element to render if denied
 */
export function PermissionGuard({ need = [], children, fallback = null }) {
  const { can } = useAuth()
  return can(...need) ? <>{children}</> : <>{fallback}</>
}

/**
 * ReadOnlyBadge — Shows a "Lecture seule" label for audit users. 
 * Use alongside the ReadOnlyGuard.
 */
export function ReadOnlyBadge() {
  const { isReadOnly } = useAuth()
  if (!isReadOnly) return null
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold rounded-full">
      <Lock className="w-3.5 h-3.5" />
      Accès lecture seule
    </span>
  )
}

/**
 * AdminGuard — Renders children only for SGG (admin).
 */
export function AdminGuard({ children, fallback = null }) {
  const { isAdmin } = useAuth()
  return isAdmin ? <>{children}</> : <>{fallback}</>
}

/**
 * useCanEdit — hook that returns true if the user is allowed to edit content
 */
export function useCanEdit() {
  const { can } = useAuth()
  return can('edit_all', 'edit_project', 'edit_programme', 'edit_operational')
}
