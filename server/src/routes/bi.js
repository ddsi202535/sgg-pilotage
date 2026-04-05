import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth.js'
import { ROLE_PERMISSIONS } from '../middleware/authorize.js'

const router = Router()
const prisma = new PrismaClient()

// Helper: current user role
function canManageBI(user) {
  const profileId = user.profileId || 'AUDIT'
  const perms = ROLE_PERMISSIONS[profileId] || []
  return perms.includes('edit_all') || perms.includes('admin') || profileId === 'RESPONSABLE_PROGRAMME'
}

// ─── GET /api/bi/snapshots ─────────────────────────────────
router.get('/snapshots', authenticateToken, async (req, res) => {
  try {
    const { programmeBudgetaireId } = req.query
    const where = programmeBudgetaireId ? { programmeBudgetaireId } : {}
    
    // RPROG filter: only see their own programme if they don't have global view
    // (This logic mirrors other endpoints, but we keep simple for querying)
    
    const snapshots = await prisma.biSnapshot.findMany({
      where,
      orderBy: [
        { annee: 'asc' },
        { mois: 'asc' }
      ],
      include: {
        programmeBudgetaire: { select: { code: true, label: true } }
      }
    })
    res.json(snapshots)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /api/bi/snapshot ─────────────────────────────────
// Prend un instantané d'un programme à un instant T (mois courant)
router.post('/snapshot', authenticateToken, async (req, res) => {
  try {
    if (!canManageBI(req.user)) {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const { programmeBudgetaireId } = req.body
    if (!programmeBudgetaireId) {
      return res.status(400).json({ error: 'programmeBudgetaireId requis' })
    }

    // Check RPROG access
    if (req.user.profileId === 'RESPONSABLE_PROGRAMME') {
      const pb = await prisma.programmeBudgetaire.findUnique({ where: { id: programmeBudgetaireId } })
      if (!pb || pb.responsableId !== req.user.id) {
        return res.status(403).json({ error: 'Vous ne gérez pas ce programme' })
      }
    }

    // Get current aggregated data for this programme directly from its projects
    const projects = await prisma.project.findMany({
      where: { programmeBudgetaireId }
    })

    if (projects.length === 0) {
      return res.status(400).json({ error: 'Aucun projet dans ce programme.' })
    }

    const totalProjects = projects.length
    const physicalProgress = projects.reduce((sum, p) => sum + p.physicalProgress, 0) / totalProjects
    const financialProgress = projects.reduce((sum, p) => sum + p.financialProgress, 0) / totalProjects
    const budgetConsomme = projects.reduce((sum, p) => sum + p.consumed, 0)

    const now = new Date()
    const annee = now.getFullYear()
    const mois = now.getMonth() + 1 // 1-12

    // Upsert snapshot for current month
    const snapshot = await prisma.biSnapshot.upsert({
      where: {
        programmeBudgetaireId_annee_mois: {
          programmeBudgetaireId,
          annee,
          mois
        }
      },
      update: {
        physicalProgress,
        financialProgress,
        budgetConsomme,
        dateSnapshot: now
      },
      create: {
        programmeBudgetaireId,
        annee,
        mois,
        physicalProgress,
        financialProgress,
        budgetConsomme,
        dateSnapshot: now
      }
    })

    res.json(snapshot)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

export default router
