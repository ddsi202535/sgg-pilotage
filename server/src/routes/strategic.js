import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth.js'
import { ROLE_PERMISSIONS } from '../middleware/authorize.js'

const router = Router()
const prisma = new PrismaClient()

// Helper: check if user can edit a specific programme's strategic data
function canEditProgramme(user, programmeBudgetaireId) {
  const profileId = user.profileId || 'AUDIT'
  const perms = ROLE_PERMISSIONS[profileId] || []

  // SGG can edit everything
  if (perms.includes('edit_all') || perms.includes('admin')) return true

  // RPROG can edit only their own programme
  if (profileId === 'RESPONSABLE_PROGRAMME' && programmeBudgetaireId) {
    // Check ownership
    return true // Placeholder if logic is checked in route
  }

  return false
}

// ─── GET full tree ───────────────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const axes = await prisma.axeStrategique.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        programmes: {
          include: {
            projects: {
              include: {
                objectifs: {
                  include: {
                    cibles: {
                      include: {
                        mesures: { orderBy: { annee: 'desc' } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    // Enrich with stats and responsable info
    const enriched = await Promise.all(axes.map(async axe => ({
      ...axe,
      programmes: await Promise.all((axe.programmes || []).map(async pb => {
        let responsable = null
        if (pb.responsableId) {
          responsable = await prisma.user.findUnique({
            where: { id: pb.responsableId },
            select: { id: true, name: true, email: true }
          })
        }

        const projects = pb.projects || []
        const stats = {
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'en_cours').length,
          avgProgress: projects.length
            ? Math.round(projects.reduce((s, p) => s + p.physicalProgress, 0) / projects.length)
            : 0,
          totalBudget: projects.reduce((s, p) => s + p.budget, 0),
          totalConsumed: projects.reduce((s, p) => s + p.consumed, 0)
        }
        stats.budgetProgress = stats.totalBudget > 0
          ? Math.round((stats.totalConsumed / stats.totalBudget) * 100) : 0

        const mappedProjects = projects.map(p => ({
          ...p,
          objectifs: (p.objectifs || []).map(o => ({ ...o, indicateurs: o.cibles || [] }))
        }))

        return {
          ...pb,
          projects: mappedProjects,
          responsable,
          stats,
          budgetaire: { id: pb.id, code: pb.code, label: pb.label, budget: pb.budget }
        }
      }))
    })))

    res.json(enriched)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Axes CRUD ───────────────────────────────────────────
router.post('/axes', authenticateToken, async (req, res) => {
  try {
    const { code, label, description, sortOrder } = req.body
    const axe = await prisma.axeStrategique.create({ data: { code, label, description, sortOrder: sortOrder || 0 } })
    res.status(201).json(axe)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/axes/:id', authenticateToken, async (req, res) => {
  try {
    const { code, label, description, sortOrder } = req.body
    const axe = await prisma.axeStrategique.update({ where: { id: req.params.id }, data: { code, label, description, sortOrder } })
    res.json(axe)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/axes/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.axeStrategique.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Link Programme to Axe ───────────────────────────────
router.put('/programmes/:id/link-axe', authenticateToken, async (req, res) => {
  try {
    const { axeId } = req.body
    const p = await prisma.programmeBudgetaire.update({
      where: { id: req.params.id },
      data: { axeId: axeId || null }
    })
    res.json(p)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Objectifs CRUD (Linked to Project) ──────────────────
router.post('/objectifs', authenticateToken, async (req, res) => {
  try {
    const { label, projectId } = req.body
    const o = await prisma.objectifStrategique.create({ data: { label, projectId } })
    res.status(201).json(o)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/objectifs/:id', authenticateToken, async (req, res) => {
  try {
    const { label } = req.body
    const o = await prisma.objectifStrategique.update({ where: { id: req.params.id }, data: { label } })
    res.json(o)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/objectifs/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.objectifStrategique.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Indicateurs CRUD ────────────────────────────────────
router.post('/indicateurs', authenticateToken, async (req, res) => {
  try {
    const { label, unite, objectifId } = req.body
    const ind = await prisma.indicateur.create({ data: { label, unite, objectifId } })
    res.status(201).json(ind)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/indicateurs/:id', authenticateToken, async (req, res) => {
  try {
    const { label, unite } = req.body
    const data = {}
    if (label !== undefined) data.label = label
    if (unite !== undefined) data.unite = unite
    const ind = await prisma.indicateur.update({ where: { id: req.params.id }, data })
    res.json(ind)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/indicateurs/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.indicateur.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Mesures Annuelles CRUD ─────────────────────────────
router.post('/mesures', authenticateToken, async (req, res) => {
  try {
    const { annee, valeurCible, valeurReel, indicateurId } = req.body
    const m = await prisma.mesureAnnuelle.create({
      data: {
        annee: parseInt(annee) || new Date().getFullYear(),
        valeurCible: valeurCible ? parseFloat(valeurCible) : null,
        valeurReel: valeurReel ? parseFloat(valeurReel) : null,
        indicateurId
      }
    })
    res.status(201).json(m)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/mesures/:id', authenticateToken, async (req, res) => {
  try {
    const { annee, valeurCible, valeurReel } = req.body
    const data = {}
    if (annee !== undefined) data.annee = parseInt(annee)
    if (valeurCible !== undefined) data.valeurCible = parseFloat(valeurCible)
    if (valeurReel !== undefined) data.valeurReel = parseFloat(valeurReel)
    
    const m = await prisma.mesureAnnuelle.update({ where: { id: req.params.id }, data })
    res.json(m)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/mesures/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.mesureAnnuelle.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── GET available ProgrammeBudgetaire for linking ───────
router.get('/programmes-budgetaires', authenticateToken, async (req, res) => {
  try {
    const pbs = await prisma.programmeBudgetaire.findMany({
      select: { id: true, code: true, label: true, axeId: true },
      orderBy: { code: 'asc' }
    })
    res.json(pbs)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
