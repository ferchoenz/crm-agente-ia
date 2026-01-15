import { Router } from 'express';
import { authenticate, requireAdmin, requireAgent } from '../middleware/auth.middleware.js';
import { tenantIsolation, injectOrganization } from '../middleware/tenant.middleware.js';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantIsolation);

// Dashboard (any authenticated user)
router.get('/dashboard', async (req, res) => {
    const { Customer, Conversation, Message, Channel } = await import('../models/index.js');

    const [
        totalCustomers,
        totalConversations,
        openConversations,
        activeChannels,
        todayMessages
    ] = await Promise.all([
        Customer.countDocuments(req.tenantFilter),
        Conversation.countDocuments(req.tenantFilter),
        Conversation.countDocuments({ ...req.tenantFilter, status: 'open' }),
        Channel.countDocuments({ ...req.tenantFilter, status: 'active' }),
        Message.countDocuments({
            ...req.tenantFilter,
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        })
    ]);

    res.json({
        stats: {
            totalCustomers,
            totalConversations,
            openConversations,
            activeChannels,
            todayMessages
        }
    });
});

// Organization settings (admin only)
router.get('/settings', requireAdmin, async (req, res) => {
    const { Organization } = await import('../models/index.js');
    const org = await Organization.findById(req.user.organizationId)
        .select('name email phone logo settings aiConfig plan');
    res.json(org);
});

router.put('/settings', requireAdmin, injectOrganization, async (req, res) => {
    const { Organization } = await import('../models/index.js');
    const { settings, aiConfig } = req.body;

    const org = await Organization.findByIdAndUpdate(
        req.user.organizationId,
        {
            $set: {
                ...(settings && { settings }),
                ...(aiConfig && { aiConfig })
            }
        },
        { new: true }
    ).select('name settings aiConfig');

    res.json(org);
});

// Customers CRUD
router.get('/customers', requireAgent, async (req, res) => {
    const { Customer } = await import('../models/index.js');
    const { page = 1, limit = 20, search, stage, tag } = req.query;

    const query = { ...req.tenantFilter };

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }
    if (stage) query.stage = stage;
    if (tag) query.tags = tag;

    const [customers, total] = await Promise.all([
        Customer.find(query)
            .sort({ 'stats.lastContactAt': -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit)),
        Customer.countDocuments(query)
    ]);

    res.json({
        customers,
        pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
});

router.get('/customers/:id', requireAgent, async (req, res) => {
    const { Customer, Conversation } = await import('../models/index.js');

    const customer = await Customer.findOne({
        _id: req.params.id,
        ...req.tenantFilter
    });

    if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
    }

    const conversations = await Conversation.find({
        customer: customer._id,
        ...req.tenantFilter
    }).sort({ lastMessageAt: -1 }).limit(10);

    res.json({ customer, conversations });
});

// Create customer
router.post('/customers', requireAgent, injectOrganization, async (req, res) => {
    const { Customer } = await import('../models/index.js');
    const { name, phone, email, tags, notes, stage } = req.body;

    const customer = new Customer({
        organization: req.user.organizationId,
        name,
        phone,
        email,
        tags: tags || [],
        notes,
        stage: stage || 'new',
        source: { channel: 'manual' },
        stats: { firstContactAt: new Date() }
    });

    await customer.save();
    res.status(201).json(customer);
});

// Update customer
router.put('/customers/:id', requireAgent, async (req, res) => {
    const { Customer } = await import('../models/index.js');
    const { name, phone, email, tags, notes, stage, leadScore } = req.body;

    const customer = await Customer.findOneAndUpdate(
        { _id: req.params.id, ...req.tenantFilter },
        {
            $set: {
                ...(name && { name }),
                ...(phone && { phone }),
                ...(email && { email }),
                ...(tags && { tags }),
                ...(notes !== undefined && { notes }),
                ...(stage && { stage }),
                ...(leadScore !== undefined && { 'leadScore.score': leadScore })
            }
        },
        { new: true }
    );

    if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
});

// Delete customer
router.delete('/customers/:id', requireAdmin, async (req, res) => {
    const { Customer, Conversation, Message } = await import('../models/index.js');

    const customer = await Customer.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
    }

    // Delete related conversations and messages
    const conversations = await Conversation.find({ customer: customer._id });
    for (const conv of conversations) {
        await Message.deleteMany({ conversation: conv._id });
    }
    await Conversation.deleteMany({ customer: customer._id });
    await customer.deleteOne();

    res.json({ message: 'Customer deleted successfully' });
});

// Conversations
router.get('/conversations', requireAgent, async (req, res) => {
    const { Conversation, Message } = await import('../models/index.js');
    const { status, channelId, assignedTo, page = 1, limit = 100 } = req.query;

    const query = { ...req.tenantFilter };

    // Filter by status - default to open and pending conversations
    if (status) {
        query.status = { $in: status.split(',') };
    }

    if (channelId) query.channel = channelId;
    if (assignedTo) query.assignedTo = assignedTo;

    const conversations = await Conversation.find(query)
        .populate('customer', 'name phone avatar email')
        .populate('channel', 'type name')
        .populate('assignedTo', 'name avatar')
        .populate({
            path: 'lastMessage',
            select: 'content sentAt senderType'
        })
        .sort({ lastMessageAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean();

    // Add unreadCount for each conversation
    for (const conv of conversations) {
        conv.unreadCount = await Message.countDocuments({
            conversation: conv._id,
            senderType: 'customer',
            read: false
        });
    }

    res.json({ conversations });
});

router.get('/conversations/:id', requireAgent, async (req, res) => {
    const { Conversation, Message } = await import('../models/index.js');

    const conversation = await Conversation.findOne({
        _id: req.params.id,
        ...req.tenantFilter
    })
        .populate('customer')
        .populate('channel', 'type name')
        .populate('assignedTo', 'name avatar');

    if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await Message.find({ conversation: conversation._id })
        .sort({ createdAt: 1 })
        .limit(100);

    // Mark as read
    await conversation.markAsRead();

    res.json({ conversation, messages });
});

// Send message from agent in manual mode
router.post('/conversations/:id/messages', requireAgent, async (req, res) => {
    const { Message, Conversation, Channel } = await import('../models/index.js');
    const { content } = req.body;

    try {
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            ...req.tenantFilter
        }).populate('channel');

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Create message
        const message = new Message({
            organization: req.user.organization,
            conversation: conversation._id,
            customer: conversation.customer,
            channel: conversation.channel._id,
            content,
            senderType: 'human', // FIXED: was 'agent', must be 'human'
            sentBy: req.user._id,
            sentAt: new Date(),
            delivered: true,
            read: false
        });

        await message.save();

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // Send via messaging service
        try {
            if (conversation.channel.type === 'whatsapp') {
                const { createWhatsAppService } = await import('../services/messaging/whatsapp.service.js');
                const whatsappService = await createWhatsAppService(conversation.channel._id);
                await whatsappService.sendTextMessage(
                    conversation.customer.toString(),
                    content
                );
            } else if (conversation.channel.type === 'messenger') {
                const { createMessengerService } = await import('../services/messaging/messenger.service.js');
                const messengerService = await createMessengerService(conversation.channel._id);
                await messengerService.sendTextMessage(
                    conversation.customer.toString(),
                    content
                );
            }
        } catch (sendError) {
            console.error('Error sending via channel:', sendError);
            // Don't fail the request - message is saved in DB
        }

        res.json({ message });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
});

// Products CRUD
router.get('/products', requireAgent, async (req, res) => {
    const { Product } = await import('../models/index.js');
    const { category, available, search, page = 1, limit = 20 } = req.query;

    const query = { ...req.tenantFilter, status: 'active' };
    if (category) query.category = category;
    if (available !== undefined) query.available = available === 'true';
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    const [products, total] = await Promise.all([
        Product.find(query)
            .sort({ sortOrder: 1, name: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit)),
        Product.countDocuments(query)
    ]);

    res.json({ products, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
});

router.post('/products', requireAdmin, injectOrganization, async (req, res) => {
    const { Product } = await import('../models/index.js');
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
});

router.put('/products/:id', requireAdmin, async (req, res) => {
    const { Product } = await import('../models/index.js');
    const product = await Product.findOneAndUpdate(
        { _id: req.params.id, ...req.tenantFilter },
        { $set: req.body },
        { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
});

router.delete('/products/:id', requireAdmin, async (req, res) => {
    const { Product } = await import('../models/index.js');
    const result = await Product.deleteOne({ _id: req.params.id, ...req.tenantFilter });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
});

// Channels
router.get('/channels', requireAdmin, async (req, res) => {
    const { Channel } = await import('../models/index.js');
    const channels = await Channel.find(req.tenantFilter);
    res.json({ channels });
});

// Team members (Users in org)
router.get('/team', requireAdmin, async (req, res) => {
    const { User } = await import('../models/index.js');
    const users = await User.find({ organization: req.user.organizationId })
        .select('name email role active avatar lastLogin');
    res.json({ users });
});

router.post('/team', requireAdmin, async (req, res) => {
    const { User } = await import('../models/index.js');
    const { email, name, password, role } = req.body;

    const user = new User({
        organization: req.user.organizationId,
        email,
        name,
        password,
        role: role || 'agent'
    });

    await user.save();
    res.status(201).json({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
    });
});

// Knowledge Base
import {
    listDocuments,
    getDocument,
    uploadDocument,
    createTextDocument,
    removeDocument,
    toggleActive,
    getDocumentStatus,
    uploadMiddleware
} from '../controllers/admin/knowledge.controller.js';

router.get('/knowledge', requireAdmin, listDocuments);
router.get('/knowledge/:id', requireAdmin, getDocument);
router.get('/knowledge/:id/status', requireAdmin, getDocumentStatus);
router.post('/knowledge/upload', requireAdmin, uploadMiddleware, uploadDocument);
router.post('/knowledge/text', requireAdmin, createTextDocument);
router.patch('/knowledge/:id/toggle', requireAdmin, toggleActive);
router.delete('/knowledge/:id', requireAdmin, removeDocument);

// Notifications
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
} from '../controllers/admin/notification.controller.js';

router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadCount);
router.patch('/notifications/:id/read', markAsRead);
router.patch('/notifications/mark-all-read', markAllAsRead);

export default router;


