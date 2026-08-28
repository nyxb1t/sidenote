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

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getCreditCost,
  CREDIT_COSTS,
};

