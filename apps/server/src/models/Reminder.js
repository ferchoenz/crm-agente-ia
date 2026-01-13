import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    // What this reminder is for
    type: {
        type: String,
        enum: ['follow_up', 'appointment', 'payment', 'custom'],
        required: true
    },

    // Related records
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation'
    },

    // Reminder details
    title: {
        type: String,
        required: true
    },
    description: String,

    // When to trigger
    scheduledAt: {
        type: Date,
        required: true,
        index: true
    },

    // How to notify
    channels: {
        whatsapp: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        push: { type: Boolean, default: true }
    },

    // Message to send (for WhatsApp reminders)
    message: {
        template: String,  // For WhatsApp templates
        content: String    // Custom message
    },

    // Recurrence
    recurring: {
        enabled: { type: Boolean, default: false },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'custom']
        },
        interval: Number,  // Every N days/weeks
        daysOfWeek: [Number],  // 0-6 for weekly
        endDate: Date,
        count: Number  // Max occurrences
    },

    // Status
    status: {
        type: String,
        enum: ['scheduled', 'sent', 'failed', 'cancelled'],
        default: 'scheduled',
        index: true
    },

    // Execution history
    lastExecutedAt: Date,
    executionCount: { type: Number, default: 0 },
    lastError: String,

    // Who created it
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // AI-generated reminder
    aiGenerated: { type: Boolean, default: false },

    // Metadata
    metadata: mongoose.Schema.Types.Mixed

}, {
    timestamps: true
});

// Indexes
reminderSchema.index({ scheduledAt: 1, status: 1 });
reminderSchema.index({ organization: 1, status: 1 });
reminderSchema.index({ customer: 1, status: 1 });

// Find due reminders
reminderSchema.statics.findDue = function () {
    return this.find({
        status: 'scheduled',
        scheduledAt: { $lte: new Date() }
    }).populate('customer organization');
};

// Schedule next occurrence for recurring reminders
reminderSchema.methods.scheduleNext = function () {
    if (!this.recurring?.enabled) return null;

    const nextDate = new Date(this.scheduledAt);

    switch (this.recurring.frequency) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + (this.recurring.interval || 1));
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7 * (this.recurring.interval || 1));
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + (this.recurring.interval || 1));
            break;
    }

    // Check end conditions
    if (this.recurring.endDate && nextDate > this.recurring.endDate) {
        return null;
    }
    if (this.recurring.count && this.executionCount >= this.recurring.count) {
        return null;
    }

    this.scheduledAt = nextDate;
    this.status = 'scheduled';
    return this.scheduledAt;
};

export const Reminder = mongoose.model('Reminder', reminderSchema);
