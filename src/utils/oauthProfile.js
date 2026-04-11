function pickFirstString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? ''
}

function getOAuthProviderTag(user) {
  const provider = pickFirstString(
    user?.app_metadata?.provider,
    user?.identities?.[0]?.provider,
  ).toLowerCase()

  if (provider.includes('naver')) return 'NAVER'
  if (provider.includes('kakao')) return 'KAKAO'
  if (provider.includes('google')) return 'GOOG'

  return 'GYM'
}

export function buildOAuthProfilePatch(user, existingProfile = null) {
  const metadata = user?.user_metadata ?? {}
  const emailName = pickFirstString(user?.email).split('@')[0]
  const displayName = pickFirstString(
    metadata.full_name,
    metadata.name,
    metadata.nickname,
    metadata.preferred_username,
    metadata.user_name,
    emailName,
  )
  const avatarUrl = pickFirstString(
    metadata.avatar_url,
    metadata.picture,
    metadata.profile_image,
    metadata.profile_image_url,
  )

  const patch = {}

  if (!existingProfile?.display_name && displayName) {
    patch.display_name = displayName.slice(0, 20)
  }

  if (!existingProfile?.avatar_url && avatarUrl) {
    patch.avatar_url = avatarUrl
  }

  if (!existingProfile?.avatar_emoji) {
    patch.avatar_emoji = getOAuthProviderTag(user)
  }

  return patch
}
