export default function OnboardingScreen({ onStart }) {
  return (
    <div className="screen onboarding">
      <div className="ob-hero">
        <div className="ob-shield">🛡️</div>
        <h1 className="ob-title">Perisai</h1>
        <p className="ob-sub">by The KopiCoders · Finhack 2026</p>
      </div>

      <div className="ob-card">
        <p className="ob-card-title">How it works</p>

        <div className="ob-feature">
          <div className="ob-icon">🎙️</div>
          <p className="ob-feature-text">Listens to your call in real-time using the microphone</p>
        </div>
        <div className="ob-feature">
          <div className="ob-icon">✨</div>
          <p className="ob-feature-text">AI analyses speech for scam patterns every 5 seconds</p>
        </div>
        <div className="ob-feature">
          <div className="ob-icon">🔔</div>
          <p className="ob-feature-text">Alerts you instantly if a scam is detected</p>
        </div>

        <div className="ob-notice">
          <span>🔒</span>
          <span>Audio is processed securely via AWS and never stored permanently.</span>
        </div>

        <div className="ob-spacer" />

        <button className="btn-primary" onClick={onStart}>
          Get Started <span>→</span>
        </button>
      </div>
    </div>
  )
}
