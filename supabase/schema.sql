-- Supabase schema for Daily Fitness Loop
-- Safe to re-run when you need to repair a local or staging environment.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_emoji text,
  weekly_goal int not null default 4,
  created_at timestamptz not null default now()
);

alter table public.users add column if not exists display_name text;
alter table public.users add column if not exists avatar_emoji text;
alter table public.users add column if not exists weekly_goal int;
alter table public.users alter column weekly_goal set default 4;
update public.users set weekly_goal = 4 where weekly_goal is null;
alter table public.users alter column weekly_goal set not null;

create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  score int not null check (score >= 0 and score <= 100),
  level text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  completed boolean not null default true,
  workout_type text,
  duration_minutes int,
  note text,
  created_at timestamptz not null default now()
);

alter table public.workout_logs add column if not exists workout_type text;
alter table public.workout_logs add column if not exists duration_minutes int;
alter table public.workout_logs add column if not exists note text;
alter table public.workout_logs drop constraint if exists workout_logs_user_id_date_key;

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  workout_type text,
  duration_minutes int,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.workout_templates add column if not exists workout_type text;
alter table public.workout_templates add column if not exists duration_minutes int;
alter table public.workout_templates add column if not exists note text;
alter table public.workout_templates add column if not exists updated_at timestamptz not null default now();

create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  type text not null default 'general',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  content text not null check (char_length(content) <= 120),
  created_at timestamptz not null default now()
);

create index if not exists idx_test_results_user_created_at on public.test_results (user_id, created_at desc);
create index if not exists idx_workout_logs_user_date on public.workout_logs (user_id, date desc);
create index if not exists idx_workout_templates_user_updated_at on public.workout_templates (user_id, updated_at desc);
create index if not exists idx_feed_posts_created_at on public.feed_posts (created_at desc);
create index if not exists idx_feed_posts_user_created_at on public.feed_posts (user_id, created_at desc);
create index if not exists idx_likes_post_id on public.likes (post_id);
create index if not exists idx_comments_post_id on public.comments (post_id);

alter table public.users enable row level security;
alter table public.test_results enable row level security;
alter table public.workout_logs enable row level security;
alter table public.workout_templates enable row level security;
alter table public.feed_posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_workout_templates_updated_at'
      and tgrelid = 'public.workout_templates'::regclass
  ) then
    create trigger set_workout_templates_updated_at
    before update on public.workout_templates
    for each row
    execute function public.set_updated_at();
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'users' and policyname = 'users can read own profile'
  ) then
    create policy "users can read own profile"
    on public.users
    for select
    using (auth.uid() = id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'users' and policyname = 'users can insert own profile'
  ) then
    create policy "users can insert own profile"
    on public.users
    for insert
    with check (auth.uid() = id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'users' and policyname = 'users can update own profile'
  ) then
    create policy "users can update own profile"
    on public.users
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'test_results' and policyname = 'users can read own test results'
  ) then
    create policy "users can read own test results"
    on public.test_results
    for select
    using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'test_results' and policyname = 'users can insert own test results'
  ) then
    create policy "users can insert own test results"
    on public.test_results
    for insert
    with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workout_logs' and policyname = 'users can read own workout logs'
  ) then
    create policy "users can read own workout logs"
    on public.workout_logs
    for select
    using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workout_logs' and policyname = 'users can insert own workout logs'
  ) then
    create policy "users can insert own workout logs"
    on public.workout_logs
    for insert
    with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workout_logs' and policyname = 'users can update own workout logs'
  ) then
    create policy "users can update own workout logs"
    on public.workout_logs
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workout_logs' and policyname = 'users can delete own workout logs'
  ) then
    create policy "users can delete own workout logs"
    on public.workout_logs
    for delete
    using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workout_templates' and policyname = 'users can read own workout templates'
  ) then
    create policy "users can read own workout templates"
    on public.workout_templates
    for select
    using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workout_templates' and policyname = 'users can insert own workout templates'
  ) then
    create policy "users can insert own workout templates"
    on public.workout_templates
    for insert
    with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workout_templates' and policyname = 'users can update own workout templates'
  ) then
    create policy "users can update own workout templates"
    on public.workout_templates
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workout_templates' and policyname = 'users can delete own workout templates'
  ) then
    create policy "users can delete own workout templates"
    on public.workout_templates
    for delete
    using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feed_posts' and policyname = 'anyone can read feed posts'
  ) then
    create policy "anyone can read feed posts"
    on public.feed_posts
    for select
    using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feed_posts' and policyname = 'users can insert own feed posts'
  ) then
    create policy "users can insert own feed posts"
    on public.feed_posts
    for insert
    with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'likes' and policyname = 'anyone can read likes'
  ) then
    create policy "anyone can read likes"
    on public.likes
    for select
    using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'likes' and policyname = 'users can insert own likes'
  ) then
    create policy "users can insert own likes"
    on public.likes
    for insert
    with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'likes' and policyname = 'users can delete own likes'
  ) then
    create policy "users can delete own likes"
    on public.likes
    for delete
    using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comments' and policyname = 'anyone can read comments'
  ) then
    create policy "anyone can read comments"
    on public.comments
    for select
    using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comments' and policyname = 'users can insert own comments'
  ) then
    create policy "users can insert own comments"
    on public.comments
    for insert
    with check (auth.uid() = user_id);
  end if;
end
$$;

create or replace function public.get_public_leaderboard(limit_count int default 10)
returns table (
  user_id uuid,
  display_name text,
  avatar_emoji text,
  weekly_goal int,
  weekly_count bigint,
  total_workouts bigint,
  latest_score int,
  latest_level text
)
language sql
security definer
set search_path = public
as $$
  with latest_tests as (
    select distinct on (tr.user_id)
      tr.user_id,
      tr.score,
      tr.level
    from public.test_results tr
    order by tr.user_id, tr.created_at desc
  ),
  weekly_workouts as (
    select
      wl.user_id,
      count(*)::bigint as weekly_count
    from public.workout_logs wl
    where wl.completed = true
      and wl.date >= current_date - interval '6 day'
    group by wl.user_id
  ),
  total_workouts as (
    select
      wl.user_id,
      count(*)::bigint as total_workouts
    from public.workout_logs wl
    where wl.completed = true
    group by wl.user_id
  )
  select
    u.id as user_id,
    coalesce(nullif(u.display_name, ''), '게스트-' || left(u.id::text, 6)) as display_name,
    coalesce(u.avatar_emoji, 'RUN') as avatar_emoji,
    coalesce(u.weekly_goal, 4) as weekly_goal,
    coalesce(ww.weekly_count, 0) as weekly_count,
    coalesce(tw.total_workouts, 0) as total_workouts,
    lt.score as latest_score,
    lt.level as latest_level
  from public.users u
  left join latest_tests lt on lt.user_id = u.id
  left join weekly_workouts ww on ww.user_id = u.id
  left join total_workouts tw on tw.user_id = u.id
  order by
    coalesce(ww.weekly_count, 0) desc,
    coalesce(lt.score, 0) desc,
    coalesce(tw.total_workouts, 0) desc,
    u.created_at asc
  limit limit_count;
$$;

grant execute on function public.get_public_leaderboard(int) to anon, authenticated;
