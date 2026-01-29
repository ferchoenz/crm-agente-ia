import mongoose from 'mongoose';

/**
 * AIUsage Model
 * Tracks AI usage statistics per organization (tenant)
 */
const aiUsageSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    // Time period
    date: {
        type: Date,
        required: true,
        index: true
    },

    // Provider info
    provider: {
        type: String,
        enum: ['groq', 'gemini', 'deepseek', 'openai', 'gpt-4o-mini', 'gpt-4.1', 'claude', 'unknown'],
        required: true
    },
    model: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ['L1', 'L2', 'L3'],
        required: true
    },

    // Token usage
    inputTokens: {
        type: Number,
        default: 0
    },
    outputTokens: {
        type: Number,
        default: 0
    },
    totalTokens: {
        type: Number,
        default: 0
    },

    // Request counts
    requestCount: {
        type: Number,
        default: 0
    },
    successCount: {
        type: Number,
        default: 0
    },
    errorCount: {
        type: Number,
        default: 0
    },

    // Message counts
    messagesReceived: {
        type: Number,
        default: 0
    },
    messagesSent: {
        type: Number,
        default: 0
    },

    // Cost tracking (in USD)
    estimatedCost: {
        type: Number,
        default: 0
    },

    // Performance
    avgResponseTimeMs: {
        type: Number,
        default: 0
    },
    totalResponseTimeMs: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
aiUsageSchema.index({ organization: 1, date: 1, provider: 1, level: 1 });
aiUsageSchema.index({ date: 1 }); // For global stats

/**
 * Static method to record AI usage
 */
aiUsageSchema.statics.recordUsage = async function ({
    organizationId,
    provider,
    model,
    level,
    inputTokens = 0,
    outputTokens = 0,
    responseTimeMs = 0,
    success = true,
    messageReceived = false,
    messageSent = false
}) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Cost calculation per provider (per 1M tokens)
    const costRates = {
        groq: { input: 0.05, output: 0.08 },
        gemini: { input: 0.075, output: 0.30 },
        deepseek: { input: 0.14, output: 0.28 },
        openai: { input: 0.15, output: 0.60 }
    };

    const rates = costRates[provider] || costRates.openai;
    const cost = (inputTokens * rates.input + outputTokens * rates.output) / 1000000;

    const update = {
        $inc: {
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
            requestCount: 1,
            successCount: success ? 1 : 0,
            errorCount: success ? 0 : 1,
            messagesReceived: messageReceived ? 1 : 0,
            messagesSent: messageSent ? 1 : 0,
            estimatedCost: cost,
            totalResponseTimeMs: responseTimeMs
        }
    };

    const result = await this.findOneAndUpdate(
        {
            organization: organizationId,
            date: today,
            provider,
            model,
            level
        },
        update,
        { upsert: true, new: true }
    );

    // Update average response time
    if (result.requestCount > 0) {
        result.avgResponseTimeMs = result.totalResponseTimeMs / result.requestCount;
        await result.save();
    }

    return result;
};

/**
 * Get usage summary for an organization
 */
aiUsageSchema.statics.getOrganizationSummary = async function (organizationId, startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                organization: new mongoose.Types.ObjectId(organizationId),
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: '$provider',
                totalTokens: { $sum: '$totalTokens' },
                inputTokens: { $sum: '$inputTokens' },
                outputTokens: { $sum: '$outputTokens' },
                requestCount: { $sum: '$requestCount' },
                successCount: { $sum: '$successCount' },
                errorCount: { $sum: '$errorCount' },
                messagesReceived: { $sum: '$messagesReceived' },
                messagesSent: { $sum: '$messagesSent' },
                estimatedCost: { $sum: '$estimatedCost' },
                avgResponseTime: { $avg: '$avgResponseTimeMs' }
            }
        }
    ]);
};

/**
 * Get global usage for Super Admin
 */
aiUsageSchema.statics.getGlobalSummary = async function (startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: {
                    organization: '$organization',
                    provider: '$provider'
                },
                totalTokens: { $sum: '$totalTokens' },
                requestCount: { $sum: '$requestCount' },
                messagesReceived: { $sum: '$messagesReceived' },
                messagesSent: { $sum: '$messagesSent' },
                estimatedCost: { $sum: '$estimatedCost' }
            }
        },
        {
            $lookup: {
                from: 'organizations',
                localField: '_id.organization',
                foreignField: '_id',
                as: 'org'
            }
        },
        {
            $unwind: '$org'
        },
        {
            $project: {
                organization: {
                    _id: '$_id.organization',
                    name: '$org.name'
                },
                provider: '$_id.provider',
                totalTokens: 1,
                requestCount: 1,
                messagesReceived: 1,
                messagesSent: 1,
                estimatedCost: 1
            }
        },
        {
            $sort: { estimatedCost: -1 }
        }
    ]);
};

export const AIUsage = mongoose.model('AIUsage', aiUsageSchema);
