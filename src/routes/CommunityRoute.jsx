import { useEffect, useMemo, useState } from 'react'
import FeedList from '../components/FeedList'
import MateBoard from '../components/MateBoard'
import ModerationPanel from '../components/ModerationPanel'
import PublicProfileCard from '../components/PublicProfileCard'
import RankingBoard from '../components/RankingBoard'
import SuggestedUsers from '../components/SuggestedUsers'
import UserAvatar from '../components/UserAvatar'
import UserSearchPanel from '../components/UserSearchPanel'
import { buildCommunityInsight } from '../features/app/surfaceInsights'

function CommunityRankingPreview({ rows, loading, isEnglish, onOpenRanking, onSelectUser }) {
  const topRows = rows.slice(0, 3)

  return (
    <div className="community-ranking-preview">
      <div className="community-ranking-preview-head">
        <div>
          <span>{isEnglish ? 'Weekly leaders' : '주간 리더'}</span>
          <strong>{isEnglish ? 'Move with the crew' : '함께 움직이는 순위'}</strong>
        </div>
        <button type="button" className="community-ranking-preview-link" onClick={onOpenRanking}>
          {isEnglish ? 'Full rank' : '전체 랭킹'}
        </button>
      </div>

      {loading && !topRows.length ? (
        <div className="community-ranking-preview-list skeleton">
          {Array.from({ length: 3 }).map((_, index) => (
            <span key={index} className="community-ranking-preview-skeleton" />
          ))}
        </div>
      ) : (
        <div className="community-ranking-preview-list">
          {topRows.length ? topRows.map((item, index) => (
            <button
              key={item.user_id}
              type="button"
              className={`community-ranking-preview-user rank-${index + 1}`}
              onClick={() => onSelectUser?.(item)}
            >
              <span className="community-ranking-preview-rank">{`#${index + 1}`}</span>
              <UserAvatar
                className="community-ranking-preview-avatar"
                imageUrl={item.avatar_url}
                fallback={item.avatar_emoji || 'RUN'}
                alt={item.display_name || (isEnglish ? 'Ranked user' : '랭킹 사용자')}
              />
              <strong>{item.display_name || (isEnglish ? 'Member' : '멤버')}</strong>
              <small>{isEnglish ? `${item.weekly_points ?? 0} pts` : `${item.weekly_points ?? 0}P`}</small>
            </button>
          )) : (
            <div className="community-ranking-preview-empty">
              {isEnglish ? 'First workout claims the board.' : '첫 운동 기록이 랭킹을 채워요.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CommunityRoute({
  isEnglish,
  selectedCommunityUser,
  loadingSelectedCommunityProfile,
  activeCommunityProfile,
  followingIds,
  blockedIds,
  currentUserId,
  loadingAction,
  onToggleFollow,
  onOpenReportComposer,
  onToggleBlock,
  onClearCommunityUser,
  communitySearchQuery,
  onCommunitySearchQueryChange,
  communitySearchResults,
  loadingCommunitySearch,
  onSelectCommunityUser,
  suggestedUsers,
  currentLevel,
  loadingFeed,
  loadingMatePosts,
  loadingLeaderboard,
  visibleLeaderboard,
  visibleFeedPosts,
  visibleMatePosts,
  onEnsureLeaderboard,
  onToggleLike,
  onSubmitComment,
  onCreateMatePost,
  onToggleMateInterest,
  onUpdateMatePostStatus,
  isAdmin,
  moderationReports,
  moderationLoading,
  moderationActionLoading,
  moderationStatus,
  onModerationStatusChange,
  onRefreshModeration,
  onResolveReport,
  onTogglePostVisibility,
}) {
  const t = (ko, en) => (isEnglish ? en : ko)
  const [activeTab, setActiveTab] = useState('feed')
  const [activeUtility, setActiveUtility] = useState(null)

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab)
    if (nextTab !== 'feed') {
      setActiveUtility(null)
    }
  }

  const communityInsight = useMemo(
    () => buildCommunityInsight({
      currentLevel,
      currentUserId,
      followingIds,
      suggestedUsers,
      visibleLeaderboard,
      visibleFeedPosts,
      visibleMatePosts,
      activeTab,
      activeUtility,
      isEnglish,
    }),
    [
      activeTab,
      activeUtility,
      currentLevel,
      currentUserId,
      followingIds,
      isEnglish,
      suggestedUsers,
      visibleFeedPosts,
      visibleLeaderboard,
      visibleMatePosts,
    ],
  )

  const communityCountLabel = activeTab === 'mate'
    ? t(`메이트 ${visibleMatePosts.length}`, `${visibleMatePosts.length} mates`)
    : t(`피드 ${visibleFeedPosts.length}`, `${visibleFeedPosts.length} posts`)

  useEffect(() => {
    if (activeUtility !== 'ranking') return
    if (visibleLeaderboard.length > 0 || loadingLeaderboard) return
    onEnsureLeaderboard?.().catch(() => {})
  }, [activeUtility, loadingLeaderboard, onEnsureLeaderboard, visibleLeaderboard.length])

  useEffect(() => {
    if (visibleLeaderboard.length > 0 || loadingLeaderboard) return
    onEnsureLeaderboard?.().catch(() => {})
  }, [loadingLeaderboard, onEnsureLeaderboard, visibleLeaderboard.length])

  return (
    <div className="view-stage community-stage-clean">
      <section className="card community-tab-shell community-screen-shell compact-community-shell">
        <div className="community-screen-head compact">
          <div>
            <span className="app-section-kicker">{t('커뮤니티', 'Community')}</span>
            <h2>{t('피드부터 보면 돼요.', 'Start with the feed.')}</h2>
          </div>
          <div className="community-screen-head-meta">
            <span className="community-mini-pill">{communityCountLabel}</span>
          </div>
        </div>

        <div
          className="community-tab-row compact"
          role="tablist"
          aria-label={t('커뮤니티 섹션', 'Community sections')}
          data-testid="community-tablist"
        >
          <button
            type="button"
            className={`community-tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => handleTabChange('feed')}
            data-testid="community-tab-feed"
          >
            {t('피드', 'Feed')}
          </button>
          <button
            type="button"
            className={`community-tab-btn ${activeTab === 'mate' ? 'active' : ''}`}
            onClick={() => handleTabChange('mate')}
            data-testid="community-tab-mate"
          >
            {t('메이트', 'Mates')}
          </button>
        </div>

        <div className={`surface-insight-banner ${communityInsight.tone} community-insight-banner compact`}>
          <div className="surface-insight-copy">
            <span>{communityInsight.label}</span>
            <strong>{communityInsight.title}</strong>
            <p>{communityInsight.body}</p>
          </div>

          {activeTab === 'feed' && (
            <div className="community-utility-inline">
              <span className="community-utility-label">{t('더 둘러보기', 'Explore more')}</span>
              <div className="community-utility-row compact">
                <button
                  type="button"
                  className={`ghost-chip community-utility-btn ${activeUtility === 'discover' ? 'active' : ''}`}
                  onClick={() => setActiveUtility((current) => (current === 'discover' ? null : 'discover'))}
                  data-testid="community-utility-discover"
                >
                  {t('사람 찾기', 'Discover people')}
                </button>
                <button
                  type="button"
                  className={`ghost-chip community-utility-btn ${activeUtility === 'ranking' ? 'active' : ''}`}
                  onClick={() => setActiveUtility((current) => (current === 'ranking' ? null : 'ranking'))}
                  data-testid="community-utility-ranking"
                >
                  {t('주간 랭킹', 'Weekly ranking')}
                </button>
              </div>
            </div>
          )}
        </div>

        <CommunityRankingPreview
          rows={visibleLeaderboard}
          loading={loadingLeaderboard}
          isEnglish={isEnglish}
          onOpenRanking={() => setActiveUtility('ranking')}
          onSelectUser={onSelectCommunityUser}
        />
      </section>

      {activeUtility === 'discover' && (
        <section className="community-utility-panel">
          <UserSearchPanel
            query={communitySearchQuery}
            onQueryChange={onCommunitySearchQueryChange}
            rows={communitySearchResults}
            loading={loadingCommunitySearch}
            currentUserId={currentUserId}
            followingIds={followingIds}
            actionLoading={loadingAction}
            onToggleFollow={onToggleFollow}
            onSelectUser={onSelectCommunityUser}
          />
          <SuggestedUsers
            rows={suggestedUsers}
            currentLevel={currentLevel}
            loading={loadingFeed}
            selectedUserId={selectedCommunityUser?.user_id ?? null}
            onSelectUser={onSelectCommunityUser}
            currentUserId={currentUserId}
            followingIds={followingIds}
            onToggleFollow={onToggleFollow}
            actionLoading={loadingAction}
          />
          {isAdmin && (
            <ModerationPanel
              reports={moderationReports}
              loading={moderationLoading}
              actionLoading={moderationActionLoading}
              status={moderationStatus}
              onStatusChange={onModerationStatusChange}
              onRefresh={onRefreshModeration}
              onResolve={onResolveReport}
              onTogglePostVisibility={onTogglePostVisibility}
            />
          )}
        </section>
      )}

      {activeUtility === 'ranking' && (
        <section className="community-utility-panel">
          <RankingBoard
            rows={visibleLeaderboard}
            loading={loadingLeaderboard}
            selectedUserId={selectedCommunityUser?.user_id ?? null}
            onSelectUser={onSelectCommunityUser}
            currentUserId={currentUserId}
            followingIds={followingIds}
            onToggleFollow={onToggleFollow}
            actionLoading={loadingAction}
          />
        </section>
      )}

      {activeTab === 'feed' && (
        <FeedList
          posts={visibleFeedPosts}
          onToggleLike={onToggleLike}
          onSubmitComment={onSubmitComment}
          onReportPost={(post) =>
            onOpenReportComposer({
              kind: 'post',
              targetUserId: post.user_id,
              postId: post.id,
            })}
          onBlockUser={(targetUserId) => onToggleBlock(targetUserId, blockedIds.includes(targetUserId))}
          loading={loadingFeed}
          currentLevel={currentLevel}
          selectedUser={selectedCommunityUser}
          onClearSelectedUser={onClearCommunityUser}
          onSelectUser={onSelectCommunityUser}
          followingIds={followingIds}
          currentUserId={currentUserId}
        />
      )}

      {activeTab === 'mate' && (
        <MateBoard
          isEnglish={isEnglish}
          posts={visibleMatePosts}
          loading={loadingMatePosts}
          actionLoading={loadingAction}
          currentUserId={currentUserId}
          onCreatePost={onCreateMatePost}
          onToggleInterest={onToggleMateInterest}
          onToggleStatus={onUpdateMatePostStatus}
          onSelectUser={onSelectCommunityUser}
        />
      )}

      {(selectedCommunityUser || loadingSelectedCommunityProfile) && (
        <div
          className="community-profile-overlay"
          role="dialog"
          aria-modal="true"
          onClick={onClearCommunityUser}
        >
          <div className="community-profile-sheet" onClick={(event) => event.stopPropagation()}>
            <PublicProfileCard
              profile={activeCommunityProfile}
              loading={loadingSelectedCommunityProfile}
              isFollowing={followingIds.includes(activeCommunityProfile?.user_id)}
              isMe={activeCommunityProfile?.user_id === currentUserId}
              isBlocked={blockedIds.includes(activeCommunityProfile?.user_id)}
              actionLoading={loadingAction}
              onToggleFollow={() =>
                onToggleFollow(activeCommunityProfile?.user_id, followingIds.includes(activeCommunityProfile?.user_id))}
              onReport={() =>
                onOpenReportComposer({
                  kind: 'user',
                  targetUserId: activeCommunityProfile?.user_id ?? null,
                })}
              onToggleBlock={() =>
                onToggleBlock(activeCommunityProfile?.user_id, blockedIds.includes(activeCommunityProfile?.user_id))}
              onClear={onClearCommunityUser}
            />
          </div>
        </div>
      )}
    </div>
  )
}
