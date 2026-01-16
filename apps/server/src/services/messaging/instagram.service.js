import axios from 'axios';
import { Channel, Customer, Conversation, Message, Organization, Notification } from '../../models/index.js';
import { decrypt } from '../encryption.service.js';
import { logger } from '../../utils/logger.js';
import { createAIAgent } from '../ai/agent.service.js';

const INSTAGRAM_API_URL = 'https://graph.facebook.com/v18.0';

/**
 * Instagram Messaging Service
 */
export class InstagramService {
    constructor(channel) {
        this.channel = channel;
        this.instagramAccountId = channel.instagram?.accountId;
        this.accessToken = null;
    }

    // Initialize with decrypted access token
    async initialize() {
        if (this.channel.credentials?.accessToken) {
            this.accessToken = decrypt(this.channel.credentials.accessToken);
        }

        if (!this.accessToken) {
            throw new Error('Instagram access token not configured');
        }

        return this;
    }

    // Send a text message
    async sendTextMessage(recipientId, text) {
        try {
            const response = await axios.post(
                `${INSTAGRAM_API_URL}/${this.instagramAccountId}/messages`,
                {
                    recipient: {
                        id: recipientId
                    },
                    message: {
                        text
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            logger.info(`Instagram message sent to ${recipientId}: ${response.data.message_id}`);
            return response.data;
        } catch (error) {
            logger.error('Instagram send message error:', error.response?.data || error.message);
            throw error;
        }
    }

    // Send an image message
    async sendImageMessage(recipientId, imageUrl) {
        try {
            const response = await axios.post(
                `${INSTAGRAM_API_URL}/${this.instagramAccountId}/messages`,
                {
                    recipient: {
                        id: recipientId
                    },
                    message: {
                        attachment: {
                            type: 'image',
                            payload: {
                                url: imageUrl,
                                is_reusable: true
                            }
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
            logger.error('Instagram send image error:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get user profile info
    async getUserProfile(userId) {
        try {
            const response = await axios.get(
                `${INSTAGRAM_API_URL}/${userId}`,
                {
                    params: {
                        fields: 'name,username,profile_pic',
                        access_token: this.accessToken
                    }
                }
            );

            return response.data;
        } catch (error) {
            logger.error('Instagram get profile error:', error.response?.data || error.message);
            return null;
        }
    }
}

/**
 * Process incoming Instagram webhook message
 */
export async function processInstagramMessage(webhookData) {
    const { instagramAccountId, senderId, message, timestamp } = webhookData;

    try {
        // Find channel by Instagram account ID
        const channel = await Channel.findOne({
            'instagram.accountId': instagramAccountId,
            status: 'active'
        });

        if (!channel) {
            logger.warn(`No active Instagram channel found for account ${instagramAccountId}`);
            return;
        }

        // Get organization
        const organization = await Organization.findById(channel.organization);
        if (!organization || !organization.active) {
            logger.warn(`Organization not active for Instagram channel ${channel._id}`);
            return;
        }

        // Initialize Instagram service
        const instagram = new InstagramService(channel);
        await instagram.initialize();

        // Get or create customer
        let customer = await Customer.findOne({
            organization: channel.organization,
            'instagram.userId': senderId
        });

        if (!customer) {
            // Get profile info
            const profile = await instagram.getUserProfile(senderId);

            customer = new Customer({
                organization: channel.organization,
                instagram: {
                    userId: senderId,
                    username: profile?.username || null
                },
                name: profile?.name || `Instagram User ${senderId.slice(-6)}`,
                avatar: profile?.profile_pic || null,
                source: 'instagram',
                metadata: {}
            });
            await customer.save();

            logger.info(`New Instagram customer created: ${customer.name}`);
        }

        // Get or create conversation
        let conversation = await Conversation.findOne({
            organization: channel.organization,
            customer: customer._id,
            channel: channel._id,
            status: { $in: ['open', 'pending'] }
        }).sort({ createdAt: -1 });

        if (!conversation) {
            conversation = new Conversation({
                organization: channel.organization,
                customer: customer._id,
                channel: channel._id,
                channelType: 'instagram',
                status: 'open',
                aiEnabled: channel.settings?.aiEnabled ?? true
            });
            await conversation.save();

            logger.info(`New Instagram conversation created: ${conversation._id}`);
        }

        // Extract message content
        let content = '';
        let messageType = 'text';
        let mediaUrl = null;

        if (message.text) {
            content = message.text;
        } else if (message.attachments) {
            const attachment = message.attachments[0];
            messageType = attachment.type || 'media';
            mediaUrl = attachment.payload?.url;
            content = `[${messageType}]`;
        }

        // Save incoming message
        const incomingMessage = new Message({
            organization: channel.organization,
            conversation: conversation._id,
            senderType: 'customer',
            sender: customer._id,
            senderModel: 'Customer',
            content,
            type: messageType,
            media: mediaUrl ? [{ url: mediaUrl, type: messageType }] : [],
            channel: channel._id,
            channelType: 'instagram',
            externalId: message.mid,
            status: 'delivered'
        });
        await incomingMessage.save();

        // Update conversation
        conversation.lastMessage = incomingMessage._id;
        conversation.lastMessageAt = new Date();
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        await conversation.save();

        // Update channel stats
        channel.stats.messagesReceived = (channel.stats.messagesReceived || 0) + 1;
        channel.lastMessageAt = new Date();
        await channel.save();

        // Process with AI if enabled
        if (conversation.aiEnabled && channel.settings?.aiEnabled) {
            await processWithAI(channel, instagram, conversation, customer, senderId, content);
        }

        return {
            success: true,
            customer,
            conversation,
            message: incomingMessage
        };
    } catch (error) {
        logger.error('Instagram message processing error:', error);
        throw error;
    }
}

/**
 * Process message with AI and send response
 */
async function processWithAI(channel, instagram, conversation, customer, senderId, content) {
    try {
        const agent = await createAIAgent(channel.organization.toString());
        if (!agent) {
            logger.warn('AI Agent not available for organization');
            return;
        }

        // Process message
        const result = await agent.processMessage({
            content,
            conversationId: conversation._id.toString(),
            customerId: customer._id.toString(),
            customerName: customer.name
        });

        // Send AI response
        if (result.response) {
            await instagram.sendTextMessage(senderId, result.response);

            // Save AI message
            const aiMessage = new Message({
                organization: channel.organization,
                conversation: conversation._id,
                senderType: 'ai',
                content: result.response,
                type: 'text',
                channel: channel._id,
                channelType: 'instagram',
                status: 'sent',
                metadata: {
                    intent: result.intent,
                    confidence: result.confidence
                }
            });
            await aiMessage.save();

            // Update conversation
            conversation.lastMessage = aiMessage._id;
            conversation.lastMessageAt = new Date();
            await conversation.save();

            // Update channel stats
            channel.stats.messagesSent = (channel.stats.messagesSent || 0) + 1;
            await channel.save();

            logger.info(`AI responded on Instagram to ${customer.name}: ${result.response.substring(0, 50)}...`);
        }

        // Check if human handoff requested
        if (result.intent === 'human_handoff' || result.requiresHuman) {
            conversation.aiEnabled = false;
            conversation.status = 'pending';
            conversation.priority = 'high';
            await conversation.save();

            // Create notification for team
            try {
                await Notification.create({
                    organization: channel.organization,
                    type: 'handoff_request',
                    title: '🙋 Solicitud de Atención Humana',
                    message: `${customer.name || 'Cliente de Instagram'} desea hablar con un asesor`,
                    relatedConversation: conversation._id,
                    relatedCustomer: customer._id,
                    priority: 'high'
                });
            } catch (notifError) {
                logger.error('Failed to create handoff notification:', notifError);
            }

            logger.info(`Human handoff requested for Instagram conversation ${conversation._id}`);
        }
    } catch (error) {
        logger.error('Instagram AI processing error:', error);
    }
}

/**
 * Create Instagram service for a channel
 */
export async function createInstagramService(channelId) {
    const channel = await Channel.findById(channelId);
    if (!channel || channel.type !== 'instagram') {
        throw new Error('Instagram channel not found');
    }

    const service = new InstagramService(channel);
    await service.initialize();
    return service;
}
