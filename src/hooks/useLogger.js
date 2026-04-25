import { useState, useCallback, useRef } from 'react'

export function useLogger() {
  const [logLines, setLogLines] = useState([])
  const linesRef     = useRef([])      // always-current mirror (no stale-closure issues)
  const startTimeRef = useRef(null)
  const dirHandleRef = useRef(null)    // remembered across saves within a session

  const addLog = useCallback((service, message) => {
    if (!startTimeRef.current) startTimeRef.current = Date.now()
    const elapsed = ((Date.now() - startTimeRef.current) / 1000).toFixed(2)
    const ts = new Date().toLocaleTimeString('en-MY', { hour12: false })
    const line = `[${ts}] [+${elapsed}s] [${service}] ${message}`
    linesRef.current = [...linesRef.current, line]
    setLogLines(linesRef.current)
    console.log(line)
  }, [])

  const clearLog = useCallback(() => {
    linesRef.current = []
    setLogLines([])
    startTimeRef.current = Date.now()
  }, [])

  // Saves to a user-chosen local folder using the File System Access API.
  // First call shows a folder picker; subsequent calls within the same session
  // write silently to the same folder.
  // Falls back to a normal browser download on unsupported browsers (Firefox, etc.).
  const saveLogToFolder = useCallback(async () => {
    const lines = linesRef.current
    if (lines.length === 0) return

    const ts       = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const filename = `scam-log-${ts}.txt`
    const content  = buildContent(lines)

    if (!('showDirectoryPicker' in window)) {
      triggerDownload(content, filename)
      return
    }

    try {
      // create logs folder and save it there. use current directory, no need to ask user again until they close the tab or refresh
      if (!dirHandleRef.current) {
        dirHandleRef.current = await window.showDirectoryPicker({ id: 'perisai-log-folder', mode: 'readwrite' })
      }
      
      const fileHandle = await dirHandleRef.current.getFileHandle(filename, { create: true })
      const writable   = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()
    } catch (err) {
      if (err.name === 'AbortError') return   // user cancelled the picker — do nothing
      // Permission lost or other error — reset handle and fall back to download
      dirHandleRef.current = null
      triggerDownload(content, filename)
    }
  }, [])

  return { addLog, logLines, clearLog, saveLogToFolder }
}

function buildContent(lines) {
  return [
    'Perisai — Session Log',
    `Generated : ${new Date().toISOString()}`,
    '='.repeat(60),
    '',
    ...lines,
  ].join('\n')
}

function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}
