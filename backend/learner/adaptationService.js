'use strict';

/**
 * backend/learner/adaptationService.js
 *
 * Provides lightweight helpers that translate a learner model into
 * concrete adaptation parameters consumed by the prompt builders
 * and learnerService.
 *
 * All functions are pure: no side effects, no database calls.
 *
 * Difficulty bands:
 *   0.00 – 0.39  → 'beginner'
 *   0.40 – 0.69  → 'intermediate'
 *   0.70 – 1.00  → 'advanced'
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolves the effective mastery for a specific topic, falling back to the
 * learner's overall mastery when no topic-level entry exists.
 *
 * @param {string} topic
 * @param {import('./learnerService').LearnerModel} learnerModel
 * @returns {number} Mastery score in [0, 1].
 */
function _effectiveMastery(topic, learnerModel) {
  const byTopic = learnerModel.mastery?.byTopic ?? {};
  return byTopic[topic] !== undefined
    ? byTopic[topic]
    : (learnerModel.mastery?.overall ?? 0);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the adapted difficulty level for a given topic and learner profile.
 *
 * Used by prompt builders to calibrate question difficulty, explanation depth,
 * and example complexity.
 *
 * @param {string} topic
 * @param {import('./learnerService').LearnerModel} learnerModel
 * @returns {'beginner' | 'intermediate' | 'advanced'}
 */
function getAdaptedDifficulty(topic, learnerModel) {
  const mastery = _effectiveMastery(topic, learnerModel);

  if (mastery < 0.4)  return 'beginner';
  if (mastery < 0.7)  return 'intermediate';
  return 'advanced';
}

/**
 * Returns true when the learner is likely to benefit from an analogy-based
 * explanation for the given topic.
 *
 * Criteria (any one is sufficient):
 *   - The topic is in the learner's weakAreas.
 *   - The topic-level mastery is below 0.35.
 *   - The learner's preferredStyle is 'analogy'.
 *
 * @param {string} topic
 * @param {import('./learnerService').LearnerModel} learnerModel
 * @returns {boolean}
 */
function shouldUseAnalogy(topic, learnerModel) {
  const weakAreas     = learnerModel.weakAreas     ?? [];
  const preferredStyle = learnerModel.preferredStyle ?? '';
  const topicMastery  = _effectiveMastery(topic, learnerModel);

  return (
    weakAreas.includes(topic)   ||
    topicMastery < 0.35         ||
    preferredStyle === 'analogy'
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getAdaptedDifficulty,
  shouldUseAnalogy,
};

