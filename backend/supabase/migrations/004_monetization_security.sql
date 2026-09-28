-- ============================================================
-- Migration 004: Monetization Security Hardening
-- ============================================================
-- Restrict client-side permissions on monetization tables:
--   - public.subscriptions
--   - public.user_credits
--   - public.monthly_usage
--
-- Normal authenticated clients may only SELECT their own data.
-- Direct client INSERT, UPDATE, and DELETE are strictly forbidden.
-- Backend service_role operations continue to bypass RLS.
-- ============================================================

-- ── 1. subscriptions ─────────────────────────────────────────
-- Drop the overly permissive "for all" policy
drop policy if exists "subscriptions_own_data" on public.subscriptions;
drop policy if exists "subscriptions_select_own" on public.subscriptions;

-- Allow authenticated users to ONLY read their own subscription
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ── 2. user_credits ──────────────────────────────────────────
-- Drop the overly permissive "for all" policy
drop policy if exists "user_credits_own_data" on public.user_credits;
drop policy if exists "user_credits_select_own" on public.user_credits;

-- Allow authenticated users to ONLY read their own credit balance
create policy "user_credits_select_own" on public.user_credits
  for select using (auth.uid() = user_id);

-- ── 3. monthly_usage ─────────────────────────────────────────
-- Drop the overly permissive "for all" policy
drop policy if exists "monthly_usage_own_data" on public.monthly_usage;
drop policy if exists "monthly_usage_select_own" on public.monthly_usage;

-- Allow authenticated users to ONLY read their own monthly usage
create policy "monthly_usage_select_own" on public.monthly_usage
  for select using (auth.uid() = user_id);
