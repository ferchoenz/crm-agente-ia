import { Router } from 'express';
import { authenticate, requireAgent, requireAdmin } from '../middleware/auth.middleware.js';
import { tenantIsolation, injectOrganization } from '../middleware/tenant.middleware.js';
import { Reminder } from '../models/Reminder.js';
import { createFollowUpReminder, generateAutoFollowUps } from '../services/reminder.service.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

const router = Router();

// All routes require auth and tenant context
router.use(authenticate);
router.use(tenantIsolation);

/**
 * Get all reminders for organization
 */
router.get('/', requireAgent, asyncHandler(async (req, res) => {
    const { status, type, customerId, page = 1, limit = 20 } = req.query;

    const query = { ...req.tenantFilter };

    if (status) query.status = status;
    if (type) query.type = type;
    if (customerId) query.customer = customerId;

    const [reminders, total] = await Promise.all([
        Reminder.find(query)
            .populate('customer', 'name phone')
            .populate('createdBy', 'name')
            .sort({ scheduledAt: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit)),
        Reminder.countDocuments(query)
    ]);

    res.json({
        reminders,
        pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
}));

/**
 * Get upcoming reminders (next 7 days)
 */
router.get('/upcoming', requireAgent, asyncHandler(async (req, res) => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const reminders = await Reminder.find({
        ...req.tenantFilter,
        status: 'scheduled',
        scheduledAt: { $gte: new Date(), $lte: nextWeek }
    })
        .populate('customer', 'name phone')
        .sort({ scheduledAt: 1 })
        .limit(20);

    res.json({ reminders });
}));

/**
 * Get single reminder
 */
router.get('/:id', requireAgent, asyncHandler(async (req, res) => {
    const reminder = await Reminder.findOne({
        _id: req.params.id,
        ...req.tenantFilter
    })
        .populate('customer')
        .populate('conversation')
        .populate('createdBy', 'name');

    if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json(reminder);
}));

/**
 * Create reminder
 */
router.post('/', requireAgent, injectOrganization, asyncHandler(async (req, res) => {
    const {
        type = 'follow_up',
        customerId,
        conversationId,
        title,
        description,
        scheduledAt,
        message,
        channels,
        recurring
    } = req.body;

    if (!title || !scheduledAt) {
        return res.status(400).json({ error: 'Title and scheduledAt are required' });
    }

    const reminder = new Reminder({
        organization: req.user.organizationId,
        type,
        customer: customerId,
        conversation: conversationId,
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        message: message ? { content: message } : undefined,
        channels: channels || { whatsapp: true, push: true },
        recurring,
        createdBy: req.user.id
    });

    await reminder.save();

    res.status(201).json(reminder);
}));

/**
 * Create quick follow-up reminder
 */
router.post('/follow-up', requireAgent, asyncHandler(async (req, res) => {
    const { customerId, conversationId, message, delayMinutes = 30 } = req.body;

    if (!customerId) {
        return res.status(400).json({ error: 'Customer ID is required' });
    }

    const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

    const reminder = await createFollowUpReminder({
        organizationId: req.user.organizationId,
        customerId,
        conversationId,
        title: 'Seguimiento programado',
        scheduledAt,
        message: message || '¡Hola {{name}}! 👋 Solo quería dar seguimiento a nuestra conversación. ¿Hay algo en lo que pueda ayudarte?',
        createdBy: req.user.id
    });

    res.status(201).json(reminder);
}));

/**
 * Update reminder
 */
router.put('/:id', requireAgent, asyncHandler(async (req, res) => {
    const allowedUpdates = ['title', 'description', 'scheduledAt', 'message', 'channels', 'recurring', 'status'];

    const updates = {};
    for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
            updates[key] = req.body[key];
        }
    }

    if (updates.scheduledAt) {
        updates.scheduledAt = new Date(updates.scheduledAt);
    }

    const reminder = await Reminder.findOneAndUpdate(
        { _id: req.params.id, ...req.tenantFilter },
        { $set: updates },
        { new: true }
    );

    if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json(reminder);
}));

/**
 * Cancel reminder
 */
router.post('/:id/cancel', requireAgent, asyncHandler(async (req, res) => {
    const reminder = await Reminder.findOneAndUpdate(
        { _id: req.params.id, ...req.tenantFilter, status: 'scheduled' },
        { status: 'cancelled' },
        { new: true }
    );

    if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found or already processed' });
    }

    res.json({ success: true, reminder });
}));

/**
 * Delete reminder
 */
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
    const result = await Reminder.deleteOne({
        _id: req.params.id,
        ...req.tenantFilter
    });

    if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({ success: true });
}));

/**
 * Trigger auto-follow-up generation
 */
router.post('/generate-auto', requireAdmin, asyncHandler(async (req, res) => {
    const reminders = await generateAutoFollowUps(req.user.organizationId);

    res.json({
        success: true,
        generated: reminders.length,
        reminders
    });
}));

export default router;
