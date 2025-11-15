import React, { useEffect, useRef, useState } from 'react'

export default function InfoPopover({ title, children }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return
      if (!ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const width = 260
      const margin = 8
      const top = rect.bottom + margin
      const leftRaw = rect.left
      const maxLeft = window.innerWidth - width - margin
      const left = Math.max(margin, Math.min(leftRaw, maxLeft))
      setPos({ top, left, width })
    }
  }

  return (
    <>
      <button
        type="button"
        ref={ref}
        onClick={toggle}
        className="w-4 h-4 rounded-full bg-slate-700/90 hover:bg-slate-600 text-slate-200 text-[10px] leading-4 text-center align-middle flex items-center justify-center"
      >
        ?
      </button>
      {open && pos && (
        <div
          className="fixed z-50 p-2 bg-slate-900 border border-slate-700 rounded shadow-xl text-left"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          {title && <div className="text-xs font-semibold text-slate-200 mb-1">{title}</div>}
          <div className="text-xs text-slate-300 whitespace-pre-line">{children}</div>
        </div>
      )}
    </>
  )
}
