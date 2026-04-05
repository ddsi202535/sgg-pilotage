import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, profileId } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Identifiants invalides' })
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        profileId: user.profileId,
        profileName: user.profileName,
        permissions: user.permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileId: user.profileId,
        profileName: user.profileName,
        permissions: user.permissions
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, profileId: true, profileName: true, permissions: true }
    })
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, profileId, profileName, permissions } = req.body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ error: 'Email déjà utilisé' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        profileId: profileId || 'CHEF_PROJET',
        profileName: profileName || 'Chef de Projet',
        permissions: permissions || ['view_project', 'edit_project']
      }
    })

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      profileId: user.profileId
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
