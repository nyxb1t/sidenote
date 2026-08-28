'use strict';

/**
 * backend/ai/quizService.js
 *
 * Generation service for personalised quizzes.
 *
 * Public API:
 *   generateQuiz(lessonContent, learnerModel) → QuizJSON
 *
 * Internal flow:
 *   1. buildQuizPrompt(lessonContent, learnerModel) — builds the prompt
 *   2. callAI(prompt)                              — Day 2: AI provider call
 *   3. Return parsed QuizJSON
 *
 * Day 1 status: Step 1 is fully implemented.
 *               Step 2 (callAI) is stubbed — it will be wired in Day 2.
 */

const { buildQuizPrompt } = require('./prompts/quizPrompt');

const { callAI } = require('./aiClient');

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a quiz based on a lesson that was just taught.
 *
 * @param {object} lessonContent  - The full LessonJSON object from generateLesson().
 * @param {object} learnerModel   - The current LearnerModel.
 * @returns {Promise<object>}     The QuizJSON object.
 * @throws {Error}                If inputs are invalid, or (Day 1) always throws
 *                                a NotImplementedError.
 */
async function generateQuiz(lessonContent, learnerModel) {
  if (!lessonContent || typeof lessonContent !== 'object') {
    throw new Error('generateQuiz: "lessonContent" must be a non-null object.');
  }
  if (!learnerModel || typeof learnerModel !== 'object') {
    throw new Error('generateQuiz: "learnerModel" must be a non-null object.');
  }

  // Step 1: Build the prompt
  const prompt = buildQuizPrompt(lessonContent, learnerModel);

  // Step 2: Send prompt to AI provider and parse the response.
  const quizJSON = await callAI(prompt);
  return quizJSON;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { generateQuiz };

