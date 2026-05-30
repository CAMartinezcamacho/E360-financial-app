// Cloud sync helpers — talk to /api/sync which proxies to Oracle ORDS

let syncTimeout: ReturnType<typeof setTimeout> | null = null
let isSyncing = false

export async function saveToCloud(state: object): Promise<boolean> {
  try {
    const res = await fetch('/api/sync', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function loadFromCloud(): Promise<object | null> {
  try {
    const res = await fetch('/api/sync')
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
