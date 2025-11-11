import React, { useEffect, useRef, useState } from 'react'

export default function SymbolSearch({ value, onChange, onSubmit }) {
  const [q, setQ] = useState(value || '')
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const ref = useRef(null)

  useEffect(() => setQ(value || ''), [value])

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  async function search(s) {
    if (!s || s.length < 1) {
      setItems([])
      return
    }
    try {
      const r = await fetch(`/api/alpaca/assets?q=${encodeURIComponent(s)}&limit=12`)
      const j = await r.json()
      if (Array.isArray(j)) setItems(j)
    } catch {
      setItems([])
    }
  }

  function submit(sym) {
    const symU = (sym || q).toUpperCase()
    onChange?.(symU)
    onSubmit?.(symU)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <input
        value={q}
        onChange={e => {
          const v = e.target.value.toUpperCase()
          setQ(v)
          onChange?.(v)
          search(v)
          setOpen(true)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') submit()
        }}
        placeholder="🔍 Symbol"
        className="input text-sm w-[120px] font-semibold"
      />
      {open && items.length > 0 && (
        <div className="absolute z-10 mt-1 card p-1 w-64 max-h-64 overflow-auto shadow-xl border-indigo-500/30">
          {items.map(it => (
            <div
              key={it.symbol}
              className="px-3 py-2 hover:bg-indigo-500/10 rounded cursor-pointer flex items-center justify-between transition-colors"
              onClick={() => submit(it.symbol)}
            >
              <span className="text-slate-100 text-sm font-semibold">{it.symbol}</span>
              <span className="text-slate-500 text-xs truncate ml-2">{it.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
