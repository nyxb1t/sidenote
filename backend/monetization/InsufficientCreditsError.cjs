'use strict';

/**
 * backend/monetization/InsufficientCreditsError.js
 *
 * Custom error thrown when a user's credit balance is too low to perform
 * a given Intelligence Layer action.
 *
 * Properties:
 *   name             {string} — Always 'InsufficientCreditsError'.
 *   userId           {string} — The user who was blocked.
 *   action           {string} — The action that was attempted.
 *   creditsRemaining {number} — The balance at the time of the check.
 *   message          {string} — Human-readable explanation.
 *
 * Note: This error is thrown by entitlementGuard.js before any AI call is made.
 *       No credits are deducted at any point during the check.
 *       Person 3's route handler is responsible for deducting credits on success.
 */

class InsufficientCreditsError extends Error {
  /**
   * @param {string} userId           - The user who was blocked.
   * @param {string} action           - The action that required credits.
   * @param {number} creditsRemaining - The user's current balance.
   */
  constructor(userId, action, creditsRemaining) {
    super(
      `InsufficientCreditsError: user "${userId}" cannot perform "${action}" — ` +
      `requires at least 1 credit but has ${creditsRemaining}.`
    );
    this.name             = 'InsufficientCreditsError';
    this.userId           = userId;
    this.action           = action;
    this.creditsRemaining = creditsRemaining;
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { InsufficientCreditsError };

