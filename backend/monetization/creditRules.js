'use strict';

/**
 * backend/monetization/creditRules.js
 *
 * Defines the credit cost for each Intelligence Layer action.
 *
 * Responsibilities:
 *   - Declare the canonical cost of every billable action.
 *   - Export getCreditCost() for runtime lookups.
 *   - Export CREDIT_COSTS table for direct reference (e.g. Person 3's route layer).
 *
 * Explicitly NOT responsible for:
 *   - Enforcing credit limits.
 *   - Deducting credits from a user balance.
 *   - Reading from or writing to any database.
 *   - Interacting with RevenueCat or any subscription service.
 */

// ─── Credit cost table ────────────────────────────────────────────────────────

/**
 * @type {Record<string, number>}
 *
 * Each key is the exact action string passed to getCreditCost().
 * Values are non-negative integers representing credits consumed per call.
 * 0-credit actions are listed explicitly so the table is a complete record.
 */
const CREDIT_COSTS = {
  generateLesson:            1,
  generateQuiz:              0,
  generateNotes:             0,
  generateRetryExplanation:  1,
  generateVisualExplanation: 1,
};

// ─── Plan limits table ────────────────────────────────────────────────────────

/**
 * @type {Record<string, object>}
 *
 * Per-plan capability limits consumed by generation services and prompt builders.
 * memoryType controls how much learner history is injected into prompts.
 */
const PLAN_LIMITS = {
  free: {
    lessonsPerMonth:  3,
    creditsPerMonth:  10,
    quizzesPerMonth:  3,
    maxQuizQuestions: 5,
    memoryType:       'session',
  },
  basic: {
    lessonsPerMonth:  10,
    creditsPerMonth:  50,
    quizzesPerMonth:  'credit-based',
    maxQuizQuestions: 10,
    memoryType:       'recent',
  },
  pro: {
    lessonsPerMonth:  25,
    creditsPerMonth:  120,
    quizzesPerMonth:  'credit-based',
    maxQuizQuestions: 20,
    memoryType:       'longterm',
  },
  advanced: {
    lessonsPerMonth:  60,
    creditsPerMonth:  300,
    quizzesPerMonth:  'credit-based',
    maxQuizQuestions: 30,
    memoryType:       'full',
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the credit cost for a given Intelligence Layer action.
 *
 * @param {string} action - The action identifier (must match a key in CREDIT_COSTS).
 * @returns {number} The integer credit cost for the action.
 * @throws {Error} If the action is not recognised.
 *
 * @example
 * getCreditCost('generateLesson');           // → 1
 * getCreditCost('generateQuiz');             // → 0
 * getCreditCost('generateVisualExplanation'); // → 1
 */
function getCreditCost(action) {
  if (!Object.prototype.hasOwnProperty.call(CREDIT_COSTS, action)) {
    throw new Error(
      `getCreditCost: unrecognised action "${action}". ` +
      `Known actions: ${Object.keys(CREDIT_COSTS).join(', ')}.`
    );
  }
  return CREDIT_COSTS[action];
}

/**
 * Returns the capability limits for a given subscription plan.
 *
 * @param {string} plan - The plan identifier (must match a key in PLAN_LIMITS).
 * @returns {object} The limits object for the plan.
 * @throws {Error} If the plan is not recognised.
 *
 * @example
 * getPlanLimits('free').maxQuizQuestions;  // → 5
 * getPlanLimits('pro').memoryType;          // → 'longterm'
 */
function getPlanLimits(plan) {
  if (!Object.prototype.hasOwnProperty.call(PLAN_LIMITS, plan)) {
    throw new Error(
      `getPlanLimits: unknown plan "${plan}". ` +
      `Known plans: ${Object.keys(PLAN_LIMITS).join(', ')}.`
    );
  }
  return PLAN_LIMITS[plan];
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getCreditCost,
  getPlanLimits,
  CREDIT_COSTS,
  PLAN_LIMITS,
};

