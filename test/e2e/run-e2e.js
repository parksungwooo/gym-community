import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import process from 'node:process'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { Buffer } from 'node:buffer'
import os from 'node:os'

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..')
const DIST_DIR = path.join(PROJECT_ROOT, 'dist')
const DEVTOOLS_PORT = 9228
const APP_PORT = 4173
const GUEST_DB_NAME = 'GymCommunityGuestDB'
const GUEST_STORE_NAME = 'guest_workouts'
const E2E_CAPTURE = process.env.E2E_CAPTURE === '1'
const E2E_REPORT = process.env.E2E_REPORT === '1'
const SYNTHETIC_PHOTO_NAME = 'e2e-proof.png'
const SYNTHETIC_PHOTO_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0MsAAAAASUVORK5CYII='
const PRIMARY_VIEWPORT = { width: 430, height: 980 }
const ADDITIONAL_MOBILE_VIEWPORTS = [
  { width: 390, height: 844, label: 'iphone-regular' },
  { width: 375, height: 812, label: 'iphone-compact' },
  { width: 320, height: 640, label: 'small-android' },
]
const E2E_NOTE = '모바일 실사용 점검 메모'

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForProcessExit(child, timeoutMs = 5000) {
  if (!child || child.exitCode !== null || child.killed) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve()
    }, timeoutMs)

    child.once('exit', () => {
      clearTimeout(timeoutId)
      resolve()
    })
  })
}

function getMimeType(filePath) {
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8'
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8'
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8'
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8'
  if (filePath.endsWith('.svg')) return 'image/svg+xml'
  if (filePath.endsWith('.png')) return 'image/png'
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg'
  return 'text/plain; charset=utf-8'
}

function createStaticServer(rootDir, port) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', `http://127.0.0.1:${port}`)
    const normalizedPath = decodeURIComponent(requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname)
    let filePath = path.join(rootDir, normalizedPath)

    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403)
      response.end('Forbidden')
      return
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(rootDir, 'index.html')
    }

    response.writeHead(200, {
      'Content-Type': getMimeType(filePath),
      'Cache-Control': 'no-store',
    })
    fs.createReadStream(filePath).pipe(response)
  })

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server))
  })
}

function findBrowserExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ]

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  return response.json()
}

class CdpSession {
  constructor(webSocketUrl) {
    this.socket = new WebSocket(webSocketUrl)
    this.nextId = 1
    this.pending = new Map()
    this.listeners = new Map()
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true })
      this.socket.addEventListener('error', reject, { once: true })
    })

    this.socket.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data)
      if (!payload.id) {
        const handlers = this.listeners.get(payload.method) ?? []
        handlers.forEach((handler) => handler(payload.params))
        return
      }

      const handlers = this.pending.get(payload.id)
      if (!handlers) return

      this.pending.delete(payload.id)
      if (payload.error) {
        handlers.reject(new Error(payload.error.message))
        return
      }

      handlers.resolve(payload.result)
    })
  }

  on(method, handler) {
    const handlers = this.listeners.get(method) ?? []
    handlers.push(handler)
    this.listeners.set(method, handlers)
  }

  async send(method, params = {}) {
    await this.ready
    const id = this.nextId += 1
    const payload = JSON.stringify({ id, method, params })

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(payload)
    })
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })

    return result.result?.value
  }

  async close() {
    for (const [, handlers] of this.pending) {
      handlers.reject(new Error('CDP session closed'))
    }
    this.pending.clear()
    this.socket.close()
  }
}

async function waitForDebuggerVersion(port, timeoutMs = 10000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const version = await fetchJson(`http://127.0.0.1:${port}/json/version`)
      if (version?.webSocketDebuggerUrl) {
        return version
      }
    } catch {
      // keep polling during Chrome startup
    }

    await delay(150)
  }

  throw new Error('Timed out waiting for browser debugger')
}

async function waitForTarget(port, targetId, timeoutMs = 10000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`)
      const page = targets.find((target) => target.id === targetId)
      if (page?.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl
      }
    } catch {
      // keep polling during target startup
    }

    await delay(120)
  }

  throw new Error('Timed out waiting for browser page target')
}

async function waitForCondition(session, expression, label, timeoutMs = 10000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    const result = await session.evaluate(expression)
    if (result) return result
    await delay(120)
  }

  throw new Error(`Timed out waiting for ${label}`)
}

async function click(session, selector) {
  const clicked = await session.evaluate(`(() => {
    const node = document.querySelector(${JSON.stringify(selector)})
    if (!node) return false
    node.click()
    return true
  })()`)

  assert.equal(clicked, true, `Could not click ${selector}`)
}

async function captureScreenshot(session, fileName) {
  if (!E2E_CAPTURE) return null

  const { data } = await session.send('Page.captureScreenshot', { format: 'png' })
  const filePath = path.join(PROJECT_ROOT, fileName)
  fs.writeFileSync(filePath, Buffer.from(data, 'base64'))
  return filePath
}

async function setTextValue(session, selector, value) {
  const updated = await session.evaluate(`(() => {
    const node = document.querySelector(${JSON.stringify(selector)})
    if (!node) return false
    node.focus()
    const prototype = node instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value')
    descriptor?.set?.call(node, ${JSON.stringify(value)})
    node.dispatchEvent(new Event('input', { bubbles: true }))
    node.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  })()`)

  assert.equal(updated, true, `Could not set value for ${selector}`)
}

async function setViewport(session, width, height) {
  await session.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: true,
  })
}

async function uploadSyntheticPhoto(session, selector) {
  const resultInfo = await session.evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(selector)})
    if (!input) return null
    const binary = Uint8Array.from(atob(${JSON.stringify(SYNTHETIC_PHOTO_BASE64)}), (char) => char.charCodeAt(0))
    const file = new File([binary], ${JSON.stringify(SYNTHETIC_PHOTO_NAME)}, { type: 'image/png' })
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [file],
    })
    input.dispatchEvent(new Event('change', { bubbles: true }))
    return {
      count: Array.isArray(input.files) ? input.files.length : (input.files?.length ?? 0),
      name: input.files[0]?.name ?? null,
      type: input.files[0]?.type ?? null,
    }
  })()`)

  assert.ok(resultInfo, `Could not upload a synthetic photo into ${selector}`)
  assert.equal(resultInfo.count, 1, 'Synthetic upload should attach one photo')
  assert.equal(resultInfo.name, SYNTHETIC_PHOTO_NAME, 'Synthetic upload should keep the expected file name')
  return resultInfo
}

async function readGuestWorkoutRecords(session) {
  return session.evaluate(`(async () => {
    const openDb = () => new Promise((resolve, reject) => {
      const request = indexedDB.open(${JSON.stringify(GUEST_DB_NAME)})
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    const db = await openDb()

    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(${JSON.stringify(GUEST_STORE_NAME)}, 'readonly')
        const store = tx.objectStore(${JSON.stringify(GUEST_STORE_NAME)})
        const request = store.getAll()

        request.onsuccess = () => resolve((request.result ?? []).map((record) => ({
          ...record,
          photoItems: Array.isArray(record.photoItems)
            ? record.photoItems.map((item) => ({
                kind: item?.kind ?? null,
                label: item?.label ?? null,
                fileName: item?.file?.name ?? null,
                fileType: item?.file?.type ?? null,
              }))
            : [],
        })))
        request.onerror = () => reject(request.error)
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
      })
    } finally {
      db.close()
    }
  })()`)
}

async function assertElementInViewport(session, selector, label) {
  const metrics = await session.evaluate(`(() => {
    const node = document.querySelector(${JSON.stringify(selector)})
    if (!node) return null
    const rect = node.getBoundingClientRect()
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }
  })()`)

  assert.ok(metrics, `Could not find ${label}`)
  assert.ok(metrics.width > 0 && metrics.height > 0, `${label} should have a visible size`)
  assert.ok(metrics.left >= 0, `${label} is clipped on the left (${metrics.left})`)
  assert.ok(metrics.top >= 0, `${label} is clipped on the top (${metrics.top})`)
  assert.ok(metrics.right <= metrics.viewportWidth, `${label} is clipped on the right (${metrics.right} > ${metrics.viewportWidth})`)
  assert.ok(metrics.bottom <= metrics.viewportHeight, `${label} is clipped on the bottom (${metrics.bottom} > ${metrics.viewportHeight})`)
}

async function assertBottomSheetPresentation(session, selector, label) {
  const metrics = await session.evaluate(`(() => {
    const node = document.querySelector(${JSON.stringify(selector)})
    if (!node) return null
    const rect = node.getBoundingClientRect()
    const styles = getComputedStyle(node)
    return {
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      viewportHeight: window.innerHeight,
      position: styles.position,
      borderTopLeftRadius: Number.parseFloat(styles.borderTopLeftRadius) || 0,
    }
  })()`)

  assert.ok(metrics, `Could not find ${label}`)
  assert.ok(metrics.top >= 8, `${label} should leave space above the sheet (${metrics.top})`)
  assert.ok(metrics.height < metrics.viewportHeight, `${label} should not consume the full viewport (${metrics.height} >= ${metrics.viewportHeight})`)
  assert.notEqual(metrics.position, 'fixed', `${label} should not be locked as a fullscreen fixed panel`)
  assert.ok(metrics.borderTopLeftRadius >= 20, `${label} should keep a rounded top edge (${metrics.borderTopLeftRadius})`)
  assert.ok(metrics.bottom <= metrics.viewportHeight + 1, `${label} should stay within the viewport (${metrics.bottom} > ${metrics.viewportHeight})`)
}

async function run() {
  assert.equal(fs.existsSync(path.join(DIST_DIR, 'index.html')), true, 'Build output is missing. Run npm run build first.')

  const browserPath = findBrowserExecutable()
  assert.ok(browserPath, 'Chrome or Edge executable not found for E2E test')

  const server = await createStaticServer(DIST_DIR, APP_PORT)
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gym-community-e2e-'))
  const appUrl = `http://127.0.0.1:${APP_PORT}/?e2e=1#/home`
  const browser = spawn(browserPath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-debugging-address=127.0.0.1',
    `--remote-debugging-port=${DEVTOOLS_PORT}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ], {
    stdio: 'ignore',
  })

  let browserSession = null
  let session = null
  const consoleErrors = []
  const pageErrors = []
  const viewportChecks = []

  try {
    const version = await waitForDebuggerVersion(DEVTOOLS_PORT)
    browserSession = new CdpSession(version.webSocketDebuggerUrl)
    const { targetId } = await browserSession.send('Target.createTarget', { url: appUrl })
    const pageWebSocketUrl = await waitForTarget(DEVTOOLS_PORT, targetId)
    session = new CdpSession(pageWebSocketUrl)
    session.on('Runtime.consoleAPICalled', (params) => {
      if (params.type !== 'error') return
      const text = (params.args ?? []).map((arg) => arg.value ?? arg.description ?? '').join(' ')
      consoleErrors.push(text)
    })
    session.on('Runtime.exceptionThrown', (params) => {
      pageErrors.push(params.exceptionDetails?.text ?? 'Unknown exception')
    })
    await session.send('Runtime.enable')
    await session.send('Page.enable')
    await session.send('DOM.enable')
    await session.send('Log.enable')
    await setViewport(session, PRIMARY_VIEWPORT.width, PRIMARY_VIEWPORT.height)

    for (const viewport of ADDITIONAL_MOBILE_VIEWPORTS) {
      await setViewport(session, viewport.width, viewport.height)
      await session.send('Page.reload')
      await waitForCondition(
        session,
        "Boolean(document.querySelector('[data-testid=\"bottom-tab-nav\"]')) && Boolean(document.querySelector('[data-testid=\"home-log-workout\"]'))",
        `home screen ${viewport.label}`,
      )
      await click(session, '[data-testid="home-log-workout"]')
      await waitForCondition(session, "Boolean(document.querySelector('[data-testid=\"workout-sheet\"]'))", `workout sheet ${viewport.label}`)
      await delay(280)
      await assertBottomSheetPresentation(session, '[data-testid="workout-sheet"]', `workout sheet ${viewport.label}`)
      await assertElementInViewport(session, '[data-testid="workout-sheet-close"]', `close button ${viewport.label}`)
      const compactScrollMetrics = await session.evaluate(`(() => {
        const card = document.querySelector('[data-testid="workout-panel-surface"]')
        const submit = document.querySelector('[data-testid="workout-submit"]')
        if (!card || !submit) return null
        card.scrollTop = card.scrollHeight
        const rect = submit.getBoundingClientRect()
        return {
          scrollTop: card.scrollTop,
          scrollHeight: card.scrollHeight,
          clientHeight: card.clientHeight,
          submitBottom: rect.bottom,
          viewportHeight: window.innerHeight,
        }
      })()`)
      assert.ok(compactScrollMetrics, `Missing compact metrics for ${viewport.label}`)
      assert.ok(compactScrollMetrics.scrollHeight >= compactScrollMetrics.clientHeight, `${viewport.label} should keep a scrollable sheet`)
      assert.ok(compactScrollMetrics.submitBottom <= compactScrollMetrics.viewportHeight, `${viewport.label} should keep the submit button inside the viewport after scrolling`)
      viewportChecks.push({
        label: viewport.label,
        width: viewport.width,
        height: viewport.height,
        scrollHeight: compactScrollMetrics.scrollHeight,
        clientHeight: compactScrollMetrics.clientHeight,
      })
      if (E2E_CAPTURE) {
        await captureScreenshot(session, `qa-mobile-${viewport.label}-workout-check.png`)
      }
      await click(session, '[data-testid="workout-sheet-close"]')
      await waitForCondition(session, "!document.querySelector('[data-testid=\"workout-sheet\"]')", `closed sheet ${viewport.label}`)
    }

    await setViewport(session, PRIMARY_VIEWPORT.width, PRIMARY_VIEWPORT.height)
    await session.send('Page.reload')

    await waitForCondition(
      session,
      "Boolean(document.querySelector('[data-testid=\"bottom-tab-nav\"]')) && Boolean(document.querySelector('[data-testid=\"home-log-workout\"]'))",
      'home screen',
    )
    await delay(200)
    await captureScreenshot(session, 'qa-mobile-home-user-check.png')
    await assertElementInViewport(session, '[data-testid="theme-toggle"]', 'theme toggle button')

    await click(session, '[data-testid="home-log-workout"]')
    await waitForCondition(session, "Boolean(document.querySelector('[data-testid=\"workout-sheet\"]'))", 'workout sheet')
    await delay(280)
    await assertBottomSheetPresentation(session, '[data-testid="workout-sheet"]', 'workout sheet')
    await captureScreenshot(session, 'qa-mobile-workout-open-user-check.png')
    const manualEditorInitiallyCollapsed = await session.evaluate("Boolean(document.querySelector('[data-testid=\"manual-edit-fields\"]'))")
    assert.equal(manualEditorInitiallyCollapsed, false, 'Manual editor should stay collapsed for the default quick selection')
    await click(session, '[data-testid="manual-edit-toggle"]')
    await waitForCondition(session, "Boolean(document.querySelector('[data-testid=\"manual-edit-fields\"]'))", 'manual editor opened')
    await click(session, '[data-testid="manual-edit-toggle"]')
    await waitForCondition(session, "!document.querySelector('[data-testid=\"manual-edit-fields\"]')", 'manual editor collapsed')
    await click(session, '[data-testid="workout-toggle-extras"]')
    await waitForCondition(session, "Boolean(document.querySelector('[data-testid=\"workout-note\"]'))", 'optional fields')
    await setTextValue(session, '[data-testid="workout-note"]', E2E_NOTE)
    await uploadSyntheticPhoto(session, '[data-testid="workout-gallery-input"]')
    await waitForCondition(session, "document.querySelectorAll('[data-testid=\"photo-proof-preview\"]').length === 1", 'photo preview')
    await click(session, '[data-testid="share-toggle"]')
    await waitForCondition(session, "document.querySelector('[data-testid=\"share-toggle\"]')?.textContent?.includes('비공개') === true || document.querySelector('[data-testid=\"share-toggle\"]')?.textContent?.includes('Private') === true", 'private share toggle')
    const scrollMetrics = await session.evaluate(`(() => {
      const card = document.querySelector('[data-testid="workout-panel-surface"]')
      if (!card) return null
      card.scrollTop = card.scrollHeight
      return {
        scrollTop: card.scrollTop,
        scrollHeight: card.scrollHeight,
        clientHeight: card.clientHeight,
      }
    })()`)
    assert.ok(scrollMetrics, 'Workout sheet card should be scrollable')
    assert.ok(scrollMetrics.scrollHeight >= scrollMetrics.clientHeight, 'Workout sheet card should expose scroll geometry')
    await delay(160)
    await captureScreenshot(session, 'qa-mobile-workout-scrolled-user-check.png')
    await click(session, '[data-testid="workout-submit"]')
    await waitForCondition(session, "!document.querySelector('[data-testid=\"workout-sheet\"]')", 'saved guest workout sheet')
    await waitForCondition(
      session,
      "!document.querySelector('[data-testid=\"auth-required-modal\"]')",
      'guest workout save without auth prompt',
    )
    await waitForCondition(session, "Boolean(document.querySelector('[data-testid=\"app-toast\"]'))", 'guest save toast')
    await delay(320)
    await assertElementInViewport(session, '[data-testid="app-toast"]', 'guest save toast')
    await waitForCondition(session, "Boolean(document.querySelector('[data-testid=\"guest-sync-pending\"]'))", 'guest sync notice')
    await waitForCondition(
      session,
      "Boolean(document.querySelector('[data-testid=\"guest-sync-action\"]'))",
      'guest sync call to action',
    )

    const guestRecords = await readGuestWorkoutRecords(session)
    assert.equal(guestRecords.length, 1, 'Guest workout should be stored locally')
    assert.equal(guestRecords[0]?.workoutType?.length > 0, true, 'Stored workout should include a workout type')
    assert.equal(Number(guestRecords[0]?.durationMinutes), 30, 'Stored workout should preserve duration')
    assert.equal(typeof guestRecords[0]?.loggedDate, 'string', 'Stored workout should include a logged date')
    assert.equal(Number(guestRecords[0]?.weightKg) > 0, true, 'Stored workout should include the derived weight')
    assert.equal(guestRecords[0]?.note, E2E_NOTE, 'Stored workout should keep the typed note')
    assert.equal(guestRecords[0]?.shareToFeed, false, 'Stored workout should keep the private sharing choice')
    assert.equal(guestRecords[0]?.photoItems?.length, 1, 'Stored workout should keep one attached photo item')
    assert.equal(guestRecords[0]?.photoItems?.[0]?.fileName, SYNTHETIC_PHOTO_NAME, 'Stored workout should keep the attached photo file name')
    await captureScreenshot(session, 'qa-mobile-home-after-save-user-check.png')

    await session.send('Page.reload')
    await waitForCondition(
      session,
      "Boolean(document.querySelector('[data-testid=\"bottom-tab-nav\"]')) && Boolean(document.querySelector('[data-testid=\"home-log-workout\"]'))",
      'home screen after reload',
    )
    await waitForCondition(session, "Boolean(document.querySelector('[data-testid=\"guest-sync-pending\"]'))", 'guest sync notice after reload')
    const persistedGuestRecords = await readGuestWorkoutRecords(session)
    assert.equal(persistedGuestRecords.length, 1, 'Guest workout should persist after reload')

    await click(session, '[data-testid="tab-community"]')
    await waitForCondition(session, "Boolean(document.querySelector('[data-testid=\"community-tablist\"]'))", 'community screen')
    await waitForCondition(
      session,
      "Boolean(document.querySelector('[data-testid^=\"feed-like-\"]'))",
      'community feed like action',
    )
    await click(session, '[data-testid^="feed-like-"]')
    await waitForCondition(
      session,
      "Boolean(document.querySelector('[data-testid=\"auth-required-modal\"]')) && Boolean(document.querySelector('[data-testid=\"auth-google\"]'))",
      'auth required modal',
    )
    await click(session, '[data-testid="auth-modal-close"]')
    await waitForCondition(
      session,
      "!document.querySelector('[data-testid=\"auth-required-modal\"]')",
      'closed auth required modal',
    )
    await click(session, '[data-testid="community-tab-mate"]')
    await waitForCondition(
      session,
      "document.querySelector('[data-testid=\"community-tab-mate\"]')?.classList.contains('active') === true",
      'mate tab active',
    )

    await click(session, '[data-testid="tab-progress"]')
    await waitForCondition(
      session,
      "Boolean(document.querySelector('[data-testid=\"record-weight-log\"]'))",
      'progress screen',
    )
    await click(session, '[data-testid="progress-open-level-test"]')
    await waitForCondition(
      session,
      "Boolean(document.querySelector('[data-testid=\"level-test-dialog\"]')) && Boolean(document.querySelector('[data-testid=\"test-question-q1\"]'))",
      'level test dialog',
    )
    await click(session, '[data-testid="test-option-q1-0"]')
    await click(session, '[data-testid="test-next-question"]')
    await waitForCondition(
      session,
      "Boolean(document.querySelector('[data-testid=\"test-question-q2\"]'))",
      'second level test question',
    )
    await click(session, '[data-testid="level-test-close"]')
    await waitForCondition(
      session,
      "!document.querySelector('[data-testid=\"level-test-dialog\"]')",
      'closed level test dialog',
    )

    await click(session, '[data-testid="tab-profile"]')
    await waitForCondition(
      session,
      "Boolean(document.querySelector('[data-testid=\"profile-menu-profile\"]'))",
      'profile screen',
    )
    await click(session, '[data-testid="profile-menu-settings"]')
    await waitForCondition(
      session,
      "document.querySelector('[data-testid=\"profile-menu-settings\"]')?.classList.contains('active') === true",
      'profile settings menu',
    )

    const initialTheme = await session.evaluate("document.documentElement.dataset.theme || 'light'")
    const toggledTheme = initialTheme === 'dark' ? 'light' : 'dark'

    await click(session, '[data-testid="theme-toggle"]')
    await waitForCondition(
      session,
      `document.documentElement.dataset.theme === ${JSON.stringify(toggledTheme)}`,
      'theme toggle',
    )

    if (E2E_REPORT) {
      console.log(JSON.stringify({
        consoleErrors,
        pageErrors,
        viewportChecks,
        guestRecordCount: guestRecords.length,
        latestGuestRecord: guestRecords[0],
        scrollMetrics,
      }, null, 2))
    }

    console.log('E2E PASS core navigation and interaction flow')
  } finally {
    if (browserSession) {
      await browserSession.close().catch(() => {})
    }

    if (session) {
      await session.close().catch(() => {})
    }

    if (!browser.killed) {
      browser.kill('SIGTERM')
    }

    await waitForProcessExit(browser)

    await new Promise((resolve) => server.close(resolve))

    try {
      fs.rmSync(userDataDir, { recursive: true, force: true })
    } catch {
      // Windows can briefly keep the profile directory locked after shutdown.
    }
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
