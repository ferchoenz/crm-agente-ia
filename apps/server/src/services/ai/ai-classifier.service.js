import { createGeminiProvider } from './providers/gemini.provider.js';
import { logger } from '../../utils/logger.js';

/**
 * AI Classifier Service (Cortex L1)
 * Uses Gemini 2.0 Flash for fast, structured intent analysis and entity extraction.
 * NO conversation generation, only LOGIC and EXTRACTION.
 */
export class AIClassifierService {
    constructor() {
        this.provider = createGeminiProvider(); // Uses native Google SDK
        if (!this.provider) {
            logger.warn('Gemini Provider not available for Classifier. Falling back to simple regex.');
        }
    }

    /**
     * Classify message intent and extract entities
     * @param {string} message - User message
     * @param {Object} context - Current context (date, customer info)
     * @returns {Promise<Object>} Structured classification
     */
    async classify(message, context = {}) {
        if (!this.provider) return { intent: 'unknown', reason: 'No provider' };

        const now = new Date();
        const dateContext = context.date || now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeContext = context.time || now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

        const systemPrompt = `YOU ARE CORTEX, A LOGIC ENGINE.
YOUR ONLY JOB IS TO CLASSIFY INTENT AND EXTRACT DATA.
OUTPUT MUST BE VALID JSON. NO MARKDOWN. NO TEXT.

# DATE CONTEXT
Today: ${dateContext}
Time: ${timeContext}

# INTENTS
- "appointment_new": Schedule new appointment.
- "appointment_reschedule": Change existing appointment.
- "appointment_cancel": Cancel appointment.
- "quote_request": Request price/quote.
- "product_info": Ask about product details/catalog.
- "human_handoff": Request human agent.
- "negation": No/Cancel.
- "confirmation": Yes/Confirm.
- "general_inquiry": General questions (location, hours).
- "greeting": Hello/Hi.
- "unknown": Unclear.

# RULES
- Calculate specific dates (YYYY-MM-DD) from relative terms (tomorrow, next week).
- Extract time in HH:MM.

# JSON FORMAT
{
  "intent": "string",
  "confidence": number,
  "entities": {
    "targetDate": "YYYY-MM-DD" | null,
    "targetTime": "HH:MM" | null
  }
}`;

        try {
            const response = await this.provider.chat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `ANALYZE THIS: "${message}"\nRESPOND IN JSON ONLY.` }
            ], {
                temperature: 0,
                model: 'gemini-2.5-flash',
                responseMimeType: 'application/json'
            });

            // Clean potential markdown blocks just in case
            const cleanJson = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            try {
                const parsed = JSON.parse(cleanJson);
                // Validation
                if (!parsed.intent) {
                    logger.warn('Cortex L1 returned JSON without intent:', parsed);
                    parsed.intent = 'unknown';
                }
                return parsed;
            } catch (parseError) {
                logger.error('Cortex L1 JSON Parse Error. Raw response:', cleanJson);
                // Fallback: try to find start/end of JSON
                const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        const parsed = JSON.parse(jsonMatch[0]);
                        if (!parsed.intent) parsed.intent = 'unknown';
                        return parsed;
                    } catch (e) { /* ignore */ }
                }
                throw parseError; // Re-throw to be caught by outer block
            }

        } catch (error) {
            logger.error('Cortex L1 Classification failed:', error);
            return { intent: 'unknown', error: error.message };
        }
    }
}

// Singleton
export const aiClassifier = new AIClassifierService();
