import mongoose from 'mongoose';
import { CHANNEL_TYPES } from '../config/constants.js';

const channelSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    type: {
        type: String,
        enum: Object.values(CHANNEL_TYPES),
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    // WhatsApp specific
    whatsapp: {
        phoneNumberId: String,
        wabaId: String, // WhatsApp Business Account ID
        phoneNumber: String,
        displayName: String,
        qualityRating: String,
        verifiedName: String
    },

    // Facebook specific
    facebook: {
        pageId: String,
        pageName: String,
        pageAccessToken: {
            iv: String,
            encrypted: String,
            authTag: String
        }
    },

    // General credentials (encrypted)
    credentials: {
        accessToken: {
            iv: String,
            encrypted: String,
            authTag: String
        },
        refreshToken: {
            iv: String,
            encrypted: String,
            authTag: String
        },
        expiresAt: Date,
        additionalData: {
            type: Map,
            of: {
                iv: String,
                encrypted: String,
                authTag: String
            }
        }
    },

    // Webhook configuration
    webhook: {
        url: String,
        verifyToken: String,
        secret: String
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'active', 'error', 'disconnected'],
        default: 'pending'
    },
    statusMessage: String,
    lastError: String,

    // Connection metadata
    connectedAt: Date,
    lastActivityAt: Date,
    lastMessageAt: Date,

    // Settings for this channel
    settings: {
        aiEnabled: { type: Boolean, default: true },
        autoReply: { type: Boolean, default: true },
        greetingEnabled: { type: Boolean, default: true },
        customGreeting: String
    },

    // Stats
    stats: {
        messagesSent: { type: Number, default: 0 },
        messagesReceived: { type: Number, default: 0 },
        conversationsStarted: { type: Number, default: 0 }
    },

    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
channelSchema.index({ organization: 1, type: 1 });
channelSchema.index({ organization: 1, status: 1 });
channelSchema.index({ 'whatsapp.phoneNumberId': 1 }, { sparse: true });
channelSchema.index({ 'facebook.pageId': 1 }, { sparse: true });

// Mark as connected
channelSchema.methods.markConnected = async function () {
    this.status = 'active';
    this.connectedAt = new Date();
    this.lastActivityAt = new Date();
    this.statusMessage = 'Connected successfully';
    await this.save();
};

// Mark as error
channelSchema.methods.markError = async function (error) {
    this.status = 'error';
    this.lastError = error;
    this.statusMessage = `Error: ${error}`;
    await this.save();
};

// Record activity
channelSchema.methods.recordActivity = async function (type = 'general') {
    this.lastActivityAt = new Date();
    if (type === 'message') {
        this.lastMessageAt = new Date();
    }
    await this.save();
};

export const Channel = mongoose.model('Channel', channelSchema);
