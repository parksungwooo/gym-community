import { useEffect, useState } from 'react'
import FeedList from '../components/FeedList'
import MateBoard from '../components/MateBoard'
import ModerationPanel from '../components/ModerationPanel'
import PublicProfileCard from '../components/PublicProfileCard'
import RankingBoard from '../components/RankingBoard'
import SuggestedUsers from '../components/SuggestedUsers'
import UserSearchPanel from '../components/UserSearchPanel'

export default function CommunityRoute({
  isEnglish,
  canUseCommunity,
  onGoProfile,
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
}) {
  const t = (ko, en) => (isEnglish ? en : ko)
  const [activeTab, setActiveTab] = useState('feed')
  const [activeUtility, setActiveUtility] = useState(null)

  useEffect(() => {
    if (activeUtility !== 'ranking') return
    if (visibleLeaderboard.length > 0 || loadingLeaderboard) return
    onEnsureLeaderboard?.().catch(() => {})
  }, [activeUtility, loadingLeaderboard, onEnsureLeaderboard, visibleLeaderboard.length])

  if (!canUseCommunity) {
    return (
      <div className="view-stage">
        <section className="card community-overview-card">
          <h2>{t('커뮤니티 잠금', 'Community locked')}</h2>
          <p className="subtext">
            {t(
              '프로필에 닉네임을 먼저 저장하면 커뮤니티를 바로 사용할 수 있어요.',
              'Save a nickname in your profile first, then the community will open normally.',
            )}
          </p>
          <button type="button" className="primary-btn" onClick={onGoProfile}>
            {t('프로필로 가기', 'Go to profile')}
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="view-stage community-stage-clean">
      <section className="card community-tab-shell community-screen-shell compact-community-shell">
        <div className="community-screen-head compact">
          <div>
            <span className="app-section-kicker">{t('커뮤니티', 'Community')}</span>
            <h2>{t('피드와 메이트에 집중하고, 필요할 때만 더 열어보세요.', 'Focus on feed and mates, then open more only when you need it.')}</h2>
          </div>
          <span className="community-mini-pill">
            {activeTab === 'mate'
              ? t(`모집글 ${visibleMatePosts.length}`, `${visibleMatePosts.length} mate posts`)
              : t(`게시글 ${visibleFeedPosts.length}`, `${visibleFeedPosts.length} posts`)}
          </span>
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
            onClick={() => setActiveTab('feed')}
            data-testid="community-tab-feed"
          >
            {t('피드', 'Feed')}
          </button>
          <button
            type="button"
            className={`community-tab-btn ${activeTab === 'mate' ? 'active' : ''}`}
            onClick={() => setActiveTab('mate')}
            data-testid="community-tab-mate"
          >
            {t('메이트', 'Mates')}
          </button>
        </div>

        <div className="community-utility-row">
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
