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

        const systemPrompt = `Eres CORTEX, un analista lógico de conversaciones de ventas. NO respondes al usuario. Tu trabajo es ANALIZAR y EXTRAER datos en JSON.

# FECHA ACTUAL
Hoy es: ${dateContext}
Hora: ${timeContext}

# INTENCIONES SOPORTADAS
1. "appointment_new": Quiere agendar una nueva cita.
2. "appointment_reschedule": Quiere cambiar/mover una cita existente.
3. "appointment_cancel": Quiere cancelar una cita.
4. "quote_request": Quiere una cotización o saber el precio total de un proyecto/servicio.
5. "product_info": Pregunta por precios individuales, características o catálogo.
6. "human_handoff": Pide hablar con una persona/asesor real.
7. "negation": Dice "no", "cancelar operación", "no me interesa".
8. "confirmation": Dice "sí", "ok", "correcto", "adelante".
9. "general_inquiry": Preguntas generales sobre la empresa, ubicación, horarios.
10. "greeting": Saludos simples (hola, buenos días).
11. "unknown": No está claro o es irrelevante.

# REGLAS DE EXTRACCIÓN
- Si menciona "mañana", "el martes", etc., calcula la fecha exacta en formato YYYY-MM-DD basándote en que HOY es ${dateContext}.
- Si menciona hora, extrae en formato HH:MM (24h).

# SALIDA JSON
Responde SOLO con este JSON:
{
  "intent": "string (una de las intenciones arriba)",
  "confidence": number (0-1),
  "entities": {
    "targetDate": "YYYY-MM-DD" | null,
    "targetTime": "HH:MM" | null,
    "productName": "string" | null,
    "customerName": "string" | null,
    "customerEmail": "string" | null
  },
  "reasoning": "Breve explicación de por qué clasificaste así"
}
`;

        try {
            const response = await this.provider.chat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ], {
                temperature: 0, // Deterministic
                model: 'gemini-2.5-flash', // Fast & Smart (2025 Release)
                responseMimeType: 'application/json' // FORCE JSON
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
