import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.routes.js';
import { filesRouter } from './routes/files.routes.js';
import { lessonsRouter } from './routes/lessons.routes.js';
import { notesRouter } from './routes/notes.routes.js';
import { progressEventsRouter } from './routes/progress-events.routes.js';
import { quizzesRouter } from './routes/quizzes.routes.js';
import { aiRouter } from './routes/ai.routes.js';
import { subscriptionsRouter } from './routes/subscriptions.routes.js';
import { webhooksRouter } from './routes/webhooks.routes.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_ORIGIN }));
app.use(express.json());
app.use('/v1/health', healthRouter);
app.use('/v1/files', filesRouter);
app.use('/v1/lessons', lessonsRouter);
app.use('/v1/notes', notesRouter);
app.use('/v1/progress-events', progressEventsRouter);
app.use('/v1/quizzes', quizzesRouter);
app.use('/v1/ai', aiRouter);
app.use('/v1/subscriptions', subscriptionsRouter);
app.use('/v1/webhooks', webhooksRouter);
app.use((req, res, next) => {
  next(Object.assign(new Error('Not found'), { statusCode: 404, code: 'NOT_FOUND' }));
});
app.use(errorHandler);

