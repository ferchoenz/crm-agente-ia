import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User, Conversation, Message, Organization } from '../models/index.js';
import { logger } from '../utils/logger.js';

let io = null;

/**
 * Initialize Socket.IO server
 */
export function initializeSocket(httpServer) {
    const allowedOrigins = [
        process.env.CLIENT_URL || 'http://localhost:5173',
        'https://agentify-chat.com',
        'https://www.agentify-chat.com',
        'http://localhost:5173',
        'http://localhost:3000'
    ];

    io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId)
                .select('name email role organization')
                .lean();

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = user;
            socket.organizationId = user.organization?.toString();

            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        logger.info(`Socket connected: ${socket.user.email}`);

        // Join organization room
        if (socket.organizationId) {
            socket.join(`org:${socket.organizationId}`);
        }

        // Join user-specific room
        socket.join(`user:${socket.user._id}`);

        // Handle joining a conversation room
        socket.on('join:conversation', async (conversationId) => {
            try {
                // Verify user has access to this conversation
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    organization: socket.organizationId
                });

                if (conversation) {
                    socket.join(`conversation:${conversationId}`);
                    socket.emit('joined:conversation', { conversationId });
                    logger.debug(`User ${socket.user.email} joined conversation ${conversationId}`);
                }
            } catch (error) {
                socket.emit('error', { message: 'Failed to join conversation' });
            }
        });

        // Handle leaving a conversation room
        socket.on('leave:conversation', (conversationId) => {
            socket.leave(`conversation:${conversationId}`);
        });

        // Handle sending a message (agent/admin sending)
        socket.on('message:send', async (data) => {
            try {
                const { conversationId, content, type = 'text' } = data;

                // Verify access
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    organization: socket.organizationId
                }).populate('customer channel');

                if (!conversation) {
                    return socket.emit('error', { message: 'Conversation not found' });
                }

                // Create message in DB
                const message = new Message({
                    conversation: conversationId,
                    senderType: 'agent',
                    sender: socket.user._id,
                    senderModel: 'User',
                    type,
                    content,
                    status: 'pending',
                    sentAt: new Date()
                });
                await message.save();

                // Update conversation
                conversation.lastMessage = {
                    content: content.slice(0, 100),
                    senderType: 'agent',
                    sentAt: new Date()
                };
                await conversation.addMessage('agent');
                await conversation.save();

                // Populate sender for response
                const populatedMessage = await Message.findById(message._id)
                    .populate('sender', 'name avatar');

                // Emit to conversation room
                io.to(`conversation:${conversationId}`).emit('message:new', {
                    message: populatedMessage,
                    conversationId
                });

                // Send via WhatsApp/Facebook
                // This will be handled by the channel service
                await sendMessageToChannel(conversation, message);

                // Update message status
                message.status = 'sent';
                await message.save();

                socket.emit('message:sent', { messageId: message._id, status: 'sent' });

            } catch (error) {
                logger.error('Socket message:send error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle typing indicator
        socket.on('typing:start', (conversationId) => {
            socket.to(`conversation:${conversationId}`).emit('typing:update', {
                conversationId,
                user: { id: socket.user._id, name: socket.user.name },
                isTyping: true
            });
        });

        socket.on('typing:stop', (conversationId) => {
            socket.to(`conversation:${conversationId}`).emit('typing:update', {
                conversationId,
                user: { id: socket.user._id, name: socket.user.name },
                isTyping: false
            });
        });

        // Handle AI toggle
        socket.on('ai:toggle', async (data) => {
            try {
                const { conversationId, enabled } = data;

                const conversation = await Conversation.findOneAndUpdate(
                    { _id: conversationId, organization: socket.organizationId },
                    {
                        aiEnabled: enabled,
                        ...(enabled ? {} : { aiPausedAt: new Date(), aiPausedReason: 'Agent disabled' })
                    },
                    { new: true }
                );

                if (conversation) {
                    io.to(`conversation:${conversationId}`).emit('ai:toggled', {
                        conversationId,
                        enabled,
                        by: socket.user.name
                    });
                }
            } catch (error) {
                socket.emit('error', { message: 'Failed to toggle AI' });
            }
        });

        // Handle conversation assignment
        socket.on('conversation:assign', async (data) => {
            try {
                const { conversationId, userId } = data;

                const conversation = await Conversation.findOneAndUpdate(
                    { _id: conversationId, organization: socket.organizationId },
                    { assignedTo: userId || null },
                    { new: true }
                ).populate('assignedTo', 'name avatar');

                if (conversation) {
                    io.to(`org:${socket.organizationId}`).emit('conversation:assigned', {
                        conversationId,
                        assignedTo: conversation.assignedTo
                    });

                    // Notify assigned user
                    if (userId) {
                        io.to(`user:${userId}`).emit('notification', {
                            type: 'assignment',
                            title: 'Nueva conversación asignada',
                            conversationId
                        });
                    }
                }
            } catch (error) {
                socket.emit('error', { message: 'Failed to assign conversation' });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            logger.info(`Socket disconnected: ${socket.user.email}`);
        });
    });

    return io;
}

/**
 * Get Socket.IO instance
 */
export function getIO() {
    return io;
}

/**
 * Emit event to organization
 */
export function emitToOrganization(organizationId, event, data) {
    if (io) {
        io.to(`org:${organizationId}`).emit(event, data);
    }
}

/**
 * Emit event to conversation
 */
export function emitToConversation(conversationId, event, data) {
    if (io) {
        io.to(`conversation:${conversationId}`).emit(event, data);
    }
}

/**
 * Emit new message (called from webhook when customer sends message)
 */
export function emitNewMessage(organizationId, conversationId, message) {
    if (io) {
        logger.info(`[Socket] Emitting new message to org:${organizationId} and convo:${conversationId}`);

        io.to(`org:${organizationId}`).emit('conversation:updated', {
            conversationId,
            lastMessage: message
        });

        io.to(`conversation:${conversationId}`).emit('message:new', {
            message,
            conversationId
        });
    } else {
        logger.warn('[Socket] Failed to emit message: IO not initialized');
    }
}

/**
 * Send message to channel (WhatsApp/Facebook)
 */
async function sendMessageToChannel(conversation, message) {
    try {
        if (conversation.channel?.type === 'whatsapp') {
            const { createWhatsAppService } = await import('./messaging/whatsapp.service.js');
            const whatsapp = await createWhatsAppService(conversation.channel._id);
            await whatsapp.sendTextMessage(conversation.customer.phone, message.content);
        }
        // TODO: Add Facebook Messenger support
    } catch (error) {
        logger.error('Failed to send message to channel:', error);
        throw error;
    }
}
