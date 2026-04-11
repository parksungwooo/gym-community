function escapeSvgText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildShareSvg({
  title,
  eyebrow,
  metric,
  detail,
  footer,
  accent = '#00d4aa',
  planSummary = '',
}) {
  const safeTitle = escapeSvgText(title)
  const safeEyebrow = escapeSvgText(eyebrow)
  const safeMetric = escapeSvgText(metric)
  const safeDetail = escapeSvgText(detail)
  const safeFooter = escapeSvgText(footer)
  const safePlanSummary = escapeSvgText(planSummary)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#07111f"/>
      <stop offset="52%" stop-color="#0b2030"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
    <radialGradient id="glow" cx="78%" cy="12%" r="54%">
      <stop offset="0%" stop-color="#7cffd5" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#7cffd5" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" rx="64" fill="url(#bg)"/>
  <rect width="1200" height="630" rx="64" fill="url(#glow)"/>
  <circle cx="948" cy="124" r="156" fill="${accent}" opacity="0.16"/>
  <circle cx="1060" cy="502" r="210" fill="#38bdf8" opacity="0.14"/>
  <rect x="72" y="70" width="1056" height="490" rx="48" fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
  <text x="120" y="142" fill="#7cffd5" font-family="Inter, Pretendard, Arial, sans-serif" font-size="34" font-weight="800" letter-spacing="5">${safeEyebrow}</text>
  <text x="120" y="250" fill="#ffffff" font-family="Inter, Pretendard, Arial, sans-serif" font-size="78" font-weight="950">${safeTitle}</text>
  <text x="120" y="356" fill="#ffffff" font-family="Inter, Pretendard, Arial, sans-serif" font-size="104" font-weight="950">${safeMetric}</text>
  <text x="124" y="424" fill="#cbd5e1" font-family="Inter, Pretendard, Arial, sans-serif" font-size="34" font-weight="700">${safeDetail}</text>
  ${safePlanSummary ? `<rect x="120" y="448" width="640" height="54" rx="27" fill="rgba(255,255,255,0.12)"/>
  <text x="154" y="483" fill="#f8fafc" font-family="Inter, Pretendard, Arial, sans-serif" font-size="24" font-weight="800">${safePlanSummary}</text>` : ''}
  <rect x="120" y="512" width="320" height="62" rx="31" fill="${accent}"/>
  <text x="154" y="553" fill="#07111f" font-family="Inter, Pretendard, Arial, sans-serif" font-size="28" font-weight="950">GYM COMMUNITY</text>
  <text x="780" y="552" fill="#e2e8f0" font-family="Inter, Pretendard, Arial, sans-serif" font-size="28" font-weight="700">${safeFooter}</text>
</svg>`
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export function buildShareCardDataUrl(payload) {
  const svg = buildShareSvg(payload)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function createImageFromSvg(svg) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const objectUrl = URL.createObjectURL(svgBlob)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('share_card_image_load_failed'))
    }
    image.src = objectUrl
  })
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error('share_card_canvas_failed'))
    }, 'image/png', 0.96)
  })
}

export async function generateShareCard(payload, filename = 'gym-community-share-card.png') {
  const svg = buildShareSvg(payload)
  const image = await createImageFromSvg(svg)
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630

  const context = canvas.getContext('2d')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  const pngBlob = await canvasToBlob(canvas)
  const file = new File([pngBlob], filename, { type: 'image/png' })

  return {
    file,
    pngBlob,
    svg,
    dataUrl: canvas.toDataURL('image/png', 0.96),
  }
}

export async function shareOrDownloadCard(payload, filename = 'gym-community-share.svg') {
  const dataUrl = buildShareCardDataUrl(payload)
  const text = [payload.eyebrow, payload.title, payload.metric, payload.detail].filter(Boolean).join(' · ')

  if (navigator.share) {
    try {
      await navigator.share({
        title: payload.title || 'Gym Community',
        text,
        url: window.location.href,
      })
      return { shared: true, downloaded: false }
    } catch (error) {
      if (error?.name === 'AbortError') return { shared: false, downloaded: false }
    }
  }

  downloadDataUrl(dataUrl, filename)
  return { shared: false, downloaded: true }
}
