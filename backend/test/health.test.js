import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.SUPABASE_STORAGE_BUCKET = 'glint-uploads';
process.env.FRONTEND_ORIGIN = 'http://localhost:8081';

const { app } = await import('../src/app.js');

test('GET /v1/health returns ok', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: { status: 'ok' } });
  } finally {
    server.close();
  }
});

test('GET /v1/lessons requires authentication', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/lessons`);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
    });
  } finally {
    server.close();
  }
});

test('GET /v1/lessons/:id/progress requires authentication', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const response = await fetch(
      `http://127.0.0.1:${port}/v1/lessons/00000000-0000-0000-0000-000000000000/progress`,
    );
    assert.equal(response.status, 401);
  } finally {
    server.close();
  }
});

test('GET /v1/quizzes/:id requires authentication', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const response = await fetch(
      `http://127.0.0.1:${port}/v1/quizzes/00000000-0000-0000-0000-000000000000`,
    );
    assert.equal(response.status, 401);
  } finally {
    server.close();
  }
});

test('GET /v1/notes requires authentication', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/notes`);
    assert.equal(response.status, 401);
  } finally {
    server.close();
  }
});

test('GET /v1/files requires authentication', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/files`);
    assert.equal(response.status, 401);
  } finally {
    server.close();
  }
});

test('GET /v1/progress-events requires authentication', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/progress-events`);
    assert.equal(response.status, 401);
  } finally {
    server.close();
  }
});

test('invalid authorization scheme returns unauthorized', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/lessons`, {
      headers: { authorization: 'Basic invalid' },
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
    });
  } finally {
    server.close();
  }
});

test('unknown routes return JSON not found errors', async () => {
  const server = app.listen();
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/unknown`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: { code: 'NOT_FOUND', message: 'Not found' },
    });
  } finally {
    server.close();
  }
});
