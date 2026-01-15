import OpenAI from 'openai';
import { logger } from '../../../utils/logger.js';

/**
 * OpenRouter Provider - Access to DeepSeek V3 and other models
 * Used for L3 (complex) queries
 */
export class OpenRouterProvider {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('OPENROUTER_API_KEY is required');
        }

        this.client = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: apiKey,
            defaultHeaders: {
                'HTTP-Referer': process.env.CLIENT_URL || 'https://agentify-chat.com',
                'X-Title': 'Agentify Chat CRM'
            }
        });

        this.defaultModel = process.env.AI_L3_MODEL || 'deepseek/deepseek-chat';
        this.provider = 'deepseek';
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
                max_tokens: options.maxTokens || 1000
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
            logger.error('OpenRouter API error:', error);
            throw error;
        }
    }

    /**
     * Format messages for OpenAI-compatible API
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
export function createOpenRouterProvider() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        logger.warn('OPENROUTER_API_KEY not configured');
        return null;
    }
    return new OpenRouterProvider(apiKey);
}
