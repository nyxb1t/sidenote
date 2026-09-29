/**
 * backend/test/visual-examples.test.js
 * Unit tests for visualService and examplesService.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

const require = createRequire(import.meta.url);
const { buildVisualPrompt, generateVisualExplanation } = require(path.join(backendRoot, 'ai', 'visualService.cjs'));
const { buildExamplesPrompt, generateMoreExamples }   = require(path.join(backendRoot, 'ai', 'examplesService.cjs'));
const { InsufficientCreditsError } = require(path.join(backendRoot, 'monetization', 'InsufficientCreditsError.cjs'));

test('buildVisualPrompt includes topic and visual strategy instructions', () => {
  const prompt = buildVisualPrompt('Binary Search', { memoryType: 'session' });
  assert.ok(prompt.includes('Binary Search'));
  assert.ok(prompt.includes('"teachingStrategy": "visual"'));
  assert.ok(prompt.toLowerCase().includes('spatial mental models'));
});

test('buildExamplesPrompt includes topic and scenario instructions', () => {
  const prompt = buildExamplesPrompt('Merge Sort', { memoryType: 'session' });
  assert.ok(prompt.includes('Merge Sort'));
  assert.ok(prompt.includes('teachingStrategy": "step-by-step"'));
  assert.ok(prompt.includes('Core Scenario'));
});

test('generateVisualExplanation throws InsufficientCreditsError when creditsRemaining < 1', async () => {
  const userContext = { userId: 'u1', plan: 'free', creditsRemaining: 0 };
  await assert.rejects(
    async () => {
      await generateVisualExplanation('Binary Search', {}, userContext);
    },
    InsufficientCreditsError
  );
});

test('generateMoreExamples throws InsufficientCreditsError when creditsRemaining < 1', async () => {
  const userContext = { userId: 'u1', plan: 'free', creditsRemaining: 0 };
  await assert.rejects(
    async () => {
      await generateMoreExamples('Binary Search', {}, userContext);
    },
    InsufficientCreditsError
  );
});
