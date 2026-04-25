import React from 'react'
import { useTheme } from './ThemeContext'

const opts = ['system', 'light', 'dark']

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="flex rounded-full p-[2px] gap-[1px]" style={{ background: 'var(--wa-input-bg)' }}>
      {opts.map(o => (
        <button key={o} onClick={() => setTheme(o)}
          className="px-2.5 py-[3px] rounded-full text-[11px] capitalize transition-all duration-200 tap-highlight"
          style={{
            background: theme === o ? 'var(--wa-sidebar-bg)' : 'transparent',
            color: theme === o ? 'var(--wa-text)' : 'var(--wa-text-secondary)',
            boxShadow: theme === o ? '0 1px 3px rgba(0,0,0,.12)' : 'none',
            fontWeight: theme === o ? 500 : 400,
          }}>
          {o}
        </button>
      ))}
    </div>
  )
}
