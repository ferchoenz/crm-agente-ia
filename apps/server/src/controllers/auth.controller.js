import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';
import { body, validationResult } from 'express-validator';

/**
 * Validation rules for login
 */
export const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

/**
 * Login user
 */
export const login = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email, active: true })
        .select('+password')
        .populate('organization', 'name slug plan active');

    if (!user) {
        return res.status(401).json({
            error: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
        });
    }

    // Check password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
        return res.status(401).json({
            error: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
        });
    }

    // Check if organization is active (for non-super admins)
    if (user.organization && !user.organization.active) {
        return res.status(403).json({
            error: 'Your organization has been suspended',
            code: 'ORG_SUSPENDED'
        });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
        {
            userId: user._id,
            role: user.role,
            organizationId: user.organization?._id
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
        token,
        user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            organization: user.organization ? {
                id: user.organization._id,
                name: user.organization.name,
                slug: user.organization.slug,
                plan: user.organization.plan
            } : null
        }
    });
});

/**
 * Get current user
 */
export const me = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
        .populate('organization', 'name slug plan active settings');

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        notifications: user.notifications,
        organization: user.organization ? {
            id: user.organization._id,
            name: user.organization.name,
            slug: user.organization.slug,
            plan: user.organization.plan,
            settings: user.organization.settings
        } : null
    });
});

/**
 * Refresh token
 */
export const refreshToken = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).populate('organization');

    if (!user || !user.active) {
        return res.status(401).json({ error: 'User not found or inactive' });
    }

    const token = jwt.sign(
        {
            userId: user._id,
            role: user.role,
            organizationId: user.organization?._id
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token });
});

/**
 * Update password
 */
export const updatePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
});

/**
 * Logout (client-side token removal, but we log it)
 */
export const logout = asyncHandler(async (req, res) => {
    // In a more advanced setup, we could blacklist the token
    // For now, just acknowledge the logout
    res.json({ message: 'Logged out successfully' });
});
