export default function ScoreIndicator({ score }) {
  const color = score >= 65 ? '#f44336' : score >= 40 ? '#ff9800' : '#4caf50'
  const label = score >= 65 ? 'HIGH RISK' : score >= 40 ? 'SUSPICIOUS' : 'LOW RISK'

  return (
    <div className="score-indicator">
      <div className="score-header">
        <span className="score-label">Scam Risk</span>
        <span className="score-badge" style={{ backgroundColor: color }}>{label}</span>
      </div>
      <div
        className="score-bar-bg"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Scam risk score: ${score} out of 100`}
      >
        <div
          className="score-bar-fill"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="score-number">{score}/100</span>
    </div>
  )
}
