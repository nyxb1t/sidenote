'use strict';

/**
 * backend/test-smoke.js
 *
 * Standalone smoke test for the SideNote Intelligence Layer.
 *
 * Runs two tests:
 *   Test 1 — Normal path:   Gemini responds → print returned lesson JSON.
 *   Test 2 — Forced fallback: GEMINI_API_KEY is corrupted in memory → Gemini
 *             fails → Groq fallback responds → print returned lesson JSON →
 *             original key is restored.
 *
 * Usage:
 *   node backend/test-smoke.js
 *
 * Prerequisites:
 *   - Copy backend/.env.example to backend/.env and fill in real API keys.
 *   - Run `npm install` inside backend/ first.
 */

// Load environment variables from backend/.env
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { generateLesson }   = require('./ai/lessonService');
const { validateLesson }   = require('./ai/validators/lessonValidator');
const { validateQuiz }     = require('./ai/validators/quizValidator');
const { ValidationError }  = require('./ai/validators/ValidationError');

// ─── Sample learner model ─────────────────────────────────────────────────────

const SAMPLE_LEARNER = {
  userId:          'smoke-test-user-001',
  goal:            'Crack GATE CS 2025',
  knownTopics:     ['Arrays & Strings', 'Sorting Algorithms'],
  weakAreas:       ['Recursion', 'Dynamic Programming'],
  preferredStyle:  'visual',
  mastery: {
    overall:  0.45,
    byTopic: {
      'Arrays & Strings':   0.85,
      'Sorting Algorithms': 0.80,
      'Recursion':          0.28,
    },
  },
  mistakePatterns: [
    'Struggles to identify base cases',
    'Confuses call stack depth with recursion depth',
  ],
  lastStrategy:    null,
  examDate:        '2025-02-02',
  sessionCount:    7,
};

const TOPIC = 'Recursion';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function printSection(title) {
  console.log('\n' + '═'.repeat(60));
  console.log(` ${title}`);
  console.log('═'.repeat(60));
}

function printResult(label, result) {
  console.log(`\n✓ ${label}`);
  console.log(JSON.stringify(result, null, 2));
}

function printError(label, err) {
  console.error(`\n✗ ${label}`);
  console.error(`  ${err.name}: ${err.message}`);
  if (err.errors) {
    // AggregateError
    err.errors.forEach((e, i) => {
      console.error(`  [${i + 1}] ${e.name}: ${e.message}`);
    });
  }
}

// ─── Test 1: Normal Gemini path ───────────────────────────────────────────────

async function runTest1() {
  printSection('TEST 1 — Normal path (Gemini primary)');
  console.log(`Topic:  "${TOPIC}"`);
  console.log(`Model:  ${process.env.GEMINI_MODEL ?? '(not set)'}`);

  try {
    const lesson = await generateLesson(TOPIC, SAMPLE_LEARNER);
    printResult('generateLesson succeeded', lesson);
    return lesson; // Return so Test 3 can use it
  } catch (err) {
    printError('generateLesson failed', err);
    return null;
  }
}

// ─── Test 2: Forced fallback (Groq) ──────────────────────────────────────────

async function runTest2() {
  printSection('TEST 2 — Forced Groq fallback (bad Gemini key)');
  console.log(`Topic:  "${TOPIC}"`);
  console.log(`Model:  ${process.env.GROQ_MODEL ?? '(not set)'}`);

  // Save the real key so we can restore it after the test.
  const originalGeminiKey = process.env.GEMINI_API_KEY;

  try {
    // Corrupt the key in memory — Gemini will fail with an auth error.
    process.env.GEMINI_API_KEY = 'SMOKE_TEST_BAD_KEY';
    console.log('\n  → GEMINI_API_KEY corrupted in memory for this test.');

    const lesson = await generateLesson(TOPIC, {
      ...SAMPLE_LEARNER,
      lastStrategy: 'visual', // ensure strategy rotation is exercised
    });

    printResult('generateLesson succeeded via Groq fallback', lesson);

  } catch (err) {
    printError('generateLesson failed (both providers failed)', err);
  } finally {
    // Always restore the original key — even if the test throws.
    process.env.GEMINI_API_KEY = originalGeminiKey;
    console.log('\n  → GEMINI_API_KEY restored to original value.');
  }
}

// ─── Test 3: validateLesson rejects invalid input ─────────────────────────────

async function runTest3() {
  printSection('TEST 3 — validateLesson rejects invalid lesson (no AI call)');

  // A lesson object that is missing the required sections field entirely.
  const invalidLesson = {
    version: 1,
    title:   'Recursion Basics',
    topic:   'Recursion',
    teachingStrategy: 'visual',
    // sections: intentionally omitted
  };

  try {
    validateLesson(invalidLesson);
    // If we reach here, the validator did not throw — that is a failure.
    console.error('\n✗ Test 3 FAILED: validateLesson did not throw for a missing sections field.');
  } catch (err) {
    if (err instanceof ValidationError) {
      console.log(`\n✓ validateLesson correctly threw ValidationError`);
      console.log(`  field:    ${err.field}`);
      console.log(`  expected: ${err.expected}`);
      console.log(`  received: ${err.received}`);
      console.log(`  message:  ${err.message}`);
    } else {
      console.error(`\n✗ Test 3 FAILED: unexpected error type — ${err.name}: ${err.message}`);
    }
  }

  // A second case: sections present but a section has an unknown type.
  const invalidSectionType = {
    version: 1,
    title:   'Recursion Basics',
    topic:   'Recursion',
    teachingStrategy: 'visual',
    sections: [
      { type: 'unknown_type', content: 'some content' },
    ],
  };

  try {
    validateLesson(invalidSectionType);
    console.error('\n✗ Test 3b FAILED: validateLesson did not throw for unknown section type.');
  } catch (err) {
    if (err instanceof ValidationError) {
      console.log(`\n✓ validateLesson correctly threw ValidationError for unknown section type`);
      console.log(`  field:    ${err.field}`);
      console.log(`  expected: ${err.expected}`);
      console.log(`  received: ${err.received}`);
    } else {
      console.error(`\n✗ Test 3b FAILED: unexpected error type — ${err.name}: ${err.message}`);
    }
  }
}

// ─── Test 4: validateQuiz rejects invalid input ───────────────────────────────

async function runTest4() {
  printSection('TEST 4 — validateQuiz rejects invalid quiz (no AI call)');

  // A quiz where an mcq question is missing its options array.
  const invalidQuiz = {
    topic:      'Recursion',
    difficulty: 'intermediate',
    questions: [
      {
        id:          'q1',
        type:        'mcq',
        question:    'What is the base case of a recursive function?',
        explanation: 'The base case stops the recursion.',
        // options: intentionally omitted
        correctIndex: 0,
      },
    ],
  };

  try {
    validateQuiz(invalidQuiz);
    console.error('\n✗ Test 4 FAILED: validateQuiz did not throw for a missing options field.');
  } catch (err) {
    if (err instanceof ValidationError) {
      console.log(`\n✓ validateQuiz correctly threw ValidationError`);
      console.log(`  field:    ${err.field}`);
      console.log(`  expected: ${err.expected}`);
      console.log(`  received: ${err.received}`);
      console.log(`  message:  ${err.message}`);
    } else {
      console.error(`\n✗ Test 4 FAILED: unexpected error type — ${err.name}: ${err.message}`);
    }
  }

  // A second case: true_false question with a non-boolean correctAnswer.
  const invalidTrueFalse = {
    topic:      'Recursion',
    difficulty: 'beginner',
    questions: [
      {
        id:            'q1',
        type:          'true_false',
        question:      'Recursion always uses less memory than iteration.',
        explanation:   'This is false — recursion uses call stack memory.',
        correctAnswer: 'false', // string instead of boolean
      },
    ],
  };

  try {
    validateQuiz(invalidTrueFalse);
    console.error('\n✗ Test 4b FAILED: validateQuiz did not throw for a string correctAnswer.');
  } catch (err) {
    if (err instanceof ValidationError) {
      console.log(`\n✓ validateQuiz correctly threw ValidationError for string correctAnswer`);
      console.log(`  field:    ${err.field}`);
      console.log(`  expected: ${err.expected}`);
      console.log(`  received: ${err.received}`);
    } else {
      console.error(`\n✗ Test 4b FAILED: unexpected error type — ${err.name}: ${err.message}`);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nSideNote Intelligence Layer — Smoke Test');
  console.log(`Started at: ${new Date().toISOString()}`);

  // Validate that required env vars are present before running
  const missing = ['GEMINI_API_KEY', 'GEMINI_MODEL', 'GROQ_API_KEY', 'GROQ_MODEL']
    .filter((k) => !process.env[k]);

  if (missing.length > 0) {
    console.error(
      '\n✗ Missing required environment variables: ' + missing.join(', ') +
      '\n  Copy backend/.env.example to backend/.env and fill in your keys.'
    );
    process.exit(1);
  }

  await runTest1();
  await runTest2();
  await runTest3();
  await runTest4();

  printSection('SMOKE TEST COMPLETE');
  console.log('');
}

main().catch((err) => {
  console.error('\nUnexpected top-level error:', err);
  process.exit(1);
});

