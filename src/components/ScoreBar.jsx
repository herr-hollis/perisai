function config(score) {
  if (score >= 65) return { color: '#C62828', bg: '#FFEBEE', label: 'HIGH RISK' }
  if (score >= 40) return { color: '#E65100', bg: '#FFF3E0', label: 'SUSPICIOUS' }
  return             { color: '#1B6B3A', bg: '#E8F5E9', label: 'LOW RISK' }
}

export default function ScoreBar({ score }) {
  const { color, bg, label } = config(score)
  return (
    <div className="score-bar-card" style={{ backgroundColor: bg }}>
      <div className="score-bar-row">
        <span className="score-bar-label">Scam Risk Score</span>
        <span className="score-bar-badge" style={{ backgroundColor: color }}>{label}</span>
      </div>
      <div
        className="score-bar-track"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Scam risk: ${score} out of 100`}
      >
        <div
          className="score-bar-fill"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="score-bar-num" style={{ color }}>
        {score}<span style={{ fontSize: 16, color: '#8A9BB8', fontWeight: 400 }}>/100</span>
      </span>
    </div>
  )
}
