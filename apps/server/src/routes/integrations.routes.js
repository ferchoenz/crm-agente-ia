import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { tenantIsolation } from '../middleware/tenant.middleware.js';
import { CalendarService, isCalendarConnected } from '../services/integrations/calendar.service.js';
import { encrypt, decrypt } from '../services/encryption.service.js';
import { Channel } from '../models/index.js';
import { logger } from '../utils/logger.js';
import EmbeddedSignUpService from '../services/integrations/embedded-signup.service.js';

const router = Router();

// All routes require auth and tenant context
router.use(authenticate);
router.use(tenantIsolation);

// ==================== GOOGLE CALENDAR ====================

/**
 * Check if Google Calendar is connected
 */
router.get('/google/calendar/status', requireAdmin, async (req, res) => {
    const connected = await isCalendarConnected(req.user.organizationId);
    res.json({ connected });
});

/**
 * Get Google Calendar auth URL
 */
router.get('/google/calendar/auth-url', requireAdmin, (req, res) => {
    const service = new CalendarService(req.user.organizationId);
    service.initialize();

    const state = Buffer.from(JSON.stringify({
        organizationId: req.user.organizationId.toString()
    })).toString('base64');

    const authUrl = service.getAuthUrl(state);
    res.json({ authUrl });
});

/**
 * Google Calendar OAuth callback
 */
router.get('/google/callback', async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code || !state) {
            return res.redirect(`${process.env.CLIENT_URL}/settings/channels?error=missing_params`);
        }

        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        const organizationId = stateData.organizationId;

        const service = new CalendarService(organizationId);
        service.initialize();

        const tokens = await service.exchangeCode(code);
        await service.saveTokens(tokens);

        res.redirect(`${process.env.CLIENT_URL}/settings/channels?calendar=connected`);
    } catch (error) {
        logger.error('Google OAuth callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/settings/channels?error=oauth_failed`);
    }
});

/**
 * List calendars
 */
router.get('/google/calendar/calendars', requireAdmin, async (req, res) => {
    try {
        const service = new CalendarService(req.user.organizationId);
        service.initialize();
        await service.setupWithStoredTokens();

        const calendars = await service.listCalendars();
        res.json({ calendars });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * Get available slots for a date
 */
router.get('/google/calendar/slots', requireAdmin, async (req, res) => {
    try {
        const { date, calendarId } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const service = new CalendarService(req.user.organizationId);
        service.initialize();
        await service.setupWithStoredTokens();

        const slots = await service.getAvailableSlots(new Date(date), calendarId);
        res.json({ slots });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * Create appointment
 */
router.post('/google/calendar/appointments', requireAdmin, async (req, res) => {
    try {
        const { summary, description, startTime, endTime, attendeeEmail, calendarId } = req.body;

        if (!summary || !startTime || !endTime) {
            return res.status(400).json({ error: 'Summary, startTime and endTime are required' });
        }

        const service = new CalendarService(req.user.organizationId);
        service.initialize();
        await service.setupWithStoredTokens();

        const appointment = await service.createAppointment({
            summary,
            description,
            startTime,
            endTime,
            attendeeEmail,
            calendarId
        });

        res.status(201).json(appointment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ==================== WHATSAPP ====================

// ==================== WHATSAPP ====================

/**
 * Get embedded signup configuration
 */
router.get('/whatsapp/embedded-signup/config', requireAdmin, (req, res) => {
    res.json({
        appId: process.env.FACEBOOK_APP_ID,
        configId: process.env.WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID
    });
});

/**
 * Embedded signup callback - complete the signup flow
 */
router.post('/whatsapp/embedded-signup/callback', requireAdmin, async (req, res) => {
    try {
        const { code, wabaId, phoneNumberId } = req.body;

        if (!code || !wabaId || !phoneNumberId) {
            return res.status(400).json({
                error: 'Missing required parameters: code, wabaId, phoneNumberId'
            });
        }

        const result = await EmbeddedSignUpService.completeSignup(
            req.user.organizationId,
            code,
            wabaId,
            phoneNumberId
        );

        logger.info(`Embedded signup completed for org ${req.user.organizationId}`);

        res.json(result);
    } catch (error) {
        logger.error('Embedded signup callback error:', error);
        res.status(500).json({
            error: error.message || 'Failed to complete embedded signup'
        });
    }
});

/**
 * Get phone numbers for a WABA (after user grants access)
 */
router.post('/whatsapp/waba/phone-numbers', requireAdmin, async (req, res) => {
    try {
        const { wabaId, accessToken } = req.body;

        if (!wabaId || !accessToken) {
            return res.status(400).json({ error: 'WABA ID and access token are required' });
        }

        const phoneNumbers = await EmbeddedSignUpService.getPhoneNumbers(wabaId, accessToken);

        res.json({ phoneNumbers });
    } catch (error) {
        logger.error('Failed to get phone numbers:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Connect WhatsApp (save credentials from Embedded Signup)
 */

router.post('/whatsapp/connect', requireAdmin, async (req, res) => {
    try {
        const { phoneNumberId, wabaId, accessToken, phoneNumber, displayName } = req.body;

        if (!phoneNumberId || !accessToken) {
            return res.status(400).json({ error: 'Phone number ID and access token are required' });
        }

        // Check if channel already exists
        let channel = await Channel.findOne({
            organization: req.user.organizationId,
            type: 'whatsapp',
            'whatsapp.phoneNumberId': phoneNumberId
        });

        if (channel) {
            // Update existing
            channel.credentials.accessToken = encrypt(accessToken);
            channel.whatsapp = { phoneNumberId, wabaId, phoneNumber, displayName };
            channel.status = 'active';
            channel.statusMessage = 'Connected successfully';
            channel.connectedAt = new Date();
        } else {
            // Create new
            channel = new Channel({
                organization: req.user.organizationId,
                type: 'whatsapp',
                name: displayName || `WhatsApp ${phoneNumber}`,
                whatsapp: { phoneNumberId, wabaId, phoneNumber, displayName },
                credentials: {
                    accessToken: encrypt(accessToken)
                },
                status: 'active',
                statusMessage: 'Connected successfully',
                connectedAt: new Date(),
                settings: {
                    aiEnabled: true,
                    autoReply: true,
                    greetingEnabled: true
                }
            });
        }

        await channel.save();

        logger.info(`WhatsApp connected for org ${req.user.organizationId}: ${phoneNumber}`);

        res.json({
            success: true,
            channel: {
                id: channel._id,
                name: channel.name,
                phoneNumber: channel.whatsapp.phoneNumber,
                status: channel.status
            }
        });
    } catch (error) {
        logger.error('WhatsApp connect error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get WhatsApp channels
 */
router.get('/whatsapp/channels', requireAdmin, async (req, res) => {
    const channels = await Channel.find({
        ...req.tenantFilter,
        type: 'whatsapp'
    }).select('name whatsapp.phoneNumber whatsapp.displayName status connectedAt stats');

    res.json({ channels });
});

/**
 * Disconnect WhatsApp channel
 */
router.delete('/whatsapp/channels/:id', requireAdmin, async (req, res) => {
    const channel = await Channel.findOneAndUpdate(
        { _id: req.params.id, ...req.tenantFilter },
        { status: 'disconnected', statusMessage: 'Disconnected by user' },
        { new: true }
    );

    if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({ success: true });
});

/**
 * Update WhatsApp channel settings
 */
router.patch('/whatsapp/channels/:id/settings', requireAdmin, async (req, res) => {
    const { aiEnabled, autoReply, greetingEnabled, customGreeting } = req.body;

    const channel = await Channel.findOneAndUpdate(
        { _id: req.params.id, ...req.tenantFilter },
        {
            $set: {
                'settings.aiEnabled': aiEnabled,
                'settings.autoReply': autoReply,
                'settings.greetingEnabled': greetingEnabled,
                'settings.customGreeting': customGreeting
            }
        },
        { new: true }
    );

    if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({ channel });
});

// ==================== FACEBOOK MESSENGER ====================

/**
 * Connect Facebook Messenger (save credentials)
 */
router.post('/messenger/connect', requireAdmin, async (req, res) => {
    try {
        const { pageId, pageName, accessToken } = req.body;

        if (!pageId || !accessToken) {
            return res.status(400).json({ error: 'Page ID and access token are required' });
        }

        // Check if channel already exists
        let channel = await Channel.findOne({
            organization: req.user.organizationId,
            type: 'messenger',
            'messenger.pageId': pageId
        });

        if (channel) {
            // Update existing
            channel.credentials.accessToken = encrypt(accessToken);
            channel.messenger = { pageId, pageName };
            channel.status = 'active';
            channel.statusMessage = 'Connected successfully';
            channel.connectedAt = new Date();
        } else {
            // Create new
            channel = new Channel({
                organization: req.user.organizationId,
                type: 'messenger',
                name: pageName || `Facebook Page ${pageId}`,
                messenger: { pageId, pageName },
                credentials: {
                    accessToken: encrypt(accessToken)
                },
                status: 'active',
                statusMessage: 'Connected successfully',
                connectedAt: new Date(),
                settings: {
                    aiEnabled: true,
                    autoReply: true,
                    greetingEnabled: true
                }
            });
        }

        await channel.save();

        logger.info(`Messenger connected for org ${req.user.organizationId}: ${pageName}`);

        res.json({
            success: true,
            channel: {
                id: channel._id,
                name: channel.name,
                pageName: channel.messenger.pageName,
                status: channel.status
            }
        });
    } catch (error) {
        logger.error('Messenger connect error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get Messenger channels
 */
router.get('/messenger/channels', requireAdmin, async (req, res) => {
    const channels = await Channel.find({
        ...req.tenantFilter,
        type: 'messenger'
    }).select('name messenger.pageId messenger.pageName status connectedAt settings stats');

    res.json({ channels });
});

/**
 * Disconnect Messenger channel
 */
router.delete('/messenger/channels/:id', requireAdmin, async (req, res) => {
    const channel = await Channel.findOneAndUpdate(
        { _id: req.params.id, ...req.tenantFilter, type: 'messenger' },
        { status: 'disconnected', statusMessage: 'Disconnected by user' },
        { new: true }
    );

    if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({ success: true });
});

/**
 * Update Messenger channel settings
 */
router.patch('/messenger/channels/:id/settings', requireAdmin, async (req, res) => {
    const { aiEnabled, autoReply, greetingEnabled, customGreeting } = req.body;

    const channel = await Channel.findOneAndUpdate(
        { _id: req.params.id, ...req.tenantFilter, type: 'messenger' },
        {
            $set: {
                'settings.aiEnabled': aiEnabled,
                'settings.autoReply': autoReply,
                'settings.greetingEnabled': greetingEnabled,
                'settings.customGreeting': customGreeting
            }
        },
        { new: true }
    );

    if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({ channel });
});

// ==================== INSTAGRAM ====================

/**
 * Connect Instagram (save credentials)
 */
router.post('/instagram/connect', requireAdmin, async (req, res) => {
    try {
        const { instagramAccountId, username, name, pageId, accessToken } = req.body;

        if (!instagramAccountId || !accessToken) {
            return res.status(400).json({ error: 'Instagram account ID and access token are required' });
        }

        // Check if channel already exists
        let channel = await Channel.findOne({
            organization: req.user.organizationId,
            type: 'instagram',
            'instagram.accountId': instagramAccountId
        });

        if (channel) {
            // Update existing
            channel.credentials.accessToken = encrypt(accessToken);
            channel.instagram = { accountId: instagramAccountId, username, name, pageId };
            channel.status = 'active';
            channel.statusMessage = 'Connected successfully';
            channel.connectedAt = new Date();
        } else {
            // Create new
            channel = new Channel({
                organization: req.user.organizationId,
                type: 'instagram',
                name: name || `Instagram @${username}`,
                instagram: { accountId: instagramAccountId, username, name, pageId },
                credentials: {
                    accessToken: encrypt(accessToken)
                },
                status: 'active',
                statusMessage: 'Connected successfully',
                connectedAt: new Date(),
                settings: {
                    aiEnabled: true,
                    autoReply: true,
                    greetingEnabled: true
                }
            });
        }

        await channel.save();

        logger.info(`Instagram connected for org ${req.user.organizationId}: @${username}`);

        res.json({
            success: true,
            channel: {
                id: channel._id,
                name: channel.name,
                username: channel.instagram.username,
                status: channel.status
            }
        });
    } catch (error) {
        logger.error('Instagram connect error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get Instagram channels
 */
router.get('/instagram/channels', requireAdmin, async (req, res) => {
    const channels = await Channel.find({
        ...req.tenantFilter,
        type: 'instagram'
    }).select('name instagram.accountId instagram.username instagram.name status connectedAt settings stats');

    res.json({ channels });
});

/**
 * Disconnect Instagram channel
 */
router.delete('/instagram/channels/:id', requireAdmin, async (req, res) => {
    const channel = await Channel.findOneAndUpdate(
        { _id: req.params.id, ...req.tenantFilter, type: 'instagram' },
        { status: 'disconnected', statusMessage: 'Disconnected by user' },
        { new: true }
    );

    if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({ success: true });
});

/**
 * Update Instagram channel settings
 */
router.patch('/instagram/channels/:id/settings', requireAdmin, async (req, res) => {
    const { aiEnabled, autoReply, greetingEnabled, customGreeting } = req.body;

    const channel = await Channel.findOneAndUpdate(
        { _id: req.params.id, ...req.tenantFilter, type: 'instagram' },
        {
            $set: {
                'settings.aiEnabled': aiEnabled,
                'settings.autoReply': autoReply,
                'settings.greetingEnabled': greetingEnabled,
                'settings.customGreeting': customGreeting
            }
        },
        { new: true }
    );

    if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({ channel });
});

export default router;
