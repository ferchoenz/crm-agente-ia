import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { Organization, Message, Conversation, Product, Customer, AIUsage } from '../../models/index.js';
import { getModelRouter } from './model-router.service.js';
import { searchKnowledge } from '../knowledge.service.js';
import { logger } from '../../utils/logger.js';

/**
 * AI Agent Service
 * Handles conversation with customers using multi-model routing
 */
export class AIAgentService {
    constructor(organizationId) {
        this.organizationId = organizationId;
        this.router = null; // Will be initialized in initialize()
    }

    /**
     * Initialize with organization data
     */
    async initialize() {
        // Initialize router first
        this.router = await getModelRouter();

        this.organization = await Organization.findById(this.organizationId)
            .select('name email phone logo settings aiConfig')
            .lean();

        if (!this.organization) {
            throw new Error('Organization not found');
        }

        logger.info(`AI Agent initialized for org ${this.organizationId}`);

        return this;
    }

    /**
     * Build the system prompt based on organization settings
     */
    buildSystemPrompt() {
        const config = this.organization.aiConfig || {};
        const settings = this.organization.settings || {};

        let systemPrompt = config.systemPrompt ||
            `Eres el Asistente Virtual de ${this.organization.name}`;

        // Enhanced prompt with best practices
        systemPrompt += `

# 🎯 TU ROL
Respondes dudas de clientes basándote ESTRICTAMENTE en:
1. El catálogo de productos disponible (entre [PRODUCTOS])
2. La información de la empresa (entre [CONTEXTO])
3. El historial de la conversación

# ✅ TONO Y ESTILO
- **Profesional, empático y resolutivo**
- Habla en español neutral
- **Sé conciso**: Ve al grano, evita introducciones largas
- Usa listas y negritas para facilitar lectura rápida
- Máximo 3-4 líneas por respuesta

# 🧠 REGLAS DE RAZONAMIENTO
1. **ANÁLISIS**: Lee la pregunta del cliente y revisa PRIMERO el contexto proporcionado
2. **VERACIDAD**: Si la respuesta está en el contexto, respóndela con confianza
3. **LIMITACIÓN CRÍTICA**: 
   - ❌ Si la info NO está en [PRODUCTOS] o [CONTEXTO], NO la inventes
   - ✅ Di: "No tengo esa información específica. ¿Te gustaría que te contacte un asesor?"
4. **PRODUCTOS**:
   - SOLO menciona productos que aparezcan en [PRODUCTOS]
   - Si NO hay productos listados, NO inventes ninguno
   - Si preguntan por productos que NO están, di: "Actualmente no tengo ese producto en mi catálogo"

# 📦 USO DE CATÁLOGO
- Si recibes [PRODUCTOS: ninguno], significa que NO HAY PRODUCTOS
- NO menciones productos de otros documentos o manuales
- Cada producto tiene: nombre, precio, descripción
- Sé específico con nombres y precios exactos

# 💬 MEMORIA CONVERSACIONAL
- Revisa el historial antes de responder
- NO repitas información ya compartida
- Si ya mencionaste algo, di "Como te comenté..."

# ❌ NUNCA HAGAS ESTO
- Inventar productos que no están en [PRODUCTOS]
- Copiar/pegar documentos completos
- Respuestas de más de 5 líneas
- Hablar de productos si [PRODUCTOS: ninguno]
- Usar información de manuales como si fueran productos

# ✅ EJEMPLOS

**Cliente:** "Qué productos tienen?"
- Si [PRODUCTOS: ninguno] → "Actualmente estoy configurando el catálogo. ¿Te gustaría que un asesor te contacte?"
- Si [PRODUCTOS: Laptop HP...] → "Tenemos: Laptop HP a $15,000. ¿Te interesa conocer más detalles?"

**Cliente:** "Cuánto cuesta X?"
- Si X NO está en [PRODUCTOS] → "No tengo ese producto en catálogo actualmente"
- Si X está en [PRODUCTOS] → "El [nombre exacto] tiene un precio de $[precio exacto]"

**Empresa:** ${this.organization.name}
**Horario:** ${settings.businessHours?.enabled ? 'Con horario definido' : 'Disponible 24/7'}`;

        // Add personality
        if (config.personality?.tone === 'formal') {
            systemPrompt += '\n\n**TONO:** Formal y profesional (usar "usted")';
        } else {
            systemPrompt += '\n\n**TONO:** Amigable pero profesional (usar "tú")';
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
     * Search products relevant to the query - IMPROVED
     */
    async searchProducts(query, limit = 5) {
        try {
            // Try regex search first (more reliable)
            const searchRegex = new RegExp(query.split(' ').join('|'), 'i');

            const products = await Product.find({
                organization: this.organizationId,
                status: 'active',
                available: true,
                $or: [
                    { name: searchRegex },
                    { description: searchRegex },
                    { category: searchRegex }
                ]
            })
                .limit(limit)
                .select('name description price category stock')
                .lean();

            return products;
        } catch (error) {
            logger.error('Error searching products:', error);
            return [];
        }
    }

    /**
     * Get ALL active products if query is general
     */
    async getAllProducts(limit = 10) {
        try {
            const products = await Product.find({
                organization: this.organizationId,
                status: 'active',
                available: true
            })
                .limit(limit)
                .select('name description price category stock')
                .lean();

            return products;
        } catch (error) {
            logger.error('Error getting all products:', error);
            return [];
        }
    }

    /**
     * Detect customer intent from message
     */
    detectIntent(message) {
        const lowerMessage = message.toLowerCase();

        const intents = {
            greeting: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hi', 'hello', 'qué tal'],
            product_list: ['qué tienen', 'qué venden', 'productos', 'catálogo', 'qué ofrecen', 'servicios'],
            inquiry: ['precio', 'costo', 'cuánto', 'disponible', 'información', 'características'],
            purchase: ['comprar', 'quiero', 'me interesa', 'ordenar', 'pedir'],
            appointment: ['cita', 'agendar', 'reservar', 'horario', 'disponibilidad'],
            complaint: ['problema', 'queja', 'malo', 'reclamo', 'devolver'],
            human_handoff: ['humano', 'persona', 'agente', 'asesor', 'hablar con alguien', 'operador']
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

            // Build context message
            let contextMessage = '';
            let products = [];

            // PRODUCTS: Only add if intent is product-related
            if (intent === 'inquiry' || intent === 'purchase' || intent === 'product_list') {
                if (intent === 'product_list') {
                    // Get all products for general queries
                    products = await this.getAllProducts(5);
                } else {
                    // Search specific products
                    products = await this.searchProducts(customerMessage, 5);
                }

                if (products.length > 0) {
                    contextMessage += '\n\n[PRODUCTOS DISPONIBLES:\n' +
                        products.map(p =>
                            `- ${p.name}: $${p.price}${p.description ? ' - ' + p.description.slice(0, 80) : ''}${p.stock !== undefined ? ` (Stock: ${p.stock})` : ''}`
                        ).join('\n') +
                        '\n]';
                } else {
                    contextMessage += '\n\n[PRODUCTOS: ninguno - No hay productos que coincidan con la búsqueda]';
                }
            }

            // KNOWLEDGE BASE: Only if NOT a product query (limit to 2 chunks, max 200 chars each)
            if (intent !== 'inquiry' && intent !== 'purchase' && intent !== 'product_list') {
                const knowledgeChunks = await searchKnowledge(this.organizationId, customerMessage, 2);
                if (knowledgeChunks.length > 0) {
                    const knowledgeContext = knowledgeChunks.map(chunk =>
                        `${chunk.content.slice(0, 200)}...`
                    ).join('\n');
                    contextMessage += `\n\n[CONTEXTO EMPRESA:\n${knowledgeContext}\n]`;
                }
            }

            // Handle human handoff
            if (intent === 'human_handoff') {
                return {
                    content: 'Entiendo que prefieres hablar con un asesor. Voy a transferir tu conversación para que te atiendan personalmente. 🙋‍♂️',
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

            // Generate response using router
            const aiConfig = this.organization.aiConfig || {};
            const forceLevel = aiConfig.routingMode === 'fixed' ? aiConfig.preferredLevel : null;

            const response = await this.router.chat(messages, {
                message: customerMessage,
                context: {
                    organizationId: this.organizationId,
                    conversationId,
                    customerId,
                    intent,
                    hasProducts: products.length > 0
                },
                temperature: aiConfig.personality?.temperature || 0.7,
                maxTokens: 200, // Short responses
                forceLevel
            });

            const processingTime = Date.now() - startTime;

            return {
                content: response.content,
                intent,
                model: response.model,
                provider: response.provider,
                shouldHandoff: false,
                processingTime
            };

        } catch (error) {
            logger.error('Error generating AI response:', error);
            throw error;
        }
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
