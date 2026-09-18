'use strict';

/**
 * backend/ai/aiClient.js
 *
 * AI provider fallback orchestrator.
 *
 * Exports:
 *   callAI(prompt) → Promise<object>  — parsed JSON from whichever provider succeeded
 *
 * Responsibilities:
 *   - Try Gemini first.
 *   - On any Gemini failure, fall back to Groq.
 *   - If both fail, throw an AggregateError containing both provider errors.
 *   - Log which provider successfully responded.
 *
 * Explicit non-responsibilities:
 *   - This module knows nothing about lesson schemas, quiz schemas,
 *     prompt structure, teaching strategies, or generation logic.
 *   - It receives a raw string and returns a raw parsed object.
 *   - It does not validate the shape of the returned JSON.
 */

const { callGemini, GeminiError } = require('./gemini.cjs');
const { callGroq,   GroqError   } = require('./groq.cjs');

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Sends a prompt to the primary AI provider (Gemini), falling back to the
 * secondary provider (Groq) on any failure.
 *
 * @param {string} prompt - The complete prompt string built by a prompt builder.
 * @returns {Promise<object>} Parsed JSON object from whichever provider succeeded.
 * @throws {AggregateError} If both Gemini and Groq fail, containing both errors.
 */
async function callAI(prompt) {
  // ── Primary: Gemini ────────────────────────────────────────────────────────
  try {
    const result = await callGemini(prompt);
    console.log('[aiClient] Provider: Gemini ✓');
    return result;
  } catch (geminiErr) {
    console.warn(
      `[aiClient] Gemini failed (${geminiErr.name}: ${geminiErr.message}). ` +
      'Falling back to Groq…'
    );

    // ── Fallback: Groq ───────────────────────────────────────────────────────
    try {
      const result = await callGroq(prompt);
      console.log('[aiClient] Provider: Groq (fallback) ✓');
      return result;
    } catch (groqErr) {
      console.error(
        `[aiClient] Groq also failed (${groqErr.name}: ${groqErr.message}). ` +
        'Both providers exhausted.'
      );

      // Both providers failed — surface all errors together.
      throw new AggregateError(
        [geminiErr, groqErr],
        'callAI: both Gemini and Groq failed. See errors for details.'
      );
    }
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { callAI };

