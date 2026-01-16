import { logger } from '../../utils/logger.js';
import { createGroqProvider } from './providers/groq.provider.js';
import { createOpenRouterProvider, createQwenProvider } from './providers/openrouter.provider.js';
import { AIUsage } from '../../models/AIUsage.js';

/**
 * Model Router Service
 * Classifies message complexity and routes to appropriate AI provider
 */
export class ModelRouterService {
    constructor() {
        this.providers = {
            L1: null, // Groq - Fast, simple queries
            L2: null, // Gemini - Contextual, long context
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

            // L2: Qwen for contextual queries (via OpenRouter)
            this.providers.L2 = createQwenProvider();
            if (this.providers.L2) {
                logger.info('✓ Qwen provider initialized (L2)');
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
     * Classify message complexity
     * L1: Simple greetings, confirmations, basic info
     * L2: Questions requiring context, history lookup, product search
     * L3: Negotiations, objections, complex decisions
     */
    classifyComplexity(message, context = {}) {
        const lowerMessage = message.toLowerCase();

        // L1 patterns - Simple queries
        const l1Patterns = [
            /^(hola|hi|hello|buenos?\s*(días?|tardes?|noches?)|hey)/i,
            /^(gracias|ok|okey|vale|sí|no|claro|perfecto|genial|bien|está bien)$/i,
            /^(adiós|chao|bye|hasta luego|nos vemos)/i,
            /^\d+$/,  // Just numbers
            /^.{1,20}$/  // Very short messages
        ];

        // L3 patterns - Complex queries
        const l3Patterns = [
            /(descuento|rebaja|precio\s*especial|negociar|regatear)/i,
            /(no\s*(me\s*)?convence|muy\s*caro|demasiado|mejor\s*precio)/i,
            /(mayoreo|mayorista|al\s*por\s*mayor|volumen|cantidad)/i,
            /(problema|queja|reclamo|devolver|reembolso|garantía)/i,
            /(contrato|legal|términos|condiciones)/i,
            /(comparar|competencia|otra\s*empresa|alternativa)/i
        ];

        // Check L1 first (simple)
        if (l1Patterns.some(pattern => pattern.test(lowerMessage))) {
            return 'L1';
        }

        // Check L3 (complex)
        if (l3Patterns.some(pattern => pattern.test(lowerMessage))) {
            return 'L3';
        }

        // Context-based classification
        if (context.historyLength > 10) {
            return 'L2'; // Long conversation history needs Gemini
        }

        if (context.hasProducts || context.requiresSearch) {
            return 'L2'; // Product queries need context
        }

        // Default to L1 for most queries (cost optimization)
        return 'L1';
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
        const requestedLevel = options.forceLevel || this.classifyComplexity(
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
            L2: 'qwen',
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
            L2: { available: !!this.providers.L2, name: 'Qwen 2.5 32B (OpenRouter)' },
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
