import OptimizedImage from './OptimizedImage'

export default function UserAvatar({
  imageUrl,
  fallback = 'RUN',
  alt = 'User avatar',
  className = '',
}) {
  const baseClass = 'grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-emerald-50 text-xs font-black text-emerald-700 ring-1 ring-emerald-100'
  const classes = className ? `${baseClass} ${className}` : baseClass

  return (
    <div className={classes}>
      {imageUrl ? (
        <OptimizedImage
          className="h-full w-full object-cover"
          imageUrl={imageUrl}
          preset="avatar"
          alt={alt}
          decoding="async"
        />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  )
}
