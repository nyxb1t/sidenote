'use strict';

/**
 * backend/ai/prompts/quizPrompt.js
 *
 * Pure function that builds the prompt string for quiz generation.
 * No AI SDK imports. No side effects. Fully unit-testable in isolation.
 *
 * Called by: quizService.js
 *
 * @param {object} lessonContent - The full LessonJSON object returned by generateLesson().
 * @param {object} learnerModel  - The current LearnerModel.
 * @returns {string} The complete prompt to send to the AI provider.
 */
function buildQuizPrompt(lessonContent, learnerModel) {
  const topic         = lessonContent.topic        ?? 'the lesson topic';
  const strategy      = lessonContent.teachingStrategy ?? 'step-by-step';
  const overallMastery = learnerModel.mastery?.overall ?? 0;
  const topicMastery  = learnerModel.mastery?.byTopic?.[topic];
  const weakAreas     = learnerModel.weakAreas ?? [];

  // Resolve effective mastery and difficulty for this topic
  const effectiveMastery = topicMastery !== undefined ? topicMastery : overallMastery;
  const difficulty =
    effectiveMastery < 0.4 ? 'beginner' :
    effectiveMastery < 0.7 ? 'intermediate' :
    'advanced';

  // Summarise lesson content as context (title + section content snippets)
  const lessonSummary = (lessonContent.sections ?? [])
    .filter((s) => ['intro', 'explanation', 'insight', 'summary'].includes(s.type))
    .map((s) => {
      if (s.type === 'summary') return `Summary bullets: ${(s.bullets ?? []).join(' | ')}`;
      return s.content ?? '';
    })
    .filter(Boolean)
    .join('\n\n');

  const weakAreaNote = weakAreas.includes(topic)
    ? `This topic is a known weak area for the learner. Include at least one question that directly addresses a common misconception.`
    : '';

  return `
You are an expert computer science tutor inside the SideNote learning app.
Your task is to generate a short quiz that tests understanding of a lesson just taught.

─── LESSON CONTEXT ────────────────────────────────────────────────────
Topic:               ${topic}
Teaching strategy:   ${strategy}
Learner difficulty:  ${difficulty}
${weakAreaNote}

Lesson content summary:
${lessonSummary}

─── OUTPUT FORMAT ─────────────────────────────────────────────────────
Return a single valid JSON object matching this exact schema.
Do not include any text before or after the JSON.

{
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "<question text>",
      "options": ["<A>", "<B>", "<C>", "<D>"],
      "correctIndex": 0,
      "explanation": "<why this answer is correct>"
    },
    {
      "id": "q2",
      "type": "true_false",
      "question": "<statement to evaluate>",
      "correctAnswer": true,
      "explanation": "<why this is true or false>"
    }
  ]
}

Rules:
- Generate exactly 5 questions.
- Mix question types: at least 3 "mcq" and at least 1 "true_false".
- All questions must be directly testable from the lesson content provided.
- Difficulty must match: ${difficulty} — calibrate complexity accordingly.
- Every question must include an "explanation" field.
- "id" values must be sequential: "q1", "q2", "q3", "q4", "q5".
- For "mcq": "correctIndex" is the 0-based index into "options".
- Return valid JSON only. No commentary, no markdown fences.
`.trim();
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { buildQuizPrompt };

