function scoreConfig(score) {
  if (score >= 65) return { color: '#C62828', bg: '#FFEBEE', border: '#FFCDD2', label: 'HIGH RISK',  icon: '⚠️' }
  if (score >= 40) return { color: '#E65100', bg: '#FFF3E0', border: '#FFE0B2', label: 'SUSPICIOUS', icon: '❗' }
  return             { color: '#1B6B3A', bg: '#E8F5E9', border: '#C8E6C9', label: 'LOW RISK',   icon: '✅' }
}

export default function SummaryScreen({ avgScore, latestExplanation, onNewCall }) {
  const cfg = scoreConfig(avgScore)

  return (
    <div className="screen summary-screen">
      {/* Header */}
      <div className="summary-header">
        <div className="summary-header-icon">📵</div>
        <span className="summary-header-title">Call Summary</span>
      </div>

      <div className="summary-scroll">
        {/* Score card */}
        <div className="score-card" style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}>
          <div className="score-icon-ring" style={{ backgroundColor: cfg.bg }}>{cfg.icon}</div>
          <p className="score-card-label">Final Scam Score</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="score-big" style={{ color: cfg.color }}>{avgScore}</span>
            <span className="score-denom">/100</span>
          </div>
          <div className="risk-badge" style={{ backgroundColor: cfg.color }}>{cfg.label}</div>
          {latestExplanation && (
            <p className="score-explanation" style={{ color: cfg.color }}>{latestExplanation}</p>
          )}
        </div>

        {/* MCMC advice */}
        {avgScore >= 65 && (
          <div className="advice-card" style={{ backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' }}>
            <span style={{ fontSize: 20 }}>ℹ️</span>
            <p className="advice-text" style={{ color: '#C62828' }}>
              Report this call to MCMC at{' '}
              <span className="advice-link">1-800-888-030</span>
              {' '}or at aduan.mcmc.gov.my
            </p>
          </div>
        )}
      </div>

      <div className="summary-footer">
        <button className="btn-primary" onClick={onNewCall}>New Call</button>
      </div>
    </div>
  )
}
