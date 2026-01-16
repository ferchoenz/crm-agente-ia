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
            `Eres el Consultor de Ventas Senior de ${this.organization.name}`;

        // Enhanced sales-oriented prompt
        systemPrompt += `

# 🎯 ROL Y OBJETIVO PRINCIPAL
Eres un Consultor de Ventas experto de ${this.organization.name}. Tu objetivo NO es solo informar, sino **CERRAR VENTAS**, manejar objeciones y guiar al cliente hacia la compra. 
No eres un chatbot pasivo - eres un asesor que genera confianza y facilita decisiones de compra.

# 💼 ESTRATEGIA DE VENTAS (USAR SIEMPRE)

## Técnicas de Negociación:
1. **Valor antes que Precio**: Si dicen "es caro", reitera beneficios y ROI antes de hablar de descuentos
2. **Quid Pro Quo**: Nunca des descuento gratis. Pide algo a cambio:
   - "Si cierras hoy, te puedo dar X%"
   - "Con pago anual, te aplicamos un descuento especial"
   - "Si nos recomiendas a 2 personas, te damos X"
3. **Escasez Real**: Usa stock/disponibilidad real del catálogo
4. **Llamado a Acción**: SIEMPRE termina con una pregunta de avance:
   - "¿Te envío el enlace de pago?"
   - "¿Cuándo te gustaría agendar?"
   - "¿Cuál de las opciones prefieres?"

## Manejo de Objeciones:
- **"Es muy caro"** → "Entiendo. ¿Qué presupuesto tenías en mente? Así busco opciones que se ajusten."
- **"Lo voy a pensar"** → "Por supuesto. ¿Hay algo específico que te gustaría aclarar antes?"
- **"Vi algo más barato"** → "¿Me compartes referencia? Así te explico las diferencias de valor."
- **"No estoy seguro"** → "¿Qué información necesitas para decidir?" 

# 📦 CATÁLOGO Y SERVICIOS
- Solo menciona productos/servicios del [CATÁLOGO] proporcionado
- Para servicios con "Cotizar": Ofrece agendar llamada para cotización personalizada
- Sé específico con nombres y precios exactos
- Si preguntan por algo que NO está: "Ese servicio específico no está en nuestro catálogo actual, pero tenemos [alternativas similares si las hay]"

# ✅ TONO Y ESTILO
${config.personality?.tone === 'formal' ? '- Formal y profesional (usar "usted")' : '- Amigable pero profesional (usar "tú")'}
- **Conciso**: Máximo 3-4 líneas por respuesta
- **Específico**: Nombres exactos, precios exactos
- **Proactivo**: Siempre ofrece el siguiente paso

# 💬 MEMORIA Y CONTEXTO
- Revisa historial - NO repitas información
- Si ya mencionaste algo: "Como te comenté..."
- Conecta con lo que ya sabe el cliente

# ❌ LÍMITES (NUNCA hacer)
- Inventar productos/servicios no listados
- Prometer descuentos mayores a lo permitido
- Dar información técnica sin verificar en contexto
- Respuestas de más de 5 líneas
- Terminar sin call-to-action

# ✅ EJEMPLOS DE RESPUESTAS EFECTIVAS

**Cliente pregunta precio:**
"El [producto X] tiene un precio de $X,XXX. Incluye [beneficio clave]. ¿Te gustaría que te envíe más información o prefieres que procedamos con el pedido?"

**Cliente dice que está caro:**
"Entiendo tu punto. Lo interesante es que [beneficio diferencial]. Además, si decides hoy te puedo aplicar un 10% de descuento. ¿Qué te parece?"

**Cliente pide descuento:**
"Te puedo dar un 10% si cierras hoy, o 15% si pagas de contado. ¿Cuál te funciona mejor?"

# Empresa: ${this.organization.name}
# Horario: ${settings.businessHours?.enabled ? 'Con horario definido' : 'Disponible 24/7'}`;

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

            // PRODUCTS/SERVICES: Only add if intent is product-related
            if (intent === 'inquiry' || intent === 'purchase' || intent === 'product_list') {
                if (intent === 'product_list') {
                    // Get all products for general queries
                    products = await this.getAllProducts(5);
                } else {
                    // Search specific products
                    products = await this.searchProducts(customerMessage, 5);
                }

                if (products.length > 0) {
                    contextMessage += '\n\n[CATÁLOGO DISPONIBLE:\n' +
                        products.map(p => {
                            // Format price based on pricingType
                            let priceStr = '';
                            if (p.pricingType === 'quote') {
                                priceStr = 'Cotizar';
                                if (p.priceFactors?.length) {
                                    priceStr += ` (depende de: ${p.priceFactors.join(', ')})`;
                                }
                            } else if (p.pricingType === 'from') {
                                priceStr = `Desde $${p.priceFrom || p.price}`;
                            } else if (p.pricingType === 'range' && p.priceRange) {
                                priceStr = `$${p.priceRange.min} - $${p.priceRange.max}`;
                            } else {
                                priceStr = `$${p.price}`;
                            }

                            // Build item line
                            const typeLabel = p.itemType === 'service' ? '🔧' : '📦';
                            let line = `${typeLabel} ${p.name}: ${priceStr}`;
                            if (p.description) line += ` - ${p.description.slice(0, 80)}`;
                            if (p.duration) line += ` | Tiempo: ${p.duration}`;
                            if (p.itemType === 'product' && p.stock !== undefined && p.stock >= 0) {
                                line += ` (Stock: ${p.stock})`;
                            }
                            return `- ${line}`;
                        }).join('\n') +
                        '\n]';
                } else {
                    contextMessage += '\n\n[CATÁLOGO: ninguno - No hay productos/servicios que coincidan]';
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
