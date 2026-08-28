'use strict';

/**
 * backend/ai/prompts/lessonPrompt.js
 *
 * Pure function that builds the prompt string for lesson generation.
 * No AI SDK imports. No side effects. Fully unit-testable in isolation.
 *
 * Called by: lessonService.js
 *
 * @param {string} topic - The topic to teach.
 * @param {object} learnerModel - The current LearnerModel.
 * @param {string} strategy - Teaching strategy selected by selectTeachingStrategy().
 * @returns {string} The complete prompt to send to the AI provider.
 */
function buildLessonPrompt(topic, learnerModel, strategy) {
  const goal          = learnerModel.goal          ?? 'general learning';
  const knownTopics   = learnerModel.knownTopics   ?? [];
  const weakAreas     = learnerModel.weakAreas     ?? [];
  const mistakePatterns = learnerModel.mistakePatterns ?? [];
  const examDate      = learnerModel.examDate      ?? null;
  const overallMastery = learnerModel.mastery?.overall ?? 0;

  // Build optional context blocks only when data is present
  const knownBlock = knownTopics.length
    ? `The learner already understands: ${knownTopics.join(', ')}. Do not re-explain these from scratch.`
    : '';

  const weakBlock = weakAreas.length
    ? `The learner struggles with: ${weakAreas.join(', ')}. Be especially clear when these concepts appear.`
    : '';

  const mistakeBlock = mistakePatterns.length
    ? `Known recurring mistakes to address:\n${mistakePatterns.map((m) => `  - ${m}`).join('\n')}`
    : '';

  const examBlock = examDate
    ? `The learner has an exam on ${examDate}. Keep the explanation exam-focused and concise.`
    : '';

  const masteryLabel =
    overallMastery < 0.3  ? 'beginner' :
    overallMastery < 0.7  ? 'intermediate' :
    'advanced';

  const strategyGuide = {
    'step-by-step':
      'Break the concept into small numbered steps. Build understanding incrementally. ' +
      'Use simple language. Each step must be fully understood before the next.',
    'visual':
      'Use ASCII diagrams, tables, or annotated pseudocode wherever helpful. ' +
      'Describe things spatially. Prioritise illustrations over prose.',
    'analogy':
      'Open with a relatable real-world analogy before introducing the technical concept. ' +
      'Return to the analogy when introducing each new sub-concept.',
    'socratic':
      'Pose guiding questions that lead the learner to derive answers themselves. ' +
      'Include a "think" section with a thought-provoking question and a hint.',
  }[strategy] ?? 'Explain clearly and concisely.';

  return `
You are an expert computer science tutor inside the SideNote learning app.
Your task is to generate a structured lesson on the topic below.

─── LEARNER CONTEXT ───────────────────────────────────────────────────
Goal:           ${goal}
Mastery level:  ${masteryLabel} (${(overallMastery * 100).toFixed(0)}%)
Topic:          ${topic}
${knownBlock}
${weakBlock}
${mistakeBlock}
${examBlock}

─── TEACHING STRATEGY ─────────────────────────────────────────────────
Strategy: ${strategy}
${strategyGuide}

─── OUTPUT FORMAT ─────────────────────────────────────────────────────
Return a single valid JSON object matching this exact schema.
Do not include any text before or after the JSON.

{
  "version": 1,
  "title": "<descriptive lesson title>",
  "topic": "${topic}",
  "teachingStrategy": "${strategy}",
  "sections": [
    {
      "type": "intro",
      "content": "<2–3 sentence plain-text introduction>"
    },
    {
      "type": "explanation",
      "content": "<main concept explanation using the ${strategy} strategy>"
    },
    {
      "type": "example",
      "label": "<short label e.g. Example 1>",
      "content": "<worked example in plain text or pseudocode>"
    },
    {
      "type": "code",
      "language": "<programming language, e.g. python>",
      "content": "<code block as a string>"
    },
    {
      "type": "insight",
      "content": "<one key takeaway or aha moment>"
    },
    {
      "type": "think",
      "question": "<a thought-provoking self-check question>",
      "hint": "<a gentle nudge toward the answer>"
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
- Include only section types that are relevant to this topic and strategy.
- The "think" block is optional but encouraged for ${strategy} strategy.
- The "code" block is optional; include it only when a code example adds genuine value.
- "example" may appear more than once if needed.
- All strings must be plain text (no markdown syntax inside JSON strings).
- Return valid JSON only. No commentary, no markdown fences.
`.trim();
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { buildLessonPrompt };

