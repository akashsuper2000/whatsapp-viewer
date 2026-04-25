// Parses WhatsApp chat export .txt files
// Handles formats:
//   [DD/MM/YYYY, HH:MM:SS] Sender: Message
//   DD/MM/YYYY, HH:MM - Sender: Message
//   MM/DD/YY, HH:MM AM/PM - Sender: Message

const LINE_PATTERNS = [
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)\]\s(.+?):\s([\s\S]*)$/,
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)\s-\s(.+?):\s([\s\S]*)$/,
]

const SYSTEM_PATTERNS = [
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)\]\s([\s\S]*)$/,
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)\s-\s([\s\S]*)$/,
]

// Detects reaction lines: Sender reacted "emoji" to "message"
const REACTION_PATTERN = /^(.+?) reacted "(.*?)" to "(.*?)"$/

// Detects quoted/tagged messages (reply-to). WhatsApp exports them as:
// The body starts with a line like: ‎Sender Name\n> quoted text\n\nactual reply
// Or sometimes with the invisible char \u200e
const QUOTE_PATTERN = /^\u200e?(.*?)\n([\s\S]*?)(?:\n\n)([\s\S]+)$/

export function parseChat(text) {
  const lines = text.split('\n')
  const messages = []
  const senders = new Set()
  const reactions = [] // collected separately, then merged

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    let matched = false
    for (const pattern of LINE_PATTERNS) {
      const m = line.match(pattern)
      if (m) {
        const [, date, time, sender, body] = m

        // Check if this is a reaction
        const reactionMatch = body.match(REACTION_PATTERN)
        if (reactionMatch) {
          reactions.push({
            reactor: sender,
            emoji: reactionMatch[2],
            targetSnippet: reactionMatch[3],
          })
          matched = true
          break
        }

        senders.add(sender)
        messages.push({
          id: messages.length,
          date,
          time,
          sender,
          body,
          isSystem: false,
          quotedSender: null,
          quotedText: null,
          reactions: [],
        })
        matched = true
        break
      }
    }

    if (!matched) {
      let isSystem = false
      for (const pattern of SYSTEM_PATTERNS) {
        const m = line.match(pattern)
        if (m) {
          messages.push({
            id: messages.length,
            date: m[1],
            time: m[2],
            sender: null,
            body: m[3],
            isSystem: true,
            quotedSender: null,
            quotedText: null,
            reactions: [],
          })
          isSystem = true
          break
        }
      }
      if (!isSystem && messages.length > 0) {
        messages[messages.length - 1].body += '\n' + line
      }
    }
  }

  // Post-process: extract quoted messages from body text
  for (const msg of messages) {
    if (msg.isSystem) continue
    // Check for quoted reply pattern in body
    const qm = msg.body.match(QUOTE_PATTERN)
    if (qm) {
      msg.quotedSender = qm[1].trim()
      msg.quotedText = qm[2].replace(/^> ?/gm, '').trim()
      msg.body = qm[3].trim()
    }
  }

  // Post-process: attach reactions to their target messages
  for (const r of reactions) {
    // Find the most recent message whose body contains the snippet
    for (let i = messages.length - 1; i >= 0; i--) {
      if (!messages[i].isSystem && messages[i].body.includes(r.targetSnippet)) {
        const existing = messages[i].reactions.find(x => x.emoji === r.emoji)
        if (existing) {
          existing.count++
        } else {
          messages[i].reactions.push({ emoji: r.emoji, reactor: r.reactor, count: 1 })
        }
        break
      }
    }
  }

  return { messages, senders: [...senders] }
}
