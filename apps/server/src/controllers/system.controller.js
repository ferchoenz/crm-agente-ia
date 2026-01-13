import os from 'os';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';
import {
    Organization,
    User,
    Channel,
    Customer,
    Conversation,
    ActivityLog,
    Announcement,
    SystemSettings
} from '../models/index.js';

/**
 * Get system settings
 */
export const getSettings = asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getSettings();
    res.json({ settings });
});

/**
 * Update general settings
 */
export const updateSettings = asyncHandler(async (req, res) => {
    const updates = req.body;
    const settings = await SystemSettings.getSettings();

    Object.assign(settings, updates);
    await settings.save();

    await ActivityLog.log({
        actor: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        targetType: 'system',
        action: 'settings_change',
        changes: { after: updates },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    });

    res.json({ settings });
});

/**
 * Update plans configuration
 */
export const updatePlans = asyncHandler(async (req, res) => {
    const { plans } = req.body;
    const settings = await SystemSettings.getSettings();

    settings.plans = { ...settings.plans, ...plans };
    await settings.save();

    await ActivityLog.log({
        actor: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        targetType: 'system',
        action: 'settings_change',
        description: 'Updated plan configurations',
        ipAddress: req.ip
    });

    res.json({ plans: settings.plans });
});

/**
 * Update email configuration
 */
export const updateEmailConfig = asyncHandler(async (req, res) => {
    const emailConfig = req.body;
    const settings = await SystemSettings.getSettings();

    settings.email = { ...settings.email, ...emailConfig };
    await settings.save();

    res.json({ email: settings.email });
});

/**
 * Update security settings
 */
export const updateSecuritySettings = asyncHandler(async (req, res) => {
    const securityConfig = req.body;
    const settings = await SystemSettings.getSettings();

    settings.security = { ...settings.security, ...securityConfig };
    await settings.save();

    res.json({ security: settings.security });
});

/**
 * Toggle maintenance mode
 */
export const toggleMaintenanceMode = asyncHandler(async (req, res) => {
    const { enabled, message, scheduledEnd } = req.body;
    const settings = await SystemSettings.getSettings();

    settings.maintenanceMode = {
        ...settings.maintenanceMode,
        enabled: enabled !== undefined ? enabled : !settings.maintenanceMode.enabled,
        message: message || settings.maintenanceMode.message,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null
    };

    await settings.save();

    await ActivityLog.log({
        actor: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        targetType: 'system',
        action: settings.maintenanceMode.enabled ? 'activate' : 'deactivate',
        description: `Maintenance mode ${settings.maintenanceMode.enabled ? 'enabled' : 'disabled'}`,
        ipAddress: req.ip
    });

    res.json({ maintenanceMode: settings.maintenanceMode });
});

/**
 * Get system health metrics
 */
export const getSystemHealth = asyncHandler(async (req, res) => {
    const startTime = Date.now();

    // MongoDB health check
    let dbStatus = 'healthy';
    let dbLatency = 0;
    try {
        const pingStart = Date.now();
        await mongoose.connection.db.admin().ping();
        dbLatency = Date.now() - pingStart;
    } catch (error) {
        dbStatus = 'unhealthy';
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    // CPU info
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    // MongoDB stats
    let dbStats = {};
    try {
        dbStats = await mongoose.connection.db.stats();
    } catch (error) {
        dbStats = { error: 'Could not fetch DB stats' };
    }

    // Uptime
    const processUptime = process.uptime();
    const systemUptime = os.uptime();

    res.json({
        status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        latency: Date.now() - startTime,

        server: {
            uptime: processUptime,
            uptimeFormatted: formatUptime(processUptime),
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        },

        memory: {
            used: memUsage.heapUsed,
            total: memUsage.heapTotal,
            external: memUsage.external,
            rss: memUsage.rss,
            usedPercentage: ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2),
            system: {
                total: totalMem,
                free: freeMem,
                usedPercentage: (((totalMem - freeMem) / totalMem) * 100).toFixed(2)
            }
        },

        cpu: {
            cores: cpus.length,
            model: cpus[0]?.model,
            loadAverage: {
                '1m': loadAvg[0]?.toFixed(2),
                '5m': loadAvg[1]?.toFixed(2),
                '15m': loadAvg[2]?.toFixed(2)
            }
        },

        database: {
            status: dbStatus,
            latency: dbLatency,
            name: mongoose.connection.name,
            host: mongoose.connection.host,
            collections: dbStats.collections,
            documents: dbStats.objects,
            dataSize: dbStats.dataSize,
            storageSize: dbStats.storageSize,
            indexes: dbStats.indexes
        },

        system: {
            uptime: systemUptime,
            uptimeFormatted: formatUptime(systemUptime),
            hostname: os.hostname(),
            platform: os.platform(),
            release: os.release()
        }
    });
});

/**
 * Get system statistics (counts, etc.)
 */
export const getSystemStats = asyncHandler(async (req, res) => {
    const [
        totalOrgs,
        activeOrgs,
        totalUsers,
        totalCustomers,
        totalConversations,
        todayConversations,
        todayMessages
    ] = await Promise.all([
        Organization.countDocuments(),
        Organization.countDocuments({ active: true }),
        User.countDocuments(),
        Customer.countDocuments(),
        Conversation.countDocuments(),
        Conversation.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }),
        mongoose.connection.db.collection('messages').countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }).catch(() => 0)
    ]);

    res.json({
        organizations: { total: totalOrgs, active: activeOrgs },
        users: { total: totalUsers },
        customers: { total: totalCustomers },
        conversations: { total: totalConversations, today: todayConversations },
        messages: { today: todayMessages }
    });
});

/**
 * Get error logs (from memory/recent)
 */
export const getErrorLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;

    // Get recent activity logs with errors
    const logs = await ActivityLog.find({ status: 'failure' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('actor', 'email name')
        .lean();

    const total = await ActivityLog.countDocuments({ status: 'failure' });

    res.json({
        logs,
        pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
});

/**
 * Get activity logs
 */
export const getActivityLogs = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 50,
        action,
        targetType,
        startDate,
        endDate
    } = req.query;

    const query = {};
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
        ActivityLog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('actor', 'email name')
            .populate('organization', 'name')
            .lean(),
        ActivityLog.countDocuments(query)
    ]);

    res.json({
        logs,
        pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
});

/**
 * Get user activity logs
 */
export const getUserActivityLogs = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const [logs, total] = await Promise.all([
        ActivityLog.find({ actor: userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean(),
        ActivityLog.countDocuments({ actor: userId })
    ]);

    res.json({ logs, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
});

/**
 * Get organization activity logs
 */
export const getOrgActivityLogs = asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const [logs, total] = await Promise.all([
        ActivityLog.find({ organization: orgId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('actor', 'email name')
            .lean(),
        ActivityLog.countDocuments({ organization: orgId })
    ]);

    res.json({ logs, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
});

/**
 * Get announcements
 */
export const getAnnouncements = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, active } = req.query;

    const query = {};
    if (active !== undefined) query.active = active === 'true';

    const [announcements, total] = await Promise.all([
        Announcement.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('createdBy', 'email name')
            .lean(),
        Announcement.countDocuments(query)
    ]);

    res.json({
        announcements,
        pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
});

/**
 * Create announcement
 */
export const createAnnouncement = asyncHandler(async (req, res) => {
    const { title, message, type, targetType, targetPlans, targetOrganizations, expiresAt, dismissible, showOnLogin, priority } = req.body;

    const announcement = await Announcement.create({
        createdBy: req.user._id,
        title,
        message,
        type: type || 'info',
        targetType: targetType || 'all',
        targetPlans,
        targetOrganizations,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        dismissible: dismissible !== false,
        showOnLogin: showOnLogin === true,
        priority: priority || 0
    });

    await ActivityLog.log({
        actor: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        targetType: 'system',
        action: 'announcement_sent',
        description: `Created announcement: ${title}`,
        ipAddress: req.ip
    });

    res.status(201).json({ announcement });
});

/**
 * Update announcement
 */
export const updateAnnouncement = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const announcement = await Announcement.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
    );

    if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({ announcement });
});

/**
 * Delete announcement
 */
export const deleteAnnouncement = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await Announcement.findByIdAndDelete(id);
    res.json({ message: 'Announcement deleted' });
});

/**
 * Get active sessions (simplified - based on recent activity)
 */
export const getActiveSessions = asyncHandler(async (req, res) => {
    // Get users who logged in within last 24 hours
    const recentLogins = await ActivityLog.find({
        action: 'login',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
        .sort({ createdAt: -1 })
        .populate('actor', 'email name role')
        .populate('organization', 'name')
        .lean();

    // Group by user to get unique sessions
    const sessionsMap = new Map();
    for (const login of recentLogins) {
        if (login.actor && !sessionsMap.has(login.actor._id.toString())) {
            sessionsMap.set(login.actor._id.toString(), {
                user: login.actor,
                organization: login.organization,
                lastActivity: login.createdAt,
                ipAddress: login.ipAddress,
                userAgent: login.userAgent
            });
        }
    }

    res.json({ sessions: Array.from(sessionsMap.values()) });
});

/**
 * Terminate session (logout user)
 */
export const terminateSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    // In a real implementation, you'd invalidate the JWT or session
    // For now, we just log it
    await ActivityLog.log({
        actor: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        targetType: 'user',
        targetId: sessionId,
        action: 'logout',
        description: 'Session terminated by super admin',
        ipAddress: req.ip
    });

    res.json({ message: 'Session terminated' });
});

/**
 * Trigger backup (placeholder)
 */
export const triggerBackup = asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getSettings();

    // In production, you'd trigger mongodump or similar
    settings.backup.lastBackup = new Date();
    settings.backup.lastBackupStatus = 'success';
    await settings.save();

    await ActivityLog.log({
        actor: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        targetType: 'system',
        action: 'backup',
        description: 'Manual backup triggered',
        ipAddress: req.ip
    });

    res.json({
        message: 'Backup triggered',
        timestamp: settings.backup.lastBackup
    });
});

/**
 * Get backup history
 */
export const getBackupHistory = asyncHandler(async (req, res) => {
    const backupLogs = await ActivityLog.find({ action: 'backup' })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('actor', 'email')
        .lean();

    res.json({ backups: backupLogs });
});

// Helper function
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
}
