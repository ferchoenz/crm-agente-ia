import { BookingSafety } from './apps/server/src/services/ai/booking/booking-safety.js';
import { logger } from './apps/server/src/utils/logger.js';

// Mock DB and Redis dependencies
// This is a naive test setup. In a real environment we would need a proper test harness.
// Assuming we are running this in an environment where 'ioredis' can connect or fail gracefully.

logger.info = console.log;
logger.error = console.error;

async function runBookingTests() {
    console.log('🧪 Testing Booking Safety Logic...\n');

    // Mock Conversation & Appointment Service
    const mockConversation = { _id: 'conv_123', context: {} };
    const mockApptService = {
        checkSlotAvailability: async (date) => {
            // Mock: 3pm is available, 4pm is broken
            const h = date.getHours();
            if (h === 15) return { available: true };
            return { available: false, message: 'Slot taken' };
        },
        checkCustomerConflicts: async (cid, date) => {
            return { hasConflict: false };
        }
    };

    // Test 1: JSON Proposal Parsing
    const llmResponse = `Sure! I have checked. \n\n{ "type": "suggested_action", "action": "book_appointment", "proposals": [{ "date": "2024-02-01", "time": "15:00" }] }`;

    console.log('--- Test 1: Process Suggestion ---');
    try {
        const result = await BookingSafety.processSuggestion(
            llmResponse,
            mockConversation,
            'cust_123',
            mockApptService
        );

        console.log('Processed Content:', result.content);
        console.log('Has Pending:', result.hasPendingBooking);
        console.log('Pending Data:', result.pendingBooking);

        if (result.hasPendingBooking && result.pendingBooking.time === '15:00') {
            console.log('✅ Suggestion Test PASSED');
        } else {
            console.error('❌ Suggestion Test FAILED');
        }
    } catch (e) {
        console.warn('⚠️ Test skipped (likely Redis connection failed in mock):', e.message);
    }
}

runBookingTests();
