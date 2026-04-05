import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth.js'
import { authorize, blockReadOnly, applyProjectScope } from '../middleware/authorize.js'

const router = Router()
const prisma = new PrismaClient()

// GET /api/projects — scoped by role
router.get('/', authenticateToken, applyProjectScope, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: req.projectFilter,
      include: {
        phases: { orderBy: { sortOrder: 'asc' } },
        milestones: { orderBy: { date: 'asc' } },
        deliverables: true,
        risks: { select: { id: true, code: true, title: true, level: true } },
        objectifs: {
          include: {
            cibles: {
              include: {
                mesures: { orderBy: { annee: 'desc' } }
              }
            }
          }
        },
        _count: { select: { comments: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Map to frontend format
    const mapped = projects.map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      type: p.type,
      programme: p.programme,
      status: p.status,
      physicalProgress: p.physicalProgress,
      financialProgress: p.financialProgress,
      budget: p.budget,
      consumed: p.consumed,
      startDate: p.startDate.toISOString().split('T')[0],
      endDate: p.endDate.toISOString().split('T')[0],
      directorate: p.directorate,
      manager: p.manager,
      description: p.description,
      phases: p.phases.map(ph => ({ id: ph.id, name: ph.name, status: ph.status, progress: ph.progress })),
      milestones: p.milestones.map(m => ({ id: m.id, name: m.name, date: m.date.toISOString().split('T')[0], status: m.status })),
      deliverables: p.deliverables,
      risks: p.risks.map(r => r.code),
      objectifs: p.objectifs.map(o => ({ ...o, indicateurs: o.cibles })),
      commentsCount: p._count.comments
    }))

    res.json(mapped)
  } catch (error) {
    console.error('Get projects error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/projects/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        phases: { orderBy: { sortOrder: 'asc' } },
        milestones: { orderBy: { date: 'asc' } },
        deliverables: true,
        documents: { orderBy: { createdAt: 'desc' } },
        risks: true,
        comments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        },
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
    })
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' })

    res.json({
      ...project,
      startDate: project.startDate.toISOString().split('T')[0],
      endDate: project.endDate.toISOString().split('T')[0],
      deliverables: project.deliverables,
      objectifs: (project.objectifs || []).map(o => ({ ...o, indicateurs: o.cibles }))
    })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/projects — requires creation rights
router.post('/', authenticateToken, blockReadOnly, authorize('edit_all', 'edit_project', 'edit_programme', 'edit_operational'), async (req, res) => {
  try {
    const { name, type, programme, programmeId, status, budget, startDate, endDate, directorate, manager, managerId, description, dependencies, phases, deliverables } = req.body

    // Generate next code
    const lastProject = await prisma.project.findFirst({ orderBy: { code: 'desc' } })
    const nextNum = lastProject ? parseInt(lastProject.code.replace('P', '')) + 1 : 1
    const code = `P${String(nextNum).padStart(3, '0')}`

    const project = await prisma.project.create({
      data: {
        code,
        name,
        type: type || 'informatique',
        programme: programme || '',
        programmeId: programmeId || null,
        status: status || 'planification',
        budget: parseFloat(budget) || 0,
        consumed: 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        directorate: directorate || '',
        manager: manager || '',
        managerId: managerId || null,
        description: description || '',
        dependencies: Array.isArray(dependencies) ? dependencies : [],
        phases: phases?.length ? {
          create: phases.map((p, i) => ({
            name: p.name,
            status: p.status || 'pending',
            progress: p.progress || 0,
            sortOrder: i + 1
          }))
        } : undefined,
        deliverables: deliverables?.length ? {
          create: deliverables.map(d => ({ name: typeof d === 'string' ? d : d.name }))
        } : undefined
      },
      include: {
        phases: { orderBy: { sortOrder: 'asc' } },
        milestones: true,
        deliverables: true
      }
    })

    res.status(201).json(project)
  } catch (error) {
    console.error('Create project error:', error)
    res.status(500).json({ error: 'Erreur serveur', details: error.message })
  }
})

// PUT /api/projects/:id — chef_proj can only update their own project progress
router.put('/:id', authenticateToken, blockReadOnly, authorize('edit_all', 'edit_project', 'edit_programme', 'edit_operational'), async (req, res) => {
  try {
    const { name, type, programme, programmeId, status, physicalProgress, financialProgress, budget, consumed, startDate, endDate, directorate, manager, managerId, description, dependencies } = req.body

    const data = {}
    if (name !== undefined) data.name = name
    if (type !== undefined) data.type = type
    if (programme !== undefined) data.programme = programme
    if (programmeId !== undefined) data.programmeId = programmeId
    if (status !== undefined) data.status = status
    if (physicalProgress !== undefined) data.physicalProgress = parseInt(physicalProgress)
    if (financialProgress !== undefined) data.financialProgress = parseInt(financialProgress)
    if (budget !== undefined) data.budget = parseFloat(budget)
    if (consumed !== undefined) data.consumed = parseFloat(consumed)
    if (startDate !== undefined) data.startDate = new Date(startDate)
    if (endDate !== undefined) data.endDate = new Date(endDate)
    if (directorate !== undefined) data.directorate = directorate
    if (manager !== undefined) data.manager = manager
    if (managerId !== undefined) data.managerId = managerId
    if (description !== undefined) data.description = description
    if (dependencies !== undefined) data.dependencies = Array.isArray(dependencies) ? dependencies : []

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data,
      include: {
        phases: { orderBy: { sortOrder: 'asc' } },
        milestones: true,
        deliverables: true
      }
    })

    res.json(project)
  } catch (error) {
    console.error('Update project error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/projects/:id — admin only
router.delete('/:id', authenticateToken, blockReadOnly, authorize('edit_all', 'admin'), async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (error) {
    console.error('Delete project error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/projects/:id/comments
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const comment = await prisma.comment.create({
      data: {
        content: req.body.content,
        projectId: req.params.id,
        userId: req.user.id
      },
      include: { user: { select: { name: true } }, project: { select: { name: true } } }
    })

    // Fetch other users to notify (simple approach: notify everyone else, or just PM if we had roles strictly defined)
    // Here we'll notify all users except the author for the sake of the professional collaborative scope
    const otherUsers = await prisma.user.findMany({
      where: { id: { not: req.user.id } },
      select: { id: true }
    })

    const notifs = otherUsers.map(u => ({
      userId: u.id,
      message: `${comment.user.name} a commenté sur le projet "${comment.project.name}": "${comment.content.substring(0, 30)}${comment.content.length > 30 ? '...' : ''}"`
    }))

    if (notifs.length > 0) {
      await prisma.notification.createMany({ data: notifs })
    }

    res.status(201).json(comment)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/projects/:id/comments
router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { projectId: req.params.id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    })
    res.json(comments)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Phases CRUD ─────────────────────────────────────────

// PUT /api/projects/:projectId/phases/:phaseId
router.put('/:projectId/phases/:phaseId', authenticateToken, async (req, res) => {
  try {
    const { name, status, progress } = req.body
    const data = {}
    if (name !== undefined) data.name = name
    if (status !== undefined) data.status = status
    if (progress !== undefined) data.progress = Math.min(100, Math.max(0, parseInt(progress)))
    
    // Auto-set status based on progress
    if (data.progress === 100) data.status = 'done'
    else if (data.progress > 0 && data.status !== 'done') data.status = 'in_progress'

    const phase = await prisma.phase.update({
      where: { id: req.params.phaseId },
      data
    })

    // Recalculate project physical progress
    const allPhases = await prisma.phase.findMany({ where: { projectId: req.params.projectId } })
    const avgProgress = Math.round(allPhases.reduce((sum, p) => sum + p.progress, 0) / allPhases.length)
    await prisma.project.update({
      where: { id: req.params.projectId },
      data: { physicalProgress: avgProgress }
    })

    res.json(phase)
  } catch (error) {
    console.error('Update phase error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/projects/:projectId/phases
router.post('/:projectId/phases', authenticateToken, async (req, res) => {
  try {
    const { name, status, progress } = req.body
    const maxOrder = await prisma.phase.findFirst({
      where: { projectId: req.params.projectId },
      orderBy: { sortOrder: 'desc' }
    })
    const phase = await prisma.phase.create({
      data: {
        name: name || 'Nouvelle phase',
        status: status || 'pending',
        progress: progress || 0,
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
        projectId: req.params.projectId
      }
    })
    res.status(201).json(phase)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/projects/:projectId/phases/:phaseId
router.delete('/:projectId/phases/:phaseId', authenticateToken, async (req, res) => {
  try {
    await prisma.phase.delete({ where: { id: req.params.phaseId } })

    // Recalculate project physical progress
    const allPhases = await prisma.phase.findMany({ where: { projectId: req.params.projectId } })
    const avgProgress = allPhases.length ? Math.round(allPhases.reduce((sum, p) => sum + p.progress, 0) / allPhases.length) : 0
    await prisma.project.update({
      where: { id: req.params.projectId },
      data: { physicalProgress: avgProgress }
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Milestones CRUD ─────────────────────────────────────

// POST /api/projects/:projectId/milestones
router.post('/:projectId/milestones', authenticateToken, async (req, res) => {
  try {
    const { name, date, status } = req.body
    const milestone = await prisma.milestone.create({
      data: {
        name: name || 'Nouveau jalon',
        date: new Date(date),
        status: status || 'pending',
        projectId: req.params.projectId
      }
    })
    res.status(201).json({ ...milestone, date: milestone.date.toISOString().split('T')[0] })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/projects/:projectId/milestones/:milestoneId
router.put('/:projectId/milestones/:milestoneId', authenticateToken, async (req, res) => {
  try {
    const { name, date, status } = req.body
    const data = {}
    if (name !== undefined) data.name = name
    if (date !== undefined) data.date = new Date(date)
    if (status !== undefined) data.status = status

    const milestone = await prisma.milestone.update({
      where: { id: req.params.milestoneId },
      data
    })
    res.json({ ...milestone, date: milestone.date.toISOString().split('T')[0] })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/projects/:projectId/milestones/:milestoneId
router.delete('/:projectId/milestones/:milestoneId', authenticateToken, async (req, res) => {
  try {
    await prisma.milestone.delete({ where: { id: req.params.milestoneId } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/livrables'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'deliv-' + uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB limit

const storageDocs = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/documents'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname))
  }
})
const uploadDocs = multer({ storage: storageDocs, limits: { fileSize: 50 * 1024 * 1024 } }) // 50MB limit for general docs

// ─── Deliverables CRUD ───────────────────────────────────

// POST /api/projects/:projectId/deliverables
router.post('/:projectId/deliverables', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { name } = req.body
    const file = req.file

    const data = {
      name: name || (file ? file.originalname : 'Livrable'),
      projectId: req.params.projectId
    }

    if (file) {
      data.fileUrl = `/uploads/livrables/${file.filename}`
      data.fileType = file.mimetype
      data.fileSize = file.size
      data.originalName = file.originalname
    }

    const deliverable = await prisma.deliverable.create({ data })
    res.status(201).json(deliverable)
  } catch (error) {
    console.error('Add deliverable error:', error)
    res.status(500).json({ error: 'Erreur serveur lors de l\'ajout du livrable' })
  }
})

// PATCH /api/projects/:projectId/deliverables/:delId — attach a file to existing deliverable
router.patch('/:projectId/deliverables/:delId/attach', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const file = req.file
    if (!file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' })
    }
    const deliverable = await prisma.deliverable.update({
      where: { id: req.params.delId },
      data: {
        fileUrl: `/uploads/livrables/${file.filename}`,
        fileType: file.mimetype,
        fileSize: file.size,
        originalName: file.originalname
      }
    })
    res.json(deliverable)
  } catch (error) {
    console.error('Attach deliverable file error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/projects/:projectId/deliverables/:delId
router.delete('/:projectId/deliverables/:delId', authenticateToken, async (req, res) => {
  try {
    await prisma.deliverable.delete({ where: { id: req.params.delId } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Documents CRUD (Espace Collaboratif) ────────────────

// POST /api/projects/:projectId/documents
router.post('/:projectId/documents', authenticateToken, uploadDocs.single('file'), async (req, res) => {
  try {
    const file = req.file
    if (!file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' })
    }

    const document = await prisma.document.create({
      data: {
        name: file.originalname,
        originalName: file.originalname,
        fileUrl: `/uploads/documents/${file.filename}`,
        fileSize: file.size,
        fileType: file.mimetype,
        projectId: req.params.projectId
      }
    })
    res.status(201).json(document)
  } catch (error) {
    console.error('Add document error:', error)
    res.status(500).json({ error: 'Erreur serveur lors de l\'ajout du document' })
  }
})

// DELETE /api/projects/:projectId/documents/:docId
router.delete('/:projectId/documents/:docId', authenticateToken, async (req, res) => {
  try {
    await prisma.document.delete({ where: { id: req.params.docId } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Progress update (financial) ─────────────────────────

// PUT /api/projects/:id/progress
router.put('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { physicalProgress, financialProgress, consumed } = req.body
    const data = {}
    if (physicalProgress !== undefined) data.physicalProgress = Math.min(100, Math.max(0, parseInt(physicalProgress)))
    if (financialProgress !== undefined) data.financialProgress = Math.min(100, Math.max(0, parseInt(financialProgress)))
    if (consumed !== undefined) data.consumed = parseFloat(consumed)

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data
    })
    res.json(project)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router

