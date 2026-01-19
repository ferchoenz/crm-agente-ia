import mongoose from 'mongoose';
import { CONVERSATION_STATUS } from '../config/constants.js';

const conversationSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },

    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true
    },

    // External conversation ID (from WhatsApp/Facebook)
    externalId: String,

    // Status
    status: {
        type: String,
        enum: Object.values(CONVERSATION_STATUS),
        default: CONVERSATION_STATUS.OPEN
    },

    // AI control
    aiEnabled: {
        type: Boolean,
        default: true
    },
    aiPausedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    aiPausedAt: Date,
    aiPausedReason: String,

    // Assignment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedAt: Date,

    // Priority / Urgency
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },

    // Tags
    tags: [{
        type: String,
        trim: true
    }],

    // AI-generated summary
    summary: {
        type: String,
        maxlength: 500
    },
    lastSummaryAt: Date,

    // Last message preview
    lastMessage: {
        content: String,
        senderType: String,
        sentAt: Date
    },

    // Message counts
    stats: {
        totalMessages: { type: Number, default: 0 },
        customerMessages: { type: Number, default: 0 },
        aiMessages: { type: Number, default: 0 },
        humanMessages: { type: Number, default: 0 },
        unreadCount: { type: Number, default: 0 }
    },

    // Timing
    firstMessageAt: Date,
    lastMessageAt: Date,
    lastCustomerMessageAt: Date,
    lastReplyAt: Date,
    resolvedAt: Date,

    // Response metrics
    metrics: {
        averageResponseTime: Number, // in seconds
        firstResponseTime: Number,
        resolutionTime: Number
    },

    // Context for AI (recent conversation context)
    context: {
        recentTopics: [String],
        customerIntent: String,
        lastProductMentioned: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        // SPIN Sales Phase State Machine (with Onboarding)
        salesPhase: {
            type: String,
            enum: ['ONBOARDING', 'SITUATION', 'PROBLEM', 'IMPLICATION', 'NEED_PAYOFF', 'CLOSING', 'COMPLETED'],
            default: 'ONBOARDING'
        },
        lastPhaseChangeAt: Date,
        // Track what data has been collected
        dataCollected: {
            hasName: { type: Boolean, default: false },
            hasEmail: { type: Boolean, default: false },
            hasPhone: { type: Boolean, default: false }
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

// Indexes for efficient queries
conversationSchema.index({ organization: 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ organization: 1, customer: 1 });
conversationSchema.index({ organization: 1, channel: 1 });
conversationSchema.index({ organization: 1, assignedTo: 1 });
conversationSchema.index({ organization: 1, 'stats.unreadCount': -1 });
conversationSchema.index({ organization: 1, priority: 1, lastMessageAt: -1 });
conversationSchema.index({ externalId: 1 }, { sparse: true });

// Add message to conversation
conversationSchema.methods.addMessage = async function (senderType) {
    this.stats.totalMessages += 1;

    if (senderType === 'customer') {
        this.stats.customerMessages += 1;
        this.stats.unreadCount += 1;
        this.lastCustomerMessageAt = new Date();
    } else if (senderType === 'ai') {
        this.stats.aiMessages += 1;
        this.lastReplyAt = new Date();
    } else if (senderType === 'human') {
        this.stats.humanMessages += 1;
        this.lastReplyAt = new Date();
    }

    this.lastMessageAt = new Date();

    if (!this.firstMessageAt) {
        this.firstMessageAt = new Date();
    }

    await this.save();
};

// Mark as read
conversationSchema.methods.markAsRead = async function () {
    this.stats.unreadCount = 0;
    await this.save();
};

// Toggle AI
conversationSchema.methods.toggleAI = async function (enabled, userId, reason) {
    this.aiEnabled = enabled;
    if (!enabled) {
        this.aiPausedBy = userId;
        this.aiPausedAt = new Date();
        this.aiPausedReason = reason || 'Manual takeover';
    } else {
        this.aiPausedBy = null;
        this.aiPausedAt = null;
        this.aiPausedReason = null;
    }
    await this.save();
};

// Resolve conversation
conversationSchema.methods.resolve = async function () {
    this.status = CONVERSATION_STATUS.RESOLVED;
    this.resolvedAt = new Date();

    if (this.firstMessageAt) {
        this.metrics.resolutionTime = Math.floor((Date.now() - this.firstMessageAt.getTime()) / 1000);
    }

    await this.save();
};

export const Conversation = mongoose.model('Conversation', conversationSchema);
