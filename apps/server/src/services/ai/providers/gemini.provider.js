import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../../utils/logger.js';

/**
 * Gemini Provider - Google's Gemini 1.5 Flash
 * Used for L2 (contextual) queries - great for long context
 */
export class GeminiProvider {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('GOOGLE_AI_API_KEY is required');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.defaultModel = process.env.AI_L2_MODEL || 'gemini-1.5-flash';
        this.provider = 'gemini';
    }

    /**
     * Generate a chat completion
     */
    async chat(messages, options = {}) {
        const startTime = Date.now();

        try {
            const model = this.genAI.getGenerativeModel({
                model: options.model || this.defaultModel
            });

            // Convert messages to Gemini format
            const { systemInstruction, history, userMessage } = this.formatMessages(messages);

            const chat = model.startChat({
                history,
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.maxTokens || 500,
                },
                systemInstruction: systemInstruction || undefined
            });

            const result = await chat.sendMessage(userMessage);
            const response = await result.response;
            const responseTime = Date.now() - startTime;

            // Gemini doesn't provide token counts in the same way
            // We estimate based on text length (rough approximation)
            const inputTokens = Math.ceil(this.countTokensApprox(messages) * 1.3);
            const outputTokens = Math.ceil(response.text().length / 4);

            return {
                content: response.text(),
                provider: this.provider,
                model: options.model || this.defaultModel,
                inputTokens,
                outputTokens,
                totalTokens: inputTokens + outputTokens,
                responseTimeMs: responseTime,
                success: true
            };
        } catch (error) {
            logger.error('Gemini API error:', error);
            throw error;
        }
    }

    /**
     * Format messages for Gemini API
     */
    formatMessages(messages) {
        let systemInstruction = '';
        const history = [];
        let userMessage = '';

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const isLast = i === messages.length - 1;

            if (msg.constructor.name === 'SystemMessage') {
                systemInstruction = msg.content;
            } else if (msg.constructor.name === 'HumanMessage') {
                if (isLast) {
                    userMessage = msg.content;
                } else {
                    history.push({
                        role: 'user',
                        parts: [{ text: msg.content }]
                    });
                }
            } else if (msg.constructor.name === 'AIMessage') {
                history.push({
                    role: 'model',
                    parts: [{ text: msg.content }]
                });
            }
        }

        return { systemInstruction, history, userMessage };
    }

    /**
     * Approximate token count
     */
    countTokensApprox(messages) {
        let totalChars = 0;
        for (const msg of messages) {
            totalChars += (msg.content || '').length;
        }
        return Math.ceil(totalChars / 4);
    }

    /**
     * Check if the provider is available
     */
    async isAvailable() {
        try {
            const model = this.genAI.getGenerativeModel({ model: this.defaultModel });
            await model.generateContent('test');
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Factory function
 */
export function createGeminiProvider() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        logger.warn('GOOGLE_AI_API_KEY not configured');
        return null;
    }
    return new GeminiProvider(apiKey);
}
