import axios from 'axios';
import { Channel } from '../../models/index.js';
import { encrypt, decrypt } from '../../utils/encryption.util.js';
import { logger } from '../../utils/logger.js';

const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Token Refresh Service
 * Handles automatic renewal of Facebook/Messenger/Instagram tokens
 */

/**
 * Exchange a short-lived token for a long-lived token (60 days)
 * @param {string} shortLivedToken - The short-lived user access token
 * @returns {object} { accessToken, expiresIn }
 */
export async function exchangeForLongLivedToken(shortLivedToken) {
    try {
        const appId = process.env.FACEBOOK_APP_ID;
        const appSecret = process.env.FACEBOOK_APP_SECRET;

        if (!appId || !appSecret) {
            throw new Error('FACEBOOK_APP_ID and FACEBOOK_APP_SECRET must be configured');
        }

        const response = await axios.get(`${GRAPH_API_URL}/oauth/access_token`, {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: appId,
                client_secret: appSecret,
                fb_exchange_token: shortLivedToken
            }
        });

        const { access_token, expires_in } = response.data;

        logger.info(`Exchanged for long-lived token, expires in ${expires_in} seconds`);

        return {
            accessToken: access_token,
            expiresIn: expires_in || 5184000 // Default 60 days in seconds
        };
    } catch (error) {
        logger.error('Failed to exchange for long-lived token:', error.response?.data || error.message);
        throw new Error(`Token exchange failed: ${error.response?.data?.error?.message || error.message}`);
    }
}

/**
 * Get a new page access token using the user access token
 * Page tokens derived from long-lived user tokens are also long-lived
 * @param {string} pageId - The Facebook Page ID
 * @param {string} userAccessToken - Long-lived user access token
 * @returns {object} { pageAccessToken, expiresAt }
 */
export async function getPageAccessToken(pageId, userAccessToken) {
    try {
        const response = await axios.get(`${GRAPH_API_URL}/${pageId}`, {
            params: {
                fields: 'access_token',
                access_token: userAccessToken
            }
        });

        const pageAccessToken = response.data.access_token;

        // Calculate expiration (60 days from now for long-lived tokens)
        const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

        logger.info(`Got page access token for page ${pageId}`);

        return {
            pageAccessToken,
            expiresAt
        };
    } catch (error) {
        logger.error('Failed to get page access token:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Refresh token for a specific channel
 * @param {string} channelId - The channel ID
 * @returns {boolean} Success status
 */
export async function refreshChannelToken(channelId) {
    try {
        const channel = await Channel.findById(channelId);
        if (!channel) {
            logger.warn(`Channel ${channelId} not found for token refresh`);
            return false;
        }

        // Get the current access token
        if (!channel.credentials?.accessToken?.encrypted) {
            logger.warn(`Channel ${channelId} has no access token`);
            return false;
        }

        const currentToken = decrypt(channel.credentials.accessToken);

        // Try to get page ID
        const pageId = channel.facebook?.pageId || channel.messenger?.pageId || channel.instagram?.pageId;

        if (!pageId) {
            logger.warn(`Channel ${channelId} has no page ID for token refresh`);
            return false;
        }

        // Try to refresh by getting a new page token
        // First, we need to check if we have a user token or page token
        // For most Messenger/Instagram connections, we have a page token directly

        // Attempt to debug the token to see its type
        const debugResponse = await axios.get(`${GRAPH_API_URL}/debug_token`, {
            params: {
                input_token: currentToken,
                access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
            }
        });

        const tokenData = debugResponse.data.data;
        logger.info(`Token debug for channel ${channelId}:`, {
            type: tokenData.type,
            expires_at: tokenData.expires_at,
            is_valid: tokenData.is_valid
        });

        // If token is still valid and not expiring soon, skip refresh
        if (tokenData.is_valid && tokenData.expires_at) {
            const expiresAt = new Date(tokenData.expires_at * 1000);
            const daysUntilExpiry = (expiresAt - new Date()) / (1000 * 60 * 60 * 24);

            if (daysUntilExpiry > 7) {
                logger.info(`Token for channel ${channelId} still valid for ${Math.round(daysUntilExpiry)} days, skipping refresh`);

                // Update expiresAt in DB if not set
                if (!channel.credentials.expiresAt) {
                    channel.credentials.expiresAt = expiresAt;
                    await channel.save();
                }

                return true;
            }
        }

        // For page tokens, we need to exchange using the app token mechanism
        // This requires the page to have granted the manage_pages permission

        // Try to extend the token
        const extendedToken = await exchangeForLongLivedToken(currentToken);

        // Update channel with new token
        channel.credentials.accessToken = encrypt(extendedToken.accessToken);
        channel.credentials.expiresAt = new Date(Date.now() + extendedToken.expiresIn * 1000);
        channel.status = 'active';
        channel.statusMessage = 'Token refreshed successfully';
        await channel.save();

        logger.info(`Successfully refreshed token for channel ${channelId}`);
        return true;

    } catch (error) {
        logger.error(`Failed to refresh token for channel ${channelId}:`, error.response?.data || error.message);

        // Mark channel as needing attention
        try {
            await Channel.findByIdAndUpdate(channelId, {
                $set: {
                    statusMessage: `Token refresh failed: ${error.response?.data?.error?.message || error.message}`,
                    lastError: error.message
                }
            });
        } catch (updateError) {
            logger.error('Failed to update channel status:', updateError);
        }

        return false;
    }
}

/**
 * Run token refresh job for all channels with expiring tokens
 * Should be called daily
 */
export async function runTokenRefreshJob() {
    try {
        logger.info('Starting token refresh job...');

        // Find channels with tokens expiring in the next 7 days
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const expiringChannels = await Channel.find({
            status: 'active',
            type: { $in: ['messenger', 'instagram'] }, // WhatsApp uses system user tokens which don't expire the same way
            $or: [
                { 'credentials.expiresAt': { $lt: sevenDaysFromNow } },
                { 'credentials.expiresAt': { $exists: false } }
            ]
        });

        logger.info(`Found ${expiringChannels.length} channels with expiring or unknown token status`);

        let successCount = 0;
        let failCount = 0;

        for (const channel of expiringChannels) {
            try {
                const success = await refreshChannelToken(channel._id);
                if (success) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                failCount++;
                logger.error(`Token refresh failed for channel ${channel._id}:`, error);
            }

            // Small delay between API calls to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        logger.info(`Token refresh job completed: ${successCount} success, ${failCount} failed`);

        return { successCount, failCount, total: expiringChannels.length };
    } catch (error) {
        logger.error('Token refresh job error:', error);
        throw error;
    }
}

/**
 * Check if a token is valid and get its expiration
 * @param {string} accessToken - The token to check
 * @returns {object} { isValid, expiresAt, type }
 */
export async function debugToken(accessToken) {
    try {
        const response = await axios.get(`${GRAPH_API_URL}/debug_token`, {
            params: {
                input_token: accessToken,
                access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
            }
        });

        const data = response.data.data;

        return {
            isValid: data.is_valid,
            expiresAt: data.expires_at ? new Date(data.expires_at * 1000) : null,
            type: data.type,
            appId: data.app_id,
            scopes: data.scopes
        };
    } catch (error) {
        logger.error('Token debug failed:', error.response?.data || error.message);
        return { isValid: false, error: error.message };
    }
}
