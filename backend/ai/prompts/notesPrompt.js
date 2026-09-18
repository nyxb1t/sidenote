'use strict';

/**
 * backend/ai/prompts/notesPrompt.js
 *
 * Pure function that builds the prompt string for notes generation.
 * No AI SDK imports. No side effects. Fully unit-testable in isolation.
 *
 * Called by: notesService.js
 *
 * Notes are derived from the lesson content that was actually taught,
 * not regenerated independently from a topic string. This ensures the
 * notes faithfully reflect what the learner studied.
 *
 * @param {object} lessonContent - The full LessonJSON object returned by generateLesson().
 * @returns {string} The complete prompt to send to the AI provider.
 */
function buildNotesPrompt(lessonContent) {
  const topic    = lessonContent.topic    ?? 'the lesson topic';
  const title    = lessonContent.title    ?? topic;
  const strategy = lessonContent.teachingStrategy ?? 'step-by-step';

  // Extract all text-bearing sections as condensed source material
  const sections = lessonContent.sections ?? [];

  const sectionText = sections
    .map((s) => {
      switch (s.type) {
        case 'intro':
        case 'explanation':
        case 'insight':
          return `[${s.type.toUpperCase()}]\n${s.content}`;
        case 'example':
          return `[EXAMPLE: ${s.label ?? ''}]\n${s.content}`;
        case 'code':
          return `[CODE (${s.language ?? ''})]\n${s.content}`;
        case 'think':
          return `[THINK]\nQ: ${s.question}\nHint: ${s.hint}`;
        case 'summary':
          return `[SUMMARY]\n${(s.bullets ?? []).map((b) => `• ${b}`).join('\n')}`;
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');

  // Derive a tag hint from the teaching strategy
  const tagHint =
    strategy === 'visual'    ? 'Visual' :
    strategy === 'analogy'   ? 'Insight' :
    strategy === 'socratic'  ? 'Insight' :
    'Concept';

  return `
You are an expert computer science tutor inside the SideNote learning app.
Your task is to condense a lesson into structured study notes.

─── LESSON TO CONDENSE ────────────────────────────────────────────────
Title:    ${title}
Topic:    ${topic}

${sectionText}

─── OUTPUT FORMAT ─────────────────────────────────────────────────────
Return a single valid JSON object matching this exact schema.
Do not include any text before or after the JSON.

{
  "topic": "${topic}",
  "tag": "<one of: Concept | Insight | Visual | Reference>",
  "summary": "<2–3 sentence plain-text summary of the entire lesson>",
  "bulletPoints": [
    "<key point 1>",
    "<key point 2>",
    "<key point 3>",
    "<key point 4>",
    "<key point 5>"
  ],
  "keyTerms": [
    {
      "term": "<technical term>",
      "definition": "<concise one-sentence definition>"
    }
  ]
}

Rules:
- "tag" should reflect the lesson's primary character. Suggested: "${tagHint}".
- "summary" must be 2–3 sentences of plain text, no bullet points.
- "bulletPoints" must contain 4–6 items covering the most important takeaways.
- "keyTerms" must contain 2–5 entries for the most important technical terms introduced.
- All strings must be plain text (no markdown syntax inside JSON strings).
- Do not introduce new information not present in the lesson content above.
- Return valid JSON only. No commentary, no markdown fences.
`.trim();
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { buildNotesPrompt };

