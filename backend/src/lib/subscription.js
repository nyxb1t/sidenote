import { supabase } from '../config/supabase.js';
import { getPlanLimits } from './ai-bridge.js';

/**
 * Loads or creates the subscription row. Defaults to 'free'.
 * If a paid subscription has expired (expires_at is in the past),
 * it safely falls back to 'free' without destroying historical records.
 */
export async function loadOrInitSubscription(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { plan: null, expiresAt: null, isExpired: false, error };

  if (data) {
    if (data.plan !== 'free' && data.expires_at) {
      const now = new Date();
      if (now > new Date(data.expires_at)) {
        return { plan: 'free', expiresAt: data.expires_at, isExpired: true, error: null };
      }
    }
    return { plan: data.plan, expiresAt: data.expires_at, isExpired: false, error: null };
  }

  // No subscription — create default free row
  const { data: created, error: createErr } = await supabase
    .from('subscriptions')
    .insert({ user_id: userId, plan: 'free' })
    .select('plan, expires_at')
    .single();

  return { plan: created?.plan ?? 'free', expiresAt: null, isExpired: false, error: createErr };
}

/**
 * Loads or creates the user_credits row for a user.
 * Resets credits if monthly reset_at has passed.
 */
export async function loadOrInitCredits(userId, planKey) {
  const { data, error } = await supabase
    .from('user_credits')
    .select('credits_remaining, credits_used, reset_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { credits: null, error };

  const limits = planKey === 'mastery'
    ? { creditsPerMonth: 999999 }
    : getPlanLimits(planKey);

  if (data) {
    const now = new Date();
    const resetAt = new Date(data.reset_at);
    if (now >= resetAt) {
      const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      const { data: reset, error: resetErr } = await supabase
        .from('user_credits')
        .update({
          credits_remaining: limits.creditsPerMonth,
          credits_used: 0,
          reset_at: nextReset.toISOString(),
        })
        .eq('user_id', userId)
        .select('credits_remaining, credits_used, reset_at')
        .single();
      if (resetErr) return { credits: null, error: resetErr };
      return { credits: reset, error: null };
    }
    return { credits: data, error: null };
  }

  // Row does not exist — create default row for the plan
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
    .select('credits_remaining, credits_used, reset_at')
    .single();

  return { credits: created, error: createErr };
}

/**
 * Loads (or creates) the current month's usage row and returns lessons_generated.
 */
export async function loadOrInitMonthlyUsage(userId) {
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

  if (error) return { lessonsGenerated: null, year, month, error };
  if (data) return { lessonsGenerated: data.lessons_generated, year, month, error: null };

  const { data: created, error: createErr } = await supabase
    .from('monthly_usage')
    .insert({ user_id: userId, year, month, lessons_generated: 0 })
    .select('lessons_generated')
    .single();

  return { lessonsGenerated: created?.lessons_generated ?? 0, year, month, error: createErr };
}

/**
 * Deducts one credit and increments credits_used.
 */
export async function deductOneCredit(userId) {
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
 * Increments the monthly lesson counter.
 */
export async function incrementMonthlyLessons(userId, year, month) {
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
 * Maps a RevenueCat product identifier or entitlement identifier to a canonical plan.
 * Returns 'basic', 'pro', 'advanced', or 'free'.
 * Never returns 'mastery' (mastery is an internal-only entitlement).
 */
export function mapRevenueCatProductToPlan(productId, entitlementIds) {
  const ids = [];
  if (productId) ids.push(String(productId).toLowerCase());
  if (typeof entitlementIds === 'string') ids.push(entitlementIds.toLowerCase());
  if (Array.isArray(entitlementIds)) {
    ids.push(...entitlementIds.map((e) => String(e).toLowerCase()));
  }

  const combined = ids.join(' ');
  // Avoid false positives like "product" containing "pro"
  if (/(^|[^a-z])advanced([^a-z]|$)/i.test(combined)) return 'advanced';
  if (/(^|[^a-z])pro([^a-z]|$)/i.test(combined)) return 'pro';
  if (/(^|[^a-z])basic([^a-z]|$)/i.test(combined)) return 'basic';

  return 'free';
}

/**
 * Synchronizes a verified RevenueCat subscription state with the database.
 * Updates public.subscriptions and aligns public.user_credits with plan limits.
 */
export async function syncRevenueCatSubscription({ appUserId, plan, expiresAt, startedAt }) {
  let targetPlan = plan;
  // Mastery must never be granted via in-app purchases
  if (targetPlan === 'mastery' || !['basic', 'pro', 'advanced'].includes(targetPlan)) {
    targetPlan = 'free';
  }

  // 1. Upsert subscriptions record
  const { data: subData, error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: appUserId,
      plan: targetPlan,
      started_at: startedAt || new Date().toISOString(),
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('plan, expires_at')
    .single();

  if (subError) {
    console.error('[Subscription] Failed to update subscription on sync:', subError);
    throw subError;
  }

  // 2. Align user_credits with the target plan's limits
  const limits = getPlanLimits(targetPlan);
  const now = new Date();
  const resetAt = expiresAt || new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();

  const { error: creditError } = await supabase
    .from('user_credits')
    .upsert({
      user_id: appUserId,
      credits_remaining: limits.creditsPerMonth,
      credits_used: 0,
      reset_at: resetAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (creditError) {
    console.error('[Subscription] Failed to align credits on sync:', creditError);
  }

  return subData;
}

/**
 * Updates an expired subscription to 'free' while preserving historical records.
 */
export async function expireSubscription(appUserId, expirationDate) {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      plan: 'free',
      expires_at: expirationDate || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', appUserId)
    .select('plan, expires_at')
    .single();

  if (error) {
    console.error('[Subscription] Failed to record expiration:', error);
    throw error;
  }

  return data;
}

/**
 * Updates the expiration timestamp (e.g. on cancellation where access continues until period end).
 */
export async function updateSubscriptionExpiration(appUserId, expiresAt) {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', appUserId)
    .select('plan, expires_at')
    .single();

  if (error) {
    console.error('[Subscription] Failed to update expiration:', error);
  }

  return data;
}

