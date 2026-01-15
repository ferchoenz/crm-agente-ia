import axios from 'axios';
import crypto from 'crypto';
import { Channel, Customer, Conversation, Message, Organization } from '../../models/index.js';
import { decrypt } from '../encryption.service.js';
import { logger } from '../../utils/logger.js';
import { createAIAgent } from '../ai/agent.service.js';
import { emitNewMessage } from '../socket.service.js';

const MESSENGER_API_URL = 'https://graph.facebook.com/v18.0';

/**
 * Facebook Messenger Service
 */
export class MessengerService {
    constructor(channel) {
        this.channel = channel;
        this.pageId = channel.messenger?.pageId;
        this.accessToken = null;
    }

    /**
     * Initialize with decrypted access token
     */
    async initialize() {
        if (this.channel.credentials?.accessToken?.encrypted) {
            this.accessToken = decrypt(this.channel.credentials.accessToken);
        } else {
            throw new Error('Messenger access token not configured');
        }
        return this;
    }

    /**
     * Send a text message (handles long messages by splitting)
     */
    async sendTextMessage(recipientId, text) {
        const MAX_LENGTH = 2000;

        // Split long messages into chunks
        if (text.length > MAX_LENGTH) {
            const chunks = this.splitMessage(text, MAX_LENGTH);
            for (const chunk of chunks) {
                await this._sendSingleMessage(recipientId, chunk);
                // Small delay between messages
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            return { success: true, chunks: chunks.length };
        }

        return this._sendSingleMessage(recipientId, text);
    }

    /**
     * Split message into chunks at sentence boundaries
     */
    splitMessage(text, maxLength) {
        const chunks = [];
        let remaining = text;

        while (remaining.length > 0) {
            if (remaining.length <= maxLength) {
                chunks.push(remaining);
                break;
            }

            // Find a good break point (sentence end or space)
            let breakPoint = remaining.lastIndexOf('. ', maxLength);
            if (breakPoint < maxLength / 2) {
                breakPoint = remaining.lastIndexOf(' ', maxLength);
            }
            if (breakPoint < maxLength / 2) {
                breakPoint = maxLength;
            }

            chunks.push(remaining.slice(0, breakPoint + 1).trim());
            remaining = remaining.slice(breakPoint + 1).trim();
        }

        return chunks;
    }

    /**
     * Send a single message to Messenger API
     */
    async _sendSingleMessage(recipientId, text) {
        try {
            const response = await axios.post(
                `${MESSENGER_API_URL}/me/messages`,
                {
                    recipient: { id: recipientId },
                    message: { text },
                    messaging_type: 'RESPONSE'
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    params: {
                        access_token: this.accessToken
                    }
                }
            );

            logger.info(`Messenger message sent to ${recipientId}`);
            return response.data;
        } catch (error) {
            const fbError = error.response?.data?.error;
            if (fbError) {
                logger.error(`Messenger send error: [${fbError.code}] ${fbError.message} - ${fbError.error_subcode || ''}`);
            } else {
                logger.error('Messenger send error:', error.message);
            }
            throw error;
        }
    }

    /**
     * Send an image message
     */
    async sendImageMessage(recipientId, imageUrl) {
        try {
            const response = await axios.post(
                `${MESSENGER_API_URL}/me/messages`,
                {
                    recipient: { id: recipientId },
                    message: {
                        attachment: {
                            type: 'image',
                            payload: {
                                url: imageUrl,
                                is_reusable: true
                            }
                        }
                    },
                    messaging_type: 'RESPONSE'
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    params: {
                        access_token: this.accessToken
                    }
                }
            );

            return response.data;
        } catch (error) {
            logger.error('Messenger image send error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send quick reply buttons
     */
    async sendQuickReplies(recipientId, text, quickReplies) {
        try {
            const response = await axios.post(
                `${MESSENGER_API_URL}/me/messages`,
                {
                    recipient: { id: recipientId },
                    message: {
                        text,
                        quick_replies: quickReplies.map(qr => ({
                            content_type: 'text',
                            title: qr.title.slice(0, 20), // Max 20 chars
                            payload: qr.payload || qr.title
                        }))
                    },
                    messaging_type: 'RESPONSE'
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    params: {
                        access_token: this.accessToken
                    }
                }
            );

            return response.data;
        } catch (error) {
            logger.error('Messenger quick reply send error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send button template
     */
    async sendButtonTemplate(recipientId, text, buttons) {
        try {
            const response = await axios.post(
                `${MESSENGER_API_URL}/me/messages`,
                {
                    recipient: { id: recipientId },
                    message: {
                        attachment: {
                            type: 'template',
                            payload: {
                                template_type: 'button',
                                text,
                                buttons: buttons.slice(0, 3).map(btn => ({
                                    type: btn.type || 'postback',
                                    title: btn.title.slice(0, 20),
                                    payload: btn.payload || btn.title,
                                    ...(btn.url && { type: 'web_url', url: btn.url })
                                }))
                            }
                        }
                    },
                    messaging_type: 'RESPONSE'
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    params: {
                        access_token: this.accessToken
                    }
                }
            );

            return response.data;
        } catch (error) {
            logger.error('Messenger button template send error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send generic template (carousel)
     */
    async sendGenericTemplate(recipientId, elements) {
        try {
            const response = await axios.post(
                `${MESSENGER_API_URL}/me/messages`,
                {
                    recipient: { id: recipientId },
                    message: {
                        attachment: {
                            type: 'template',
                            payload: {
                                template_type: 'generic',
                                elements: elements.slice(0, 10).map(el => ({
                                    title: el.title,
                                    subtitle: el.subtitle,
                                    image_url: el.imageUrl,
                                    buttons: el.buttons?.slice(0, 3).map(btn => ({
                                        type: btn.type || 'postback',
                                        title: btn.title,
                                        payload: btn.payload,
                                        ...(btn.url && { type: 'web_url', url: btn.url })
                                    }))
                                }))
                            }
                        }
                    },
                    messaging_type: 'RESPONSE'
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    params: {
                        access_token: this.accessToken
                    }
                }
            );

            return response.data;
        } catch (error) {
            logger.error('Messenger generic template send error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Mark message as seen
     */
    async markAsSeen(recipientId) {
        try {
            await axios.post(
                `${MESSENGER_API_URL}/me/messages`,
                {
                    recipient: { id: recipientId },
                    sender_action: 'mark_seen'
                },
                {
                    params: {
                        access_token: this.accessToken
                    }
                }
            );
        } catch (error) {
            logger.warn('Failed to mark message as seen:', error.message);
        }
    }

    /**
     * Send typing indicator
     */
    async sendTypingOn(recipientId) {
        try {
            await axios.post(
                `${MESSENGER_API_URL}/me/messages`,
                {
                    recipient: { id: recipientId },
                    sender_action: 'typing_on'
                },
                {
                    params: {
                        access_token: this.accessToken
                    }
                }
            );
        } catch (error) {
            logger.warn('Failed to send typing indicator:', error.message);
        }
    }

    /**
     * Get user profile info
     */
    async getUserProfile(userId) {
        try {
            const response = await axios.get(
                `${MESSENGER_API_URL}/${userId}`,
                {
                    params: {
                        fields: 'first_name,last_name,profile_pic',
                        access_token: this.accessToken
                    }
                }
            );
            return response.data;
        } catch (error) {
            logger.warn('Failed to get user profile:', error.message);
            return null;
        }
    }
}

/**
 * Process incoming Messenger webhook message
 */
export async function processMessengerMessage(webhookData) {
    const { pageId, senderId, message, postback, timestamp } = webhookData;

    try {
        // Find channel by page ID
        const channel = await Channel.findOne({
            'messenger.pageId': pageId,
            type: 'messenger',
            status: 'active'
        }).populate('organization');

        if (!channel) {
            logger.warn(`No channel found for pageId: ${pageId}`);
            return;
        }

        const organizationId = channel.organization._id;

        // Initialize Messenger service
        const messenger = new MessengerService(channel);
        await messenger.initialize();

        // Get user profile for name
        const userProfile = await messenger.getUserProfile(senderId);

        // Find or create customer
        let customer = await Customer.findOne({
            organization: organizationId,
            'source.externalId': senderId,
            'source.channel': 'messenger'
        });

        if (!customer) {
            customer = new Customer({
                organization: organizationId,
                name: userProfile ? `${userProfile.first_name} ${userProfile.last_name}`.trim() : null,
                source: {
                    channel: 'messenger',
                    channelId: channel._id,
                    externalId: senderId
                },
                stats: {
                    firstContactAt: new Date()
                }
            });
            await customer.save();
            logger.info(`New Messenger customer created: ${senderId}`);
        } else if (userProfile && !customer.name) {
            // Update name if we got it from profile
            customer.name = `${userProfile.first_name} ${userProfile.last_name}`.trim();
            await customer.save();
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

        if (postback) {
            // Handle postback (button click)
            content = postback.title || postback.payload;
            messageType = 'postback';
        } else if (message) {
            if (message.text) {
                content = message.text;
            } else if (message.attachments) {
                const attachment = message.attachments[0];
                if (attachment.type === 'image') {
                    content = '[Imagen]';
                    messageType = 'image';
                } else if (attachment.type === 'audio') {
                    content = '[Audio]';
                    messageType = 'audio';
                } else if (attachment.type === 'video') {
                    content = '[Video]';
                    messageType = 'video';
                } else if (attachment.type === 'file') {
                    content = '[Archivo]';
                    messageType = 'document';
                } else if (attachment.type === 'location') {
                    content = `[Ubicación: ${attachment.payload.coordinates?.lat}, ${attachment.payload.coordinates?.long}]`;
                    messageType = 'location';
                }
            } else if (message.quick_reply) {
                content = message.quick_reply.payload;
            }
        }

        // Mark as seen
        await messenger.markAsSeen(senderId);

        // Save incoming message
        const incomingMessage = new Message({
            conversation: conversation._id,
            senderType: 'customer',
            sender: customer._id,
            senderModel: 'Customer',
            type: messageType,
            content,
            externalId: message?.mid,
            status: 'delivered',
            sentAt: new Date(timestamp)
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

        // Emit to frontend via WebSocket
        emitNewMessage(organizationId, conversation._id, incomingMessage);

        // Update customer last contact
        customer.stats.lastContactAt = new Date();
        customer.stats.lastMessageAt = new Date();
        customer.stats.totalMessages = (customer.stats.totalMessages || 0) + 1;
        await customer.save();

        // Process with AI if enabled
        if (conversation.aiEnabled && content && messageType === 'text') {
            await processWithAI(channel, messenger, conversation, customer, senderId, content);
        }

        // Update channel stats
        channel.stats.messagesReceived = (channel.stats.messagesReceived || 0) + 1;
        channel.lastMessageAt = new Date();
        await channel.save();

        return { success: true, conversationId: conversation._id };

    } catch (error) {
        logger.error('Messenger message processing error:', error);
        throw error;
    }
}

/**
 * Process message with AI and send response
 */
async function processWithAI(channel, messenger, conversation, customer, senderId, content) {
    try {
        // Send typing indicator
        await messenger.sendTypingOn(senderId);

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
        }

        // Send response via Messenger
        await messenger.sendTextMessage(senderId, aiResponse.content);

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

        // Emit AI response to frontend via WebSocket
        emitNewMessage(channel.organization._id, conversation._id, aiMessage);

        // Update lead score
        await agent.updateLeadScore(
            customer._id,
            aiResponse.intent,
            conversation.stats.totalMessages
        );

        // Update org usage
        const org = await Organization.findById(channel.organization._id);
        org.usage.messagesCount = (org.usage.messagesCount || 0) + 1;
        org.usage.tokensUsed = (org.usage.tokensUsed || 0) + (aiResponse.tokensUsed || 0);
        await org.save();

        // Update channel stats
        channel.stats.messagesSent = (channel.stats.messagesSent || 0) + 1;
        await channel.save();

    } catch (error) {
        logger.error('AI processing error for Messenger:', error);
    }
}

/**
 * Verify Messenger webhook signature
 */
export function verifyMessengerSignature(payload, signature, appSecret) {
    if (!signature) return false;

    const sigParts = signature.split('=');
    if (sigParts[0] !== 'sha256') return false;

    const expectedSignature = crypto
        .createHmac('sha256', appSecret)
        .update(payload)
        .digest('hex');

    return sigParts[1] === expectedSignature;
}

/**
 * Create Messenger service for a channel
 */
export async function createMessengerService(channelId) {
    const channel = await Channel.findById(channelId);
    if (!channel || channel.type !== 'messenger') {
        throw new Error('Messenger channel not found');
    }

    const service = new MessengerService(channel);
    await service.initialize();
    return service;
}
