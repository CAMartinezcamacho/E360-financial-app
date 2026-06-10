// Cloud sync helpers — talk to /api/sync which proxies to Oracle ORDS
// In Capacitor (native app), uses NEXT_PUBLIC_SYNC_API_URL to call the Vercel API directly

let syncTimeout: ReturnType<typeof setTimeout> | null = null
let isSyncing = false

const SYNC_KEY_STORAGE = 'e360-sync-key'

// When running as native app (Capacitor WebView on localhost), relative URLs won't work.
// Set NEXT_PUBLIC_SYNC_API_URL=https://your-app.vercel.app during `npm run build:cap`
const API_BASE =
  process.env.NEXT_PUBLIC_SYNC_API_URL || '/api/sync'

export function getSyncKey(): string {
  if (typeof window === 'undefined') return 'default'
  return localStorage.getItem(SYNC_KEY_STORAGE) || 'default'
}

export function setSyncKey(key: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SYNC_KEY_STORAGE, key.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'default')
}

export async function saveToCloud(state: object): Promise<boolean> {
  try {
    const key = getSyncKey()
    const url = API_BASE.includes('?') ? API_BASE : `${API_BASE}?key=${encodeURIComponent(key)}`
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function loadFromCloud(key?: string): Promise<object | null> {
  try {
    const syncKey = key || getSyncKey()
    const url = `${API_BASE}?key=${encodeURIComponent(syncKey)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data.found ? data.state : null
  } catch {
    return null
  }
}

// Debounced save — waits 3s after last change before saving
export function scheduleSave(state: object, onSaved?: (ok: boolean) => void) {
  if (syncTimeout) clearTimeout(syncTimeout)
  syncTimeout = setTimeout(async () => {
    if (isSyncing) return
    isSyncing = true
    const ok = await saveToCloud(state)
    isSyncing = false
    onSaved?.(ok)
  }, 3000)
}
