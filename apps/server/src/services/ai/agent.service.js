import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { Organization, Message, Conversation, Product, Customer, AIUsage, Appointment } from '../../models/index.js';
import { getModelRouter } from './model-router.service.js';
import { searchKnowledge } from '../knowledge.service.js';
import { createAppointmentService, areAppointmentsEnabled } from '../integrations/appointment.service.js';
import { logger } from '../../utils/logger.js';

// SPIN Phase Prompts (with Onboarding)
const SPIN_PHASE_PROMPTS = {
    ONBOARDING: `[👋 FASE: ONBOARDING - Conocer al Cliente]
Tu objetivo es conocer al cliente de manera natural y establecer una conexión.

**PASO 1 - SALUDO:**
- Saluda cálidamente y preséntate brevemente como asesor de {empresa}
- SI ya conoces el nombre del cliente, salúdalo por su nombre.

**PASO 2 - OBTENER NOMBRE:**
- SI NO conoces su nombre: Pregunta "¿Con quién tengo el gusto de hablar?"
- SI YA conoces su nombre: OMITIR ESTE PASO.

**PASO 3 - OBTENER CONTACTO (opcional):**
- Pregunta esto SOLO si la conversación fluye bien y NO tienes ya el contacto.
- "¿Me compartes tu número de WhatsApp para darte mejor seguimiento?"
- SI el cliente se niega o ya lo tienes: CONTINÚA sin insistir.

**PASO 4 - TRANSICIÓN:**
- Pregunta: "¿En qué te puedo ayudar?" o "¿Qué te trae por aquí?"
- Cuando mencione su necesidad → emite: [PHASE:SITUATION]

**REGLAS:**
- Sé NATURAL, como una conversación real.
- NO preguntes cosas que ya sabes (revisa el contexto).
- Máximo 2-3 líneas por mensaje`,
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
        this.appointmentService = null; // Will be initialized if enabled
    }

    /**
     * Initialize with organization data
     */
    async initialize() {
        // Initialize router first
        this.router = await getModelRouter();

        this.organization = await Organization.findById(this.organizationId)
            .select('name email phone logo settings aiConfig appointmentsConfig')
            .lean();

        if (!this.organization) {
            throw new Error('Organization not found');
        }

        // Initialize appointment service if enabled
        try {
            if (await areAppointmentsEnabled(this.organizationId)) {
                this.appointmentService = await createAppointmentService(this.organizationId);
                logger.info(`Appointments enabled for org ${this.organizationId}`);
            }
        } catch (error) {
            logger.warn(`Could not initialize appointment service: ${error.message}`);
        }

        logger.info(`AI Agent initialized for org ${this.organizationId}`);

        return this;
    }

    /**
     * Build the system prompt based on organization settings
     */
    buildSystemPrompt(customer = null) {
        const config = this.organization.aiConfig || {};
        const settings = this.organization.settings || {};

        let systemPrompt = config.systemPrompt ||
            `Eres el Consultor de Ventas Senior de ${this.organization.name}`;

        // Inject Current Date/Time (Critical for appointments)
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        systemPrompt += `\n\n# 📅 FECHA Y HORA ACTUAL\nHoy es: ${dateStr}\nHora local: ${timeStr}`;

        // Inject Customer Context
        if (customer) {
            systemPrompt += `\n\n# 👤 CONTEXTO DEL CLIENTE ACTUAL
- ID: ${customer._id}
- Nombre: ${customer.name || 'Desconocido (Preguntar si es natural)'}
- Teléfono: ${customer.phone || 'Desconocido'}
- Correo: ${customer.email || 'Desconocido'}
- Estado: ${customer.stage || 'Nuevo'}
- Intereses Previos: ${customer.insights?.interests?.join(', ') || 'Ninguno'}
- Sentimiento Previo: ${customer.insights?.sentiment || 'Desconocido'}

IMPORTANTE: Ya conoces toda esta información. NO PIDA datos que ya tienes.`;
        }

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
     * Generate AI response for a message using Hybrid Brain (Classifier -> Controller -> Generator)
     */
    async generateResponse(conversationId, customerMessage, customerId) {
        const startTime = Date.now();
        let intent = 'unknown';
        let entities = {};
        let salesPhase = 'SITUATION';
        let contextMessage = '';
        let shouldHandoff = false;
        let appointmentData = null;

        try {
            // 1. FETCH CUSTOMER & CONTEXT
            const customer = customerId ? await Customer.findById(customerId).lean() : null;
            const conversation = await Conversation.findById(conversationId).select('context channel channelId').populate('channel', 'type').lean();
            if (conversation?.context?.salesPhase) {
                salesPhase = conversation.context.salesPhase;
            }
            const history = await this.getConversationHistory(conversationId);

            // 2. CLASSIFY (Cortex L1 - Gemini)
            const { aiClassifier } = await import('./ai-classifier.service.js');
            const classification = await aiClassifier.classify(customerMessage, {
                date: new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
            });

            intent = classification.intent;
            entities = classification.entities || {};
            logger.info(`🧠 Cortex L1 Intent: ${intent} | Date: ${entities.targetDate} | Time: ${entities.targetTime}`);

            // 3. CONTROLLER (Logic & Actions)
            switch (intent) {
                case 'human_handoff':
                    return {
                        content: 'Entiendo. Voy a transferir tu conversación con un asesor humano para que te atienda personalmente. Espere un momento... 🙋‍♂️',
                        intent,
                        shouldHandoff: true,
                        processingTime: Date.now() - startTime
                    };

                case 'appointment_new':
                case 'appointment_reschedule':
                    if (this.appointmentService?.isEnabled()) {
                        // Rescheduling logic
                        if (intent === 'appointment_reschedule') {
                            const existingApps = await this.appointmentService.findCustomerAppointments(customerId);
                            if (existingApps.length > 0) {
                                contextMessage += `\n[ℹ️ CITA EXISTENTE ENCONTRADA: ${existingApps[0].startTime}]\n`;
                                // If user provided new date, we can proceed to suggest booking
                            } else {
                                contextMessage += `\n[ℹ️ NO SE ENCONTRARON CITAS PREVIAS PARA REAGENDAR. TRATAR COMO NUEVA CITA]\n`;
                            }
                        }

                        // Check availability if date is requested
                        if (entities.targetDate) {
                            // Check specific availability logic could go here or fallback to general slots
                        }

                        const availableDays = await this.appointmentService.getAvailableDays(5);
                        const slotsInfo = this.appointmentService.formatSlotsForAI(availableDays);
                        contextMessage += `\n\n[📅 CITAS DISPONIBLES:\n${slotsInfo}\n\nINSTRUCCIONES PARA AGENDAR:\n1. Si el cliente dio fecha/hora (${entities.targetDate} ${entities.targetTime}) y está disponible, CONFIRMA con: [BOOK:${entities.targetDate || 'YYYY-MM-DD'} ${entities.targetTime || 'HH:MM'}]\n2. Si no, ofrece horarios.]`;
                    } else {
                        contextMessage += `\n[ℹ️ EL SISTEMA DE CITAS NO ESTÁ HABILITADO. Pide al cliente que contacte por teléfono.]`;
                    }
                    break;

                case 'quote_request':
                case 'product_info':
                case 'inquiry': // Fallback for general product qs
                    let products = [];
                    if (intent === 'quote_request' || intent === 'product_info') {
                        products = await this.searchProducts(customerMessage, 5);
                    } else {
                        products = await this.getAllProducts(5);
                    }

                    if (products.length > 0) {
                        contextMessage += '\n\n[CATÁLOGO/PRECIOS:\n' + products.map(p => `- ${p.name}: $${p.price} (${p.description})`).join('\n') + ']';
                    } else {
                        contextMessage += '\n[NO HAY PRODUCTOS QUE COINCIDAN EXACTAMENTE]';
                    }
                    break;

                case 'general_inquiry':
                case 'unknown':
                    // RAG Integration
                    const knowledgeChunks = await searchKnowledge(this.organizationId, customerMessage, 3);
                    const relevantChunks = knowledgeChunks.filter(chunk => chunk.score > 0.70);
                    if (relevantChunks.length > 0) {
                        contextMessage += `\n\n[CONOCIMIENTO DE EMPRESA:\n${relevantChunks.map(c => c.content).join('\n')}\n]`;
                    }
                    break;
            }

            // SPIN Phase Injection
            if (SPIN_PHASE_PROMPTS[salesPhase]) {
                contextMessage += `\n${SPIN_PHASE_PROMPTS[salesPhase]}\n`;
            }

            // 4. GENERATOR (Voice L2/L3 - GPT-4.1 via OpenRouter factory which we call 'createOpenRouterProvider' or utilize current config)
            // Note: The system currently uses 'router.chat'. We will stick to it but ensure prompt is robust.
            // Using GPT-4.1 for generation (assuming L3 provider is configured or forcing L3)

            const systemMessage = new SystemMessage(this.buildSystemPrompt(customer));
            // Inject analysis into system prompt or as context message? Context message is better.

            // Add Cortex Analysis to Context Logic
            let logicContext = `\n[ANÁLISIS CORTEX]\nIntención: ${intent}\n`;
            if (entities.targetDate) logicContext += `Fecha detectada: ${entities.targetDate}\n`;
            if (entities.targetTime) logicContext += `Hora detectada: ${entities.targetTime}\n`;

            const humanMessage = new HumanMessage(customerMessage + logicContext + contextMessage);
            const messages = [systemMessage, ...history, humanMessage];

            const response = await this.router.chat(messages, {
                message: customerMessage,
                context: { organizationId: this.organizationId, intent },
                temperature: 0.7,
                maxTokens: 500
            });

            // 5. POST-PROCESSING (Bookings, Phase Changes)
            // Detect Phase Transition
            const phaseMatch = response.content.match(/\[PHASE:(\w+)\]/);
            if (phaseMatch) {
                const newPhase = phaseMatch[1];
                if (['ONBOARDING', 'SITUATION', 'PROBLEM', 'IMPLICATION', 'NEED_PAYOFF', 'CLOSING', 'COMPLETED'].includes(newPhase)) {
                    await Conversation.findByIdAndUpdate(conversationId, {
                        $set: { 'context.salesPhase': newPhase, 'context.lastPhaseChangeAt': new Date() }
                    });
                    salesPhase = newPhase;
                }
                response.content = response.content.replace(/\[PHASE:\w+\]/g, '').trim();
            }

            // Detect Booking Command
            const bookMatch = response.content.match(/\[BOOK:(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\]/);
            if (bookMatch && this.appointmentService?.isEnabled() && customerId) {
                try {
                    const [_, dateStr, timeStr] = bookMatch;
                    const startTime = new Date(`${dateStr}T${timeStr}:00`);
                    const appointment = await this.appointmentService.createAppointment({
                        customerId, conversationId, startTime,
                        channel: conversation?.channel?.type || 'whatsapp', channelId: conversation?.channelId
                    });

                    // Format nicely
                    const dateFmt = startTime.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
                    const timeFmt = startTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });

                    response.content = response.content.replace(bookMatch[0], '').trim();
                    response.content += `\n\n✅ Cita confirmada para el ${dateFmt} a las ${timeFmt}. Te he enviado los detalles por correo.`; // The AI prompt should handle most, but this guarantees confirmation.

                    appointmentData = { id: appointment._id, startTime };
                    logger.info(`Appointment booked: ${appointment._id}`);
                } catch (err) {
                    logger.error('Booking failed:', err);
                    response.content = response.content.replace(bookMatch[0], '').trim();
                    response.content += "\n(Hubo un error técnico agendando la cita, por favor intenta en unos minutos o pide hablar con un humano).";
                }
            }

            // Extract data if Onboarding
            if (salesPhase === 'ONBOARDING' && customerId) {
                await this.extractAndSaveCustomerData(customerId, customerMessage);
            }

            return {
                content: response.content,
                intent,
                model: response.model,
                provider: response.provider,
                shouldHandoff,
                processingTime: Date.now() - startTime,
                salesPhase,
                appointment: appointmentData
            };

        } catch (error) {
            logger.error('Hybrid Brain Error:', error);
            // Fallback response
            return {
                content: "Disculpa, tuve un error procesando tu solicitud. ¿Podrías repetirlo?",
                intent: 'error',
                shouldHandoff: false
            };
        }
    }

    /**
     * Extract name, email, phone from customer message and update database
     * Enhanced with more patterns and normalization
     */
    async extractAndSaveCustomerData(customerId, message) {
        try {
            const updates = {};
            const messageLower = message.toLowerCase();

            // Extract email (improved pattern)
            const emailPatterns = [
                /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
                /correo[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
                /email[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
                /mail[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
            ];

            for (const pattern of emailPatterns) {
                const emailMatch = message.match(pattern);
                if (emailMatch) {
                    const email = (emailMatch[1] || emailMatch[0]).toLowerCase();
                    if (email.includes('@') && email.includes('.')) {
                        updates.email = email;
                        logger.info(`Extracted email: ${updates.email}`);
                        break;
                    }
                }
            }

            // Extract phone (multiple formats: MX, international, with/without +)
            const phonePatterns = [
                /(?:tel[eéfono]*|número|celular|whatsapp|cel|num)[:\s]*([+]?\d[\d\s.-]{8,15})/i,
                /([+]?52[\s.-]?)?(?:1[\s.-]?)?\d{2,3}[\s.-]?\d{3,4}[\s.-]?\d{4}/,
                /([+]?\d{1,3}[\s.-]?)?\(?\d{2,3}\)?[\s.-]?\d{3,4}[\s.-]?\d{4}/
            ];

            for (const pattern of phonePatterns) {
                const phoneMatch = message.match(pattern);
                if (phoneMatch) {
                    let phone = (phoneMatch[1] || phoneMatch[0]).replace(/[\s.()-]/g, '');
                    // Normalize: ensure it has at least 10 digits
                    const digits = phone.replace(/\D/g, '');
                    if (digits.length >= 10) {
                        // Add country code if missing
                        if (!phone.startsWith('+') && digits.length === 10) {
                            phone = '+52' + digits;
                        } else if (!phone.startsWith('+')) {
                            phone = '+' + digits;
                        }
                        updates.phone = phone;
                        logger.info(`Extracted phone: ${updates.phone}`);
                        break;
                    }
                }
            }

            // Extract name (enhanced patterns)
            const namePatterns = [
                // "Me llamo Juan", "Soy María", "Mi nombre es Carlos"
                /(?:me llamo|soy|mi nombre es|me dicen)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/i,
                // "Juan García" (just a name as response)
                /^\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})\s*[,.!]*\s*$/,
                // "Hola, soy Juan" with comma
                /(?:hola|buenas|buenos días|buenas tardes)[,\s]+(?:soy|me llamo)?\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/i
            ];

            // Common words to exclude as names
            const excludeWords = ['hola', 'buenas', 'buenos', 'dias', 'tardes', 'noches', 'gracias', 'por', 'favor', 'si', 'no', 'ok', 'bien', 'claro'];

            for (const pattern of namePatterns) {
                const nameMatch = message.match(pattern);
                if (nameMatch && nameMatch[1]) {
                    const name = nameMatch[1].trim();
                    const nameLower = name.toLowerCase();

                    // Validate name
                    if (name.length > 2 &&
                        name.length < 50 &&
                        !excludeWords.includes(nameLower) &&
                        !/\d/.test(name)) { // No numbers in name

                        // Capitalize properly
                        updates.name = name.split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ');
                        logger.info(`Extracted name: ${updates.name}`);
                        break;
                    }
                }
            }

            // Update customer if we found any data
            if (Object.keys(updates).length > 0) {
                await Customer.findByIdAndUpdate(customerId, { $set: updates });
                logger.info(`Updated customer ${customerId} with:`, updates);
            }
        } catch (error) {
            logger.error('Error extracting customer data:', error);
        }
    }

    /**
     * Update lead score based on conversation signals
     * @param {string} customerId - Customer ID
     * @param {string} intent - Detected intent from message
     * @param {number} totalMessages - Total messages in conversation
     * @param {string} salesPhase - Current SPIN phase
     * @param {string} sentiment - Detected sentiment
     */
    async updateLeadScore(customerId, intent, totalMessages, salesPhase = 'ONBOARDING', sentiment = 'neutral') {
        try {
            const customer = await Customer.findById(customerId);
            if (!customer) {
                logger.warn(`Customer ${customerId} not found for lead scoring`);
                return null;
            }

            let scoreChange = 0;

            // Intent-based scoring
            const intentScores = {
                'purchase': 25,         // Ready to buy
                'pricing': 15,          // Interested in prices
                'product_info': 10,     // Researching
                'greeting': 2,          // Initial contact
                'support': 5,           // Engaged (needs help)
                'human_handoff': -5,    // Might be frustrated
                'objection': -3,        // Has concerns
                'unknown': 1            // Default small bump
            };
            scoreChange += intentScores[intent] || 1;

            // Message engagement scoring
            if (totalMessages >= 3) scoreChange += 5;
            if (totalMessages >= 5) scoreChange += 5;
            if (totalMessages >= 10) scoreChange += 10;

            // Sales phase scoring (deeper = more interested)
            const phaseScores = {
                'ONBOARDING': 0,
                'SITUATION': 5,
                'PROBLEM': 10,
                'IMPLICATION': 15,
                'NEED_PAYOFF': 20,
                'CLOSING': 25,
                'COMPLETED': 30
            };
            scoreChange += phaseScores[salesPhase] || 0;

            // Sentiment adjustments
            if (sentiment === 'positive') scoreChange += 5;
            if (sentiment === 'negative') scoreChange -= 10;
            if (sentiment === 'urgent') scoreChange += 3; // Urgency might mean ready to buy

            // Calculate new score
            const currentScore = customer.leadScore || 0;
            const newScore = Math.min(100, Math.max(0, currentScore + scoreChange));

            // Only update if score changed
            if (newScore !== currentScore) {
                customer.leadScore = newScore;
                await customer.save();
                logger.info(`Lead score updated for ${customerId}: ${currentScore} → ${newScore} (${scoreChange > 0 ? '+' : ''}${scoreChange})`);
            }

            return newScore;
        } catch (error) {
            logger.error('Error updating lead score:', error);
            return null;
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
