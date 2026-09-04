'use strict';

/**
 * backend/ai/groq.js
 *
 * Groq AI provider wrapper (fallback provider).
 *
 * Exports:
 *   callGroq(prompt) → Promise<object>  — parsed JSON response
 *   GroqError                           — typed error class for all Groq failures
 *
 * Design notes:
 *   - GROQ_API_KEY and GROQ_MODEL are read inside callGroq(), not at
 *     module load time. Mirrors the same design as gemini.js.
 *   - The interface is intentionally identical to callGemini(prompt) so
 *     aiClient.js can swap providers transparently.
 *   - A system message instructs Groq to respond with valid JSON only.
 *     This is necessary because Groq's chat completion API does not yet
 *     support a native responseMimeType parameter.
 *   - All errors are caught and re-thrown as GroqError.
 */

const Groq = require('groq-sdk');

// ─── Typed error ──────────────────────────────────────────────────────────────

class GroqError extends Error {
  /**
   * @param {string} message       - Human-readable description of what failed.
   * @param {Error}  originalError - The underlying error that caused this failure.
   */
  constructor(message, originalError) {
    super(message);
    this.name          = 'GroqError';
    this.provider      = 'groq';
    this.originalError = originalError ?? null;
  }
}

// ─── Provider function ────────────────────────────────────────────────────────

/**
 * Sends a prompt to the Groq API and returns the parsed JSON response.
 *
 * @param {string} prompt - The complete prompt string built by a prompt builder.
 * @returns {Promise<object>} Parsed JSON object from the Groq response.
 * @throws {GroqError} On any failure: missing config, quota, auth, network,
 *                     or JSON parse error.
 */
async function callGroq(prompt) {
  // Read config inside the function — never at module load time.
  const apiKey  = process.env.GROQ_API_KEY;
  const modelId = process.env.GROQ_MODEL;

  if (!apiKey) {
    throw new GroqError(
      'callGroq: GROQ_API_KEY is not set in environment variables.',
      null
    );
  }
  if (!modelId) {
    throw new GroqError(
      'callGroq: GROQ_MODEL is not set in environment variables.',
      null
    );
  }

  try {
    const client = new Groq({ apiKey });

    const completion = await client.chat.completions.create({
      model:    modelId,
      messages: [
        {
          role:    'system',
          content: 'You are an expert AI tutor. Always respond with a single valid JSON object only. ' +
                   'Do not include any text, explanation, or markdown before or after the JSON.',
        },
        {
          role:    'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const text = completion.choices?.[0]?.message?.content ?? '';

    if (!text.trim()) {
      throw new SyntaxError('Groq returned an empty response.');
    }

    // Strip markdown code fences if the model wrapped its response.
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned
        .replace(/^```(?:json)?\s*\n?/, '')
        .replace(/\n?\s*```\s*$/, '');
    }

    // Parse and validate that the response is a JSON object.
    const parsed = JSON.parse(cleaned);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new SyntaxError('Response parsed to a non-object value.');
    }

    return parsed;

  } catch (err) {
    // Avoid double-wrapping if already a GroqError.
    if (err instanceof GroqError) throw err;

    throw new GroqError(
      `callGroq: request to model "${modelId}" failed — ${err.message}`,
      err
    );
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { callGroq, GroqError };

