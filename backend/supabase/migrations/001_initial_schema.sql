create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  avatar_path text,
  preferred_style text check (preferred_style in ('visual', 'analogy', 'step-by-step', 'socratic')),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  title text not null,
  subject text,
  teaching_strategy text not null check (teaching_strategy in ('visual', 'analogy', 'step-by-step', 'socratic')),
  content jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id)
);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null,
  user_id uuid not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  progress numeric(4,3) not null default 0 check (progress between 0 and 1),
  current_section_index integer not null default 0 check (current_section_index >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (lesson_id, user_id),
  foreign key (lesson_id, user_id) references public.lessons(id, user_id) on delete cascade
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null,
  user_id uuid not null,
  topic text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  content jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  foreign key (lesson_id, user_id) references public.lessons(id, user_id) on delete cascade
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null,
  user_id uuid not null,
  answers jsonb not null default '{}'::jsonb,
  score numeric(4,3) check (score between 0 and 1),
  mistake_topics jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default timezone('utc', now()),
  foreign key (quiz_id, user_id) references public.quizzes(id, user_id) on delete cascade
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null,
  user_id uuid not null,
  topic text not null,
  tag text not null check (tag in ('Concept', 'Insight', 'Visual', 'Reference')),
  summary text not null,
  content jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  foreign key (lesson_id, user_id) references public.lessons(id, user_id) on delete cascade
);

create table public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.progress_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid,
  quiz_id uuid,
  event_type text not null,
  topic text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (lesson_id) references public.lessons(id) on delete set null,
  foreign key (quiz_id) references public.quizzes(id) on delete set null
);

create index lessons_user_created_at_idx on public.lessons (user_id, created_at desc);
create index lesson_progress_user_status_idx on public.lesson_progress (user_id, status);
create index quizzes_lesson_id_idx on public.quizzes (lesson_id);
create index quiz_attempts_quiz_id_idx on public.quiz_attempts (quiz_id);
create index notes_user_created_at_idx on public.notes (user_id, created_at desc);
create index uploaded_files_user_created_at_idx on public.uploaded_files (user_id, created_at desc);
create index progress_events_user_created_at_idx on public.progress_events (user_id, created_at desc);
create index progress_events_event_type_idx on public.progress_events (event_type);

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger lessons_set_updated_at before update on public.lessons
for each row execute function public.set_updated_at();
create trigger lesson_progress_set_updated_at before update on public.lesson_progress
for each row execute function public.set_updated_at();
create trigger quizzes_set_updated_at before update on public.quizzes
for each row execute function public.set_updated_at();
create trigger notes_set_updated_at before update on public.notes
for each row execute function public.set_updated_at();
create trigger uploaded_files_set_updated_at before update on public.uploaded_files
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.notes enable row level security;
alter table public.uploaded_files enable row level security;
alter table public.progress_events enable row level security;

create policy "profiles_own_data" on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "lessons_own_data" on public.lessons
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "lesson_progress_own_data" on public.lesson_progress
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quizzes_own_data" on public.quizzes
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quiz_attempts_own_data" on public.quiz_attempts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notes_own_data" on public.notes
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "uploaded_files_own_data" on public.uploaded_files
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "progress_events_own_data" on public.progress_events
for all using (auth.uid() = user_id) with check (auth.uid() = user_id); 
