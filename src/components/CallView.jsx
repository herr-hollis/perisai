import ScoreIndicator from './ScoreIndicator'
import TranscriptPanel from './TranscriptPanel'
import LogPanel from './LogPanel'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function scoreColor(score) {
  if (score >= 65) return '#f44336'
  if (score >= 40) return '#ff9800'
  return '#4caf50'
}

export default function CallView({
  callState,
  elapsedTime,
  avgScore,
  latestExplanation,
  transcript,
  isAnalyzing,
  logLines,
  onDownloadLog,
  onAnswer,
  onEnd,
}) {
  if (callState === 'idle') {
    return (
      <div className="call-view idle-view">
        <div className="app-icon">🛡️</div>
        <h1 className="app-title">Scam Call Detector</h1>
        <p className="app-subtitle">
          AI-powered real-time protection against phone scams
        </p>
        <div className="incoming-call-box">
          <p className="incoming-label">Incoming call</p>
          <p className="caller-number">+60 ??? ??? ????</p>
          <p className="caller-unknown">Unknown number</p>
        </div>
        <button className="btn-answer" onClick={onAnswer} aria-label="Answer call">
          Answer Call
        </button>
      </div>
    )
  }

  if (callState === 'ended') {
    return (
      <div className="call-view ended-view">
        <div className="ended-icon">📵</div>
        <h2 className="ended-title">Call Ended</h2>
        <div className="final-score-box">
          <p className="final-score-label">Final Scam Score</p>
          <p className="final-score-value" style={{ color: scoreColor(avgScore) }}>
            {avgScore}/100
          </p>
          {latestExplanation && (
            <p className="final-explanation">{latestExplanation}</p>
          )}
        </div>
        <p className="ended-advice">
          {avgScore >= 65
            ? 'This call had signs of a scam. Please report it to MCMC at 1-800-888-030.'
            : 'No significant scam indicators detected.'}
        </p>
        <LogPanel logLines={logLines} onDownload={onDownloadLog} />
        <button className="btn-end" onClick={() => window.location.reload()}>
          New Call
        </button>
      </div>
    )
  }

  // Active call
  return (
    <div className="call-view active-view">
      <div className="call-header">
        <span className="call-badge">● LIVE</span>
        <span className="call-timer">{formatTime(elapsedTime)}</span>
      </div>

      <div className="caller-info">
        <p className="caller-number-active">Unknown Number</p>
        {isAnalyzing && <p className="analyzing-text">Analyzing...</p>}
      </div>

      <ScoreIndicator score={avgScore} />

      {latestExplanation && (
        <p className="explanation-text">{latestExplanation}</p>
      )}

      <TranscriptPanel transcript={transcript} />

      <LogPanel logLines={logLines} onDownload={onDownloadLog} />

      <button className="btn-end" onClick={onEnd} aria-label="End call">
        End Call
      </button>
    </div>
  )
}
