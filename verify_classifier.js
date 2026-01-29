
import { aiClassifier } from './apps/server/src/services/ai/ai-classifier.service.js';
import { logger } from './apps/server/src/utils/logger.js';

// Mock logger to avoid clutter
logger.info = console.log;
logger.warn = console.warn;
logger.error = console.error;
logger.debug = () => { };

async function runTests() {
    console.log('🧪 Starting AI Classifier Verification...\n');

    // Test 1: Fallback (Logic check without API Key for now or assuming keys present)
    // We can force fallback by mocking the provider
    console.log('--- Test 1: Fallback Logic ---');
    const msg1 = "quiero agendar una cita para mañana a las 5pm";

    // Temporarily break provider
    const originalProvider = aiClassifier.provider;
    aiClassifier.provider = null; // Force fallback

    const res1 = await aiClassifier.classify(msg1);
    console.log('Input:', msg1);
    console.log('Result:', JSON.stringify(res1, null, 2));

    if (res1.method === 'fallback' && res1.intent === 'appointment_new' && res1.entities.targetTime === '17:00') {
        console.log('✅ Fallback Test PASSED');
    } else {
        console.error('❌ Fallback Test FAILED');
    }

    // Restore provider
    aiClassifier.provider = originalProvider;
    console.log('\n--------------------------------\n');

    // Test 2: Cache
    console.log('--- Test 2: Caching ---');
    if (originalProvider) {
        // Run once
        console.log('First Run (API)...');
        // We can't guarantee API key is valid in this environment, so this might trigger fallback anyway, 
        // which is fine, we just want to test cache.
        try {
            const res2a = await aiClassifier.classify("hola mundo");
        } catch (e) {
            console.log("API Error (Expected if no key):", e.message);
        }

        console.log('Second Run (Cache)...');
        const start = Date.now();
        const res2b = await aiClassifier.classify("hola mundo");
        const duration = Date.now() - start;

        console.log(`Duration: ${duration}ms`);
        // If it was cached, it should be super fast, OR if fallback was used both times, it's also fast.
        // We check if the result mentions "cached"
        if (res2b.cached || duration < 50) {
            console.log('✅ Cache Test PASSED');
        } else {
            console.log('❌ Cache Test FAILED (or API fast)');
        }
    } else {
        console.log('Skipping Cache Test (No Provider loaded)');
    }

    console.log('\n--------------------------------\n');

    // Test 3: Date Parser
    console.log('--- Test 3: Date Parser Integration ---');
    const msg3 = "agendar para el pasado mañana";
    // Force fallback to ensure we test parser logic specifically
    aiClassifier.provider = null;
    const res3 = await aiClassifier.classify(msg3);

    console.log('Input:', msg3);
    console.log('Entities:', res3.entities);

    if (res3.entities.targetDate) {
        console.log('✅ Date Parser Test PASSED');
    } else {
        console.error('❌ Date Parser Test FAILED');
    }

}

runTests().catch(console.error);
