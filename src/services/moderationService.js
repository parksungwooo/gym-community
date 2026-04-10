import { supabase } from '../lib/supabaseClient'
import { assertServiceSuccess } from './serviceErrors'

export async function submitReport(reporterId, report) {
  const reason = report.reason?.trim()

  if (!reason) {
    throw new Error('신고 사유를 선택해주세요.')
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      target_user_id: report.targetUserId ?? null,
      post_id: report.postId ?? null,
      reason,
      details: report.details?.trim() || null,
    })
    .select('id,reporter_id,target_user_id,post_id,reason,details,created_at')
    .single()

  assertServiceSuccess(error, 'reports.insert')

  return data
}

export async function fetchModerationReports(status = 'open', limit = 30) {
  const { data, error } = await supabase.rpc('get_moderation_reports', {
    status_filter: status,
    limit_count: Math.min(50, Math.max(1, Number(limit) || 30)),
  })

  assertServiceSuccess(error, 'rpc.get_moderation_reports')

  return data ?? []
}

export async function resolveModerationReport(reportId, status, resolutionNote = '') {
  const { data, error } = await supabase.rpc('resolve_report', {
    report_id: reportId,
    next_status: status,
    review_note: resolutionNote?.trim() || null,
  })

  assertServiceSuccess(error, 'rpc.resolve_report')

  return data
}

export async function setFeedPostVisibility(postId, nextVisibility = 'hidden_by_admin', moderationNote = '') {
  const { data, error } = await supabase.rpc('set_feed_post_visibility', {
    target_post_id: postId,
    next_visibility: nextVisibility,
    moderation_note: moderationNote?.trim() || null,
  })

  assertServiceSuccess(error, 'rpc.set_feed_post_visibility')

  return data
}
