# Frontend — Perisai Web App

React + Vite single-page application. Runs entirely in the browser; the only network call is the POST to the Lambda endpoint for AI analysis.

---

## Table of contents

1. [Quick start](#1-quick-start)
2. [Folder structure](#2-folder-structure)
3. [Screen flow](#3-screen-flow)
4. [Real-time transcription](#4-real-time-transcription)
5. [Audio file upload](#5-audio-file-upload)
6. [State management](#6-state-management)
7. [Hooks reference](#7-hooks-reference)
8. [Services reference](#8-services-reference)
9. [Components reference](#9-components-reference)
10. [Environment variables](#10-environment-variables)
11. [Browser compatibility](#11-browser-compatibility)

---

## 1. Quick start

```bash
cd frontend
npm install
cp .env.example .env          # fill in VITE_API_URL
npm run dev                   # http://localhost:5173
npm run build                 # production build → dist/
```

---

## 2. Folder structure

```
frontend/
├── index.html
├── vite.config.js
├── .env.example
└── src/
    ├── main.jsx              Entry point — mounts <App />
    ├── App.jsx               Root component: state machine + call lifecycle
    ├── App.css               All styles (TnG blue/gold design tokens)
    │
    ├── screens/              Full-page views (one per app state)
    │   ├── OnboardingScreen.jsx
    │   ├── HomeScreen.jsx    Simulated incoming call + upload entry
    │   ├── CallScreen.jsx    Active call view
    │   └── SummaryScreen.jsx Post-call results
    │
    ├── components/           Reusable UI pieces
    │   ├── ScoreBar.jsx      Animated risk score bar
    │   ├── TranscriptPanel.jsx  Live + interim transcript display
    │   └── ScamAlert.jsx     Full-screen scam warning overlay
    │
    ├── hooks/
    │   ├── useTranscription.js  Web Speech API wrapper
    │   └── useLogger.js         Log accumulation + local file save
    │
    └── services/
        └── api.js            analyzeText() and uploadAudioFile()
```

---

## 3. Screen flow

```
OnboardingScreen
      │ onStart
      ▼
HomeScreen ──────────────────────────────────────────┐
  [Answer Call] → mic mode                           │
  [Upload Audio File] → upload mode                  │
      │                                              │
      ▼ setScreen('call')                            │
CallScreen  ◄──────────────────────────────────────── ┘
  - LIVE timer
  - Real-time transcript (Web Speech API or file upload)
  - Score bar (Bedrock analysis every 6 s)
  - AI explanation card
  - Upload panel (always available as fallback)
  - [End Call] → saves log to local folder
      │
      ▼ setScreen('summary')
SummaryScreen
  - Final score card (colour-coded)
  - MCMC reporting advice if score ≥ 65
  - [New Call] → back to HomeScreen

ScamAlert overlay appears on top of CallScreen
when avgScore ≥ 65 AND elapsedTime ≥ 30 s
```

### Screen components and their props

#### `OnboardingScreen`
| Prop | Type | Description |
|------|------|-------------|
| `onStart` | `() => void` | Called when user taps Get Started |

#### `HomeScreen`
| Prop | Type | Description |
|------|------|-------------|
| `onAnswer` | `() => void` | Starts mic-based call |
| `onUploadFile` | `(File) => void` | Receives a selected audio file |

#### `CallScreen`
| Prop | Type | Description |
|------|------|-------------|
| `callMode` | `'mic' \| 'upload'` | Determines header subtitle |
| `elapsedTime` | `number` | Seconds since call start |
| `avgScore` | `number` | Rolling average scam score 0-100 |
| `latestExplanation` | `string` | Last AI explanation |
| `transcript` | `string` | Committed transcript text |
| `interimText` | `string` | Currently-being-spoken words (italic) |
| `isAnalyzing` | `boolean` | Shows "Analysing…" pill |
| `speechError` | `string` | Non-empty if Speech API unavailable |
| `onEnd` | `() => void` | Ends call, saves log |
| `onUploadFile` | `(File) => void` | Uploads additional audio |
| `uploadedFileName` | `string` | Display name of last uploaded file |

#### `SummaryScreen`
| Prop | Type | Description |
|------|------|-------------|
| `avgScore` | `number` | Final average score |
| `latestExplanation` | `string` | Final AI explanation |
| `onNewCall` | `() => void` | Navigates back to HomeScreen |

#### `ScamAlert`
| Prop | Type | Description |
|------|------|-------------|
| `score` | `number` | Current average score |
| `explanation` | `string` | AI explanation |
| `onEndCall` | `() => void` | Ends the call immediately |
| `onContinue` | `() => void` | Dismisses the alert (call continues) |

---

## 4. Real-time transcription

**Hook:** `useTranscription` (wraps `window.SpeechRecognition`)

### Why Web Speech API instead of Amazon Transcribe?

Amazon Transcribe processes audio files asynchronously — each job takes 10–25 seconds even for a 5-second clip. The Web Speech API processes audio as you speak, producing words in under 500 ms.

### How it works

```
Microphone input
      │
      ▼
SpeechRecognition (browser, continuous mode)
      │
      ├── isFinal = false  →  onInterimText(text)   ← shown in gray italic
      │
      └── isFinal = true   →  onFinalText(text)     ← appended to transcript
                                      │
                               transcriptRef updated (synchronous)
```

Every **6 seconds**, `App.jsx` checks whether `transcriptRef.current` changed since the last analysis. If it has, it calls `analyzeText(transcript)` (POST to Lambda → Bedrock). This produces a new score and explanation without any audio processing.

### Auto-restart

Chrome's `SpeechRecognition` stops after silence (~5 s). The hook's `onend` handler restarts it automatically as long as `activeRef.current` is true.

### Language

Default is `en-US`. Change `rec.lang` inside `useTranscription.js` for other languages:

| Language | Code |
|----------|------|
| English (US) | `en-US` |
| Bahasa Malaysia | `ms-MY` |
| Mandarin (Simplified) | `zh-CN` |
| Mandarin (Traditional) | `zh-TW` |

---

## 5. Audio file upload

When a microphone is unavailable, users can upload an audio file instead. The file goes through the full Lambda → S3 → Transcribe → Bedrock pipeline.

**Accepted formats:** `.mp3` `.wav` `.m4a` `.ogg` `.webm` `.mp4` `.flac`

### Upload flow

```
User selects file
      │
      ▼
uploadAudioFile(file, currentTranscript)   [api.js]
      │
      ├── FileReader → base64
      │
      ▼
POST /analyze  { audio: "<base64>", mimeType: "audio/mp4", transcript: "..." }
      │
      ▼
Lambda → S3 upload → Transcribe job → poll → Bedrock
      │
      ▼
{ newText, score, explanation }
      │
      ▼
transcript updated, score appended, explanation updated
```

The upload can be triggered:
- From **HomeScreen** (launches the call screen in upload mode)
- From **CallScreen** during an active call (adds context to an ongoing session)

---

## 6. State management

All state lives in `App.jsx`. There is no external state library.

### Key state variables

| Variable | Type | Purpose |
|----------|------|---------|
| `screen` | `'onboarding' \| 'home' \| 'call' \| 'summary'` | Active screen |
| `callMode` | `'mic' \| 'upload'` | Input method for current call |
| `transcript` | `string` | Full committed transcript |
| `interimText` | `string` | Live partial recognition (not yet committed) |
| `scores` | `number[]` | All Bedrock scores from this session |
| `explanation` | `string` | Latest AI explanation |
| `elapsedTime` | `number` | Timer seconds |
| `isAnalyzing` | `boolean` | True while a Bedrock request is in-flight |
| `showAlert` | `boolean` | Whether the scam alert overlay is visible |

### Key refs (not React state — no re-render on change)

| Ref | Type | Purpose |
|-----|------|---------|
| `transcriptRef` | `string` | Mirror of `transcript` for use inside callbacks without stale closure |
| `lastAnalyzedRef` | `string` | Last transcript sent to Bedrock — prevents duplicate calls |
| `isAnalyzingRef` | `boolean` | Guards against overlapping API calls |
| `timerRef` | `Timer` | Elapsed time interval |
| `analysisTimerRef` | `Timer` | 6-second Bedrock polling interval |

### Score accumulation and alert logic

```
avgScore = mean(scores[])

Alert shown when:
  screen === 'call'
  AND avgScore >= 65
  AND elapsedTime >= 30
  AND alertDismissed === false
  AND showAlert === false
```

Using an average (not the latest score) prevents a single noisy response from triggering a false alert.

---

## 7. Hooks reference

### `useTranscription(onFinalText, onInterimText, onLog)`

Wraps `window.SpeechRecognition` with auto-restart and logging.

**Returns:** `{ start, stop }`

| Return | Type | Description |
|--------|------|-------------|
| `start()` | `() => boolean` | Starts recognition. Returns `false` if API not supported. |
| `stop()` | `() => void` | Stops recognition and releases microphone. |

**Parameters:**

| Parameter | Type | Called when |
|-----------|------|-------------|
| `onFinalText` | `(text: string) => void` | A sentence/phrase is confirmed |
| `onInterimText` | `(text: string) => void` | User is mid-word/sentence |
| `onLog` | `(service, message) => void` | Internal events |

---

### `useLogger()`

Accumulates timestamped log lines and saves them to a local folder when `saveLogToFolder()` is called.

**Returns:** `{ addLog, logLines, clearLog, saveLogToFolder }`

| Return | Type | Description |
|--------|------|-------------|
| `addLog(service, message)` | `fn` | Appends a timestamped line, prints to console |
| `logLines` | `string[]` | React state — all lines (for rendering if needed) |
| `clearLog()` | `fn` | Resets lines and restarts the elapsed timer |
| `saveLogToFolder()` | `async fn` | Saves current log to local folder (see below) |

#### How `saveLogToFolder` works

1. If `window.showDirectoryPicker` is available (Chrome, Edge):
   - **First call in a session:** shows a folder picker. User selects or creates their `logs` folder.
   - **Subsequent calls:** writes silently to the same folder handle.
   - File is named `scam-log-YYYY-MM-DDTHH-MM-SS.txt`.
2. If the API is not available (Firefox): triggers a standard browser download.
3. If the user cancels the picker: does nothing (no download fallback).

---

## 8. Services reference

### `analyzeText(transcript, onLog?)`  → `Promise<AnalysisResult>`

Sends plain text to the Lambda endpoint. The backend skips S3 and Transcribe entirely — only Bedrock runs.

**Request body:**
```json
{ "transcript": "Hello I am calling from Bank Negara..." }
```

**Response shape:**
```ts
{
  score:       number,   // 0-100
  explanation: string,   // ≤ 80 words
  logKey?:     string,   // S3 path of backend log
  backendLog?: string[]  // per-request log lines from Lambda
}
```

**Typical latency:** 1–2 seconds (Bedrock only).

---

### `uploadAudioFile(file, currentTranscript, onLog?)`  → `Promise<AnalysisResult>`

Encodes a `File` object as base64 and sends it with the current transcript context for Transcribe + Bedrock processing.

**Request body:**
```json
{
  "audio":      "<base64 string>",
  "mimeType":   "audio/mp4",
  "transcript": "<accumulated transcript so far>"
}
```

**Response shape:** same as `analyzeText` plus `newText` (the transcription of the uploaded file).

**Typical latency:** 15–30 seconds (includes Transcribe job).

---

## 9. Components reference

### `ScoreBar({ score })`

Displays the scam risk score as a labelled progress bar. Colour and label change based on score:

| Score range | Colour | Label |
|-------------|--------|-------|
| 0 – 39 | Green `#1B6B3A` | LOW RISK |
| 40 – 64 | Orange `#E65100` | SUSPICIOUS |
| 65 – 100 | Red `#C62828` | HIGH RISK |

The fill width transitions with CSS (`transition: width 0.6s ease`).

---

### `TranscriptPanel({ transcript, interimText })`

Renders the transcript in two layers:
- `transcript` — committed final text, dark colour
- `interimText` — current partial recognition, grey italic

Auto-scrolls to bottom on every update.

---

### `ScamAlert({ score, explanation, onEndCall, onContinue })`

Full-screen modal overlay (`position: fixed, z-index: 200`). Rendered by `App.jsx` on top of any screen.

Buttons:
- **End Call Now** — calls `onEndCall`, same as the main End Call button
- **I understand — Continue Call** — calls `onContinue`, sets `alertDismissed = true` (alert won't re-appear in this session)

---

## 10. Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Full URL of the Lambda endpoint, e.g. `https://abc123.execute-api.ap-southeast-1.amazonaws.com/prod/analyze` |

Set in `frontend/.env` (copy from `.env.example`). Vite bakes the value into the bundle at build time.

---

## 11. Browser compatibility

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| Web Speech API (real-time mic) | ✅ | ✅ | ✅ 14.5+ | ❌ |
| File System Access API (save to folder) | ✅ | ✅ | ❌ (downloads instead) | ❌ (downloads instead) |
| Audio file upload | ✅ | ✅ | ✅ | ✅ |
| Overall app usable | ✅ | ✅ | ✅ | ⚠️ mic only via upload |

**Firefox users** can still use the app in full via the audio file upload path. A warning banner is shown on the call screen if the Speech API is unavailable.
