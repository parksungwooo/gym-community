-- Run this after schema.sql when you want a quick DB health check.
-- Every row should return ok = true.

select 'table.users' as resource, exists (
  select 1
  from information_schema.tables
  where table_schema = 'public' and table_name = 'users'
) as ok
union all
select 'table.test_results', exists (
  select 1
  from information_schema.tables
  where table_schema = 'public' and table_name = 'test_results'
)
union all
select 'table.workout_logs', exists (
  select 1
  from information_schema.tables
  where table_schema = 'public' and table_name = 'workout_logs'
)
union all
select 'table.workout_templates', exists (
  select 1
  from information_schema.tables
  where table_schema = 'public' and table_name = 'workout_templates'
)
union all
select 'table.feed_posts', exists (
  select 1
  from information_schema.tables
  where table_schema = 'public' and table_name = 'feed_posts'
)
union all
select 'table.likes', exists (
  select 1
  from information_schema.tables
  where table_schema = 'public' and table_name = 'likes'
)
union all
select 'table.comments', exists (
  select 1
  from information_schema.tables
  where table_schema = 'public' and table_name = 'comments'
)
union all
select 'bucket.workout-photos', exists (
  select 1
  from storage.buckets
  where id = 'workout-photos'
)
union all
select 'column.users.weekly_goal', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'users'
    and column_name = 'weekly_goal'
)
union all
select 'column.users.bio', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'users'
    and column_name = 'bio'
)
union all
select 'column.users.fitness_tags', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'users'
    and column_name = 'fitness_tags'
)
union all
select 'column.users.default_share_to_feed', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'users'
    and column_name = 'default_share_to_feed'
)
union all
select 'column.workout_logs.workout_type', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'workout_logs'
    and column_name = 'workout_type'
)
union all
select 'column.workout_logs.duration_minutes', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'workout_logs'
    and column_name = 'duration_minutes'
)
union all
select 'column.workout_logs.note', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'workout_logs'
    and column_name = 'note'
)
union all
select 'column.workout_logs.photo_url', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'workout_logs'
    and column_name = 'photo_url'
)
union all
select 'column.workout_logs.photo_urls', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'workout_logs'
    and column_name = 'photo_urls'
)
union all
select 'column.workout_logs.share_to_feed', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'workout_logs'
    and column_name = 'share_to_feed'
)
union all
select 'function.get_public_leaderboard', to_regprocedure('public.get_public_leaderboard(integer)') is not null
union all
select 'policy.users can insert own profile', exists (
  select 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'users'
    and policyname = 'users can insert own profile'
)
union all
select 'policy.users can insert own workout logs', exists (
  select 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'workout_logs'
    and policyname = 'users can insert own workout logs'
)
union all
select 'policy.users can insert own workout templates', exists (
  select 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'workout_templates'
    and policyname = 'users can insert own workout templates'
)
union all
select 'policy.anyone can read feed posts', exists (
  select 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'feed_posts'
    and policyname = 'anyone can read feed posts'
)
order by resource;
