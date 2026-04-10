import { supabase } from '../lib/supabaseClient'
import { assertServiceSuccess } from './serviceErrors'

function isBrowserFile(file) {
  return typeof File !== 'undefined' && file instanceof File
}

async function uploadImageToBucket(bucketId, userId, file, options = {}) {
  if (!isBrowserFile(file)) return null

  const preparedFile = await compressImageFile(file)
  const extension = preparedFile.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExtension = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg'
  const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExtension}`

  const { error: uploadError } = await supabase.storage
    .from(bucketId)
    .upload(filePath, preparedFile, {
      cacheControl: options.cacheControl ?? '3600',
      upsert: false,
      contentType: preparedFile.type || `image/${safeExtension}`,
    })

  assertServiceSuccess(uploadError, `storage.${bucketId}.upload`)

  const { data } = supabase.storage.from(bucketId).getPublicUrl(filePath)
  return data?.publicUrl ?? null
}

export async function uploadWorkoutPhoto(userId, file) {
  return uploadImageToBucket('workout-photos', userId, file)
}

export async function resolveProfileAvatar(userId, avatarFile) {
  if (avatarFile === null) return null
  if (!isBrowserFile(avatarFile)) return null
  return uploadImageToBucket('profile-avatars', userId, avatarFile, { cacheControl: '86400' })
}

export async function resolvePhotoItems(userId, items) {
  if (!Array.isArray(items) || !items.length) return []

  const orderedUrls = []

  for (const item of items.slice(0, 4)) {
    if (item?.kind === 'existing' && item.url) {
      orderedUrls.push(item.url)
      continue
    }

    const file = isBrowserFile(item) ? item : item?.file
    if (isBrowserFile(file)) {
      const uploadedUrl = await uploadWorkoutPhoto(userId, file)
      if (uploadedUrl) orderedUrls.push(uploadedUrl)
    }
  }

  return orderedUrls
}

async function compressImageFile(file) {
  if (!isBrowserFile(file)) return file
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  if (typeof document === 'undefined') return file

  const imageUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = imageUrl
    })

    const maxDimension = 1280
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')

    if (!context) return file

    context.drawImage(image, 0, 0, width, height)
    const candidateQualities = [0.78, 0.68, 0.58]
    let blob = null

    for (const quality of candidateQualities) {
      // Try progressively smaller JPEGs until we meaningfully reduce transfer size.
      const nextBlob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', quality)
      })

      if (!nextBlob) continue
      blob = nextBlob

      if (nextBlob.size <= 350 * 1024 || nextBlob.size <= file.size * 0.72) {
        break
      }
    }

    if (!blob || blob.size >= file.size) return file

    const compressedName = file.name.replace(/\.[^.]+$/, '') || 'workout-photo'
    return new File([blob], `${compressedName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}
