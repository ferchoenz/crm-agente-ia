import { Router } from 'express';
import authRoutes from './auth.routes.js';
import superadminRoutes from './superadmin.routes.js';
import adminRoutes from './admin.routes.js';
import webhookRoutes from './webhook.routes.js';
import integrationsRoutes from './integrations.routes.js';
import remindersRoutes from './reminders.routes.js';
import appointmentsRoutes from './appointments.routes.js';
import { generalLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Apply general rate limiting to all routes
router.use(generalLimiter);

// Public routes
router.use('/auth', authRoutes);

// Webhook routes (no auth, verified by signature)
router.use('/webhooks', webhookRoutes);

// Protected routes
router.use('/superadmin', superadminRoutes);
router.use('/admin', adminRoutes);
router.use('/integrations', integrationsRoutes);
router.use('/reminders', remindersRoutes);
router.use('/appointments', appointmentsRoutes);

// API info
router.get('/', (req, res) => {
    res.json({
        name: 'CRM Agente IA API',
        version: '1.0.0',
        status: 'running'
    });
});

export default router;
