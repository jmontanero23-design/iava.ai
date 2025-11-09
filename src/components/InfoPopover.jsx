import React, { useEffect, useRef, useState } from 'react'

export default function InfoPopover({ title, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return
      if (!ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])
  return (
    <div className="relative inline-block" ref={ref}>
      <button type="button" onClick={() => setOpen(v => !v)} className="w-4 h-4 rounded-full bg-slate-700 text-slate-200 text-[10px] leading-4 text-center align-middle">?</button>
      {open && (
        <div className="absolute z-10 mt-2 w-64 p-2 bg-slate-900 border border-slate-700 rounded shadow">
          {title && <div className="text-xs font-semibold text-slate-200 mb-1">{title}</div>}
          <div className="text-xs text-slate-300">{children}</div>
        </div>
      )}
    </div>
  )
}

