import { generateShareCard, shareOrDownloadCard } from './shareCard.js'

const KAKAO_SDK_TIMEOUT_MS = 2400

function getKakaoSdk() {
  if (typeof window === 'undefined') return null
  return window.Kakao ?? null
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function waitForKakaoSdk() {
  const startedAt = Date.now()

  while (Date.now() - startedAt < KAKAO_SDK_TIMEOUT_MS) {
    const kakao = getKakaoSdk()
    if (kakao?.Share || kakao?.Link) return kakao
    await delay(120)
  }

  return getKakaoSdk()
}

export async function ensureKakaoReady() {
  const kakao = await waitForKakaoSdk()
  const jsKey = import.meta.env.VITE_KAKAO_JS_KEY

  if (!kakao || !jsKey) {
    return null
  }

  if (typeof kakao.isInitialized === 'function' && !kakao.isInitialized()) {
    kakao.init(jsKey)
  }

  return kakao
}

export function buildKakaoShareUrl({
  baseUrl,
  contentType = 'general',
  campaign = 'gym_community_share',
} = {}) {
  const fallbackUrl = typeof window !== 'undefined' ? window.location.href : 'https://gym-community.vercel.app'
  const url = new URL(baseUrl || fallbackUrl)

  url.searchParams.set('utm_source', 'kakaotalk')
  url.searchParams.set('utm_medium', 'social')
  url.searchParams.set('utm_campaign', campaign)
  url.searchParams.set('utm_content', contentType)

  return url.toString()
}

function createUploadFileList(file) {
  if (typeof DataTransfer === 'function') {
    const transfer = new DataTransfer()
    transfer.items.add(file)
    return transfer.files
  }

  return [file]
}

function getUploadedImageUrl(uploadResult) {
  return (
    uploadResult?.infos?.original?.url
    || uploadResult?.infos?.[0]?.url
    || uploadResult?.url
    || ''
  )
}

function getKakaoShareApi(kakao) {
  return kakao?.Share ?? kakao?.Link ?? null
}

function sendKakaoDefault(kakao, template) {
  const shareApi = getKakaoShareApi(kakao)

  if (!shareApi?.sendDefault) {
    throw new Error('kakao_share_unavailable')
  }

  return shareApi.sendDefault(template)
}

async function uploadKakaoImage(kakao, file) {
  const shareApi = getKakaoShareApi(kakao)

  if (!shareApi?.uploadImage) {
    return ''
  }

  const result = await shareApi.uploadImage({
    file: createUploadFileList(file),
  })

  return getUploadedImageUrl(result)
}

function buildShareText(payload, isPremium) {
  const title = payload?.title || 'Gym Community'
  const metric = payload?.metric ? ` · ${payload.metric}` : ''
  const detail = payload?.detail ? `\n${payload.detail}` : ''
  const proLine = isPremium ? '\nPro 성장 카드로 공유했어요.' : '\n내 운동 기록을 공유했어요.'

  return `${title}${metric}${detail}${proLine}`
}

function buildFreeTemplate({ payload, shareUrl, isEnglish }) {
  return {
    objectType: 'text',
    text: buildShareText(payload, false),
    link: {
      mobileWebUrl: shareUrl,
      webUrl: shareUrl,
    },
    buttonTitle: isEnglish ? 'Open Gym Community' : 'Gym Community 열기',
  }
}

function buildPremiumTemplate({ payload, shareUrl, imageUrl, isEnglish }) {
  return {
    objectType: 'feed',
    content: {
      title: payload?.title || (isEnglish ? 'My Gym Community progress' : '나의 Gym Community 성장 기록'),
      description: [payload?.metric, payload?.detail, payload?.planSummary].filter(Boolean).join(' · '),
      imageUrl,
      link: {
        mobileWebUrl: shareUrl,
        webUrl: shareUrl,
      },
    },
    buttons: [
      {
        title: isEnglish ? 'See my progress' : '내 기록 보러가기',
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
    ],
  }
}

async function fallbackShare({ payload, shareUrl, isPremium, filename }) {
  if (isPremium) {
    return shareOrDownloadCard(payload, filename)
  }

  const text = buildShareText(payload, false)

  if (navigator.share) {
    try {
      await navigator.share({
        title: payload?.title || 'Gym Community',
        text,
        url: shareUrl,
      })
      return { shared: true, fallback: 'web-share' }
    } catch (error) {
      if (error?.name === 'AbortError') return { shared: false, fallback: 'aborted' }
    }
  }

  await navigator.clipboard?.writeText(`${text}\n${shareUrl}`)
  return { shared: false, copied: true, fallback: 'clipboard' }
}

export async function shareToKakao({
  payload,
  isPremium = false,
  contentType = 'general',
  isEnglish = false,
  filename = 'gym-community-kakao-card.png',
  baseUrl,
} = {}) {
  const shareUrl = buildKakaoShareUrl({ baseUrl, contentType })
  const kakao = await ensureKakaoReady()

  if (!kakao) {
    return fallbackShare({ payload, shareUrl, isPremium, filename })
  }

  if (!isPremium) {
    sendKakaoDefault(kakao, buildFreeTemplate({ payload, shareUrl, isEnglish }))
    return { shared: true, premiumCard: false, shareUrl }
  }

  try {
    const { file } = await generateShareCard(payload, filename)
    const uploadedImageUrl = await uploadKakaoImage(kakao, file)

    if (!uploadedImageUrl) {
      return fallbackShare({ payload, shareUrl, isPremium, filename })
    }

    sendKakaoDefault(kakao, buildPremiumTemplate({
      payload,
      shareUrl,
      imageUrl: uploadedImageUrl,
      isEnglish,
    }))

    return {
      shared: true,
      premiumCard: true,
      shareUrl,
      imageUrl: uploadedImageUrl,
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      return { shared: false, premiumCard: false, shareUrl }
    }

    return fallbackShare({ payload, shareUrl, isPremium, filename })
  }
}
