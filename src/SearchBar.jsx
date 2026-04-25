import React, { useRef, useEffect } from 'react'
import { BackArrow, SearchIcon } from './Icons'

const ChevronUp = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--wa-icon)">
    <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
  </svg>
)
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--wa-icon)">
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
  </svg>
)

export default function SearchBar({ query, setQuery, matchCount, currentMatch, onPrev, onNext, onClose }) {
  const inputRef = useRef()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.shiftKey ? onPrev() : onNext()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="h-[50px] flex items-center px-3 gap-2 flex-shrink-0 dropdown-enter" style={{ background: 'var(--wa-sidebar-bg)', borderBottom: '1px solid var(--wa-border)' }}>
      <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--wa-hover)] tap-highlight">
        <BackArrow size={20} />
      </button>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search messages..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 rounded-xl px-3 py-1.5 text-[13px] outline-none transition-colors"
        style={{ background: 'var(--wa-input-bg)', color: 'var(--wa-text)' }}
      />
      {query && (
        <>
          <span className="text-xs whitespace-nowrap" style={{ color: 'var(--wa-text-secondary)' }}>
            {matchCount > 0 ? `${currentMatch + 1} of ${matchCount}` : 'No results'}
          </span>
          <button onClick={onPrev} className="p-1 rounded-full hover:bg-[var(--wa-hover)] tap-highlight" disabled={matchCount === 0}>
            <ChevronUp />
          </button>
          <button onClick={onNext} className="p-1 rounded-full hover:bg-[var(--wa-hover)] tap-highlight" disabled={matchCount === 0}>
            <ChevronDown />
          </button>
        </>
      )}
    </div>
  )
}
