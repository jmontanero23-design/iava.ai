const maps = new Map()

export function getCacheMap(name) {
  if (!maps.has(name)) maps.set(name, new Map())
  return maps.get(name)
}

export function getCache(map, key, ttl) {
  const entry = map.get(key)
  if (!entry) return null
  if (ttl && Date.now() - entry.at > ttl) {
    map.delete(key)
    return null
  }
  return entry.value
}

export function setCache(map, key, value) {
  map.set(key, { value, at: Date.now() })
}

