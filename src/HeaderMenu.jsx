import React, { useState, useRef, useEffect } from 'react'

export default function HeaderMenu({ onStats, onJumpToDate, onExportPdf, onSwap, swapActive }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="p-2 rounded-full hover:bg-[var(--wa-hover)] tap-highlight transition-colors">
        <svg viewBox="0 0 24 24" width={20} height={20} fill="var(--wa-icon)">
          <path d="M12 7a2 2 0 100-4 2 2 0 000 4zm0 2a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4z"/>
        </svg>
      </button>
      {open && (
        <div className="dropdown-enter absolute right-0 top-full mt-1 rounded-xl shadow-lg z-50 overflow-hidden py-[6px] min-w-[180px]"
          style={{ background: 'var(--wa-sidebar-bg)', border: '1px solid var(--wa-border)' }}>
          <button onClick={() => { onSwap(); }}
            className="flex items-center justify-between w-full px-5 py-[11px] text-[14.5px] hover:bg-[var(--wa-hover)] transition-colors"
            style={{ color: 'var(--wa-text)' }}>
            <span>Swap</span>
            <div className={`toggle-switch ${swapActive ? 'active' : ''}`} style={{ transform: 'scale(0.8)' }} />
          </button>
          {[
            ['Chat stats', onStats],
            ['Jump to date', onJumpToDate],
            ['Export as PDF', onExportPdf],
          ].map(([label, action]) => (
            <button key={label} onClick={() => { setOpen(false); action() }}
              className="block w-full text-left px-5 py-[11px] text-[14.5px] hover:bg-[var(--wa-hover)] transition-colors"
              style={{ color: 'var(--wa-text)' }}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
