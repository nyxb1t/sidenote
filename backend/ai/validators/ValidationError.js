'use strict';

/**
 * backend/ai/validators/ValidationError.js
 *
 * Custom error class for AI output validation failures.
 *
 * Properties:
 *   name          {string} — Always 'ValidationError'.
 *   field         {string} — Dot-notation path to the failing field,
 *                            e.g. 'sections[2].bullets'.
 *   expected      {string} — Human-readable description of what was expected,
 *                            e.g. 'non-empty array'.
 *   received      {*}      — The actual value that was received.
 *   message       {string} — Combines all three into a readable sentence.
 */

class ValidationError extends Error {
  /**
   * @param {string} field    - Dot-notation path to the field that failed.
   * @param {string} expected - Description of the expected value or type.
   * @param {*}      received - The actual value that was found.
   */
  constructor(field, expected, received) {
    const receivedLabel =
      received === undefined ? 'undefined' :
      received === null      ? 'null'      :
      Array.isArray(received) ? `array(${received.length})` :
      typeof received === 'object' ? `object(${Object.keys(received).join(', ')})` :
      JSON.stringify(received);

    super(
      `ValidationError: "${field}" — expected ${expected}, received ${receivedLabel}.`
    );

    this.name     = 'ValidationError';
    this.field    = field;
    this.expected = expected;
    this.received = received;
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { ValidationError };

