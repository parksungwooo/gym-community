import UserAvatar from './UserAvatar'
import { useI18n } from '../i18n.js'
import { localizeLevelText } from '../utils/level'

function StatChip({ label, value }) {
  return (
    <article className="public-profile-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

export default function PublicProfileCard({
  profile,
  loading,
  isFollowing,
  isMe,
  isBlocked,
  actionLoading,
  onToggleFollow,
  onReport,
  onToggleBlock,
  onClear,
}) {
  const { isEnglish, language } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)

  if (!profile && !loading) return null

  return (
    <section className="card public-profile-card community-profile-spotlight">
      {loading ? (
        <div className="skeleton-stack">
          <div className="skeleton-card">
            <div className="skeleton-row">
              <span className="skeleton-avatar" />
              <div className="skeleton-copy">
                <span className="skeleton-line medium" />
                <span className="skeleton-line long" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="public-profile-header">
            <div className="public-profile-main">
              <UserAvatar
                className="public-profile-avatar"
                imageUrl={profile?.avatar_url}
                fallback={profile?.avatar_emoji || 'RUN'}
                alt={profile?.display_name || (isEnglish ? 'Public profile' : '공개 프로필')}
              />
              <div className="public-profile-copy">
                <span className="app-section-kicker">{t('공개 프로필', 'Public profile')}</span>
                <h2>{profile?.display_name}</h2>
                <p className="subtext">
                  {profile?.bio?.trim()
                    ? profile.bio
                    : t('아직 짧은 소개를 입력하지 않았어요.', 'This user has not added a short intro yet.')}
                </p>
              </div>
            </div>

            <div className="public-profile-actions">
              {!isMe && (
                <>
                  <button
                    type="button"
                    className={`follow-chip ${isFollowing ? 'active' : ''}`}
                    onClick={onToggleFollow}
                    disabled={actionLoading || isBlocked}
                  >
                    {isFollowing ? (isEnglish ? 'Following' : '팔로잉') : (isEnglish ? 'Follow' : '팔로우')}
                  </button>
                  <button type="button" className="ghost-chip" onClick={onReport} disabled={actionLoading}>
                    {isEnglish ? 'Report' : '신고'}
                  </button>
                  <button
                    type="button"
                    className={`ghost-chip ${isBlocked ? 'danger-chip' : ''}`}
                    onClick={onToggleBlock}
                    disabled={actionLoading}
                  >
                    {isBlocked ? (isEnglish ? 'Unblock' : '차단 해제') : (isEnglish ? 'Block' : '차단')}
                  </button>
                </>
              )}
              <button type="button" className="ghost-btn" onClick={onClear}>
                {t('프로필 닫기', 'Close profile')}
              </button>
            </div>
          </div>

          {!!profile?.fitness_tags?.length && (
            <div className="public-profile-tags">
              {profile.fitness_tags.map((tag) => (
                <span key={tag} className="profile-tag-pill">{tag}</span>
              ))}
            </div>
          )}

          <div className="public-profile-stats">
            <StatChip
              label={t('활동 레벨', 'Activity level')}
              value={`Lv ${profile?.activity_level ?? 1}`}
            />
            <StatChip
              label={t('주간 포인트', 'Weekly points')}
              value={String(profile?.weekly_points ?? 0)}
            />
            <StatChip
              label={t('총 XP', 'Total XP')}
              value={`${profile?.total_xp ?? 0} XP`}
            />
            <StatChip
              label={t('이번 주 운동', 'This week')}
              value={isEnglish ? `${profile?.weekly_count ?? 0} workouts` : `${profile?.weekly_count ?? 0}회 운동`}
            />
            <StatChip
              label={t('현재 연속', 'Current streak')}
              value={isEnglish ? `${profile?.streak_days ?? 0} days` : `${profile?.streak_days ?? 0}일`}
            />
            <StatChip
              label={t('체력 레벨', 'Fitness level')}
              value={profile?.latest_level ? localizeLevelText(profile.latest_level, language) : t('아직 없음', 'No level yet')}
            />
            <StatChip
              label={t('팔로워', 'Followers')}
              value={String(profile?.follower_count ?? 0)}
            />
            <StatChip
              label={t('팔로잉', 'Following')}
              value={String(profile?.following_count ?? 0)}
            />
          </div>

          <p className="subtext public-profile-footnote">
            {t(
              '이 프로필이 열린 동안 아래 피드는 이 사람의 게시물 중심으로 좁혀서 보여줘요.',
              'While this profile is open, the feed below stays filtered to this person.',
            )}
          </p>
        </>
      )}
    </section>
  )
}
