'use strict';

/**
 * backend/ai/notesService.js
 *
 * Generation service for structured study notes.
 *
 * Public API:
 *   generateNotes(lessonContent) → NotesJSON
 *
 * Internal flow:
 *   1. buildNotesPrompt(lessonContent) — builds the prompt
 *   2. callAI(prompt)                 — Day 2: AI provider call
 *   3. Return parsed NotesJSON
 *
 * Day 1 status: Step 1 is fully implemented.
 *               Step 2 (callAI) is stubbed — it will be wired in Day 2.
 */

const { buildNotesPrompt } = require('./prompts/notesPrompt');

const { callAI } = require('./aiClient');

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates structured study notes condensed from a completed lesson.
 *
 * Notes are derived from the lesson content that was actually taught,
 * not regenerated from the topic string alone.
 *
 * @param {object} lessonContent  - The full LessonJSON object from generateLesson().
 * @returns {Promise<object>}     The NotesJSON object.
 * @throws {Error}                If input is invalid, or (Day 1) always throws
 *                                a NotImplementedError.
 */
async function generateNotes(lessonContent) {
  if (!lessonContent || typeof lessonContent !== 'object') {
    throw new Error('generateNotes: "lessonContent" must be a non-null object.');
  }

  // Step 1: Build the prompt
  const prompt = buildNotesPrompt(lessonContent);

  // Step 2: Send prompt to AI provider and parse the response.
  const notesJSON = await callAI(prompt);
  return notesJSON;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { generateNotes };

