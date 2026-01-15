import { AIUsage, Organization } from '../../models/index.js';
import { getModelRouter } from '../../services/ai/model-router.service.js';
import { logger } from '../../utils/logger.js';

/**
 * Get AI usage statistics for Super Admin
 */
export const getAIStats = async (req, res, next) => {
    try {
        const { startDate, endDate, organizationId } = req.query;

        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        // Get global summary by organization
        const byOrganization = await AIUsage.getGlobalSummary(start, end);

        // Get totals
        const totals = await AIUsage.aggregate([
            {
                $match: {
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    totalTokens: { $sum: '$totalTokens' },
                    totalRequests: { $sum: '$requestCount' },
                    totalSuccess: { $sum: '$successCount' },
                    totalErrors: { $sum: '$errorCount' },
                    totalMessagesReceived: { $sum: '$messagesReceived' },
                    totalMessagesSent: { $sum: '$messagesSent' },
                    totalCost: { $sum: '$estimatedCost' },
                    avgResponseTime: { $avg: '$avgResponseTimeMs' }
                }
            }
        ]);

        // Get usage by provider
        const byProvider = await AIUsage.aggregate([
            {
                $match: {
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$provider',
                    totalTokens: { $sum: '$totalTokens' },
                    requestCount: { $sum: '$requestCount' },
                    estimatedCost: { $sum: '$estimatedCost' }
                }
            }
        ]);

        // Get usage by level
        const byLevel = await AIUsage.aggregate([
            {
                $match: {
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$level',
                    totalTokens: { $sum: '$totalTokens' },
                    requestCount: { $sum: '$requestCount' },
                    estimatedCost: { $sum: '$estimatedCost' }
                }
            }
        ]);

        // Get daily trend
        const dailyTrend = await AIUsage.aggregate([
            {
                $match: {
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    totalTokens: { $sum: '$totalTokens' },
                    requestCount: { $sum: '$requestCount' },
                    estimatedCost: { $sum: '$estimatedCost' },
                    messagesReceived: { $sum: '$messagesReceived' },
                    messagesSent: { $sum: '$messagesSent' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get model router status
        let routerStatus = {};
        try {
            const router = await getModelRouter();
            routerStatus = router.getStatus();
        } catch (e) {
            logger.warn('Could not get router status:', e.message);
        }

        res.json({
            period: { start, end },
            totals: totals[0] || {
                totalTokens: 0,
                totalRequests: 0,
                totalSuccess: 0,
                totalErrors: 0,
                totalMessagesReceived: 0,
                totalMessagesSent: 0,
                totalCost: 0,
                avgResponseTime: 0
            },
            byOrganization,
            byProvider,
            byLevel,
            dailyTrend,
            providers: routerStatus
        });

    } catch (error) {
        logger.error('Error getting AI stats:', error);
        next(error);
    }
};

/**
 * Get AI usage for a specific organization
 */
export const getOrganizationAIStats = async (req, res, next) => {
    try {
        const { organizationId } = req.params;
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const summary = await AIUsage.getOrganizationSummary(organizationId, start, end);

        // Get daily trend for this org
        const dailyTrend = await AIUsage.aggregate([
            {
                $match: {
                    organization: new (await import('mongoose')).default.Types.ObjectId(organizationId),
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    totalTokens: { $sum: '$totalTokens' },
                    requestCount: { $sum: '$requestCount' },
                    estimatedCost: { $sum: '$estimatedCost' },
                    messagesReceived: { $sum: '$messagesReceived' },
                    messagesSent: { $sum: '$messagesSent' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            period: { start, end },
            summary,
            dailyTrend
        });

    } catch (error) {
        logger.error('Error getting organization AI stats:', error);
        next(error);
    }
};
