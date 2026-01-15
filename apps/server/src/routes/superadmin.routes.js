import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware.js';
import * as orgController from '../controllers/organization.controller.js';
import * as systemController from '../controllers/system.controller.js';
import * as aiStatsController from '../controllers/superadmin/ai-stats.controller.js';

const router = Router();

// All routes require super admin
router.use(authenticate);
router.use(requireSuperAdmin);

// ============================================
// Dashboard
// ============================================
router.get('/dashboard', orgController.getDashboardStats);

// ============================================
// Organizations CRUD
// ============================================
router.get('/organizations', orgController.getOrganizations);
router.get('/organizations/:id', orgController.getOrganization);
router.post('/organizations', orgController.createOrg);
router.put('/organizations/:id', orgController.updateOrganization);
router.patch('/organizations/:id/toggle-active', orgController.toggleActive);
router.delete('/organizations/:id', orgController.deleteOrganization);

// Organization Admin Password Reset
router.post('/organizations/:id/reset-password', orgController.resetAdminPassword);

// Organization Billing
router.get('/organizations/:id/billing', orgController.getOrgBilling);
router.post('/organizations/:id/billing', orgController.addBillingRecord);

// Impersonate Organization Admin
router.post('/organizations/:id/impersonate', orgController.impersonateAdmin);

// ============================================
// AI Statistics
// ============================================
router.get('/ai-stats', aiStatsController.getAIStats);
router.get('/ai-stats/organization/:organizationId', aiStatsController.getOrganizationAIStats);

// ============================================
// System Settings
// ============================================
router.get('/settings', systemController.getSettings);
router.put('/settings', systemController.updateSettings);
router.put('/settings/plans', systemController.updatePlans);
router.put('/settings/email', systemController.updateEmailConfig);
router.put('/settings/security', systemController.updateSecuritySettings);
router.put('/settings/maintenance', systemController.toggleMaintenanceMode);

// ============================================
// System Health & Monitoring
// ============================================
router.get('/system/health', systemController.getSystemHealth);
router.get('/system/stats', systemController.getSystemStats);
router.get('/system/logs', systemController.getErrorLogs);

// ============================================
// Activity Logs (Audit)
// ============================================
router.get('/activity-logs', systemController.getActivityLogs);
router.get('/activity-logs/user/:userId', systemController.getUserActivityLogs);
router.get('/activity-logs/organization/:orgId', systemController.getOrgActivityLogs);

// ============================================
// Announcements
// ============================================
router.get('/announcements', systemController.getAnnouncements);
router.post('/announcements', systemController.createAnnouncement);
router.put('/announcements/:id', systemController.updateAnnouncement);
router.delete('/announcements/:id', systemController.deleteAnnouncement);

// ============================================
// Sessions Management
// ============================================
router.get('/sessions', systemController.getActiveSessions);
router.delete('/sessions/:sessionId', systemController.terminateSession);

// ============================================
// Backup
// ============================================
router.post('/backup/trigger', systemController.triggerBackup);
router.get('/backup/history', systemController.getBackupHistory);

export default router;

