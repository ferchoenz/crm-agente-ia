import { DateTimeParser } from '../parsers/datetime-parser.js';

/**
 * Fallback Classifier
 * Regex-based classification system for when LLM is unavailable or for high-speed local processing.
 */
export class FallbackClassifier {
    static patterns = {
        appointment_new: [
            /\b(agendar|cita|reservar|programar|apartar)\b/i,
            /\b(quiero|necesito|me gustaría).*(cita|hora|turno)\b/i,
            /\bcuándo (puedo|podemos|tienen)\b/i
        ],
        appointment_reschedule: [
            /\b(cambiar|mover|reagendar|reprogramar|modificar).*(cita|hora)\b/i,
            /\b(otra hora|otro día|diferente).*(cita|hora)?\b/i
        ],
        appointment_cancel: [
            /\b(cancelar|anular|eliminar).*(cita|hora)\b/i,
            /\bno (puedo|voy a poder).*(asistir|ir)\b/i
        ],
        quote_request: [
            /\b(cuánto cuesta|precio|cotiza|presupuesto|vale)\b/i,
            /\b(me das|dame).*(precio|cotización)\b/i
        ],
        product_info: [
            /\b(qué|cuál|cuáles).*(productos|servicios|tienen|ofrecen)\b/i,
            /\b(información|detalles|características).*(de|del|sobre)\b/i,
            /\b(catálogo|opciones|alternativas)\b/i
        ],
        human_handoff: [
            /\b(hablar con|quiero|necesito).*(humano|persona|agente|asesor)\b/i,
            /\b(me atienda|que me ayude).*(alguien|persona)\b/i,
            /\b(no entiendo|no me sirve|no funciona)\b/i
        ],
        greeting: [
            /^(hola|buenos días|buenas tardes|buenas noches|hey|qué tal|saludos)\b/i,
            /^(hi|hello)\b/i
        ],
        confirmation: [
            /^(sí|si|ok|okey|vale|claro|perfecto|de acuerdo|confirmo|acepto)\b/i
        ],
        negation: [
            /^(no|nop|nope|nel|negativo|mejor no)\b/i,
            /^cancelar\b/i
        ]
    };

    /**
     * Classify message using regex patterns
     * @param {string} message 
     * @returns {Object} Classification result
     */
    static classify(message) {
        const lower = message.toLowerCase().trim();

        for (const [intent, patterns] of Object.entries(this.patterns)) {
            if (patterns.some(p => p.test(lower))) {
                // If regex matches, we give it a moderate confidence
                // Note: Regex is precise but lacks nuance, so we limit confidence to 0.7
                // Exception: Simple greetings/confirmations can be higher
                let confidence = 0.65;
                if (['greeting', 'confirmation', 'negation'].includes(intent)) {
                    confidence = 0.85;
                }

                return {
                    intent,
                    entities: this.extractBasicEntities(message),
                    confidence,
                    reasoning: 'Matched fallback regex pattern',
                    method: 'fallback'
                };
            }
        }

        return {
            intent: 'unknown',
            entities: {},
            confidence: 0,
            reasoning: 'No regex pattern matched',
            method: 'fallback'
        };
    }

    /**
     * Extract entities using Regex + DateTimeParser
     */
    static extractBasicEntities(message) {
        const entities = {};

        // Use our robust parser for dates and times
        const date = DateTimeParser.parseRelativeDate(message);
        if (date) entities.targetDate = date;

        const time = DateTimeParser.parseTime(message);
        if (time) entities.targetTime = time;

        return entities;
    }
}
