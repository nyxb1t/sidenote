import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'url';
import pathMod from 'path';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.SUPABASE_STORAGE_BUCKET = 'sidenote-uploads';
process.env.FRONTEND_ORIGIN = 'http://localhost:8081';
process.env.REVENUECAT_WEBHOOK_AUTH_HEADER = 'Bearer test_secret_header_123';

const { app } = await import('../src/app.js');
const {
  mapRevenueCatProductToPlan,
  syncRevenueCatSubscription,
  expireSubscription,
} = await import('../src/lib/subscription.js');

const AUTH_HEADER = 'Bearer test_secret_header_123';
const TEST_UID = '00000000-0000-0000-0000-000000000099';

// ── Unit tests for mapRevenueCatProductToPlan ─────────────────────────────────

test('1. mapRevenueCatProductToPlan correctly identifies canonical plans', () => {
  assert.equal(mapRevenueCatProductToPlan('sidenote_basic_monthly', null), 'basic');
  assert.equal(mapRevenueCatProductToPlan(null, 'pro'), 'pro');
  assert.equal(mapRevenueCatProductToPlan('sidenote_advanced_yearly', ['advanced']), 'advanced');
  assert.equal(mapRevenueCatProductToPlan('basic_tier', []), 'basic');
});

test('2. mapRevenueCatProductToPlan defaults unknown products to free and NEVER returns mastery', () => {
  assert.equal(mapRevenueCatProductToPlan('unknown_product_xyz', null), 'free');
  assert.equal(mapRevenueCatProductToPlan('sidenote_mastery_lifetime', ['mastery']), 'free');
  assert.equal(mapRevenueCatProductToPlan(null, null), 'free');
});

// ── Integration tests for POST /v1/webhooks/revenuecat ───────────────────────

test('3. POST /v1/webhooks/revenuecat rejects missing/invalid authorization header with 401', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/v1/webhooks/revenuecat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: { type: 'TEST' } }),
    });
    assert.equal(res.status, 401);
  } finally {
    server.close();
  }
});

test('4. POST /v1/webhooks/revenuecat handles TEST event successfully', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/v1/webhooks/revenuecat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH_HEADER,
      },
      body: JSON.stringify({ event: { type: 'TEST' } }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.received, true);
    assert.equal(json.test, true);
  } finally {
    server.close();
  }
});

test('5. POST /v1/webhooks/revenuecat rejects payload without app_user_id (400)', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/v1/webhooks/revenuecat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH_HEADER,
      },
      body: JSON.stringify({ event: { type: 'INITIAL_PURCHASE' } }),
    });
    assert.equal(res.status, 400);
  } finally {
    server.close();
  }
});

test('6. POST /v1/webhooks/revenuecat acknowledges unhandled lifecycle events safely', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/v1/webhooks/revenuecat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH_HEADER,
      },
      body: JSON.stringify({
        event: {
          type: 'NON_RENEWING_PURCHASE',
          app_user_id: TEST_UID,
        },
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.received, true);
    assert.equal(json.action, 'event_acknowledged');
  } finally {
    server.close();
  }
});
