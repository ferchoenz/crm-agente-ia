import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { Organization, Message, Conversation, Product, Customer, AIUsage } from '../../models/index.js';
import { getModelRouter } from './model-router.service.js';
import { searchKnowledge } from '../knowledge.service.js';
import { logger } from '../../utils/logger.js';

// SPIN Phase Prompts
const SPIN_PHASE_PROMPTS = {
    SITUATION: `[🎯 FASE SPIN: SITUACIÓN]
Tu objetivo es entender el CONTEXTO del cliente.
- Haz preguntas abiertas: "¿Cuéntame sobre tu negocio/situación actual?"
- NO vendas todavía, solo escucha y recopila información.
- Cuando entiendas su contexto, emite: [PHASE:PROBLEM]`,
    PROBLEM: `[🔍 FASE SPIN: PROBLEMA]
Ya conoces su contexto. Ahora indaga sobre DIFICULTADES.
- Pregunta: "¿Qué desafíos enfrentas actualmente con...?"
- Descubre puntos de dolor sin ofrecer solución aún.
- Cuando identifiques un problema claro, emite: [PHASE:IMPLICATION]`,
    IMPLICATION: `[⚠️ FASE SPIN: IMPLICACIÓN]
Haz que el cliente sienta el PESO del problema.
- Pregunta: "¿Qué pasa si esto no se resuelve?", "¿Cuánto te cuesta este problema?"
- Amplifica la urgencia sin ser agresivo.
- Cuando el cliente exprese preocupación, emite: [PHASE:NEED_PAYOFF]`,
    NEED_PAYOFF: `[✅ FASE SPIN: NECESIDAD-BENEFICIO]
Haz que el cliente VERBALICE los beneficios de resolver el problema.
- Pregunta: "¿Cómo cambiaría tu situación si resolvieras esto?"
- Deja que él diga por qué necesita la solución.
- Cuando esté listo para comprar, emite: [PHASE:CLOSING]`,
    CLOSING: `[🎯 FASE SPIN: CIERRE]
El cliente está listo. CIERRA LA VENTA.
- Presenta tu solución conectada a sus necesidades específicas.
- Usa call-to-action directo: "¿Te envío el enlace de pago?"
- Cuando confirme compra, emite: [PHASE:COMPLETED]`,
    COMPLETED: `[🏆 VENTA COMPLETADA] Agradece y ofrece soporte post-venta.`
};

// LAER Objection Framework
const LAER_PROMPT = `[⚡ OBJECIÓN DETECTADA - Usa Marco LAER]
1. LISTEN (Escucha): Deja que termine de expresarse.
2. ACKNOWLEDGE (Reconoce): "Entiendo tu punto sobre..." (valida sin rendirte).
3. EXPLORE (Explora): "¿Podrías contarme más sobre...?" (descubre la objeción real).
4. RESPOND (Responde): Solo después de explorar, da tu respuesta enfocada en valor.
NUNCA: Des descuento inmediato. SIEMPRE: Explora primero.`;

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

# 🏢 INFORMACIÓN DEL NEGOCIO (Prioridad Alta)
- Si hay información en [INFORMACIÓN DEL NEGOCIO], ÚSÁLA para responder.
- Si una política de la empresa contradice tu entrenamiento general, obedece la política de la empresa.
- Si el cliente pregunta algo específico que está en el contexto (envíos, garantías), responde con esa información exacta.

# ❌ LÍMITES (NUNCA hacer)
- Inventar productos/servicios no listados
- Prometer descuentos mayores a lo permitido
- Dar información técnica sin verificar en contexto
- Respuestas de más de 5 líneas
- Terminar sin call-to-action
- **NUNCA** incluir notas, paréntesis explicativos, o meta-comentarios como "(Nota: ...)" o "(Por favor...)" 
- **NUNCA** citar documentos completos ni bloques de texto internos al cliente

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

        // PRIORITY: Check handoff FIRST (human request takes precedence)
        const handoffKeywords = [
            'humano', 'persona', 'agente', 'asesor', 'operador',
            'hablar con alguien', 'persona real', 'representante',
            'alguien más', 'otro agente', 'supervisor',
            'no me entiendes', 'no entiendes', 'no me estás entendiendo',
            'quiero hablar', 'necesito hablar', 'quiero un humano',
            'pásame con', 'transfiéreme', 'escalame'
        ];

        if (handoffKeywords.some(keyword => lowerMessage.includes(keyword))) {
            return 'human_handoff';
        }

        const intents = {
            greeting: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hi', 'hello', 'qué tal'],
            product_list: ['qué tienen', 'qué venden', 'productos', 'catálogo', 'qué ofrecen', 'servicios'],
            inquiry: ['precio', 'costo', 'cuánto', 'disponible', 'información', 'características'],
            purchase: ['comprar', 'quiero', 'me interesa', 'ordenar', 'pedir'],
            appointment: ['cita', 'agendar', 'reservar', 'horario', 'disponibilidad'],
            complaint: ['problema', 'queja', 'malo', 'reclamo', 'devolver']
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

            // Detect intent (Legacy regex + Vector fallback if needed)
            const intent = this.detectIntent(customerMessage);

            // DETECT SENTIMENT (Vector)
            const { vectorRouter } = await import('../../utils/vector-router.util.js');
            const sentimentMatch = await vectorRouter.classify(customerMessage, 'sentiment');
            const sentiment = sentimentMatch.name;

            // Build context message
            let contextMessage = '';

            // Inject Sentiment Adjustments
            if (sentiment === 'negative') {
                contextMessage += `\n[⚠️ DETECCIÓN DE SENTIMIENTO: El cliente parece MOLESTO/FRUSTRADO. Tono obligatorio: Empático, ofrece disculpas cortas, no uses emojis felices, ve directo a la solución.]\n`;
            } else if (sentiment === 'urgent') {
                contextMessage += `\n[⚠️ DETECCIÓN DE SENTIMIENTO: El cliente tiene URGENCIA. Tono obligatorio: Directo, rápido, evita saludos largos, da la solución inmediata.]\n`;
            } else if (sentiment === 'positive') {
                contextMessage += `\n[✨ DETECCIÓN DE SENTIMIENTO: El cliente está FELIZ. Tono: Entusiasta, agradece la confianza, usa emojis positivos.]\n`;
            }

            // Get conversation for SPIN phase (or default to SITUATION)
            const conversation = await Conversation.findById(conversationId).select('context').lean();
            const currentPhase = conversation?.context?.salesPhase || 'SITUATION';

            // Inject SPIN Phase Guidance
            if (SPIN_PHASE_PROMPTS[currentPhase]) {
                contextMessage += `\n${SPIN_PHASE_PROMPTS[currentPhase]}\n`;
            }

            // Inject LAER Framework for Objections (via semantic classification)
            const intentMatch = await vectorRouter.classify(customerMessage, 'intent');
            if (intentMatch.name === 'objection' && intentMatch.score > 0.6) {
                contextMessage += `\n${LAER_PROMPT}\n`;
            }

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

            // KNOWLEDGE BASE (RAG): Search for relevant company info/policies
            // Only inject if similarity is high enough to be truly relevant
            const knowledgeChunks = await searchKnowledge(this.organizationId, customerMessage, 3);
            const relevantChunks = knowledgeChunks.filter(chunk => chunk.score > 0.75); // Filter by relevance
            if (relevantChunks.length > 0) {
                const knowledgeContext = relevantChunks.map(chunk =>
                    `- ${chunk.content.slice(0, 200)}` // Shorter excerpts
                ).join('\n');
                contextMessage += `\n\n[INFORMACIÓN DEL NEGOCIO (Referencia, NO citar textualmente):\n${knowledgeContext}\n]`;
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
                maxTokens: 400, // Increased to prevent truncation
                forceLevel
            });

            const processingTime = Date.now() - startTime;

            // Detect Phase Transition from AI Response
            const phaseMatch = response.content.match(/\[PHASE:(\w+)\]/);
            if (phaseMatch) {
                const newPhase = phaseMatch[1];
                if (['SITUATION', 'PROBLEM', 'IMPLICATION', 'NEED_PAYOFF', 'CLOSING', 'COMPLETED'].includes(newPhase)) {
                    await Conversation.findByIdAndUpdate(conversationId, {
                        $set: {
                            'context.salesPhase': newPhase,
                            'context.lastPhaseChangeAt': new Date()
                        }
                    });
                    logger.info(`SPIN Phase transitioned to ${newPhase} for conversation ${conversationId}`);
                }
                // Remove the phase tag from the response shown to the customer
                response.content = response.content.replace(/\[PHASE:\w+\]/g, '').trim();
            }

            return {
                content: response.content,
                intent,
                model: response.model,
                provider: response.provider,
                shouldHandoff: false,
                processingTime,
                salesPhase: phaseMatch ? phaseMatch[1] : currentPhase
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
