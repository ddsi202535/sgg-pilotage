import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// ─── Compare helper ───────────────────────────────────────
function compare(val, operator, threshold) {
  switch (operator) {
    case 'lt':  return val < threshold
    case 'lte': return val <= threshold
    case 'gt':  return val > threshold
    case 'gte': return val >= threshold
    case 'eq':  return val === threshold
    default: return false
  }
}

// ─── EVALUATE — MUST be BEFORE /:id ──────────────────────
router.get('/evaluate', authenticateToken, async (req, res) => {
  try {
    const rules = await prisma.alertRule.findMany({ where: { isActive: true } })
    const today = new Date()
    const CURRENT_YEAR = today.getFullYear()

    // Load all projects with milestones and objectifs/indicateurs/mesures
    const projects = await prisma.project.findMany({
      include: {
        milestones: true,
        objectifs: {
          include: {
            cibles: {
              include: {
                mesures: { where: { annee: CURRENT_YEAR } }
              }
            }
          }
        }
      }
    })

    const triggered = []

    for (const rule of rules) {
      const targetProjects = rule.projectId
        ? projects.filter(p => p.id === rule.projectId)
        : projects

      // ── project_delay : physicalProgress < threshold ────
      if (rule.type === 'project_delay') {
        for (const p of targetProjects) {
          if (p.status === 'termine') continue
          if (compare(p.physicalProgress, rule.operator, rule.threshold)) {
            const endDate = new Date(p.endDate)
            const overdue = endDate < today
            triggered.push({
              ruleId: rule.id,
              label: rule.label,
              severity: rule.severity,
              type: rule.type,
              projectId: p.id,
              projectName: p.name,
              current: p.physicalProgress,
              threshold: rule.threshold,
              overdue,
              message: `[${p.code}] ${p.name} — Avancement ${p.physicalProgress}%${overdue ? ' ⚠ Délai dépassé' : ''} (seuil: ${rule.operator} ${rule.threshold}%)`
            })
          }
        }
      }

      // ── budget_overrun : (consumed/budget)*100 >= threshold ──
      if (rule.type === 'budget_overrun') {
        for (const p of targetProjects) {
          if (p.budget > 0) {
            const consumedPct = (p.consumed / p.budget) * 100
            if (compare(consumedPct, rule.operator, rule.threshold)) {
              triggered.push({
                ruleId: rule.id,
                label: rule.label,
                severity: rule.severity,
                type: rule.type,
                projectId: p.id,
                projectName: p.name,
                current: Math.round(consumedPct),
                threshold: rule.threshold,
                message: `[${p.code}] ${p.name} — Consommation budgétaire ${Math.round(consumedPct)}% (seuil: ${rule.operator} ${rule.threshold}%)`
              })
            }
          }
        }
      }

      // ── milestone_late : nb jalons en retard >= threshold ──
      if (rule.type === 'milestone_late') {
        for (const p of targetProjects) {
          const lateCount = p.milestones.filter(m =>
            m.status !== 'done' && new Date(m.date) < today
          ).length
          if (compare(lateCount, rule.operator, rule.threshold)) {
            triggered.push({
              ruleId: rule.id,
              label: rule.label,
              severity: rule.severity,
              type: rule.type,
              projectId: p.id,
              projectName: p.name,
              current: lateCount,
              threshold: rule.threshold,
              message: `[${p.code}] ${p.name} — ${lateCount} jalon(s) en retard (seuil: ${rule.operator} ${rule.threshold})`
            })
          }
        }
      }

      // ── kpi_gap : taux réalisation indicateur LOLF < threshold ──
      if (rule.type === 'kpi_gap') {
        // Traverse all projects → objectifs → indicateurs → mesures CURRENT_YEAR
        for (const p of targetProjects) {
          for (const obj of (p.objectifs || [])) {
            for (const ind of (obj.cibles || [])) {
              for (const mesure of (ind.mesures || [])) {
                if (mesure.valeurCible > 0) {
                  const achievement = ((mesure.valeurReel || 0) / mesure.valeurCible) * 100
                  if (compare(achievement, rule.operator, rule.threshold)) {
                    triggered.push({
                      ruleId: rule.id,
                      label: rule.label,
                      severity: rule.severity,
                      type: rule.type,
                      projectId: p.id,
                      projectName: p.name,
                      indicateurLabel: ind.label,
                      current: Math.round(achievement),
                      threshold: rule.threshold,
                      message: `[${p.code}] Indicateur "${ind.label}" — ${Math.round(achievement)}% de la cible ${CURRENT_YEAR} (seuil: ${rule.operator} ${rule.threshold}%)`
                    })
                  }
                }
              }
            }
          }
        }
      }

      // ── risk_critical : nb risques critiques actifs >= threshold ──
      if (rule.type === 'risk_critical') {
        const criticalCount = await prisma.risk.count({
          where: { level: { in: ['critique', 'élevé'] }, status: 'actif' }
        })
        if (compare(criticalCount, rule.operator, rule.threshold)) {
          triggered.push({
            ruleId: rule.id,
            label: rule.label,
            severity: rule.severity,
            type: rule.type,
            current: criticalCount,
            threshold: rule.threshold,
            message: `${criticalCount} risque(s) critique(s)/élevé(s) actif(s) (seuil: ${rule.operator} ${rule.threshold})`
          })
        }
      }

      // ── overdue_project : projets dont la date est dépassée & non terminés ──
      if (rule.type === 'overdue_project') {
        const overdueList = targetProjects.filter(p => {
          if (p.status === 'termine') return false
          return new Date(p.endDate) < today
        })
        if (compare(overdueList.length, rule.operator, rule.threshold)) {
          overdueList.forEach(p => {
            triggered.push({
              ruleId: rule.id,
              label: rule.label,
              severity: rule.severity,
              type: rule.type,
              projectId: p.id,
              projectName: p.name,
              current: p.physicalProgress,
              threshold: rule.threshold,
              message: `[${p.code}] ${p.name} — Date de fin dépassée (${p.endDate}), avancement: ${p.physicalProgress}%`
            })
          })
        }
      }
    }

    res.json(triggered)
  } catch (err) {
    console.error('Alert evaluate error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ─── GET triggered (persisted) alerts ────────────────────
router.get('/triggered', authenticateToken, async (req, res) => {
  try {
    const alerts = await prisma.alertTriggered.findMany({
      where: { isRead: false },
      include: { rule: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    res.json(alerts)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── GET all rules ───────────────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rules = await prisma.alertRule.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(rules)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── CREATE rule ─────────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { label, type, operator, threshold, severity, isActive, projectId, kpiId } = req.body
    const rule = await prisma.alertRule.create({
      data: {
        label, type, operator,
        threshold: parseFloat(threshold),
        severity: severity || 'warning',
        isActive: isActive !== false,
        projectId: projectId || null,
        kpiId: kpiId || null
      }
    })
    res.status(201).json(rule)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── UPDATE rule ─────────────────────────────────────────
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { label, type, operator, threshold, severity, isActive, projectId, kpiId } = req.body
    const data = {}
    if (label !== undefined) data.label = label
    if (type !== undefined) data.type = type
    if (operator !== undefined) data.operator = operator
    if (threshold !== undefined) data.threshold = parseFloat(threshold)
    if (severity !== undefined) data.severity = severity
    if (isActive !== undefined) data.isActive = isActive
    if (projectId !== undefined) data.projectId = projectId || null
    if (kpiId !== undefined) data.kpiId = kpiId || null
    const rule = await prisma.alertRule.update({ where: { id: req.params.id }, data })
    res.json(rule)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── DELETE rule ─────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.alertRule.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
