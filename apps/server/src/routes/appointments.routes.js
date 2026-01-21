import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { tenantIsolation } from '../middleware/tenant.middleware.js';
import { createAppointmentService, areAppointmentsEnabled } from '../services/integrations/appointment.service.js';
import { Appointment, Organization } from '../models/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

// All routes require auth and tenant context
router.use(authenticate);
router.use(tenantIsolation);

// ==================== APPOINTMENTS CONFIG ====================

/**
 * Get appointments configuration
 */
router.get('/config', requireAdmin, async (req, res) => {
    try {
        const org = await Organization.findById(req.user.organizationId)
            .select('appointmentsConfig');

        // Check if calendar is connected
        const { isCalendarConnected } = await import('../services/integrations/calendar.service.js');
        const calendarConnected = await isCalendarConnected(req.user.organizationId);

        res.json({
            config: org?.appointmentsConfig || {},
            calendarConnected
        });
    } catch (error) {
        logger.error('Error getting appointments config:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update appointments configuration
 */
router.put('/config', requireAdmin, async (req, res) => {
    try {
        const {
            enabled,
            defaultDuration,
            bufferMinutes,
            maxAdvanceDays,
            calendarId,
            businessHours,
            reminderHoursBefore,
            confirmationMessage,
            reminderMessage
        } = req.body;

        const updateData = {};

        if (enabled !== undefined) updateData['appointmentsConfig.enabled'] = enabled;
        if (defaultDuration) updateData['appointmentsConfig.defaultDuration'] = defaultDuration;
        if (bufferMinutes !== undefined) updateData['appointmentsConfig.bufferMinutes'] = bufferMinutes;
        if (maxAdvanceDays) updateData['appointmentsConfig.maxAdvanceDays'] = maxAdvanceDays;
        if (calendarId) updateData['appointmentsConfig.calendarId'] = calendarId;
        if (reminderHoursBefore) updateData['appointmentsConfig.reminderHoursBefore'] = reminderHoursBefore;
        if (confirmationMessage) updateData['appointmentsConfig.confirmationMessage'] = confirmationMessage;
        if (reminderMessage) updateData['appointmentsConfig.reminderMessage'] = reminderMessage;

        // Handle business hours (nested object)
        if (businessHours) {
            for (const [day, hours] of Object.entries(businessHours)) {
                if (hours.start !== undefined) updateData[`appointmentsConfig.businessHours.${day}.start`] = hours.start;
                if (hours.end !== undefined) updateData[`appointmentsConfig.businessHours.${day}.end`] = hours.end;
                if (hours.enabled !== undefined) updateData[`appointmentsConfig.businessHours.${day}.enabled`] = hours.enabled;
            }
        }

        const org = await Organization.findByIdAndUpdate(
            req.user.organizationId,
            { $set: updateData },
            { new: true }
        ).select('appointmentsConfig');

        logger.info(`Appointments config updated for org ${req.user.organizationId}`);

        res.json({
            success: true,
            config: org.appointmentsConfig
        });
    } catch (error) {
        logger.error('Error updating appointments config:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== APPOINTMENTS CRUD ====================

/**
 * List appointments with filters
 */
router.get('/', requireAdmin, async (req, res) => {
    try {
        const {
            status,
            startDate,
            endDate,
            customer,
            limit = 50,
            page = 1
        } = req.query;

        const query = { organization: req.user.organizationId };

        if (status) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.startTime = {};
            if (startDate) query.startTime.$gte = new Date(startDate);
            if (endDate) query.startTime.$lte = new Date(endDate);
        }

        if (customer) {
            query.customer = customer;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [appointments, total] = await Promise.all([
            Appointment.find(query)
                .sort({ startTime: 1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('customer', 'name phone email')
                .populate('conversation', '_id')
                .lean(),
            Appointment.countDocuments(query)
        ]);

        res.json({
            appointments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('Error listing appointments:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get today's appointments
 */
router.get('/today', requireAdmin, async (req, res) => {
    try {
        const service = await createAppointmentService(req.user.organizationId);
        const appointments = await service.getToday();
        res.json({ appointments });
    } catch (error) {
        logger.error('Error getting today appointments:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get upcoming appointments
 */
router.get('/upcoming', requireAdmin, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const service = await createAppointmentService(req.user.organizationId);
        const appointments = await service.getUpcoming(parseInt(limit));
        res.json({ appointments });
    } catch (error) {
        logger.error('Error getting upcoming appointments:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get available slots for a date
 */
router.get('/slots', requireAdmin, async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const service = await createAppointmentService(req.user.organizationId);
        const slots = await service.getAvailableSlots(new Date(date));
        res.json({ slots });
    } catch (error) {
        logger.error('Error getting slots:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get available days
 */
router.get('/available-days', requireAdmin, async (req, res) => {
    try {
        const { count = 7 } = req.query;
        const service = await createAppointmentService(req.user.organizationId);
        const days = await service.getAvailableDays(parseInt(count));
        res.json({ days });
    } catch (error) {
        logger.error('Error getting available days:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get single appointment
 */
router.get('/:id', requireAdmin, async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            organization: req.user.organizationId
        })
            .populate('customer', 'name phone email')
            .populate('conversation', '_id lastMessageAt');

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json({ appointment });
    } catch (error) {
        logger.error('Error getting appointment:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create appointment manually
 */
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { customerId, startTime, title, description } = req.body;

        if (!customerId || !startTime) {
            return res.status(400).json({ error: 'Customer ID and start time are required' });
        }

        const service = await createAppointmentService(req.user.organizationId);

        const appointment = await service.createAppointment({
            customerId,
            startTime: new Date(startTime),
            title,
            description
        });

        // Populate for response
        await appointment.populate('customer', 'name phone email');

        res.status(201).json({ appointment });
    } catch (error) {
        logger.error('Error creating appointment:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update appointment
 */
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { status, title, description, startTime } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;

        if (startTime) {
            const org = await Organization.findById(req.user.organizationId);
            const duration = org?.appointmentsConfig?.defaultDuration || 60;
            const start = new Date(startTime);
            updateData.startTime = start;
            updateData.endTime = new Date(start.getTime() + duration * 60000);
        }

        const appointment = await Appointment.findOneAndUpdate(
            { _id: req.params.id, organization: req.user.organizationId },
            { $set: updateData },
            { new: true }
        ).populate('customer', 'name phone email');

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json({ appointment });
    } catch (error) {
        logger.error('Error updating appointment:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Cancel appointment
 */
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const { reason } = req.body;

        const service = await createAppointmentService(req.user.organizationId);
        const appointment = await service.cancelAppointment(req.params.id, reason);

        res.json({ success: true, appointment });
    } catch (error) {
        logger.error('Error cancelling appointment:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Send reminder manually
 */
router.post('/:id/remind', requireAdmin, async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            organization: req.user.organizationId
        }).populate('customer', 'name phone email source');

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // TODO: Implement sending reminder via appropriate channel
        // This will be done in the reminder job

        res.json({ success: true, message: 'Reminder will be sent' });
    } catch (error) {
        logger.error('Error sending reminder:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
