export function getAll() {
  try {
    const raw = localStorage.getItem('iava.watchlists')
    const obj = raw ? JSON.parse(raw) : {}
    return obj && typeof obj === 'object' ? obj : {}
  } catch (_) {
    return {}
  }
}

function persist(obj) {
  try { localStorage.setItem('iava.watchlists', JSON.stringify(obj)) } catch {}
}

export function listNames() {
  const all = getAll()
  return Object.keys(all)
}

export function get(name) {
  const all = getAll()
  return all[name] || null
}

export function save(name, symbols = []) {
  const all = getAll()
  const uniq = Array.from(new Set((symbols || []).map(s => String(s || '').trim().toUpperCase()).filter(Boolean)))
  all[name] = { symbols: uniq, updatedAt: new Date().toISOString() }
  persist(all)
  return all[name]
}

export function remove(name) {
  const all = getAll()
  if (all[name]) { delete all[name]; persist(all) }
}

export function setActive(name) {
  try { localStorage.setItem('iava.activeWatchlist', String(name || '')) } catch {}
}

export function getActive() {
  try { return localStorage.getItem('iava.activeWatchlist') || '' } catch { return '' }
}
