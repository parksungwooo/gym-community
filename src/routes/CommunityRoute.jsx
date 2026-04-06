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
      <section className="card community-overview-card">
        <h2>{isEnglish ? 'Community' : '커뮤니티'}</h2>
        <p className="subtext">{isEnglish ? 'Start with people who feel close to your level.' : '비슷한 사람부터 가볍게 둘러보세요.'}</p>
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
    </div>
  )
}
