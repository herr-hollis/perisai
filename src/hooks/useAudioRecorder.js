import { useRef, useCallback } from 'react'

const CHUNK_MS = 5000

function getSupportedMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || ''
}

export function useAudioRecorder(onChunk, onLog = () => {}) {
  const streamRef = useRef(null)
  const activeRef = useRef(false)
  const mimeTypeRef = useRef('')
  const chunkIndexRef = useRef(0)

  const recordOneChunk = useCallback(() => {
    if (!activeRef.current || !streamRef.current) return

    const index = ++chunkIndexRef.current
    const options = mimeTypeRef.current ? { mimeType: mimeTypeRef.current } : {}
    const recorder = new MediaRecorder(streamRef.current, options)
    const chunks = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = () => {
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: recorder.mimeType })
        onLog('Audio', `Chunk #${index} captured | size: ${(blob.size / 1024).toFixed(1)} KB | mimeType: ${recorder.mimeType}`)
        onChunk(blob, recorder.mimeType)
      } else {
        onLog('Audio', `Chunk #${index} was empty — skipping`)
      }
      if (activeRef.current) recordOneChunk()
    }

    onLog('Audio', `Recording chunk #${index} (${CHUNK_MS / 1000}s window)`)
    recorder.start()
    setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop()
    }, CHUNK_MS)
  }, [onChunk, onLog])

  const startRecording = useCallback(async () => {
    onLog('Audio', 'Requesting microphone access')
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream
    mimeTypeRef.current = getSupportedMimeType()
    activeRef.current = true
    chunkIndexRef.current = 0
    onLog('Audio', `Microphone granted | mimeType: ${mimeTypeRef.current || 'browser default'}`)
    recordOneChunk()
  }, [recordOneChunk, onLog])

  const stopRecording = useCallback(() => {
    onLog('Audio', 'Recording stopped — microphone released')
    activeRef.current = false
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [onLog])

  return { startRecording, stopRecording }
}
