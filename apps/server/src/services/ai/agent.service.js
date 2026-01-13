import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { Organization, Message, Conversation, Product, Customer } from '../../models/index.js';
import { decrypt } from '../encryption.service.js';
import { logger } from '../../utils/logger.js';

/**
 * AI Agent Service
 * Handles conversation with customers using LangChain + OpenAI
 */
export class AIAgentService {
    constructor(organizationId) {
        this.organizationId = organizationId;
        this.organization = null;
        this.llm = null;
    }

    /**
     * Initialize the agent with organization settings
     */
    async initialize() {
        this.organization = await Organization.findById(this.organizationId);

        if (!this.organization) {
            throw new Error('Organization not found');
        }

        // Get API key - either from org or fallback to env
        let apiKey = process.env.OPENAI_API_KEY;

        if (this.organization.apiKeys?.openai?.encrypted) {
            try {
                apiKey = decrypt(this.organization.apiKeys.openai);
            } catch (e) {
                logger.warn('Failed to decrypt org OpenAI key, using default');
            }
        }

        if (!apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const aiConfig = this.organization.aiConfig || {};

        this.llm = new ChatOpenAI({
            openAIApiKey: apiKey,
            modelName: aiConfig.model || 'gpt-4o-mini',
            temperature: aiConfig.temperature || 0.7,
            maxTokens: aiConfig.maxTokens || 500,
        });

        return this;
    }

    /**
     * Build the system prompt based on organization settings
     */
    buildSystemPrompt() {
        const config = this.organization.aiConfig || {};
        const settings = this.organization.settings || {};

        let systemPrompt = config.systemPrompt ||
            'Eres un asistente de ventas amable y profesional.';

        // Add business context
        systemPrompt += `\n\nInformación del negocio:
- Nombre: ${this.organization.name}
- Horario: ${settings.businessHours?.enabled ? 'Con horario definido' : 'Sin restricción de horario'}
- Idioma: ${settings.language || 'es'}

Instrucciones adicionales:
- Responde siempre en español a menos que el cliente escriba en otro idioma
- Sé conciso pero amable
- Si el cliente pregunta por productos, busca en el catálogo
- Si el cliente quiere agendar una cita, verifica disponibilidad
- Si el cliente pide hablar con un humano, indica que transferirás la conversación`;

        // Add personality modifiers
        if (config.personality?.tone === 'formal') {
            systemPrompt += '\n- Usa un tono formal y profesional (usted)';
        } else if (config.personality?.tone === 'casual') {
            systemPrompt += '\n- Usa un tono casual y cercano (tú)';
        }

        return systemPrompt;
    }

    /**
     * Get conversation history for context
     */
    async getConversationHistory(conversationId, limit = 10) {
        const messages = await Message.find({
            conversation: conversationId,
            deleted: false
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return messages.reverse().map(msg => {
            if (msg.senderType === 'customer') {
                return new HumanMessage(msg.content || '[media]');
            } else {
                return new AIMessage(msg.content || '[media]');
            }
        });
    }

    /**
     * Search products relevant to the query
     */
    async searchProducts(query, limit = 5) {
        const products = await Product.find({
            organization: this.organizationId,
            status: 'active',
            available: true,
            $text: { $search: query }
        })
            .limit(limit)
            .select('name description price category')
            .lean();

        return products;
    }

    /**
     * Detect customer intent from message
     */
    detectIntent(message) {
        const lowerMessage = message.toLowerCase();

        const intents = {
            greeting: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hi', 'hello'],
            inquiry: ['precio', 'costo', 'cuánto', 'tienen', 'hay', 'disponible', 'información'],
            purchase: ['comprar', 'quiero', 'me interesa', 'ordenar', 'pedir'],
            appointment: ['cita', 'agendar', 'reservar', 'horario', 'disponibilidad'],
            complaint: ['problema', 'queja', 'malo', 'reclamo', 'devolver'],
            human_handoff: ['humano', 'persona', 'agente', 'asesor', 'hablar con alguien']
        };

        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                return intent;
            }
        }

        return 'unknown';
    }

    /**
     * Generate AI response for a message
     */
    async generateResponse(conversationId, customerMessage, customerId) {
        const startTime = Date.now();

        try {
            // Build messages array
            const systemMessage = new SystemMessage(this.buildSystemPrompt());
            const history = await this.getConversationHistory(conversationId);

            // Detect intent
            const intent = this.detectIntent(customerMessage);

            // Add context based on intent
            let contextMessage = '';

            if (intent === 'inquiry' || intent === 'purchase') {
                const products = await this.searchProducts(customerMessage);
                if (products.length > 0) {
                    contextMessage = '\n\n[Productos relacionados encontrados:\n' +
                        products.map(p => `- ${p.name}: $${p.price} - ${p.description?.slice(0, 100) || ''}`).join('\n') +
                        ']';
                }
            }

            if (intent === 'human_handoff') {
                return {
                    content: 'Entiendo que prefieres hablar con uno de nuestros asesores. Voy a transferir tu conversación para que te atiendan personalmente. Por favor espera un momento. 🙋‍♂️',
                    intent,
                    shouldHandoff: true,
                    processingTime: Date.now() - startTime
                };
            }

            // Build final message
            const humanMessage = new HumanMessage(
                customerMessage + (contextMessage ? contextMessage : '')
            );

            const messages = [systemMessage, ...history, humanMessage];

            // Generate response
            const response = await this.llm.invoke(messages);

            const processingTime = Date.now() - startTime;

            logger.info(`AI response generated in ${processingTime}ms for org ${this.organizationId}`);

            return {
                content: response.content,
                intent,
                shouldHandoff: false,
                tokensUsed: response.usage_metadata?.total_tokens || 0,
                processingTime
            };

        } catch (error) {
            logger.error('AI generation error:', error);
            throw error;
        }
    }

    /**
     * Update customer lead score based on conversation
     */
    async updateLeadScore(customerId, intent, messageCount) {
        const customer = await Customer.findById(customerId);
        if (!customer) return;

        const scoreAdjustments = {
            greeting: 5,
            inquiry: 10,
            purchase: 25,
            appointment: 20,
            complaint: -5,
            human_handoff: 0,
            unknown: 2
        };

        let newScore = customer.leadScore + (scoreAdjustments[intent] || 0);

        // Bonus for engagement
        if (messageCount > 5) newScore += 5;
        if (messageCount > 10) newScore += 10;

        customer.leadScore = Math.min(100, Math.max(0, newScore));
        customer.insights.intents = customer.insights.intents || [];
        if (!customer.insights.intents.includes(intent)) {
            customer.insights.intents.push(intent);
        }

        await customer.save();

        return customer.leadScore;
    }
}

/**
 * Factory function to create and initialize an AI agent
 */
export async function createAIAgent(organizationId) {
    const agent = new AIAgentService(organizationId);
    await agent.initialize();
    return agent;
}
