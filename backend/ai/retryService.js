'use strict';

/**
 * backend/ai/retryService.js
 *
 * Generation service for retry explanations.
 * Re-explains a topic using a different teaching strategy than the one that failed.
 *
 * Public API:
 *   generateRetryExplanation(topic, learnerModel, previousStrategy, userContext) → LessonJSON
 *
 * Internal flow:
 *   0. checkEntitlement('generateRetryExplanation', userContext) — blocks if user has no credits
 *   1. selectTeachingStrategy(topic, learnerModel)               — picks a NEW strategy
 *   2. buildRetryPrompt(topic, learnerModel, strategy, previousStrategy) — builds the prompt
 *   3. callAI(prompt)                                            — sends to AI, returns parsed JSON
 *   4. validateLesson(lessonJSON)                                — validates AI output structure
 *   5. Return LessonJSON (same schema as generateLesson)
 *
 * Strategy guarantee:
 *   selectTeachingStrategy() guarantees the returned strategy differs from
 *   learnerModel.lastStrategy. The caller should ensure learnerModel.lastStrategy
 *   reflects previousStrategy before calling this function, so the rotation logic
 *   correctly avoids it.
 */

const { selectTeachingStrategy } = require('../learner/learnerService');
const { buildRetryPrompt }       = require('./prompts/retryPrompt');
const { callAI }                 = require('./aiClient');
const { validateLesson }         = require('./validators/lessonValidator');
const { checkEntitlement }       = require('../monetization/entitlementGuard');

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Re-explains a topic using a strategy different from the one previously used.
 *
 * @param {string} topic              - The topic to re-explain.
 * @param {object} learnerModel       - The current LearnerModel.
 *                                      learnerModel.lastStrategy should equal previousStrategy
 *                                      so selectTeachingStrategy can rotate away from it.
 * @param {string} previousStrategy   - The teaching strategy used in the failed attempt.
 * @param {object} userContext        - Entitlement context: { userId, plan, creditsRemaining }.
 * @returns {Promise<object>}         The LessonJSON object with the new explanation.
 * @throws {InsufficientCreditsError} If the user does not have enough credits.
 * @throws {ValidationError}          If the AI response does not match the lesson schema.
 */
async function generateRetryExplanation(topic, learnerModel, previousStrategy, userContext) {
  if (!topic || typeof topic !== 'string') {
    throw new Error('generateRetryExplanation: "topic" must be a non-empty string.');
  }
  if (!learnerModel || typeof learnerModel !== 'object') {
    throw new Error('generateRetryExplanation: "learnerModel" must be a non-null object.');
  }
  if (!previousStrategy || typeof previousStrategy !== 'string') {
    throw new Error('generateRetryExplanation: "previousStrategy" must be a non-empty string.');
  }
  if (!userContext || typeof userContext !== 'object') {
    throw new Error('generateRetryExplanation: "userContext" must be a non-null object.');
  }

  // Step 0: Entitlement check — must run before any AI work.
  // Throws InsufficientCreditsError if the user is blocked.
  // Does NOT deduct credits; Person 3's route handler does that on success.
  checkEntitlement('generateRetryExplanation', userContext);

  // Step 1: Select a new strategy (guaranteed to differ from lastStrategy).
  const strategy = selectTeachingStrategy(topic, learnerModel);

  // Step 2: Build the retry prompt with both the new and previous strategy.
  const prompt = buildRetryPrompt(topic, learnerModel, strategy, previousStrategy);

  // Step 3: Send prompt to AI provider and parse the response.
  const lessonJSON = await callAI(prompt);

  // Step 4: Validate the AI output matches the lesson schema.
  validateLesson(lessonJSON);

  return lessonJSON;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { generateRetryExplanation };
