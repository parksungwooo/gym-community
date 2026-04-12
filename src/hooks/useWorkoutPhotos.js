import { useCallback, useEffect, useRef, useState } from 'react'

function buildNewPhotoItems(files) {
  return files.map((file, index) => ({
    id: `${file.name}-${file.lastModified}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'new',
    file,
    previewUrl: URL.createObjectURL(file),
    label: file.name,
  }))
}

function revokePhotoPreview(item) {
  if (item?.kind === 'new' && item.previewUrl) URL.revokeObjectURL(item.previewUrl)
}

function revokePhotoPreviews(items) {
  items.forEach(revokePhotoPreview)
}

export function useWorkoutPhotos(maxPhotos) {
  const galleryInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const photoItemsRef = useRef([])
  const [photoItems, setPhotoItems] = useState([])

  useEffect(() => {
    photoItemsRef.current = photoItems
  }, [photoItems])

  useEffect(() => () => {
    revokePhotoPreviews(photoItemsRef.current)
  }, [])

  const clearPhotos = useCallback(() => {
    setPhotoItems((prev) => {
      revokePhotoPreviews(prev)
      return []
    })

    if (galleryInputRef.current) galleryInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }, [])

  const handleFileChange = useCallback((event) => {
    const nextFiles = Array.from(event.target.files ?? [])
    if (!nextFiles.length) return

    setPhotoItems((prev) => [...prev, ...buildNewPhotoItems(nextFiles)].slice(0, maxPhotos))
    event.target.value = ''
  }, [maxPhotos])

  const handleRemovePhoto = useCallback((targetIndex) => {
    setPhotoItems((prev) => {
      const target = prev[targetIndex]
      revokePhotoPreview(target)
      return prev.filter((_, index) => index !== targetIndex)
    })
  }, [])

  return {
    cameraInputRef,
    clearPhotos,
    galleryInputRef,
    handleFileChange,
    handleRemovePhoto,
    photoItems,
  }
}
