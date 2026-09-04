'use strict';

/**
 * backend/ai/lessonService.js
 *
 * Generation service for personalised lessons.
 *
 * Public API:
 *   generateLesson(topic, learnerContext, userContext) → LessonJSON
 *
 * Internal flow:
 *   0.  checkEntitlement('generateLesson', userContext)        — blocks if user has no credits
 *   0.5 extractLearnerModelForStrategy(learnerContext)         — converts to selectTeachingStrategy shape
 *   1.  selectTeachingStrategy(topic, modelForStrategy)        — picks the right strategy
 *   2.  buildLessonPrompt(topic, learnerContext, strategy)     — builds the prompt string
 *   3.  callAI(prompt)                                         — sends to AI, returns parsed JSON
 *   4.  validateLesson(lessonJSON)                             — validates AI output structure
 *   5.  Return LessonJSON
 */

const { selectTeachingStrategy } = require('../learner/learnerService.cjs');
const { buildLessonPrompt }      = require('./prompts/lessonPrompt.cjs');
const { callAI }                 = require('./aiClient.cjs');
const { validateLesson }         = require('./validators/lessonValidator.cjs');
const { checkEntitlement }       = require('../monetization/entitlementGuard.cjs');

// ─── Private helper ───────────────────────────────────────────────────────────

/**
 * Converts a learnerContext object into a shape compatible with
 * selectTeachingStrategy(), which expects a full learner-model-like object
 * with mastery, weakAreas, preferredStyle, lastStrategy, knownTopics, etc.
 *
 * @param {object} learnerContext - Memory-tier-aware learner context.
 * @returns {object} A learner-model-compatible object for strategy selection.
 */
function extractLearnerModelForStrategy(learnerContext) {
  const memoryType = learnerContext.memoryType ?? 'session';

  // longterm and full → learnerProfile contains all needed fields directly.
  if (memoryType === 'longterm' || memoryType === 'full') {
    return learnerContext.learnerProfile ?? {};
  }

  // recent → use what's available from recentLearning, fill gaps with safe defaults.
  if (memoryType === 'recent') {
    const recentLearning = learnerContext.recentLearning ?? {};
    return {
      mastery:        { overall: 0.3, byTopic: {} },
      weakAreas:      recentLearning.recentWeaknesses ?? [],
      preferredStyle: null,
      lastStrategy:   null,
      knownTopics:    recentLearning.recentTopics ?? [],
      mistakePatterns: [],
      goal:           null,
    };
  }

  // session (or unknown) → fully defaulted safe object.
  return {
    mastery:        { overall: 0.2, byTopic: {} },
    weakAreas:      [],
    preferredStyle: null,
    lastStrategy:   null,
    knownTopics:    [],
    mistakePatterns: [],
    goal:           null,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a personalised lesson for the given topic and learner.
 *
 * @param {string} topic           - The topic to teach.
 * @param {object} learnerContext  - Memory-tier-aware learner context.
 * @param {object} userContext     - Entitlement context: { userId, plan, creditsRemaining }.
 * @returns {Promise<object>}      The LessonJSON object.
 * @throws {InsufficientCreditsError} If the user does not have enough credits.
 * @throws {ValidationError}          If the AI response does not match the lesson schema.
 */
async function generateLesson(topic, learnerContext, userContext) {
  if (!topic || typeof topic !== 'string') {
    throw new Error('generateLesson: "topic" must be a non-empty string.');
  }
  if (!learnerContext || typeof learnerContext !== 'object') {
    throw new Error('generateLesson: "learnerContext" must be a non-null object.');
  }
  if (!userContext || typeof userContext !== 'object') {
    throw new Error('generateLesson: "userContext" must be a non-null object.');
  }

  // Step 0: Entitlement check — must run before any AI work.
  // Throws InsufficientCreditsError if the user is blocked.
  // Does NOT deduct credits; Person 3's route handler does that on success.
  checkEntitlement('generateLesson', userContext);

  // Step 0.5: Extract a learner-model-compatible object for strategy selection.
  // selectTeachingStrategy() requires mastery, weakAreas, preferredStyle, etc.
  // The raw learnerContext shape varies by memory tier, so we normalize here.
  const modelForStrategy = extractLearnerModelForStrategy(learnerContext);

  // Step 1: Select the teaching strategy using the normalized model.
  const strategy = selectTeachingStrategy(topic, modelForStrategy);

  // Step 2: Build the prompt — pass the original learnerContext (not the normalized model)
  // so buildLessonPrompt can apply its own memoryType-appropriate context injection.
  const prompt = buildLessonPrompt(topic, learnerContext, strategy);

  // Step 3: Send prompt to AI provider and parse the response.
  const lessonJSON = await callAI(prompt);

  // Step 4: Validate the AI output matches the lesson schema.
  validateLesson(lessonJSON);

  return lessonJSON;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { generateLesson };
