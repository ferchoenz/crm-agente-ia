import { Organization, User, Channel, Customer, Conversation } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';
import { createOrganization } from '../services/setup.service.js';
import { PLANS, ROLES } from '../config/constants.js';

/**
 * Get all organizations (Super Admin only)
 */
export const getOrganizations = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        search,
        plan,
        active,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { slug: { $regex: search, $options: 'i' } }
        ];
    }

    if (plan) query.plan = plan;
    if (active !== undefined) query.active = active === 'true';

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [organizations, total] = await Promise.all([
        Organization.find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean(),
        Organization.countDocuments(query)
    ]);

    // Get stats for each org
    const orgsWithStats = await Promise.all(
        organizations.map(async (org) => {
            const [usersCount, channelsCount, customersCount, conversationsCount] = await Promise.all([
                User.countDocuments({ organization: org._id }),
                Channel.countDocuments({ organization: org._id }),
                Customer.countDocuments({ organization: org._id }),
                Conversation.countDocuments({ organization: org._id })
            ]);

            return {
                ...org,
                stats: {
                    users: usersCount,
                    channels: channelsCount,
                    customers: customersCount,
                    conversations: conversationsCount
                }
            };
        })
    );

    res.json({
        organizations: orgsWithStats,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

/**
 * Get single organization
 */
export const getOrganization = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const organization = await Organization.findById(id);

    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
    }

    // Get detailed stats
    const [users, channels, customers, conversations] = await Promise.all([
        User.find({ organization: id }).select('name email role active lastLogin'),
        Channel.find({ organization: id }).select('type name status connectedAt'),
        Customer.countDocuments({ organization: id }),
        Conversation.countDocuments({ organization: id })
    ]);

    res.json({
        organization,
        stats: {
            users,
            channels,
            customersCount: customers,
            conversationsCount: conversations
        }
    });
});

/**
 * Create new organization
 */
export const createOrg = asyncHandler(async (req, res) => {
    const {
        name,
        email,
        phone,
        adminEmail,
        adminPassword,
        adminName,
        plan = PLANS.FREE
    } = req.body;

    if (!name || !email || !adminPassword) {
        return res.status(400).json({
            error: 'Name, email, and admin password are required'
        });
    }

    const result = await createOrganization({
        name,
        email,
        phone,
        adminEmail: adminEmail || email,
        adminPassword,
        adminName: adminName || name,
        plan
    });

    res.status(201).json({
        message: 'Organization created successfully',
        organization: result.organization,
        admin: {
            id: result.adminUser._id,
            email: result.adminUser.email,
            name: result.adminUser.name
        }
    });
});

/**
 * Update organization
 */
export const updateOrganization = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Fields that can be updated by super admin
    const allowedUpdates = [
        'name', 'email', 'phone', 'logo', 'plan', 'active',
        'settings', 'aiConfig', 'billing'
    ];

    const updateData = {};
    for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
            updateData[key] = updates[key];
        }
    }

    const organization = await Organization.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({ organization });
});

/**
 * Toggle organization active status
 */
export const toggleActive = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const organization = await Organization.findById(id);

    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
    }

    organization.active = !organization.active;
    await organization.save();

    res.json({
        message: organization.active ? 'Organization activated' : 'Organization suspended',
        active: organization.active
    });
});

/**
 * Delete organization (soft delete recommended, but hard delete for now)
 */
export const deleteOrganization = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const organization = await Organization.findById(id);

    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
    }

    // Delete all related data
    await Promise.all([
        User.deleteMany({ organization: id }),
        Channel.deleteMany({ organization: id }),
        Customer.deleteMany({ organization: id }),
        Conversation.deleteMany({ organization: id }),
        organization.deleteOne()
    ]);

    res.json({ message: 'Organization deleted successfully' });
});

/**
 * Get global dashboard stats (Super Admin)
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
    const [
        totalOrgs,
        activeOrgs,
        totalUsers,
        totalChannels,
        totalConversations,
        planDistribution
    ] = await Promise.all([
        Organization.countDocuments(),
        Organization.countDocuments({ active: true }),
        User.countDocuments({ role: { $ne: ROLES.SUPER_ADMIN } }),
        Channel.countDocuments({ status: 'active' }),
        Conversation.countDocuments(),
        Organization.aggregate([
            { $group: { _id: '$plan', count: { $sum: 1 } } }
        ])
    ]);

    // Recent organizations
    const recentOrgs = await Organization.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email plan active createdAt');

    res.json({
        stats: {
            totalOrganizations: totalOrgs,
            activeOrganizations: activeOrgs,
            totalUsers,
            activeChannels: totalChannels,
            totalConversations
        },
        planDistribution: planDistribution.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {}),
        recentOrganizations: recentOrgs
    });
});

/**
 * Reset admin password for an organization
 */
export const resetAdminPassword = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find admin user for this organization
    const adminUser = await User.findOne({
        organization: id,
        role: 'admin'
    });

    if (!adminUser) {
        return res.status(404).json({ error: 'Admin user not found for this organization' });
    }

    // Generate random password
    const newPassword = generateRandomPassword(12);

    // Update password
    adminUser.password = newPassword;
    await adminUser.save();

    // Log activity
    const { ActivityLog } = await import('../models/index.js');
    await ActivityLog.log({
        actor: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        targetType: 'user',
        targetId: adminUser._id,
        targetName: adminUser.email,
        organization: id,
        action: 'password_reset',
        description: `Password reset for ${adminUser.email}`,
        ipAddress: req.ip
    });

    res.json({
        message: 'Password reset successfully',
        user: {
            email: adminUser.email,
            name: adminUser.name
        },
        temporaryPassword: newPassword
    });
});

/**
 * Impersonate an organization's admin
 */
export const impersonateAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const organization = await Organization.findById(id);
    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
    }

    // Find admin user for this organization
    const adminUser = await User.findOne({
        organization: id,
        role: 'admin'
    });

    if (!adminUser) {
        return res.status(404).json({ error: 'Admin user not found' });
    }

    // Generate JWT for the admin (import jwt dynamically)
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
        {
            userId: adminUser._id,
            organizationId: organization._id,
            role: adminUser.role,
            impersonatedBy: req.user._id
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Log impersonation
    const { ActivityLog } = await import('../models/index.js');
    await ActivityLog.log({
        actor: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        targetType: 'user',
        targetId: adminUser._id,
        targetName: adminUser.email,
        organization: id,
        action: 'impersonate_start',
        description: `SuperAdmin impersonating ${adminUser.email} at ${organization.name}`,
        ipAddress: req.ip
    });

    res.json({
        message: 'Impersonation token generated',
        token,
        user: {
            _id: adminUser._id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role
        },
        organization: {
            _id: organization._id,
            name: organization.name
        },
        expiresIn: '1 hour'
    });
});

/**
 * Get organization billing history
 */
export const getOrgBilling = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const organization = await Organization.findById(id).select('billing plan name');
    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
    }

    // Return billing info (stored in organization document)
    const billing = organization.billing || {
        payments: [],
        currentBalance: 0,
        nextBillingDate: null
    };

    res.json({
        organization: {
            _id: organization._id,
            name: organization.name,
            plan: organization.plan
        },
        billing
    });
});

/**
 * Add billing record to organization
 */
export const addBillingRecord = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, description, type, status, invoiceUrl } = req.body;

    const organization = await Organization.findById(id);
    if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
    }

    // Initialize billing if not exists
    if (!organization.billing) {
        organization.billing = { payments: [] };
    }
    if (!organization.billing.payments) {
        organization.billing.payments = [];
    }

    // Add payment record
    const payment = {
        _id: new (await import('mongoose')).default.Types.ObjectId(),
        date: new Date(),
        amount,
        description: description || `${type === 'charge' ? 'Cargo' : 'Pago'} - ${organization.plan}`,
        type: type || 'payment', // payment, charge, refund
        status: status || 'completed',
        invoiceUrl
    };

    organization.billing.payments.unshift(payment);

    // Update balance
    if (type === 'charge') {
        organization.billing.currentBalance = (organization.billing.currentBalance || 0) + amount;
    } else if (type === 'payment') {
        organization.billing.currentBalance = (organization.billing.currentBalance || 0) - amount;
    }

    await organization.save();

    // Log activity
    const { ActivityLog } = await import('../models/index.js');
    await ActivityLog.log({
        actor: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        targetType: 'organization',
        targetId: id,
        targetName: organization.name,
        action: 'update',
        description: `Added billing record: ${description || type}`,
        ipAddress: req.ip
    });

    res.json({
        message: 'Billing record added',
        payment,
        currentBalance: organization.billing.currentBalance
    });
});

// Helper function to generate random password
function generateRandomPassword(length = 12) {
    const charset = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

