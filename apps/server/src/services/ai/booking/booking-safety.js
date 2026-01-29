import { getRedis } from '../../../config/redis.js';
import { Appointment, Conversation } from '../../../models/index.js';
import { logger } from '../../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Booking Safety System
 * 
 * Implements:
 * 1. Output Contract (Structured JSON/Function Calling)
 * 2. Atomic Pending Bookings via Redis (TTL 5 min)
 * 3. Triple Validation (Format, Availability, Conflict)
 * 4. Idempotency via client_request_id
 */
export class BookingSafety {

    static PENDING_TTL = 300; // 5 minutes in seconds

    /**
     * Generate System Prompt for Booking Protocol
     */
    static getSystemPrompt() {
        return `
# 📅 PROTOCOLO DE AGENDAMIENTO - STRICT MODE

Cuando el usuario quiera agendar:
1. Obtén FECHA y HORA deseadas.
2. Propón el horario verbalmente.
3. AL FINAL, genera una acción estructurada (NO texto libre).

FORMATO DE SALIDA (Function Calling / JSON):
{
  "type": "suggested_action",
  "action": "book_appointment",
  "client_request_id": "generar_uuid_v4",
  "proposals": [
    { "date": "YYYY-MM-DD", "time": "HH:MM" }
  ],
  "confidence": 0.95
}

REGLAS CRÍTICAS:
- NUNCA agendes automáticamente (DB write).
- El sistema validará disponibilidad y conflictos.
- Si el usuario confirma, el sistema ejecutará la acción.
`;
    }

    /**
     * Process Booking Suggestion (Tier 1 & 2)
     */
    static async processSuggestion(responseContent, conversation, customerId, appointmentService) {
        let actionData = null;

        // 1. Try to extract JSON payload
        try {
            // Check for code block or allowed usage
            const match = responseContent.match(/\{[\s\S]*"type":\s*"suggested_action"[\s\S]*\}/);
            if (match) {
                actionData = JSON.parse(match[0]);
            }
        } catch (e) {
            // Not a valid JSON action, ignore
        }

        if (!actionData || actionData.action !== 'book_appointment') {
            return { hasPendingBooking: false };
        }

        const proposal = actionData.proposals[0]; // Take first proposal
        const requestId = actionData.client_request_id || uuidv4();

        logger.info(`Processing Booking Proposal: ${requestId}`, proposal);

        // VALIDATION 1: Basic Format
        if (!proposal.date || !proposal.time) {
            return {
                content: responseContent + "\n\n(Error técnico: Fecha/Hora inválida en propuesta)",
                hasPendingBooking: false
            };
        }

        const requestedDateTime = new Date(`${proposal.date}T${proposal.time}:00`);

        // VALIDATION 2: Slot Availability
        const availability = await appointmentService.checkSlotAvailability(requestedDateTime);
        if (!availability.available) {
            return {
                content: `Lo siento, acabo de revisar y el horario de las ${proposal.time} ya no está disponible. ${availability.message}`,
                hasPendingBooking: false
            };
        }

        // VALIDATION 3: Customer Conflicts
        const conflict = await appointmentService.checkCustomerConflicts(customerId, requestedDateTime);
        if (conflict.hasConflict) {
            return {
                content: `Parece que ya tienes una cita agendada para ese momento (${conflict.existingTime}). ¿Quieres cambiarla?`,
                hasPendingBooking: false
            };
        }

        // ✅ ALL CHECKS PASSED -> Save to Redis (Atomic)
        const redis = getRedis();

        if (!redis) {
            logger.warn('Redis unavailable, skipping atomic lock for booking');
            // Proceed without Redis lock (less safe but functional if infrastructure fails)
            // But we can't store the pending booking, so handleConfirmation will fail.
            // We must populate "pendingBooking" in memory return, but Controller won't persist it across requests unless we use DB.
            // For now, we return valid check, but warn.
            return {
                content: responseContent.replace(/\{[\s\S]*"type":\s*"suggested_action"[\s\S]*\}/, '').trim(),
                hasPendingBooking: false, // Cannot persist state without Redis
                warning: 'Redis unavailable'
            };
        }

        const redisKey = `pending:booking:${conversation._id}`;
        // Using conversation ID as key ensures only ONE pending booking per convo
        // We actally want client_request_id for idempotency on the ACTION, 
        // but for the conversation flow, we need to know "is there a pending booking now?"

        const bookingData = {
            requestId,
            customerId,
            conversationId: conversation._id,
            dateTime: requestedDateTime.toISOString(),
            date: proposal.date,
            time: proposal.time,
            attempts: 0
        };

        await redis.set(redisKey, JSON.stringify(bookingData), 'EX', this.PENDING_TTL);

        logger.info(`Pending booking saved in Redis: ${redisKey}`);

        // Clean query from valid JSON to avoid showing it to user? 
        // Actually, if it's "suggested_action" json, we might want to strip it from final user text
        // assuming the LLM put it in a separate block.
        const cleanContent = responseContent.replace(/\{[\s\S]*"type":\s*"suggested_action"[\s\S]*\}/, '').trim();

        return {
            content: cleanContent,
            hasPendingBooking: true,
            pendingBooking: bookingData
        };
    }

    /**
     * Handle User Confirmation
     */
    static async handleConfirmation(conversation, userText, intent, appointmentService) {
        const redis = getRedis();
        if (!redis) return null;

        const redisKey = `pending:booking:${conversation._id}`;
        const pendingJson = await redis.get(redisKey);

        if (!pendingJson) return null; // No pending booking

        const pending = JSON.parse(pendingJson);

        if (intent === 'confirmation') {
            // ✅ EXECUTE BOOKING

            // Re-check availability (Race Condition Safety)
            const recheck = await appointmentService.checkSlotAvailability(new Date(pending.dateTime));
            if (!recheck.available) {
                await redis.del(redisKey);
                return {
                    status: 'slot_lost',
                    content: '¡Uy! Alguien acaba de ganar ese horario. ¿Podemos buscar otro?'
                };
            }

            try {
                // DB Idempotency Check (Create Appointment)
                const appointment = await appointmentService.createAppointment({
                    customerId: pending.customerId,
                    conversationId: pending.conversationId,
                    startTime: new Date(pending.dateTime),
                    title: 'Cita Agendada por IA',
                    requestId: pending.requestId // Ensure DB schema has this or we check logic elsewhere
                });

                await redis.del(redisKey);

                return {
                    status: 'confirmed',
                    content: `✅ ¡Confirmado! Tu cita quedó agendada para el ${pending.date} a las ${pending.time}.`,
                    appointment
                };
            } catch (e) {
                logger.error('Booking Execution Failed', e);
                return {
                    status: 'error',
                    content: 'Hubo un error al guardar tu cita. Por favor intenta de nuevo.'
                };
            }

        } else if (intent === 'negation') {
            // ❌ CANCEL
            await redis.del(redisKey);
            return {
                status: 'cancelled',
                content: 'Entendido. ¿Qué otro horario prefieres?'
            };
        } else {
            // AMBIGUOUS
            return {
                status: 'clarification',
                content: `Para confirmar tu cita del ${pending.date} a las ${pending.time}, por favor responde "Sí" o "Confirmar".`
            };
        }
    }
}
