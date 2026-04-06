import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, '../uploads/livrables')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import riskRoutes from './routes/risks.js'
import budgetRoutes from './routes/budget.js'
import kpiRoutes from './routes/kpis.js'
import notificationRoutes from './routes/notifications.js'
import strategicRoutes from './routes/strategic.js'
import alertRulesRoutes from './routes/alertRules.js'
import usersRoutes from './routes/users.js'
import programmesRoutes from './routes/programmes.js'
import biRoutes from './routes/bi.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))

// Serve uploaded files
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath, stat) => {
    if (res.req && res.req.query && res.req.query.dl === '1') {
      const filename = res.req.query.name ? res.req.query.name : path.basename(filePath)
      const encodedFilename = encodeURIComponent(filename).replace(/['()]/g, escape).replace(/\*/g, '%2A')
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`)
    } else {
      res.setHeader('Content-Disposition', 'inline')
    }
  }
}))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/risks', riskRoutes)
app.use('/api/budget', budgetRoutes)
app.use('/api/kpis', kpiRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/strategic', strategicRoutes)
app.use('/api/alert-rules', alertRulesRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/programmes', programmesRoutes)
app.use('/api/bi', biRoutes)

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Erreur interne du serveur' })
})

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🚀 SGG Pilotage API Server        ║
  ║   Running on http://localhost:${PORT}  ║
  ╚══════════════════════════════════════╝
  `)
})
 