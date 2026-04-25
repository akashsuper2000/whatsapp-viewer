import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { parseChat } from './parser'
import { SearchIcon, AttachIcon, MicIcon, EmojiIcon, CallIcon, UploadIcon, BackArrow } from './Icons'
import { ThemeProvider } from './ThemeContext'
import ThemeToggle from './ThemeToggle'
import ChatBubble from './ChatBubble'
import SearchBar from './SearchBar'
import UploadScreen from './UploadScreen'
import Avatar from './Avatar'
import ChatStats from './ChatStats'
import DatePicker from './DatePicker'
import HeaderMenu from './HeaderMenu'

function groupByDate(messages) {
  const groups = []
  let currentDate = null
  for (const msg of messages) {
    if (msg.date !== currentDate) {
      currentDate = msg.date
      groups.push({ type: 'date', date: currentDate, id: `date-${currentDate}-${msg.id}` })
    }
    groups.push({ type: 'message', ...msg })
  }
  return groups
}

function readFile(file, cb) {
  if (!file) return
  const r = new FileReader()
  r.onload = (e) => cb(e.target.result, file.name)
  r.readAsText(file)
}

function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>') }

function AppInner() {
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(-1)
  const [meSender, setMeSender] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [currentMatch, setCurrentMatch] = useState(0)
  const [showSidebar, setShowSidebar] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [panel, setPanel] = useState(null)
  const [atBottom, setAtBottom] = useState(true)
  const virtuosoRef = useRef()

  const chat = chats[activeChat] || null
  const messages = chat?.messages || []
  const senders = chat?.senders || []
  const loaded = chats.length > 0

  useEffect(() => {
    const h = () => { const m = window.innerWidth < 768; setIsMobile(m); if (!m) setShowSidebar(true) }
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && messages.length > 0) { e.preventDefault(); setSearchOpen(true) }
      if (e.key === 'Escape') {
        if (searchOpen) { setSearchOpen(false); setSearchQuery(''); setCurrentMatch(0) }
        if (panel) setPanel(null)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [messages.length, searchOpen, panel])

  const handleUpload = useCallback((text, filename) => {
    const { messages: parsed, senders: found } = parseChat(text)
    if (parsed.length === 0) return
    setChats(prev => {
      const next = [...prev, { name: filename?.replace('.txt', '') || 'Chat', messages: parsed, senders: found }]
      setActiveChat(next.length - 1)
      return next
    })
    setMeSender(found[0] || null)
    setPanel(null)
    if (isMobile) setShowSidebar(false)
  }, [isMobile])

  const selectChat = useCallback((idx) => {
    setActiveChat(idx)
    const c = chats[idx]
    if (c) setMeSender(c.senders[0] || null)
    setSearchOpen(false); setSearchQuery(''); setPanel(null)
    if (isMobile) setShowSidebar(false)
  }, [chats, isMobile])

  const swapSender = useCallback(() => {
    if (senders.length < 2) return
    setMeSender(prev => senders[(senders.indexOf(prev) + 1) % senders.length])
  }, [senders])

  const otherSender = useMemo(() => {
    if (senders.length < 2) return senders[0] || 'Chat'
    return senders.find(s => s !== meSender) || senders[0]
  }, [senders, meSender])

  const allItems = useMemo(() => groupByDate(messages), [messages])

  const uniqueDates = useMemo(() => {
    const seen = new Set()
    return messages.reduce((acc, m) => { if (m.date && !seen.has(m.date)) { seen.add(m.date); acc.push(m.date) }; return acc }, [])
  }, [messages])

  const matchIndices = useMemo(() => {
    if (!searchQuery) return []
    const q = searchQuery.toLowerCase()
    return allItems.reduce((acc, item, idx) => {
      if (item.type === 'message' && !item.isSystem && item.body.toLowerCase().includes(q)) acc.push(idx)
      return acc
    }, [])
  }, [allItems, searchQuery])

  useEffect(() => { setCurrentMatch(0) }, [searchQuery])

  const navigateMatch = useCallback((dir) => {
    if (matchIndices.length === 0) return
    const next = dir === 'next'
      ? (currentMatch + 1) % matchIndices.length
      : (currentMatch - 1 + matchIndices.length) % matchIndices.length
    setCurrentMatch(next)
    virtuosoRef.current?.scrollToIndex({ index: matchIndices[next], align: 'center', behavior: 'smooth' })
  }, [matchIndices, currentMatch])

  const closeSearch = () => { setSearchOpen(false); setSearchQuery(''); setCurrentMatch(0) }

  const jumpToDate = useCallback((date) => {
    const idx = allItems.findIndex(item => item.type === 'date' && item.date === date)
    if (idx >= 0) {
      setPanel(null)
      setTimeout(() => virtuosoRef.current?.scrollToIndex({ index: idx, align: 'start', behavior: 'auto' }), 50)
    }
  }, [allItems])

  const scrollToBottom = () => virtuosoRef.current?.scrollToIndex({ index: allItems.length - 1, behavior: 'smooth' })

  const exportPdf = useCallback(() => {
    try {
      const bubbles = messages.filter(m => !m.isSystem).map(m => {
        const isMe = m.sender === meSender
        return `<div style="max-width:70%;${isMe ? 'margin-left:auto' : 'margin-right:auto'};background:${isMe ? '#d9fdd3' : '#fff'};border-radius:8px;padding:6px 9px;margin:2px 0;font-size:13px;border:1px solid #e2e8eb">
          ${!isMe ? `<div style="color:#1fa855;font-size:11px;font-weight:600">${escapeHtml(m.sender)}</div>` : ''}
          <div>${escapeHtml(m.body)}</div>
          <div style="text-align:right;font-size:9px;color:#667781">${m.time} ${m.date}</div>
        </div>`
      }).join('')
      const html = `<!DOCTYPE html><html><head><title>Chat with ${escapeHtml(otherSender)}</title>
        <style>body{font-family:'Segoe UI',sans-serif;max-width:700px;margin:0 auto;padding:20px;background:#efeae2}
        @media print{body{background:white}}</style></head>
        <body><h2 style="text-align:center;color:#111b21">Chat with ${escapeHtml(otherSender)}</h2>${bubbles}</body></html>`
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const w = window.open(url, '_blank')
      if (w) setTimeout(() => { w.print(); URL.revokeObjectURL(url) }, 500)
      else { URL.revokeObjectURL(url); alert('Please allow popups to export PDF') }
    } catch (e) { console.error('Export failed:', e) }
  }, [messages, meSender, otherSender])

  const showSenderMap = useMemo(() => {
    const map = new Set()
    let prev = null
    for (const item of allItems) {
      if (item.type === 'message' && !item.isSystem) {
        if (item.sender !== prev || item.quotedSender) map.add(item.id)
        prev = item.sender
      } else { prev = null }
    }
    return map
  }, [allItems])

  const chatOpen = activeChat >= 0

  return (
    <div className="h-full w-full flex items-center justify-center" style={{ background: 'var(--wa-outer-bg)' }}>
      <div className="fixed top-0 left-0 right-0 h-[127px] z-0" style={{ background: 'var(--wa-top-bar)' }} />
      <div className="relative z-10 flex w-full h-full md:w-[95%] lg:w-[90%] xl:w-[85%] md:h-[95%] md:my-auto md:shadow-xl overflow-hidden"
        style={{ background: 'var(--wa-sidebar-bg)' }}>

        {/* Sidebar */}
        {showSidebar && (
          <div className={`${isMobile ? 'w-full' : 'w-[35%] min-w-[300px] max-w-[420px]'} flex flex-col`}
            style={{ borderRight: '1px solid var(--wa-border)' }}>
            <div className="h-[59px] flex items-center justify-between px-4" style={{ background: 'var(--wa-header-bg)' }}>
              <div className="w-10 h-10 rounded-full bg-[#dfe5e7] flex items-center justify-center cursor-pointer"><Avatar /></div>
              <ThemeToggle />
            </div>
            <div className="px-2 py-[5px]" style={{ borderBottom: '1px solid var(--wa-border)' }}>
              <div className="flex items-center rounded-[8px] px-3 py-[7px]" style={{ background: 'var(--wa-input-bg)' }}>
                <SearchIcon size={14} />
                <input type="text" placeholder="Search or start new chat" className="bg-transparent outline-none ml-6 text-[13px] w-full"
                  style={{ color: 'var(--wa-text)' }} readOnly />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {chats.map((c, idx) => {
                const last = c.messages[c.messages.length - 1]
                const other = c.senders.length >= 2 ? c.senders[1] : c.senders[0] || c.name
                const isActive = idx === activeChat
                return (
                  <div key={idx} onClick={() => selectChat(idx)}
                    className="flex items-center px-3 py-[13px] cursor-pointer transition-colors"
                    style={{ background: isActive ? 'var(--wa-active)' : undefined, borderBottom: '1px solid var(--wa-border)' }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--wa-hover)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '' }}>
                    <div className="w-[49px] h-[49px] rounded-full bg-[#dfe5e7] flex-shrink-0 flex items-center justify-center"><Avatar size={49} /></div>
                    <div className="ml-[15px] flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[17px] truncate" style={{ color: 'var(--wa-text)' }}>{other}</span>
                        <span className="text-[12px] flex-shrink-0 ml-2" style={{ color: 'var(--wa-text-secondary)' }}>{last?.time}</span>
                      </div>
                      <p className="text-[13.5px] truncate mt-[2px]" style={{ color: 'var(--wa-text-secondary)' }}>{last?.body?.slice(0, 50)}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-3 py-2.5" style={{ borderTop: '1px solid var(--wa-border)' }}>
              <label className="flex items-center justify-center gap-2 cursor-pointer w-full py-2.5 rounded-[8px] text-[13px] transition-colors hover:opacity-90 tap-highlight"
                style={{ background: 'var(--wa-input-bg)', color: 'var(--wa-text-secondary)' }}>
                <UploadIcon size={16} />
                {loaded ? 'Upload new chat' : 'Upload chat backup (.txt)'}
                <input type="file" accept=".txt" className="hidden" onChange={(e) => readFile(e.target.files[0], handleUpload)} />
              </label>
            </div>
          </div>
        )}

        {/* Chat area */}
        {(!isMobile || chatOpen) && (
          <div className="flex-1 flex flex-col min-w-0">
            {!chatOpen ? <UploadScreen onUpload={handleUpload} /> :
              panel === 'stats' ? <ChatStats messages={messages} senders={senders} onClose={() => setPanel(null)} /> :
              panel === 'dates' ? <DatePicker dates={uniqueDates} onSelect={jumpToDate} onClose={() => setPanel(null)} /> :
              (<>
                {/* Clean header - no swap toggle, no message count */}
                <div className="h-[59px] flex items-center px-4 gap-[12px] flex-shrink-0"
                  style={{ background: 'var(--wa-header-bg)', borderBottom: '1px solid var(--wa-border)' }}>
                  {isMobile && <button onClick={() => { setActiveChat(-1); setShowSidebar(true) }} className="p-1 -ml-1"><BackArrow size={22} /></button>}
                  <div className="w-10 h-10 rounded-full bg-[#dfe5e7] flex-shrink-0 flex items-center justify-center cursor-pointer"><Avatar /></div>
                  <div className="flex-1 min-w-0 cursor-pointer">
                    <div className="text-[16px] truncate" style={{ color: 'var(--wa-text)' }}>{otherSender}</div>
                    <div className="text-[13px]" style={{ color: 'var(--wa-text-secondary)' }}>online</div>
                  </div>
                  <button className="p-2 rounded-full hover:bg-[var(--wa-hover)] tap-highlight"><CallIcon size={20} /></button>
                  <button className="p-2 rounded-full hover:bg-[var(--wa-hover)] tap-highlight" onClick={() => setSearchOpen(true)}><SearchIcon /></button>
                  <HeaderMenu onStats={() => setPanel('stats')} onJumpToDate={() => setPanel('dates')} onExportPdf={exportPdf}
                    onSwap={swapSender} swapActive={meSender === senders[1]} />
                </div>

                {searchOpen && (
                  <SearchBar query={searchQuery} setQuery={setSearchQuery} matchCount={matchIndices.length}
                    currentMatch={currentMatch} onPrev={() => navigateMatch('prev')} onNext={() => navigateMatch('next')} onClose={closeSearch} />
                )}

                <div className="flex-1 wa-chat-bg overflow-hidden relative">
                  <Virtuoso ref={virtuosoRef} data={allItems}
                    initialTopMostItemIndex={Math.max(0, allItems.length - 1)}
                    followOutput="smooth"
                    atBottomStateChange={setAtBottom}
                    itemContent={(index, item) => (
                      <ChatBubble msg={item} isMe={item.sender === meSender} searchQuery={searchQuery}
                        showSender={showSenderMap.has(item.id)} />
                    )}
                    style={{ height: '100%' }}
                  />
                  {!atBottom && (
                    <button onClick={scrollToBottom}
                      className="absolute bottom-4 right-5 w-[42px] h-[42px] rounded-full shadow-lg flex items-center justify-center tap-highlight dropdown-enter z-10"
                      style={{ background: 'var(--wa-sidebar-bg)', border: '1px solid var(--wa-border)' }}>
                      <svg viewBox="0 0 24 24" width={22} height={22} fill="var(--wa-icon)">
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
                      </svg>
                    </button>
                  )}
                </div>

                <div className="h-[62px] flex items-center px-4 gap-[8px] flex-shrink-0" style={{ background: 'var(--wa-header-bg)' }}>
                  <button className="p-2 rounded-full hover:bg-[var(--wa-hover)] tap-highlight"><EmojiIcon /></button>
                  <button className="p-2 rounded-full hover:bg-[var(--wa-hover)] tap-highlight">
                    <label className="cursor-pointer"><AttachIcon />
                      <input type="file" accept=".txt" className="hidden" onChange={(e) => readFile(e.target.files[0], handleUpload)} />
                    </label>
                  </button>
                  <div className="flex-1 rounded-[8px] px-3 py-[9px]" style={{ background: 'var(--wa-bubble-in)' }}>
                    <input type="text" placeholder="Type a message" className="w-full outline-none text-[14.2px] bg-transparent"
                      style={{ color: 'var(--wa-text)' }} readOnly />
                  </div>
                  <button className="p-2 rounded-full hover:bg-[var(--wa-hover)] tap-highlight"><MicIcon /></button>
                </div>
              </>)
            }
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  return <ThemeProvider><AppInner /></ThemeProvider>
}
