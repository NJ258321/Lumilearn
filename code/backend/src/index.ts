import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config()

// Import routes
import courseRoutes from './routes/courses.js'
import chapterRoutes from './routes/chapters.js'
import knowledgePointRoutes from './routes/knowledge-points.js'
import uploadRoutes from './routes/upload.js'
import studyRecordRoutes from './routes/study-records.js'
import timeMarkRoutes from './routes/time-marks.js'
import examTaskRoutes from './routes/exam-tasks.js'
import mistakeRoutes from './routes/mistakes.js'
import audioRoutes from './routes/audio.js'
import knowledgeRelationRoutes from './routes/knowledge-relations.js'
import aiRoutes from './routes/ai.js'

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 3000

// ==================== Middleware ====================

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Static file serving (for uploaded files)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Body parser middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// ==================== API Routes ====================

app.use('/api/courses', courseRoutes)
app.use('/api/chapters', chapterRoutes)
app.use('/api/knowledge-points', knowledgePointRoutes)
app.use('/api/study-records', studyRecordRoutes)
app.use('/api/time-marks', timeMarkRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/exam-tasks', examTaskRoutes)
app.use('/api/mistakes', mistakeRoutes)
app.use('/api/audio', audioRoutes)
app.use('/api', knowledgeRelationRoutes)
app.use('/api', aiRoutes)

// ==================== Error Handlers ====================

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  })
})

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  })
})

// ==================== Start Server ====================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         🚀 LumiTrace AI Backend Server Started             ║
║                                                            ║
║         📍 Port: ${PORT.toString().padEnd(40)} ║
║         🌍 Environment: ${(process.env.NODE_ENV || 'development').padEnd(24)} ║
║                                                            ║
║         📊 API Health: http://localhost:${PORT}/health            ║
║         📁 Uploads: http://localhost:${PORT}/uploads            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `)
})

export default app
