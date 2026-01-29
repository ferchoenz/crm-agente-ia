/**
 * DateTime Parser
 * Robust logic for extracting dates and times from natural language Spanish.
 */
export class DateTimeParser {
    /**
     * Parse relative dates (hoy, mañana, próximo lunes) to YYYY-MM-DD
     * @param {string} text - Input text
     * @param {Date} referenceDate - Anchor date (default now)
     * @returns {string|null} YYYY-MM-DD or null
     */
    static parseRelativeDate(text, referenceDate = new Date()) {
        const lower = text.toLowerCase();
        const date = new Date(referenceDate);
        date.setHours(0, 0, 0, 0);

        // 1. Relative keywords
        const relativePatterns = {
            'hoy': 0,
            'mañana': 1,
            'pasado mañana': 2,
            'esta semana': 0,
            'próxima semana': 7,
            'siguiente semana': 7,
            'en una semana': 7,
            'en 2 semanas': 14,
            'en dos semanas': 14
        };

        for (const [pattern, daysToAdd] of Object.entries(relativePatterns)) {
            if (lower.includes(pattern)) {
                date.setDate(date.getDate() + daysToAdd);
                return date.toISOString().split('T')[0];
            }
        }

        // 2. Day names (relative to today)
        const daysMap = {
            'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
            'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6, 'domingo': 0
        };

        for (const [dayName, dayNum] of Object.entries(daysMap)) {
            // Find "lunes" but verify it's not part of "lunes 15" which is handled later
            if (new RegExp(`\\b${dayName}\\b`, 'i').test(lower)) {

                // If text says "el próximo lunes" or just "lunes"
                // Logic: Find the NEXT occurrence of this day
                const currentDay = date.getDay();
                let daysToAdd = dayNum - currentDay;
                if (daysToAdd <= 0) daysToAdd += 7; // Always next instance

                // Special case: "este lunes" (could mean today or past? usually means coming)
                // We'll assume future-looking for appointment context

                // Check if we found a specific date format like "lunes 15", if so skip this block
                if (/\d/.test(text)) {
                    // Let the date pattern handler below try first if numbers exist
                } else {
                    date.setDate(date.getDate() + daysToAdd);
                    return date.toISOString().split('T')[0];
                }
            }
        }

        // 3. Specific date formats
        // Matches: 15/02, 15-02, 15 de febrero, 15 feb
        const datePatterns = [
            /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/, // 15/02 or 15/02/2024
            /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                if (pattern.source.includes('de')) {
                    // "15 de febrero"
                    const day = parseInt(match[1]);
                    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                    const month = monthNames.indexOf(match[2].toLowerCase());
                    if (month >= 0) {
                        date.setMonth(month);
                        date.setDate(day);
                        // If result is in the past (e.g. Feb 15 when today is March), add a year?
                        // For bookings, usually assume coming date.
                        if (date < new Date(referenceDate.setHours(0, 0, 0, 0))) {
                            date.setFullYear(date.getFullYear() + 1);
                        }
                        return date.toISOString().split('T')[0];
                    }
                } else {
                    // "15/02"
                    const day = parseInt(match[1]);
                    const month = parseInt(match[2]) - 1; // JS months 0-indexed
                    let year = match[3] ? parseInt(match[3]) : date.getFullYear();
                    // Handle 2-digit year
                    if (year < 100) year += 2000;

                    date.setFullYear(year);
                    date.setMonth(month);
                    date.setDate(day);

                    // Auto-increment year if date passed and no year specified
                    if (!match[3]) {
                        if (date < new Date(referenceDate.setHours(0, 0, 0, 0))) {
                            date.setFullYear(date.getFullYear() + 1);
                        }
                    }
                    return date.toISOString().split('T')[0];
                }
            }
        }

        return null;
    }

    /**
     * Parse time strings to HH:MM (24h)
     * @param {string} text 
     * @returns {string|null} HH:MM
     */
    static parseTime(text) {
        // 1. HH:MM (24h)
        const time24 = text.match(/\b([0-2]?\d):([0-5]\d)\b/);
        if (time24) {
            // Validate hours
            const h = parseInt(time24[1]);
            if (h >= 0 && h < 24) {
                return `${time24[1].padStart(2, '0')}:${time24[2]}`;
            }
        }

        // 2. HH AM/PM or HH:MM AM/PM
        const time12 = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
        if (time12) {
            let hours = parseInt(time12[1]);
            const minutes = time12[2] || '00';
            const period = time12[3].toLowerCase();

            if (period === 'pm' && hours < 12) hours += 12;
            if (period === 'am' && hours === 12) hours = 0;

            if (hours >= 0 && hours < 24) {
                return `${hours.toString().padStart(2, '0')}:${minutes}`;
            }
        }

        // 3. Natural language terms
        const naturalTimes = {
            'mañana': '09:00', // context 'por la mañana'
            'tarde': '15:00',
            'noche': '19:00',
            'mediodía': '12:00',
            'mediodia': '12:00'
        };

        const lower = text.toLowerCase();
        // Check for specific phrases like "por la tarde" or "en la mañana"
        // Avoid matching "mañana" (tomorrow) as "09:00" unless context implies time of day
        // This is tricky. simpler: check if "a las X" is present.

        // Let's rely on explicit terms for now
        for (const [term, time] of Object.entries(naturalTimes)) {
            // Only match if it looks like a time specifier, not just the word
            // e.g. "por la tarde", "en la noche"
            if ((lower.includes(`por la ${term}`) || lower.includes(`en la ${term}`)) ||
                (term === 'mediodía' && lower.includes(term))) {
                return time;
            }
        }

        return null;
    }
}
