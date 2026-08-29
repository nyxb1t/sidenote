'use strict';

/**
 * backend/ai/quizService.js
 *
 * Generation service for personalised quizzes.
 *
 * Public API:
 *   generateQuiz(lessonContent, learnerContext, userContext) → QuizJSON
 *
 * Internal flow:
 *   0.  checkEntitlement('generateQuiz', userContext)          — always passes (0-credit action)
 *   0.5 getPlanLimits(userContext.plan)                        — resolves maxQuizQuestions
 *   0.6 normalizeForQuiz(learnerContext)                       — converts to buildQuizPrompt shape
 *   1.  buildQuizPrompt(lessonContent, quizLearnerModel, maxQ) — builds the prompt string
 *   2.  callAI(prompt)                                         — sends to AI, returns parsed JSON
 *   3.  validateQuiz(quizJSON)                                 — validates AI output structure
 *   4.  Return QuizJSON
 */

const { buildQuizPrompt }   = require('./prompts/quizPrompt');
const { callAI }            = require('./aiClient');
const { validateQuiz }      = require('./validators/quizValidator');
const { checkEntitlement }  = require('../monetization/entitlementGuard');
const { getPlanLimits }     = require('../monetization/creditRules');

// ─── Private helper ───────────────────────────────────────────────────────────

/**
 * Normalizes a learnerContext object into a shape compatible with buildQuizPrompt(),
 * which expects mastery.overall, mastery.byTopic, and weakAreas.
 *
 * @param {object} learnerContext - Memory-tier-aware learner context.
 * @returns {{ mastery: { overall: number, byTopic: object }, weakAreas: string[] }}
 */
function _normalizeForQuiz(learnerContext) {
  const memoryType = learnerContext.memoryType ?? 'session';

  if (memoryType === 'longterm' || memoryType === 'full') {
    // Use learnerProfile as the base quiz personalization input.
    const profile    = learnerContext.learnerProfile ?? {};
    const byTopic    = profile.masteryByTopic ?? {};
    const topicVals  = Object.values(byTopic);
    const overall    = topicVals.length > 0
      ? topicVals.reduce((s, v) => s + v, 0) / topicVals.length
      : 0.5;
    return {
      mastery:   { overall, byTopic },
      weakAreas: profile.weakAreas ?? [],
    };
  }

  if (memoryType === 'recent') {
    // Use recentLearning data; default mastery represents an emerging learner.
    const recentLearning = learnerContext.recentLearning ?? {};
    return {
      mastery:   { overall: 0.3, byTopic: {} },
      weakAreas: recentLearning.recentWeaknesses ?? [],
    };
  }

  // session (or unknown): beginner defaults, no personalization data.
  return {
    mastery:   { overall: 0.2, byTopic: {} },
    weakAreas: [],
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a quiz based on a lesson that was just taught.
 *
 * @param {object} lessonContent   - The full LessonJSON object from generateLesson().
 * @param {object} learnerContext  - Memory-tier-aware learner context.
 * @param {object} userContext     - Entitlement context: { userId, plan, creditsRemaining }.
 * @returns {Promise<object>}      The QuizJSON object.
 * @throws {ValidationError}       If the AI response does not match the quiz schema.
 */
async function generateQuiz(lessonContent, learnerContext, userContext) {
  if (!lessonContent || typeof lessonContent !== 'object') {
    throw new Error('generateQuiz: "lessonContent" must be a non-null object.');
  }
  if (!learnerContext || typeof learnerContext !== 'object') {
    throw new Error('generateQuiz: "learnerContext" must be a non-null object.');
  }
  if (!userContext || typeof userContext !== 'object') {
    throw new Error('generateQuiz: "userContext" must be a non-null object.');
  }

  // Step 0: Entitlement check — generateQuiz costs 0 credits and always passes.
  // Called for uniform contract enforcement across all generation services.
  // Does NOT deduct credits; Person 3's route handler does that on success.
  checkEntitlement('generateQuiz', userContext);

  // Step 0.5: Resolve plan-based quiz limits.
  const planLimits    = getPlanLimits(userContext.plan);
  const maxQuestions  = planLimits.maxQuizQuestions;

  // Step 0.6: Normalize learnerContext into the shape buildQuizPrompt expects.
  const quizLearnerModel = _normalizeForQuiz(learnerContext);

  // Step 1: Build the prompt with plan-controlled question count.
  const prompt = buildQuizPrompt(lessonContent, quizLearnerModel, maxQuestions);

  // Step 2: Send prompt to AI provider and parse the response.
  const quizJSON = await callAI(prompt);

  // Step 3: Validate the AI output matches the quiz schema.
  validateQuiz(quizJSON);

  return quizJSON;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { generateQuiz };
