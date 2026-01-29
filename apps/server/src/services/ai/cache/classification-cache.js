import { logger } from '../../../utils/logger.js';

/**
 * Classification Cache Service
 * Stores intent classification results to reduce API costs and latency.
 * 
 * TODO: For production scaling, replace Map with Redis.
 */
export class ClassificationCache {
    constructor(ttl = 5 * 60 * 1000) { // Default TTL: 5 minutes
        this.cache = new Map();
        this.ttl = ttl;
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * Generate a deterministic cache key
     * @param {string} message - User message
     * @param {Object} context - Context factors that might affect classification
     */
    getCacheKey(message, context = {}) {
        const normalized = message.toLowerCase().trim();
        // We only care about context keys that affect INTENT, usually none for pure classification
        // but if we add personalized intents later, we might need customerId
        return normalized;
    }

    /**
     * Retrieve from cache
     */
    get(message, context) {
        const key = this.getCacheKey(message, context);
        const cached = this.cache.get(key);

        if (cached) {
            if (Date.now() - cached.timestamp < this.ttl) {
                this.hits++;
                return { ...cached.result, cached: true };
            } else {
                // Expired
                this.cache.delete(key);
            }
        }

        this.misses++;
        return null;
    }

    /**
     * Store in cache
     */
    set(message, context, result) {
        const key = this.getCacheKey(message, context);
        this.cache.set(key, {
            result,
            timestamp: Date.now()
        });
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
        logger.info('Classification cache cleared');
    }

    /**
     * Get performance stats
     */
    getStats() {
        const total = this.hits + this.misses;
        return {
            size: this.cache.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? (this.hits / total).toFixed(2) : 0
        };
    }

    /**
     * Start periodic cleanup of expired entries
     */
    startCleanup(intervalMs = 60000) {
        if (this.cleanupInterval) clearInterval(this.cleanupInterval);

        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            let count = 0;
            for (const [key, value] of this.cache.entries()) {
                if (now - value.timestamp > this.ttl) {
                    this.cache.delete(key);
                    count++;
                }
            }
            if (count > 0) logger.debug(`Cache cleanup: removed ${count} expired entries`);
        }, intervalMs);
    }
}

// Singleton instance
export const classificationCache = new ClassificationCache();
classificationCache.startCleanup();
