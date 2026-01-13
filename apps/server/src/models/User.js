import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: function () {
            return this.role !== ROLES.SUPER_ADMIN;
        }
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    avatar: {
        type: String
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.AGENT
    },
    active: {
        type: Boolean,
        default: true
    },

    // Notifications preferences
    notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        newMessage: { type: Boolean, default: true },
        humanHandoff: { type: Boolean, default: true }
    },

    // Last activity tracking
    lastLogin: Date,
    lastActivity: Date,

    // Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Metadata
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Compound unique index for email per organization (except super_admin)
userSchema.index({ email: 1, organization: 1 }, {
    unique: true,
    partialFilterExpression: { organization: { $exists: true } }
});
userSchema.index({ organization: 1, role: 1 });
userSchema.index({ active: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Check if user has required role
userSchema.methods.hasRole = function (...roles) {
    return roles.includes(this.role);
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpires;
    return obj;
};

export const User = mongoose.model('User', userSchema);
