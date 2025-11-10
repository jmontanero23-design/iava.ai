export function readParams() {
  if (typeof window === 'undefined') return {}
  const p = new URLSearchParams(window.location.search)
  const b = (v) => v === '1' || v === 'true'
  const num = (v, d) => {
    const n = parseInt(v ?? '', 10); return Number.isFinite(n) ? n : d
  }
  return {
    symbol: p.get('sym') || undefined,
    timeframe: p.get('tf') || undefined,
    threshold: num(p.get('th'), undefined),
    enforceDaily: b(p.get('edf')),
    streaming: b(p.get('str')),
    consensusBonus: b(p.get('cb')),
    ema821: b(p.get('e821')),
    ema512: b(p.get('e512')),
    ema89: b(p.get('e89')),
    ema3450: b(p.get('e3450')),
    ichi: b(p.get('ichi')),
    ribbon: b(p.get('rib')),
    saty: b(p.get('saty')),
  }
}

let lastReplace = 0
export function writeParams(state) {
  if (typeof window === 'undefined') return
  const now = Date.now()
  if (now - lastReplace < 500) return // throttle
  lastReplace = now
  const p = new URLSearchParams(window.location.search)
  const setB = (k, v) => { if (typeof v === 'boolean') p.set(k, v ? '1' : '0') }
  const setS = (k, v) => { if (v) p.set(k, v) }
  const setN = (k, v) => { if (typeof v === 'number') p.set(k, String(v)) }
  setS('sym', state.symbol)
  setS('tf', state.timeframe)
  setN('th', state.threshold)
  setB('edf', state.enforceDaily)
  setB('str', state.streaming)
  setB('cb', state.consensusBonus)
  setB('e821', state.showEma821)
  setB('e512', state.showEma512)
  setB('e89', state.showEma89)
  setB('e3450', state.showEma3450)
  setB('ichi', state.showIchi)
  setB('rib', state.showRibbon)
  setB('saty', state.showSaty)
  const url = `${window.location.pathname}?${p.toString()}`
  window.history.replaceState(null, '', url)
}
