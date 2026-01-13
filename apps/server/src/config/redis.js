import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

let redisClient = null;

export async function connectRedis() {
    try {
        const url = process.env.REDIS_URL || 'redis://localhost:6379';

        redisClient = new Redis(url, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                // Stop retrying after 3 attempts
                if (times > 3) {
                    logger.warn('⚠️ Redis not available, continuing without it');
                    return null; // Stop retrying
                }
                return Math.min(times * 100, 1000);
            },
            enableReadyCheck: false,
            lazyConnect: true
        });

        // Suppress error events to prevent spam when Redis is unavailable
        redisClient.on('error', () => {
            // Silently ignore - we already logged the warning
        });

        redisClient.on('ready', () => {
            logger.info('✅ Redis connected successfully');
        });

        await redisClient.connect();
        await redisClient.ping();

    } catch (error) {
        logger.warn('⚠️ Redis not available, continuing without it (queues disabled)');
        redisClient = null;
    }
}

export function getRedis() {
    return redisClient;
}
