import { logger } from '../../../utils/logger.js';

/**
 * Classification Metrics
 * Wrapper for structured logging of AI classification performance.
 * 
 * Future: Connect to specific monitoring service (datadog, cloudwatch, etc)
 */
export class ClassificationMetrics {
    static log(result, context = {}) {
        const entry = {
            timestamp: new Date(),
            intent: result.intent,
            confidence: result.confidence,
            method: result.method, // 'gemini' | 'fallback' | 'cached'
            processingTimeMs: result.processingTime,
            cached: result.cached || false,
            originalMessageLength: context.messageLength || 0,
            hasEntities: Object.keys(result.entities || {}).length > 0,
            entitiesDetected: Object.keys(result.entities || {})
        };

        // Log level depends on confidence or errors
        if (result.intent === 'unknown' && result.method !== 'fallback') {
            logger.warn('AI Classification: Unknown Intent', entry);
        } else if (result.confidence < 0.6) {
            logger.info('AI Classification: Low Confidence', entry);
        } else {
            logger.debug('AI Classification: Success', entry);
        }

        // Here we would push to DB or external metric service
        // TODO: Push to AIUsage collection via event emitter or direct call?
        // For now, logging usage is sufficient as AIUsage model handles the aggregated cost/token tracking.
        // This class focuses on *logic* performance (accuracy/latency).
    }
}
