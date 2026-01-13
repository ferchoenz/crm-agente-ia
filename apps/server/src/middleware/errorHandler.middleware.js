import { logger } from '../utils/logger.js';

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
    });

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));

        return res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            error: `Duplicate value for ${field}`,
            code: 'DUPLICATE_KEY',
            field
        });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid ID format',
            code: 'INVALID_ID'
        });
    }

    // JWT errors are handled in auth middleware, but just in case
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Authentication failed',
            code: 'AUTH_ERROR'
        });
    }

    // OpenAI / LangChain errors
    if (err.message?.includes('OpenAI') || err.message?.includes('API')) {
        return res.status(503).json({
            error: 'AI service temporarily unavailable',
            code: 'AI_SERVICE_ERROR'
        });
    }

    // Default error
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message;

    res.status(statusCode).json({
        error: message,
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

/**
 * Async handler wrapper to catch errors in async routes
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Not found handler
 */
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'Resource not found',
        code: 'NOT_FOUND',
        path: req.path
    });
};
