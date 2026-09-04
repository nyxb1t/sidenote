'use strict';

/**
 * backend/ai/gemini.js
 *
 * Gemini AI provider wrapper.
 *
 * Exports:
 *   callGemini(prompt) → Promise<object>  — parsed JSON response
 *   GeminiError                           — typed error class for all Gemini failures
 *
 * Design notes:
 *   - GEMINI_API_KEY and GEMINI_MODEL are read inside callGemini(), not at
 *     module load time. This ensures environment variable changes made after
 *     require() (e.g. in the smoke test's fallback simulation) are always
 *     reflected at call time.
 *   - responseMimeType: 'application/json' is set so Gemini returns
 *     structurally valid JSON without markdown fences or prose wrappers.
 *   - All errors (quota, auth, network, parse) are caught and re-thrown
 *     as GeminiError with the original error preserved.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Typed error ──────────────────────────────────────────────────────────────

class GeminiError extends Error {
  /**
   * @param {string} message       - Human-readable description of what failed.
   * @param {Error}  originalError - The underlying error that caused this failure.
   */
  constructor(message, originalError) {
    super(message);
    this.name          = 'GeminiError';
    this.provider      = 'gemini';
    this.originalError = originalError ?? null;
  }
}

// ─── Provider function ────────────────────────────────────────────────────────

/**
 * Sends a prompt to the Gemini API and returns the parsed JSON response.
 *
 * @param {string} prompt - The complete prompt string built by a prompt builder.
 * @returns {Promise<object>} Parsed JSON object from the Gemini response.
 * @throws {GeminiError} On any failure: missing config, quota, auth, network,
 *                       or JSON parse error.
 */
async function callGemini(prompt) {
  // Read config inside the function — never at module load time.
  const apiKey  = process.env.GEMINI_API_KEY;
  const modelId = process.env.GEMINI_MODEL;

  if (!apiKey) {
    throw new GeminiError(
      'callGemini: GEMINI_API_KEY is not set in environment variables.',
      null
    );
  }
  if (!modelId) {
    throw new GeminiError(
      'callGemini: GEMINI_MODEL is not set in environment variables.',
      null
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: modelId,
      generationConfig: {
        // Instructs Gemini to return valid JSON without markdown fences.
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(prompt);
    const text   = result.response.text();

    // Parse and validate that the response is a JSON object.
    const parsed = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new SyntaxError('Response parsed to a non-object value.');
    }

    return parsed;

  } catch (err) {
    // Avoid double-wrapping if already a GeminiError.
    if (err instanceof GeminiError) throw err;

    throw new GeminiError(
      `callGemini: request to model "${modelId}" failed — ${err.message}`,
      err
    );
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { callGemini, GeminiError };

