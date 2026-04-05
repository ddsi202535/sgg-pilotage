import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth.js'
import { authorize, blockReadOnly } from '../middleware/authorize.js'

const router = Router()
const prisma = new PrismaClient()

// ─── GET all programmes with responsable and stats ───
router.get('/', authenticateToken, async (req, res) => {
  try {
    const programmes = await prisma.programmeBudgetaire.findMany({
      include: {
        projects: {
          select: {
            id: true, code: true, name: true, status: true,
            physicalProgress: true, financialProgress: true,
            budget: true, consumed: true, manager: true, managerId: true
          }
        }
      },
      orderBy: { code: 'asc' }
    })

    // Enrich with responsable user if set
    const enriched = await Promise.all(programmes.map(async p => {
      let responsable = null
      if (p.responsableId) {
        responsable = await prisma.user.findUnique({
          where: { id: p.responsableId },
          select: { id: true, name: true, email: true, profileId: true }
        })
      }

      const totalBudget = p.projects.reduce((s, pr) => s + pr.budget, 0)
      const totalConsumed = p.projects.reduce((s, pr) => s + pr.consumed, 0)
      const avgProgress = p.projects.length
        ? Math.round(p.projects.reduce((s, pr) => s + pr.physicalProgress, 0) / p.projects.length)
        : 0

      return {
        ...p,
        responsable,
        stats: {
          totalProjects: p.projects.length,
          activeProjects: p.projects.filter(pr => pr.status === 'en_cours').length,
          avgProgress,
          totalBudget,
          totalConsumed,
          budgetProgress: totalBudget > 0 ? Math.round((totalConsumed / totalBudget) * 100) : 0
        }
      }
    }))

    res.json(enriched)
  } catch (err) {
    console.error('Get programmes error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ─── GET single programme ───
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const programme = await prisma.programmeBudgetaire.findUnique({
      where: { id: req.params.id },
      include: {
        projects: {
          include: {
            milestones: { orderBy: { date: 'asc' } },
            phases: { orderBy: { sortOrder: 'asc' } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    if (!programme) return res.status(404).json({ error: 'Programme non trouvé' })

    let responsable = null
    if (programme.responsableId) {
      responsable = await prisma.user.findUnique({
        where: { id: programme.responsableId },
        select: { id: true, name: true, email: true, profileId: true }
      })
    }
    res.json({ ...programme, responsable })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── POST create programme (SGG admin only) ───
router.post('/', authenticateToken, authorize('admin', 'edit_all'), async (req, res) => {
  try {
    const { code, label, description, budget, responsableId } = req.body
    if (!code || !label) return res.status(400).json({ error: 'code et label requis' })

    const programme = await prisma.programmeBudgetaire.create({
      data: { code, label, description: description || '', budget: parseFloat(budget) || 0, responsableId: responsableId || null }
    })
    res.status(201).json(programme)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── PUT update programme ───
router.put('/:id', authenticateToken, authorize('admin', 'edit_all'), async (req, res) => {
  try {
    const { code, label, description, budget, responsableId } = req.body
    const data = {}
    if (code !== undefined) data.code = code
    if (label !== undefined) data.label = label
    if (description !== undefined) data.description = description
    if (budget !== undefined) data.budget = parseFloat(budget) || 0
    if (responsableId !== undefined) data.responsableId = responsableId || null

    const programme = await prisma.programmeBudgetaire.update({
      where: { id: req.params.id },
      data
    })
    res.json(programme)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── DELETE programme (SGG admin only) ───
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    // Detach projects first
    await prisma.project.updateMany({ where: { programmeId: req.params.id }, data: { programmeId: null } })
    await prisma.programmeBudgetaire.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── GET users who can be responsable (RESPONSABLE_PROGRAMME) ───
router.get('/meta/responsables', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { profileId: 'RESPONSABLE_PROGRAMME' },
      select: { id: true, name: true, email: true }
    })
    res.json(users)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── GET chefs de projet (CHEF_PROJET) ───
router.get('/meta/chefs-projet', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { profileId: 'CHEF_PROJET' },
      select: { id: true, name: true, email: true }
    })
    res.json(users)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
