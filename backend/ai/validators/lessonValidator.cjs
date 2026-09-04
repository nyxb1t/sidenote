'use strict';

/**
 * backend/ai/validators/lessonValidator.js
 *
 * Validates the structure of a lesson JSON object returned by the AI.
 *
 * Pure function — no async, no AI imports, no database imports.
 *
 * Export:
 *   validateLesson(json) → true | throws ValidationError
 */

const { ValidationError } = require('./ValidationError.cjs');

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_STRATEGIES = new Set(['visual', 'analogy', 'step-by-step', 'socratic']);

const VALID_SECTION_TYPES = new Set([
  'intro', 'explanation', 'example', 'code', 'insight', 'think', 'summary',
]);

// ─── Section field validators ─────────────────────────────────────────────────

/**
 * Validates a single section object, applying type-specific field rules
 * via a switch block. Throws ValidationError on the first failure found.
 *
 * @param {object} section - The section object to validate.
 * @param {number} index   - Its index in the sections array (for error paths).
 */
function validateSection(section, index) {
  const path = `sections[${index}]`;

  // Every section must have a type field.
  if (typeof section.type !== 'string' || !section.type) {
    throw new ValidationError(`${path}.type`, 'non-empty string', section.type);
  }

  // Type must be one of the known values.
  if (!VALID_SECTION_TYPES.has(section.type)) {
    throw new ValidationError(
      `${path}.type`,
      `one of: ${[...VALID_SECTION_TYPES].join(', ')}`,
      section.type
    );
  }

  // Type-specific required field checks.
  switch (section.type) {
    case 'intro':
    case 'explanation':
    case 'insight':
      if (typeof section.content !== 'string' || !section.content.trim()) {
        throw new ValidationError(
          `${path}.content`, 'non-empty string', section.content
        );
      }
      break;

    case 'example':
      if (typeof section.label !== 'string' || !section.label.trim()) {
        throw new ValidationError(
          `${path}.label`, 'non-empty string', section.label
        );
      }
      if (typeof section.content !== 'string' || !section.content.trim()) {
        throw new ValidationError(
          `${path}.content`, 'non-empty string', section.content
        );
      }
      break;

    case 'code':
      if (typeof section.language !== 'string' || !section.language.trim()) {
        throw new ValidationError(
          `${path}.language`, 'non-empty string', section.language
        );
      }
      if (typeof section.content !== 'string' || !section.content.trim()) {
        throw new ValidationError(
          `${path}.content`, 'non-empty string', section.content
        );
      }
      break;

    case 'think':
      if (typeof section.question !== 'string' || !section.question.trim()) {
        throw new ValidationError(
          `${path}.question`, 'non-empty string', section.question
        );
      }
      if (typeof section.hint !== 'string' || !section.hint.trim()) {
        throw new ValidationError(
          `${path}.hint`, 'non-empty string', section.hint
        );
      }
      break;

    case 'summary':
      if (!Array.isArray(section.bullets) || section.bullets.length === 0) {
        throw new ValidationError(
          `${path}.bullets`, 'non-empty array', section.bullets
        );
      }
      section.bullets.forEach((bullet, bi) => {
        if (typeof bullet !== 'string' || !bullet.trim()) {
          throw new ValidationError(
            `${path}.bullets[${bi}]`, 'non-empty string', bullet
          );
        }
      });
      break;

    // No default needed — unknown types are caught above before the switch.
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Validates the structure of a lesson JSON object.
 *
 * Checks performed (in order):
 *   - version         → exists, is a number
 *   - title           → exists, non-empty string
 *   - topic           → exists, non-empty string
 *   - teachingStrategy → exists, one of the four valid values
 *   - sections        → exists, non-empty array
 *   - each section    → has valid type + all required type-specific fields
 *
 * @param {object} json - The parsed AI response to validate.
 * @returns {true}      If the object passes all checks.
 * @throws {ValidationError} On the first structural failure found.
 */
function validateLesson(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new ValidationError('(root)', 'non-null object', json);
  }

  // version
  if (typeof json.version !== 'number') {
    throw new ValidationError('version', 'number', json.version);
  }

  // title
  if (typeof json.title !== 'string' || !json.title.trim()) {
    throw new ValidationError('title', 'non-empty string', json.title);
  }

  // topic
  if (typeof json.topic !== 'string' || !json.topic.trim()) {
    throw new ValidationError('topic', 'non-empty string', json.topic);
  }

  // teachingStrategy
  if (!VALID_STRATEGIES.has(json.teachingStrategy)) {
    throw new ValidationError(
      'teachingStrategy',
      `one of: ${[...VALID_STRATEGIES].join(', ')}`,
      json.teachingStrategy
    );
  }

  // sections
  if (!Array.isArray(json.sections) || json.sections.length === 0) {
    throw new ValidationError('sections', 'non-empty array', json.sections);
  }

  // Per-section validation
  json.sections.forEach((section, index) => {
    validateSection(section, index);
  });

  return true;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { validateLesson };

