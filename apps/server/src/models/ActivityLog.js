import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    // Actor
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    actorModel: {
        type: String,
        enum: ['User', 'System'],
        default: 'User'
    },
    actorEmail: String,
    actorRole: String,

    // Target
    targetType: {
        type: String,
        enum: ['organization', 'user', 'customer', 'conversation', 'product', 'channel', 'system', 'settings'],
        required: true
    },
    targetId: mongoose.Schema.Types.ObjectId,
    targetName: String,

    // Organization context
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },

    // Action details
    action: {
        type: String,
        required: true,
        enum: [
            'create', 'update', 'delete', 'view',
            'login', 'logout', 'login_failed',
            'password_reset', 'password_change',
            'impersonate_start', 'impersonate_end',
            'activate', 'deactivate', 'suspend',
            'plan_change', 'settings_change',
            'export', 'import', 'backup',
            'announcement_sent', 'notification_sent'
        ]
    },

    // What changed
    changes: {
        before: mongoose.Schema.Types.Mixed,
        after: mongoose.Schema.Types.Mixed
    },

    // Metadata
    ipAddress: String,
    userAgent: String,

    // Status
    status: {
        type: String,
        enum: ['success', 'failure', 'pending'],
        default: 'success'
    },
    errorMessage: String,

    // Description
    description: String

}, { timestamps: true });

// Indexes
activityLogSchema.index({ actor: 1, createdAt: -1 });
activityLogSchema.index({ organization: 1, createdAt: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });

// Static method to log activity
activityLogSchema.statics.log = async function (data) {
    try {
        return await this.create(data);
    } catch (error) {
        console.error('Failed to log activity:', error);
        return null;
    }
};

export default mongoose.model('ActivityLog', activityLogSchema);
