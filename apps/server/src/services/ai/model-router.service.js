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
            L2: null, // GPT-4o Mini - Balanced responses
            L3: null  // GPT-4.1 - Complex reasoning
        };

        this.initialized = false;
    }

    /**
     * Initialize all available providers
     */
    async initialize() {
        try {
            // L1/L2: Legacy/Backup slots (Unused in Hybrid Brain architecture for now)
            this.providers.L1 = null;
            this.providers.L2 = null;

            // L3: Generator (GPT-4.1 via OpenRouter) - The Voice of the Agent
            this.providers.L3 = createOpenRouterProvider();
            if (this.providers.L3) {
                logger.info('✓ Generator Provider initialized (L3 - GPT-4.1)');
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
                case 'support':
                    return 'L3'; // Needs problem solving (DeepSeek + Knowledge)
                case 'purchase':
                    return 'L2'; // Needs context/speed (Gemini)
                case 'inquiry':
                    return 'L2'; // General questions need context (Gemini)
                case 'conversation':
                    return 'L2'; // Ongoing dialog needs context (Gemini)
                case 'greeting':
                    return 'L1'; // Simple (Groq)
                default:
                    // Fallback to L2 for unknown intents (safer than L1)
                    logger.debug(`Unknown intent, defaulting to L2`);
                    return 'L2';
            }
        } catch (error) {
            logger.warn('Semantic classification failed, falling back to L2:', error);
            // Fallback to L2 (safer middle ground)
            return 'L2';
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

        // Hybrid Brain Architecture uses L3 directly.
        // If specific level requested, try that, else default to L3.
        const fallbackOrder = {
            'L1': ['L3'],
            'L2': ['L3'],
            'L3': []
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
            L2: 'gpt-4o-mini',
            L3: 'gpt-4.1'
        };
        return names[level] || 'unknown';
    }

    /**
     * Get available providers status
     */
    getStatus() {
        return {
            L1: { available: !!this.providers.L1, name: 'Groq (Llama 3.1 8B)' },
            L2: { available: !!this.providers.L2, name: 'GPT-4o Mini (OpenRouter)' },
            L3: { available: !!this.providers.L3, name: 'GPT-4.1 (OpenRouter)' }
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
