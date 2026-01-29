import { createGeminiProvider } from './providers/gemini.provider.js';
import { logger } from '../../utils/logger.js';
import { classificationCache } from './cache/classification-cache.js';
import { FallbackClassifier } from './classifiers/fallback-classifier.js';
import { DateTimeParser } from './parsers/datetime-parser.js';
import { ClassificationMetrics } from './metrics/classification-metrics.js';

/**
 * AI Classifier Service (Cortex L1)
 * Robust implementation with Caching, Regex Fallback, and Confidence Scoring.
 */
export class AIClassifierService {
    constructor() {
        this.provider = createGeminiProvider();
        this.fallbackEnabled = true;
        this.cacheEnabled = true;

        if (!this.provider) {
            logger.warn('Gemini Provider not available. System operating in Fallback Safe Mode.');
        }
    }

    /**
     * Classify message intent and extract entities
     * @param {string} message - User message
     * @param {Object} context - Context (date, time, history)
     */
    async classify(message, context = {}) {
        const startTime = Date.now();
        let result;

        // 1. Check Cache
        if (this.cacheEnabled) {
            const cached = classificationCache.get(message, context);
            if (cached) {
                ClassificationMetrics.log({ ...cached, method: 'cached', processingTime: Date.now() - startTime });
                return cached;
            }
        }

        // Prepare prompt context
        const now = new Date();
        const dateContext = context.date || now.toLocaleDateString('es-MX', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const timeContext = context.time || now.toLocaleTimeString('es-MX', {
            hour: '2-digit', minute: '2-digit'
        });

        // 2. Try Gemini (L1)
        if (this.provider) {
            try {
                result = await this.classifyWithGemini(message, dateContext, timeContext);
                result.method = 'gemini';
            } catch (error) {
                logger.error('Gemini Classification Failed:', error);

                // 3. Fallback on error
                if (this.fallbackEnabled) {
                    result = FallbackClassifier.classify(message);
                    result.reasoning = `Fallback triggered due to provider error: ${error.message}`;
                    result.method = 'fallback';
                } else {
                    throw error;
                }
            }
        } else {
            // No provider configured
            result = FallbackClassifier.classify(message);
            result.reasoning = 'Fallback safe mode (no provider)';
            result.method = 'fallback';
        }

        result.processingTime = Date.now() - startTime;

        // 4. Post-Process Entities (Robust Parsing)
        this.enrichEntities(result, message);

        // 5. Cache Result
        if (this.cacheEnabled && result.intent !== 'unknown') {
            classificationCache.set(message, context, result);
        }

        // 6. Log Metrics
        ClassificationMetrics.log(result, { messageLength: message.length });

        return result;
    }

    /**
     * Call Gemini API
     */
    async classifyWithGemini(message, dateContext, timeContext) {
        const systemPrompt = `YOU ARE CORTEX, A PRECISION LOGIC ENGINE.
TASK: CLASSIFY INTENT AND EXTRACT DATA.
OUTPUT: VALID JSON ONLY. NO MARKDOWN.

# CONTEXT
Today: ${dateContext}
Current Time: ${timeContext}

# INTENTS
1. appointment_new
2. appointment_reschedule
3. appointment_cancel
4. quote_request (keywords: precio, costo, cotizar)
5. product_info (keywords: info, detalles, que incluye)
6. human_handoff (keywords: humano, asesor, ayuda)
7. confirmation (sí, confirmar, ok)
8. negation (no, cancelar)
9. greeting
10. general_inquiry
11. unknown

# JSON OUTPUT
{
  "intent": "string",
  "confidence": 0.0-1.0,
  "entities": {
    "targetDate": "YYYY-MM-DD" | null,
    "targetTime": "HH:MM" | null,
    "productName": "string" | null
  },
  "reasoning": "brief explanation"
}`;

        const response = await this.provider.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
        ], {
            temperature: 0,
            model: 'gemini-2.0-flash-exp', // Or 'gemini-2.0-flash'
            responseMimeType: 'application/json'
        });

        const cleanJson = response.content.replace(/```json|```/g, '').trim();

        try {
            const parsed = JSON.parse(cleanJson);

            // Validate Logic
            if (!parsed.intent) parsed.intent = 'unknown';
            if (!parsed.entities) parsed.entities = {};
            if (typeof parsed.confidence !== 'number') parsed.confidence = 0.8;

            return parsed;

        } catch (e) {
            logger.warn('Cortex L1 JSON Parse Error, formatting raw:', cleanJson);
            // If JSON fails, try fallback immediately instead of throwing
            // This ensures robustness against simple syntax errors
            const fallback = FallbackClassifier.classify(message);
            fallback.reasoning = 'JSON parse failed, used fallback';
            return fallback;
        }
    }

    /**
     * Enrich entities using advanced parsers
     */
    enrichEntities(result, message) {
        if (!result.entities) result.entities = {};

        // If simple model missed the date, or if we want to double check / normalize
        // We trust the parser more for relative dates (e.g. "pasado mañana")
        const parsedDate = DateTimeParser.parseRelativeDate(message);
        if (parsedDate) {
            // If LLM says one thing and Parser says another...
            // Usually parser is safer for "pasado mañana", LLM might be better for "el cumple de mi tia" (context)
            // Strategy: If LLM is null, use Parser. If LLM exists, trust LLM? 
            // Better: Parser overrides simple extractions if high confidence
            if (!result.entities.targetDate) {
                result.entities.targetDate = parsedDate;
            }
        }

        const parsedTime = DateTimeParser.parseTime(message);
        if (parsedTime) {
            if (!result.entities.targetTime) {
                result.entities.targetTime = parsedTime;
            }
        }

        // Add analyzed timestamp for debugging
        result.entities._analyzedAt = new Date().toISOString();
    }
}

// Singleton
export const aiClassifier = new AIClassifierService();
