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

  const statItems = [
    {
      label: t('활동', 'Activity'),
      value: `Lv ${profile?.activity_level ?? 1}`,
    },
    {
      label: t('이번 주', 'This week'),
      value: isEnglish ? `${profile?.weekly_count ?? 0} logs` : `${profile?.weekly_count ?? 0}회`,
    },
    {
      label: t('연속', 'Streak'),
      value: isEnglish ? `${profile?.streak_days ?? 0} days` : `${profile?.streak_days ?? 0}일`,
    },
    {
      label: t('팔로워', 'Followers'),
      value: String(profile?.follower_count ?? 0),
    },
    {
      label: t('체력', 'Level'),
      value: profile?.latest_level ? localizeLevelText(profile.latest_level, language) : t('아직 없음', 'No level yet'),
    },
    {
      label: t('총 XP', 'XP'),
      value: `${profile?.total_xp ?? 0} XP`,
    },
  ]

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
                <span className="app-section-kicker">{t('프로필', 'Profile')}</span>
                <h2>{profile?.display_name}</h2>
                <p className="subtext">
                  {profile?.bio?.trim()
                    ? profile.bio
                    : t('소개가 아직 없어요.', 'No intro yet.')}
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
                {t('닫기', 'Close')}
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
            {statItems.map((item) => (
              <StatChip key={item.label} label={item.label} value={item.value} />
            ))}
          </div>

          <p className="subtext public-profile-footnote">
            {t(
              '아래에는 이 사람 글만 보여요.',
              'The feed below shows only this person.',
            )}
          </p>
        </>
      )}
    </section>
  )
}
