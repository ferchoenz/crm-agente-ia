import mongoose from 'mongoose';
import { MESSAGE_TYPES, SENDER_TYPES } from '../config/constants.js';

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },

    // Sender info
    senderType: {
        type: String,
        enum: Object.values(SENDER_TYPES),
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'senderModel'
    },
    senderModel: {
        type: String,
        enum: ['User', 'Customer']
    },

    // Message content
    type: {
        type: String,
        enum: Object.values(MESSAGE_TYPES),
        default: MESSAGE_TYPES.TEXT
    },
    content: {
        type: String,
        required: function () {
            return this.type === MESSAGE_TYPES.TEXT;
        }
    },

    // Media (for images, videos, documents, audio)
    media: {
        url: String,
        mimeType: String,
        filename: String,
        size: Number,
        caption: String,
        thumbnailUrl: String,
        duration: Number // for audio/video
    },

    // Location
    location: {
        latitude: Number,
        longitude: Number,
        name: String,
        address: String
    },

    // Contact
    contact: {
        name: String,
        phones: [String],
        emails: [String]
    },

    // Interactive (buttons, lists)
    interactive: {
        type: { type: String }, // button, list, product, product_list
        header: String,
        body: String,
        footer: String,
        buttons: [{
            id: String,
            title: String,
            type: String
        }],
        sections: [{
            title: String,
            rows: [{
                id: String,
                title: String,
                description: String
            }]
        }]
    },

    // Template (for WhatsApp templates)
    template: {
        name: String,
        language: String,
        components: mongoose.Schema.Types.Mixed
    },

    // External IDs
    externalId: String, // WhatsApp message ID
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },

    // AI metadata
    ai: {
        isAiGenerated: { type: Boolean, default: false },
        model: String,
        tokensUsed: Number,
        processingTime: Number, // ms
        confidence: Number,
        intent: String,
        sentiment: String,
        toolsUsed: [String],
        reasoning: String // AI's internal reasoning (for debugging)
    },

    // Delivery status
    status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
        default: 'pending'
    },
    statusUpdatedAt: Date,
    errorMessage: String,

    // Reactions
    reactions: [{
        emoji: String,
        by: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'reactions.byModel'
        },
        byModel: {
            type: String,
            enum: ['User', 'Customer']
        },
        at: Date
    }],

    // Timestamps
    sentAt: {
        type: Date,
        default: Date.now
    },
    deliveredAt: Date,
    readAt: Date,

    // Soft delete
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, senderType: 1 });
messageSchema.index({ externalId: 1 }, { sparse: true });
messageSchema.index({ 'ai.isAiGenerated': 1 });

// Update status
messageSchema.methods.updateStatus = async function (status, error = null) {
    this.status = status;
    this.statusUpdatedAt = new Date();

    if (status === 'delivered') {
        this.deliveredAt = new Date();
    } else if (status === 'read') {
        this.readAt = new Date();
    } else if (status === 'failed') {
        this.errorMessage = error;
    }

    await this.save();
};

// Soft delete
messageSchema.methods.softDelete = async function (userId) {
    this.deleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    await this.save();
};

// Static method to get conversation history for AI
messageSchema.statics.getContextForAI = async function (conversationId, limit = 20) {
    const messages = await this.find({
        conversation: conversationId,
        deleted: false
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('senderType content type sentAt')
        .lean();

    return messages.reverse().map(msg => ({
        role: msg.senderType === 'customer' ? 'user' : 'assistant',
        content: msg.content || `[${msg.type}]`
    }));
};

export const Message = mongoose.model('Message', messageSchema);
