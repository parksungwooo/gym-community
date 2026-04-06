const STORAGE_PUBLIC_PATH = '/storage/v1/object/public/'
const STORAGE_RENDER_PATH = '/storage/v1/render/image/public/'

const IMAGE_PRESETS = {
  avatar: { width: 160, height: 160, quality: 62 },
  feedThumbnail: { width: 520, height: 520, quality: 56 },
  historyThumbnail: { width: 420, height: 420, quality: 58 },
  panelThumbnail: { width: 360, height: 360, quality: 58 },
}

export function getOptimizedImageUrl(sourceUrl, preset = 'feedThumbnail', overrides = {}) {
  if (!sourceUrl || typeof sourceUrl !== 'string') return sourceUrl
  if (sourceUrl.startsWith('blob:') || sourceUrl.startsWith('data:')) return sourceUrl

  const options = {
    resize: 'cover',
    format: 'webp',
    ...IMAGE_PRESETS[preset],
    ...overrides,
  }

  try {
    const parsedUrl = new URL(sourceUrl)
    const publicPathIndex = parsedUrl.pathname.indexOf(STORAGE_PUBLIC_PATH)

    if (publicPathIndex === -1) {
      return sourceUrl
    }

    const objectPath = parsedUrl.pathname.slice(publicPathIndex + STORAGE_PUBLIC_PATH.length)
    const transformedUrl = new URL(`${parsedUrl.origin}${STORAGE_RENDER_PATH}${objectPath}`)

    if (options.width) transformedUrl.searchParams.set('width', String(options.width))
    if (options.height) transformedUrl.searchParams.set('height', String(options.height))
    if (options.quality) transformedUrl.searchParams.set('quality', String(options.quality))
    if (options.resize) transformedUrl.searchParams.set('resize', options.resize)
    if (options.format) transformedUrl.searchParams.set('format', options.format)

    return transformedUrl.toString()
  } catch {
    return sourceUrl
  }
}

export function getImageSourceCandidates(sourceUrl, preset = 'feedThumbnail', overrides = {}) {
  if (!sourceUrl || typeof sourceUrl !== 'string') return []

  const optimizedUrl = getOptimizedImageUrl(sourceUrl, preset, overrides)

  if (!optimizedUrl || optimizedUrl === sourceUrl) {
    return [sourceUrl]
  }

  return [optimizedUrl, sourceUrl]
}
