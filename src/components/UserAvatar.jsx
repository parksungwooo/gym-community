import OptimizedImage from './OptimizedImage'

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
        <OptimizedImage
          className="user-avatar-image"
          imageUrl={imageUrl}
          preset="avatar"
          alt={alt}
          decoding="async"
        />
      ) : (
        <span className="user-avatar-fallback">{fallback}</span>
      )}
    </div>
  )
}
