import React from 'react'
import { BackArrow } from './Icons'

export default function DatePicker({ dates, onSelect, onClose }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden panel-slide" style={{ background: 'var(--wa-sidebar-bg)' }}>
      <div className="h-[60px] flex items-center px-4 gap-3 flex-shrink-0" style={{ background: 'var(--wa-header-bg)', borderBottom: '1px solid var(--wa-border)' }}>
        <button onClick={onClose} className="p-1 tap-highlight rounded-full"><BackArrow size={22} /></button>
        <span className="font-medium text-[16px]" style={{ color: 'var(--wa-text)' }}>Jump to date</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-wrap gap-[6px]">
          {dates.map(d => (
            <button key={d} onClick={() => onSelect(d)}
              className="px-3 py-[6px] rounded-full text-[12.5px] tap-highlight transition-all duration-150 hover:scale-[1.03]"
              style={{ background: 'var(--wa-input-bg)', color: 'var(--wa-text)', border: '1px solid var(--wa-border)' }}>
              {d}
            </button>
          ))}
        </div>
        {dates.length === 0 && (
          <div className="text-center mt-8 text-[13px]" style={{ color: 'var(--wa-text-secondary)' }}>No dates found</div>
        )}
      </div>
    </div>
  )
}
