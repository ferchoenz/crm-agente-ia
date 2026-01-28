import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import routes from './routes/index.js';
import { initializeSuperAdmin } from './services/setup.service.js';
import { initializeSocket, getIO } from './services/socket.service.js';
import { startReminderProcessor, runAutoFollowUpsForAllOrgs } from './services/reminder.service.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with auth
const io = initializeSocket(httpServer);

// Make io accessible to routes
app.set('io', io);

// Middleware
// Trust first proxy (nginx/load balancer) - required for express-rate-limit behind reverse proxy
app.set('trust proxy', 1);
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'https://agentify-chat.com',
  'https://www.agentify-chat.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public config (no auth needed)
app.get('/api/config/public', (req, res) => {
  res.json({
    facebookAppId: process.env.FACEBOOK_APP_ID || '',
    appName: 'Agentify Chat'
  });
});

// API Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Initialize super admin if not exists
    await initializeSuperAdmin();

    // Start reminder processor (checks every 60 seconds)
    startReminderProcessor(60000);

    // Start auto follow-up job (runs every hour)
    setInterval(async () => {
      try {
        await runAutoFollowUpsForAllOrgs();
      } catch (error) {
        logger.error('Auto follow-up job error:', error);
      }
    }, 60 * 60 * 1000); // Every hour

    // Run once on startup after 2 minutes
    setTimeout(() => runAutoFollowUpsForAllOrgs(), 2 * 60 * 1000);
    logger.info('✅ Auto follow-up job scheduled (runs every hour)');

    // Start token refresh job (runs daily at 3 AM)
    const scheduleTokenRefresh = async () => {
      try {
        const { runTokenRefreshJob } = await import('./services/integrations/token-refresh.service.js');
        await runTokenRefreshJob();
      } catch (error) {
        logger.error('Token refresh job error:', error);
      }
    };

    // Run daily (24 hours)
    setInterval(scheduleTokenRefresh, 24 * 60 * 60 * 1000);

    // Run once on startup after 5 minutes
    setTimeout(scheduleTokenRefresh, 5 * 60 * 1000);
    logger.info('✅ Token refresh job scheduled (runs daily)');

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, getIO };
