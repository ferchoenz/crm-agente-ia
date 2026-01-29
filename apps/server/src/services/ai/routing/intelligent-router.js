import { logger } from '../../../utils/logger.js';
import { CostTracker } from '../metrics/cost-tracker.js';

/**
 * Intelligent Router - Context-Aware Model Selection
 * 
 * Decides which AI model to use (L2 vs L3) based on:
 * - Intent complexity
 * - Conversation context (Tokens, History, Phase)
 * - Customer value
 * 
 * TIER 1 (L2 - GPT-4o Mini): Simple tasks, greetings, info retrieval.
 * TIER 2 (L3 - GPT-4.1): Complex sales, objections, closings, high-value customers.
 */

export class IntelligentRouter {
    // Model definitions
    static MODELS = {
        L2: {
            name: 'gpt-4o-mini',
            provider: 'openai', // or openrouter
            costPer1K: 0.000015,
            tier: 'Tier 1'
        },
        L3: {
            name: 'gpt-4.1', // or latest preview
            provider: 'openrouter',
            costPer1K: 0.00015,
            tier: 'Tier 2'
        }
    };

    /**
     * Select appropriate model based on intent and context
     * 
     * @param {string} intent - Detected intent
     * @param {Object} context - Context factors
     * @returns {Object} Model selection decision
     */
    static selectModel(intent, context = {}) {
        const {
            salesPhase = 'ONBOARDING',
            totalTokens = 0,
            intentHistory = [],
            customerValue = 0,
            timeSinceLastL3 = Infinity
        } = context;

        // 1. HARD RULES: Always Simple (L2)
        const alwaysSimple = ['greeting', 'confirmation', 'negation', 'unknown'];
        if (alwaysSimple.includes(intent)) {
            return this.createDecision('L2', 'always_simple', { intent });
        }

        // 2. HARD RULES: Always Complex (L3)
        const alwaysComplex = ['human_handoff', 'appointment_cancel', 'objection', 'negotiation'];
        if (alwaysComplex.includes(intent)) {
            return this.createDecision('L3', 'always_complex', { intent });
        }

        // 3. CONTEXTUAL RULES

        // A. Sales Phase (Closing needs intelligence)
        if (['IMPLICATION', 'NEED_PAYOFF', 'CLOSING'].includes(salesPhase)) {
            return this.createDecision('L3', 'critical_sales_phase', { salesPhase });
        }

        // B. VIP Customer
        if (customerValue > 10000) { // $10k threshold
            return this.createDecision('L3', 'vip_customer', { customerValue });
        }

        // C. Conversation Complexity (Token/Pattern based)
        // If history contains complex intents, stick to L3 for consistency
        const complexHistoryMarkers = ['objection', 'negotiation', 'product_comparison'];
        const hasComplexHistory = intentHistory.some(i => complexHistoryMarkers.includes(i));

        if (hasComplexHistory) {
            // Debounce check? E.g., if last L3 was very recent, keep L3
            return this.createDecision('L3', 'complex_history', { intentHistory });
        }

        if (totalTokens > 800) {
            // Long context usually implies complex nuance
            return this.createDecision('L3', 'high_token_complexity', { totalTokens });
        }

        // D. Hysteresis / Stability
        // If we recently acted as L3 (e.g. < 2 mins ago), maybe stay L3 to maintain "smart" persona?
        // Or strictly save cost? Let's authorize L2 if intent is simple enough.

        // 4. DEFAULT (L2)
        return this.createDecision('L2', 'default_optimization', { intent });
    }

    static createDecision(tier, reason, metadata = {}) {
        const model = this.MODELS[tier];

        // Log decision logic
        logger.debug(`Router Decision: ${tier} (${reason})`, metadata);

        return {
            tier,
            model: model.name,
            provider: model.provider,
            reason,
            metadata
        };
    }
}
