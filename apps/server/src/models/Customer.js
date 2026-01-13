import mongoose from 'mongoose';
import { LEAD_STAGES } from '../config/constants.js';

const customerSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    // Contact info
    phone: {
        type: String,
        required: true,
        trim: true
    },
    phoneNormalized: {
        type: String,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    avatar: String,

    // Source channel
    source: {
        channel: {
            type: String,
            enum: ['whatsapp', 'facebook', 'instagram', 'web', 'manual'],
            default: 'whatsapp'
        },
        channelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Channel'
        },
        externalId: String, // WhatsApp ID, Facebook PSID, etc.
        referrer: String
    },

    // CRM fields
    stage: {
        type: String,
        enum: Object.values(LEAD_STAGES),
        default: LEAD_STAGES.NEW
    },
    leadScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    tags: [{
        type: String,
        trim: true
    }],
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // AI-generated insights
    insights: {
        summary: String,
        interests: [String],
        intents: [String],
        sentiment: {
            type: String,
            enum: ['positive', 'neutral', 'negative', 'unknown'],
            default: 'unknown'
        },
        preferredLanguage: String,
        lastAnalyzedAt: Date
    },

    // Activity tracking
    stats: {
        totalConversations: { type: Number, default: 0 },
        totalMessages: { type: Number, default: 0 },
        totalPurchases: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        firstContactAt: Date,
        lastContactAt: Date,
        lastMessageAt: Date
    },

    // Custom fields (flexible for different business types)
    customFields: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },

    // Notes from agents
    notes: [{
        content: String,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    // GDPR / Consent
    consent: {
        marketing: { type: Boolean, default: false },
        dataProcessing: { type: Boolean, default: true },
        consentedAt: Date
    },

    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound indexes for multi-tenant queries
customerSchema.index({ organization: 1, phone: 1 }, { unique: true });
customerSchema.index({ organization: 1, 'source.externalId': 1 });
customerSchema.index({ organization: 1, stage: 1 });
customerSchema.index({ organization: 1, leadScore: -1 });
customerSchema.index({ organization: 1, 'stats.lastContactAt': -1 });
customerSchema.index({ organization: 1, tags: 1 });

// Normalize phone on save
customerSchema.pre('save', function (next) {
    if (this.phone) {
        // Remove all non-numeric characters except + at the beginning
        this.phoneNormalized = this.phone.replace(/[^\d+]/g, '');
    }
    next();
});

// Update stats on first contact
customerSchema.methods.recordContact = async function () {
    if (!this.stats.firstContactAt) {
        this.stats.firstContactAt = new Date();
    }
    this.stats.lastContactAt = new Date();
    await this.save();
};

// Calculate and update lead score
customerSchema.methods.updateLeadScore = async function (factors) {
    let score = this.leadScore;

    // Factor adjustments
    if (factors.messageCount > 5) score += 10;
    if (factors.askedAboutPrice) score += 15;
    if (factors.mentionedBuying) score += 25;
    if (factors.scheduledAppointment) score += 30;
    if (factors.negativeSentiment) score -= 10;

    // Clamp between 0-100
    this.leadScore = Math.min(100, Math.max(0, score));
    await this.save();

    return this.leadScore;
};

export const Customer = mongoose.model('Customer', customerSchema);
