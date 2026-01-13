import { Reminder } from '../models/Reminder.js';
import { Customer, Organization } from '../models/index.js';
import { createWhatsAppService } from './messaging/whatsapp.service.js';
import { emitToOrganization } from './socket.service.js';
import { logger } from '../utils/logger.js';

/**
 * Reminder Service
 * Handles scheduling, processing, and sending of reminders
 */

let processingInterval = null;

/**
 * Start the reminder processing loop
 */
export function startReminderProcessor(intervalMs = 60000) {
    // Process immediately
    processReminders();

    // Then every minute
    processingInterval = setInterval(processReminders, intervalMs);

    logger.info('✅ Reminder processor started');
}

/**
 * Stop the reminder processor
 */
export function stopReminderProcessor() {
    if (processingInterval) {
        clearInterval(processingInterval);
        processingInterval = null;
        logger.info('Reminder processor stopped');
    }
}

/**
 * Process all due reminders
 */
async function processReminders() {
    try {
        const dueReminders = await Reminder.findDue();

        if (dueReminders.length === 0) return;

        logger.info(`Processing ${dueReminders.length} due reminders`);

        for (const reminder of dueReminders) {
            try {
                await executeReminder(reminder);
            } catch (error) {
                logger.error(`Failed to execute reminder ${reminder._id}:`, error);
                reminder.status = 'failed';
                reminder.lastError = error.message;
                await reminder.save();
            }
        }
    } catch (error) {
        logger.error('Reminder processing error:', error);
    }
}

/**
 * Execute a single reminder
 */
async function executeReminder(reminder) {
    logger.info(`Executing reminder: ${reminder._id} - ${reminder.title}`);

    // Send via enabled channels
    const results = {
        whatsapp: null,
        email: null,
        push: null
    };

    if (reminder.channels.whatsapp && reminder.customer) {
        results.whatsapp = await sendWhatsAppReminder(reminder);
    }

    if (reminder.channels.push) {
        results.push = await sendPushNotification(reminder);
    }

    // TODO: Email reminders

    // Update reminder status
    reminder.status = 'sent';
    reminder.lastExecutedAt = new Date();
    reminder.executionCount += 1;

    // Handle recurring reminders
    if (reminder.recurring?.enabled) {
        const nextDate = reminder.scheduleNext();
        if (nextDate) {
            logger.info(`Next occurrence scheduled for: ${nextDate}`);
        } else {
            logger.info('Recurring reminder series completed');
        }
    }

    await reminder.save();

    return results;
}

/**
 * Send reminder via WhatsApp
 */
async function sendWhatsAppReminder(reminder) {
    try {
        const customer = await Customer.findById(reminder.customer).populate('organization');

        if (!customer?.phone) {
            throw new Error('Customer has no phone number');
        }

        // Find WhatsApp channel for org
        const { Channel } = await import('../models/index.js');
        const channel = await Channel.findOne({
            organization: reminder.organization,
            type: 'whatsapp',
            status: 'active'
        });

        if (!channel) {
            throw new Error('No active WhatsApp channel');
        }

        const whatsapp = await createWhatsAppService(channel._id);

        // Build message
        let message = reminder.message?.content || reminder.title;

        // Replace placeholders
        message = message
            .replace('{{name}}', customer.name || 'Cliente')
            .replace('{{phone}}', customer.phone)
            .replace('{{date}}', new Date(reminder.scheduledAt).toLocaleDateString('es-MX'))
            .replace('{{time}}', new Date(reminder.scheduledAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));

        await whatsapp.sendTextMessage(customer.phone, message);

        logger.info(`WhatsApp reminder sent to ${customer.phone}`);
        return { success: true };

    } catch (error) {
        logger.error('WhatsApp reminder error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send push notification to dashboard
 */
async function sendPushNotification(reminder) {
    try {
        emitToOrganization(reminder.organization.toString(), 'notification', {
            type: 'reminder',
            title: reminder.title,
            description: reminder.description,
            reminderId: reminder._id,
            customerId: reminder.customer,
            scheduledAt: reminder.scheduledAt
        });

        return { success: true };
    } catch (error) {
        logger.error('Push notification error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create a follow-up reminder
 */
export async function createFollowUpReminder(data) {
    const {
        organizationId,
        customerId,
        conversationId,
        title,
        description,
        scheduledAt,
        message,
        createdBy
    } = data;

    const reminder = new Reminder({
        organization: organizationId,
        type: 'follow_up',
        customer: customerId,
        conversation: conversationId,
        title: title || 'Seguimiento pendiente',
        description,
        scheduledAt: new Date(scheduledAt),
        message: { content: message },
        createdBy
    });

    await reminder.save();

    logger.info(`Follow-up reminder created for ${scheduledAt}`);
    return reminder;
}

/**
 * Create appointment reminder (24h and 1h before)
 */
export async function createAppointmentReminders(data) {
    const {
        organizationId,
        customerId,
        appointmentDate,
        appointmentTitle,
        calendarEventId
    } = data;

    const reminders = [];
    const apptDate = new Date(appointmentDate);

    // 24 hours before
    const reminder24h = new Reminder({
        organization: organizationId,
        type: 'appointment',
        customer: customerId,
        title: `Recordatorio: ${appointmentTitle}`,
        description: 'Tienes una cita programada para mañana',
        scheduledAt: new Date(apptDate.getTime() - 24 * 60 * 60 * 1000),
        message: {
            content: `¡Hola {{name}}! 👋\n\nTe recordamos que tienes una cita programada para mañana:\n\n📅 ${appointmentTitle}\n🕐 ${apptDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}\n\n¿Confirmas tu asistencia?`
        },
        metadata: { calendarEventId }
    });

    // 1 hour before
    const reminder1h = new Reminder({
        organization: organizationId,
        type: 'appointment',
        customer: customerId,
        title: `Recordatorio: ${appointmentTitle}`,
        description: 'Tu cita es en 1 hora',
        scheduledAt: new Date(apptDate.getTime() - 60 * 60 * 1000),
        message: {
            content: `¡Hola {{name}}! 👋\n\nTe recordamos que tu cita es en 1 hora:\n\n📅 ${appointmentTitle}\n🕐 ${apptDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}\n\n¡Te esperamos!`
        },
        metadata: { calendarEventId }
    });

    await reminder24h.save();
    await reminder1h.save();

    reminders.push(reminder24h, reminder1h);

    logger.info(`Appointment reminders created for ${appointmentDate}`);
    return reminders;
}

/**
 * Cancel reminders for a calendar event
 */
export async function cancelAppointmentReminders(calendarEventId) {
    const result = await Reminder.updateMany(
        { 'metadata.calendarEventId': calendarEventId, status: 'scheduled' },
        { status: 'cancelled' }
    );

    logger.info(`Cancelled ${result.modifiedCount} reminders for event ${calendarEventId}`);
    return result.modifiedCount;
}

/**
 * Auto-generate follow-up reminders based on conversation inactivity
 */
export async function generateAutoFollowUps(organizationId) {
    const { Conversation } = await import('../models/index.js');

    // Find conversations with no activity in last 24h that are still open
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const staleConversations = await Conversation.find({
        organization: organizationId,
        status: 'open',
        lastMessageAt: { $lt: cutoff },
        aiEnabled: true
    }).populate('customer');

    const reminders = [];

    for (const conv of staleConversations) {
        // Check if reminder already exists
        const existing = await Reminder.findOne({
            conversation: conv._id,
            type: 'follow_up',
            status: 'scheduled'
        });

        if (!existing) {
            const reminder = await createFollowUpReminder({
                organizationId,
                customerId: conv.customer._id,
                conversationId: conv._id,
                title: `Seguimiento: ${conv.customer.name || conv.customer.phone}`,
                description: 'Conversación sin actividad por más de 24 horas',
                scheduledAt: new Date(Date.now() + 30 * 60 * 1000), // In 30 min
                message: `¡Hola {{name}}! 👋\n\n¿Pudiste revisar nuestra propuesta? Estamos aquí para resolver cualquier duda que tengas. ¿Te gustaría que te llamemos o prefieres continuar por aquí?`
            });

            reminder.aiGenerated = true;
            await reminder.save();
            reminders.push(reminder);
        }
    }

    return reminders;
}
