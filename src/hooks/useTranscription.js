import { useRef, useCallback } from 'react'

// Uses the browser's built-in Web Speech API — real-time, no backend needed.
// Supported: Chrome, Edge, Safari 14.5+. Not supported: Firefox.
export function useTranscription(onFinalText, onInterimText, onLog = () => {}) {
  const recognitionRef = useRef(null)
  const activeRef      = useRef(false)

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      onLog('Speech', 'Web Speech API not supported — use Chrome or Edge')
      return false
    }

    activeRef.current = true
    const rec = new SR()
    rec.continuous      = true
    rec.interimResults  = true
    rec.lang            = 'en-US' // change to 'ms-MY' for Malay, 'zh-CN' for Mandarin

    rec.onstart = () => onLog('Speech', 'Real-time transcription active (Web Speech API)')

    rec.onresult = (event) => {
      let finalText   = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        event.results[i].isFinal ? (finalText += text + ' ') : (interimText += text)
      }
      if (finalText.trim()) {
        onLog('Speech', `Final: "${finalText.trim()}"`)
        onFinalText(finalText.trim())
      }
      if (interimText) onInterimText(interimText)
    }

    rec.onerror = (e) => {
      if (e.error === 'not-allowed') {
        onLog('Speech', 'Microphone permission denied')
        activeRef.current = false
        return
      }
      // All other errors: log and let onend restart it
      onLog('Speech', `Error: ${e.error}`)
    }

    // Auto-restart on unexpected stop (e.g. silence timeout on Chrome)
    rec.onend = () => {
      if (activeRef.current) {
        try { rec.start() } catch (_) {}
      }
    }

    recognitionRef.current = rec
    rec.start()
    return true
  }, [onFinalText, onInterimText, onLog])

  const stop = useCallback(() => {
    activeRef.current = false
    recognitionRef.current?.stop()
    recognitionRef.current = null
    onLog('Speech', 'Transcription stopped')
  }, [onLog])

  return { start, stop }
}
