import mongoose from 'mongoose';

/**
 * Appointment Model
 * Tracks appointments scheduled via AI agent or manually
 * Syncs with Google Calendar
 */
const appointmentSchema = new mongoose.Schema({
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
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation'
    },

    // Channel for reminders (send via same channel as conversation)
    channel: {
        type: String,
        enum: ['whatsapp', 'messenger', 'instagram', 'web'],
        default: 'whatsapp'
    },
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel'
    },

    // Google Calendar sync
    googleEventId: {
        type: String,
        sparse: true
    },

    // Appointment details
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // in minutes
        required: true
    },

    // Status tracking
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show'],
        default: 'scheduled'
    },
    cancelReason: {
        type: String,
        trim: true
    },

    // Who created this appointment
    createdBy: {
        type: String,
        enum: ['ai', 'user'],
        default: 'ai'
    },
    createdByUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Reminders
    reminders: [{
        type: {
            type: String,
            enum: ['24h', '1h', '30m']
        },
        scheduledFor: Date,
        sentAt: Date,
        channel: String,
        status: {
            type: String,
            enum: ['pending', 'sent', 'failed'],
            default: 'pending'
        }
    }],

    // Flexible metadata
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for common queries
appointmentSchema.index({ organization: 1, startTime: 1 });
appointmentSchema.index({ organization: 1, status: 1 });
appointmentSchema.index({ organization: 1, customer: 1 });
appointmentSchema.index({ googleEventId: 1 }, { sparse: true });
appointmentSchema.index({ 'reminders.scheduledFor': 1, 'reminders.status': 1 });

// Virtual for checking if appointment is in the past
appointmentSchema.virtual('isPast').get(function () {
    return this.startTime < new Date();
});

// Virtual for checking if appointment is today
appointmentSchema.virtual('isToday').get(function () {
    const today = new Date();
    return this.startTime.toDateString() === today.toDateString();
});

// Method to schedule reminders
appointmentSchema.methods.scheduleReminders = function (hoursBefore = [24, 1]) {
    this.reminders = hoursBefore.map(hours => {
        const scheduledFor = new Date(this.startTime);
        scheduledFor.setHours(scheduledFor.getHours() - hours);

        return {
            type: hours >= 24 ? '24h' : hours >= 1 ? '1h' : '30m',
            scheduledFor,
            channel: this.channel,
            status: 'pending'
        };
    }).filter(r => r.scheduledFor > new Date()); // Only future reminders

    return this;
};

// Method to mark as confirmed
appointmentSchema.methods.confirm = async function () {
    this.status = 'confirmed';
    await this.save();
    return this;
};

// Method to cancel
appointmentSchema.methods.cancel = async function (reason) {
    this.status = 'cancelled';
    this.cancelReason = reason;
    // Mark all pending reminders as cancelled (won't be sent)
    this.reminders = this.reminders.map(r => {
        if (r.status === 'pending') {
            r.status = 'cancelled';
        }
        return r;
    });
    await this.save();
    return this;
};

// Static method to get upcoming appointments
appointmentSchema.statics.getUpcoming = function (organizationId, limit = 10) {
    return this.find({
        organization: organizationId,
        startTime: { $gte: new Date() },
        status: { $in: ['scheduled', 'confirmed'] }
    })
        .sort({ startTime: 1 })
        .limit(limit)
        .populate('customer', 'name phone email')
        .lean();
};

// Static method to get today's appointments
appointmentSchema.statics.getToday = function (organizationId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.find({
        organization: organizationId,
        startTime: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['scheduled', 'confirmed'] }
    })
        .sort({ startTime: 1 })
        .populate('customer', 'name phone email')
        .lean();
};

// Static method to get pending reminders
appointmentSchema.statics.getPendingReminders = function () {
    const now = new Date();

    return this.find({
        status: { $in: ['scheduled', 'confirmed'] },
        'reminders': {
            $elemMatch: {
                status: 'pending',
                scheduledFor: { $lte: now }
            }
        }
    }).populate('customer', 'name phone email source');
};

export const Appointment = mongoose.model('Appointment', appointmentSchema);
