import { getOptimizedImageUrl } from '../utils/imageOptimization'

export default function UserAvatar({
  imageUrl,
  fallback = 'RUN',
  alt = 'User avatar',
  className = '',
}) {
  const classes = className ? `${className} user-avatar-shell` : 'user-avatar-shell'

  return (
    <div className={classes}>
      {imageUrl ? (
        <img
          className="user-avatar-image"
          src={getOptimizedImageUrl(imageUrl, 'avatar')}
          alt={alt}
          decoding="async"
        />
      ) : (
        <span className="user-avatar-fallback">{fallback}</span>
      )}
    </div>
  )
}
