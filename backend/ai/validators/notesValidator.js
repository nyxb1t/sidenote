'use strict';

/**
 * backend/ai/validators/notesValidator.js
 *
 * Validates the structure of a notes JSON object returned by the AI.
 *
 * Pure function — no async, no AI imports, no database imports.
 *
 * Export:
 *   validateNotes(json) → true | throws ValidationError
 */

const { ValidationError } = require('./ValidationError');

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_TAGS = new Set(['Concept', 'Insight', 'Visual', 'Reference']);

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Validates the structure of a notes JSON object.
 *
 * Checks performed (in order):
 *   - topic        → exists, non-empty string
 *   - tag          → exists, one of: Concept, Insight, Visual, Reference
 *   - summary      → exists, non-empty string
 *   - bulletPoints → exists, non-empty array of non-empty strings
 *   - keyTerms     → exists, is an array; each entry has term and definition
 *
 * @param {object} json - The parsed AI response to validate.
 * @returns {true}      If the object passes all checks.
 * @throws {ValidationError} On the first structural failure found.
 */
function validateNotes(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new ValidationError('(root)', 'non-null object', json);
  }

  // topic
  if (typeof json.topic !== 'string' || !json.topic.trim()) {
    throw new ValidationError('topic', 'non-empty string', json.topic);
  }

  // tag
  if (!VALID_TAGS.has(json.tag)) {
    throw new ValidationError(
      'tag',
      `one of: ${[...VALID_TAGS].join(', ')}`,
      json.tag
    );
  }

  // summary
  if (typeof json.summary !== 'string' || !json.summary.trim()) {
    throw new ValidationError('summary', 'non-empty string', json.summary);
  }

  // bulletPoints
  if (!Array.isArray(json.bulletPoints) || json.bulletPoints.length === 0) {
    throw new ValidationError('bulletPoints', 'non-empty array', json.bulletPoints);
  }
  json.bulletPoints.forEach((bullet, index) => {
    if (typeof bullet !== 'string' || !bullet.trim()) {
      throw new ValidationError(
        `bulletPoints[${index}]`, 'non-empty string', bullet
      );
    }
  });

  // keyTerms
  if (!Array.isArray(json.keyTerms)) {
    throw new ValidationError('keyTerms', 'array', json.keyTerms);
  }
  json.keyTerms.forEach((entry, index) => {
    const path = `keyTerms[${index}]`;

    if (!entry || typeof entry !== 'object') {
      throw new ValidationError(path, 'non-null object', entry);
    }
    if (typeof entry.term !== 'string' || !entry.term.trim()) {
      throw new ValidationError(`${path}.term`, 'non-empty string', entry.term);
    }
    if (typeof entry.definition !== 'string' || !entry.definition.trim()) {
      throw new ValidationError(
        `${path}.definition`, 'non-empty string', entry.definition
      );
    }
  });

  return true;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { validateNotes };

