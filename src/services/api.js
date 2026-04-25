const API_URL = import.meta.env.VITE_API_URL

// Text-only analysis — no audio upload, no Transcribe.
// Backend receives just the transcript and passes it straight to Bedrock.
// Round-trip is ~1-2 seconds instead of 20-30.
export async function analyzeText(transcript, onLog = () => {}) {
  onLog('API', `Analysing ${transcript.length} chars via Bedrock → ${API_URL}`)
  const t0 = Date.now()

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),   // no audio field — backend skips Transcribe
  })

  const duration = ((Date.now() - t0) / 1000).toFixed(2)
  onLog('API', `Response | status: ${response.status} | duration: ${duration}s`)

  if (!response.ok) throw new Error(`API error: ${response.status}`)

  const result = await response.json()
  onLog('API', `Score: ${result.score} | explanation: "${(result.explanation || '').slice(0, 60)}"`)
  return result
}

// Audio file upload — used for uploaded files only.
// Still goes through Transcribe (acceptable since it's not live).
export async function uploadAudioFile(file, currentTranscript, onLog = () => {}) {
  onLog('Upload', `File: ${file.name} | ${(file.size / 1024).toFixed(1)} KB | type: ${file.type || 'audio/mpeg'}`)

  const audioBase64 = await blobToBase64(file)
  onLog('Upload', `Sending to API Gateway…`)
  const t0 = Date.now()

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio:      audioBase64,
      mimeType:   file.type || 'audio/mpeg',
      transcript: currentTranscript,
    }),
  })

  const duration = ((Date.now() - t0) / 1000).toFixed(2)
  onLog('Upload', `Response | status: ${response.status} | duration: ${duration}s`)

  if (!response.ok) throw new Error(`API error: ${response.status}`)

  const result = await response.json()
  onLog('Upload', `Score: ${result.score}`)
  return result
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
