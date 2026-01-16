/**
 * Customer Insights Service
 * Generates AI-powered customer summaries and analysis
 */

import { Customer, Conversation, Message } from '../../models/index.js';
import { getModelRouter } from './model-router.service.js';
import { logger } from '../../utils/logger.js';

/**
 * Generate AI summary for a customer based on their conversation history
 */
export async function generateCustomerSummary(customerId, organizationId) {
    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            throw new Error('Customer not found');
        }

        // Get recent conversations
        const conversations = await Conversation.find({
            customer: customerId,
            organization: organizationId
        }).select('_id').lean();

        if (!conversations.length) {
            return null;
        }

        // Get last 30 messages from customer
        const customerMessages = await Message.find({
            conversation: { $in: conversations.map(c => c._id) },
            senderType: 'customer'
        })
            .sort({ createdAt: -1 })
            .limit(30)
            .select('content createdAt')
            .lean();

        if (customerMessages.length < 3) {
            // Not enough messages to generate meaningful summary
            return null;
        }

        // Build analysis prompt
        const messagesText = customerMessages
            .reverse()
            .map(m => m.content)
            .join('\n---\n');

        const analysisPrompt = `Analiza estos mensajes de un cliente y genera un JSON con el siguiente formato:
{
  "summary": "Resumen de 2-3 oraciones sobre quién es y qué busca este cliente",
  "interests": ["interés 1", "interés 2", "interés 3"],
  "intents": ["consulta", "compra", "soporte"],
  "sentiment": "positivo|neutral|negativo",
  "buyingSignals": {
    "askedPrice": true/false,
    "mentionedBuying": true/false,
    "urgency": "alta|media|baja|ninguna"
  }
}

Mensajes del cliente:
${messagesText}

Responde SOLO con el JSON, sin explicaciones adicionales.`;

        // Get model router and generate summary
        const router = await getModelRouter();
        const response = await router.chat([
            { role: 'system', content: 'Eres un analista de CRM experto en perfilamiento de clientes. Respondes solo en formato JSON.' },
            { role: 'user', content: analysisPrompt }
        ], { forceLevel: 'L2' }); // Use L2 for structured analysis

        // Parse response
        let insights;
        try {
            // Clean the response and parse JSON
            const jsonStr = response.content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            insights = JSON.parse(jsonStr);
        } catch (parseError) {
            logger.error('Failed to parse customer insights JSON:', parseError);
            // Fallback: extract text summary
            insights = {
                summary: response.content.slice(0, 300),
                interests: [],
                intents: ['consulta'],
                sentiment: 'neutral',
                buyingSignals: {}
            };
        }

        // Update customer with insights
        await Customer.findByIdAndUpdate(customerId, {
            'insights.summary': insights.summary,
            'insights.interests': insights.interests || [],
            'insights.intents': insights.intents || [],
            'insights.sentiment': insights.sentiment || 'neutral',
            'insights.buyingSignals': insights.buyingSignals || {},
            'insights.lastAnalyzedAt': new Date()
        });

        logger.info(`Customer summary generated for ${customerId}`);
        return insights;

    } catch (error) {
        logger.error('Error generating customer summary:', error);
        throw error;
    }
}

/**
 * Detect buying signals from a single message
 */
export function detectBuyingSignals(message) {
    const lower = message.toLowerCase();

    return {
        askedAboutPrice: /precio|costo|cuánto|cuanto|valor|tarifa/.test(lower),
        mentionedBuying: /comprar|adquirir|quiero|necesito|me interesa|ordenar/.test(lower),
        requestedQuote: /cotiza|presupuesto|propuesta|cotización/.test(lower),
        mentionedUrgency: /urgente|hoy|rápido|pronto|antes de|necesito ya/.test(lower),
        askedAboutPayment: /pago|tarjeta|transferencia|meses|plazos|efectivo/.test(lower),
        askedAboutAvailability: /disponible|stock|tienen|hay|cuándo llega/.test(lower),
        comparedCompetitors: /competencia|otra empresa|alternativa|más barato/.test(lower),
        negativeSentiment: /malo|problema|queja|molesto|decepcion|no funciona/.test(lower),
        expressedFrustration: /no entiendes|otra vez|ya te dije|qué lento/.test(lower)
    };
}

/**
 * Calculate updated lead score based on detected signals
 */
export async function updateCustomerLeadScore(customerId, signals) {
    try {
        const customer = await Customer.findById(customerId);
        if (!customer) return null;

        let scoreChange = 0;

        // Positive signals
        if (signals.askedAboutPrice) scoreChange += 15;
        if (signals.mentionedBuying) scoreChange += 25;
        if (signals.requestedQuote) scoreChange += 30;
        if (signals.mentionedUrgency) scoreChange += 20;
        if (signals.askedAboutPayment) scoreChange += 25;
        if (signals.askedAboutAvailability) scoreChange += 10;
        if (signals.comparedCompetitors) scoreChange += 10;

        // Negative signals
        if (signals.negativeSentiment) scoreChange -= 15;
        if (signals.expressedFrustration) scoreChange -= 20;

        // Calculate new score (clamp between 0-100)
        const currentScore = customer.leadScore || 0;
        const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));

        // Update customer
        await Customer.findByIdAndUpdate(customerId, {
            leadScore: newScore,
            'insights.lastSignals': signals,
            'stats.lastContactAt': new Date()
        });

        // Auto-upgrade stage based on score
        if (newScore >= 70 && customer.stage === 'new') {
            await Customer.findByIdAndUpdate(customerId, { stage: 'qualified' });
        } else if (newScore >= 50 && customer.stage === 'new') {
            await Customer.findByIdAndUpdate(customerId, { stage: 'contacted' });
        }

        return newScore;

    } catch (error) {
        logger.error('Error updating lead score:', error);
        return null;
    }
}

/**
 * Trigger summary generation for customers with enough history
 */
export async function processCustomerForInsights(customerId, organizationId) {
    try {
        const customer = await Customer.findById(customerId);

        // Only generate if customer has enough messages and hasn't been analyzed recently
        const hoursSinceAnalysis = customer.insights?.lastAnalyzedAt
            ? (Date.now() - new Date(customer.insights.lastAnalyzedAt).getTime()) / (1000 * 60 * 60)
            : Infinity;

        const totalMessages = customer.stats?.totalMessages || 0;

        // Generate summary if: 10+ messages AND (never analyzed OR analyzed > 24 hours ago)
        if (totalMessages >= 10 && hoursSinceAnalysis > 24) {
            await generateCustomerSummary(customerId, organizationId);
        }

    } catch (error) {
        logger.error('Error processing customer for insights:', error);
    }
}
