import { Reminder } from '../models/Reminder.js';
import { Customer, Organization, Channel, Appointment } from '../models/index.js';
import { createWhatsAppService } from './messaging/whatsapp.service.js';
import { createMessengerService } from './messaging/messenger.service.js';
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
 * Uses organization's followUpConfig settings
 */
export async function generateAutoFollowUps(organizationId) {
    const { Conversation } = await import('../models/index.js');

    // Get organization config
    const org = await Organization.findById(organizationId);
    if (!org || !org.followUpConfig?.enabled) {
        return [];
    }

    const config = org.followUpConfig;
    const hoursAgo = config.hoursAfterInactivity || 24;
    const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    // Find stale conversations open, with last customer message (not AI)
    const staleConversations = await Conversation.find({
        organization: organizationId,
        status: 'open',
        lastMessageAt: { $lt: cutoff },
        aiEnabled: true
    }).populate('customer').populate('channel');

    const reminders = [];

    for (const conv of staleConversations) {
        if (!conv.customer) continue;

        // Check how many follow-ups already sent
        const existingCount = await Reminder.countDocuments({
            conversation: conv._id,
            type: 'follow_up',
            status: { $in: ['sent', 'scheduled'] }
        });

        if (existingCount >= (config.maxFollowUps || 3)) {
            continue; // Max follow-ups reached
        }

        // Check if pending reminder exists
        const pending = await Reminder.findOne({
            conversation: conv._id,
            type: 'follow_up',
            status: 'scheduled'
        });

        if (pending) continue;

        // Build personalized message
        let message = config.message || '¡Hola {name}! 👋 ¿Pudiste revisar la información? Estamos aquí para ayudarte.';
        message = message.replace('{name}', conv.customer.name || 'amigo');

        const reminder = await createFollowUpReminder({
            organizationId,
            customerId: conv.customer._id,
            conversationId: conv._id,
            title: `Seguimiento: ${conv.customer.name || conv.customer.phone}`,
            description: `Conversación sin actividad por ${hoursAgo}+ horas`,
            scheduledAt: new Date(Date.now() + 5 * 60 * 1000), // In 5 min
            message
        });

        reminder.aiGenerated = true;
        reminder.metadata = {
            channel: conv.channel?.type || 'whatsapp',
            channelId: conv.channel?._id,
            followUpNumber: existingCount + 1
        };
        await reminder.save();
        reminders.push(reminder);

        logger.info(`Created follow-up #${existingCount + 1} for conversation ${conv._id}`);
    }

    return reminders;
}

/**
 * Run auto follow-ups for ALL active organizations
 * Called by periodic job
 */
export async function runAutoFollowUpsForAllOrgs() {
    try {
        // Find all active organizations with follow-up enabled
        const orgs = await Organization.find({
            active: true,
            'followUpConfig.enabled': true
        }).select('_id name');

        logger.info(`Running auto follow-ups for ${orgs.length} organizations`);

        let totalReminders = 0;

        for (const org of orgs) {
            try {
                const reminders = await generateAutoFollowUps(org._id);
                totalReminders += reminders.length;
            } catch (error) {
                logger.error(`Follow-up generation failed for org ${org._id}:`, error);
            }
        }

        logger.info(`Auto follow-up job completed. Created ${totalReminders} reminders.`);
        return totalReminders;
    } catch (error) {
        logger.error('Auto follow-up job error:', error);
        return 0;
    }
}

