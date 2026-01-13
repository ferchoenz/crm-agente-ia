import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

// Apply stricter rate limiting to auth routes
router.use(authLimiter);

// Login
router.post('/login', authController.loginValidation, authController.login);

// Protected routes
router.use(authenticate);

// Get current user
router.get('/me', authController.me);

// Refresh token
router.post('/refresh', authController.refreshToken);

// Update password
router.put('/password', authController.updatePassword);

// Logout
router.post('/logout', authController.logout);

export default router;
