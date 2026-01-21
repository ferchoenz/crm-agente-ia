import mongoose from 'mongoose';
import { PLANS, PLAN_LIMITS } from '../config/constants.js';

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    logo: {
        type: String
    },
    plan: {
        type: String,
        enum: Object.values(PLANS),
        default: PLANS.FREE
    },
    active: {
        type: Boolean,
        default: true
    },

    // Business settings
    settings: {
        timezone: {
            type: String,
            default: 'America/Mexico_City'
        },
        language: {
            type: String,
            default: 'es'
        },
        businessHours: {
            enabled: { type: Boolean, default: false },
            schedule: {
                monday: { start: String, end: String, enabled: { type: Boolean, default: true } },
                tuesday: { start: String, end: String, enabled: { type: Boolean, default: true } },
                wednesday: { start: String, end: String, enabled: { type: Boolean, default: true } },
                thursday: { start: String, end: String, enabled: { type: Boolean, default: true } },
                friday: { start: String, end: String, enabled: { type: Boolean, default: true } },
                saturday: { start: String, end: String, enabled: { type: Boolean, default: false } },
                sunday: { start: String, end: String, enabled: { type: Boolean, default: false } }
            },
            outOfHoursMessage: {
                type: String,
                default: 'Gracias por escribirnos. En este momento estamos fuera de horario. Te responderemos pronto.'
            }
        }
    },

    // AI Configuration
    aiConfig: {
        enabled: { type: Boolean, default: true },
        provider: { type: String, default: 'openai' },
        model: { type: String, default: 'gpt-4o-mini' },
        temperature: { type: Number, default: 0.7, min: 0, max: 2 },
        maxTokens: { type: Number, default: 500 },

        // System prompt / personality
        systemPrompt: {
            type: String,
            default: 'Eres un asistente de ventas amable y profesional. Tu objetivo es ayudar a los clientes a encontrar los productos que necesitan y resolver sus dudas.'
        },
        personality: {
            tone: { type: String, default: 'friendly' }, // friendly, formal, casual
            responseStyle: { type: String, default: 'concise' } // concise, detailed
        },

        // Behavior settings
        autoReply: { type: Boolean, default: true },
        humanHandoffKeywords: {
            type: [String],
            default: ['hablar con humano', 'agente humano', 'persona real', 'asesor']
        },
        greetingMessage: {
            type: String,
            default: '¡Hola! 👋 Soy el asistente virtual. ¿En qué puedo ayudarte hoy?'
        }
    },

    // Appointments Configuration
    appointmentsConfig: {
        enabled: { type: Boolean, default: false },
        defaultDuration: { type: Number, default: 60 }, // minutes
        bufferMinutes: { type: Number, default: 15 }, // time between appointments
        maxAdvanceDays: { type: Number, default: 30 }, // max days in advance to book
        calendarId: { type: String, default: 'primary' },

        // Business hours for appointments (can differ from general business hours)
        businessHours: {
            monday: { start: { type: String, default: '09:00' }, end: { type: String, default: '18:00' }, enabled: { type: Boolean, default: true } },
            tuesday: { start: { type: String, default: '09:00' }, end: { type: String, default: '18:00' }, enabled: { type: Boolean, default: true } },
            wednesday: { start: { type: String, default: '09:00' }, end: { type: String, default: '18:00' }, enabled: { type: Boolean, default: true } },
            thursday: { start: { type: String, default: '09:00' }, end: { type: String, default: '18:00' }, enabled: { type: Boolean, default: true } },
            friday: { start: { type: String, default: '09:00' }, end: { type: String, default: '18:00' }, enabled: { type: Boolean, default: true } },
            saturday: { start: { type: String, default: '09:00' }, end: { type: String, default: '14:00' }, enabled: { type: Boolean, default: false } },
            sunday: { start: { type: String, default: '09:00' }, end: { type: String, default: '14:00' }, enabled: { type: Boolean, default: false } }
        },

        // Reminder settings
        reminderHoursBefore: { type: [Number], default: [24, 1] }, // 24h and 1h before

        // Custom messages
        confirmationMessage: {
            type: String,
            default: '✅ ¡Tu cita ha sido agendada! Te esperamos el {date} a las {time}.'
        },
        reminderMessage: {
            type: String,
            default: '📅 Recordatorio: Tienes una cita programada para {date} a las {time}.'
        }
    },

    // Follow-up Configuration (for automatic re-engagement)
    followUpConfig: {
        enabled: { type: Boolean, default: true },
        hoursAfterInactivity: { type: Number, default: 24 }, // Hours before sending follow-up
        maxFollowUps: { type: Number, default: 3 }, // Max follow-ups per conversation
        message: {
            type: String,
            default: '¡Hola {name}! 👋 ¿Pudiste revisar la información que te enviamos? Estamos aquí para resolver cualquier duda que tengas.'
        },
        // Which channels to send follow-ups
        channels: {
            whatsapp: { type: Boolean, default: true },
            messenger: { type: Boolean, default: true },
            instagram: { type: Boolean, default: true }
        }
    },

    // Encrypted API Keys (stored encrypted in DB)
    apiKeys: {
        openai: {
            iv: String,
            encrypted: String,
            authTag: String
        },
        custom: {
            type: Map,
            of: {
                iv: String,
                encrypted: String,
                authTag: String
            }
        }
    },

    // Usage tracking
    usage: {
        currentPeriodStart: Date,
        messagesCount: { type: Number, default: 0 },
        tokensUsed: { type: Number, default: 0 }
    },

    // Billing
    billing: {
        customerId: String, // Stripe customer ID
        subscriptionId: String,
        nextBillingDate: Date,
        paymentStatus: {
            type: String,
            enum: ['active', 'past_due', 'canceled', 'unpaid'],
            default: 'active'
        }
    },

    // Metadata
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes
organizationSchema.index({ email: 1 });
organizationSchema.index({ active: 1 });
organizationSchema.index({ plan: 1 });

// Virtual for plan limits
organizationSchema.virtual('planLimits').get(function () {
    return PLAN_LIMITS[this.plan] || PLAN_LIMITS.free;
});

// Method to check if within limits
organizationSchema.methods.isWithinLimits = function (type) {
    const limits = this.planLimits;
    if (limits[type] === -1) return true; // Unlimited

    switch (type) {
        case 'messagesPerMonth':
            return this.usage.messagesCount < limits.messagesPerMonth;
        default:
            return true;
    }
};

// Method to increment usage
organizationSchema.methods.incrementUsage = async function (type, amount = 1) {
    if (type === 'messagesCount') {
        this.usage.messagesCount += amount;
        await this.save();
    }
};

export const Organization = mongoose.model('Organization', organizationSchema);
