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
select 'table.notifications', exists (
  select 1
  from information_schema.tables
  where table_schema = 'public' and table_name = 'notifications'
)
union all
select 'table.xp_events', exists (
  select 1
  from information_schema.tables
  where table_schema = 'public' and table_name = 'xp_events'
)
union all
select 'table.user_badges', exists (
  select 1
  from information_schema.tables
  where table_schema = 'public' and table_name = 'user_badges'
)
union all
select 'table.blocks', exists (
  select 1
  from information_schema.tables
  where table_schema = 'public' and table_name = 'blocks'
)
union all
select 'table.reports', exists (
  select 1
  from information_schema.tables
  where table_schema = 'public' and table_name = 'reports'
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
select 'bucket.profile-avatars', exists (
  select 1
  from storage.buckets
  where id = 'profile-avatars'
)
union all
select 'extension.pg_trgm', exists (
  select 1
  from pg_extension
  where extname = 'pg_trgm'
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
select 'column.users.avatar_url', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'users'
    and column_name = 'avatar_url'
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
select 'column.users.reminder_enabled', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'users'
    and column_name = 'reminder_enabled'
)
union all
select 'column.users.reminder_time', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'users'
    and column_name = 'reminder_time'
)
union all
select 'column.users.is_admin', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'users'
    and column_name = 'is_admin'
)
union all
select 'column.users.total_xp', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'users'
    and column_name = 'total_xp'
)
union all
select 'column.users.weekly_points', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'users'
    and column_name = 'weekly_points'
)
union all
select 'column.users.activity_level', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'users'
    and column_name = 'activity_level'
)
union all
select 'column.users.streak_days', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'users'
    and column_name = 'streak_days'
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
select 'column.workout_logs.estimated_calories', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'workout_logs'
    and column_name = 'estimated_calories'
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
select 'column.reports.status', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'reports'
    and column_name = 'status'
)
union all
select 'column.reports.reviewed_by', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'reports'
    and column_name = 'reviewed_by'
)
union all
select 'column.notifications.read_at', exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'notifications'
    and column_name = 'read_at'
)
union all
select 'function.get_week_start', to_regprocedure('public.get_week_start(date)') is not null
union all
select 'function.get_activity_level_value', to_regprocedure('public.get_activity_level_value(integer)') is not null
union all
select 'function.get_activity_level_label', to_regprocedure('public.get_activity_level_label(integer)') is not null
union all
select 'function.rebuild_activity_progress', to_regprocedure('public.rebuild_activity_progress(uuid)') is not null
union all
select 'function.get_public_leaderboard', to_regprocedure('public.get_public_leaderboard(integer)') is not null
union all
select 'function.get_public_profile', to_regprocedure('public.get_public_profile(uuid)') is not null
union all
select 'function.get_notification_inbox', to_regprocedure('public.get_notification_inbox(integer)') is not null
union all
select 'function.get_moderation_reports', to_regprocedure('public.get_moderation_reports(text,integer)') is not null
union all
select 'function.resolve_report', to_regprocedure('public.resolve_report(uuid,text,text)') is not null
union all
select 'function.search_public_users', to_regprocedure('public.search_public_users(text,integer)') is not null
union all
select 'index.users_display_name_trgm', exists (
  select 1
  from pg_indexes
  where schemaname = 'public'
    and indexname = 'idx_users_display_name_trgm'
)
union all
select 'index.reports_status_created_at', exists (
  select 1
  from pg_indexes
  where schemaname = 'public'
    and indexname = 'idx_reports_status_created_at'
)
union all
select 'index.xp_events_user_created_at', exists (
  select 1
  from pg_indexes
  where schemaname = 'public'
    and indexname = 'idx_xp_events_user_created_at'
)
union all
select 'index.user_badges_user_awarded_at', exists (
  select 1
  from pg_indexes
  where schemaname = 'public'
    and indexname = 'idx_user_badges_user_awarded_at'
)
union all
select 'trigger.follow_notifications', exists (
  select 1
  from information_schema.triggers
  where event_object_schema = 'public'
    and event_object_table = 'follows'
    and trigger_name = 'trg_follow_notifications'
)
union all
select 'trigger.like_notifications', exists (
  select 1
  from information_schema.triggers
  where event_object_schema = 'public'
    and event_object_table = 'likes'
    and trigger_name = 'trg_like_notifications'
)
union all
select 'trigger.comment_notifications', exists (
  select 1
  from information_schema.triggers
  where event_object_schema = 'public'
    and event_object_table = 'comments'
    and trigger_name = 'trg_comment_notifications'
)
union all
select 'trigger.protect_user_admin_flag', exists (
  select 1
  from information_schema.triggers
  where event_object_schema = 'public'
    and event_object_table = 'users'
    and trigger_name = 'trg_protect_user_admin_flag'
)
union all
select 'trigger.rebuild_activity_from_workouts', exists (
  select 1
  from information_schema.triggers
  where event_object_schema = 'public'
    and event_object_table = 'workout_logs'
    and trigger_name = 'trg_rebuild_activity_from_workouts'
)
union all
select 'trigger.rebuild_activity_from_weight_logs', exists (
  select 1
  from information_schema.triggers
  where event_object_schema = 'public'
    and event_object_table = 'weight_logs'
    and trigger_name = 'trg_rebuild_activity_from_weight_logs'
)
union all
select 'trigger.rebuild_activity_from_test_results', exists (
  select 1
  from information_schema.triggers
  where event_object_schema = 'public'
    and event_object_table = 'test_results'
    and trigger_name = 'trg_rebuild_activity_from_test_results'
)
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
union all
select 'policy.users can read own notifications', exists (
  select 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'notifications'
    and policyname = 'users can read own notifications'
)
union all
select 'policy.users can view own xp events', exists (
  select 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'xp_events'
    and policyname = 'users can view own xp events'
)
union all
select 'policy.users can view own badges', exists (
  select 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'user_badges'
    and policyname = 'users can view own badges'
)
union all
select 'policy.users can insert own blocks', exists (
  select 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'blocks'
    and policyname = 'users can insert own blocks'
)
union all
select 'policy.users can insert own reports', exists (
  select 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'reports'
    and policyname = 'users can insert own reports'
)
union all
select 'publication.notifications.realtime', exists (
  select 1
  from pg_publication_tables
  where pubname = 'supabase_realtime'
    and schemaname = 'public'
    and tablename = 'notifications'
)
order by resource;
