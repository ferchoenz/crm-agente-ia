import { IntelligentRouter } from './apps/server/src/services/ai/routing/intelligent-router.js';

function runRouterTests() {
    console.log('🧪 Testing Intelligent Router Logic...\n');

    // Test 1: Simple Greeting (L2)
    const t1 = IntelligentRouter.selectModel('greeting', {});
    console.log(`Test 1 (Greeting): ${t1.model} (${t1.tier}) - Reason: ${t1.reason}`);
    if (t1.tier === 'L2') console.log('✅ PASS'); else console.error('❌ FAIL');

    // Test 2: Objection (L3)
    const t2 = IntelligentRouter.selectModel('objection', {});
    console.log(`Test 2 (Objection): ${t2.model} (${t2.tier}) - Reason: ${t2.reason}`);
    if (t2.tier === 'L3') console.log('✅ PASS'); else console.error('❌ FAIL');

    // Test 3: Closing Phase (L3)
    const t3 = IntelligentRouter.selectModel('quote_request', { salesPhase: 'CLOSING' });
    console.log(`Test 3 (Closing Phase): ${t3.model} (${t3.tier}) - Reason: ${t3.reason}`);
    if (t3.tier === 'L3') console.log('✅ PASS'); else console.error('❌ FAIL');

    // Test 4: High Token Count (L3)
    const t4 = IntelligentRouter.selectModel('general_inquiry', { totalTokens: 1500 });
    console.log(`Test 4 (High Tokens): ${t4.model} (${t4.tier}) - Reason: ${t4.reason}`);
    if (t4.tier === 'L3') console.log('✅ PASS'); else console.error('❌ FAIL');

    // Test 5: Complex History (L3)
    const t5 = IntelligentRouter.selectModel('general_inquiry', { intentHistory: ['greeting', 'objection'] });
    console.log(`Test 5 (Complex History): ${t5.model} (${t5.tier}) - Reason: ${t5.reason}`);
    if (t5.tier === 'L3') console.log('✅ PASS'); else console.error('❌ FAIL');
}

runRouterTests();
