// Example API module to organize backend calls
// Replace baseURL and endpoints as your backend evolves

const baseURL = '/api' // placeholder – configure when backend exists

export async function getHealth() {
  // Example health check; swap for a real endpoint later
  return { ok: true, service: 'iava-ui', time: new Date().toISOString() }
}

