import { useEffect, useRef, useState } from 'react'

const SERVICE_CLASS = {
  Audio: 'log-audio', API: 'log-api', Backend: 'log-backend',
  S3: 'log-s3', Transcribe: 'log-transcribe', Bedrock: 'log-bedrock',
  Logger: 'log-meta', Handler: 'log-meta', App: '',
}

function lineClass(line) {
  if (line.includes('ERROR') || line.includes('FAILED') || line.includes('TIMEOUT')) return 'log-error'
  for (const [tag, cls] of Object.entries(SERVICE_CLASS)) {
    if (line.includes(`[${tag}]`)) return cls
  }
  return ''
}

export default function LogPanel({ logLines, onDownload }) {
  const [collapsed, setCollapsed] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!collapsed) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logLines, collapsed])

  return (
    <div className="log-panel">
      <button className="log-header" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed}>
        <span>⬛</span>
        <span>Event Log ({logLines.length})</span>
        <span className="log-chevron">{collapsed ? '▲' : '▼'}</span>
      </button>

      {!collapsed && (
        <>
          <div className="log-scroll" aria-live="polite">
            {logLines.length === 0 && <p className="log-empty">No events yet.</p>}
            {logLines.map((line, i) => (
              <div key={i} className={`log-line ${lineClass(line)}`}>{line}</div>
            ))}
            <div ref={bottomRef} />
          </div>
          {onDownload && logLines.length > 0 && (
            <button className="log-download-btn" onClick={() => onDownload(logLines)}>
              ↓ Download Log (.txt)
            </button>
          )}
        </>
      )}
    </div>
  )
}
