import { Router } from 'express';
import { env } from '../config/env.js';
import {
  mapRevenueCatProductToPlan,
  syncRevenueCatSubscription,
  expireSubscription,
  updateSubscriptionExpiration,
} from '../lib/subscription.js';

export const webhooksRouter = Router();

/**
 * POST /v1/webhooks/revenuecat
 * Webhook listener for RevenueCat subscription events.
 */
webhooksRouter.post('/revenuecat', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const configuredHeader = env.REVENUECAT_WEBHOOK_AUTH_HEADER;

    // Verify webhook authorization header if configured
    if (configuredHeader) {
      if (!authHeader || authHeader !== configuredHeader) {
        return res.status(401).json({ error: 'Unauthorized webhook request' });
      }
    }

    const { event } = req.body || {};
    if (!event || typeof event !== 'object' || !event.type) {
      return res.status(400).json({ error: 'Invalid or missing webhook event payload' });
    }

    // Handle RevenueCat test webhook ping
    if (event.type === 'TEST') {
      return res.status(200).json({ received: true, test: true });
    }

    const appUserId = event.app_user_id || event.original_app_user_id;
    if (!appUserId || typeof appUserId !== 'string') {
      return res.status(400).json({ error: 'Missing app_user_id in webhook event' });
    }

    const expiresAt = event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;
    const startedAt = event.purchased_at_ms
      ? new Date(event.purchased_at_ms).toISOString()
      : new Date().toISOString();

    const plan = mapRevenueCatProductToPlan(
      event.product_id,
      event.entitlement_id || event.entitlement_ids
    );

    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'PRODUCT_CHANGE': {
        await syncRevenueCatSubscription({
          appUserId,
          plan,
          expiresAt,
          startedAt,
        });
        return res.status(200).json({
          received: true,
          action: 'subscription_synced',
          plan,
          userId: appUserId,
        });
      }

      case 'CANCELLATION': {
        // In RevenueCat, CANCELLATION indicates auto-renew was disabled.
        // User retains access until period expires.
        if (expiresAt) {
          await updateSubscriptionExpiration(appUserId, expiresAt);
        }
        return res.status(200).json({
          received: true,
          action: 'cancellation_recorded',
          userId: appUserId,
        });
      }

      case 'EXPIRATION': {
        await expireSubscription(appUserId, expiresAt || new Date().toISOString());
        return res.status(200).json({
          received: true,
          action: 'subscription_expired',
          userId: appUserId,
        });
      }

      default: {
        return res.status(200).json({
          received: true,
          action: 'event_acknowledged',
          type: event.type,
        });
      }
    }
  } catch (err) {
    next(err);
  }
});
