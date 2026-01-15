import Groq from 'groq-sdk';
import { logger } from '../../../utils/logger.js';

/**
 * Groq Provider - Ultra-fast inference with Llama 3.1
 * Used for L1 (simple) queries
 */
export class GroqProvider {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('GROQ_API_KEY is required');
        }

        this.client = new Groq({ apiKey });
        this.defaultModel = process.env.AI_L1_MODEL || 'llama-3.1-8b-instant';
        this.provider = 'groq';
    }

    /**
     * Generate a chat completion
     */
    async chat(messages, options = {}) {
        const startTime = Date.now();

        try {
            const response = await this.client.chat.completions.create({
                model: options.model || this.defaultModel,
                messages: this.formatMessages(messages),
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 500,
                stream: false
            });

            const responseTime = Date.now() - startTime;

            return {
                content: response.choices[0]?.message?.content || '',
                provider: this.provider,
                model: options.model || this.defaultModel,
                inputTokens: response.usage?.prompt_tokens || 0,
                outputTokens: response.usage?.completion_tokens || 0,
                totalTokens: response.usage?.total_tokens || 0,
                responseTimeMs: responseTime,
                success: true
            };
        } catch (error) {
            logger.error('Groq API error:', error);
            throw error;
        }
    }

    /**
     * Format messages for Groq API
     */
    formatMessages(messages) {
        return messages.map(msg => {
            if (msg.constructor.name === 'SystemMessage') {
                return { role: 'system', content: msg.content };
            } else if (msg.constructor.name === 'HumanMessage') {
                return { role: 'user', content: msg.content };
            } else if (msg.constructor.name === 'AIMessage') {
                return { role: 'assistant', content: msg.content };
            }
            // Fallback for plain objects
            return {
                role: msg.role || 'user',
                content: msg.content || msg.text || ''
            };
        });
    }

    /**
     * Check if the provider is available
     */
    async isAvailable() {
        try {
            await this.client.models.list();
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Factory function
 */
export function createGroqProvider() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        logger.warn('GROQ_API_KEY not configured');
        return null;
    }
    return new GroqProvider(apiKey);
}
