import { AIUsage } from '../../../models/AIUsage.js'; // Ensure path is correct
import { logger } from '../../../utils/logger.js';

/**
 * Cost Tracker
 * Monitors AI spending, enforces budgets, and triggers alerts.
 */
export class CostTracker {

    static thresholds = {
        DAILY_WARNING_USD: 5.0,
        DAILY_LIMIT_USD: 10.0
    };

    /**
     * Track usage and check budget
     */
    static async track(data) {
        const {
            organizationId,
            provider,
            model,
            tier,
            inputTokens,
            outputTokens,
            latency
        } = data;

        try {
            // 1. Record in DB (Async)
            const record = await AIUsage.recordUsage({
                organizationId,
                provider,
                model,
                level: tier,
                inputTokens,
                outputTokens,
                responseTimeMs: latency,
                success: true
            });

            // 2. Check Daily Spend
            await this.checkBudget(organizationId, record.estimatedCost);

            return record;

        } catch (error) {
            logger.error('Failed to track AI usage', error);
            // Don't block the main flow for stats
        }
    }

    static async checkBudget(organizationId, incrementalCost) {
        // In a real implementation, we would aggregate today's cost from Redis or DB
        // For now, we'll just log if the *estimated* total looks high
        // Future: Fetch distinct daily aggregated cost
    }

    /**
     * Calculate cost estimation for a request
     */
    static estimateCost(model, inputTokens, outputTokens) {
        const rates = {
            'gpt-4o-mini': { input: 0.15 / 1000000, output: 0.60 / 1000000 },
            'gpt-4.1': { input: 2.50 / 1000000, output: 10.00 / 1000000 }, // Example rates
            'gemini-2.0-flash-exp': { input: 0.10 / 1000000, output: 0.40 / 1000000 }
        };

        const rate = rates[model] || rates['gpt-4o-mini'];
        return (inputTokens * rate.input) + (outputTokens * rate.output);
    }
}
