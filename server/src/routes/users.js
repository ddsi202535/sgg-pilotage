import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { authenticateToken } from '../middleware/auth.js'
import { authorize, ROLE_PERMISSIONS } from '../middleware/authorize.js'

const router = Router()
const prisma = new PrismaClient()

// All routes require authentication + admin permission
// Access control middleware for user management
const canManageUsers = [authenticateToken, authorize('manage_users', 'manage_chefs')]

// Helper to check if current user can manage a specific target profile
const checkProfileAccess = (req, targetProfileId) => {
  const profileId = req.user.profileId || 'AUDIT'
  const granted = ROLE_PERMISSIONS[profileId] || []
  const isAdmin = granted.includes('manage_users')
  const isChefManager = granted.includes('manage_chefs')

  if (isAdmin) return true // Admin can manage everyone
  if (isChefManager && targetProfileId === 'CHEF_PROJET') return true // Chef manager can only manage chefs
  return false
}

// GET /api/users — list all users
router.get('/', ...canManageUsers, async (req, res) => {
  try {
    const granted = ROLE_PERMISSIONS[req.user.profileId] || []
    const isAdmin = granted.includes('manage_users')
    
    const users = await prisma.user.findMany({
      where: isAdmin ? {} : { profileId: 'CHEF_PROJET' },
      select: { id: true, email: true, name: true, profileId: true, profileName: true, permissions: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/users — create a user
router.post('/', ...canManageUsers, async (req, res) => {
  try {
    const { email, password, name, profileId, profileName, permissions } = req.body

    if (!email || !password || !name || !profileId) {
      return res.status(400).json({ error: 'email, password, name et profileId sont requis' })
    }

    if (!checkProfileAccess(req, profileId)) {
      return res.status(403).json({ error: 'Vous n\'avez pas le droit de créer un utilisateur avec ce profil' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ error: 'Cet email est déjà utilisé' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        profileId,
        profileName: profileName || profileId,
        permissions: permissions || []
      },
      select: { id: true, email: true, name: true, profileId: true, profileName: true, permissions: true, createdAt: true }
    })

    res.status(201).json(user)
  } catch (err) {
    console.error('Create user error:', err)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/users/:id — update user (profile, name; password optional)
router.put('/:id', ...canManageUsers, async (req, res) => {
  try {
    const { name, email, profileId, profileName, permissions, password } = req.body
    
    // Check if user exists and if requester can manage them
    const target = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!target) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    
    if (!checkProfileAccess(req, target.profileId)) {
      return res.status(403).json({ error: 'Vous n\'avez pas le droit de modifier cet utilisateur' })
    }
    
    if (profileId && !checkProfileAccess(req, profileId)) {
      return res.status(403).json({ error: 'Vous n\'avez pas le droit d\'attribuer ce profil' })
    }
    const data = {}
    if (name) data.name = name
    if (email) data.email = email
    if (profileId) data.profileId = profileId
    if (profileName) data.profileName = profileName
    if (permissions) data.permissions = permissions
    if (password) data.password = await bcrypt.hash(password, 10)

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, name: true, profileId: true, profileName: true, permissions: true, createdAt: true }
    })
    res.json(user)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/users/:id
router.delete('/:id', ...canManageUsers, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' })
    }

    const target = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!target) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    if (!checkProfileAccess(req, target.profileId)) {
      return res.status(403).json({ error: 'Vous n\'avez pas le droit de supprimer cet utilisateur' })
    }
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/users/:id/reset-password — reset password (admin)
router.post('/:id/reset-password', ...canManageUsers, async (req, res) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!target) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    if (!checkProfileAccess(req, target.profileId)) {
      return res.status(403).json({ error: 'Accès refusé' })
    }
    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' })
    }
    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: req.params.id }, data: { password: hashed } })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
