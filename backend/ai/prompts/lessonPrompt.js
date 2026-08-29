'use strict';

/**
 * backend/ai/prompts/lessonPrompt.js
 *
 * Pure function that builds the prompt string for lesson generation.
 * No AI SDK imports. No side effects. Fully unit-testable in isolation.
 *
 * Called by: lessonService.js
 *
 * @param {string} topic          - The topic to teach.
 * @param {object} learnerContext - Memory-tier-aware learner context object.
 *                                  Shape varies by memoryType:
 *                                    'session'  → { memoryType, currentSession }
 *                                    'recent'   → { memoryType, recentLearning }
 *                                    'longterm' → { memoryType, learnerProfile }
 *                                    'full'     → { memoryType, learnerProfile, learnerModel }
 * @param {string} strategy       - Teaching strategy selected by selectTeachingStrategy().
 * @returns {string} The complete prompt to send to the AI provider.
 */
function buildLessonPrompt(topic, learnerContext, strategy) {
  const memoryType = learnerContext.memoryType ?? 'session';

  // ── Teaching strategy instruction (shared across all memory types) ──────────
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

  // ── Output format schema (shared across all memory types) ────────────────────
  const outputFormat = `
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
- Return valid JSON only. No commentary, no markdown fences.`.trimStart();

  // ── Build learner context block based on memoryType ──────────────────────────

  let contextBlock;

  if (memoryType === 'session') {
    // Session: current topic only. No personalization history, no mastery data.
    // Do not mention past performance.
    const currentSession = learnerContext.currentSession ?? {};
    const sessionTopic   = currentSession.topic ?? topic;

    contextBlock = `
─── LEARNER CONTEXT ───────────────────────────────────────────────────
Memory tier: session (no personalization history)
Topic:       ${sessionTopic}
`.trimStart();

  } else if (memoryType === 'recent') {
    // Recent: use recent session data. Do not imply deep long-term knowledge.
    const recentLearning  = learnerContext.recentLearning ?? {};
    const recentTopics    = recentLearning.recentTopics    ?? [];
    const recentStrengths = recentLearning.recentStrengths ?? [];
    const recentWeaknesses = recentLearning.recentWeaknesses ?? [];

    const recentTopicsBlock = recentTopics.length
      ? `Recently studied: ${recentTopics.join(', ')}.`
      : '';

    const recentStrengthsBlock = recentStrengths.length
      ? `Recent strengths: ${recentStrengths.join(', ')}.`
      : '';

    const recentWeaknessesBlock = recentWeaknesses.length
      ? `Recent difficulties: ${recentWeaknesses.join(', ')}. Give extra clarity on these.`
      : '';

    contextBlock = `
─── LEARNER CONTEXT ───────────────────────────────────────────────────
Memory tier: recent
Topic:       ${topic}
${recentTopicsBlock}
${recentStrengthsBlock}
${recentWeaknessesBlock}
`.trimStart();

  } else if (memoryType === 'longterm' || memoryType === 'full') {
    // Longterm / Full: full personalization using learnerProfile.
    const profile        = learnerContext.learnerProfile ?? {};
    const knownTopics    = profile.knownTopics    ?? [];
    const weakAreas      = profile.weakAreas      ?? [];
    const mistakePatterns = profile.mistakePatterns ?? [];
    const goal           = profile.goal           ?? 'general learning';
    const masteryByTopic = profile.masteryByTopic ?? {};

    // Derive overall mastery from masteryByTopic since mastery.overall is not
    // guaranteed by the new learnerContext contract.
    const topicValues    = Object.values(masteryByTopic);
    const overallMastery = topicValues.length > 0
      ? topicValues.reduce((sum, v) => sum + v, 0) / topicValues.length
      : 0.3;   // default: treat unknown as intermediate-beginner

    const masteryLabel =
      overallMastery < 0.3 ? 'beginner' :
      overallMastery < 0.7 ? 'intermediate' :
      'advanced';

    const pct = (overallMastery * 100).toFixed(0);

    const knownBlock = knownTopics.length
      ? `The learner already understands: ${knownTopics.join(', ')}. Do not re-explain these from scratch.`
      : '';

    const weakBlock = weakAreas.length
      ? `The learner struggles with: ${weakAreas.join(', ')}. Be especially clear when these concepts appear.`
      : '';

    const mistakeBlock = mistakePatterns.length
      ? `Known recurring mistakes to address:\n${mistakePatterns.map((m) => `  - ${m}`).join('\n')}`
      : '';

    // Full memory tier: additionally inject deep learning analytics.
    let fullBlock = '';
    if (memoryType === 'full') {
      const learnerModelData   = learnerContext.learnerModel  ?? {};
      const masteryTrends      = learnerModelData.masteryTrends      ?? {};
      const knowledgeGaps      = learnerModelData.knowledgeGaps      ?? [];
      const forgettingPatterns = learnerModelData.forgettingPatterns ?? [];
      const learningVelocity   = learnerModelData.learningVelocity   ?? null;
      const topicRelationships = learnerModelData.topicRelationships ?? {};

      const trendsBlock = Object.keys(masteryTrends).length
        ? `Mastery trends: ${JSON.stringify(masteryTrends)}.`
        : '';

      const gapsBlock = knowledgeGaps.length
        ? `Knowledge gaps to address: ${knowledgeGaps.join(', ')}.`
        : '';

      const forgettingBlock = forgettingPatterns.length
        ? `Forgetting patterns observed: ${forgettingPatterns.join(', ')}. Reinforce these.`
        : '';

      const velocityBlock = learningVelocity
        ? `Learning velocity: ${learningVelocity}.`
        : '';

      const relBlock = Object.keys(topicRelationships).length
        ? `Topic relationships: ${JSON.stringify(topicRelationships)}.`
        : '';

      fullBlock = [trendsBlock, gapsBlock, forgettingBlock, velocityBlock, relBlock]
        .filter(Boolean)
        .join('\n');
    }

    contextBlock = `
─── LEARNER CONTEXT ───────────────────────────────────────────────────
Goal:           ${goal}
Mastery level:  ${masteryLabel} (${pct}%)
Topic:          ${topic}
${knownBlock}
${weakBlock}
${mistakeBlock}
${fullBlock}
`.trimStart();

  } else {
    // Unknown memoryType: safe fallback, treat as session.
    contextBlock = `
─── LEARNER CONTEXT ───────────────────────────────────────────────────
Topic: ${topic}
`.trimStart();
  }

  return `
You are an expert computer science tutor inside the SideNote learning app.
Your task is to generate a structured lesson on the topic below.

${contextBlock}
─── TEACHING STRATEGY ─────────────────────────────────────────────────
Strategy: ${strategy}
${strategyGuide}

${outputFormat}
`.trim();
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { buildLessonPrompt };
