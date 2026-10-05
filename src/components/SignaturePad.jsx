import { useRef, useEffect, useCallback } from 'react'

// Props:
//   value     – base64 PNG string or null (controlled)
//   onChange  – called with base64 string after each stroke, or null when cleared
//   disabled  – if true, disables all interaction
function SignaturePad({ value, onChange, disabled = false }) {
  const canvasRef  = useRef(null)
  const isDrawing  = useRef(false)
  const hasStrokes = useRef(false)

  const drawHint = useCallback((ctx, canvas) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.font = '16px system-ui, Arial, sans-serif'
    ctx.fillStyle = '#aab0c0'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Sign here', canvas.width / 2, canvas.height / 2)
    ctx.restore()
  }, [])

  // Initialise canvas and draw hint on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.lineWidth  = 2
    ctx.strokeStyle = '#1B2A5B'
    ctx.lineCap    = 'round'
    ctx.lineJoin   = 'round'
    if (!value) {
      drawHint(ctx, canvas)
      hasStrokes.current = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Respond to external value going null → clear the canvas
  useEffect(() => {
    if (value !== null) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    drawHint(ctx, canvas)
    hasStrokes.current = false
  }, [value, drawHint])

  // ── Coordinate helpers ────────────────────────────────────────────────────

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    }
  }

  // ── Draw events ───────────────────────────────────────────────────────────

  const startDrawing = useCallback((e) => {
    if (disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    // Clear hint text on first stroke
    if (!hasStrokes.current) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      hasStrokes.current = true
    }

    isDrawing.current = true
    const { x, y } = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }, [disabled])

  const draw = useCallback((e) => {
    if (!isDrawing.current || disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const { x, y } = getPos(e, canvas)
    ctx.lineTo(x, y)
    ctx.stroke()
  }, [disabled])

  const stopDrawing = useCallback((e) => {
    if (!isDrawing.current) return
    if (e) e.preventDefault()
    isDrawing.current = false
    const canvas = canvasRef.current
    onChange(canvas.toDataURL('image/png'))
  }, [onChange])

  // ── Clear ─────────────────────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    if (disabled) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    drawHint(ctx, canvas)
    hasStrokes.current = false
    onChange(null)
  }, [disabled, drawHint, onChange])

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 8 }}>
      <canvas
        ref={canvasRef}
        width={500}
        height={160}
        style={{
          border: '1px solid var(--ghra-line)',
          borderRadius: 6,
          background: '#fff',
          touchAction: 'none',
          cursor: disabled ? 'not-allowed' : 'crosshair',
          display: 'block',
          maxWidth: '100%',
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <button
        type="button"
        onClick={handleClear}
        disabled={disabled}
        style={{
          alignSelf: 'flex-start',
          padding: '5px 14px',
          fontSize: 13,
          border: '1px solid var(--ghra-line)',
          borderRadius: 5,
          background: '#fff',
          color: 'var(--ghra-slate)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        Clear
      </button>
    </div>
  )
}

export default SignaturePad
