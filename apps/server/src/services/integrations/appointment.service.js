import { Organization, Appointment, Customer, Conversation } from '../../models/index.js';
import { CalendarService, isCalendarConnected, createCalendarService } from './calendar.service.js';
import { logger } from '../../utils/logger.js';

// Day name mapping
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Appointment Service
 * Handles appointment logic, integrating with Google Calendar
 */
export class AppointmentService {
    constructor(organizationId) {
        this.organizationId = organizationId;
        this.organization = null;
        this.config = null;
        this.calendarService = null;
    }

    /**
     * Initialize the service with organization data
     */
    async initialize() {
        this.organization = await Organization.findById(this.organizationId);

        if (!this.organization) {
            throw new Error('Organization not found');
        }

        this.config = this.organization.appointmentsConfig || {};

        // Try to initialize calendar if connected
        const calendarConnected = await isCalendarConnected(this.organizationId);
        if (calendarConnected) {
            try {
                this.calendarService = await createCalendarService(this.organizationId);
            } catch (error) {
                logger.warn(`Calendar not available for org ${this.organizationId}:`, error.message);
            }
        }

        return this;
    }

    /**
     * Check if appointments are enabled and calendar is connected
     */
    isEnabled() {
        return this.config.enabled && this.calendarService !== null;
    }

    /**
     * Get business hours for a specific day
     */
    getBusinessHoursForDay(date) {
        const dayName = DAYS[date.getDay()];
        const dayConfig = this.config.businessHours?.[dayName];

        if (!dayConfig?.enabled) {
            return null;
        }

        return {
            start: dayConfig.start || '09:00',
            end: dayConfig.end || '18:00'
        };
    }

    /**
     * Parse time string (HH:MM) to hours and minutes
     */
    parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return { hours, minutes };
    }

    /**
     * Get available slots for a specific date
     */
    async getAvailableSlots(date) {
        if (!this.isEnabled()) {
            return [];
        }

        const targetDate = new Date(date);
        const businessHours = this.getBusinessHoursForDay(targetDate);

        if (!businessHours) {
            return []; // Day not enabled
        }

        const duration = this.config.defaultDuration || 60;
        const buffer = this.config.bufferMinutes || 15;
        const calendarId = this.config.calendarId || 'primary';

        // Set start and end of business day
        const startTime = this.parseTime(businessHours.start);
        const endTime = this.parseTime(businessHours.end);

        const dayStart = new Date(targetDate);
        dayStart.setHours(startTime.hours, startTime.minutes, 0, 0);

        const dayEnd = new Date(targetDate);
        dayEnd.setHours(endTime.hours, endTime.minutes, 0, 0);

        // Get busy times from Google Calendar
        let busySlots = [];
        try {
            const response = await this.calendarService.calendar.freebusy.query({
                requestBody: {
                    timeMin: dayStart.toISOString(),
                    timeMax: dayEnd.toISOString(),
                    items: [{ id: calendarId }]
                }
            });
            busySlots = response.data.calendars[calendarId]?.busy || [];
        } catch (error) {
            logger.error('Error getting free/busy:', error);
        }

        // Also get existing appointments from our DB
        const existingAppointments = await Appointment.find({
            organization: this.organizationId,
            startTime: { $gte: dayStart, $lt: dayEnd },
            status: { $in: ['scheduled', 'confirmed'] }
        }).select('startTime endTime');

        // Merge busy slots
        existingAppointments.forEach(apt => {
            busySlots.push({
                start: apt.startTime.toISOString(),
                end: apt.endTime.toISOString()
            });
        });

        // Calculate available slots
        const slots = [];
        let currentTime = new Date(dayStart);
        const now = new Date();

        while (currentTime < dayEnd) {
            const slotEnd = new Date(currentTime.getTime() + duration * 60000);
            const slotWithBuffer = new Date(slotEnd.getTime() + buffer * 60000);

            // Skip if slot is in the past
            if (currentTime <= now) {
                currentTime = new Date(currentTime.getTime() + 30 * 60000); // Move 30 min forward
                continue;
            }

            // Check if this slot overlaps with any busy period
            const isBusy = busySlots.some(busy => {
                const busyStart = new Date(busy.start);
                const busyEnd = new Date(busy.end);
                return currentTime < busyEnd && slotEnd > busyStart;
            });

            if (!isBusy && slotEnd <= dayEnd) {
                slots.push({
                    start: new Date(currentTime),
                    end: slotEnd,
                    formatted: this.formatTime(currentTime)
                });
            }

            // Move to next slot (considering buffer)
            currentTime = slotWithBuffer;
        }

        return slots;
    }

    /**
     * Get available days for the next N days
     */
    async getAvailableDays(count = 7) {
        if (!this.isEnabled()) {
            return [];
        }

        const maxDays = this.config.maxAdvanceDays || 30;
        const daysToCheck = Math.min(count, maxDays);
        const availableDays = [];

        for (let i = 0; i < daysToCheck; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            date.setHours(12, 0, 0, 0); // Noon to avoid timezone issues

            const businessHours = this.getBusinessHoursForDay(date);
            if (businessHours) {
                const slots = await this.getAvailableSlots(date);
                if (slots.length > 0) {
                    availableDays.push({
                        date: date,
                        formatted: this.formatDate(date),
                        dayName: this.getDayName(date),
                        slotsCount: slots.length,
                        firstSlot: slots[0]?.formatted,
                        lastSlot: slots[slots.length - 1]?.formatted
                    });
                }
            }
        }

        return availableDays;
    }

    /**
     * Create a new appointment
     */
    async createAppointment({ customerId, conversationId, startTime, title, description, channel, channelId }) {
        if (!this.isEnabled()) {
            throw new Error('Appointments are not enabled');
        }

        const duration = this.config.defaultDuration || 60;
        const start = new Date(startTime);
        const end = new Date(start.getTime() + duration * 60000);

        // Get customer for title
        const customer = await Customer.findById(customerId);
        const customerName = customer?.name || customer?.phone || 'Cliente';
        const appointmentTitle = title || `Cita con ${customerName}`;

        // Create in Google Calendar
        let googleEventId = null;
        if (this.calendarService) {
            try {
                const calendarEvent = await this.calendarService.createAppointment({
                    summary: appointmentTitle,
                    description: description || `Cita agendada automáticamente desde CRM`,
                    startTime: start,
                    endTime: end,
                    attendeeEmail: customer?.email,
                    calendarId: this.config.calendarId || 'primary'
                });
                googleEventId = calendarEvent.id;
            } catch (error) {
                logger.error('Error creating Google Calendar event:', error);
            }
        }

        // Create appointment in our DB
        const appointment = new Appointment({
            organization: this.organizationId,
            customer: customerId,
            conversation: conversationId,
            channel: channel || 'whatsapp',
            channelId,
            googleEventId,
            title: appointmentTitle,
            description,
            startTime: start,
            endTime: end,
            duration,
            status: 'scheduled',
            createdBy: conversationId ? 'ai' : 'user'
        });

        // Schedule reminders
        const reminderHours = this.config.reminderHoursBefore || [24, 1];
        appointment.scheduleReminders(reminderHours);

        await appointment.save();

        logger.info(`Appointment created: ${appointment._id} for ${customerName}`);

        return appointment;
    }

    /**
     * Cancel an appointment
     */
    async cancelAppointment(appointmentId, reason) {
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            organization: this.organizationId
        });

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        // Cancel in Google Calendar
        if (appointment.googleEventId && this.calendarService) {
            try {
                await this.calendarService.cancelAppointment(
                    appointment.googleEventId,
                    this.config.calendarId || 'primary'
                );
            } catch (error) {
                logger.error('Error cancelling Google Calendar event:', error);
            }
        }

        // Cancel in our DB
        await appointment.cancel(reason);

        logger.info(`Appointment cancelled: ${appointmentId}`);

        return appointment;
    }

    /**
     * Get upcoming appointments
     */
    async getUpcoming(limit = 10) {
        return Appointment.getUpcoming(this.organizationId, limit);
    }

    /**
     * Get today's appointments
     */
    async getToday() {
        return Appointment.getToday(this.organizationId);
    }

    /**
     * Format time for display
     */
    formatTime(date) {
        return date.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    /**
     * Format date for display
     */
    formatDate(date) {
        return date.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    }

    /**
     * Get day name in Spanish
     */
    getDayName(date) {
        const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        return days[date.getDay()];
    }

    /**
     * Format slots for AI context
     */
    formatSlotsForAI(days) {
        if (!days || days.length === 0) {
            return 'No hay horarios disponibles en este momento.';
        }

        return days.slice(0, 3).map(day => {
            return `📅 ${day.formatted}: ${day.slotsCount} horarios (${day.firstSlot} - ${day.lastSlot})`;
        }).join('\n');
    }

    /**
     * Parse date/time from natural language (for AI)
     */
    parseNaturalDateTime(text, referenceDate = new Date()) {
        const lower = text.toLowerCase();

        // Common patterns
        const tomorrow = /mañana/i;
        const today = /hoy/i;
        const dayPatterns = {
            'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
            'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6, 'domingo': 0
        };

        let targetDate = new Date(referenceDate);

        // Check for relative days
        if (tomorrow.test(lower)) {
            targetDate.setDate(targetDate.getDate() + 1);
        } else if (today.test(lower)) {
            // Keep today
        } else {
            // Check for day names
            for (const [dayName, dayNum] of Object.entries(dayPatterns)) {
                if (lower.includes(dayName)) {
                    const currentDay = targetDate.getDay();
                    let daysToAdd = dayNum - currentDay;
                    if (daysToAdd <= 0) daysToAdd += 7;
                    targetDate.setDate(targetDate.getDate() + daysToAdd);
                    break;
                }
            }
        }

        // Extract time (HH:MM or "10 am", "3 pm", etc.)
        const timeMatch = lower.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2] || '0');
            const period = timeMatch[3]?.toLowerCase();

            if (period === 'pm' && hours < 12) hours += 12;
            if (period === 'am' && hours === 12) hours = 0;

            targetDate.setHours(hours, minutes, 0, 0);
        }

        return targetDate;
    }
    /**
     * Find upcoming appointments for a customer (for rescheduling/cancellation)
     */
    async findCustomerAppointments(customerId) {
        if (!customerId) return [];

        const now = new Date();
        return Appointment.find({
            organization: this.organizationId,
            customer: customerId,
            status: 'scheduled',
            startTime: { $gte: now }
        })
            .sort({ startTime: 1 })
            .limit(3);
    }

    /**
     * Check if a specific slot is available (for Booking Safety)
     */
    async checkSlotAvailability(requestedDateTime) {
        // Simple logic: get available days for this date and check slots
        // This is a reuse of existing logic but optimized for single check
        try {
            const date = new Date(requestedDateTime);
            const slots = await this.getAvailableSlots(date);

            const reqTime = date.toTimeString().substring(0, 5); // HH:MM
            const slot = slots.find(s => {
                const sTime = s.start.toTimeString().substring(0, 5);
                return sTime === reqTime;
            });

            if (slot) {
                return { available: true };
            } else {
                return {
                    available: false,
                    message: 'El horario seleccionado ya no está disponible.'
                };
            }
        } catch (e) {
            logger.error('Slot check failed', e);
            return { available: false, message: 'Error verificando disponibilidad.' };
        }
    }

    /**
     * Check for conflicting appointments for a customer
     */
    async checkCustomerConflicts(customerId, requestedDateTime) {
        if (!customerId) return { hasConflict: false };

        const date = new Date(requestedDateTime);
        // Check window +/- 30 mins
        const startWindow = new Date(date); startWindow.setMinutes(date.getMinutes() - 29);
        const endWindow = new Date(date); endWindow.setMinutes(date.getMinutes() + 29);

        const conflict = await Appointment.findOne({
            organization: this.organizationId,
            customer: customerId,
            status: { $in: ['scheduled', 'confirmed'] },
            startTime: { $gte: startWindow, $lte: endWindow }
        });

        if (conflict) {
            const time = conflict.startTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
            return {
                hasConflict: true,
                existingTime: time,
                message: `Ya tienes una cita a las ${time}.`
            };
        }

        return { hasConflict: false };
    }
}

/**
 * Factory function to create and initialize appointment service
 */
export async function createAppointmentService(organizationId) {
    const service = new AppointmentService(organizationId);
    await service.initialize();
    return service;
}

/**
 * Check if appointments are available for an organization
 */
export async function areAppointmentsEnabled(organizationId) {
    const org = await Organization.findById(organizationId);
    const calendarConnected = await isCalendarConnected(organizationId);
    return org?.appointmentsConfig?.enabled && calendarConnected;
}
