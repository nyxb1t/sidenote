'use strict';

/**
 * backend/ai/prompts/retryPrompt.js
 *
 * Pure function that builds the prompt string for retry explanation generation.
 * No AI SDK imports. No side effects. Fully unit-testable in isolation.
 *
 * Called by: retryService.js
 *
 * The retry prompt explicitly names the strategy that failed and instructs
 * the AI to use the newly selected alternative strategy instead. The returned
 * lesson JSON uses the same section-based schema as a regular lesson.
 *
 * @param {string} topic            - The topic to re-explain.
 * @param {object} learnerModel     - The current LearnerModel.
 * @param {string} strategy         - The NEW strategy selected by selectTeachingStrategy().
 * @param {string} previousStrategy - The strategy that was used before (to be avoided).
 * @returns {string} The complete prompt to send to the AI provider.
 */
function buildRetryPrompt(topic, learnerModel, strategy, previousStrategy) {
  const goal           = learnerModel.goal           ?? 'general learning';
  const weakAreas      = learnerModel.weakAreas      ?? [];
  const mistakePatterns = learnerModel.mistakePatterns ?? [];
  const overallMastery = learnerModel.mastery?.overall ?? 0;

  const mistakeBlock = mistakePatterns.length
    ? `Known recurring mistakes to address:\n${mistakePatterns.map((m) => `  - ${m}`).join('\n')}`
    : '';

  const weakAreaNote = weakAreas.includes(topic)
    ? `This topic is a confirmed weak area for this learner.`
    : '';

  const masteryLabel =
    overallMastery < 0.3 ? 'beginner' :
    overallMastery < 0.7 ? 'intermediate' :
    'advanced';

  const strategyGuide = {
    'step-by-step':
      'Break the concept into small numbered steps. Build understanding incrementally. ' +
      'Use simple language. Each step must be fully understood before the next.',
    'visual':
      'Use ASCII diagrams, tables, or annotated pseudocode wherever helpful. ' +
      'Describe things spatially. Prioritise illustrations over prose.',
    'analogy':
      'Open with a fresh, relatable real-world analogy before introducing the technical concept. ' +
      'Choose a different analogy than the one likely used before. ' +
      'Return to the analogy when introducing each new sub-concept.',
    'socratic':
      'Pose guiding questions that lead the learner to derive answers themselves. ' +
      'Include a "think" section with a thought-provoking question and a hint.',
  }[strategy] ?? 'Explain clearly and concisely using a fresh approach.';

  return `
You are an expert computer science tutor inside the SideNote learning app.
The learner did not fully understand a previous explanation and has requested a retry.

Your task is to re-explain the topic using a DIFFERENT teaching strategy than before.

─── LEARNER CONTEXT ───────────────────────────────────────────────────
Goal:                ${goal}
Mastery level:       ${masteryLabel} (${(overallMastery * 100).toFixed(0)}%)
Topic:               ${topic}
${weakAreaNote}
${mistakeBlock}

─── STRATEGY CHANGE ───────────────────────────────────────────────────
Previous strategy (do NOT use): ${previousStrategy}
New strategy (MUST use):        ${strategy}

${strategyGuide}

Start completely fresh. Do not reuse the same examples, analogies, or explanations
from the previous attempt. Approach the concept from a different angle entirely.

─── OUTPUT FORMAT ─────────────────────────────────────────────────────
Return a single valid JSON object matching this exact schema.
Do not include any text before or after the JSON.

{
  "version": 1,
  "title": "<descriptive lesson title reflecting the new approach>",
  "topic": "${topic}",
  "teachingStrategy": "${strategy}",
  "sections": [
    {
      "type": "intro",
      "content": "<fresh 2–3 sentence introduction — different angle than before>"
    },
    {
      "type": "explanation",
      "content": "<main concept explained using the ${strategy} strategy>"
    },
    {
      "type": "example",
      "label": "<short label>",
      "content": "<worked example — must be different from any previous example>"
    },
    {
      "type": "code",
      "language": "<programming language>",
      "content": "<code block as a string>"
    },
    {
      "type": "insight",
      "content": "<one key takeaway>"
    },
    {
      "type": "think",
      "question": "<a thought-provoking self-check question>",
      "hint": "<a gentle nudge>"
    },
    {
      "type": "summary",
      "bullets": [
        "<key point 1>",
        "<key point 2>",
        "<key point 3>"
      ]
    }
  ]
}

Rules:
- Include only section types relevant to the new strategy.
- All content must be fresh — do not repeat anything from a previous attempt.
- All strings must be plain text (no markdown syntax inside JSON strings).
- Return valid JSON only. No commentary, no markdown fences.
`.trim();
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { buildRetryPrompt };

