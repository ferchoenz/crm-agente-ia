import mongoose from 'mongoose';

/**
 * Notification Model
 * For user notifications (handoff requests, mentions, etc.)
 */
const notificationSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    // Who receives the notification
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },

    // Notification content
    type: {
        type: String,
        enum: ['handoff_request', 'assignment', 'mention', 'system', 'other'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },

    // Related entities
    relatedConversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation'
    },
    relatedCustomer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },

    // Status
    read: {
        type: Boolean,
        default: false
    },
    readAt: Date,

    // Priority
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },

    // Link/action
    actionUrl: String
}, {
    timestamps: true
});

// Indexes
notificationSchema.index({ organization: 1, user: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

// Static method to mark as read
notificationSchema.statics.markAsRead = async function (notificationId, userId) {
    return this.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true, readAt: new Date() },
        { new: true }
    );
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = async function (userId, organizationId) {
    return this.updateMany(
        { user: userId, organization: organizationId, read: false },
        { read: true, readAt: new Date() }
    );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function (userId, organizationId) {
    return this.countDocuments({
        user: userId,
        organization: organizationId,
        read: false
    });
};

export const Notification = mongoose.model('Notification', notificationSchema);
