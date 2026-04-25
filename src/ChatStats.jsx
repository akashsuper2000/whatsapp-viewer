import React, { useMemo } from 'react'
import { BackArrow } from './Icons'

function Card({ label, value, sub }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--wa-input-bg)' }}>
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--wa-text-secondary)' }}>{label}</div>
      <div className="text-[15px] font-semibold" style={{ color: 'var(--wa-text)' }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: 'var(--wa-text-secondary)' }}>{sub}</div>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--wa-input-bg)' }}>
      <div className="text-[10px] uppercase tracking-wider mb-2.5" style={{ color: 'var(--wa-text-secondary)' }}>{title}</div>
      {children}
    </div>
  )
}

function WordCloud({ words, maxCount }) {
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5 items-baseline">
      {words.map(([word, count]) => {
        const r = count / maxCount
        return (
          <span key={word} className="inline-block cursor-default"
            style={{ fontSize: `${11 + r * 16}px`, color: 'var(--wa-text)', opacity: 0.4 + r * 0.6 }}
            title={`${count}x`}>{word}</span>
        )
      })}
    </div>
  )
}

const STOP = new Set('the a an is are was were be been being have has had do does did will would shall should may might can could i you he she it we they me him her us them my your his its our their this that these those am in on at to for of with and but or not no so if from by as just like got get also very much more than been what when how why who where which all any each every some many few most other another such only even still also too'.split(' '))

export default function ChatStats({ messages, senders, onClose }) {
  const stats = useMemo(() => {
    const msgs = messages.filter(m => !m.isSystem)
    const total = msgs.length
    const dates = [...new Set(msgs.map(m => m.date).filter(Boolean))]
    const totalDays = dates.length || 1

    const perSender = {}, wordsBySender = {}, charsBySender = {}
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu
    let totalEmojis = 0
    const emojiCounts = {}
    let mediaCount = 0, linkCount = 0, questionCount = 0
    const mediaRe = /omitted>?$/i, linkRe = /https?:\/\/\S+/gi
    const hourCounts = new Array(24).fill(0)
    const wordFreq = {}, wordFreqBySender = {}

    for (const m of msgs) {
      perSender[m.sender] = (perSender[m.sender] || 0) + 1
      const words = m.body.trim().split(/\s+/)
      wordsBySender[m.sender] = (wordsBySender[m.sender] || 0) + words.length
      charsBySender[m.sender] = (charsBySender[m.sender] || 0) + m.body.length
      const emojis = m.body.match(emojiRegex) || []
      totalEmojis += emojis.length
      for (const e of emojis) emojiCounts[e] = (emojiCounts[e] || 0) + 1
      if (mediaRe.test(m.body.trim())) mediaCount++
      const links = m.body.match(linkRe)
      if (links) linkCount += links.length
      if (m.body.includes('?')) questionCount++

      if (!wordFreqBySender[m.sender]) wordFreqBySender[m.sender] = {}
      for (const w of words) {
        const lw = w.toLowerCase().replace(/[^a-z0-9\u00C0-\u024F]/gi, '')
        if (lw.length > 2 && !STOP.has(lw)) {
          wordFreq[lw] = (wordFreq[lw] || 0) + 1
          wordFreqBySender[m.sender][lw] = (wordFreqBySender[m.sender][lw] || 0) + 1
        }
      }

      const hm = m.time?.match(/^(\d{1,2}):/)
      if (hm) {
        let h = parseInt(hm[1])
        if (/pm/i.test(m.time) && h !== 12) h += 12
        if (/am/i.test(m.time) && h === 12) h = 0
        if (h >= 0 && h < 24) hourCounts[h]++
      }
    }

    const dateCounts = {}
    for (const m of msgs) dateCounts[m.date] = (dateCounts[m.date] || 0) + 1
    const topDate = Object.entries(dateCounts).sort((a, b) => b[1] - a[1])[0]
    const leastDate = Object.entries(dateCounts).sort((a, b) => a[1] - b[1])[0]
    const topEmojis = Object.entries(emojiCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)
    const avgPerDay = Math.round(total / totalDays)
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts))
    const sorted = Object.entries(perSender).sort((a, b) => b[1] - a[1])
    const topWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 40)

    // Per-sender top words
    const senderWords = {}
    for (const s of Object.keys(wordFreqBySender)) {
      senderWords[s] = Object.entries(wordFreqBySender[s]).sort((a, b) => b[1] - a[1]).slice(0, 25)
    }

    return {
      total, dates, totalDays, totalEmojis, topEmojis, mediaCount, avgPerDay,
      topDate, leastDate, sorted, wordsBySender, charsBySender,
      linkCount, questionCount, hourCounts, peakHour, topWords, senderWords,
    }
  }, [messages])

  const maxHour = Math.max(...stats.hourCounts, 1)

  return (
    <div className="flex-1 flex flex-col overflow-hidden panel-slide" style={{ background: 'var(--wa-sidebar-bg)' }}>
      <div className="h-[59px] flex items-center px-4 gap-3 flex-shrink-0" style={{ background: 'var(--wa-header-bg)', borderBottom: '1px solid var(--wa-border)' }}>
        <button onClick={onClose} className="p-1 tap-highlight rounded-full"><BackArrow size={22} /></button>
        <span className="font-medium text-[16px]" style={{ color: 'var(--wa-text)' }}>Chat Stats</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <Card label="Total Messages" value={stats.total.toLocaleString()} />
          <Card label="Active Days" value={stats.totalDays.toLocaleString()} sub={`${stats.dates[0] || ''} - ${stats.dates[stats.dates.length-1] || ''}`} />
          <Card label="Avg / Day" value={stats.avgPerDay.toLocaleString()} />
          <Card label="Peak Hour" value={`${stats.peakHour}:00`} sub={`${stats.hourCounts[stats.peakHour]} messages`} />
          <Card label="Emojis Sent" value={stats.totalEmojis.toLocaleString()} />
          <Card label="Media Shared" value={stats.mediaCount.toLocaleString()} />
          <Card label="Links Shared" value={stats.linkCount.toLocaleString()} />
          <Card label="Questions Asked" value={stats.questionCount.toLocaleString()} />
          <Card label="Most Active Day" value={stats.topDate?.[0] || '-'} sub={stats.topDate ? `${stats.topDate[1]} msgs` : ''} />
          <Card label="Least Active Day" value={stats.leastDate?.[0] || '-'} sub={stats.leastDate ? `${stats.leastDate[1]} msgs` : ''} />
        </div>

        <Section title="Activity by hour">
          <div className="flex items-end gap-[3px] h-[60px]">
            {stats.hourCounts.map((c, i) => (
              <div key={i} className="flex-1">
                <div className="w-full rounded-sm" style={{
                  height: `${Math.max(2, (c / maxHour) * 50)}px`,
                  background: i === stats.peakHour ? 'var(--wa-unread)' : 'var(--wa-border)',
                }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {[0,6,12,18,23].map(h => <span key={h} className="text-[9px]" style={{ color: 'var(--wa-text-secondary)' }}>{h}h</span>)}
          </div>
        </Section>

        {stats.topEmojis.length > 0 && (
          <Section title="Top emojis">
            <div className="flex gap-3 flex-wrap">
              {stats.topEmojis.map(([emoji, count]) => (
                <div key={emoji} className="text-center">
                  <div className="text-[22px]">{emoji}</div>
                  <div className="text-[9px]" style={{ color: 'var(--wa-text-secondary)' }}>{count}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Messages per person">
          {stats.sorted.map(([sender, count]) => {
            const pct = Math.round((count / stats.total) * 100)
            const avgWords = Math.round((stats.wordsBySender[sender] || 0) / count)
            const avgChars = Math.round((stats.charsBySender[sender] || 0) / count)
            return (
              <div key={sender} className="mb-3 last:mb-0">
                <div className="flex justify-between text-[12.5px] mb-1">
                  <span className="font-medium" style={{ color: 'var(--wa-text)' }}>{sender}</span>
                  <span style={{ color: 'var(--wa-text-secondary)' }}>{count.toLocaleString()} ({pct}%)</span>
                </div>
                <div className="h-[5px] rounded-full overflow-hidden" style={{ background: 'var(--wa-border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--wa-unread)', transition: 'width 0.5s ease' }} />
                </div>
                <div className="text-[10px] mt-[3px] flex gap-3" style={{ color: 'var(--wa-text-secondary)' }}>
                  <span>{avgWords} words/msg</span>
                  <span>{avgChars} chars/msg</span>
                </div>
              </div>
            )
          })}
        </Section>

        {/* Overall word cloud */}
        {stats.topWords.length > 0 && (
          <Section title="Word cloud - everyone">
            <WordCloud words={stats.topWords} maxCount={stats.topWords[0][1]} />
          </Section>
        )}

        {/* Per-sender word clouds */}
        {stats.sorted.map(([sender]) => {
          const words = stats.senderWords[sender]
          if (!words || words.length === 0) return null
          return (
            <Section key={sender} title={`Word cloud - ${sender}`}>
              <WordCloud words={words} maxCount={words[0][1]} />
            </Section>
          )
        })}
      </div>
    </div>
  )
}
