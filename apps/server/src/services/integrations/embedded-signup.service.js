import axios from 'axios';
import { Channel } from '../../models/index.js';
import { encrypt } from '../encryption.service.js';
import { logger } from '../../utils/logger.js';

const GRAPH_API_URL = 'https://graph.facebook.com/v21.0';

/**
 * WhatsApp Embedded Sign-Up Service
 * Handles the OAuth flow for tech provider onboarding
 */
export class EmbeddedSignUpService {
    /**
     * Exchange authorization code for System User Business Token (SBAT)
     */
    static async exchangeCodeForToken(code) {
        try {
            const response = await axios.post(`${GRAPH_API_URL}/oauth/access_token`, null, {
                params: {
                    client_id: process.env.FACEBOOK_APP_ID,
                    client_secret: process.env.FACEBOOK_APP_SECRET || process.env.META_APP_SECRET,
                    code
                }
            });

            return response.data.access_token;
        } catch (error) {
            logger.error('Failed to exchange code for token:', error.response?.data || error.message);
            throw new Error('Failed to exchange authorization code');
        }
    }

    /**
     * Get WhatsApp Business Account (WABA) details
     */
    static async getWABADetails(wabaId, accessToken) {
        try {
            const response = await axios.get(`${GRAPH_API_URL}/${wabaId}`, {
                params: {
                    fields: 'id,name,account_review_status,business_verification_status,on_behalf_of_business_info,timezone_id,message_template_namespace'
                },
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            return response.data;
        } catch (error) {
            logger.error('Failed to get WABA details:', error.response?.data || error.message);
            throw new Error('Failed to get WhatsApp Business Account details');
        }
    }

    /**
     * Get all phone numbers associated with a WABA
     */
    static async getPhoneNumbers(wabaId, accessToken) {
        try {
            const response = await axios.get(`${GRAPH_API_URL}/${wabaId}/phone_numbers`, {
                params: {
                    fields: 'id,display_phone_number,verified_name,code_verification_status,quality_rating,platform_type,account_mode,certificate,name_status'
                },
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            return response.data.data || [];
        } catch (error) {
            logger.error('Failed to get phone numbers:', error.response?.data || error.message);
            throw new Error('Failed to get phone numbers');
        }
    }

    /**
     * Subscribe WABA to webhooks
     */
    static async subscribeToWebhooks(wabaId, accessToken) {
        try {
            const response = await axios.post(
                `${GRAPH_API_URL}/${wabaId}/subscribed_apps`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            logger.info(`Subscribed WABA ${wabaId} to webhooks`);
            return response.data;
        } catch (error) {
            logger.warn('Failed to subscribe to webhooks:', error.response?.data || error.message);
            // Don't throw, webhook subscription can be done manually if needed
            return null;
        }
    }

    /**
     * Register phone number for messaging (if needed)
     */
    static async registerPhoneNumber(phoneNumberId, accessToken, pin = '123456') {
        try {
            const response = await axios.post(
                `${GRAPH_API_URL}/${phoneNumberId}/register`,
                {
                    messaging_product: 'whatsapp',
                    pin
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            logger.info(`Registered phone number ${phoneNumberId}`);
            return response.data;
        } catch (error) {
            // Phone might already be registered
            if (error.response?.data?.error?.code === 33) {
                logger.info(`Phone number ${phoneNumberId} already registered`);
                return { success: true, already_registered: true };
            }
            logger.error('Failed to register phone number:', error.response?.data || error.message);
            throw new Error('Failed to register phone number');
        }
    }

    /**
     * Save channel with embedded signup credentials
     */
    static async saveChannel(organizationId, wabaData, phoneData, accessToken) {
        try {
            // Check if channel already exists
            let channel = await Channel.findOne({
                organization: organizationId,
                type: 'whatsapp',
                'whatsapp.phoneNumberId': phoneData.id
            });

            const channelData = {
                organization: organizationId,
                type: 'whatsapp',
                name: phoneData.verified_name || phoneData.display_phone_number || `WhatsApp ${phoneData.display_phone_number}`,
                whatsapp: {
                    phoneNumberId: phoneData.id,
                    wabaId: wabaData.id,
                    phoneNumber: phoneData.display_phone_number,
                    displayName: phoneData.verified_name || phoneData.display_phone_number,
                    qualityRating: phoneData.quality_rating,
                    verifiedName: phoneData.verified_name,
                    accountMode: phoneData.account_mode,
                    certificate: phoneData.certificate,
                    codeVerificationStatus: phoneData.code_verification_status,
                    isEmbeddedSignup: true,
                    sharedWABA: false,
                    nameStatus: phoneData.name_status
                },
                credentials: {
                    accessToken: encrypt(accessToken)
                },
                status: 'active',
                statusMessage: 'Connected via Embedded Sign-Up',
                connectedAt: new Date(),
                settings: {
                    aiEnabled: true,
                    autoReply: true,
                    greetingEnabled: true
                }
            };

            if (channel) {
                // Update existing channel
                Object.assign(channel, channelData);
            } else {
                // Create new channel
                channel = new Channel(channelData);
            }

            await channel.save();

            logger.info(`WhatsApp channel saved for org ${organizationId}: ${phoneData.display_phone_number}`);

            return channel;
        } catch (error) {
            logger.error('Failed to save channel:', error);
            throw new Error('Failed to save WhatsApp channel');
        }
    }

    /**
     * Complete embedded signup flow
     */
    static async completeSignup(organizationId, code, wabaId, phoneNumberId) {
        try {
            // Step 1: Exchange code for access token
            logger.info(`Starting embedded signup for org ${organizationId}`);
            const accessToken = await this.exchangeCodeForToken(code);

            // Step 2: Get WABA details
            const wabaData = await this.getWABADetails(wabaId, accessToken);

            // Step 3: Get all phone numbers
            const phoneNumbers = await this.getPhoneNumbers(wabaId, accessToken);

            // Step 4: Find the selected phone number
            const phoneData = phoneNumbers.find(p => p.id === phoneNumberId);
            if (!phoneData) {
                throw new Error('Selected phone number not found in WABA');
            }

            // Step 5: Subscribe to webhooks
            await this.subscribeToWebhooks(wabaId, accessToken);

            // Step 6: Register phone number (if needed)
            // This is optional and depends on whether the number is already registered
            try {
                await this.registerPhoneNumber(phoneNumberId, accessToken);
            } catch (regError) {
                logger.warn('Phone number registration step failed (might already be registered):', regError.message);
            }

            // Step 7: Save channel to database
            const channel = await this.saveChannel(organizationId, wabaData, phoneData, accessToken);

            return {
                success: true,
                channel: {
                    id: channel._id,
                    name: channel.name,
                    phoneNumber: channel.whatsapp.phoneNumber,
                    status: channel.status,
                    wabaId: channel.whatsapp.wabaId,
                    phoneNumberId: channel.whatsapp.phoneNumberId
                }
            };
        } catch (error) {
            logger.error('Embedded signup failed:', error);
            throw error;
        }
    }

    /**
     * Get available WABAs for a user (for selection UI)
     */
    static async getAvailableWABAs(accessToken) {
        try {
            // This would require getting the business ID first
            // For now, we'll return the WABA ID from the signup callback
            // In production, you might want to list all WABAs the user has access to
            return [];
        } catch (error) {
            logger.error('Failed to get available WABAs:', error);
            return [];
        }
    }
}

export default EmbeddedSignUpService;
