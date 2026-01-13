import { google } from 'googleapis';
import { Channel, Organization } from '../../models/index.js';
import { encrypt, decrypt } from '../encryption.service.js';
import { logger } from '../../utils/logger.js';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

/**
 * Google Calendar Service
 * Handles OAuth and calendar operations
 */
export class CalendarService {
    constructor(organizationId) {
        this.organizationId = organizationId;
        this.oauth2Client = null;
        this.calendar = null;
    }

    /**
     * Initialize OAuth client
     */
    initialize() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        return this;
    }

    /**
     * Generate authorization URL for OAuth
     */
    getAuthUrl(state = '') {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            state,
            prompt: 'consent'
        });
    }

    /**
     * Exchange auth code for tokens
     */
    async exchangeCode(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        return tokens;
    }

    /**
     * Save tokens to organization
     */
    async saveTokens(tokens) {
        const org = await Organization.findById(this.organizationId);

        if (!org) throw new Error('Organization not found');

        // Store encrypted tokens in metadata
        org.metadata = org.metadata || new Map();
        org.metadata.set('googleCalendar', {
            accessToken: encrypt(tokens.access_token),
            refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
            expiryDate: tokens.expiry_date,
            connectedAt: new Date()
        });

        await org.save();
        logger.info(`Google Calendar connected for org ${this.organizationId}`);
    }

    /**
     * Load tokens and setup client
     */
    async setupWithStoredTokens() {
        const org = await Organization.findById(this.organizationId);

        if (!org?.metadata?.get('googleCalendar')) {
            throw new Error('Google Calendar not connected');
        }

        const calendarData = org.metadata.get('googleCalendar');

        const accessToken = decrypt(calendarData.accessToken);
        const refreshToken = calendarData.refreshToken ? decrypt(calendarData.refreshToken) : null;

        this.oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
            expiry_date: calendarData.expiryDate
        });

        // Handle token refresh
        this.oauth2Client.on('tokens', async (tokens) => {
            if (tokens.access_token) {
                calendarData.accessToken = encrypt(tokens.access_token);
                calendarData.expiryDate = tokens.expiry_date;
                org.metadata.set('googleCalendar', calendarData);
                await org.save();
            }
        });

        this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

        return this;
    }

    /**
     * List available calendars
     */
    async listCalendars() {
        const response = await this.calendar.calendarList.list();
        return response.data.items.map(cal => ({
            id: cal.id,
            summary: cal.summary,
            primary: cal.primary
        }));
    }

    /**
     * Get free/busy slots for a date
     */
    async getAvailableSlots(date, calendarId = 'primary', slotDuration = 60) {
        const startOfDay = new Date(date);
        startOfDay.setHours(9, 0, 0, 0); // 9 AM

        const endOfDay = new Date(date);
        endOfDay.setHours(18, 0, 0, 0); // 6 PM

        // Get busy times
        const response = await this.calendar.freebusy.query({
            requestBody: {
                timeMin: startOfDay.toISOString(),
                timeMax: endOfDay.toISOString(),
                items: [{ id: calendarId }]
            }
        });

        const busySlots = response.data.calendars[calendarId]?.busy || [];

        // Calculate available slots
        const slots = [];
        let currentTime = new Date(startOfDay);

        while (currentTime < endOfDay) {
            const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);

            // Check if this slot overlaps with any busy period
            const isBusy = busySlots.some(busy => {
                const busyStart = new Date(busy.start);
                const busyEnd = new Date(busy.end);
                return currentTime < busyEnd && slotEnd > busyStart;
            });

            if (!isBusy && slotEnd <= endOfDay) {
                slots.push({
                    start: new Date(currentTime),
                    end: slotEnd,
                    available: true
                });
            }

            currentTime = slotEnd;
        }

        return slots;
    }

    /**
     * Create a calendar event (appointment)
     */
    async createAppointment(data) {
        const {
            summary,
            description,
            startTime,
            endTime,
            attendeeEmail,
            calendarId = 'primary'
        } = data;

        const event = {
            summary,
            description,
            start: {
                dateTime: new Date(startTime).toISOString(),
                timeZone: 'America/Mexico_City'
            },
            end: {
                dateTime: new Date(endTime).toISOString(),
                timeZone: 'America/Mexico_City'
            },
            attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 1 day before
                    { method: 'popup', minutes: 30 }        // 30 min before
                ]
            }
        };

        const response = await this.calendar.events.insert({
            calendarId,
            requestBody: event,
            sendUpdates: attendeeEmail ? 'all' : 'none'
        });

        logger.info(`Appointment created: ${response.data.id}`);

        return {
            id: response.data.id,
            htmlLink: response.data.htmlLink,
            start: response.data.start,
            end: response.data.end
        };
    }

    /**
     * Cancel an appointment
     */
    async cancelAppointment(eventId, calendarId = 'primary') {
        await this.calendar.events.delete({
            calendarId,
            eventId,
            sendUpdates: 'all'
        });

        logger.info(`Appointment cancelled: ${eventId}`);
    }

    /**
     * Get upcoming appointments
     */
    async getUpcomingAppointments(calendarId = 'primary', maxResults = 10) {
        const response = await this.calendar.events.list({
            calendarId,
            timeMin: new Date().toISOString(),
            maxResults,
            singleEvents: true,
            orderBy: 'startTime'
        });

        return response.data.items.map(event => ({
            id: event.id,
            summary: event.summary,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            attendees: event.attendees?.map(a => a.email) || []
        }));
    }
}

/**
 * Create calendar service for an organization
 */
export async function createCalendarService(organizationId) {
    const service = new CalendarService(organizationId);
    service.initialize();
    await service.setupWithStoredTokens();
    return service;
}

/**
 * Check if calendar is connected for an organization
 */
export async function isCalendarConnected(organizationId) {
    const org = await Organization.findById(organizationId);
    return !!org?.metadata?.get('googleCalendar');
}
