import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { env } from '../config/env.js';
import {
  loadOrInitSubscription,
  loadOrInitCredits,
  loadOrInitMonthlyUsage,
  mapRevenueCatProductToPlan,
  syncRevenueCatSubscription,
} from '../lib/subscription.js';
import { getPlanLimits, PLAN_LIMITS } from '../lib/ai-bridge.js';

export const subscriptionsRouter = Router();

/**
 * GET /v1/subscriptions/plans
 * Public endpoint returning available public plan definitions and limits.
 * Derives data directly from PLAN_LIMITS without duplication.
 * Internal plans such as 'mastery' are excluded.
 */
subscriptionsRouter.get('/plans', (_req, res) => {
  const publicPlans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'INR',
      period: 'month',
      ...PLAN_LIMITS.free,
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 199,
      currency: 'INR',
      period: 'month',
      ...PLAN_LIMITS.basic,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 399,
      currency: 'INR',
      period: 'month',
      ...PLAN_LIMITS.pro,
    },
    {
      id: 'advanced',
      name: 'Advanced',
      price: 699,
      currency: 'INR',
      period: 'month',
      ...PLAN_LIMITS.advanced,
    },
  ];

  res.status(200).json({ success: true, data: publicPlans });
});

/**
 * GET /v1/subscriptions/me
 * Authenticated endpoint returning the current user's entitlement, plan,
 * credits remaining/used, reset timestamp, and monthly usage.
 *
 * Strict requirements:
 *   - Authentication required via Bearer token
 *   - userId strictly from req.user.id (never from body or query)
 *   - Never trusts client plan data
 */
subscriptionsRouter.get('/me', authenticate, async (req, res, next) => {
  const userId = req.user.id;

  try {
    // 1. Load subscription (with plan expiration check)
    const { plan, expiresAt, isExpired, error: subErr } = await loadOrInitSubscription(userId);
    if (subErr) return next(subErr);

    // 2. Load rolling credit balance for this plan
    const { credits, error: creditsErr } = await loadOrInitCredits(userId, plan);
    if (creditsErr) return next(creditsErr);

    // 3. Load monthly lesson generation usage
    const { lessonsGenerated, error: usageErr } = await loadOrInitMonthlyUsage(userId);
    if (usageErr) return next(usageErr);

    // 4. Derive plan limits (mastery is an internal unlimited tier)
    const limits = plan === 'mastery'
      ? {
          creditsPerMonth: 999999,
          lessonsPerMonth: 999999,
          quizzesPerMonth: 'unlimited',
          maxQuizQuestions: 50,
          memoryType: 'full',
        }
      : getPlanLimits(plan);

    const payload = {
      plan,
      creditsRemaining: credits.credits_remaining,
      creditsUsed: credits.credits_used,
      resetAt: credits.reset_at,
      expiresAt: expiresAt ?? null,
      isExpired: Boolean(isExpired),
      monthlyUsage: {
        lessonsGenerated,
        lessonsLimit: plan === 'mastery' ? 999999 : limits.lessonsPerMonth,
      },
      limits,
    };

    // Return both top-level and in data wrapper for maximum client compatibility
    res.status(200).json({ success: true, data: payload, ...payload });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /v1/subscriptions/sync
 * Authenticated endpoint allowing the client to request an entitlement re-sync.
 * Note: The client cannot supply a plan or credits.
 * If REVENUECAT_SECRET_KEY is configured, queries RevenueCat API directly for verified subscriber info.
 * Otherwise returns the authoritative current database entitlement.
 */
subscriptionsRouter.post('/sync', authenticate, async (req, res, next) => {
  const userId = req.user.id;

  try {
    if (env.REVENUECAT_SECRET_KEY) {
      try {
        const rcRes = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
          headers: {
            Authorization: `Bearer ${env.REVENUECAT_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        if (rcRes.ok) {
          const subscriberData = await rcRes.json();
          const entitlements = subscriberData?.subscriber?.entitlements || {};
          let activeEntitlement = null;
          for (const [entId, entData] of Object.entries(entitlements)) {
            const exp = entData.expires_date ? new Date(entData.expires_date) : null;
            if (!exp || exp > new Date()) {
              activeEntitlement = { id: entId, ...entData };
              break;
            }
          }

          if (activeEntitlement) {
            const plan = mapRevenueCatProductToPlan(activeEntitlement.product_identifier, activeEntitlement.id);
            const expiresAt = activeEntitlement.expires_date
              ? new Date(activeEntitlement.expires_date).toISOString()
              : null;
            const startedAt = activeEntitlement.purchase_date
              ? new Date(activeEntitlement.purchase_date).toISOString()
              : new Date().toISOString();

            await syncRevenueCatSubscription({
              appUserId: userId,
              plan,
              expiresAt,
              startedAt,
            });
          }
        }
      } catch (rcErr) {
        console.warn('[Subscriptions] RevenueCat API sync warning:', rcErr?.message);
      }
    }

    // Return the updated authoritative entitlements
    const { plan, expiresAt, isExpired, error: subErr } = await loadOrInitSubscription(userId);
    if (subErr) return next(subErr);

    const { credits, error: creditsErr } = await loadOrInitCredits(userId, plan);
    if (creditsErr) return next(creditsErr);

    const { lessonsGenerated, error: usageErr } = await loadOrInitMonthlyUsage(userId);
    if (usageErr) return next(usageErr);

    const limits = plan === 'mastery'
      ? { creditsPerMonth: 999999, lessonsPerMonth: 999999, quizzesPerMonth: 'unlimited', maxQuizQuestions: 50, memoryType: 'full' }
      : getPlanLimits(plan);

    const payload = {
      plan,
      creditsRemaining: credits.credits_remaining,
      creditsUsed: credits.credits_used,
      resetAt: credits.reset_at,
      expiresAt: expiresAt ?? null,
      isExpired: Boolean(isExpired),
      monthlyUsage: {
        lessonsGenerated,
        lessonsLimit: plan === 'mastery' ? 999999 : limits.lessonsPerMonth,
      },
      limits,
    };

    res.status(200).json({ success: true, data: payload, ...payload });
  } catch (err) {
    next(err);
  }
});

