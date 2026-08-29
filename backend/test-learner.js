'use strict';

/**
 * backend/test-learner.js
 *
 * Day 4 — Learner Model Intelligence Tests.
 *
 * Pure logic testing: no API calls, no API keys required.
 * All tests run against real implementation code.
 *
 * Usage:
 *   node backend/test-learner.js
 */

const { updateLearnerModel, selectTeachingStrategy } = require('./learner/learnerService');
const { getAdaptedDifficulty, shouldUseAnalogy }     = require('./learner/adaptationService');
const { buildLessonPrompt }                          = require('./ai/prompts/lessonPrompt');

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

function printModel(label, model) {
  const compact = {
    sessionCount:    model.sessionCount,
    lastStrategy:    model.lastStrategy,
    'mastery.overall': model.mastery?.overall?.toFixed(3),
    'mastery.byTopic': model.mastery?.byTopic,
    knownTopics:     model.knownTopics,
    weakAreas:       model.weakAreas,
    mistakePatterns: model.mistakePatterns,
  };
  console.log(`\n  [${label}]`);
  Object.entries(compact).forEach(([k, v]) => {
    console.log(`    ${k}: ${JSON.stringify(v)}`);
  });
}

// ─── Base learner model ───────────────────────────────────────────────────────

function freshLearner(overrides = {}) {
  return {
    userId:          'test-user-001',
    goal:            'Crack GATE CS 2025',
    knownTopics:     [],
    weakAreas:       [],
    preferredStyle:  null,
    mastery: {
      overall:  0,
      byTopic:  {},
    },
    mistakePatterns: [],
    lastStrategy:    null,
    examDate:        null,
    sessionCount:    0,
    ...overrides,
    mastery: {
      overall:  overrides.mastery?.overall ?? 0,
      byTopic:  { ...(overrides.mastery?.byTopic ?? {}) },
    },
  };
}

// ─── TEST 1 — lesson_complete: threshold crossing ─────────────────────────────

function runTest1() {
  printSection('TEST 1 — lesson_complete: mastery threshold crossing');

  const TOPIC = 'Recursion';

  const before = freshLearner({
    mastery: { overall: 0.79, byTopic: { [TOPIC]: 0.79 } },
    sessionCount: 5,
  });

  console.log('\n  Starting mastery for Recursion: 0.79 (just below 0.8 threshold)');
  printModel('BEFORE', before);

  const after = updateLearnerModel(before, {
    type:         'lesson_complete',
    topic:        TOPIC,
    strategyUsed: 'visual',
  });

  printModel('AFTER', after);

  assert(
    after.sessionCount === before.sessionCount + 1,
    'sessionCount incremented by 1',
    `expected ${before.sessionCount + 1}, got ${after.sessionCount}`
  );

  const updatedMastery = after.mastery.byTopic[TOPIC];
  assert(
    updatedMastery > 0.79,
    `mastery.byTopic[Recursion] increased (got ${updatedMastery?.toFixed(3)})`
  );
  assert(
    updatedMastery >= 0.8,
    `mastery.byTopic[Recursion] crossed KNOWN_TOPIC_THRESHOLD (0.8), got ${updatedMastery?.toFixed(3)}`
  );
  assert(
    after.knownTopics.includes(TOPIC),
    'Recursion entered knownTopics'
  );
  assert(
    after.lastStrategy === 'visual',
    'lastStrategy recorded as visual'
  );
}

// ─── TEST 2 — Immutability check ──────────────────────────────────────────────

function runTest2() {
  printSection('TEST 2 — Immutability: original model must not be mutated');

  const TOPIC = 'Graphs';

  const original = freshLearner({
    mastery: { overall: 0.4, byTopic: { [TOPIC]: 0.4 } },
    weakAreas: ['Dynamic Programming'],
    sessionCount: 3,
    lastStrategy: 'visual',
  });

  // Capture deep snapshot of original before the call
  const snapshot = {
    sessionCount:       original.sessionCount,
    lastStrategy:       original.lastStrategy,
    overallMastery:     original.mastery.overall,
    topicMastery:       original.mastery.byTopic[TOPIC],
    knownTopicsLen:     original.knownTopics.length,
    weakAreasLen:       original.weakAreas.length,
    mistakePatternsLen: original.mistakePatterns.length,
  };

  console.log('\n  Firing lesson_complete for Graphs on original model…');

  const updated = updateLearnerModel(original, {
    type:         'lesson_complete',
    topic:        TOPIC,
    strategyUsed: 'analogy',
  });

  console.log(`\n  original.sessionCount:               ${original.sessionCount}  (expected ${snapshot.sessionCount})`);
  console.log(`  original.mastery.byTopic[Graphs]:    ${original.mastery.byTopic[TOPIC]}  (expected ${snapshot.topicMastery})`);
  console.log(`  original.lastStrategy:               ${original.lastStrategy}  (expected ${snapshot.lastStrategy})`);
  console.log(`  updated.sessionCount:                ${updated.sessionCount}  (expected ${snapshot.sessionCount + 1})`);

  assert(
    original.sessionCount === snapshot.sessionCount,
    'original.sessionCount unchanged',
    `was ${snapshot.sessionCount}, now ${original.sessionCount}`
  );
  assert(
    original.mastery.overall === snapshot.overallMastery,
    'original.mastery.overall unchanged',
    `was ${snapshot.overallMastery}, now ${original.mastery.overall}`
  );
  assert(
    original.mastery.byTopic[TOPIC] === snapshot.topicMastery,
    'original.mastery.byTopic unchanged',
    `was ${snapshot.topicMastery}, now ${original.mastery.byTopic[TOPIC]}`
  );
  assert(
    original.lastStrategy === snapshot.lastStrategy,
    'original.lastStrategy unchanged',
    `was ${snapshot.lastStrategy}, now ${original.lastStrategy}`
  );
  assert(
    original.knownTopics.length === snapshot.knownTopicsLen,
    'original.knownTopics array not modified'
  );
  assert(
    original.weakAreas.length === snapshot.weakAreasLen,
    'original.weakAreas array not modified'
  );
  assert(
    original !== updated,
    'updated model is a different object reference'
  );
  assert(
    original.mastery !== updated.mastery,
    'updated mastery object is a different reference'
  );
  assert(
    original.mastery.byTopic !== updated.mastery.byTopic,
    'updated mastery.byTopic is a different reference'
  );
}

// ─── TEST 3 — quiz_result: poor score ─────────────────────────────────────────

function runTest3() {
  printSection('TEST 3 — quiz_result: poor score adds to weakAreas');

  const TOPIC = 'Recursion';

  const before = freshLearner({
    mastery: { overall: 0.3, byTopic: {} }, // Recursion not yet tracked
    sessionCount: 2,
  });

  console.log('\n  Starting overall mastery: 0.3, no Recursion entry in byTopic');
  printModel('BEFORE', before);

  const after = updateLearnerModel(before, {
    type:          'quiz_result',
    topic:         TOPIC,
    score:         0.3,
    mistakeTopics: [
      'Struggles to identify base cases',
      'Confuses call stack depth with recursion depth',
    ],
  });

  printModel('AFTER', after);

  const blended = after.mastery.byTopic[TOPIC];
  assert(
    blended !== undefined,
    `mastery.byTopic[Recursion] now exists (${blended?.toFixed(3)})`
  );
  assert(
    blended < 0.5,
    `mastery.byTopic[Recursion] is below WEAK_AREA_THRESHOLD (0.5), got ${blended?.toFixed(3)}`
  );
  assert(
    after.weakAreas.includes(TOPIC),
    'Recursion added to weakAreas'
  );
  assert(
    after.mistakePatterns.includes('Struggles to identify base cases'),
    'first mistakePattern appended'
  );
  assert(
    after.mistakePatterns.includes('Confuses call stack depth with recursion depth'),
    'second mistakePattern appended'
  );
  assert(
    after.mistakePatterns.length === 2,
    `mistakePatterns has exactly 2 entries (got ${after.mistakePatterns.length})`
  );
}

// ─── TEST 4 — retry_requested ────────────────────────────────────────────────

function runTest4() {
  printSection('TEST 4 — retry_requested: weakAreas and lastStrategy updated');

  const TOPIC = 'Recursion';

  const before = freshLearner({
    mastery:     { overall: 0.3, byTopic: { [TOPIC]: 0.3 } },
    lastStrategy: 'visual',
    sessionCount: 4,
  });

  console.log('\n  Recursion not in weakAreas yet, lastStrategy = visual');
  printModel('BEFORE', before);

  const after = updateLearnerModel(before, {
    type:         'retry_requested',
    topic:        TOPIC,
    strategyUsed: 'visual',
  });

  printModel('AFTER', after);

  assert(
    after.weakAreas.includes(TOPIC),
    'Recursion added to weakAreas'
  );
  assert(
    after.lastStrategy === 'visual',
    'lastStrategy recorded as visual'
  );
  assert(
    after.sessionCount === before.sessionCount,
    'sessionCount unchanged (retry_requested does not increment it)'
  );
}

// ─── TEST 5 — updateLearnerModel chain ───────────────────────────────────────

function runTest5() {
  printSection('TEST 5 — Event chain: lesson_complete → quiz_result → retry_requested');

  const TOPIC = 'Dynamic Programming';

  let model = freshLearner({
    mastery:     { overall: 0.35, byTopic: { [TOPIC]: 0.35 } },
    sessionCount: 0,
  });

  console.log('\n  Starting model:');
  printModel('INITIAL', model);

  // Event 1: lesson_complete
  model = updateLearnerModel(model, {
    type:         'lesson_complete',
    topic:        TOPIC,
    strategyUsed: 'step-by-step',
  });
  console.log('\n  After lesson_complete:');
  printModel('POST lesson_complete', model);
  assert(model.sessionCount === 1, 'sessionCount = 1 after lesson_complete');
  assert(model.lastStrategy === 'step-by-step', 'lastStrategy = step-by-step');

  // Event 2: quiz_result (poor)
  model = updateLearnerModel(model, {
    type:          'quiz_result',
    topic:         TOPIC,
    score:         0.25,
    mistakeTopics: ['Struggles with recurrence relations'],
  });
  console.log('\n  After quiz_result (score 0.25):');
  printModel('POST quiz_result', model);
  assert(
    model.weakAreas.includes(TOPIC),
    'Dynamic Programming in weakAreas after poor quiz'
  );
  assert(
    model.mistakePatterns.includes('Struggles with recurrence relations'),
    'mistakePattern appended from quiz'
  );

  // Event 3: retry_requested
  model = updateLearnerModel(model, {
    type:         'retry_requested',
    topic:        TOPIC,
    strategyUsed: 'step-by-step',
  });
  console.log('\n  After retry_requested:');
  printModel('POST retry_requested', model);
  assert(
    model.weakAreas.includes(TOPIC),
    'Dynamic Programming still in weakAreas after retry'
  );
  assert(
    model.lastStrategy === 'step-by-step',
    'lastStrategy updated by retry_requested'
  );
  assert(model.sessionCount === 1, 'sessionCount still 1 (only lesson_complete increments it)');
}

// ─── TEST 6 — selectTeachingStrategy profiles ────────────────────────────────

function runTest6() {
  printSection('TEST 6 — selectTeachingStrategy: four learner profiles');

  // Profile A: brand new learner
  const profileA = freshLearner({
    mastery:      { overall: 0.1, byTopic: {} },
    preferredStyle: null,
    lastStrategy:  null,
  });
  const resultA = selectTeachingStrategy('Recursion', profileA);
  console.log(`\n  Profile A (new learner, mastery 0.1):  → "${resultA}"`);
  assert(resultA === 'step-by-step', 'Profile A → step-by-step');

  // Profile B: visual preference, last was analogy
  const profileB = freshLearner({
    mastery:       { overall: 0.5, byTopic: { Sorting: 0.5 } },
    preferredStyle: 'visual',
    lastStrategy:  'analogy',
  });
  const resultB = selectTeachingStrategy('Sorting', profileB);
  console.log(`  Profile B (visual pref, last=analogy):  → "${resultB}"`);
  assert(resultB === 'visual', 'Profile B → visual');

  // Profile C: advanced learner
  const profileC = freshLearner({
    mastery:      { overall: 0.8, byTopic: { Graphs: 0.8 } },
    preferredStyle: null,
    lastStrategy:  null,
  });
  const resultC = selectTeachingStrategy('Graphs', profileC);
  console.log(`  Profile C (advanced mastery 0.8):       → "${resultC}"`);
  assert(resultC === 'socratic', 'Profile C → socratic');

  // Profile D: retry scenario — must NOT return lastStrategy
  const profileD = freshLearner({
    mastery:       { overall: 0.5, byTopic: { Recursion: 0.5 } },
    preferredStyle: 'step-by-step',
    lastStrategy:  'step-by-step',
    weakAreas:     [],
  });
  const resultD = selectTeachingStrategy('Recursion', profileD);
  console.log(`  Profile D (retry, last=step-by-step):   → "${resultD}"`);
  assert(
    resultD !== 'step-by-step',
    `Profile D → anything except step-by-step (got "${resultD}")`
  );

  // Bonus: beginner retry (the fixed edge case)
  const profileEdge = freshLearner({
    mastery:      { overall: 0.1, byTopic: { Recursion: 0.1 } },
    preferredStyle: null,
    lastStrategy:  'step-by-step', // just failed — must not repeat
  });
  const resultEdge = selectTeachingStrategy('Recursion', profileEdge);
  console.log(`  Profile Edge (beginner, last=step-by-step): → "${resultEdge}"`);
  assert(
    resultEdge !== 'step-by-step',
    `Edge case (beginner retry) → anything except step-by-step (got "${resultEdge}")`
  );
}

// ─── TEST 7 — adaptationService helpers ──────────────────────────────────────

function runTest7() {
  printSection('TEST 7 — adaptationService: getAdaptedDifficulty + shouldUseAnalogy');

  // getAdaptedDifficulty
  const learner01 = freshLearner({ mastery: { overall: 0.1, byTopic: {} } });
  const d01 = getAdaptedDifficulty('Recursion', learner01);
  console.log(`\n  getAdaptedDifficulty(mastery 0.1): "${d01}"`);
  assert(d01 === 'beginner', 'mastery 0.1 → beginner');

  const learner05 = freshLearner({ mastery: { overall: 0.5, byTopic: {} } });
  const d05 = getAdaptedDifficulty('Recursion', learner05);
  console.log(`  getAdaptedDifficulty(mastery 0.5): "${d05}"`);
  assert(d05 === 'intermediate', 'mastery 0.5 → intermediate');

  const learner09 = freshLearner({ mastery: { overall: 0.9, byTopic: {} } });
  const d09 = getAdaptedDifficulty('Recursion', learner09);
  console.log(`  getAdaptedDifficulty(mastery 0.9): "${d09}"`);
  assert(d09 === 'advanced', 'mastery 0.9 → advanced');

  // shouldUseAnalogy: topic in weakAreas → true
  const weakLearner = freshLearner({
    weakAreas:     ['Recursion'],
    mastery:       { overall: 0.4, byTopic: { Recursion: 0.4 } },
    preferredStyle: null,
  });
  const analogyWeak = shouldUseAnalogy('Recursion', weakLearner);
  console.log(`\n  shouldUseAnalogy(Recursion in weakAreas): ${analogyWeak}`);
  assert(analogyWeak === true, 'topic in weakAreas → shouldUseAnalogy = true');

  // shouldUseAnalogy: mastered topic, not in weakAreas → false
  const strongLearner = freshLearner({
    weakAreas:     [],
    mastery:       { overall: 0.9, byTopic: { Recursion: 0.9 } },
    preferredStyle: 'visual', // not analogy
  });
  const analogyStrong = shouldUseAnalogy('Recursion', strongLearner);
  console.log(`  shouldUseAnalogy(Recursion mastered, not weak): ${analogyStrong}`);
  assert(analogyStrong === false, 'mastered topic, not in weakAreas → shouldUseAnalogy = false');
}

// ─── TEST 8 — Personalization changes prompt ──────────────────────────────────

function runTest8() {
  printSection('TEST 8 — buildLessonPrompt: personalization changes output');

  const TOPIC = 'Recursion';

  const beginnerContext = {
    memoryType: 'longterm',
    learnerProfile: {
      goal:            'Pass GATE CS 2025',
      weakAreas:       ['Recursion'],
      knownTopics:     [],
      masteryByTopic:  { [TOPIC]: 0.1 },
      mistakePatterns: ['Struggles to identify base cases'],
    },
  };

  const advancedContext = {
    memoryType: 'longterm',
    learnerProfile: {
      goal:            'Pass GATE CS 2025',
      weakAreas:       [],
      knownTopics:     ['Recursion', 'Dynamic Programming', 'Sorting Algorithms'],
      masteryByTopic:  { [TOPIC]: 0.9 },
      mistakePatterns: [],
    },
  };

  const beginnerPrompt = buildLessonPrompt(TOPIC, beginnerContext, 'step-by-step');
  const advancedPrompt = buildLessonPrompt(TOPIC, advancedContext, 'socratic');

  // Strip whitespace for meaningful content comparison
  const beginnerNorm = beginnerPrompt.replace(/\s+/g, ' ').trim();
  const advancedNorm = advancedPrompt.replace(/\s+/g, ' ').trim();

  assert(
    beginnerPrompt !== advancedPrompt,
    'beginner prompt !== advanced prompt (prompts are different)'
  );
  assert(
    beginnerNorm !== advancedNorm,
    'difference is not just whitespace'
  );
  assert(
    beginnerPrompt.includes('beginner') && advancedPrompt.includes('advanced'),
    'mastery label differs: "beginner" vs "advanced"'
  );
  assert(
    beginnerPrompt.includes('10%') && advancedPrompt.includes('90%'),
    'mastery percentage differs: "10%" vs "90%"'
  );
  assert(
    beginnerPrompt.includes('Recursion') && beginnerPrompt.includes('struggles'),
    'beginner prompt mentions weakArea struggle'
  );
  assert(
    advancedPrompt.includes('knownTopics') ||
    advancedPrompt.includes('already understands'),
    'advanced prompt includes knownTopics context'
  );
  assert(
    beginnerPrompt.includes('step-by-step') && advancedPrompt.includes('socratic'),
    'strategy differs in prompt content'
  );
  assert(
    beginnerPrompt.includes('Struggles to identify base cases'),
    'beginner prompt includes known mistake pattern'
  );

  console.log('\n  ── Beginner prompt (first 400 chars) ──');
  console.log('  ' + beginnerPrompt.slice(0, 400).replace(/\n/g, '\n  ') + '…');
  console.log('\n  ── Advanced prompt (first 400 chars) ──');
  console.log('  ' + advancedPrompt.slice(0, 400).replace(/\n/g, '\n  ') + '…');
  console.log(`\n  Beginner prompt length: ${beginnerPrompt.length} chars`);
  console.log(`  Advanced prompt length: ${advancedPrompt.length} chars`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('\nSideNote Intelligence Layer — Learner Model Tests (Day 4)');
  console.log('No API calls. No keys required.');
  console.log(`Started: ${new Date().toISOString()}`);

  runTest1();
  runTest2();
  runTest3();
  runTest4();
  runTest5();
  runTest6();
  runTest7();
  runTest8();

  printSection(`RESULTS: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(`\n  ✗ ${failed} assertion(s) failed. Review output above.\n`);
    process.exit(1);
  } else {
    console.log(`\n  ✓ All ${passed} assertions passed.\n`);
  }
}

main();

