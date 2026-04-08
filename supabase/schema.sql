-- Supabase schema for Daily Fitness Loop
-- Safe to re-run when you need to repair a local or staging environment.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_emoji text,
  avatar_url text,
  weekly_goal int not null default 4,
  height_cm numeric(5,2),
  target_weight_kg numeric(5,2),
  bio text,
  fitness_tags jsonb not null default '[]'::jsonb,
  default_share_to_feed boolean not null default true,
  reminder_enabled boolean not null default false,
  reminder_time text not null default '19:00',
  total_xp int not null default 0,
  weekly_points int not null default 0,
  activity_level int not null default 1,
  activity_level_label text not null default 'Starter',
  streak_days int not null default 0,
  last_activity_date date,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users add column if not exists display_name text;
alter table public.users add column if not exists avatar_emoji text;
alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists weekly_goal int;
alter table public.users add column if not exists height_cm numeric(5,2);
alter table public.users add column if not exists target_weight_kg numeric(5,2);
alter table public.users add column if not exists bio text;
alter table public.users add column if not exists fitness_tags jsonb not null default '[]'::jsonb;
alter table public.users add column if not exists default_share_to_feed boolean not null default true;
alter table public.users add column if not exists reminder_enabled boolean not null default false;
alter table public.users add column if not exists reminder_time text not null default '19:00';
alter table public.users add column if not exists total_xp int not null default 0;
alter table public.users add column if not exists weekly_points int not null default 0;
alter table public.users add column if not exists activity_level int not null default 1;
alter table public.users add column if not exists activity_level_label text not null default 'Starter';
alter table public.users add column if not exists streak_days int not null default 0;
alter table public.users add column if not exists last_activity_date date;
alter table public.users add column if not exists is_admin boolean not null default false;
alter table public.users alter column weekly_goal set default 4;
update public.users set weekly_goal = 4 where weekly_goal is null;
update public.users set fitness_tags = '[]'::jsonb where fitness_tags is null;
update public.users set reminder_time = '19:00' where reminder_time is null or reminder_time = '';
update public.users set total_xp = 0 where total_xp is null;
update public.users set weekly_points = 0 where weekly_points is null;
update public.users set activity_level = 1 where activity_level is null;
update public.users set activity_level_label = 'Starter' where activity_level_label is null or activity_level_label = '';
update public.users set streak_days = 0 where streak_days is null;
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
  estimated_calories int,
  note text,
  photo_url text,
  photo_urls jsonb not null default '[]'::jsonb,
  share_to_feed boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.workout_logs add column if not exists workout_type text;
alter table public.workout_logs add column if not exists duration_minutes int;
alter table public.workout_logs add column if not exists estimated_calories int;
alter table public.workout_logs add column if not exists note text;
alter table public.workout_logs add column if not exists photo_url text;
alter table public.workout_logs add column if not exists photo_urls jsonb not null default '[]'::jsonb;
alter table public.workout_logs add column if not exists share_to_feed boolean not null default true;
update public.workout_logs
set photo_urls = case
  when photo_url is not null and coalesce(jsonb_array_length(photo_urls), 0) = 0 then jsonb_build_array(photo_url)
  else coalesce(photo_urls, '[]'::jsonb)
end;
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

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  weight_kg numeric(5,2) not null check (weight_kg > 0 and weight_kg < 500),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null,
  xp_amount int not null default 0 check (xp_amount >= 0 and xp_amount <= 200),
  weekly_points int not null default 0 check (weekly_points >= 0 and weekly_points <= 200),
  reference_type text,
  reference_id uuid,
  week_key date not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, event_type, reference_type, reference_id)
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  badge_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_key)
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
  visibility_status text not null default 'visible' check (visibility_status in ('visible', 'hidden_by_admin', 'hidden_by_author')),
  hidden_at timestamptz,
  hidden_by uuid references public.users(id) on delete set null,
  hidden_reason text,
  created_at timestamptz not null default now()
);

alter table public.feed_posts add column if not exists visibility_status text not null default 'visible';
alter table public.feed_posts add column if not exists hidden_at timestamptz;
alter table public.feed_posts add column if not exists hidden_by uuid references public.users(id) on delete set null;
alter table public.feed_posts add column if not exists hidden_reason text;
update public.feed_posts set visibility_status = 'visible' where visibility_status is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'feed_posts_visibility_status_check'
      and conrelid = 'public.feed_posts'::regclass
  ) then
    alter table public.feed_posts
      add constraint feed_posts_visibility_status_check
      check (visibility_status in ('visible', 'hidden_by_admin', 'hidden_by_author'));
  end if;
end
$$;

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

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  target_user_id uuid references public.users(id) on delete set null,
  post_id uuid references public.feed_posts(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open',
  resolution_note text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (target_user_id is not null or post_id is not null),
  check (status in ('open', 'reviewed', 'dismissed'))
);

alter table public.reports add column if not exists status text not null default 'open';
alter table public.reports add column if not exists resolution_note text;
alter table public.reports add column if not exists reviewed_at timestamptz;
alter table public.reports add column if not exists reviewed_by uuid references public.users(id) on delete set null;
update public.reports set status = 'open' where status is null;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  type text not null,
  title text,
  body text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.mate_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) <= 60),
  workout_type text not null,
  location_label text not null check (char_length(location_label) <= 40),
  time_slot text not null,
  difficulty text not null default 'beginner',
  capacity int not null default 2 check (capacity >= 1 and capacity <= 20),
  body text check (char_length(body) <= 180),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mate_post_interests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.mate_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create extension if not exists pg_trgm with schema extensions;

create index if not exists idx_test_results_user_created_at on public.test_results (user_id, created_at desc);
create index if not exists idx_workout_logs_user_date on public.workout_logs (user_id, date desc);
create index if not exists idx_workout_templates_user_updated_at on public.workout_templates (user_id, updated_at desc);
create index if not exists idx_weight_logs_user_recorded_at on public.weight_logs (user_id, recorded_at desc);
create index if not exists idx_xp_events_user_created_at on public.xp_events (user_id, created_at desc);
create index if not exists idx_xp_events_user_week_key on public.xp_events (user_id, week_key desc);
create index if not exists idx_xp_events_reference on public.xp_events (reference_type, reference_id);
create index if not exists idx_user_badges_user_awarded_at on public.user_badges (user_id, awarded_at desc);
create index if not exists idx_feed_posts_created_at on public.feed_posts (created_at desc);
create index if not exists idx_feed_posts_user_created_at on public.feed_posts (user_id, created_at desc);
create index if not exists idx_feed_posts_visibility_created_at on public.feed_posts (visibility_status, created_at desc);
create index if not exists idx_likes_post_id on public.likes (post_id);
create index if not exists idx_comments_post_id on public.comments (post_id);
create index if not exists idx_follows_follower_id on public.follows (follower_id);
create index if not exists idx_follows_following_id on public.follows (following_id);
create index if not exists idx_blocks_blocker_id on public.blocks (blocker_id);
create index if not exists idx_blocks_blocked_id on public.blocks (blocked_id);
create index if not exists idx_reports_reporter_id on public.reports (reporter_id, created_at desc);
create index if not exists idx_reports_target_user_id on public.reports (target_user_id, created_at desc);
create index if not exists idx_reports_post_id on public.reports (post_id, created_at desc);
create index if not exists idx_reports_status_created_at on public.reports (status, created_at desc);
create index if not exists idx_notifications_user_created_at on public.notifications (user_id, created_at desc);
create index if not exists idx_notifications_user_read_at on public.notifications (user_id, read_at, created_at desc);
create index if not exists idx_mate_posts_status_created_at on public.mate_posts (status, created_at desc);
create index if not exists idx_mate_posts_user_created_at on public.mate_posts (user_id, created_at desc);
create index if not exists idx_mate_post_interests_post_id on public.mate_post_interests (post_id);
create index if not exists idx_mate_post_interests_user_id on public.mate_post_interests (user_id);
create index if not exists idx_users_display_name_trgm on public.users using gin (display_name gin_trgm_ops);

insert into storage.buckets (id, name, public)
select 'workout-photos', 'workout-photos', true
where not exists (
  select 1 from storage.buckets where id = 'workout-photos'
);

insert into storage.buckets (id, name, public)
select 'profile-avatars', 'profile-avatars', true
where not exists (
  select 1 from storage.buckets where id = 'profile-avatars'
);

alter table public.users enable row level security;
alter table public.test_results enable row level security;
alter table public.workout_logs enable row level security;
alter table public.workout_templates enable row level security;
alter table public.weight_logs enable row level security;
alter table public.xp_events enable row level security;
alter table public.user_badges enable row level security;
alter table public.feed_posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.mate_posts enable row level security;
alter table public.mate_post_interests enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.protect_user_admin_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_admin = false;
    return new;
  end if;

  new.is_admin = old.is_admin;
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
    select 1
    from pg_trigger
    where tgname = 'set_mate_posts_updated_at'
      and tgrelid = 'public.mate_posts'::regclass
  ) then
    create trigger set_mate_posts_updated_at
    before update on public.mate_posts
    for each row
    execute function public.set_updated_at();
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'mate_posts' and policyname = 'users can insert own mate posts'
  ) then
    create policy "users can insert own mate posts"
    on public.mate_posts
    for insert
    with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'mate_posts' and policyname = 'users can update own mate posts'
  ) then
    create policy "users can update own mate posts"
    on public.mate_posts
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'mate_posts' and policyname = 'users can delete own mate posts'
  ) then
    create policy "users can delete own mate posts"
    on public.mate_posts
    for delete
    using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'mate_post_interests' and policyname = 'users can read own mate interests'
  ) then
    create policy "users can read own mate interests"
    on public.mate_post_interests
    for select
    using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'mate_post_interests' and policyname = 'users can insert own mate interests'
  ) then
    create policy "users can insert own mate interests"
    on public.mate_post_interests
    for insert
    with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'mate_post_interests' and policyname = 'users can delete own mate interests'
  ) then
    create policy "users can delete own mate interests"
    on public.mate_post_interests
    for delete
    using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_protect_user_admin_flag'
  ) then
    create trigger trg_protect_user_admin_flag
    before insert or update on public.users
    for each row
    execute function public.protect_user_admin_flag();
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'anyone can read profile avatars'
  ) then
    create policy "anyone can read profile avatars"
    on storage.objects
    for select
    using (bucket_id = 'profile-avatars');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'users can upload own profile avatars'
  ) then
    create policy "users can upload own profile avatars"
    on storage.objects
    for insert
    with check (
      bucket_id = 'profile-avatars'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'users can update own profile avatars'
  ) then
    create policy "users can update own profile avatars"
    on storage.objects
    for update
    using (
      bucket_id = 'profile-avatars'
      and auth.uid()::text = (storage.foldername(name))[1]
    )
    with check (
      bucket_id = 'profile-avatars'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'users can delete own profile avatars'
  ) then
    create policy "users can delete own profile avatars"
    on storage.objects
    for delete
    using (
      bucket_id = 'profile-avatars'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'anyone can read workout photos'
  ) then
    create policy "anyone can read workout photos"
    on storage.objects
    for select
    using (bucket_id = 'workout-photos');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'users can upload own workout photos'
  ) then
    create policy "users can upload own workout photos"
    on storage.objects
    for insert
    with check (
      bucket_id = 'workout-photos'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'users can update own workout photos'
  ) then
    create policy "users can update own workout photos"
    on storage.objects
    for update
    using (
      bucket_id = 'workout-photos'
      and auth.uid()::text = (storage.foldername(name))[1]
    )
    with check (
      bucket_id = 'workout-photos'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'users can delete own workout photos'
  ) then
    create policy "users can delete own workout photos"
    on storage.objects
    for delete
    using (
      bucket_id = 'workout-photos'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'follows' and policyname = 'anyone can read follows'
  ) then
    create policy "anyone can read follows"
    on public.follows
    for select
    using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'follows' and policyname = 'users can insert own follows'
  ) then
    create policy "users can insert own follows"
    on public.follows
    for insert
    with check (auth.uid() = follower_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'follows' and policyname = 'users can delete own follows'
  ) then
    create policy "users can delete own follows"
    on public.follows
    for delete
    using (auth.uid() = follower_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'weight_logs' and policyname = 'users can read own weight logs'
  ) then
    create policy "users can read own weight logs"
    on public.weight_logs
    for select
    using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'weight_logs' and policyname = 'users can insert own weight logs'
  ) then
    create policy "users can insert own weight logs"
    on public.weight_logs
    for insert
    with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'weight_logs' and policyname = 'users can update own weight logs'
  ) then
    create policy "users can update own weight logs"
    on public.weight_logs
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
    where schemaname = 'public' and tablename = 'weight_logs' and policyname = 'users can delete own weight logs'
  ) then
    create policy "users can delete own weight logs"
    on public.weight_logs
    for delete
    using (auth.uid() = user_id);
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

drop policy if exists "anyone can read feed posts" on public.feed_posts;
create policy "anyone can read feed posts"
on public.feed_posts
for select
using (visibility_status = 'visible');

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

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'blocks' and policyname = 'users can read own blocks'
  ) then
    create policy "users can read own blocks"
    on public.blocks
    for select
    using (auth.uid() = blocker_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'blocks' and policyname = 'users can insert own blocks'
  ) then
    create policy "users can insert own blocks"
    on public.blocks
    for insert
    with check (auth.uid() = blocker_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'blocks' and policyname = 'users can delete own blocks'
  ) then
    create policy "users can delete own blocks"
    on public.blocks
    for delete
    using (auth.uid() = blocker_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reports' and policyname = 'users can read own reports'
  ) then
    create policy "users can read own reports"
    on public.reports
    for select
    using (auth.uid() = reporter_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reports' and policyname = 'users can insert own reports'
  ) then
    create policy "users can insert own reports"
    on public.reports
    for insert
    with check (auth.uid() = reporter_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifications' and policyname = 'users can read own notifications'
  ) then
    create policy "users can read own notifications"
    on public.notifications
    for select
    using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifications' and policyname = 'actors can create notifications'
  ) then
    create policy "actors can create notifications"
    on public.notifications
    for insert
    with check (
      auth.uid() = actor_user_id
      and auth.uid() is not null
      and user_id <> actor_user_id
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifications' and policyname = 'users can update own notifications'
  ) then
    create policy "users can update own notifications"
    on public.notifications
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
    where schemaname = 'public' and tablename = 'xp_events' and policyname = 'users can view own xp events'
  ) then
    create policy "users can view own xp events"
    on public.xp_events
    for select
    using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_badges' and policyname = 'users can view own badges'
  ) then
    create policy "users can view own badges"
    on public.user_badges
    for select
    using (auth.uid() = user_id);
  end if;
end
$$;

create or replace function public.get_week_start(value_date date)
returns date
language sql
immutable
as $$
  select (value_date - ((extract(isodow from value_date)::int) - 1))::date;
$$;

create or replace function public.get_activity_level_value(total_xp_input int)
returns int
language sql
immutable
as $$
  select case
    when coalesce(total_xp_input, 0) >= 2450 then 10
    when coalesce(total_xp_input, 0) >= 1840 then 9
    when coalesce(total_xp_input, 0) >= 1350 then 8
    when coalesce(total_xp_input, 0) >= 960 then 7
    when coalesce(total_xp_input, 0) >= 660 then 6
    when coalesce(total_xp_input, 0) >= 430 then 5
    when coalesce(total_xp_input, 0) >= 260 then 4
    when coalesce(total_xp_input, 0) >= 140 then 3
    when coalesce(total_xp_input, 0) >= 60 then 2
    else 1
  end;
$$;

create or replace function public.get_activity_level_label(total_xp_input int)
returns text
language sql
immutable
as $$
  select case public.get_activity_level_value(total_xp_input)
    when 10 then 'Legend'
    when 9 then 'Iron'
    when 8 then 'Elite'
    when 7 then 'Athlete'
    when 6 then 'Strong Flow'
    when 5 then 'Challenger'
    when 4 then 'Consistent'
    when 3 then 'Momentum'
    when 2 then 'Warm Up'
    else 'Starter'
  end;
$$;

create or replace function public.rebuild_activity_progress(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  workout_record record;
  weight_record record;
  test_record record;
  weekly_goal_value int := 4;
  target_weight_value numeric(5,2);
  previous_workout_date date;
  previous_weight_date date;
  previous_test_score int;
  latest_workout_date date;
  current_day_workout_count int := 0;
  current_streak int := 0;
  max_streak int := 0;
  active_streak_days int := 0;
  photo_count int := 0;
  duration_bonus int := 0;
  xp_amount_value int := 0;
  weekly_points_value int := 0;
  week_count_value int := 0;
  weight_week_count_value int := 0;
  week_counts jsonb := '{}'::jsonb;
  weight_week_counts jsonb := '{}'::jsonb;
  week_key_value date;
  current_week_key date := public.get_week_start(current_date);
  current_total_xp int := 0;
  current_weekly_points int := 0;
  current_total_workouts int := 0;
  has_photo_proof boolean := false;
  has_goal_clear boolean := false;
  first_weight_value numeric(5,2);
  latest_weight_value numeric(5,2);
  weight_goal_progress numeric := 0;
begin
  if target_user_id is null then
    return;
  end if;

  select
    coalesce(u.weekly_goal, 4),
    u.target_weight_kg
  into
    weekly_goal_value,
    target_weight_value
  from public.users u
  where u.id = target_user_id;

  delete from public.xp_events where user_id = target_user_id;
  delete from public.user_badges where user_id = target_user_id;

  for workout_record in
    select
      wl.id,
      wl.date,
      wl.workout_type,
      wl.duration_minutes,
      wl.share_to_feed,
      wl.photo_url,
      wl.photo_urls,
      wl.created_at
    from public.workout_logs wl
    where wl.user_id = target_user_id
      and wl.completed = true
    order by wl.date asc, wl.created_at asc
  loop
    current_total_workouts := current_total_workouts + 1;

    if previous_workout_date is null or workout_record.date <> previous_workout_date then
      current_day_workout_count := 1;

      if previous_workout_date is null then
        current_streak := 1;
      elsif workout_record.date = previous_workout_date + 1 then
        current_streak := current_streak + 1;
      else
        current_streak := 1;
      end if;

      previous_workout_date := workout_record.date;
      latest_workout_date := workout_record.date;
      max_streak := greatest(max_streak, current_streak);
    else
      current_day_workout_count := current_day_workout_count + 1;
      latest_workout_date := workout_record.date;
    end if;

    week_key_value := public.get_week_start(workout_record.date);
    week_count_value := coalesce((week_counts ->> week_key_value::text)::int, 0) + 1;
    week_counts := jsonb_set(week_counts, array[week_key_value::text], to_jsonb(week_count_value), true);

    duration_bonus := least((greatest(coalesce(workout_record.duration_minutes, 0), 0) / 10) * 2, 12);
    photo_count := case
      when jsonb_typeof(workout_record.photo_urls) = 'array' then jsonb_array_length(workout_record.photo_urls)
      when workout_record.photo_url is not null then 1
      else 0
    end;

    xp_amount_value := 20
      + duration_bonus
      + case when photo_count > 0 then 8 else 0 end
      + case when coalesce(workout_record.share_to_feed, true) then 4 else 0 end
      + case when current_day_workout_count = 1 then 5 else 0 end;
    weekly_points_value := 20 + case when photo_count > 0 then 5 else 0 end;

    if current_day_workout_count = 1 and current_streak = 3 then
      xp_amount_value := xp_amount_value + 15;
    elsif current_day_workout_count = 1 and current_streak = 7 then
      xp_amount_value := xp_amount_value + 35;
    elsif current_day_workout_count = 1 and current_streak = 14 then
      xp_amount_value := xp_amount_value + 80;
    end if;

    if weekly_goal_value > 0 and week_count_value = weekly_goal_value then
      xp_amount_value := xp_amount_value + 30;
      weekly_points_value := weekly_points_value + 30;
      has_goal_clear := true;
    end if;

    if photo_count > 0 then
      has_photo_proof := true;
    end if;

    insert into public.xp_events (
      user_id,
      event_type,
      xp_amount,
      weekly_points,
      reference_type,
      reference_id,
      week_key,
      metadata,
      created_at
    )
    values (
      target_user_id,
      'workout_complete',
      xp_amount_value,
      weekly_points_value,
      'workout_log',
      workout_record.id,
      week_key_value,
      jsonb_build_object(
        'workoutType', workout_record.workout_type,
        'durationMinutes', coalesce(workout_record.duration_minutes, 0),
        'photoCount', photo_count,
        'shareToFeed', coalesce(workout_record.share_to_feed, true),
        'streakDays', current_streak
      ),
      workout_record.created_at
    );

    current_total_xp := current_total_xp + xp_amount_value;

    if week_key_value = current_week_key then
      current_weekly_points := current_weekly_points + weekly_points_value;
    end if;
  end loop;

  for weight_record in
    select
      wl.id,
      wl.weight_kg,
      wl.recorded_at,
      wl.created_at
    from public.weight_logs wl
    where wl.user_id = target_user_id
    order by wl.recorded_at asc, wl.created_at asc
  loop
    if first_weight_value is null then
      first_weight_value := weight_record.weight_kg;
    end if;

    latest_weight_value := weight_record.weight_kg;

    if previous_weight_date is not null and weight_record.recorded_at::date = previous_weight_date then
      continue;
    end if;

    week_key_value := public.get_week_start(weight_record.recorded_at::date);
    weight_week_count_value := coalesce((weight_week_counts ->> week_key_value::text)::int, 0);

    if weight_week_count_value >= 3 then
      previous_weight_date := weight_record.recorded_at::date;
      continue;
    end if;

    weight_week_count_value := weight_week_count_value + 1;
    weight_week_counts := jsonb_set(weight_week_counts, array[week_key_value::text], to_jsonb(weight_week_count_value), true);
    previous_weight_date := weight_record.recorded_at::date;

    insert into public.xp_events (
      user_id,
      event_type,
      xp_amount,
      weekly_points,
      reference_type,
      reference_id,
      week_key,
      metadata,
      created_at
    )
    values (
      target_user_id,
      'weight_log',
      5,
      0,
      'weight_log',
      weight_record.id,
      week_key_value,
      jsonb_build_object('weightKg', weight_record.weight_kg),
      weight_record.created_at
    );

    current_total_xp := current_total_xp + 5;
  end loop;

  for test_record in
    select
      tr.id,
      tr.score,
      tr.level,
      tr.created_at
    from public.test_results tr
    where tr.user_id = target_user_id
    order by tr.created_at asc
  loop
    xp_amount_value := 25 + case when previous_test_score is not null and test_record.score > previous_test_score then 20 else 0 end;
    week_key_value := public.get_week_start(test_record.created_at::date);

    insert into public.xp_events (
      user_id,
      event_type,
      xp_amount,
      weekly_points,
      reference_type,
      reference_id,
      week_key,
      metadata,
      created_at
    )
    values (
      target_user_id,
      'test_result',
      xp_amount_value,
      0,
      'test_result',
      test_record.id,
      week_key_value,
      jsonb_build_object(
        'score', test_record.score,
        'level', test_record.level
      ),
      test_record.created_at
    );

    current_total_xp := current_total_xp + xp_amount_value;
    previous_test_score := test_record.score;
  end loop;

  if latest_workout_date = current_date then
    active_streak_days := current_streak;
  end if;

  update public.users u
  set
    total_xp = current_total_xp,
    weekly_points = current_weekly_points,
    activity_level = public.get_activity_level_value(current_total_xp),
    activity_level_label = public.get_activity_level_label(current_total_xp),
    streak_days = active_streak_days,
    last_activity_date = latest_workout_date
  where u.id = target_user_id;

  if current_total_workouts >= 1 then
    insert into public.user_badges (user_id, badge_key)
    values (target_user_id, 'first_workout')
    on conflict (user_id, badge_key) do nothing;
  end if;

  if has_photo_proof then
    insert into public.user_badges (user_id, badge_key)
    values (target_user_id, 'first_photo_proof')
    on conflict (user_id, badge_key) do nothing;
  end if;

  if max_streak >= 3 then
    insert into public.user_badges (user_id, badge_key)
    values (target_user_id, 'streak_3')
    on conflict (user_id, badge_key) do nothing;
  end if;

  if max_streak >= 7 then
    insert into public.user_badges (user_id, badge_key)
    values (target_user_id, 'streak_7')
    on conflict (user_id, badge_key) do nothing;
  end if;

  if max_streak >= 14 then
    insert into public.user_badges (user_id, badge_key)
    values (target_user_id, 'streak_14')
    on conflict (user_id, badge_key) do nothing;
  end if;

  if has_goal_clear then
    insert into public.user_badges (user_id, badge_key)
    values (target_user_id, 'goal_first_clear')
    on conflict (user_id, badge_key) do nothing;
  end if;

  if exists (
    select 1
    from public.test_results tr
    where tr.user_id = target_user_id
  ) then
    insert into public.user_badges (user_id, badge_key)
    values (target_user_id, 'first_test')
    on conflict (user_id, badge_key) do nothing;
  end if;

  if current_total_workouts >= 100 then
    insert into public.user_badges (user_id, badge_key)
    values (target_user_id, 'workout_100')
    on conflict (user_id, badge_key) do nothing;
  end if;

  if target_weight_value is not null
    and first_weight_value is not null
    and latest_weight_value is not null
  then
    if abs(target_weight_value - first_weight_value) < 0.01 then
      weight_goal_progress := 1;
    else
      weight_goal_progress := greatest(
        least(
          (
            abs(target_weight_value - first_weight_value)
            - abs(target_weight_value - latest_weight_value)
          ) / abs(target_weight_value - first_weight_value),
          1
        ),
        0
      );
    end if;

    if weight_goal_progress >= 0.25 then
      insert into public.user_badges (user_id, badge_key)
      values (target_user_id, 'weight_goal_25')
      on conflict (user_id, badge_key) do nothing;
    end if;

    if weight_goal_progress >= 1 then
      insert into public.user_badges (user_id, badge_key)
      values (target_user_id, 'weight_goal_100')
      on conflict (user_id, badge_key) do nothing;
    end if;
  end if;
end;
$$;

create or replace function public.rebuild_activity_progress_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.rebuild_activity_progress(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

create or replace function public.rebuild_activity_progress_from_profile_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.rebuild_activity_progress(new.id);
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_rebuild_activity_from_workouts'
  ) then
    create trigger trg_rebuild_activity_from_workouts
    after insert or update or delete on public.workout_logs
    for each row
    execute function public.rebuild_activity_progress_trigger();
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_rebuild_activity_from_weight_logs'
  ) then
    create trigger trg_rebuild_activity_from_weight_logs
    after insert or update or delete on public.weight_logs
    for each row
    execute function public.rebuild_activity_progress_trigger();
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_rebuild_activity_from_test_results'
  ) then
    create trigger trg_rebuild_activity_from_test_results
    after insert or update or delete on public.test_results
    for each row
    execute function public.rebuild_activity_progress_trigger();
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_rebuild_activity_from_profile_goal'
  ) then
    create trigger trg_rebuild_activity_from_profile_goal
    after update of weekly_goal, target_weight_kg on public.users
    for each row
    execute function public.rebuild_activity_progress_from_profile_trigger();
  end if;
end
$$;

do $$
declare
  user_record record;
begin
  for user_record in
    select id from public.users
  loop
    perform public.rebuild_activity_progress(user_record.id);
  end loop;
end
$$;

drop function if exists public.get_public_leaderboard(integer);
drop function if exists public.get_public_mate_posts(uuid, integer);
drop function if exists public.get_public_profile(uuid);
drop function if exists public.get_notification_inbox(integer);
drop function if exists public.get_moderation_reports(text, integer);
drop function if exists public.resolve_report(uuid, text, text);
drop function if exists public.search_public_users(text, integer);

create or replace function public.get_public_mate_posts(viewer_user_id uuid default null, limit_count int default 24)
returns table (
  id uuid,
  user_id uuid,
  title text,
  workout_type text,
  location_label text,
  time_slot text,
  difficulty text,
  capacity int,
  body text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  display_name text,
  avatar_emoji text,
  avatar_url text,
  activity_level int,
  activity_level_label text,
  interest_count bigint,
  interested_by_me boolean
)
language sql
security definer
set search_path = public
as $$
  with viewer_context as (
    select coalesce(viewer_user_id, auth.uid()) as viewer_id
  ),
  interest_counts as (
    select
      mpi.post_id,
      count(*)::bigint as interest_count
    from public.mate_post_interests mpi
    group by mpi.post_id
  )
  select
    mp.id,
    mp.user_id,
    mp.title,
    mp.workout_type,
    mp.location_label,
    mp.time_slot,
    mp.difficulty,
    mp.capacity,
    mp.body,
    mp.status,
    mp.created_at,
    mp.updated_at,
    coalesce(u.display_name, '게스트') as display_name,
    coalesce(u.avatar_emoji, 'RUN') as avatar_emoji,
    u.avatar_url,
    coalesce(u.activity_level, 1) as activity_level,
    coalesce(u.activity_level_label, 'Starter') as activity_level_label,
    coalesce(ic.interest_count, 0) as interest_count,
    exists (
      select 1
      from public.mate_post_interests mine
      cross join viewer_context vc
      where vc.viewer_id is not null
        and mine.post_id = mp.id
        and mine.user_id = vc.viewer_id
    ) as interested_by_me
  from public.mate_posts mp
  join public.users u on u.id = mp.user_id
  left join interest_counts ic on ic.post_id = mp.id
  order by
    case when mp.status = 'open' then 0 else 1 end,
    mp.created_at desc
  limit greatest(least(limit_count, 50), 1);
$$;

grant execute on function public.get_public_mate_posts(uuid, integer) to anon, authenticated;

create or replace function public.get_public_leaderboard(limit_count int default 10)
returns table (
  user_id uuid,
  display_name text,
  avatar_emoji text,
  avatar_url text,
  weekly_goal int,
  weekly_points int,
  weekly_count bigint,
  total_workouts bigint,
  total_xp int,
  activity_level int,
  activity_level_label text,
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
    u.avatar_url as avatar_url,
    coalesce(u.weekly_goal, 4) as weekly_goal,
    coalesce(u.weekly_points, 0) as weekly_points,
    coalesce(ww.weekly_count, 0) as weekly_count,
    coalesce(tw.total_workouts, 0) as total_workouts,
    coalesce(u.total_xp, 0) as total_xp,
    coalesce(u.activity_level, 1) as activity_level,
    coalesce(nullif(u.activity_level_label, ''), 'Starter') as activity_level_label,
    lt.score as latest_score,
    lt.level as latest_level
  from public.users u
  left join latest_tests lt on lt.user_id = u.id
  left join weekly_workouts ww on ww.user_id = u.id
  left join total_workouts tw on tw.user_id = u.id
  order by
    coalesce(u.weekly_points, 0) desc,
    coalesce(ww.weekly_count, 0) desc,
    coalesce(u.total_xp, 0) desc,
    coalesce(lt.score, 0) desc,
    coalesce(tw.total_workouts, 0) desc,
    u.created_at asc
  limit limit_count;
$$;

grant execute on function public.get_public_leaderboard(int) to anon, authenticated;

create or replace function public.get_public_profile(profile_user_id uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_emoji text,
  avatar_url text,
  bio text,
  fitness_tags jsonb,
  weekly_goal int,
  weekly_points int,
  weekly_count bigint,
  total_workouts bigint,
  total_xp int,
  activity_level int,
  activity_level_label text,
  streak_days int,
  latest_score int,
  latest_level text,
  follower_count bigint,
  following_count bigint
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
    where tr.user_id = profile_user_id
    order by tr.user_id, tr.created_at desc
  ),
  weekly_workouts as (
    select
      wl.user_id,
      count(*)::bigint as weekly_count
    from public.workout_logs wl
    where wl.user_id = profile_user_id
      and wl.completed = true
      and wl.date >= current_date - interval '6 day'
    group by wl.user_id
  ),
  total_workouts as (
    select
      wl.user_id,
      count(*)::bigint as total_workouts
    from public.workout_logs wl
    where wl.user_id = profile_user_id
      and wl.completed = true
    group by wl.user_id
  ),
  follower_stats as (
    select
      f.following_id as user_id,
      count(*)::bigint as follower_count
    from public.follows f
    where f.following_id = profile_user_id
    group by f.following_id
  ),
  following_stats as (
    select
      f.follower_id as user_id,
      count(*)::bigint as following_count
    from public.follows f
    where f.follower_id = profile_user_id
    group by f.follower_id
  )
  select
    u.id as user_id,
    coalesce(nullif(u.display_name, ''), '게스트-' || left(u.id::text, 6)) as display_name,
    coalesce(u.avatar_emoji, 'RUN') as avatar_emoji,
    u.avatar_url as avatar_url,
    u.bio as bio,
    coalesce(u.fitness_tags, '[]'::jsonb) as fitness_tags,
    coalesce(u.weekly_goal, 4) as weekly_goal,
    coalesce(u.weekly_points, 0) as weekly_points,
    coalesce(ww.weekly_count, 0) as weekly_count,
    coalesce(tw.total_workouts, 0) as total_workouts,
    coalesce(u.total_xp, 0) as total_xp,
    coalesce(u.activity_level, 1) as activity_level,
    coalesce(nullif(u.activity_level_label, ''), 'Starter') as activity_level_label,
    coalesce(u.streak_days, 0) as streak_days,
    lt.score as latest_score,
    lt.level as latest_level,
    coalesce(fs.follower_count, 0) as follower_count,
    coalesce(fgs.following_count, 0) as following_count
  from public.users u
  left join latest_tests lt on lt.user_id = u.id
  left join weekly_workouts ww on ww.user_id = u.id
  left join total_workouts tw on tw.user_id = u.id
  left join follower_stats fs on fs.user_id = u.id
  left join following_stats fgs on fgs.user_id = u.id
  where u.id = profile_user_id;
$$;

grant execute on function public.get_public_profile(uuid) to anon, authenticated;

create or replace function public.trim_notification_text(source_text text, max_length int default 80)
returns text
language sql
immutable
as $$
  select case
    when source_text is null then ''
    when char_length(trim(regexp_replace(source_text, '\s+', ' ', 'g'))) <= greatest(max_length, 1)
      then trim(regexp_replace(source_text, '\s+', ' ', 'g'))
    else left(trim(regexp_replace(source_text, '\s+', ' ', 'g')), greatest(max_length - 1, 0)) || '...'
  end;
$$;

create or replace function public.handle_follow_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.follower_id is null or new.following_id is null or new.follower_id = new.following_id then
    return new;
  end if;

  insert into public.notifications (
    user_id,
    actor_user_id,
    type,
    title,
    body,
    entity_type,
    entity_id
  )
  values (
    new.following_id,
    new.follower_id,
    'follow',
    '새 팔로워',
    '회원님을 팔로우하기 시작했어요.',
    'user',
    new.following_id
  );

  return new;
end;
$$;

create or replace function public.handle_like_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_owner_id uuid;
  post_type text;
  post_content text;
begin
  select fp.user_id, fp.type, fp.content
  into post_owner_id, post_type, post_content
  from public.feed_posts fp
  where fp.id = new.post_id;

  if post_owner_id is null or post_owner_id = new.user_id then
    return new;
  end if;

  insert into public.notifications (
    user_id,
    actor_user_id,
    type,
    title,
    body,
    entity_type,
    entity_id,
    metadata
  )
  values (
    post_owner_id,
    new.user_id,
    'like',
    '새 좋아요',
    '회원님의 커뮤니티 기록을 좋아해요.',
    'feed_post',
    new.post_id,
    jsonb_build_object(
      'postType', post_type,
      'postPreview', public.trim_notification_text(post_content, 80)
    )
  );

  return new;
end;
$$;

create or replace function public.handle_comment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_owner_id uuid;
  post_type text;
  post_content text;
begin
  select fp.user_id, fp.type, fp.content
  into post_owner_id, post_type, post_content
  from public.feed_posts fp
  where fp.id = new.post_id;

  if post_owner_id is null or post_owner_id = new.user_id then
    return new;
  end if;

  insert into public.notifications (
    user_id,
    actor_user_id,
    type,
    title,
    body,
    entity_type,
    entity_id,
    metadata
  )
  values (
    post_owner_id,
    new.user_id,
    'comment',
    '새 댓글',
    '회원님의 커뮤니티 기록에 댓글을 남겼어요.',
    'feed_post',
    new.post_id,
    jsonb_build_object(
      'postType', post_type,
      'postPreview', public.trim_notification_text(post_content, 80),
      'commentPreview', public.trim_notification_text(new.content, 100)
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_follow_notifications on public.follows;
create trigger trg_follow_notifications
after insert on public.follows
for each row
execute function public.handle_follow_notification();

drop trigger if exists trg_like_notifications on public.likes;
create trigger trg_like_notifications
after insert on public.likes
for each row
execute function public.handle_like_notification();

drop trigger if exists trg_comment_notifications on public.comments;
create trigger trg_comment_notifications
after insert on public.comments
for each row
execute function public.handle_comment_notification();

create or replace function public.get_notification_inbox(limit_count int default 30)
returns table (
  id uuid,
  user_id uuid,
  actor_user_id uuid,
  type text,
  title text,
  body text,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  read_at timestamptz,
  created_at timestamptz,
  actor_display_name text,
  actor_avatar_emoji text,
  actor_avatar_url text,
  unread_count bigint
)
language sql
security definer
set search_path = public
as $$
  with scoped_notifications as (
    select
      n.*,
      count(*) filter (where n.read_at is null) over ()::bigint as unread_count
    from public.notifications n
    where auth.uid() is not null
      and n.user_id = auth.uid()
    order by n.created_at desc
    limit greatest(least(limit_count, 50), 1)
  )
  select
    sn.id,
    sn.user_id,
    sn.actor_user_id,
    sn.type,
    sn.title,
    sn.body,
    sn.entity_type,
    sn.entity_id,
    sn.metadata,
    sn.read_at,
    sn.created_at,
    actor.display_name as actor_display_name,
    coalesce(actor.avatar_emoji, 'RUN') as actor_avatar_emoji,
    actor.avatar_url as actor_avatar_url,
    sn.unread_count
  from scoped_notifications sn
  left join public.users actor on actor.id = sn.actor_user_id
  order by sn.created_at desc;
$$;

grant execute on function public.get_notification_inbox(int) to authenticated;

create or replace function public.get_moderation_reports(status_filter text default 'open', limit_count int default 30)
returns table (
  id uuid,
  reporter_id uuid,
  reporter_name text,
  target_user_id uuid,
  target_name text,
  post_id uuid,
  post_author_name text,
  reason text,
  reason_label text,
  details text,
  status text,
  resolution_note text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  post_visibility_status text,
  post_hidden_at timestamptz,
  post_hidden_reason text,
  post_preview text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with admin_user as (
    select u.id
    from public.users u
    where u.id = auth.uid()
      and u.is_admin = true
  )
  select
    r.id,
    r.reporter_id,
    reporter.display_name as reporter_name,
    r.target_user_id,
    target_user.display_name as target_name,
    r.post_id,
    post_author.display_name as post_author_name,
    r.reason,
    case r.reason
      when 'spam' then '스팸/도배'
      when 'abuse' then '욕설/혐오 표현'
      when 'adult' then '부적절한 사진/콘텐츠'
      when 'misleading' then '허위 정보/사칭'
      else '기타'
    end as reason_label,
    r.details,
    r.status,
    r.resolution_note,
    r.reviewed_at,
    r.reviewed_by,
    post.visibility_status as post_visibility_status,
    post.hidden_at as post_hidden_at,
    post.hidden_reason as post_hidden_reason,
    public.trim_notification_text(post.content, 120) as post_preview,
    r.created_at
  from public.reports r
  join admin_user on true
  left join public.users reporter on reporter.id = r.reporter_id
  left join public.users target_user on target_user.id = r.target_user_id
  left join public.feed_posts post on post.id = r.post_id
  left join public.users post_author on post_author.id = post.user_id
  where status_filter is null or r.status = status_filter
  order by r.created_at desc
  limit greatest(least(limit_count, 50), 1);
$$;

grant execute on function public.get_moderation_reports(text, int) to authenticated;

create or replace function public.set_feed_post_visibility(
  target_post_id uuid,
  next_visibility text default 'hidden_by_admin',
  moderation_note text default null
)
returns public.feed_posts
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_id uuid;
  sanitized_visibility text;
  updated_post public.feed_posts;
begin
  select u.id
  into admin_id
  from public.users u
  where u.id = auth.uid()
    and u.is_admin = true;

  if admin_id is null then
    raise exception 'Only admins can moderate feed posts.';
  end if;

  sanitized_visibility := case
    when next_visibility = 'visible' then 'visible'
    when next_visibility in ('hidden_by_admin', 'hidden_by_author') then next_visibility
    else 'hidden_by_admin'
  end;

  update public.feed_posts fp
  set
    visibility_status = sanitized_visibility,
    hidden_at = case when sanitized_visibility = 'visible' then null else now() end,
    hidden_by = case when sanitized_visibility = 'visible' then null else admin_id end,
    hidden_reason = case when sanitized_visibility = 'visible' then null else nullif(trim(moderation_note), '') end
  where fp.id = target_post_id
  returning fp.* into updated_post;

  if updated_post.id is null then
    raise exception 'Feed post not found.';
  end if;

  return updated_post;
end;
$$;

grant execute on function public.set_feed_post_visibility(uuid, text, text) to authenticated;

create or replace function public.resolve_report(report_id uuid, next_status text default 'reviewed', review_note text default null)
returns public.reports
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_id uuid;
  updated_report public.reports;
begin
  select u.id
  into admin_id
  from public.users u
  where u.id = auth.uid()
    and u.is_admin = true;

  if admin_id is null then
    raise exception 'Only admins can resolve reports.';
  end if;

  update public.reports r
  set
    status = case when next_status in ('open', 'reviewed', 'dismissed') then next_status else 'reviewed' end,
    resolution_note = review_note,
    reviewed_at = now(),
    reviewed_by = admin_id
  where r.id = report_id
  returning r.* into updated_report;

  if updated_report.id is null then
    raise exception 'Report not found.';
  end if;

  return updated_report;
end;
$$;

grant execute on function public.resolve_report(uuid, text, text) to authenticated;

create or replace function public.search_public_users(search_query text, limit_count int default 12)
returns table (
  user_id uuid,
  display_name text,
  avatar_emoji text,
  avatar_url text,
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
    u.display_name,
    coalesce(u.avatar_emoji, 'RUN') as avatar_emoji,
    u.avatar_url,
    coalesce(ww.weekly_count, 0) as weekly_count,
    coalesce(tw.total_workouts, 0) as total_workouts,
    lt.score as latest_score,
    lt.level as latest_level
  from public.users u
  left join latest_tests lt on lt.user_id = u.id
  left join weekly_workouts ww on ww.user_id = u.id
  left join total_workouts tw on tw.user_id = u.id
  where char_length(trim(search_query)) >= 2
    and nullif(u.display_name, '') is not null
    and u.display_name ilike '%' || trim(search_query) || '%'
  order by
    case when lower(u.display_name) = lower(trim(search_query)) then 0 else 1 end,
    coalesce(ww.weekly_count, 0) desc,
    coalesce(lt.score, 0) desc,
    u.created_at asc
  limit greatest(least(limit_count, 20), 1);
$$;

grant execute on function public.search_public_users(text, int) to anon, authenticated;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;
