const DB_NAME = 'GymCommunityGuestDB'
const DB_VERSION = 1
const STORE_NAME = 'guest_workouts'

function createStorageUnavailableError() {
  return new Error('IndexedDB is unavailable.')
}

function getDateKey(date = new Date()) {
  return date.toLocaleDateString('sv-SE')
}

function createGuestWorkoutId(now = new Date()) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${now.getTime()}-${Math.random().toString(16).slice(2)}`
}

export function supportsGuestWorkoutStorage() {
  return typeof indexedDB !== 'undefined'
}

export function buildGuestWorkoutRecord(workoutDetails = {}, now = new Date()) {
  return {
    id: createGuestWorkoutId(now),
    ...workoutDetails,
    loggedDate: workoutDetails.loggedDate || getDateKey(now),
    created_at: now.toISOString(),
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (!supportsGuestWorkoutStorage()) {
      reject(createStorageUnavailableError())
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveGuestWorkout(workoutDetails) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const record = buildGuestWorkoutRecord(workoutDetails)
    store.put(record)

    tx.oncomplete = () => {
      db.close()
      resolve(record)
    }
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function getGuestWorkouts() {
  if (!supportsGuestWorkoutStorage()) {
    return []
  }

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    let rows = []

    request.onsuccess = () => {
      rows = (request.result || []).sort((left, right) => {
        const leftTime = Date.parse(left?.created_at ?? '') || 0
        const rightTime = Date.parse(right?.created_at ?? '') || 0
        return leftTime - rightTime
      })
    }
    tx.oncomplete = () => {
      db.close()
      resolve(rows)
    }
    tx.onerror = () => reject(tx.error ?? request.error)
    tx.onabort = () => reject(tx.error ?? request.error)
  })
}

export async function clearGuestWorkouts() {
  if (!supportsGuestWorkoutStorage()) {
    return
  }

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.clear()

    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function deleteGuestWorkouts(ids = []) {
  const safeIds = [...new Set((ids ?? []).filter(Boolean))]

  if (!safeIds.length || !supportsGuestWorkoutStorage()) {
    return 0
  }

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    safeIds.forEach((id) => {
      store.delete(id)
    })

    tx.oncomplete = () => {
      db.close()
      resolve(safeIds.length)
    }
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}
