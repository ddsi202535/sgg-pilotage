import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// GET /api/budget
router.get('/', authenticateToken, async (req, res) => {
  try {
    const byProgramme = await prisma.budget.findMany({ orderBy: { name: 'asc' } })
    const byMonth = await prisma.budgetMonth.findMany({ orderBy: [{ year: 'asc' }, { month: 'asc' }] })

    const total = byProgramme.reduce((sum, b) => sum + b.budget, 0)
    const engaged = byProgramme.reduce((sum, b) => sum + b.engaged, 0)
    const spent = byProgramme.reduce((sum, b) => sum + b.spent, 0)

    res.json({
      total,
      engaged,
      committed: Math.round(total * 0.5),
      spent,
      remaining: total - engaged,
      byProgramme: byProgramme.map(b => ({
        id: b.id,
        name: b.name,
        budget: b.budget,
        engaged: b.engaged,
        spent: b.spent
      })),
      byMonth: byMonth.map(m => ({
        id: m.id,
        month: m.month,
        budget: m.budget,
        spent: m.spent
      }))
    })
  } catch (error) {
    console.error('Get budget error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/budget/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { budget, engaged, spent } = req.body
    const data = {}
    if (budget !== undefined) data.budget = parseFloat(budget)
    if (engaged !== undefined) data.engaged = parseFloat(engaged)
    if (spent !== undefined) data.spent = parseFloat(spent)

    const updated = await prisma.budget.update({
      where: { id: req.params.id },
      data
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
