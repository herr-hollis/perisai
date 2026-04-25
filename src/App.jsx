import { useState, useEffect, useRef, useCallback } from 'react'
import OnboardingScreen from './screens/OnboardingScreen'
import HomeScreen       from './screens/HomeScreen'
import CallScreen       from './screens/CallScreen'
import SummaryScreen    from './screens/SummaryScreen'
import ScamAlert        from './components/ScamAlert'
import { useTranscription } from './hooks/useTranscription'
import { useLogger }         from './hooks/useLogger'
import { analyzeText, uploadAudioFile } from './services/api'

const SCAM_THRESHOLD   = 65
const MIN_ELAPSED_SECS = 30
const ANALYSIS_INTERVAL_MS = 6000  // run Bedrock analysis every 6 s of new text

export default function App() {
  const [screen, setScreen]           = useState('onboarding')
  const [callMode, setCallMode]       = useState('mic')
  const [transcript, setTranscript]   = useState('')
  const [interimText, setInterimText] = useState('')
  const [scores, setScores]           = useState([])
  const [explanation, setExplanation] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAlert, setShowAlert]     = useState(false)
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [speechError, setSpeechError] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')

  const timerRef          = useRef(null)
  const analysisTimerRef  = useRef(null)
  const isAnalyzingRef    = useRef(false)
  const transcriptRef     = useRef('')
  const lastAnalyzedRef   = useRef('')

  const { addLog, clearLog, saveLogToFolder } = useLogger()

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0

  // ── Scam alert threshold ─────────────────────────────────────
  useEffect(() => {
    if (
      screen === 'call' && !alertDismissed && !showAlert &&
      avgScore >= SCAM_THRESHOLD && elapsedTime >= MIN_ELAPSED_SECS
    ) {
      setShowAlert(true)
    }
  }, [avgScore, elapsedTime, screen, alertDismissed, showAlert])

  // ── Web Speech API callbacks ─────────────────────────────────
  const handleFinalText = useCallback((text) => {
    const updated = (transcriptRef.current + ' ' + text).trim()
    transcriptRef.current = updated
    setTranscript(updated)
    setInterimText('')
  }, [])

  const handleInterimText = useCallback((text) => {
    setInterimText(text)
  }, [])

  const { start: startTranscription, stop: stopTranscription } =
    useTranscription(handleFinalText, handleInterimText, addLog)

  // ── Periodic Bedrock analysis (every 6 s of new text) ────────
  useEffect(() => {
    if (screen !== 'call') return

    analysisTimerRef.current = setInterval(async () => {
      const current = transcriptRef.current
      if (!current || current === lastAnalyzedRef.current) return
      if (isAnalyzingRef.current) return

      lastAnalyzedRef.current = current
      isAnalyzingRef.current  = true
      setIsAnalyzing(true)

      try {
        const result = await analyzeText(current, addLog)
        setScores((prev) => [...prev, result.score])
        setExplanation(result.explanation || '')
      } catch (err) {
        addLog('App', `Analysis error: ${err.message}`)
      } finally {
        isAnalyzingRef.current = false
        setIsAnalyzing(false)
      }
    }, ANALYSIS_INTERVAL_MS)

    return () => clearInterval(analysisTimerRef.current)
  }, [screen, addLog])

  // ── File upload handler ───────────────────────────────────────
  const handleUploadFile = useCallback(async (file) => {
    if (isAnalyzingRef.current) return
    setUploadedFileName(file.name)

    if (screen === 'home') {
      clearLog()
      transcriptRef.current = ''
      lastAnalyzedRef.current = ''
      setTranscript(''); setInterimText(''); setScores([]); setExplanation('')
      setElapsedTime(0); setShowAlert(false); setAlertDismissed(false)
      setCallMode('upload')
      setScreen('call')
      timerRef.current = setInterval(() => setElapsedTime((t) => t + 1), 1000)
    }

    isAnalyzingRef.current = true
    setIsAnalyzing(true)
    try {
      const result = await uploadAudioFile(file, transcriptRef.current, addLog)
      if (result.newText) {
        const updated = (transcriptRef.current + ' ' + result.newText).trim()
        transcriptRef.current = updated
        lastAnalyzedRef.current = updated
        setTranscript(updated)
      }
      setScores((prev) => [...prev, result.score])
      setExplanation(result.explanation || '')
    } catch (err) {
      addLog('App', `Upload error: ${err.message}`)
    } finally {
      isAnalyzingRef.current = false
      setIsAnalyzing(false)
    }
  }, [screen, addLog])

  // ── Answer call (mic mode) ────────────────────────────────────
  const answerCall = useCallback(async () => {
    clearLog()
    transcriptRef.current = ''
    lastAnalyzedRef.current = ''
    setTranscript(''); setInterimText(''); setScores([]); setExplanation('')
    setElapsedTime(0); setShowAlert(false); setAlertDismissed(false)
    setSpeechError(''); setCallMode('mic')
    setScreen('call')

    timerRef.current = setInterval(() => setElapsedTime((t) => t + 1), 1000)

    const ok = startTranscription()
    if (!ok) {
      setSpeechError('Real-time transcription requires Chrome or Edge. You can still upload an audio file below.')
    }
  }, [startTranscription])

  const endCall = useCallback(async () => {
    stopTranscription()
    clearInterval(timerRef.current)
    clearInterval(analysisTimerRef.current)
    addLog('App', `Call ended | final_avg_score: ${avgScore} | elapsed: ${elapsedTime}s`)
    setShowAlert(false)
    setInterimText('')
    // Save log to local folder before navigating away.
    // First call: browser shows a folder picker.
    // Subsequent calls: writes silently to the same folder.
    await saveLogToFolder()
    setScreen('summary')
  }, [stopTranscription, addLog, avgScore, elapsedTime, saveLogToFolder])

  const dismissAlert = useCallback(() => {
    setShowAlert(false)
    setAlertDismissed(true)
  }, [])

  useEffect(() => {
    return () => {
      stopTranscription()
      clearInterval(timerRef.current)
      clearInterval(analysisTimerRef.current)
    }
  }, [])

  return (
    <div className="app-root">
      {screen === 'onboarding' && (
        <OnboardingScreen onStart={() => setScreen('home')} />
      )}
      {screen === 'home' && (
        <HomeScreen onAnswer={answerCall} onUploadFile={handleUploadFile} />
      )}
      {screen === 'call' && (
        <CallScreen
          callMode={callMode}
          elapsedTime={elapsedTime}
          avgScore={avgScore}
          latestExplanation={explanation}
          transcript={transcript}
          interimText={interimText}
          isAnalyzing={isAnalyzing}
          speechError={speechError}
          onEnd={endCall}
          onUploadFile={handleUploadFile}
          uploadedFileName={uploadedFileName}
        />
      )}
      {screen === 'summary' && (
        <SummaryScreen
          avgScore={avgScore}
          latestExplanation={explanation}
          onNewCall={() => setScreen('home')}
        />
      )}

      {showAlert && (
        <ScamAlert
          score={avgScore}
          explanation={explanation}
          onEndCall={endCall}
          onContinue={dismissAlert}
        />
      )}
    </div>
  )
}
