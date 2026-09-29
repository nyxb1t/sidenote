'use strict';

/**
 * backend/ai/visualService.js
 *
 * Generation service for visual & diagrammatic explanations.
 * Generates structured spatial walkthroughs, diagrams, and state traces.
 *
 * Public API:
 *   generateVisualExplanation(topic, learnerContext, userContext) → LessonJSON
 */

const { callAI }           = require('./aiClient.cjs');
const { validateLesson }   = require('./validators/lessonValidator.cjs');
const { checkEntitlement } = require('../monetization/entitlementGuard.cjs');

/**
 * Builds the visual explanation prompt string.
 *
 * @param {string} topic
 * @param {object} learnerContext
 * @returns {string}
 */
function buildVisualPrompt(topic, learnerContext) {
  return `You are an expert tutor specializing in visual, spatial, and diagrammatic explanations.
Generate a structured visual explanation of the following topic for a learner.

TOPIC: "${topic}"

Focus on:
1. Spatial mental models, structural layouts, or ASCII diagrams showing how components connect.
2. Step-by-step visual trace showing state or flow changes.
3. Core intuition highlighted in a dedicated insight section.
4. Concrete visual worked example.

─── OUTPUT FORMAT ─────────────────────────────────────────────────────
Return a single valid JSON object matching this exact schema.
Do not include any text before or after the JSON.

{
  "version": 1,
  "title": "<descriptive title for visual explanation of ${topic}>",
  "topic": "${topic}",
  "teachingStrategy": "visual",
  "sections": [
    {
      "type": "intro",
      "content": "<2-3 sentence introduction framing the visual model>"
    },
    {
      "type": "insight",
      "content": "<key spatial/structural intuition or visual rule to remember>"
    },
    {
      "type": "explanation",
      "content": "<step-by-step visual walkthrough explaining how the concept operates>"
    },
    {
      "type": "example",
      "label": "Visual State Trace",
      "content": "<concrete example showing state transitions, layouts, or diagrammatic flow>"
    },
    {
      "type": "summary",
      "bullets": [
        "<key takeaway 1>",
        "<key takeaway 2>"
      ]
    }
  ]
}`;
}

/**
 * Generates a visual explanation for a topic.
 *
 * @param {string} topic
 * @param {object} learnerContext
 * @param {object} userContext - { userId, plan, creditsRemaining }
 * @returns {Promise<object>} LessonJSON
 */
async function generateVisualExplanation(topic, learnerContext, userContext) {
  if (!topic || typeof topic !== 'string') {
    throw new Error('generateVisualExplanation: "topic" must be a non-empty string.');
  }
  if (!userContext || typeof userContext !== 'object') {
    throw new Error('generateVisualExplanation: "userContext" must be a non-null object.');
  }

  // Entitlement check (costs 1 credit per CREDIT_COSTS.generateVisualExplanation)
  checkEntitlement('generateVisualExplanation', userContext);

  const prompt = buildVisualPrompt(topic, learnerContext || {});
  const visualJSON = await callAI(prompt);

  // Validate using existing LessonJSON validator
  validateLesson(visualJSON);

  return visualJSON;
}

module.exports = { generateVisualExplanation, buildVisualPrompt };
