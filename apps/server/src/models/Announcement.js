import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
    // Created by
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Content
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        maxlength: 5000
    },

    // Type
    type: {
        type: String,
        enum: ['info', 'warning', 'critical', 'maintenance', 'feature'],
        default: 'info'
    },

    // Targeting
    targetType: {
        type: String,
        enum: ['all', 'plan', 'specific'],
        default: 'all'
    },
    targetPlans: [String], // If targetType is 'plan'
    targetOrganizations: [{ // If targetType is 'specific'
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    }],

    // Visibility
    active: {
        type: Boolean,
        default: true
    },
    expiresAt: Date,

    // Display options
    dismissible: {
        type: Boolean,
        default: true
    },
    showOnLogin: {
        type: Boolean,
        default: false
    },
    priority: {
        type: Number,
        default: 0 // Higher = more priority
    },

    // Tracking
    viewedBy: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        viewedAt: { type: Date, default: Date.now }
    }],
    dismissedBy: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        dismissedAt: { type: Date, default: Date.now }
    }]

}, { timestamps: true });

// Index for active announcements
announcementSchema.index({ active: 1, expiresAt: 1 });
announcementSchema.index({ createdAt: -1 });

export default mongoose.model('Announcement', announcementSchema);
