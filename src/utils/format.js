// Utility helpers can live here

export function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

