'use strict';

/**
 * backend/learner/learnerService.js
 *
 * Core Intelligence Layer service for learner state management.
 *
 * Exports:
 *   - updateLearnerModel(currentModel, learningEvent) → new LearnerModel
 *   - selectTeachingStrategy(topic, learnerModel)     → strategy string
 *
 * All functions are pure: they never mutate their inputs and never
 * perform database reads or writes. Person 3's route handler is
 * responsible for loading the current model and persisting the updated one.
 *
 * ─── LearnerModel shape ───────────────────────────────────────────────────────
 * {
 *   userId:           string,        // Supabase UUID — passed through, never used internally
 *   goal:             string,        // e.g. "Crack GATE CS 2025"
 *   knownTopics:      string[],      // Topics the learner has mastered (mastery > threshold)
 *   weakAreas:        string[],      // Topics needing reinforcement
 *   preferredStyle:   string,        // 'visual' | 'analogy' | 'step-by-step' | 'socratic'
 *   mastery: {
 *     overall:        number,        // Global mastery score [0, 1]
 *     byTopic:        Record<string, number>, // Per-topic mastery [0, 1]
 *   },
 *   mistakePatterns:  string[],      // Observed recurring mistakes
 *   lastStrategy:     string | null, // Teaching strategy used in the last session
 *   examDate:         string | null, // ISO 8601 date string, e.g. "2025-02-02"
 *   sessionCount:     number,        // Total sessions completed
 * }
 *
 * ─── LearningEvent shape ──────────────────────────────────────────────────────
 * {
 *   type:           'lesson_complete' | 'quiz_result' | 'retry_requested' | 'session_start',
 *   topic:          string,          // Topic the event relates to
 *   score:          number?,         // Quiz score [0, 1] (quiz_result only)
 *   mistakeTopics:  string[]?,       // Specific mistake descriptions (quiz_result only)
 *   strategyUsed:   string?,         // Strategy that was used (lesson_complete, retry_requested)
 * }
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Mastery score above which a topic is considered 'known'. */
const KNOWN_TOPIC_THRESHOLD = 0.8;

/** Mastery score below which a topic is flagged as a weak area. */
const WEAK_AREA_THRESHOLD = 0.5;

/** Flat mastery increment applied on lesson completion. */
const LESSON_MASTERY_INCREMENT = 0.05;

/** Ordered list of all valid teaching strategies. */
const ALL_STRATEGIES = ['step-by-step', 'visual', 'analogy', 'socratic'];

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Returns a shallow clone of the learner model with a safely cloned
 * mastery.byTopic object, so callers can mutate the clone freely.
 *
 * @param {object} model
 * @returns {object}
 */
function _cloneModel(model) {
  return {
    ...model,
    knownTopics:     [...(model.knownTopics     ?? [])],
    weakAreas:       [...(model.weakAreas        ?? [])],
    mistakePatterns: [...(model.mistakePatterns  ?? [])],
    mastery: {
      overall:  model.mastery?.overall ?? 0,
      byTopic:  { ...(model.mastery?.byTopic ?? {}) },
    },
  };
}

/**
 * Clamps a number to [0, 1].
 *
 * @param {number} value
 * @returns {number}
 */
function _clamp(value) {
  return Math.min(1, Math.max(0, value));
}

/**
 * Recalculates overall mastery as the mean of all byTopic values.
 * Returns the existing overall if no byTopic entries exist.
 *
 * @param {object} mastery - { overall, byTopic }
 * @returns {number}
 */
function _recalcOverall(mastery) {
  const values = Object.values(mastery.byTopic);
  if (values.length === 0) return mastery.overall;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return _clamp(mean);
}

// ─── Event handlers ───────────────────────────────────────────────────────────

/**
 * Handles 'lesson_complete' events.
 * Increments topic mastery slightly, promotes topic to knownTopics if threshold
 * is crossed, records the strategy used, and increments sessionCount.
 *
 * @param {object} model - Cloned learner model.
 * @param {object} event - LearningEvent.
 * @returns {object} Updated model.
 */
function _handleLessonComplete(model, event) {
  const { topic, strategyUsed } = event;

  // Bump topic mastery
  const current = model.mastery.byTopic[topic] ?? 0;
  const updated = _clamp(current + LESSON_MASTERY_INCREMENT);
  model.mastery.byTopic[topic] = updated;
  model.mastery.overall = _recalcOverall(model.mastery);

  // Promote to knownTopics if threshold crossed
  if (updated >= KNOWN_TOPIC_THRESHOLD && !model.knownTopics.includes(topic)) {
    model.knownTopics.push(topic);
  }

  // Record strategy
  if (strategyUsed) {
    model.lastStrategy = strategyUsed;
  }

  model.sessionCount = (model.sessionCount ?? 0) + 1;

  return model;
}

/**
 * Handles 'quiz_result' events.
 * Adjusts topic mastery based on quiz score, updates weakAreas accordingly,
 * and appends any new mistake patterns reported.
 *
 * @param {object} model - Cloned learner model.
 * @param {object} event - LearningEvent.
 * @returns {object} Updated model.
 */
function _handleQuizResult(model, event) {
  const { topic, score = 0, mistakeTopics = [] } = event;

  // Blend quiz score into topic mastery (weighted: 70% existing, 30% new score)
  const current = model.mastery.byTopic[topic] ?? model.mastery.overall;
  const blended = _clamp(current * 0.7 + score * 0.3);
  model.mastery.byTopic[topic] = blended;
  model.mastery.overall = _recalcOverall(model.mastery);

  // Update weakAreas
  if (blended < WEAK_AREA_THRESHOLD && !model.weakAreas.includes(topic)) {
    model.weakAreas.push(topic);
  } else if (blended >= KNOWN_TOPIC_THRESHOLD) {
    model.weakAreas = model.weakAreas.filter((t) => t !== topic);
  }

  // Remove from weakAreas if mastery now exceeds threshold
  if (blended >= KNOWN_TOPIC_THRESHOLD && !model.knownTopics.includes(topic)) {
    model.knownTopics.push(topic);
  }

  // Append new mistake patterns (deduplicated)
  for (const mistake of mistakeTopics) {
    if (mistake && !model.mistakePatterns.includes(mistake)) {
      model.mistakePatterns.push(mistake);
    }
  }

  return model;
}

/**
 * Handles 'retry_requested' events.
 * Ensures topic is in weakAreas and records the strategy that failed.
 *
 * @param {object} model - Cloned learner model.
 * @param {object} event - LearningEvent.
 * @returns {object} Updated model.
 */
function _handleRetryRequested(model, event) {
  const { topic, strategyUsed } = event;

  if (topic && !model.weakAreas.includes(topic)) {
    model.weakAreas.push(topic);
  }

  if (strategyUsed) {
    model.lastStrategy = strategyUsed;
  }

  return model;
}

/**
 * Handles 'session_start' events.
 * Simply increments the session counter.
 *
 * @param {object} model - Cloned learner model.
 * @returns {object} Updated model.
 */
function _handleSessionStart(model) {
  model.sessionCount = (model.sessionCount ?? 0) + 1;
  return model;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a new learner model reflecting the given learning event.
 *
 * Does NOT mutate currentModel. Does NOT write to any database.
 * Person 3's route handler receives the returned model and decides
 * when and how to persist it.
 *
 * @param {object} currentModel - The current LearnerModel.
 * @param {object} learningEvent - The LearningEvent to apply.
 * @param {'lesson_complete'|'quiz_result'|'retry_requested'|'session_start'} learningEvent.type
 * @param {string} learningEvent.topic
 * @param {number} [learningEvent.score]
 * @param {string[]} [learningEvent.mistakeTopics]
 * @param {string} [learningEvent.strategyUsed]
 * @returns {object} A new LearnerModel with the event applied.
 * @throws {Error} If the event type is not recognised.
 */
function updateLearnerModel(currentModel, learningEvent) {
  if (!currentModel || typeof currentModel !== 'object') {
    throw new Error('updateLearnerModel: currentModel must be a non-null object.');
  }
  if (!learningEvent || !learningEvent.type) {
    throw new Error('updateLearnerModel: learningEvent must have a "type" field.');
  }

  const model = _cloneModel(currentModel);

  switch (learningEvent.type) {
    case 'lesson_complete':
      return _handleLessonComplete(model, learningEvent);
    case 'quiz_result':
      return _handleQuizResult(model, learningEvent);
    case 'retry_requested':
      return _handleRetryRequested(model, learningEvent);
    case 'session_start':
      return _handleSessionStart(model);
    default:
      throw new Error(
        `updateLearnerModel: unrecognised event type "${learningEvent.type}". ` +
        `Known types: lesson_complete, quiz_result, retry_requested, session_start.`
      );
  }
}

/**
 * Selects the most appropriate teaching strategy for a given topic and learner.
 *
 * Selection priority (first matching rule wins):
 *   1. Topic-level mastery < 0.3  → 'step-by-step'  (learner is new to this topic)
 *   2. Overall mastery < 0.3      → 'step-by-step'  (learner is generally a beginner)
 *   3. Topic is in weakAreas      → 'analogy'        (topic needs a different angle)
 *   4. Topic/overall mastery ≥ 0.75 → 'socratic'    (learner is advanced)
 *   5. preferredStyle is set and differs from lastStrategy → preferredStyle
 *   6. Rotate: first strategy in ALL_STRATEGIES that is not lastStrategy
 *
 * Guarantee: the returned strategy will differ from lastStrategy whenever
 * at least two strategies exist (i.e. always).
 *
 * @param {string} topic - The topic being taught.
 * @param {object} learnerModel - The current LearnerModel.
 * @returns {'step-by-step' | 'visual' | 'analogy' | 'socratic'}
 */
function selectTeachingStrategy(topic, learnerModel) {
  const byTopic       = learnerModel.mastery?.byTopic ?? {};
  const topicMastery  = byTopic[topic];                          // may be undefined
  const overall       = learnerModel.mastery?.overall ?? 0;
  const lastStrategy  = learnerModel.lastStrategy ?? null;
  const preferredStyle = learnerModel.preferredStyle ?? null;
  const weakAreas     = learnerModel.weakAreas ?? [];

  // Effective mastery for this topic (falls back to overall when not tracked yet)
  const effectiveMastery = topicMastery !== undefined ? topicMastery : overall;

  // Rule 1 & 2: beginner-level mastery
  if (effectiveMastery < 0.3) {
    return 'step-by-step';
  }

  // Rule 3: topic is a known weak area → analogy gives a fresh angle
  if (weakAreas.includes(topic) && lastStrategy !== 'analogy') {
    return 'analogy';
  }

  // Rule 4: advanced learner → socratic
  if (effectiveMastery >= 0.75 && lastStrategy !== 'socratic') {
    return 'socratic';
  }

  // Rule 5: honour the learner's preferred style (if not just used)
  if (preferredStyle && preferredStyle !== lastStrategy) {
    return preferredStyle;
  }

  // Rule 6: rotate — pick the first strategy that was not last used
  const candidate = ALL_STRATEGIES.find((s) => s !== lastStrategy);
  return candidate ?? 'step-by-step';
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  updateLearnerModel,
  selectTeachingStrategy,
};

