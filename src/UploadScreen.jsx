import React, { useRef, useState } from 'react'
import { UploadIcon } from './Icons'

export default function UploadScreen({ onUpload }) {
  const fileRef = useRef()
  const [dragging, setDragging] = useState(false)

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => onUpload(e.target.result)
    reader.readAsText(file)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center wa-chat-bg">
      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
          dragging ? 'border-[#25d366] bg-[#25d36610]' : 'border-[var(--wa-border)]'
        }`}
        style={{ background: dragging ? undefined : 'var(--wa-sidebar-bg)' }}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
      >
        <div className="text-[#25d366] mb-4"><UploadIcon size={48} /></div>
        <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--wa-text)' }}>Upload WhatsApp Chat</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--wa-text-secondary)' }}>
          Drop your <code className="px-1.5 py-0.5 rounded text-[13px]" style={{ background: 'var(--wa-input-bg)' }}>_chat.txt</code> file here or click to browse
        </p>
        <button className="bg-[#008069] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#017561] transition-colors">
          Choose File
        </button>
        <input ref={fileRef} type="file" accept=".txt,.zip" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      </div>
    </div>
  )
}
