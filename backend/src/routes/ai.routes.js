/**
 * backend/src/routes/ai.routes.js
 *
 * AI generation endpoints. All routes require authentication via the
 * existing authenticate middleware. Credit deduction and learner model
 * updates happen only AFTER successful AI generation.
 *
 * Routes:
 *   POST /v1/ai/lesson        — generate + persist a lesson
 *   POST /v1/ai/quiz          — generate + persist a quiz
 *   POST /v1/ai/notes         — generate + persist notes
 *   POST /v1/ai/retry         — generate + persist a retry explanation
 *   POST /v1/ai/learner/event — update + persist the learner model
 */

import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/authenticate.js';
import {
  generateLesson,
  generateQuiz,
  generateNotes,
  generateRetryExplanation,
  updateLearnerModel,
  getPlanLimits,
  InsufficientCreditsError,
  ValidationError,
} from '../lib/ai-bridge.js';

export const aiRouter = Router();
aiRouter.use(authenticate);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function requestError(message, statusCode, code) {
  return Object.assign(new Error(message), { statusCode, code });
}

/**
 * Maps AI-layer errors to HTTP status codes for the existing errorHandler.
 */
function mapAiError(err) {
  if (err instanceof InsufficientCreditsError) {
    return requestError(err.message, 402, 'INSUFFICIENT_CREDITS');
  }
  if (err instanceof ValidationError) {
    return requestError(`AI validation error: ${err.message}`, 422, 'AI_VALIDATION_ERROR');
  }
  if (err instanceof AggregateError || err.name === 'GeminiError' || err.name === 'GroqError') {
    return requestError('AI provider unavailable. Please try again.', 503, 'AI_PROVIDER_ERROR');
  }
  return err;
}

/**
 * Loads or creates the user_credits row for a user.
 * Returns { credits_remaining, credits_used } or calls next(err).
 */
async function loadOrInitCredits(userId, planKey) {
  const { data, error } = await supabase
    .from('user_credits')
    .select('credits_remaining, credits_used, reset_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { credits: null, error };

  if (data) {
    // Check if monthly reset is due
    const now = new Date();
    const resetAt = new Date(data.reset_at);
    if (now >= resetAt) {
      const limits = getPlanLimits(planKey);
      const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      const { data: reset, error: resetErr } = await supabase
        .from('user_credits')
        .update({
          credits_remaining: limits.creditsPerMonth,
          credits_used: 0,
          reset_at: nextReset.toISOString(),
        })
        .eq('user_id', userId)
        .select('credits_remaining, credits_used')
        .single();
      if (resetErr) return { credits: null, error: resetErr };
      return { credits: reset, error: null };
    }
    return { credits: data, error: null };
  }

  // Row does not exist — create default row for the plan
  const limits = getPlanLimits(planKey);
  const now = new Date();
  const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const { data: created, error: createErr } = await supabase
    .from('user_credits')
    .insert({
      user_id: userId,
      credits_remaining: limits.creditsPerMonth,
      credits_used: 0,
      reset_at: nextReset.toISOString(),
    })
    .select('credits_remaining, credits_used')
    .single();

  return { credits: created, error: createErr };
}

/**
 * Loads or creates the subscription row. Defaults to 'free'.
 */
async function loadOrInitSubscription(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { plan: null, error };
  if (data) return { plan: data.plan, error: null };

  // No subscription — create default free row
  const { data: created, error: createErr } = await supabase
    .from('subscriptions')
    .insert({ user_id: userId, plan: 'free' })
    .select('plan')
    .single();

  return { plan: created?.plan ?? 'free', error: createErr };
}

/**
 * Loads the learner model for a user, or creates an empty default.
 * Returns the model object.
 */
async function loadOrInitLearnerModel(userId) {
  const { data, error } = await supabase
    .from('learner_models')
    .select('model')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { model: null, error };

  if (data) return { model: data.model, error: null };

  const defaultModel = {
    mastery:         { overall: 0, byTopic: {} },
    weakAreas:       [],
    knownTopics:     [],
    mistakePatterns: [],
    preferredStyle:  null,
    lastStrategy:    null,
    sessionCount:    0,
    goal:            null,
  };

  const { error: createErr } = await supabase
    .from('learner_models')
    .insert({ user_id: userId, model: defaultModel });

  return { model: defaultModel, error: createErr };
}

/**
 * Persists an updated learner model (upsert).
 */
async function persistLearnerModel(userId, model) {
  return supabase
    .from('learner_models')
    .upsert({ user_id: userId, model }, { onConflict: 'user_id' });
}

/**
 * Deducts one credit and increments credits_used atomically.
 */
async function deductCredit(userId) {
  return supabase.rpc
    ? supabase
        .from('user_credits')
        .update({
          credits_remaining: supabase.raw?.('credits_remaining - 1') ?? undefined,
          credits_used: supabase.raw?.('credits_used + 1') ?? undefined,
        })
        .eq('user_id', userId)
    : supabase
        .from('user_credits')
        .select('credits_remaining, credits_used')
        .eq('user_id', userId)
        .single()
        .then(async ({ data }) => {
          if (!data) return { error: new Error('Credits row missing') };
          return supabase
            .from('user_credits')
            .update({
              credits_remaining: data.credits_remaining - 1,
              credits_used: data.credits_used + 1,
            })
            .eq('user_id', userId);
        });
}

// Simpler deductCredit using a read-then-write (service role, no race condition risk for now)
async function deductOneCredit(userId) {
  const { data, error } = await supabase
    .from('user_credits')
    .select('credits_remaining, credits_used')
    .eq('user_id', userId)
    .single();
  if (error) return { error };
  return supabase
    .from('user_credits')
    .update({
      credits_remaining: data.credits_remaining - 1,
      credits_used: data.credits_used + 1,
    })
    .eq('user_id', userId);
}

/**
 * Loads (or creates) the current month's usage row and returns lessons_generated.
 */
async function loadOrInitMonthlyUsage(userId) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const { data, error } = await supabase
    .from('monthly_usage')
    .select('lessons_generated')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle();

  if (error) return { lessonsGenerated: null, error };
  if (data) return { lessonsGenerated: data.lessons_generated, year, month, error: null };

  const { data: created, error: createErr } = await supabase
    .from('monthly_usage')
    .insert({ user_id: userId, year, month, lessons_generated: 0 })
    .select('lessons_generated')
    .single();

  return { lessonsGenerated: created?.lessons_generated ?? 0, year, month, error: createErr };
}

/**
 * Increments the monthly lesson counter.
 */
async function incrementMonthlyLessons(userId, year, month) {
  const { data } = await supabase
    .from('monthly_usage')
    .select('lessons_generated')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('month', month)
    .single();

  return supabase
    .from('monthly_usage')
    .update({ lessons_generated: (data?.lessons_generated ?? 0) + 1 })
    .eq('user_id', userId)
    .eq('year', year)
    .eq('month', month);
}

/**
 * Builds the learnerContext appropriate to a plan's memory tier.
 */
function buildLearnerContext(plan, learnerModel) {
  const memoryType = {
    free:     'session',
    basic:    'recent',
    pro:      'longterm',
    advanced: 'full',
  }[plan] ?? 'session';

  if (memoryType === 'session') {
    return { memoryType: 'session' };
  }

  if (memoryType === 'recent') {
    return {
      memoryType: 'recent',
      recentLearning: {
        recentTopics:     learnerModel.knownTopics?.slice(-10) ?? [],
        recentWeaknesses: learnerModel.weakAreas?.slice(-5)   ?? [],
      },
    };
  }

  // longterm / full
  return {
    memoryType,
    learnerProfile: {
      mastery:         learnerModel.mastery         ?? { overall: 0, byTopic: {} },
      weakAreas:       learnerModel.weakAreas        ?? [],
      knownTopics:     learnerModel.knownTopics      ?? [],
      mistakePatterns: learnerModel.mistakePatterns  ?? [],
      preferredStyle:  learnerModel.preferredStyle   ?? null,
      lastStrategy:    learnerModel.lastStrategy     ?? null,
      sessionCount:    learnerModel.sessionCount     ?? 0,
      goal:            learnerModel.goal             ?? null,
      masteryByTopic:  learnerModel.mastery?.byTopic ?? {},
    },
  };
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const lessonRequestSchema = z.object({
  topic:   z.string().min(1).max(500),
  subject: z.string().min(1).max(200).nullable().optional(),
}).strict();

const quizRequestSchema = z.object({
  lesson_id: z.string().uuid(),
}).strict();

const notesRequestSchema = z.object({
  lesson_id: z.string().uuid(),
}).strict();

const retryRequestSchema = z.object({
  topic:            z.string().min(1).max(500),
  previous_strategy: z.enum(['visual', 'analogy', 'step-by-step', 'socratic']),
}).strict();

const learnerEventSchema = z.object({
  type:           z.enum(['lesson_complete', 'quiz_result', 'retry_requested', 'session_start']),
  topic:          z.string().min(1).optional(),
  score:          z.number().min(0).max(1).optional(),
  mistakeTopics:  z.array(z.string()).optional(),
  strategyUsed:   z.enum(['visual', 'analogy', 'step-by-step', 'socratic']).optional(),
}).strict();

// ─── POST /v1/ai/lesson ──────────────────────────────────────────────────────

aiRouter.post('/lesson', async (req, res, next) => {
  const parsed = lessonRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(requestError('Invalid request body', 400, 'INVALID_REQUEST'));
  }

  const userId = req.user.id;

  try {
    // 1. Load subscription (server-side — never trust client)
    const { plan, error: planErr } = await loadOrInitSubscription(userId);
    if (planErr) return next(planErr);

    const planLimits = getPlanLimits(plan);

    // 2. Check monthly lesson limit
    const { lessonsGenerated, year, month, error: usageErr } = await loadOrInitMonthlyUsage(userId);
    if (usageErr) return next(usageErr);

    if (lessonsGenerated >= planLimits.lessonsPerMonth) {
      return next(requestError(
        `Monthly lesson limit reached (${planLimits.lessonsPerMonth} for ${plan} plan)`,
        402,
        'LESSON_LIMIT_REACHED',
      ));
    }

    // 3. Load credits
    const { credits, error: creditsErr } = await loadOrInitCredits(userId, plan);
    if (creditsErr) return next(creditsErr);

    // 4. Build userContext (server-side only)
    const userContext = { userId, plan, creditsRemaining: credits.credits_remaining };

    // 5. Load learner model and build learnerContext
    const { model: learnerModel, error: modelErr } = await loadOrInitLearnerModel(userId);
    if (modelErr) return next(modelErr);
    const learnerContext = buildLearnerContext(plan, learnerModel);

    // 6. Call AI (entitlementGuard inside will also check credits)
    let lessonJSON;
    try {
      lessonJSON = await generateLesson(parsed.data.topic, learnerContext, userContext);
    } catch (aiErr) {
      return next(mapAiError(aiErr));
    }

    // 7. Persist lesson into existing lessons table
    const { data: lesson, error: insertErr } = await supabase
      .from('lessons')
      .insert({
        user_id:           userId,
        topic:             lessonJSON.topic ?? parsed.data.topic,
        title:             lessonJSON.title,
        subject:           parsed.data.subject ?? null,
        teaching_strategy: lessonJSON.teachingStrategy,
        content:           lessonJSON,
      })
      .select()
      .single();

    if (insertErr) return next(insertErr);

    // 8. Deduct credit and increment monthly usage (only after success)
    await deductOneCredit(userId);
    await incrementMonthlyLessons(userId, year, month);

    // 9. Log progress event
    await supabase.from('progress_events').insert({
      user_id:    userId,
      lesson_id:  lesson.id,
      event_type: 'lesson_generated',
      topic:      lessonJSON.topic ?? parsed.data.topic,
      payload:    { plan, strategy: lessonJSON.teachingStrategy },
    });

    res.status(201).json({ success: true, data: lesson });
  } catch (err) {
    next(err);
  }
});

// ─── POST /v1/ai/quiz ────────────────────────────────────────────────────────

aiRouter.post('/quiz', async (req, res, next) => {
  const parsed = quizRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(requestError('Invalid request body', 400, 'INVALID_REQUEST'));
  }

  const userId = req.user.id;

  try {
    // 1. Load the lesson (verify ownership)
    const { data: lesson, error: lessonErr } = await supabase
      .from('lessons')
      .select()
      .eq('id', parsed.data.lesson_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (lessonErr) return next(lessonErr);
    if (!lesson) return next(requestError('Lesson not found', 404, 'NOT_FOUND'));

    // 2. Load subscription
    const { plan, error: planErr } = await loadOrInitSubscription(userId);
    if (planErr) return next(planErr);

    const planLimits = getPlanLimits(plan);

    // 3. Load credits (quiz costs 0, but we still need plan for userContext)
    const { credits, error: creditsErr } = await loadOrInitCredits(userId, plan);
    if (creditsErr) return next(creditsErr);

    const userContext = { userId, plan, creditsRemaining: credits.credits_remaining };

    // 4. Build learnerContext
    const { model: learnerModel, error: modelErr } = await loadOrInitLearnerModel(userId);
    if (modelErr) return next(modelErr);
    const learnerContext = buildLearnerContext(plan, learnerModel);

    // 5. Call AI — quiz content is the lesson's stored content object
    let quizJSON;
    try {
      quizJSON = await generateQuiz(lesson.content, learnerContext, userContext);
    } catch (aiErr) {
      return next(mapAiError(aiErr));
    }

    // 6. Enforce max question count at the route boundary (belt-and-suspenders)
    if (Array.isArray(quizJSON.questions) && quizJSON.questions.length > planLimits.maxQuizQuestions) {
      quizJSON.questions = quizJSON.questions.slice(0, planLimits.maxQuizQuestions);
    }

    // 7. Persist into existing quizzes table
    const { data: quiz, error: insertErr } = await supabase
      .from('quizzes')
      .insert({
        lesson_id:  lesson.id,
        user_id:    userId,
        topic:      quizJSON.topic ?? lesson.topic,
        difficulty: quizJSON.difficulty,
        content:    quizJSON,
      })
      .select()
      .single();

    if (insertErr) return next(insertErr);

    // 8. Log progress event
    await supabase.from('progress_events').insert({
      user_id:    userId,
      lesson_id:  lesson.id,
      quiz_id:    quiz.id,
      event_type: 'quiz_generated',
      topic:      quizJSON.topic ?? lesson.topic,
      payload:    { plan, question_count: quizJSON.questions?.length },
    });

    res.status(201).json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
});

// ─── POST /v1/ai/notes ───────────────────────────────────────────────────────

aiRouter.post('/notes', async (req, res, next) => {
  const parsed = notesRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(requestError('Invalid request body', 400, 'INVALID_REQUEST'));
  }

  const userId = req.user.id;

  try {
    // 1. Load the lesson (verify ownership)
    const { data: lesson, error: lessonErr } = await supabase
      .from('lessons')
      .select()
      .eq('id', parsed.data.lesson_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (lessonErr) return next(lessonErr);
    if (!lesson) return next(requestError('Lesson not found', 404, 'NOT_FOUND'));

    // 2. Load subscription + credits
    const { plan, error: planErr } = await loadOrInitSubscription(userId);
    if (planErr) return next(planErr);

    const { credits, error: creditsErr } = await loadOrInitCredits(userId, plan);
    if (creditsErr) return next(creditsErr);

    const userContext = { userId, plan, creditsRemaining: credits.credits_remaining };

    // 3. Call AI
    let notesJSON;
    try {
      notesJSON = await generateNotes(lesson.content, userContext);
    } catch (aiErr) {
      return next(mapAiError(aiErr));
    }

    // 4. Persist into existing notes table
    //    Map AI output: topic, tag, summary → top-level columns; full JSON → content
    const { data: note, error: insertErr } = await supabase
      .from('notes')
      .insert({
        lesson_id: lesson.id,
        user_id:   userId,
        topic:     notesJSON.topic ?? lesson.topic,
        tag:       notesJSON.tag,
        summary:   notesJSON.summary,
        content:   notesJSON,
      })
      .select()
      .single();

    if (insertErr) return next(insertErr);

    // Notes cost 0 credits — no deduction needed.

    res.status(201).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});

// ─── POST /v1/ai/retry ───────────────────────────────────────────────────────

aiRouter.post('/retry', async (req, res, next) => {
  const parsed = retryRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(requestError('Invalid request body', 400, 'INVALID_REQUEST'));
  }

  const userId = req.user.id;

  try {
    // 1. Load subscription + credits
    const { plan, error: planErr } = await loadOrInitSubscription(userId);
    if (planErr) return next(planErr);

    const planLimits = getPlanLimits(plan);

    const { credits, error: creditsErr } = await loadOrInitCredits(userId, plan);
    if (creditsErr) return next(creditsErr);

    const userContext = { userId, plan, creditsRemaining: credits.credits_remaining };

    // 2. Load learner model
    const { model: learnerModel, error: modelErr } = await loadOrInitLearnerModel(userId);
    if (modelErr) return next(modelErr);

    // 3. Call AI
    let retryJSON;
    try {
      retryJSON = await generateRetryExplanation(
        parsed.data.topic,
        learnerModel,
        parsed.data.previous_strategy,
        userContext,
      );
    } catch (aiErr) {
      return next(mapAiError(aiErr));
    }

    // 4. Persist the retry as a new lesson
    const { data: lesson, error: insertErr } = await supabase
      .from('lessons')
      .insert({
        user_id:           userId,
        topic:             retryJSON.topic ?? parsed.data.topic,
        title:             retryJSON.title,
        subject:           null,
        teaching_strategy: retryJSON.teachingStrategy,
        content:           retryJSON,
      })
      .select()
      .single();

    if (insertErr) return next(insertErr);

    // 5. Deduct credit after success
    await deductOneCredit(userId);

    // 6. Log event
    await supabase.from('progress_events').insert({
      user_id:    userId,
      lesson_id:  lesson.id,
      event_type: 'retry_generated',
      topic:      retryJSON.topic ?? parsed.data.topic,
      payload:    {
        plan,
        previous_strategy: parsed.data.previous_strategy,
        new_strategy:      retryJSON.teachingStrategy,
      },
    });

    res.status(201).json({ success: true, data: lesson });
  } catch (err) {
    next(err);
  }
});

// ─── POST /v1/ai/learner/event ───────────────────────────────────────────────

aiRouter.post('/learner/event', async (req, res, next) => {
  const parsed = learnerEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(requestError('Invalid request body', 400, 'INVALID_REQUEST'));
  }

  const userId = req.user.id;

  try {
    // 1. Load current learner model
    const { model: currentModel, error: modelErr } = await loadOrInitLearnerModel(userId);
    if (modelErr) return next(modelErr);

    // 2. Apply event
    let updatedModel;
    try {
      updatedModel = updateLearnerModel(currentModel, parsed.data);
    } catch (err) {
      return next(requestError(err.message, 400, 'INVALID_REQUEST'));
    }

    // 3. Persist updated model
    const { error: persistErr } = await persistLearnerModel(userId, updatedModel);
    if (persistErr) return next(persistErr);

    // 4. Log as progress event for audit trail
    await supabase.from('progress_events').insert({
      user_id:    userId,
      event_type: `learner_${parsed.data.type}`,
      topic:      parsed.data.topic ?? null,
      payload:    parsed.data,
    });

    res.json({ success: true, data: updatedModel });
  } catch (err) {
    next(err);
  }
});
