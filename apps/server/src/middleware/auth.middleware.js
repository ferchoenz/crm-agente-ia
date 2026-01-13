import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { ROLES } from '../config/constants.js';

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'NO_TOKEN'
            });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId)
            .select('+password')
            .populate('organization', 'name slug plan active');

        if (!user) {
            return res.status(401).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        if (!user.active) {
            return res.status(401).json({
                error: 'Account is disabled',
                code: 'ACCOUNT_DISABLED'
            });
        }

        // Check if organization is active (for non-super admins)
        if (user.role !== ROLES.SUPER_ADMIN && user.organization && !user.organization.active) {
            return res.status(403).json({
                error: 'Organization is suspended',
                code: 'ORG_SUSPENDED'
            });
        }

        // Attach user to request
        req.user = {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organization?._id,
            organization: user.organization
        };

        // Update last activity
        user.lastActivity = new Date();
        await user.save();

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        next(error);
    }
};

/**
 * Require specific roles
 */
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'NO_AUTH'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                code: 'FORBIDDEN',
                required: allowedRoles,
                current: req.user.role
            });
        }

        next();
    };
};

/**
 * Require super admin
 */
export const requireSuperAdmin = requireRole(ROLES.SUPER_ADMIN);

/**
 * Require admin or super admin
 */
export const requireAdmin = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN);

/**
 * Require at least agent role
 */
export const requireAgent = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AGENT);

/**
 * Optional authentication - attach user if token present, but don't fail
 */
export const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).populate('organization');

        if (user && user.active) {
            req.user = {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organization?._id,
                organization: user.organization
            };
        }
    } catch (error) {
        // Ignore errors for optional auth
    }

    next();
};
