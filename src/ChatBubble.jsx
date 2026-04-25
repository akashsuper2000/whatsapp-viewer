import React, { useRef, useState, useCallback } from 'react'
import { CheckIcon } from './Icons'

const URL_RE = /(https?:\/\/[^\s<]+)/g

function linkify(text, query) {
  // Split by URLs first, then highlight within each part
  const parts = text.split(URL_RE)
  return parts.map((part, i) => {
    if (URL_RE.test(part)) {
      URL_RE.lastIndex = 0
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline break-all" style={{ color: '#53bdeb' }}>{part}</a>
    }
    if (!query) return part
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const segs = part.split(new RegExp(`(${escaped})`, 'gi'))
    return segs.map((s, j) =>
      s.toLowerCase() === query.toLowerCase() ? <mark key={`${i}-${j}`}>{s}</mark> : s
    )
  })
}

const EMOJI_ONLY = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D\s]{1,11}$/u
const EMOJI_COUNT = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu
function isEmojiOnly(t) {
  t = t.trim()
  if (!EMOJI_ONLY.test(t)) return false
  const m = t.match(EMOJI_COUNT)
  return m && m.length <= 3
}

const MEDIA = [
  { p: /^<Media omitted>$/i, icon: '📎', label: 'Media' },
  { p: /^image omitted$/i, icon: '📷', label: 'Photo' },
  { p: /^video omitted$/i, icon: '🎥', label: 'Video' },
  { p: /^audio omitted$/i, icon: '🎵', label: 'Audio' },
  { p: /^sticker omitted$/i, icon: '🏷️', label: 'Sticker' },
  { p: /^GIF omitted$/i, icon: '🎞️', label: 'GIF' },
  { p: /^document omitted$/i, icon: '📄', label: 'Document' },
  { p: /^Contact card omitted$/i, icon: '👤', label: 'Contact' },
  { p: /^Location: .*/i, icon: '📍', label: 'Location' },
]
function getMedia(b) { const t = b.trim(); for (const { p, icon, label } of MEDIA) if (p.test(t)) return { icon, label }; return null }

function Timestamp({ time, isMe }) {
  return (
    <span className="inline-flex items-center gap-[3px] float-right ml-2 mt-[3px] relative top-[4px]">
      <span className="text-[10px] leading-none" style={{ color: 'var(--wa-text-secondary)' }}>{time}</span>
      {isMe && <CheckIcon size={15} />}
    </span>
  )
}

function useLongPress(cb, ms = 500) {
  const timer = useRef(null)
  const onStart = useCallback((e) => {
    e.preventDefault()
    timer.current = setTimeout(() => cb(e), ms)
  }, [cb, ms])
  const onEnd = useCallback(() => { clearTimeout(timer.current) }, [])
  return { onTouchStart: onStart, onTouchEnd: onEnd, onTouchMove: onEnd }
}

export default function ChatBubble({ msg, isMe, searchQuery, showSender }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    if (msg.body) {
      navigator.clipboard?.writeText(msg.body).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
    }
  }, [msg.body])

  const longPress = useLongPress(handleCopy)

  if (msg.type === 'date') {
    return (
      <div className="flex justify-center my-3 px-4">
        <span className="text-[11.5px] px-3 py-[5px] rounded-[8px] shadow-sm"
          style={{ background: 'var(--wa-system-bg)', color: 'var(--wa-text-secondary)' }}>{msg.date}</span>
      </div>
    )
  }
  if (msg.isSystem) {
    return (
      <div className="flex justify-center my-1.5 px-4">
        <span className="text-[11.5px] px-3 py-[4px] rounded-[8px] shadow-sm"
          style={{ background: 'var(--wa-system-bg)', color: 'var(--wa-text-secondary)' }}>{msg.body}</span>
      </div>
    )
  }

  const emojiOnly = isEmojiOnly(msg.body)
  const media = getMedia(msg.body)

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} px-[4.5%] sm:px-[5.5%] md:px-[7%] ${showSender ? 'mt-[8px]' : 'mt-[1px]'}`}>
      <div
        {...longPress}
        className={`relative max-w-[75%] sm:max-w-[65%] rounded-[10px] shadow-sm select-text ${emojiOnly ? '' : (isMe ? 'bubble-out' : 'bubble-in')}`}
        style={{
          background: emojiOnly ? 'transparent' : (isMe ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)'),
          boxShadow: emojiOnly ? 'none' : undefined,
          padding: emojiOnly ? '2px 4px' : '7px 9px 8px 10px',
        }}
      >
        {copied && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded shadow-md z-10"
            style={{ background: 'var(--wa-header-bg)', color: 'var(--wa-text)' }}>Copied</div>
        )}

        {!isMe && showSender && (
          <div className="text-[12.8px] font-medium mb-[2px]" style={{ color: 'var(--wa-sender-name)' }}>{msg.sender}</div>
        )}

        {msg.quotedSender && (
          <div className="rounded-[8px] px-2.5 py-[6px] mb-[4px] border-l-[3px] cursor-pointer"
            style={{ background: 'var(--wa-quote-bg)', borderColor: 'var(--wa-quote-border)' }}>
            <div className="text-[11.5px] font-medium" style={{ color: 'var(--wa-quote-border)' }}>{msg.quotedSender}</div>
            <div className="text-[12.5px] leading-[16px] line-clamp-2" style={{ color: 'var(--wa-text-secondary)' }}>{msg.quotedText}</div>
          </div>
        )}

        {emojiOnly ? (
          <div className="text-[48px] leading-[56px]">{msg.body.trim()}</div>
        ) : media ? (
          <div className="flex items-center gap-2 py-0.5">
            <span className="text-[24px]">{media.icon}</span>
            <span className="text-[13px] italic" style={{ color: 'var(--wa-text-secondary)' }}>{media.label}</span>
            <Timestamp time={msg.time} isMe={isMe} />
          </div>
        ) : (
          <div className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words" style={{ color: 'var(--wa-text)', fontWeight: 400 }}>
            {linkify(msg.body, searchQuery)}
            <Timestamp time={msg.time} isMe={isMe} />
          </div>
        )}

        {emojiOnly && (
          <div className="text-right">
            <span className="text-[10px]" style={{ color: 'var(--wa-text-secondary)' }}>{msg.time}</span>
          </div>
        )}

        {msg.reactions?.length > 0 && (
          <div className="flex gap-[2px] mt-[2px]">
            {msg.reactions.map((r, i) => (
              <span key={i} className="inline-flex items-center rounded-full px-1 py-[1px] text-[11px]"
                style={{ background: 'var(--wa-sidebar-bg)', border: '1px solid var(--wa-border)' }} title={r.reactor}>
                {r.emoji}{r.count > 1 && <span className="ml-0.5 text-[9px]" style={{ color: 'var(--wa-text-secondary)' }}>{r.count}</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
