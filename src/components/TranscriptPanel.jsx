import { useEffect, useRef } from 'react'

export default function TranscriptPanel({ transcript, interimText }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript, interimText])

  const empty = !transcript && !interimText

  return (
    <div>
      <p className="transcript-label">Live Transcript</p>
      <div className="transcript-scroll" aria-live="polite" aria-label="Live call transcript">
        {empty && <p className="transcript-placeholder">Transcript will appear here…</p>}
        {transcript  && <span className="transcript-text">{transcript} </span>}
        {interimText && <span className="transcript-interim">{interimText}</span>}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
