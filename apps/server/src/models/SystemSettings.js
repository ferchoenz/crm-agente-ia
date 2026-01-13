import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
    // Single document identifier
    key: {
        type: String,
        default: 'main',
        unique: true
    },

    // Global settings
    maintenanceMode: {
        enabled: { type: Boolean, default: false },
        message: { type: String, default: 'El sistema está en mantenimiento. Por favor intenta más tarde.' },
        allowedIPs: [String],
        scheduledEnd: Date
    },

    // Email configuration
    email: {
        provider: { type: String, enum: ['smtp', 'sendgrid', 'ses'], default: 'smtp' },
        smtpHost: String,
        smtpPort: { type: Number, default: 587 },
        smtpUser: String,
        smtpPassword: String, // Encrypted
        fromEmail: String,
        fromName: { type: String, default: 'CRM Agente IA' }
    },

    // Plans configuration
    plans: {
        free: {
            name: { type: String, default: 'Free' },
            price: { type: Number, default: 0 },
            limits: {
                users: { type: Number, default: 1 },
                customers: { type: Number, default: 100 },
                conversations: { type: Number, default: 500 },
                products: { type: Number, default: 50 },
                channels: { type: Number, default: 1 },
                aiMessages: { type: Number, default: 1000 },
                storage: { type: Number, default: 100 } // MB
            },
            features: {
                aiAgent: { type: Boolean, default: true },
                whatsapp: { type: Boolean, default: true },
                messenger: { type: Boolean, default: false },
                calendar: { type: Boolean, default: false },
                analytics: { type: Boolean, default: false },
                export: { type: Boolean, default: false }
            }
        },
        basic: {
            name: { type: String, default: 'Basic' },
            price: { type: Number, default: 499 },
            limits: {
                users: { type: Number, default: 3 },
                customers: { type: Number, default: 1000 },
                conversations: { type: Number, default: 5000 },
                products: { type: Number, default: 200 },
                channels: { type: Number, default: 2 },
                aiMessages: { type: Number, default: 10000 },
                storage: { type: Number, default: 500 }
            },
            features: {
                aiAgent: { type: Boolean, default: true },
                whatsapp: { type: Boolean, default: true },
                messenger: { type: Boolean, default: true },
                calendar: { type: Boolean, default: true },
                analytics: { type: Boolean, default: false },
                export: { type: Boolean, default: true }
            }
        },
        pro: {
            name: { type: String, default: 'Pro' },
            price: { type: Number, default: 999 },
            limits: {
                users: { type: Number, default: 10 },
                customers: { type: Number, default: 10000 },
                conversations: { type: Number, default: 50000 },
                products: { type: Number, default: 1000 },
                channels: { type: Number, default: 5 },
                aiMessages: { type: Number, default: 100000 },
                storage: { type: Number, default: 2000 }
            },
            features: {
                aiAgent: { type: Boolean, default: true },
                whatsapp: { type: Boolean, default: true },
                messenger: { type: Boolean, default: true },
                calendar: { type: Boolean, default: true },
                analytics: { type: Boolean, default: true },
                export: { type: Boolean, default: true }
            }
        },
        enterprise: {
            name: { type: String, default: 'Enterprise' },
            price: { type: Number, default: 2499 },
            limits: {
                users: { type: Number, default: -1 }, // -1 = unlimited
                customers: { type: Number, default: -1 },
                conversations: { type: Number, default: -1 },
                products: { type: Number, default: -1 },
                channels: { type: Number, default: -1 },
                aiMessages: { type: Number, default: -1 },
                storage: { type: Number, default: -1 }
            },
            features: {
                aiAgent: { type: Boolean, default: true },
                whatsapp: { type: Boolean, default: true },
                messenger: { type: Boolean, default: true },
                calendar: { type: Boolean, default: true },
                analytics: { type: Boolean, default: true },
                export: { type: Boolean, default: true }
            }
        }
    },

    // Rate limiting
    rateLimiting: {
        general: {
            windowMs: { type: Number, default: 60000 }, // 1 minute
            max: { type: Number, default: 100 }
        },
        auth: {
            windowMs: { type: Number, default: 900000 }, // 15 minutes
            max: { type: Number, default: 10 }
        },
        api: {
            windowMs: { type: Number, default: 60000 },
            max: { type: Number, default: 60 }
        }
    },

    // Security
    security: {
        blockedIPs: [String],
        blockedEmails: [String],
        sessionTimeout: { type: Number, default: 86400000 }, // 24 hours
        maxLoginAttempts: { type: Number, default: 5 },
        lockoutDuration: { type: Number, default: 900000 } // 15 minutes
    },

    // API Keys (global)
    apiKeys: {
        openai: String, // Encrypted - fallback if org doesn't have their own
        sendgrid: String,
        googleMaps: String
    },

    // Backup settings
    backup: {
        enabled: { type: Boolean, default: false },
        frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
        retentionDays: { type: Number, default: 30 },
        lastBackup: Date,
        lastBackupStatus: String
    }

}, { timestamps: true });

// Get or create settings
systemSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne({ key: 'main' });
    if (!settings) {
        settings = await this.create({ key: 'main' });
    }
    return settings;
};

export default mongoose.model('SystemSettings', systemSettingsSchema);
