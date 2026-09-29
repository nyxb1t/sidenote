/**
 * backend/src/lib/ai-bridge.js
 *
 * ESM compatibility bridge for Person 1's CommonJS AI Intelligence Layer.
 *
 * Person 1's AI files (backend/ai/, backend/learner/, backend/monetization/)
 * use CommonJS (require / module.exports).  The Express backend uses ESM.
 *
 * This single bridge file uses Node.js createRequire() to load the CJS modules
 * and re-exports everything as named ESM exports so that route files can use
 * normal `import` syntax.
 *
 * Person 1's source files are NOT modified.
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Resolve to backend/ root (two levels up from src/lib/)
const backendRoot = path.resolve(__dirname, '..', '..');

const require = createRequire(import.meta.url);

// ── AI generation services ────────────────────────────────────────────────────
const { generateLesson }            = require(path.join(backendRoot, 'ai', 'lessonService.cjs'));
const { generateQuiz }              = require(path.join(backendRoot, 'ai', 'quizService.cjs'));
const { generateNotes }             = require(path.join(backendRoot, 'ai', 'notesService.cjs'));
const { generateRetryExplanation }  = require(path.join(backendRoot, 'ai', 'retryService.cjs'));
const { generateVisualExplanation } = require(path.join(backendRoot, 'ai', 'visualService.cjs'));
const { generateMoreExamples }      = require(path.join(backendRoot, 'ai', 'examplesService.cjs'));

// ── Learner services ──────────────────────────────────────────────────────────
const { updateLearnerModel, selectTeachingStrategy } =
  require(path.join(backendRoot, 'learner', 'learnerService.cjs'));

// ── Monetization ──────────────────────────────────────────────────────────────
const { getCreditCost, getPlanLimits, CREDIT_COSTS, PLAN_LIMITS } =
  require(path.join(backendRoot, 'monetization', 'creditRules.cjs'));

const { checkEntitlement } =
  require(path.join(backendRoot, 'monetization', 'entitlementGuard.cjs'));

const { InsufficientCreditsError } =
  require(path.join(backendRoot, 'monetization', 'InsufficientCreditsError.cjs'));

// ── Validators (for error-type checking in route error handler) ───────────────
const { ValidationError } =
  require(path.join(backendRoot, 'ai', 'validators', 'ValidationError.cjs'));

// ── Re-export as named ESM exports ───────────────────────────────────────────
export {
  // Generation
  generateLesson,
  generateQuiz,
  generateNotes,
  generateRetryExplanation,
  generateVisualExplanation,
  generateMoreExamples,
  // Learner
  updateLearnerModel,
  selectTeachingStrategy,
  // Monetization
  getCreditCost,
  getPlanLimits,
  CREDIT_COSTS,
  PLAN_LIMITS,
  checkEntitlement,
  InsufficientCreditsError,
  // Validators
  ValidationError,
};
