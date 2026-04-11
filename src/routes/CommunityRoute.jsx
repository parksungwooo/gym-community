import { useEffect, useMemo, useState } from 'react'
import FeedList from '../components/FeedList'
import MateBoard from '../components/MateBoard'
import ModerationPanel from '../components/ModerationPanel'
import ProCommunityPanel from '../components/ProCommunityPanel'
import PublicProfileCard from '../components/PublicProfileCard'
import RankingBoard from '../components/RankingBoard'
import SuggestedUsers from '../components/SuggestedUsers'
import UserAvatar from '../components/UserAvatar'
import UserSearchPanel from '../components/UserSearchPanel'
import { buildCommunityInsight } from '../features/app/surfaceInsights'

function CommunityRankingPreview({ rows, loading, isEnglish, onOpenRanking, onSelectUser }) {
  const topRows = rows.slice(0, 3)

  return (
    <div className="grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-neutral-950">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{isEnglish ? 'Weekly leaders' : '주간 리더'}</span>
          <strong className="text-base font-black leading-6 text-gray-950 dark:text-white">{isEnglish ? 'Move with the crew' : '함께 움직이는 순위'}</strong>
        </div>
        <button type="button" className="min-h-11 rounded-lg bg-white px-4 text-sm font-black text-gray-800 shadow-sm transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onOpenRanking}>
          {isEnglish ? 'Full rank' : '전체 랭킹'}
        </button>
      </div>

      {loading && !topRows.length ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <span key={index} className="h-24 animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10" />
          ))}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-3">
          {topRows.length ? topRows.map((item, index) => (
            <button
              key={item.user_id}
              type="button"
              className={`grid min-h-24 justify-items-start gap-2 rounded-2xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 ${index === 0 ? 'border-yellow-200 bg-yellow-50 text-yellow-950 dark:border-yellow-300/30 dark:bg-yellow-300/10 dark:text-yellow-100' : 'border-gray-100 bg-white text-gray-950 dark:border-white/10 dark:bg-neutral-900 dark:text-white'}`}
              onClick={() => onSelectUser?.(item)}
            >
              <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-gray-950 shadow-sm dark:bg-neutral-950 dark:text-white">{`#${index + 1}`}</span>
              <UserAvatar
                className="h-11 w-11 rounded-2xl"
                imageUrl={item.avatar_url}
                fallback={item.avatar_emoji || 'RUN'}
                alt={item.display_name || (isEnglish ? 'Ranked user' : '랭킹 사용자')}
              />
              <strong className="w-full truncate text-sm font-black">{item.display_name || (isEnglish ? 'Member' : '멤버')}</strong>
              <small className="text-xs font-bold text-gray-700 dark:text-gray-200">{isEnglish ? `${item.weekly_points ?? 0} pts` : `${item.weekly_points ?? 0}P`}</small>
            </button>
          )) : (
            <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-center text-sm font-bold text-gray-700 dark:border-white/10 dark:text-gray-200 sm:col-span-3">
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
  isPro,
  onOpenPaywall,
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

  const insightToneClass = {
    warm: 'border-amber-200 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-500/15',
    cool: 'border-cyan-200 bg-cyan-50 dark:border-cyan-400/30 dark:bg-cyan-500/15',
    growth: 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-700/20',
    neutral: 'border-gray-100 bg-gray-50 dark:border-white/10 dark:bg-white/10',
  }[communityInsight.tone] ?? 'border-gray-100 bg-gray-50 dark:border-white/10 dark:bg-white/10'

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
    <div className="grid gap-6">
      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('커뮤니티', 'Community')}</span>
            <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{t('피드부터 보면 돼요.', 'Start with the feed.')}</h2>
          </div>
          <div className="grid justify-items-end">
            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">{communityCountLabel}</span>
          </div>
        </div>

        <div
          className="grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-white/10"
          role="tablist"
          aria-label={t('커뮤니티 섹션', 'Community sections')}
          data-testid="community-tablist"
        >
          <button
            type="button"
            className={`min-h-11 rounded-lg px-4 text-sm font-black transition ${activeTab === 'feed' ? 'active bg-white text-gray-950 shadow-sm dark:bg-neutral-900 dark:text-white' : 'text-gray-700 hover:text-gray-950 dark:text-gray-100 dark:hover:text-white'}`}
            onClick={() => handleTabChange('feed')}
            data-testid="community-tab-feed"
          >
            {t('피드', 'Feed')}
          </button>
          <button
            type="button"
            className={`min-h-11 rounded-lg px-4 text-sm font-black transition ${activeTab === 'mate' ? 'active bg-white text-gray-950 shadow-sm dark:bg-neutral-900 dark:text-white' : 'text-gray-700 hover:text-gray-950 dark:text-gray-100 dark:hover:text-white'}`}
            onClick={() => handleTabChange('mate')}
            data-testid="community-tab-mate"
          >
            {t('메이트', 'Mates')}
          </button>
        </div>

        <div className={`grid gap-4 rounded-2xl border p-4 ${insightToneClass}`}>
          <div className="grid gap-2">
            <span className="text-xs font-black uppercase text-gray-800 dark:text-gray-100">{communityInsight.label}</span>
            <strong className="text-lg font-black leading-6 text-gray-950 dark:text-white">{communityInsight.title}</strong>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{communityInsight.body}</p>
          </div>

          {activeTab === 'feed' && (
            <div className="grid gap-2">
              <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{t('더 둘러보기', 'Explore more')}</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`min-h-11 rounded-lg px-4 text-sm font-black transition ${activeUtility === 'discover' ? 'bg-emerald-700 text-white shadow-sm' : 'bg-white text-gray-800 shadow-sm hover:text-gray-950 dark:bg-neutral-900 dark:text-gray-100 dark:hover:text-white'}`}
                  onClick={() => setActiveUtility((current) => (current === 'discover' ? null : 'discover'))}
                  data-testid="community-utility-discover"
                >
                  {t('사람 찾기', 'Discover people')}
                </button>
                <button
                  type="button"
                  className={`min-h-11 rounded-lg px-4 text-sm font-black transition ${activeUtility === 'ranking' ? 'bg-emerald-700 text-white shadow-sm' : 'bg-white text-gray-800 shadow-sm hover:text-gray-950 dark:bg-neutral-900 dark:text-gray-100 dark:hover:text-white'}`}
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
        <section className="grid gap-5">
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
        <section className="grid gap-5">
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
          <ProCommunityPanel
            isPro={isPro}
            rows={visibleLeaderboard}
            currentUserId={currentUserId}
            onSelectUser={onSelectCommunityUser}
            onOpenPaywall={onOpenPaywall}
          />
        </section>
      )}

      {activeTab === 'feed' && (
        <section className="grid gap-5">
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
          <ProCommunityPanel
            isPro={isPro}
            rows={visibleLeaderboard}
            currentUserId={currentUserId}
            onSelectUser={onSelectCommunityUser}
            onOpenPaywall={onOpenPaywall}
          />
        </section>
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
          className="fixed inset-0 z-50 grid place-items-end bg-gray-950/70 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-6 backdrop-blur-sm sm:place-items-center sm:px-6"
          role="dialog"
          aria-modal="true"
          onClick={onClearCommunityUser}
        >
          <div className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-neutral-900" onClick={(event) => event.stopPropagation()}>
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
