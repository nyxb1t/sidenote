'use strict';

/**
 * backend/test-credits.js
 *
 * Day 5 — Credit Rules and Entitlement Tests.
 *
 * Pure logic testing: no API calls, no API keys required.
 * All tests run against real implementation code.
 *
 * Usage:
 *   node backend/test-credits.js
 */

const { getCreditCost, CREDIT_COSTS }  = require('./monetization/creditRules.cjs');
const { checkEntitlement }             = require('./monetization/entitlementGuard.cjs');
const { InsufficientCreditsError }     = require('./monetization/InsufficientCreditsError.cjs');
const { generateLesson }               = require('./ai/lessonService.cjs');

// ─── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function printSection(title) {
  console.log('\n' + '═'.repeat(65));
  console.log(` ${title}`);
  console.log('═'.repeat(65));
}

function assert(condition, label, detail = '') {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

// ─── Minimal learner context for Test 6 ──────────────────────────────────────

// Test 6 only needs to reach the entitlement check (Step 0), which fires before
// any use of learnerContext. A valid session shape is sufficient.
const MINIMAL_LEARNER = {
  memoryType:     'session',
  currentSession: {
    topic:    'Recursion',
    lessonId: 'test-session-001',
  },
};

// ─── TEST 1 — getCreditCost() returns correct values ─────────────────────────

function runTest1() {
  printSection('TEST 1 — getCreditCost() returns correct values');

  const cases = [
    { action: 'generateLesson',            expected: 1 },
    { action: 'generateQuiz',              expected: 0 },
    { action: 'generateNotes',             expected: 0 },
    { action: 'generateRetryExplanation',  expected: 1 },
    { action: 'generateVisualExplanation', expected: 1 },
  ];

  for (const { action, expected } of cases) {
    const cost = getCreditCost(action);
    assert(
      cost === expected,
      `getCreditCost('${action}') === ${expected} (got ${cost})`
    );
  }

  // Unknown action must throw
  try {
    getCreditCost('generateSomethingUnknown');
    assert(false, 'getCreditCost(unknown) should have thrown');
  } catch (err) {
    assert(
      err instanceof Error && err.message.includes('unrecognised action'),
      'getCreditCost(unknown) throws Error with "unrecognised action" message'
    );
  }

  // Verify CREDIT_COSTS table is complete and matches the 5 known actions
  const keys = Object.keys(CREDIT_COSTS).sort();
  const expected = [
    'generateLesson',
    'generateNotes',
    'generateQuiz',
    'generateRetryExplanation',
    'generateVisualExplanation',
  ].sort();
  assert(
    JSON.stringify(keys) === JSON.stringify(expected),
    `CREDIT_COSTS table contains exactly 5 known actions`
  );
}

// ─── TEST 2 — Mastery plan always passes ─────────────────────────────────────

function runTest2() {
  printSection('TEST 2 — Mastery plan always passes (creditsRemaining = 0)');

  const userContext = { userId: 'mastery-user', plan: 'mastery', creditsRemaining: 0 };

  const actions = Object.keys(CREDIT_COSTS);

  for (const action of actions) {
    try {
      const result = checkEntitlement(action, userContext);
      assert(result === true, `mastery plan: checkEntitlement('${action}') returns true`);
    } catch (err) {
      assert(false, `mastery plan: checkEntitlement('${action}') should not throw (threw ${err.name})`);
    }
  }
}

// ─── TEST 3 — Free user with credits passes ───────────────────────────────────

function runTest3() {
  printSection('TEST 3 — Free user with sufficient credits passes');

  const userContext = { userId: 'free-user-001', plan: 'free', creditsRemaining: 5 };

  try {
    const result = checkEntitlement('generateLesson', userContext);
    assert(result === true, 'free user with 5 credits: checkEntitlement(generateLesson) returns true');
  } catch (err) {
    assert(false, `free user with 5 credits: should not throw (threw ${err.name}: ${err.message})`);
  }

  // Also verify learner and scholar plans pass with sufficient credits
  for (const plan of ['learner', 'scholar']) {
    const ctx = { userId: `${plan}-user`, plan, creditsRemaining: 3 };
    try {
      const result = checkEntitlement('generateLesson', ctx);
      assert(result === true, `${plan} plan with 3 credits: checkEntitlement(generateLesson) returns true`);
    } catch (err) {
      assert(false, `${plan} plan with 3 credits: should not throw`);
    }
  }
}

// ─── TEST 4 — Free user with no credits is blocked ───────────────────────────

function runTest4() {
  printSection('TEST 4 — Free user with 0 credits is blocked on paid actions');

  const userId          = 'free-user-broke';
  const creditsRemaining = 0;
  const userContext     = { userId, plan: 'free', creditsRemaining };

  try {
    checkEntitlement('generateLesson', userContext);
    assert(false, 'free user with 0 credits: should have thrown InsufficientCreditsError');
  } catch (err) {
    assert(
      err instanceof InsufficientCreditsError,
      'thrown error is instanceof InsufficientCreditsError'
    );
    assert(
      err.name === 'InsufficientCreditsError',
      `err.name === 'InsufficientCreditsError' (got "${err.name}")`
    );
    assert(
      err.userId === userId,
      `err.userId === '${userId}' (got "${err.userId}")`
    );
    assert(
      err.action === 'generateLesson',
      `err.action === 'generateLesson' (got "${err.action}")`
    );
    assert(
      err.creditsRemaining === creditsRemaining,
      `err.creditsRemaining === ${creditsRemaining} (got ${err.creditsRemaining})`
    );
    assert(
      typeof err.message === 'string' && err.message.length > 0,
      `err.message is a non-empty string: "${err.message}"`
    );

    console.log(`\n  Error message: ${err.message}`);
  }

  // Also verify retry is blocked with 0 credits
  try {
    checkEntitlement('generateRetryExplanation', userContext);
    assert(false, 'free user with 0 credits: generateRetryExplanation should throw');
  } catch (err) {
    assert(
      err instanceof InsufficientCreditsError,
      'generateRetryExplanation also throws InsufficientCreditsError for free/0 user'
    );
  }
}

// ─── TEST 5 — Zero-cost actions always pass ───────────────────────────────────

function runTest5() {
  printSection('TEST 5 — Zero-cost actions pass even with creditsRemaining = 0');

  const userContext = { userId: 'free-user-broke', plan: 'free', creditsRemaining: 0 };

  const zeroCostActions = ['generateQuiz', 'generateNotes'];

  for (const action of zeroCostActions) {
    try {
      const result = checkEntitlement(action, userContext);
      assert(result === true, `free/0 credits: checkEntitlement('${action}') returns true`);
    } catch (err) {
      assert(
        false,
        `free/0 credits: checkEntitlement('${action}') should not throw (threw ${err.name})`
      );
    }
  }

  // Also verify with unknown plan (non-mastery) at 0 credits — same result
  const unknownPlan = { userId: 'unknown-plan-user', plan: 'community', creditsRemaining: 0 };
  for (const action of zeroCostActions) {
    try {
      const result = checkEntitlement(action, unknownPlan);
      assert(result === true, `unknown plan/0 credits: checkEntitlement('${action}') returns true`);
    } catch (err) {
      assert(
        false,
        `unknown plan/0 credits: checkEntitlement('${action}') should not throw`
      );
    }
  }
}

// ─── TEST 6 — Entitlement check fires before callAI() ─────────────────────────

async function runTest6() {
  printSection('TEST 6 — generateLesson throws InsufficientCreditsError before callAI()');

  const userContext = { userId: 'free-user-broke', plan: 'free', creditsRemaining: 0 };

  console.log('\n  Calling generateLesson(free, creditsRemaining=0)…');
  console.log('  Expected: InsufficientCreditsError thrown before any AI call.');

  try {
    await generateLesson('Recursion', MINIMAL_LEARNER, userContext);
    assert(false, 'generateLesson should have thrown InsufficientCreditsError');
  } catch (err) {
    assert(
      err instanceof InsufficientCreditsError,
      'generateLesson threw InsufficientCreditsError (not a provider error)'
    );
    assert(
      err.name === 'InsufficientCreditsError',
      `err.name is InsufficientCreditsError (got "${err.name}")`
    );
    assert(
      err.userId === 'free-user-broke',
      `err.userId correct (got "${err.userId}")`
    );
    assert(
      err.action === 'generateLesson',
      `err.action is 'generateLesson' (got "${err.action}")`
    );
    assert(
      err.creditsRemaining === 0,
      `err.creditsRemaining is 0 (got ${err.creditsRemaining})`
    );

    // Confirm it was NOT a provider error (proves callAI was never reached)
    const isProviderError = (
      err.name === 'GeminiError'   ||
      err.name === 'GroqError'     ||
      err.name === 'AggregateError'
    );
    assert(
      !isProviderError,
      'Error is NOT a GeminiError / GroqError / AggregateError — callAI() was never reached'
    );

    console.log(`\n  Error message: ${err.message}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nSideNote Intelligence Layer — Credit and Entitlement Tests (Day 5)');
  console.log('No API calls. No API keys required.');
  console.log(`Started: ${new Date().toISOString()}`);

  runTest1();
  runTest2();
  runTest3();
  runTest4();
  runTest5();
  await runTest6();

  printSection(`RESULTS: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(`\n  ✗ ${failed} assertion(s) failed. Review output above.\n`);
    process.exit(1);
  } else {
    console.log(`\n  ✓ All ${passed} assertions passed.\n`);
  }
}

main();

