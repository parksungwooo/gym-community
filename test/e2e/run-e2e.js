import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import process from 'node:process'
import path from 'node:path'
import { spawn } from 'node:child_process'
import os from 'node:os'

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..')
const DIST_DIR = path.join(PROJECT_ROOT, 'dist')
const DEVTOOLS_PORT = 9228
const APP_PORT = 4173
const GUEST_DB_NAME = 'GymCommunityGuestDB'
const GUEST_STORE_NAME = 'guest_workouts'

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
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true })
      this.socket.addEventListener('error', reject, { once: true })
    })

    this.socket.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data)
      if (!payload.id) return

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

        request.onsuccess = () => resolve(request.result ?? [])
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
  assert.ok(metrics.bottom <= metrics.viewportHeight, `${label} should stay within the viewport (${metrics.bottom} > ${metrics.viewportHeight})`)
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

  try {
    const version = await waitForDebuggerVersion(DEVTOOLS_PORT)
    browserSession = new CdpSession(version.webSocketDebuggerUrl)
    const { targetId } = await browserSession.send('Target.createTarget', { url: appUrl })
    const pageWebSocketUrl = await waitForTarget(DEVTOOLS_PORT, targetId)
    session = new CdpSession(pageWebSocketUrl)
    await session.send('Runtime.enable')
    await session.send('Page.enable')
    await session.send('Emulation.setDeviceMetricsOverride', {
      width: 430,
      height: 980,
      deviceScaleFactor: 2,
      mobile: true,
    })

    await waitForCondition(
      session,
      "Boolean(document.querySelector('[data-testid=\"bottom-tab-nav\"]')) && Boolean(document.querySelector('[data-testid=\"home-log-workout\"]'))",
      'home screen',
    )
    await assertElementInViewport(session, '[data-testid="theme-toggle"]', 'theme toggle button')

    await click(session, '[data-testid="home-log-workout"]')
    await waitForCondition(session, "Boolean(document.querySelector('[data-testid=\"workout-sheet\"]'))", 'workout sheet')
    await delay(280)
    await assertBottomSheetPresentation(session, '[data-testid="workout-sheet"]', 'workout sheet')
    await click(session, '.capture-submit-btn')
    await waitForCondition(session, "!document.querySelector('[data-testid=\"workout-sheet\"]')", 'saved guest workout sheet')
    await waitForCondition(
      session,
      "!document.querySelector('.auth-modal-card')",
      'guest workout save without auth prompt',
    )

    const guestRecords = await readGuestWorkoutRecords(session)
    assert.equal(guestRecords.length, 1, 'Guest workout should be stored locally')
    assert.equal(guestRecords[0]?.workoutType?.length > 0, true, 'Stored workout should include a workout type')
    assert.equal(Number(guestRecords[0]?.durationMinutes), 30, 'Stored workout should preserve duration')
    assert.equal(typeof guestRecords[0]?.loggedDate, 'string', 'Stored workout should include a logged date')
    assert.equal(Number(guestRecords[0]?.weightKg) > 0, true, 'Stored workout should include the derived weight')

    await session.send('Page.reload')
    await waitForCondition(
      session,
      "Boolean(document.querySelector('[data-testid=\"bottom-tab-nav\"]')) && Boolean(document.querySelector('[data-testid=\"home-log-workout\"]'))",
      'home screen after reload',
    )
    const persistedGuestRecords = await readGuestWorkoutRecords(session)
    assert.equal(persistedGuestRecords.length, 1, 'Guest workout should persist after reload')

    await click(session, '[data-testid="tab-community"]')
    await waitForCondition(session, "Boolean(document.querySelector('[data-testid=\"community-tablist\"]'))", 'community screen')
    await waitForCondition(
      session,
      "Boolean(document.querySelector('.feed-card .like-btn'))",
      'community feed like action',
    )
    await click(session, '.feed-card .like-btn')
    await waitForCondition(
      session,
      "Boolean(document.querySelector('.auth-modal-card')) && Boolean(document.querySelector('.auth-modal-card .social-btn.google'))",
      'auth required modal',
    )
    await click(session, '.auth-modal-close')
    await waitForCondition(
      session,
      "!document.querySelector('.auth-modal-card')",
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
      "Boolean(document.querySelector('.record-weight-log-card'))",
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
