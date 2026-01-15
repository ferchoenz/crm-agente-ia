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
import { startReminderProcessor } from './services/reminder.service.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with auth
const io = initializeSocket(httpServer);

// Make io accessible to routes
app.set('io', io);

// Middleware
// Middleware
app.set('trust proxy', 1); // Trust first proxy
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  'https://agentify-chat.com',
  'https://www.agentify-chat.com',
  'https://api.agentify-chat.com',
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_URL
].filter(Boolean).map(url => url.replace(/\/$/, ''));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked for origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes
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
