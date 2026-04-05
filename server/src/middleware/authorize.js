/**
 * RBAC Middleware — SGG Pilotage
 *
 * Profiles and their permissions:
 *  SGG              → all access, read/write limited
 *  RESPONSABLE_PROGRAMME → their programme only, validate reporting
 *  REFERENT_CONTROLE → all read + edit operational data
 *  CONTROLEUR_GESTION → full read + analysis + extract
 *  CHEF_PROJET       → their own project only
 *  AUDIT             → read-only, extract reports
 */

// Permission matrix (role → granted permissions)
export const ROLE_PERMISSIONS = {
  SGG: ['view_all', 'edit_all', 'validate', 'export', 'admin', 'manage_users', 'manage_chefs', 'view_strategic', 'edit_strategic', 'view_alerts', 'edit_alerts'],
  RESPONSABLE_PROGRAMME: ['view_programme', 'edit_programme', 'validate_reporting', 'export', 'view_strategic', 'manage_chefs', 'edit_strategic_own', 'view_budget_programme'],
  REFERENT_CONTROLE: ['view_all', 'edit_operational', 'produce_reports', 'export', 'view_strategic'],
  CONTROLEUR_GESTION: ['view_all', 'edit_all', 'analyze', 'extract_data', 'export', 'view_strategic', 'view_alerts'],
  CHEF_PROJET: ['view_project', 'edit_project', 'upload_deliverables', 'export_own'],
  AUDIT: ['view_all_readonly', 'extract_reports', 'export']
}

/**
 * Middleware: require that actor has one of the listed permissions.
 * Usage: authorize('edit_all', 'edit_operational')
 */
export function authorize(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const profileId = req.user.profileId || 'AUDIT'
    const granted = ROLE_PERMISSIONS[profileId] || []

    const hasPermission = requiredPermissions.some(perm => granted.includes(perm))

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Accès refusé',
        required: requiredPermissions,
        yourProfile: profileId
      })
    }

    next()
  }
}

/**
 * Middleware: audit profile (read-only) — blocks any write operation.
 */
export function blockReadOnly(req, res, next) {
  const profileId = req.user?.profileId
  if (profileId === 'AUDIT') {
    return res.status(403).json({ error: 'Profil Audit/Inspection : accès en lecture seule.' })
  }
  next()
}

/**
 * Middleware: filter projects based on role.
 * - CHEF_PROJET: only their managed projects (by manager name)
 * - RESPONSABLE_PROGRAMME: only their programme
 * - Others: all
 * Attaches req.projectFilter (Prisma where clause).
 */
export function applyProjectScope(req, res, next) {
  const profileId = req.user?.profileId
  const userName = req.user?.name || ''
  const programme = req.user?.programme || ''

  if (profileId === 'CHEF_PROJET') {
    req.projectFilter = { manager: { contains: userName, mode: 'insensitive' } }
  } else if (profileId === 'RESPONSABLE_PROGRAMME' && programme) {
    req.projectFilter = { programme: { contains: programme, mode: 'insensitive' } }
  } else {
    req.projectFilter = {}
  }

  next()
}

/**
 * Helper: Check if user has a given permission (use in route logic).
 */
export function userHasPermission(user, permission) {
  const profileId = user?.profileId || 'AUDIT'
  const granted = ROLE_PERMISSIONS[profileId] || []
  return granted.includes(permission)
}
