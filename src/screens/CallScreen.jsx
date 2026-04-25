import { useRef } from 'react'
import ScoreBar from '../components/ScoreBar'
import TranscriptPanel from '../components/TranscriptPanel'

function formatTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function CallScreen({
  callMode,
  elapsedTime,
  avgScore,
  latestExplanation,
  transcript,
  interimText,
  isAnalyzing,
  speechError,
  onEnd,
  onUploadFile,
  uploadedFileName,
}) {
  const fileInputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) onUploadFile(file)
    e.target.value = ''
  }

  return (
    <div className="screen call-screen">
      {/* Top bar */}
      <div className="call-topbar">
        <div className="live-pill">
          <div className="live-dot" />
          <span className="live-text">LIVE</span>
        </div>
        <span className="call-timer">{formatTime(elapsedTime)}</span>
        {isAnalyzing && <div className="analyzing-pill">Analysing…</div>}
      </div>

      {/* Scrollable body */}
      <div className="call-scroll">
        {/* Caller / mode info */}
        <div className="card caller-card">
          <div className="caller-avatar">👤</div>
          <div>
            <p className="caller-number-active">
              {callMode === 'upload' ? 'Audio File' : 'Unknown Number'}
            </p>
            <p className="caller-sub">
              {callMode === 'upload'
                ? uploadedFileName || 'No file selected'
                : 'Malaysia · Not in contacts'}
            </p>
          </div>
        </div>

        {/* Speech API error banner */}
        {speechError && (
          <div className="card" style={{ borderLeft: '3px solid #E65100', background: '#FFF3E0' }}>
            <p style={{ fontSize: 13, color: '#E65100', lineHeight: 1.6 }}>
              ⚠️ {speechError}
            </p>
          </div>
        )}

        {/* Score */}
        <ScoreBar score={avgScore} />

        {/* AI explanation */}
        {latestExplanation && (
          <div className="card explanation-card">
            <div className="explanation-header">✨ AI Analysis</div>
            <p className="explanation-text">{latestExplanation}</p>
          </div>
        )}

        {/* Transcript */}
        <div className="card">
          <TranscriptPanel transcript={transcript} interimText={interimText} />
        </div>

        {/* Upload audio alternative */}
        <div className="upload-section">
          <p className="upload-section-title">
            📂 {callMode === 'upload' ? 'Upload Another File' : 'No microphone? Upload audio'}
          </p>
          <button
            className="btn-upload"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? '⏳ Processing…' : '📁 Choose audio file'}
          </button>
          {uploadedFileName && (
            <p className="upload-file-name">Last: {uploadedFileName}</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.mp4,.flac"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Sticky footer */}
      <div className="call-footer">
        <button className="btn-danger" onClick={onEnd}>
          📵 End Call
        </button>
      </div>
    </div>
  )
}
