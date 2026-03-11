import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
// Load environment variables
dotenv.config();
// Import error handlers
import { notFoundHandler, errorHandler, setupUncaughtExceptionHandler } from './errors/errorHandler.js';
// Import services
import { initReminderService, stopReminderService } from './services/reminder.js';
// Import routes
import courseRoutes from './routes/courses.js';
import chapterRoutes from './routes/chapters.js';
import knowledgePointRoutes from './routes/knowledge-points.js';
import uploadRoutes from './routes/upload.js';
import studyRecordRoutes from './routes/study-records.js';
import timeMarkRoutes from './routes/time-marks.js';
import examTaskRoutes from './routes/exam-tasks.js';
import mistakeRoutes from './routes/mistakes.js';
import audioRoutes from './routes/audio.js';
import knowledgeRelationRoutes from './routes/knowledge-relations.js';
import aiRoutes from './routes/ai.js';
import statisticsRoutes from './routes/statistics.js';
import progressRoutes from './routes/progress.js';
import reviewRoutes from './routes/review.js';
import analysisRoutes from './routes/analysis.js';
import authRoutes from './routes/auth.js';
import recommendationRoutes from './routes/recommendation.js';
import reminderRoutes from './routes/reminder.js';
import exportRoutes from './routes/export.js';
import settingsRoutes from './routes/settings.js';
import questionRoutes from './routes/questions.js';
import examRoutes from './routes/exams.js';
import handwritingRoutes from './routes/handwriting.js';
import planningRoutes from './routes/planning.js';
// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
// ==================== Middleware ====================
// CORS configuration - 允许所有常见开发地址
const corsOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3003',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3003',
    // 允许所有局域网IP访问
    /^http:\/\/192\.168\.\d+\.\d+:5173$/,
    /^http:\/\/192\.168\.\d+\.\d+:3000$/,
];
app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'Content-Type']
}));
// Static file serving (for uploaded files)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Request logging middleware
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Time API - 获取当前时间
app.get('/api/time', (_req, res) => {
    const now = new Date();
    res.json({
        success: true,
        data: {
            timestamp: now.toISOString(),
            date: now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
            time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            dayOfWeek: now.toLocaleDateString('zh-CN', { weekday: 'long' }),
            timestampMs: now.getTime()
        }
    });
});
// ==================== API Routes ====================
app.use('/api/courses', courseRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/knowledge-points', knowledgePointRoutes);
app.use('/api/study-records', studyRecordRoutes);
app.use('/api/time-marks', timeMarkRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/exam-tasks', examTaskRoutes);
app.use('/api/mistakes', mistakeRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api', knowledgeRelationRoutes);
app.use('/api', aiRoutes);
app.use('/api', statisticsRoutes);
app.use('/api', progressRoutes);
app.use('/api', reviewRoutes);
app.use('/api', analysisRoutes);
app.use('/api', authRoutes);
app.use('/api', recommendationRoutes);
app.use('/api', reminderRoutes);
app.use('/api', exportRoutes);
app.use('/api', settingsRoutes);
app.use('/api', questionRoutes);
app.use('/api', handwritingRoutes);
app.use('/api', planningRoutes);
// ==================== Error Handlers ====================
// 404 handler - 使用新的错误处理中间件
app.use(notFoundHandler);
// Global error handler - 使用新的错误处理中间件
app.use(errorHandler);
// Setup uncaught exception handlers
setupUncaughtExceptionHandler();
// ==================== Start Server ====================
// 优雅退出处理
const gracefulShutdown = () => {
    console.log('\n[Server] 收到关闭信号，正在清理...');
    stopReminderService();
    process.exit(0);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
app.listen(PORT, () => {
    // 初始化定时提醒服务
    initReminderService();
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
║         ⏰ Reminder Service: Active                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
export default app;
//# sourceMappingURL=index.js.map