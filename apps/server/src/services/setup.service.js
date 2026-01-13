import { User, Organization } from '../models/index.js';
import { ROLES, PLANS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Initialize super admin user if it doesn't exist
 */
export async function initializeSuperAdmin() {
    try {
        const email = process.env.SUPER_ADMIN_EMAIL;
        const password = process.env.SUPER_ADMIN_PASSWORD;

        if (!email || !password) {
            logger.warn('⚠️ SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD not set. Skipping super admin creation.');
            return null;
        }

        // Check if super admin already exists
        const existingAdmin = await User.findOne({
            role: ROLES.SUPER_ADMIN,
            email
        });

        if (existingAdmin) {
            logger.info('✅ Super admin already exists');
            return existingAdmin;
        }

        // Create super admin
        const superAdmin = new User({
            email,
            password,
            name: 'Super Admin',
            role: ROLES.SUPER_ADMIN,
            active: true
        });

        await superAdmin.save();

        logger.info('✅ Super admin created successfully');
        logger.info(`   Email: ${email}`);

        return superAdmin;
    } catch (error) {
        logger.error('❌ Failed to create super admin:', error);
        throw error;
    }
}

/**
 * Create a new organization with admin user
 */
export async function createOrganization(data) {
    const {
        name,
        email,
        phone,
        adminEmail,
        adminPassword,
        adminName,
        plan = PLANS.FREE
    } = data;

    // Generate slug from name
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    // Check if slug exists
    const existingOrg = await Organization.findOne({ slug });
    if (existingOrg) {
        throw new Error('Organization with this name already exists');
    }

    // Create organization
    const organization = new Organization({
        name,
        slug,
        email,
        phone,
        plan,
        active: true,
        usage: {
            currentPeriodStart: new Date()
        }
    });

    await organization.save();

    // Create admin user for the organization
    const adminUser = new User({
        organization: organization._id,
        email: adminEmail || email,
        password: adminPassword,
        name: adminName || name,
        role: ROLES.ADMIN,
        active: true
    });

    await adminUser.save();

    logger.info(`✅ Organization created: ${name} (${slug})`);

    return { organization, adminUser };
}

/**
 * Reset usage counters (called monthly)
 */
export async function resetUsageCounters() {
    const result = await Organization.updateMany(
        {},
        {
            $set: {
                'usage.messagesCount': 0,
                'usage.tokensUsed': 0,
                'usage.currentPeriodStart': new Date()
            }
        }
    );

    logger.info(`✅ Reset usage counters for ${result.modifiedCount} organizations`);
    return result.modifiedCount;
}
