import { useState } from 'react'
import FeedList from '../components/FeedList'
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
  visibleLeaderboard,
  visibleFeedPosts,
  onToggleLike,
  onSubmitComment,
  isAdmin,
  moderationReports,
  moderationLoading,
  moderationActionLoading,
  moderationStatus,
  onModerationStatusChange,
  onRefreshModeration,
  onResolveReport,
}) {
  const [activeTab, setActiveTab] = useState('feed')

  if (!canUseCommunity) {
    return (
      <div className="view-stage">
        <section className="card community-overview-card">
          <h2>{isEnglish ? 'Community Locked' : '커뮤니티 잠금'}</h2>
          <p className="subtext">
            {isEnglish
              ? 'Add a nickname in your profile first, then you can use the community.'
              : '먼저 프로필에 닉네임을 저장하면 커뮤니티를 사용할 수 있어요.'}
          </p>
          <button type="button" className="primary-btn" onClick={onGoProfile}>
            {isEnglish ? 'Go to Profile' : '프로필로 가기'}
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="view-stage">
      <section className="card community-overview-card community-overview-card-simple">
        <div>
          <h2>{isEnglish ? 'Community' : '커뮤니티'}</h2>
          <p className="subtext">{isEnglish ? 'Follow the feed first, then discover people when you want more.' : '먼저 피드를 보고, 더 찾고 싶을 때 사람을 둘러보세요.'}</p>
        </div>
        <div className="community-overview-stats">
          <span className="community-mini-pill">{isEnglish ? `${visibleFeedPosts.length} posts` : `게시글 ${visibleFeedPosts.length}`}</span>
          <span className="community-mini-pill">{isEnglish ? `${visibleLeaderboard.length} ranked` : `랭킹 ${visibleLeaderboard.length}`}</span>
        </div>
      </section>
      {(selectedCommunityUser || loadingSelectedCommunityProfile) && (
        <PublicProfileCard
          profile={activeCommunityProfile}
          loading={loadingSelectedCommunityProfile}
          isFollowing={followingIds.includes(activeCommunityProfile?.user_id)}
          isMe={activeCommunityProfile?.user_id === currentUserId}
          isBlocked={blockedIds.includes(activeCommunityProfile?.user_id)}
          actionLoading={loadingAction}
          onToggleFollow={() => onToggleFollow(activeCommunityProfile?.user_id, followingIds.includes(activeCommunityProfile?.user_id))}
          onReport={() => onOpenReportComposer({
            kind: 'user',
            targetUserId: activeCommunityProfile?.user_id ?? null,
          })}
          onToggleBlock={() => onToggleBlock(activeCommunityProfile?.user_id, blockedIds.includes(activeCommunityProfile?.user_id))}
          onClear={onClearCommunityUser}
        />
      )}
      <section className="card community-tab-shell">
        <div className="community-tab-row" role="tablist" aria-label={isEnglish ? 'Community sections' : '커뮤니티 섹션'}>
          <button
            type="button"
            className={`community-tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            {isEnglish ? 'Feed' : '피드'}
          </button>
          <button
            type="button"
            className={`community-tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            {isEnglish ? 'Discover' : '찾기'}
          </button>
          <button
            type="button"
            className={`community-tab-btn ${activeTab === 'ranking' ? 'active' : ''}`}
            onClick={() => setActiveTab('ranking')}
          >
            {isEnglish ? 'Ranking' : '랭킹'}
          </button>
        </div>
      </section>

      {activeTab === 'feed' && (
        <FeedList
          posts={visibleFeedPosts}
          onToggleLike={onToggleLike}
          onSubmitComment={onSubmitComment}
          onReportPost={(post) => onOpenReportComposer({
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

      {activeTab === 'discover' && (
        <>
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
        </>
      )}

      {activeTab === 'ranking' && (
        <RankingBoard
          rows={visibleLeaderboard}
          loading={loadingFeed}
          selectedUserId={selectedCommunityUser?.user_id ?? null}
          onSelectUser={onSelectCommunityUser}
          currentUserId={currentUserId}
          followingIds={followingIds}
          onToggleFollow={onToggleFollow}
          actionLoading={loadingAction}
        />
      )}
    </div>
  )
}
