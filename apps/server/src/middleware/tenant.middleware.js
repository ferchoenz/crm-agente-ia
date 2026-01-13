import { ROLES } from '../config/constants.js';

/**
 * Tenant Isolation Middleware
 * Ensures all database queries are filtered by organizationId
 * Prevents cross-tenant data access
 */
export const tenantIsolation = (req, res, next) => {
    // Super admins can access all tenants
    if (req.user?.role === ROLES.SUPER_ADMIN) {
        // Super admin can optionally target a specific org
        if (req.query.organizationId || req.body.organizationId) {
            req.tenantFilter = {
                organization: req.query.organizationId || req.body.organizationId
            };
        } else {
            req.tenantFilter = {}; // No filter for super admin
        }
        req.isSuperAdmin = true;
        return next();
    }

    // Regular users must have an organization
    if (!req.user?.organizationId) {
        return res.status(403).json({
            error: 'Organization context required',
            code: 'NO_ORG_CONTEXT'
        });
    }

    // Set tenant filter for all queries
    req.tenantFilter = { organization: req.user.organizationId };
    req.isSuperAdmin = false;

    next();
};

/**
 * Helper to apply tenant filter to Mongoose query
 */
export const applyTenantFilter = (query, req) => {
    if (Object.keys(req.tenantFilter).length > 0) {
        return query.where(req.tenantFilter);
    }
    return query;
};

/**
 * Inject organizationId into body for create operations
 */
export const injectOrganization = (req, res, next) => {
    if (req.user?.organizationId && req.body) {
        req.body.organization = req.user.organizationId;
    }
    next();
};

/**
 * Validate that a resource belongs to the user's organization
 */
export const validateOwnership = (resourceOrgField = 'organization') => {
    return (req, res, next) => {
        return async (resource) => {
            if (!resource) {
                return false;
            }

            // Super admin can access anything
            if (req.user?.role === ROLES.SUPER_ADMIN) {
                return true;
            }

            const resourceOrgId = resource[resourceOrgField]?.toString() || resource[resourceOrgField];
            const userOrgId = req.user?.organizationId?.toString();

            return resourceOrgId === userOrgId;
        };
    };
};

/**
 * Check usage limits before allowing operations
 */
export const checkUsageLimits = (limitType) => {
    return async (req, res, next) => {
        if (req.user?.role === ROLES.SUPER_ADMIN) {
            return next();
        }

        const { Organization } = await import('../models/index.js');
        const org = await Organization.findById(req.user.organizationId);

        if (!org) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        if (!org.isWithinLimits(limitType)) {
            return res.status(429).json({
                error: 'Usage limit exceeded',
                code: 'LIMIT_EXCEEDED',
                limitType,
                upgrade: true
            });
        }

        next();
    };
};
