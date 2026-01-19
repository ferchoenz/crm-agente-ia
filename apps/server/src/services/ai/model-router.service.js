import { logger } from '../../utils/logger.js';
import { createGroqProvider } from './providers/groq.provider.js';
import { createOpenRouterProvider, createGeminiProvider } from './providers/openrouter.provider.js';
import { AIUsage } from '../../models/AIUsage.js';

/**
 * Model Router Service
 * Classifies message complexity and routes to appropriate AI provider
 */
export class ModelRouterService {
    constructor() {
        this.providers = {
            L1: null, // Groq - Fast, simple queries
            L2: null, // Gemini 2.0 Flash - Contextual, long context
            L3: null  // DeepSeek - Complex reasoning
        };

        this.initialized = false;
    }

    /**
     * Initialize all available providers
     */
    async initialize() {
        try {
            // L1: Groq for fast, simple responses
            this.providers.L1 = createGroqProvider();
            if (this.providers.L1) {
                logger.info('✓ Groq provider initialized (L1)');
            }

            // L2: Gemini 2.0 Flash for contextual queries (via OpenRouter)
            this.providers.L2 = createGeminiProvider();
            if (this.providers.L2) {
                logger.info('✓ Gemini 2.0 Flash provider initialized (L2)');
            }

            // L3: DeepSeek for complex reasoning
            this.providers.L3 = createOpenRouterProvider();
            if (this.providers.L3) {
                logger.info('✓ DeepSeek/OpenRouter provider initialized (L3)');
            }

            // Check at least one provider is available
            const availableCount = Object.values(this.providers).filter(p => p !== null).length;
            if (availableCount === 0) {
                throw new Error('No AI providers configured. Please set at least one API key (GROQ_API_KEY, GOOGLE_AI_API_KEY, or OPENROUTER_API_KEY)');
            }

            logger.info(`Model Router initialized with ${availableCount}/3 providers`);
            this.initialized = true;

            return this;
        } catch (error) {
            logger.error('Failed to initialize Model Router:', error);
            throw error;
        }
    }

    /**
     * Classify message complexity using Semantic Router
     * L1: Simple greetings, confirmations
     * L2: General inquiries, product search
     * L3: Objections, complex decisions, support
     */
    async classifyComplexity(message, context = {}) {
        try {
            // Lazy load vector router
            const { vectorRouter } = await import('../../utils/vector-router.util.js');

            // Get semantic classification (Intents only)
            const match = await vectorRouter.classify(message, 'intent');
            logger.info(`Semantic classification for "${message.slice(0, 30)}...": ${match.name} (${match.score.toFixed(2)})`);

            // Map intent to complexity level
            switch (match.name) {
                case 'objection':
                    return 'L3'; // Needs reasoning (DeepSeek)
                case 'purchase':
                    return 'L2'; // Needs context/speed (Gemini)
                case 'support':
                    return 'L3'; // Needs problem solving (DeepSeek + Knowledge)
                case 'greeting':
                    return 'L1'; // Simple (Groq)
                default:
                    // Fallback to context-based or L1
                    if (context.historyLength > 10 || context.hasProducts) return 'L2';
                    return 'L1';
            }
        } catch (error) {
            logger.warn('Semantic classification failed, falling back to basic rules:', error);
            // Fallback to basic length heuristic
            return message.length > 50 ? 'L2' : 'L1';
        }
    }

    /**
     * Get the provider for a given level with fallback
     */
    getProvider(level) {
        // Try requested level first
        if (this.providers[level]) {
            return { provider: this.providers[level], level };
        }

        // Fallback order
        const fallbackOrder = {
            'L1': ['L2', 'L3'],
            'L2': ['L1', 'L3'],
            'L3': ['L2', 'L1']
        };

        for (const fallbackLevel of fallbackOrder[level] || []) {
            if (this.providers[fallbackLevel]) {
                logger.warn(`Provider ${level} not available, falling back to ${fallbackLevel}`);
                return { provider: this.providers[fallbackLevel], level: fallbackLevel };
            }
        }

        throw new Error('No AI providers available');
    }

    /**
     * Generate response using appropriate provider with fallback
     */
    async chat(messages, options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const { message, context } = options;
        const startTime = Date.now();

        // Classify complexity
        const requestedLevel = options.forceLevel || await this.classifyComplexity(
            message || messages[messages.length - 1]?.content || '',
            context || {}
        );

        // Build fallback order
        const fallbackOrder = {
            'L1': ['L1', 'L2', 'L3'],
            'L2': ['L2', 'L1', 'L3'],
            'L3': ['L3', 'L2', 'L1']
        };

        const levelsToTry = fallbackOrder[requestedLevel] || ['L1', 'L2', 'L3'];
        let lastError = null;

        for (const level of levelsToTry) {
            const provider = this.providers[level];
            if (!provider) continue;

            try {
                logger.info(`Routing to ${level} provider for message classification`);
                const response = await provider.chat(messages, options);
                const responseTime = Date.now() - startTime;

                // Record AI usage for statistics
                if (context?.organizationId) {
                    try {
                        const providerName = this.getProviderName(level);
                        await AIUsage.recordUsage({
                            organizationId: context.organizationId,
                            provider: providerName,
                            model: response.model || providerName,
                            level,
                            inputTokens: response.inputTokens || 0,
                            outputTokens: response.outputTokens || 0,
                            responseTimeMs: responseTime,
                            success: true,
                            messageReceived: true,
                            messageSent: true
                        });
                    } catch (usageError) {
                        logger.warn('Failed to record AI usage:', usageError.message);
                    }
                }

                return {
                    ...response,
                    level,
                    classifiedLevel: requestedLevel,
                    processingTime: responseTime
                };
            } catch (error) {
                logger.warn(`Provider ${level} failed: ${error.message}, trying next...`);
                lastError = error;

                // Record failed request
                if (context?.organizationId) {
                    try {
                        await AIUsage.recordUsage({
                            organizationId: context.organizationId,
                            provider: this.getProviderName(level),
                            model: 'unknown',
                            level,
                            success: false
                        });
                    } catch (usageError) {
                        // Ignore usage tracking errors
                    }
                }
            }
        }

        // All providers failed
        throw lastError || new Error('All AI providers failed');
    }

    /**
     * Get provider name for a level
     */
    getProviderName(level) {
        const names = {
            L1: 'groq',
            L2: 'gemini',
            L3: 'deepseek'
        };
        return names[level] || 'unknown';
    }

    /**
     * Get available providers status
     */
    getStatus() {
        return {
            L1: { available: !!this.providers.L1, name: 'Groq (Llama 3.1 8B)' },
            L2: { available: !!this.providers.L2, name: 'Gemini 2.0 Flash (OpenRouter)' },
            L3: { available: !!this.providers.L3, name: 'DeepSeek V3 (OpenRouter)' }
        };
    }
}

// Singleton instance
let routerInstance = null;

/**
 * Get or create the router instance
 */
export async function getModelRouter() {
    if (!routerInstance) {
        routerInstance = new ModelRouterService();
        await routerInstance.initialize();
    }
    return routerInstance;
}

/**
 * Reset router (for testing or reconfiguration)
 */
export function resetModelRouter() {
    routerInstance = null;
}
