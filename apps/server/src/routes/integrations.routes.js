import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { tenantIsolation } from '../middleware/tenant.middleware.js';
import { CalendarService, isCalendarConnected } from '../services/integrations/calendar.service.js';
import { encrypt, decrypt } from '../services/encryption.service.js';
import { Channel } from '../models/index.js';
import { logger } from '../utils/logger.js';
import EmbeddedSignUpService from '../services/integrations/embedded-signup.service.js';

const router = Router();

// ==================== GOOGLE CALENDAR OAuth Callback ====================
// This route MUST be before auth middleware because Google redirects here without JWT token

/**
 * Google Calendar OAuth callback (NO AUTH REQUIRED - external redirect from Google)
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

// All other routes require auth and tenant context
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
 * Discover WABAs associated with the user's access token
 * This is used when the session info doesn't return the WABA ID
 * Uses multiple methods to find WABAs shared via Embedded Signup
 */
router.post('/whatsapp/discover-wabas', requireAdmin, async (req, res) => {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({ error: 'Access token is required' });
        }

        const axios = (await import('axios')).default;
        const allWabas = [];
        const seenIds = new Set();

        // Helper to add unique WABAs
        const addWaba = (waba) => {
            if (waba.id && !seenIds.has(waba.id)) {
                seenIds.add(waba.id);
                allWabas.push(waba);
            }
        };

        // Get debug info about the token to understand its scope
        // Use FACEBOOK_APP_SECRET with fallback to META_APP_SECRET for compatibility
        const appSecret = process.env.FACEBOOK_APP_SECRET || process.env.META_APP_SECRET;
        const appId = process.env.FACEBOOK_APP_ID;

        if (!appId || !appSecret) {
            logger.error('Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET in environment');
            return res.status(500).json({ error: 'Server configuration error: missing Facebook credentials' });
        }

        const appToken = `${appId}|${appSecret}`;
        logger.info(`Using App ID: ${appId}, App Secret: ${appSecret ? '[CONFIGURED]' : '[MISSING]'}`);

        try {
            const debugResponse = await axios.get(`https://graph.facebook.com/v21.0/debug_token`, {
                params: {
                    input_token: accessToken,
                    access_token: appToken
                }
            });
            logger.info('Token debug info:', JSON.stringify(debugResponse.data, null, 2));
        } catch (debugError) {
            logger.warn('Token debug failed:', debugError.message);
        }

        // METHOD 1: Get WABAs shared with our app via Embedded Signup
        // This uses the app-scoped token to find all WABAs that have been shared
        try {
            logger.info('Method 1: Checking app shared WABAs...');
            logger.info(`Making request to: https://graph.facebook.com/v21.0/${appId}/whatsapp_business_accounts`);
            const sharedWabasResponse = await axios.get(
                `https://graph.facebook.com/v21.0/${appId}/whatsapp_business_accounts`,
                {
                    params: {
                        fields: 'id,name,account_review_status,owner_business_info{id,name}',
                        access_token: appToken
                    }
                }
            );

            logger.info('App shared WABAs response:', JSON.stringify(sharedWabasResponse.data, null, 2));

            if (sharedWabasResponse.data.data) {
                for (const waba of sharedWabasResponse.data.data) {
                    addWaba({
                        id: waba.id,
                        name: waba.name || 'WhatsApp Business Account',
                        status: waba.account_review_status,
                        businessId: waba.owner_business_info?.id,
                        businessName: waba.owner_business_info?.name,
                        source: 'app_shared'
                    });
                }
            }
        } catch (appWabasError) {
            const errorData = appWabasError.response?.data?.error || appWabasError.response?.data || appWabasError.message;
            logger.warn(`Could not get app shared WABAs: ${JSON.stringify(errorData)}`);
        }

        // METHOD 2: Get WABAs from user's businesses with whatsapp_business_management permission
        try {
            logger.info('Method 2: Checking user businesses...');
            const businessesResponse = await axios.get(`https://graph.facebook.com/v21.0/me/businesses`, {
                params: {
                    fields: 'id,name,owned_whatsapp_business_accounts{id,name,account_review_status},client_whatsapp_business_accounts{id,name,account_review_status}',
                    access_token: accessToken
                }
            });

            logger.info('User businesses response:', JSON.stringify(businessesResponse.data, null, 2));

            if (businessesResponse.data.data) {
                for (const business of businessesResponse.data.data) {
                    // Check owned WABAs
                    if (business.owned_whatsapp_business_accounts?.data) {
                        for (const waba of business.owned_whatsapp_business_accounts.data) {
                            addWaba({
                                id: waba.id,
                                name: waba.name || 'WhatsApp Business Account',
                                status: waba.account_review_status,
                                businessId: business.id,
                                businessName: business.name,
                                source: 'business_owned'
                            });
                        }
                    }
                    // Check client WABAs (for agencies)
                    if (business.client_whatsapp_business_accounts?.data) {
                        for (const waba of business.client_whatsapp_business_accounts.data) {
                            addWaba({
                                id: waba.id,
                                name: waba.name || 'WhatsApp Business Account',
                                status: waba.account_review_status,
                                businessId: business.id,
                                businessName: business.name,
                                source: 'business_client'
                            });
                        }
                    }
                }
            }
        } catch (bizError) {
            const errorData = bizError.response?.data?.error || bizError.response?.data || bizError.message;
            logger.warn(`Could not get user businesses: ${JSON.stringify(errorData)}`);
        }

        // METHOD 3: Try to query the user's own WhatsApp nodes directly (from token scopes)
        try {
            logger.info('Method 3: Checking user WhatsApp accounts...');
            const userWabasResponse = await axios.get(`https://graph.facebook.com/v21.0/me/whatsapp_business_accounts`, {
                params: {
                    fields: 'id,name,account_review_status',
                    access_token: accessToken
                }
            });

            logger.info('User WABAs response:', JSON.stringify(userWabasResponse.data, null, 2));

            if (userWabasResponse.data.data) {
                for (const waba of userWabasResponse.data.data) {
                    addWaba({
                        id: waba.id,
                        name: waba.name || 'WhatsApp Business Account',
                        status: waba.account_review_status,
                        source: 'user_direct'
                    });
                }
            }
        } catch (userWabasError) {
            const errorData = userWabasError.response?.data?.error || userWabasError.response?.data || userWabasError.message;
            logger.warn(`Could not get user WABAs directly: ${JSON.stringify(errorData)}`);
        }

        // METHOD 4: Check permission grants
        try {
            logger.info('Method 4: Checking permission grants...');
            const grantsResponse = await axios.get(`https://graph.facebook.com/v21.0/me/permission_grants`, {
                params: {
                    fields: 'business,whatsapp_business_account{id,name,account_review_status}',
                    access_token: accessToken
                }
            });

            logger.info('Permission grants response:', JSON.stringify(grantsResponse.data, null, 2));

            if (grantsResponse.data.data) {
                for (const grant of grantsResponse.data.data) {
                    if (grant.whatsapp_business_account) {
                        addWaba({
                            id: grant.whatsapp_business_account.id,
                            name: grant.whatsapp_business_account.name || 'WhatsApp Business Account',
                            status: grant.whatsapp_business_account.account_review_status,
                            businessId: grant.business?.id,
                            source: 'permission_grant'
                        });
                    }
                }
            }
        } catch (grantsError) {
            const errorData = grantsError.response?.data?.error || grantsError.response?.data || grantsError.message;
            logger.warn(`Could not get permission grants: ${JSON.stringify(errorData)}`);
        }

        // Log final results
        logger.info(`Found ${allWabas.length} WABAs total`);

        if (allWabas.length > 0) {
            return res.json({ wabas: allWabas });
        }

        // If still no WABAs found, return empty with helpful message
        res.json({
            wabas: [],
            message: 'No se encontraron cuentas de WhatsApp Business asociadas. Asegúrate de completar todo el flujo de registro en Meta y que tu número esté vinculado a una WABA.'
        });

    } catch (error) {
        logger.error('Failed to discover WABAs:', error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data?.error?.message || error.message });
    }
});
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

        // Subscribe the app to webhooks for this WABA
        // This is required to receive messages
        if (wabaId) {
            try {
                await EmbeddedSignUpService.subscribeToWebhooks(wabaId, accessToken);
                logger.info(`Subscribed to webhooks for WABA ${wabaId}`);
            } catch (webhookError) {
                logger.warn(`Failed to subscribe to webhooks for WABA ${wabaId}:`, webhookError.message);
                // Don't fail the connection if webhook subscription fails
            }
        }

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
 * Subscribe existing WhatsApp channel to webhooks
 * Use this for channels that were connected before automatic subscription was added
 */
router.post('/whatsapp/channels/:id/subscribe-webhooks', requireAdmin, async (req, res) => {
    try {
        const channel = await Channel.findOne({
            _id: req.params.id,
            ...req.tenantFilter,
            type: 'whatsapp'
        });

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const wabaId = channel.whatsapp?.wabaId;
        if (!wabaId) {
            return res.status(400).json({ error: 'Channel has no WABA ID configured' });
        }

        // Decrypt the access token
        const { decrypt } = await import('../services/encryption.service.js');
        const accessToken = decrypt(channel.credentials.accessToken);

        // Subscribe to webhooks
        const result = await EmbeddedSignUpService.subscribeToWebhooks(wabaId, accessToken);

        if (result) {
            logger.info(`Manually subscribed WABA ${wabaId} to webhooks`);
            res.json({ success: true, message: 'Successfully subscribed to webhooks' });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to subscribe to webhooks. Please check your access token permissions.'
            });
        }
    } catch (error) {
        logger.error('Subscribe webhooks error:', error);
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
 * Automatically converts short-lived tokens to long-lived tokens
 */
router.post('/messenger/connect', requireAdmin, async (req, res) => {
    try {
        const { pageId, pageName, accessToken } = req.body;

        if (!pageId || !accessToken) {
            return res.status(400).json({ error: 'Page ID and access token are required' });
        }

        // Try to exchange for long-lived token (60 days)
        let finalToken = accessToken;
        let expiresAt = null;

        try {
            const { exchangeForLongLivedToken } = await import('../services/integrations/token-refresh.service.js');
            const result = await exchangeForLongLivedToken(accessToken);
            finalToken = result.accessToken;
            expiresAt = new Date(Date.now() + result.expiresIn * 1000);
            logger.info(`Converted to long-lived token, expires: ${expiresAt}`);
        } catch (tokenError) {
            // If exchange fails, continue with original token (might already be long-lived)
            logger.warn('Token exchange failed, using original token:', tokenError.message);
            // Assume 60 days from now for page tokens
            expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
        }

        // Check if channel already exists
        let channel = await Channel.findOne({
            organization: req.user.organizationId,
            type: 'messenger',
            'messenger.pageId': pageId
        });

        if (channel) {
            // Update existing
            channel.credentials.accessToken = encrypt(finalToken);
            channel.credentials.expiresAt = expiresAt;
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
                    accessToken: encrypt(finalToken),
                    expiresAt: expiresAt
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
                status: channel.status,
                tokenExpiresAt: expiresAt
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
    }).select('name messenger.pageId messenger.pageName status connectedAt settings stats credentials.expiresAt');

    res.json({
        channels: channels.map(c => ({
            ...c.toObject(),
            tokenExpiresAt: c.credentials?.expiresAt,
            credentials: undefined // Don't expose other credentials
        }))
    });
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
    }).select('name instagram.accountId instagram.username instagram.name status connectedAt settings stats credentials.expiresAt');

    res.json({
        channels: channels.map(c => ({
            ...c.toObject(),
            tokenExpiresAt: c.credentials?.expiresAt,
            credentials: undefined // Don't expose other credentials
        }))
    });
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
