export default function ScamAlert({ score, explanation, onEndCall, onContinue }) {
  return (
    <div className="alert-overlay" role="alertdialog" aria-modal="true">
      <div className="alert-box">
        <div className="alert-icon-ring">⚠️</div>
        <h2 className="alert-title">SCAM ALERT</h2>

        <div className="alert-score-pill">
          <span className="alert-score-label">Risk Score: </span>
          <span className="alert-score-val">{score}/100</span>
        </div>

        {explanation && (
          <p className="alert-explanation">{explanation}</p>
        )}

        <p className="alert-advice">
          This call shows strong signs of a scam. End the call immediately
          and do not share any personal information or OTP codes.
        </p>

        <div className="alert-buttons">
          <button className="btn-danger" onClick={onEndCall} autoFocus>
            📵 End Call Now
          </button>
          <button className="btn-ghost" onClick={onContinue}>
            I understand — Continue Call
          </button>
        </div>
      </div>
    </div>
  )
}
