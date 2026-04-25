import { useRef } from 'react'

export default function HomeScreen({ onAnswer, onUploadFile }) {
  const fileInputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) onUploadFile(file)
    e.target.value = ''
  }

  return (
    <div className="screen home">
      {/* Top bar */}
      <div className="home-topbar">
        <span>🛡️</span> Scam Guard Active
      </div>

      {/* Call area */}
      <div className="home-call-area">
        <p className="incoming-label">Incoming Call</p>

        {/* Pulsing avatar */}
        <div className="avatar-wrap">
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="avatar">👤</div>
        </div>

        <p className="caller-number">+60 12-345 6789</p>
        <p className="caller-name">Unknown Number</p>

        <div className="unknown-badge">
          <span>⚠️</span> Not in your contacts
        </div>

        <p className="call-hint">Tap Answer to start real-time scam detection</p>
      </div>

      {/* Action buttons */}
      <div className="home-actions">
        <div className="action-btn-wrap">
          <button className="btn-circle btn-decline" onClick={() => {}} aria-label="Decline">
            📵
          </button>
          <span className="action-btn-label">Decline</span>
        </div>
        <div className="action-btn-wrap">
          <button className="btn-circle btn-answer" onClick={onAnswer} aria-label="Answer">
            📞
          </button>
          <span className="action-btn-label">Answer</span>
        </div>
      </div>

      {/* Upload alternative */}
      <div className="home-upload-divider">or</div>
      <button className="btn-upload-home" onClick={() => fileInputRef.current?.click()}>
        📂 Upload Audio File (no mic)
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.mp4,.flac"
        onChange={handleFileChange}
      />
    </div>
  )
}
