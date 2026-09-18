'use strict';

/**
 * backend/ai/notesService.js
 *
 * Generation service for structured study notes.
 *
 * Public API:
 *   generateNotes(lessonContent, userContext) → NotesJSON
 *
 * Internal flow:
 *   0. checkEntitlement('generateNotes', userContext) — always passes (0-credit action)
 *   1. buildNotesPrompt(lessonContent)               — builds the prompt string
 *   2. callAI(prompt)                                — sends to AI, returns parsed JSON
 *   3. validateNotes(notesJSON)                      — validates AI output structure
 *   4. Return NotesJSON
 *
 * Notes are derived from the lesson content that was actually taught,
 * not regenerated from the topic string alone. This ensures the notes
 * reflect exactly what the AI explained, including the chosen strategy.
 */

const { buildNotesPrompt }  = require('./prompts/notesPrompt');
const { callAI }            = require('./aiClient');
const { validateNotes }     = require('./validators/notesValidator');
const { checkEntitlement }  = require('../monetization/entitlementGuard');

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates structured study notes condensed from a completed lesson.
 *
 * @param {object} lessonContent  - The full LessonJSON object from generateLesson().
 * @param {object} userContext    - Entitlement context: { userId, plan, creditsRemaining }.
 * @returns {Promise<object>}     The NotesJSON object.
 * @throws {ValidationError}      If the AI response does not match the notes schema.
 */
async function generateNotes(lessonContent, userContext) {
  if (!lessonContent || typeof lessonContent !== 'object') {
    throw new Error('generateNotes: "lessonContent" must be a non-null object.');
  }
  if (!userContext || typeof userContext !== 'object') {
    throw new Error('generateNotes: "userContext" must be a non-null object.');
  }

  // Step 0: Entitlement check — generateNotes costs 0 credits and always passes.
  // Called for uniform contract enforcement across all generation services.
  // Does NOT deduct credits; Person 3's route handler does that on success.
  checkEntitlement('generateNotes', userContext);

  // Step 1: Build the prompt.
  const prompt = buildNotesPrompt(lessonContent);

  // Step 2: Send prompt to AI provider and parse the response.
  const notesJSON = await callAI(prompt);

  // Step 3: Validate the AI output matches the notes schema.
  validateNotes(notesJSON);

  return notesJSON;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { generateNotes };
