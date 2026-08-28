'use strict';

/**
 * backend/ai/lessonService.js
 *
 * Generation service for personalised lessons.
 *
 * Public API:
 *   generateLesson(topic, learnerModel) → LessonJSON
 *
 * Internal flow:
 *   1. selectTeachingStrategy(topic, learnerModel)  — picks the right strategy
 *   2. buildLessonPrompt(topic, learnerModel, strategy) — builds the prompt
 *   3. callAI(prompt)                               — Day 2: AI provider call
 *   4. Return parsed LessonJSON
 *
 * Day 1 status: Steps 1 and 2 are fully implemented.
 *               Step 3 (callAI) is stubbed — it will be wired in Day 2
 *               when gemini.js, groq.js, and aiClient.js are created.
 */

const { selectTeachingStrategy } = require('../learner/learnerService');
const { buildLessonPrompt }      = require('./prompts/lessonPrompt');

const { callAI } = require('./aiClient');
const { validateLesson }         = require('./validators/lessonValidator');

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a personalised lesson for the given topic and learner.
 *
 * @param {string} topic         - The topic to teach.
 * @param {object} learnerModel  - The current LearnerModel.
 * @returns {Promise<object>}    The LessonJSON object.
 * @throws {Error}               If inputs are invalid, or (Day 1) always throws
 *                               a NotImplementedError because the AI provider
 *                               is not yet connected.
 */
async function generateLesson(topic, learnerModel) {
  if (!topic || typeof topic !== 'string') {
    throw new Error('generateLesson: "topic" must be a non-empty string.');
  }
  if (!learnerModel || typeof learnerModel !== 'object') {
    throw new Error('generateLesson: "learnerModel" must be a non-null object.');
  }

  // Step 1: Select the teaching strategy for this topic and learner
  const strategy = selectTeachingStrategy(topic, learnerModel);

  // Step 2: Build the prompt
  const prompt = buildLessonPrompt(topic, learnerModel, strategy);

  // Step 3: Send prompt to AI provider and parse the response.
  const lessonJSON = await callAI(prompt);

  // Step 4: Validate the AI output matches the lesson schema.
  validateLesson(lessonJSON);

  return lessonJSON;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { generateLesson };

