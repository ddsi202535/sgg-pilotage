import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth.js'
import { blockReadOnly } from '../middleware/authorize.js'

const router = Router()
const prisma = new PrismaClient()

// ─── GET /api/budget ──────────────────────────────────────
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
      spent,
      remaining: total - engaged,
      byProgramme: byProgramme.map(b => ({
        id: b.id,
        name: b.name,
        budget: b.budget,
        engaged: b.engaged,
        spent: b.spent,
        source: b.source || 'MDD'
      })),
      byMonth: byMonth.map(m => ({
        id: m.id,
        month: m.month,
        year: m.year,
        budget: m.budget,
        spent: m.spent
      }))
    })
  } catch (error) {
    console.error('Get budget error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── ALLOCATIONS (BY PROGRAMME/CATEGORY) ──────────────────

// POST /api/budget
router.post('/', authenticateToken, blockReadOnly, async (req, res) => {
  try {
    const { name, budget, engaged, spent, source } = req.body
    const entry = await prisma.budget.create({
      data: {
        name,
        budget: parseFloat(budget) || 0,
        engaged: parseFloat(engaged) || 0,
        spent: parseFloat(spent) || 0,
        source: source || 'MDD'
      }
    })
    res.status(201).json(entry)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/budget/:id
router.put('/:id', authenticateToken, blockReadOnly, async (req, res) => {
  try {
    const { name, budget, engaged, spent, source } = req.body
    const data = {}
    if (name !== undefined) data.name = name
    if (budget !== undefined) data.budget = parseFloat(budget)
    if (engaged !== undefined) data.engaged = parseFloat(engaged)
    if (spent !== undefined) data.spent = parseFloat(spent)
    if (source !== undefined) data.source = source

    const updated = await prisma.budget.update({
      where: { id: req.params.id },
      data
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/budget/:id
router.delete('/:id', authenticateToken, blockReadOnly, async (req, res) => {
  try {
    await prisma.budget.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ─── MONTHLY MONITORING ───────────────────────────────────

// POST /api/budget/month
router.post('/month', authenticateToken, blockReadOnly, async (req, res) => {
  try {
    const { month, year, budget, spent } = req.body
    const entry = await prisma.budgetMonth.create({
      data: {
        month,
        year: parseInt(year),
        budget: parseFloat(budget) || 0,
        spent: parseFloat(spent) || 0
      }
    })
    res.status(201).json(entry)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/budget/month/:id
router.put('/month/:id', authenticateToken, blockReadOnly, async (req, res) => {
  try {
    const { budget, spent } = req.body
    const data = {}
    if (budget !== undefined) data.budget = parseFloat(budget)
    if (spent !== undefined) data.spent = parseFloat(spent)

    const updated = await prisma.budgetMonth.update({
      where: { id: req.params.id },
      data
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/budget/month/:id
router.delete('/month/:id', authenticateToken, blockReadOnly, async (req, res) => {
  try {
    await prisma.budgetMonth.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
