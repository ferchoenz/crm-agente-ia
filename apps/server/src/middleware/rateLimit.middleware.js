import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * General API rate limiting
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 1000 : 100, // Higher limit in development
    message: {
        error: 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDev // Skip in development
});

/**
 * Stricter limit for auth endpoints
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 100 : 10, // Higher limit in development
    message: {
        error: 'Too many login attempts, please try again later.',
        code: 'AUTH_RATE_LIMIT'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDev // Skip in development
});

/**
 * Webhook rate limiting (higher threshold)
 */
export const webhookLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 500, // limit each IP to 500 requests per minute
    message: {
        error: 'Too many webhook requests',
        code: 'WEBHOOK_RATE_LIMIT'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * AI endpoints rate limiting (expensive operations)
 */
export const aiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // limit AI requests per minute
    message: {
        error: 'Too many AI requests, please slow down.',
        code: 'AI_RATE_LIMIT'
    },
    standardHeaders: true,
    legacyHeaders: false
});
