import { Router } from 'express';
import { webhookLimiter } from '../middleware/rateLimit.middleware.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Apply webhook rate limiting
router.use(webhookLimiter);

/**
 * WhatsApp webhook verification (GET)
 */
router.get('/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === verifyToken) {
        logger.info('WhatsApp webhook verified');
        return res.status(200).send(challenge);
    }

    logger.warn('WhatsApp webhook verification failed');
    return res.sendStatus(403);
});

/**
 * WhatsApp webhook handler (POST)
 */
router.post('/whatsapp', async (req, res) => {
    try {
        const { body } = req;

        // Acknowledge receipt immediately (Meta requires < 20 seconds)
        res.sendStatus(200);

        // Process webhook asynchronously
        if (body.object === 'whatsapp_business_account') {
            const { processWhatsAppMessage } = await import('../services/messaging/whatsapp.service.js');

            const entries = body.entry || [];

            for (const entry of entries) {
                const changes = entry.changes || [];

                for (const change of changes) {
                    if (change.field === 'messages') {
                        const value = change.value;
                        const messages = value.messages || [];
                        const contacts = value.contacts || [];
                        const metadata = value.metadata;

                        for (const message of messages) {
                            logger.info(`Processing WhatsApp message from ${message.from}`);

                            // Process message with AI
                            try {
                                await processWhatsAppMessage({
                                    phoneNumberId: metadata.phone_number_id,
                                    from: message.from,
                                    message,
                                    contact: contacts.find(c => c.wa_id === message.from)
                                });
                            } catch (err) {
                                logger.error('Message processing failed:', err);
                            }
                        }

                        // Handle status updates
                        const statuses = value.statuses || [];
                        for (const status of statuses) {
                            logger.debug(`Message ${status.id} status: ${status.status}`);
                            // TODO: Update message status in DB
                        }
                    }
                }
            }
        }
    } catch (error) {
        logger.error('WhatsApp webhook error:', error);
        // Still return 200 to prevent Meta from retrying
    }
});

/**
 * Facebook Messenger webhook verification (GET)
 */
router.get('/facebook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Use same verify token for simplicity, or create separate one
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === verifyToken) {
        logger.info('Facebook webhook verified');
        return res.status(200).send(challenge);
    }

    logger.warn('Facebook webhook verification failed');
    return res.sendStatus(403);
});

/**
 * Facebook Messenger webhook handler (POST)
 */
router.post('/facebook', async (req, res) => {
    try {
        const { body } = req;

        // Acknowledge receipt immediately (Meta requires < 20 seconds)
        res.sendStatus(200);

        if (body.object === 'page') {
            const { processMessengerMessage } = await import('../services/messaging/messenger.service.js');

            const entries = body.entry || [];

            for (const entry of entries) {
                const pageId = entry.id;
                const messaging = entry.messaging || [];

                for (const event of messaging) {
                    const senderId = event.sender?.id;
                    const timestamp = event.timestamp;

                    if (event.message || event.postback) {
                        logger.info(`Processing Messenger message from ${senderId}`);

                        try {
                            await processMessengerMessage({
                                pageId,
                                senderId,
                                message: event.message,
                                postback: event.postback,
                                timestamp
                            });
                        } catch (err) {
                            logger.error('Messenger message processing failed:', err);
                        }
                    }

                    // Handle delivery confirmations
                    if (event.delivery) {
                        logger.debug(`Messenger delivery confirmed: ${event.delivery.mids}`);
                    }

                    // Handle read receipts
                    if (event.read) {
                        logger.debug(`Messenger message read at ${event.read.watermark}`);
                    }
                }
            }
        }
    } catch (error) {
        logger.error('Facebook webhook error:', error);
    }
});

export default router;
