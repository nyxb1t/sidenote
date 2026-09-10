'use strict';

/**
 * backend/ai/validators/quizValidator.js
 *
 * Validates the structure of a quiz JSON object returned by the AI.
 *
 * Pure function — no async, no AI imports, no database imports.
 *
 * Export:
 *   validateQuiz(json) → true | throws ValidationError
 */

const { ValidationError } = require('./ValidationError.cjs');

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_DIFFICULTIES  = new Set(['beginner', 'intermediate', 'advanced']);
const VALID_QUESTION_TYPES = new Set(['mcq', 'true_false']);

// ─── Question validators ──────────────────────────────────────────────────────

/**
 * Validates a single question object using a switch on its type.
 * Throws ValidationError on the first failure found.
 *
 * @param {object} question - The question object to validate.
 * @param {number} index    - Its index in the questions array.
 */
function validateQuestion(question, index) {
  const path = `questions[${index}]`;

  // Every question must have id, type, question, and explanation.
  if (typeof question.id !== 'string' || !question.id.trim()) {
    throw new ValidationError(`${path}.id`, 'non-empty string', question.id);
  }

  if (typeof question.type !== 'string' || !VALID_QUESTION_TYPES.has(question.type)) {
    throw new ValidationError(
      `${path}.type`,
      `one of: ${[...VALID_QUESTION_TYPES].join(', ')}`,
      question.type
    );
  }

  if (typeof question.question !== 'string' || !question.question.trim()) {
    throw new ValidationError(
      `${path}.question`, 'non-empty string', question.question
    );
  }

  if (typeof question.explanation !== 'string' || !question.explanation.trim()) {
    throw new ValidationError(
      `${path}.explanation`, 'non-empty string', question.explanation
    );
  }

  // Type-specific field checks.
  switch (question.type) {
    case 'mcq':
      // options must be an array of exactly 4 non-empty strings.
      if (!Array.isArray(question.options) || question.options.length !== 4) {
        throw new ValidationError(
          `${path}.options`, 'array of exactly 4 items', question.options
        );
      }
      question.options.forEach((opt, oi) => {
        if (typeof opt !== 'string' || !opt.trim()) {
          throw new ValidationError(
            `${path}.options[${oi}]`, 'non-empty string', opt
          );
        }
      });

      // correctIndex must be an integer in [0, 3].
      if (
        typeof question.correctIndex !== 'number' ||
        !Number.isInteger(question.correctIndex) ||
        question.correctIndex < 0 ||
        question.correctIndex > 3
      ) {
        throw new ValidationError(
          `${path}.correctIndex`, 'integer between 0 and 3', question.correctIndex
        );
      }
      break;

    case 'true_false':
      // correctAnswer must be a strict boolean.
      if (typeof question.correctAnswer !== 'boolean') {
        throw new ValidationError(
          `${path}.correctAnswer`, 'boolean', question.correctAnswer
        );
      }
      break;

    // No default needed — unknown types are caught before the switch.
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Validates the structure of a quiz JSON object.
 *
 * Checks performed (in order):
 *   - topic       → exists, non-empty string
 *   - difficulty  → exists, one of: beginner, intermediate, advanced
 *   - questions   → exists, non-empty array
 *   - each question → id, type, question, explanation present;
 *                     type-specific fields (options/correctIndex or correctAnswer)
 *
 * @param {object} json - The parsed AI response to validate.
 * @returns {true}      If the object passes all checks.
 * @throws {ValidationError} On the first structural failure found.
 */
function validateQuiz(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new ValidationError('(root)', 'non-null object', json);
  }

  // topic
  if (typeof json.topic !== 'string' || !json.topic.trim()) {
    throw new ValidationError('topic', 'non-empty string', json.topic);
  }

  // difficulty
  if (!VALID_DIFFICULTIES.has(json.difficulty)) {
    throw new ValidationError(
      'difficulty',
      `one of: ${[...VALID_DIFFICULTIES].join(', ')}`,
      json.difficulty
    );
  }

  // questions
  if (!Array.isArray(json.questions) || json.questions.length === 0) {
    throw new ValidationError('questions', 'non-empty array', json.questions);
  }

  // Per-question validation
  json.questions.forEach((question, index) => {
    validateQuestion(question, index);
  });

  return true;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { validateQuiz };

