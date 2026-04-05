import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// GET /api/risks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const risks = await prisma.risk.findMany({
      include: { project: { select: { id: true, code: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    })

    const mapped = risks.map(r => ({
      id: r.id,
      code: r.code,
      title: r.title,
      description: r.description,
      category: r.category,
      probability: r.probability,
      impact: r.impact,
      level: r.level,
      owner: r.owner,
      mitigation: r.mitigation,
      mitigationProgress: r.mitigationProgress,
      status: r.status,
      programme: r.programme,
      projectId: r.project?.id || null,
      projectName: r.project?.name || null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }))

    res.json(mapped)
  } catch (error) {
    console.error('Get risks error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/risks
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, probability, impact, level, owner, mitigation, status, programme, projectId } = req.body

    const lastRisk = await prisma.risk.findFirst({ orderBy: { code: 'desc' } })
    const nextNum = lastRisk ? parseInt(lastRisk.code.replace('R', '')) + 1 : 1
    const code = `R${String(nextNum).padStart(3, '0')}`

    const calcLevel = (p, i) => {
      const score = p * i
      if (score >= 12) return 'élevé'
      if (score >= 6) return 'moyen'
      return 'faible'
    }

    const risk = await prisma.risk.create({
      data: {
        code,
        title,
        description: description || '',
        category: category || 'technique',
        probability: parseInt(probability) || 1,
        impact: parseInt(impact) || 1,
        level: level || calcLevel(parseInt(probability) || 1, parseInt(impact) || 1),
        owner: owner || '',
        mitigation: mitigation || '',
        mitigationProgress: 0,
        status: status || 'actif',
        programme: programme || '',
        projectId: projectId || null
      },
      include: { project: { select: { id: true, code: true, name: true } } }
    })

    res.status(201).json(risk)
  } catch (error) {
    console.error('Create risk error:', error)
    res.status(500).json({ error: 'Erreur serveur', details: error.message })
  }
})

// PUT /api/risks/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, probability, impact, level, owner, mitigation, mitigationProgress, status, programme, projectId } = req.body

    const data = {}
    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description
    if (category !== undefined) data.category = category
    if (probability !== undefined) data.probability = parseInt(probability)
    if (impact !== undefined) data.impact = parseInt(impact)
    if (level !== undefined) data.level = level
    if (owner !== undefined) data.owner = owner
    if (mitigation !== undefined) data.mitigation = mitigation
    if (mitigationProgress !== undefined) data.mitigationProgress = parseInt(mitigationProgress)
    if (status !== undefined) data.status = status
    if (programme !== undefined) data.programme = programme
    if (projectId !== undefined) data.projectId = projectId || null

    // Auto-calculate level if prob/impact changed
    if (data.probability !== undefined || data.impact !== undefined) {
      const existing = await prisma.risk.findUnique({ where: { id: req.params.id } })
      const p = data.probability ?? existing.probability
      const i = data.impact ?? existing.impact
      const score = p * i
      data.level = score >= 12 ? 'élevé' : score >= 6 ? 'moyen' : 'faible'
    }

    const risk = await prisma.risk.update({
      where: { id: req.params.id },
      data,
      include: { project: { select: { id: true, code: true, name: true } } }
    })

    res.json(risk)
  } catch (error) {
    console.error('Update risk error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/risks/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.risk.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (error) {
    console.error('Delete risk error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
