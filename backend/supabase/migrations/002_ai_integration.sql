-- ============================================================
-- Migration 002: AI Integration Tables
-- ============================================================
-- Adds four tables required by the AI Intelligence Layer:
--   1. subscriptions  — user plan (free/basic/pro/advanced)
--   2. user_credits   — rolling credit balance
--   3. learner_models — persisted learner model JSON
--   4. monthly_usage  — per-user lesson generation counter
--
-- Does NOT touch any tables created in 001_initial_schema.sql.
-- Uses auth.uid() for RLS consistent with the existing schema.
-- ============================================================

-- ── 1. subscriptions ─────────────────────────────────────────

create table public.subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  plan        text not null default 'free'
                check (plan in ('free', 'basic', 'pro', 'advanced')),
  started_at  timestamptz not null default timezone('utc', now()),
  expires_at  timestamptz,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now()),
  unique (user_id)
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy "subscriptions_own_data" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 2. user_credits ──────────────────────────────────────────

create table public.user_credits (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  credits_remaining integer not null default 10 check (credits_remaining >= 0),
  credits_used      integer not null default 0  check (credits_used >= 0),
  reset_at          timestamptz not null default (date_trunc('month', timezone('utc', now())) + interval '1 month'),
  created_at        timestamptz not null default timezone('utc', now()),
  updated_at        timestamptz not null default timezone('utc', now()),
  unique (user_id)
);

create index user_credits_user_id_idx on public.user_credits (user_id);

create trigger user_credits_set_updated_at
  before update on public.user_credits
  for each row execute function public.set_updated_at();

alter table public.user_credits enable row level security;

create policy "user_credits_own_data" on public.user_credits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 3. learner_models ────────────────────────────────────────

create table public.learner_models (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  model      jsonb not null default '{
    "mastery":        {"overall": 0, "byTopic": {}},
    "weakAreas":      [],
    "knownTopics":    [],
    "mistakePatterns":[],
    "preferredStyle": null,
    "lastStrategy":   null,
    "sessionCount":   0,
    "goal":           null
  }'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id)
);

create index learner_models_user_id_idx on public.learner_models (user_id);

create trigger learner_models_set_updated_at
  before update on public.learner_models
  for each row execute function public.set_updated_at();

alter table public.learner_models enable row level security;

create policy "learner_models_own_data" on public.learner_models
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 4. monthly_usage ─────────────────────────────────────────

create table public.monthly_usage (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  year              integer not null check (year >= 2024),
  month             integer not null check (month between 1 and 12),
  lessons_generated integer not null default 0 check (lessons_generated >= 0),
  created_at        timestamptz not null default timezone('utc', now()),
  updated_at        timestamptz not null default timezone('utc', now()),
  unique (user_id, year, month)
);

create index monthly_usage_user_year_month_idx on public.monthly_usage (user_id, year, month);

create trigger monthly_usage_set_updated_at
  before update on public.monthly_usage
  for each row execute function public.set_updated_at();

alter table public.monthly_usage enable row level security;

create policy "monthly_usage_own_data" on public.monthly_usage
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
