'use strict';

/**
 * backend/monetization/entitlementGuard.js
 *
 * Pure synchronous function that decides whether a user is allowed to
 * perform a given Intelligence Layer action based on their subscription
 * plan and remaining credit balance.
 *
 * Export:
 *   checkEntitlement(action, userContext) → true | throws InsufficientCreditsError
 *
 * Rules (applied in priority order):
 *   1. 'mastery' plan → always allowed, regardless of creditsRemaining.
 *   2. Zero-cost action → always allowed, regardless of plan or credits.
 *   3. creditsRemaining >= cost → allowed.
 *   4. creditsRemaining < cost  → throws InsufficientCreditsError.
 *
 * Explicit non-responsibilities:
 *   - Does NOT deduct credits. Person 3's route handler does that on success.
 *   - Does NOT call RevenueCat, Supabase, or any external service.
 *   - Does NOT perform any async work.
 *   - Does NOT validate that the plan value is a known enum; unknown plans
 *     are treated as non-unlimited (i.e. credits are checked normally).
 */

const { getCreditCost }             = require('./creditRules.cjs');
const { InsufficientCreditsError }  = require('./InsufficientCreditsError.cjs');

// ─── Constants ────────────────────────────────────────────────────────────────

/** Plans that are never blocked, regardless of credit balance. */
const UNLIMITED_PLANS = new Set(['mastery']);

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Checks whether the given user is entitled to perform the given action.
 *
 * @param {string} action       - The action identifier (must match a key in CREDIT_COSTS).
 * @param {object} userContext  - { userId: string, plan: string, creditsRemaining: number }
 * @returns {true}              If the user is allowed to proceed.
 * @throws {InsufficientCreditsError} If the user does not have enough credits.
 * @throws {Error}              If action or userContext are invalid inputs.
 */
function checkEntitlement(action, userContext) {
  if (!action || typeof action !== 'string') {
    throw new Error('checkEntitlement: "action" must be a non-empty string.');
  }
  if (!userContext || typeof userContext !== 'object') {
    throw new Error('checkEntitlement: "userContext" must be a non-null object.');
  }

  const { userId, plan, creditsRemaining } = userContext;

  // Rule 1: Unlimited plans are never blocked.
  if (UNLIMITED_PLANS.has(plan)) {
    return true;
  }

  // Resolve the credit cost for this action.
  // getCreditCost() throws if the action is unrecognised.
  const cost = getCreditCost(action);

  // Rule 2: Zero-cost actions always pass — even with 0 credits remaining.
  if (cost === 0) {
    return true;
  }

  // Rule 3 & 4: Compare balance against cost.
  if (creditsRemaining >= cost) {
    return true;
  }

  throw new InsufficientCreditsError(userId, action, creditsRemaining);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { checkEntitlement };

