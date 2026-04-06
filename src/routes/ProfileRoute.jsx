import ProfilePanel from '../components/ProfilePanel'

export default function ProfileRoute(props) {
  const {
    profile,
    user,
    language,
    bodyMetrics,
  } = props

  return (
    <div className="view-stage">
      <ProfilePanel
        key={`${profile?.display_name ?? ''}-${profile?.avatar_emoji ?? ''}-${profile?.avatar_url ?? ''}-${profile?.weekly_goal ?? 4}-${profile?.height_cm ?? ''}-${profile?.target_weight_kg ?? ''}-${profile?.bio ?? ''}-${JSON.stringify(profile?.fitness_tags ?? [])}-${profile?.default_share_to_feed !== false}-${profile?.reminder_enabled === true}-${profile?.reminder_time ?? '19:00'}-${bodyMetrics?.latestWeightKg ?? ''}-${user?.id ?? 'guest'}-${language}`}
        {...props}
      />
    </div>
  )
}
