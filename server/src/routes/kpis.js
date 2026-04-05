import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// GET /api/kpis
router.get('/', authenticateToken, async (req, res) => {
  try {
    const kpis = await prisma.kPI.findMany({ orderBy: { code: 'asc' } })
    res.json(kpis.map(k => ({
      id: k.id,
      code: k.code,
      name: k.name,
      value: k.value,
      unit: k.unit,
      target: k.target,
      trend: k.trend
    })))
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/kpis/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { value, target, trend } = req.body
    const data = {}
    if (value !== undefined) data.value = parseFloat(value)
    if (target !== undefined) data.target = parseFloat(target)
    if (trend !== undefined) data.trend = trend

    const kpi = await prisma.kPI.update({
      where: { id: req.params.id },
      data
    })
    res.json(kpi)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
