'use strict';

/**
 * backend/ai/examplesService.js
 *
 * Generation service for additional worked examples and scenario walkthroughs.
 *
 * Public API:
 *   generateMoreExamples(topic, learnerContext, userContext) → LessonJSON
 */

const { callAI }           = require('./aiClient.cjs');
const { validateLesson }   = require('./validators/lessonValidator.cjs');
const { checkEntitlement } = require('../monetization/entitlementGuard.cjs');

/**
 * Builds the examples prompt string.
 *
 * @param {string} topic
 * @param {object} learnerContext
 * @returns {string}
 */
function buildExamplesPrompt(topic, learnerContext) {
  return `You are an expert tutor providing comprehensive, practical worked examples.
Generate practical worked examples and scenario walkthroughs for the topic below.

TOPIC: "${topic}"

Focus on:
1. Providing distinct, realistic examples covering standard cases and edge cases.
2. Clearly labeling each scenario.
3. Breaking down the solution step-by-step.
4. An interactive think/check question to test understanding of the examples.

─── OUTPUT FORMAT ─────────────────────────────────────────────────────
Return a single valid JSON object matching this exact schema.
Do not include any text before or after the JSON.

{
  "version": 1,
  "title": "<descriptive title for examples on ${topic}>",
  "topic": "${topic}",
  "teachingStrategy": "step-by-step",
  "sections": [
    {
      "type": "intro",
      "content": "<short 1-2 sentence overview of what these practical examples illustrate>"
    },
    {
      "type": "example",
      "label": "Example 1: Core Scenario",
      "content": "<clear scenario description and complete step-by-step walkthrough>"
    },
    {
      "type": "example",
      "label": "Example 2: Edge Case or Practical Variation",
      "content": "<alternative scenario or boundary condition walkthrough>"
    },
    {
      "type": "think",
      "question": "<thought-provoking question testing comprehension of these examples>",
      "hint": "<helpful hint for the question>"
    },
    {
      "type": "summary",
      "bullets": [
        "<key takeaway or practical rule 1>",
        "<key takeaway or practical rule 2>"
      ]
    }
  ]
}`;
}

/**
 * Generates additional worked examples for a topic.
 *
 * @param {string} topic
 * @param {object} learnerContext
 * @param {object} userContext - { userId, plan, creditsRemaining }
 * @returns {Promise<object>} LessonJSON
 */
async function generateMoreExamples(topic, learnerContext, userContext) {
  if (!topic || typeof topic !== 'string') {
    throw new Error('generateMoreExamples: "topic" must be a non-empty string.');
  }
  if (!userContext || typeof userContext !== 'object') {
    throw new Error('generateMoreExamples: "userContext" must be a non-null object.');
  }

  // Entitlement check (costs 1 credit per CREDIT_COSTS.generateLesson)
  checkEntitlement('generateLesson', userContext);

  const prompt = buildExamplesPrompt(topic, learnerContext || {});
  const examplesJSON = await callAI(prompt);

  // Validate using existing LessonJSON validator
  validateLesson(examplesJSON);

  return examplesJSON;
}

module.exports = { generateMoreExamples, buildExamplesPrompt };
