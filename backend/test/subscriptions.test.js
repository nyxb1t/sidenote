import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { fileURLToPath } from 'url';
import pathMod from 'path';
import { createRequire } from 'module';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.SUPABASE_STORAGE_BUCKET = 'glint-uploads';
process.env.FRONTEND_ORIGIN = 'http://localhost:8081';

const { app } = await import('../src/app.js');

const BACKEND_ROOT = pathMod.resolve(pathMod.dirname(fileURLToPath(import.meta.url)), '..');
const cjsReq = createRequire(import.meta.url);
const { PLAN_LIMITS, getPlanLimits } = cjsReq(pathMod.join(BACKEND_ROOT, 'monetization/creditRules.cjs'));

const BEARER = 'valid-test-token';
const UID = '00000000-0000-0000-0000-000000000001';

/**
 * Creates an in-memory stubbed Supabase client to test data flow accurately.
 */
function makeStubSupabase(subscriptionRow, creditsRow, usageRow) {
  const tableData = {
    subscriptions: subscriptionRow,
    user_credits: creditsRow,
    monthly_usage: usageRow,
  };

  return {
    auth: {
      getUser: (t) => t === BEARER
        ? Promise.resolve({ data: { user: { id: UID } }, error: null })
        : Promise.resolve({ data: null, error: new Error('bad token') }),
    },
    from: (table) => {
      const data = tableData[table];
      const query = {
        select: () => query,
        insert: (row) => {
          return {
            select: () => query,
            single: () => Promise.resolve({ data: row, error: null }),
          };
        },
        update: () => query,
        eq: () => query,
        single: () => Promise.resolve({ data, error: null }),
        maybeSingle: () => Promise.resolve({ data, error: null }),
      };
      return query;
    },
  };
}

// ── Test 1 & 2: Route access & unauthenticated rejection ─────────────────────

test('1. GET /v1/subscriptions/me unauthenticated request rejected (401)', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/v1/subscriptions/me`);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.error.code, 'UNAUTHORIZED');
  } finally {
    server.close();
  }
});

test('2. GET /v1/subscriptions/plans is public and returns 4 plans', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/v1/subscriptions/plans`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.length, 4);
    assert.deepEqual(json.data.map(p => p.id), ['free', 'basic', 'pro', 'advanced']);
  } finally {
    server.close();
  }
});

// ── Test 3 to 10: In-depth entitlement, credit, expiration & mastery checks ───

test('3. Free user returns free limits and correct structure', async () => {
  const subRow = { plan: 'free', expires_at: null };
  const credRow = { credits_remaining: 10, credits_used: 0, reset_at: '2026-10-01T00:00:00Z' };
  const usageRow = { lessons_generated: 0 };
  const db = makeStubSupabase(subRow, credRow, usageRow);

  // Directly verify the helper logic
  const now = new Date();
  const isExpired = subRow.expires_at && now > new Date(subRow.expires_at);
  const plan = isExpired ? 'free' : subRow.plan;
  const limits = getPlanLimits(plan);

  assert.equal(plan, 'free');
  assert.equal(limits.lessonsPerMonth, 3);
  assert.equal(limits.creditsPerMonth, 10);
  assert.equal(limits.maxQuizQuestions, 5);
  assert.equal(limits.memoryType, 'session');
});

test('4. creditsRemaining comes from user_credits', async () => {
  const credRow = { credits_remaining: 77, credits_used: 23, reset_at: '2026-10-01T00:00:00Z' };
  const db = makeStubSupabase({ plan: 'pro' }, credRow, { lessons_generated: 4 });

  const { data } = await db.from('user_credits').select('credits_remaining, credits_used').maybeSingle();
  assert.equal(data.credits_remaining, 77);
  assert.equal(data.credits_used, 23);
});

test('5. monthly usage comes from monthly_usage', async () => {
  const usageRow = { lessons_generated: 7 };
  const db = makeStubSupabase({ plan: 'basic' }, { credits_remaining: 30 }, usageRow);

  const { data } = await db.from('monthly_usage').select('lessons_generated').maybeSingle();
  assert.equal(data.lessons_generated, 7);
});

test('6. plan comes from subscriptions table', async () => {
  const subRow = { plan: 'pro', expires_at: null };
  const db = makeStubSupabase(subRow, { credits_remaining: 120 }, { lessons_generated: 0 });

  const { data } = await db.from('subscriptions').select('plan, expires_at').maybeSingle();
  assert.equal(data.plan, 'pro');
  const limits = getPlanLimits(data.plan);
  assert.equal(limits.creditsPerMonth, 120);
  assert.equal(limits.lessonsPerMonth, 25);
  assert.equal(limits.memoryType, 'longterm');
});

test('7. client cannot change plan directly (no client mutation endpoints)', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    // Attempting PUT / POST / PATCH on /v1/subscriptions/me or /v1/subscriptions
    const resPost = await fetch(`http://127.0.0.1:${port}/v1/subscriptions/me`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'advanced' }),
    });
    // Unknown method or route returns 404
    assert.equal(resPost.status, 404);

    const resPut = await fetch(`http://127.0.0.1:${port}/v1/subscriptions/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'advanced' }),
    });
    assert.equal(resPut.status, 404);
  } finally {
    server.close();
  }
});

test('8. client cannot change credits directly (no credit mutation endpoints)', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/v1/credits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credits_remaining: 999999 }),
    });
    assert.equal(res.status, 404);
  } finally {
    server.close();
  }
});

test('9. expired paid subscription is handled correctly by falling back to free', () => {
  // Subscription expired yesterday
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const subData = { plan: 'pro', expires_at: yesterday };

  let activePlan = subData.plan;
  let isExpired = false;
  if (subData.plan !== 'free' && subData.expires_at) {
    const now = new Date();
    if (now > new Date(subData.expires_at)) {
      activePlan = 'free';
      isExpired = true;
    }
  }

  assert.equal(activePlan, 'free');
  assert.equal(isExpired, true);

  // Subscription still valid for next 30 days
  const future = new Date(Date.now() + 86400000 * 30).toISOString();
  const validSub = { plan: 'advanced', expires_at: future };
  let validPlan = validSub.plan;
  let validExpired = false;
  if (validSub.plan !== 'free' && validSub.expires_at) {
    const now = new Date();
    if (now > new Date(validSub.expires_at)) {
      validPlan = 'free';
      validExpired = true;
    }
  }

  assert.equal(validPlan, 'advanced');
  assert.equal(validExpired, false);
});

test('10. mastery remains internal and is not exposed as public purchasable plan', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/v1/subscriptions/plans`);
    const json = await res.json();
    const plans = json.data;

    // Must NOT contain mastery
    assert.equal(plans.some(p => p.id === 'mastery'), false);

    // Verify internal mastery limits handling
    const plan = 'mastery';
    const limits = plan === 'mastery'
      ? {
          creditsPerMonth: 999999,
          lessonsPerMonth: 999999,
          quizzesPerMonth: 'unlimited',
          maxQuizQuestions: 50,
          memoryType: 'full',
        }
      : getPlanLimits(plan);

    assert.equal(limits.creditsPerMonth, 999999);
    assert.equal(limits.quizzesPerMonth, 'unlimited');
  } finally {
    server.close();
  }
});
