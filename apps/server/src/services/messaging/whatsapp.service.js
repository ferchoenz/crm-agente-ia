import axios from 'axios';
import crypto from 'crypto';
import { Channel, Customer, Conversation, Message, Organization, Notification } from '../../models/index.js';
import { decrypt } from '../encryption.service.js';
import { logger } from '../../utils/logger.js';
import { createAIAgent } from '../ai/agent.service.js';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

/**
 * WhatsApp Cloud API Service
 */
export class WhatsAppService {
    constructor(channel) {
        this.channel = channel;
        this.phoneNumberId = channel.whatsapp?.phoneNumberId;
        this.accessToken = null;
    }

    /**
     * Initialize with decrypted access token
     */
    async initialize() {
        if (this.channel.credentials?.accessToken?.encrypted) {
            this.accessToken = decrypt(this.channel.credentials.accessToken);
        } else {
            throw new Error('WhatsApp access token not configured');
        }
        return this;
    }

    /**
     * Send a text message
     */
    async sendTextMessage(to, text) {
        try {
            const response = await axios.post(
                `${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to,
                    type: 'text',
                    text: { body: text }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            logger.info(`WhatsApp message sent to ${to}`);
            return response.data;
        } catch (error) {
            logger.error('WhatsApp send error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send an image message
     */
    async sendImageMessage(to, imageUrl, caption = '') {
        try {
            const response = await axios.post(
                `${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to,
                    type: 'image',
                    image: {
                        link: imageUrl,
                        caption
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            logger.error('WhatsApp image send error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send interactive buttons
     */
    async sendButtonMessage(to, bodyText, buttons) {
        try {
            const response = await axios.post(
                `${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to,
                    type: 'interactive',
                    interactive: {
                        type: 'button',
                        body: { text: bodyText },
                        action: {
                            buttons: buttons.map((btn, idx) => ({
                                type: 'reply',
                                reply: {
                                    id: btn.id || `btn_${idx}`,
                                    title: btn.title.slice(0, 20) // Max 20 chars
                                }
                            }))
                        }
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            logger.error('WhatsApp button send error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send a list message
     */
    async sendListMessage(to, headerText, bodyText, buttonText, sections) {
        try {
            const response = await axios.post(
                `${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to,
                    type: 'interactive',
                    interactive: {
                        type: 'list',
                        header: { type: 'text', text: headerText },
                        body: { text: bodyText },
                        action: {
                            button: buttonText,
                            sections
                        }
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            logger.error('WhatsApp list send error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Mark message as read
     */
    async markAsRead(messageId) {
        try {
            await axios.post(
                `${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    status: 'read',
                    message_id: messageId
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error) {
            logger.warn('Failed to mark message as read:', error.message);
        }
    }
}

/**
 * Process incoming WhatsApp webhook message
 */
export async function processWhatsAppMessage(webhookData) {
    const { phoneNumberId, from, message, contact } = webhookData;

    try {
        // Find channel by phone number ID
        const channel = await Channel.findOne({
            'whatsapp.phoneNumberId': phoneNumberId,
            status: 'active'
        }).populate('organization');

        if (!channel) {
            logger.warn(`No channel found for phoneNumberId: ${phoneNumberId}`);
            return;
        }

        const organizationId = channel.organization._id;

        // Find or create customer
        let customer = await Customer.findOne({
            organization: organizationId,
            phone: from
        });

        if (!customer) {
            customer = new Customer({
                organization: organizationId,
                phone: from,
                name: contact?.profile?.name || null,
                source: {
                    channel: 'whatsapp',
                    channelId: channel._id,
                    externalId: from
                },
                stats: {
                    firstContactAt: new Date()
                }
            });
            await customer.save();
            logger.info(`New customer created: ${from}`);
        }

        // Find or create conversation
        let conversation = await Conversation.findOne({
            organization: organizationId,
            customer: customer._id,
            channel: channel._id,
            status: { $in: ['open', 'pending'] }
        });

        if (!conversation) {
            conversation = new Conversation({
                organization: organizationId,
                customer: customer._id,
                channel: channel._id,
                status: 'open',
                aiEnabled: channel.settings?.aiEnabled !== false,
                firstMessageAt: new Date()
            });
            await conversation.save();
        }

        // Extract message content
        let content = '';
        let messageType = 'text';

        if (message.type === 'text') {
            content = message.text.body;
        } else if (message.type === 'image') {
            content = message.image.caption || '[Imagen]';
            messageType = 'image';
        } else if (message.type === 'audio') {
            content = '[Audio]';
            messageType = 'audio';
        } else if (message.type === 'document') {
            content = message.document.filename || '[Documento]';
            messageType = 'document';
        } else if (message.type === 'interactive') {
            // Button or list response
            if (message.interactive.type === 'button_reply') {
                content = message.interactive.button_reply.title;
            } else if (message.interactive.type === 'list_reply') {
                content = message.interactive.list_reply.title;
            }
        }

        // Save incoming message
        const incomingMessage = new Message({
            conversation: conversation._id,
            senderType: 'customer',
            sender: customer._id,
            senderModel: 'Customer',
            type: messageType,
            content,
            externalId: message.id,
            status: 'delivered',
            sentAt: new Date(parseInt(message.timestamp) * 1000)
        });
        await incomingMessage.save();

        // Update conversation
        await conversation.addMessage('customer');
        conversation.lastMessage = {
            content: content.slice(0, 100),
            senderType: 'customer',
            sentAt: new Date()
        };
        await conversation.save();

        // Update customer last contact
        customer.stats.lastContactAt = new Date();
        customer.stats.lastMessageAt = new Date();
        customer.stats.totalMessages = (customer.stats.totalMessages || 0) + 1;
        await customer.save();

        // Process with AI if enabled
        if (conversation.aiEnabled && content && messageType === 'text') {
            await processWithAI(channel, conversation, customer, content);
        }

        // Update channel stats
        channel.stats.messagesReceived = (channel.stats.messagesReceived || 0) + 1;
        channel.lastMessageAt = new Date();
        await channel.save();

        return { success: true, conversationId: conversation._id };

    } catch (error) {
        logger.error('WhatsApp message processing error:', error);
        throw error;
    }
}

/**
 * Process message with AI and send response
 */
async function processWithAI(channel, conversation, customer, content) {
    try {
        // Initialize WhatsApp service
        const whatsapp = new WhatsAppService(channel);
        await whatsapp.initialize();

        // Initialize AI agent
        const agent = await createAIAgent(channel.organization._id);

        // Generate AI response
        const aiResponse = await agent.generateResponse(
            conversation._id,
            content,
            customer._id
        );

        // Check if should handoff to human
        if (aiResponse.shouldHandoff) {
            conversation.aiEnabled = false;
            conversation.aiPausedAt = new Date();
            conversation.aiPausedReason = 'Customer requested human';
            conversation.priority = 'high';
            await conversation.save();

            // Create notification for team
            try {
                await Notification.create({
                    organization: channel.organization._id,
                    type: 'handoff_request',
                    title: '🙋 Solicitud de Atención Humana',
                    message: `${customer.name || customer.phone} desea hablar con un asesor`,
                    relatedConversation: conversation._id,
                    relatedCustomer: customer._id,
                    priority: 'high'
                });
                logger.info(`Handoff notification created for conversation ${conversation._id}`);
            } catch (notifError) {
                logger.error('Failed to create handoff notification:', notifError);
            }
        }

        // Send response via WhatsApp
        await whatsapp.sendTextMessage(customer.phone, aiResponse.content);

        // Save AI message
        const aiMessage = new Message({
            conversation: conversation._id,
            senderType: 'ai',
            type: 'text',
            content: aiResponse.content,
            status: 'sent',
            ai: {
                isAiGenerated: true,
                model: 'gpt-4o-mini',
                tokensUsed: aiResponse.tokensUsed,
                processingTime: aiResponse.processingTime,
                intent: aiResponse.intent
            },
            sentAt: new Date()
        });
        await aiMessage.save();

        // Update conversation
        await conversation.addMessage('ai');
        conversation.lastMessage = {
            content: aiResponse.content.slice(0, 100),
            senderType: 'ai',
            sentAt: new Date()
        };
        await conversation.save();

        // Update lead score using signal detection
        try {
            const { detectBuyingSignals, updateCustomerLeadScore, processCustomerForInsights } = await import('../ai/customerInsights.service.js');
            const signals = detectBuyingSignals(content);
            await updateCustomerLeadScore(customer._id, signals);

            // Trigger AI summary generation if enough messages
            processCustomerForInsights(customer._id, channel.organization._id);
        } catch (scoreError) {
            logger.error('Error updating lead score:', scoreError);
        }

        // Update org usage
        const org = await Organization.findById(channel.organization._id);
        org.usage.messagesCount = (org.usage.messagesCount || 0) + 1;
        org.usage.tokensUsed = (org.usage.tokensUsed || 0) + (aiResponse.tokensUsed || 0);
        await org.save();

        // Update channel stats
        channel.stats.messagesSent = (channel.stats.messagesSent || 0) + 1;
        await channel.save();

        // Mark original message as read
        // await whatsapp.markAsRead(originalMessageId);

    } catch (error) {
        logger.error('AI processing error:', error);
        // Don't throw - we don't want to fail the whole webhook
    }
}

/**
 * Verify WhatsApp webhook signature
 */
export function verifyWebhookSignature(payload, signature, appSecret) {
    const expectedSignature = crypto
        .createHmac('sha256', appSecret)
        .update(payload)
        .digest('hex');

    return `sha256=${expectedSignature}` === signature;
}

/**
 * Create WhatsApp service for a channel
 */
export async function createWhatsAppService(channelId) {
    const channel = await Channel.findById(channelId);
    if (!channel || channel.type !== 'whatsapp') {
        throw new Error('WhatsApp channel not found');
    }

    const service = new WhatsAppService(channel);
    await service.initialize();
    return service;
}
