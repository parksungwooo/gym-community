import { useState } from 'react'
import { getImageSourceCandidates } from '../utils/imageOptimization'

export default function OptimizedImage({
  imageUrl,
  preset = 'feedThumbnail',
  overrides = {},
  alt = '',
  className,
  ...props
}) {
  const overrideKey = JSON.stringify(overrides ?? {})
  const sourceKey = `${imageUrl ?? ''}::${preset}::${overrideKey}`
  const candidates = getImageSourceCandidates(imageUrl, preset, overrides)
  const [fallbackState, setFallbackState] = useState({
    sourceKey: '',
    candidateIndex: 0,
  })

  const activeIndex = fallbackState.sourceKey === sourceKey ? fallbackState.candidateIndex : 0
  const activeSource = candidates[activeIndex] ?? imageUrl ?? ''

  if (!activeSource) return null

  return (
    <img
      {...props}
      className={className}
      src={activeSource}
      alt={alt}
      onError={() => {
        setFallbackState((currentState) => {
          const nextIndex = currentState.sourceKey === sourceKey
            ? currentState.candidateIndex + 1
            : 1

          return {
            sourceKey,
            candidateIndex: Math.min(nextIndex, Math.max(candidates.length - 1, 0)),
          }
        })
      }}
    />
  )
}
