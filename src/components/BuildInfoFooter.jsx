import React from 'react'

export default function BuildInfoFooter() {
  return (
    <footer className="mt-6 text-xs text-slate-400 text-center">
      <span>iAVA.ai · build info via /api/health · </span>
      <a href="/api/health" className="underline hover:text-slate-300">health</a>
    </footer>
  )
}

