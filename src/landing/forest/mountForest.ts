/**
 * Forest ASCII look from the 21st.dev recipe:
 * characters, 10px cells, greyscale, tilt blur, chromatic + halftone + film dust, shimmer.
 * Sampled once. Animation only retints glyphs. Pauses off-screen. Caps frame rate.
 */

const RAMP = ' .:-=+*#%@'
const CELL = 10

export interface ForestOptions {
  canvas: HTMLCanvasElement
  src: string
  reduced?: boolean
}

export function mountForest({ canvas, src, reduced }: ForestOptions): () => void {
  const off = document.createElement('canvas')
  const blur = document.createElement('canvas')
  const mask = document.createElement('canvas')
  const img = new Image()
  img.decoding = 'async'
  img.src = src

  let cols = 0
  let rows = 0
  let lum: Float32Array | null = null
  let running = false
  let raf = 0
  let last = 0
  let visible = true
  let alive = true
  const fps = reduced ? 0 : window.matchMedia('(max-width: 760px)').matches ? 16 : 24
  const minDelta = fps ? 1000 / fps : Infinity

  const view = canvas.getContext('2d', { alpha: false })
  const octx = off.getContext('2d', { alpha: false })
  const bctx = blur.getContext('2d', { alpha: false })
  const mctx = mask.getContext('2d')
  if (!view || !octx || !bctx || !mctx) return () => {}

  const atlas = document.createElement('canvas')
  const cell = 28
  atlas.width = cell * RAMP.length
  atlas.height = cell
  const actx = atlas.getContext('2d')!
  actx.clearRect(0, 0, atlas.width, atlas.height)
  actx.fillStyle = '#fff'
  actx.font = `600 ${Math.round(cell * 0.86)}px "Geist", "Schibsted Grotesk", sans-serif`
  actx.textAlign = 'center'
  actx.textBaseline = 'middle'
  for (let i = 0; i < RAMP.length; i++) actx.fillText(RAMP[i] === ' ' ? '' : RAMP[i], i * cell + cell / 2, cell / 2 + 1)

  function contrast(l: number) {
    // 128 on a 0–255 scale, treated as a lift above a flat image (neutral would be a no-op).
    const f = 1 + 128 / 128
    const n = (l - 0.5) * f + 0.5
    return n < 0 ? 0 : n > 1 ? 1 : n
  }

  function layout() {
    const rect = canvas.getBoundingClientRect()
    const cssW = Math.max(2, Math.round(rect.width))
    const cssH = Math.max(2, Math.round(rect.height))
    const cap = window.matchMedia('(max-width: 760px)').matches ? 640 : 960
    const scale = Math.min(1, cap / cssW)
    const w = Math.max(2, Math.round(cssW * scale))
    const h = Math.max(2, Math.round(cssH * scale))
    canvas.width = w
    canvas.height = h
    off.width = w
    off.height = h
    blur.width = w
    blur.height = h
    mask.width = w
    mask.height = h
    cols = Math.max(1, Math.floor(w / CELL))
    rows = Math.max(1, Math.floor(h / CELL))
    sample()
    buildMask(w, h)
  }

  function sample() {
    if (!img.complete || !img.naturalWidth) return
    const w = off.width
    const h = off.height
    const sample = document.createElement('canvas')
    sample.width = cols
    sample.height = rows
    const sctx = sample.getContext('2d', { willReadFrequently: true })
    if (!sctx) return
    sctx.drawImage(img, 0, 0, cols, rows)
    const data = sctx.getImageData(0, 0, cols, rows).data
    lum = new Float32Array(cols * rows)
    for (let i = 0; i < lum.length; i++) {
      const r = data[i * 4]
      const g = data[i * 4 + 1]
      const b = data[i * 4 + 2]
      const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
      lum[i] = contrast(y)
    }
    // blurred photo behind the glyphs (bgMode blur, bgBlur 2, bgOpacity 90)
    octx.filter = 'blur(2px)'
    octx.globalAlpha = 0.9
    octx.drawImage(img, 0, 0, w, h)
    octx.filter = 'none'
    octx.globalAlpha = 1
  }

  function buildMask(w: number, h: number) {
    // tiltFocus 35, tiltPosition 50, tiltFeather 15 — a sharp horizontal band.
    const pos = 0.5
    const half = 0.35 / 2
    const feather = 0.15
    const g = mctx.createLinearGradient(0, 0, 0, h)
    const a = Math.max(0, pos - half - feather)
    const b = Math.max(0, pos - half)
    const c = Math.min(1, pos + half)
    const d = Math.min(1, pos + half + feather)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(a, 'rgba(0,0,0,0)')
    g.addColorStop(b, 'rgba(0,0,0,1)')
    g.addColorStop(c, 'rgba(0,0,0,1)')
    g.addColorStop(d, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    mctx.clearRect(0, 0, w, h)
    mctx.fillStyle = g
    mctx.fillRect(0, 0, w, h)
  }

  function drawGlyphs(time: number) {
    if (!lum) return
    const w = off.width
    const h = off.height
    octx.filter = 'blur(2px)'
    octx.globalAlpha = 0.9
    if (img.complete && img.naturalWidth) octx.drawImage(img, 0, 0, w, h)
    else {
      octx.filter = 'none'
      octx.fillStyle = '#0c0d0e'
      octx.fillRect(0, 0, w, h)
    }
    octx.filter = 'none'
    octx.globalAlpha = 1
    const speed = 100 / 100
    const intensity = 60 / 100
    const t = reduced ? 0 : time * 0.001 * speed * 2.2
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x
        const base = lum[i]
        const shim = reduced ? 0 : Math.sin(t + x * 0.37 + y * 0.21) * 0.22 * intensity
        let l = base + shim
        if (l < 0) l = 0
        else if (l > 1) l = 1
        const gi = Math.min(RAMP.length - 1, Math.floor(l * (RAMP.length - 0.001)))
        if (gi === 0) continue
        octx.globalAlpha = 0.28 + l * 0.72
        octx.drawImage(atlas, gi * cell, 0, cell, cell, x * CELL, y * CELL, CELL, CELL)
      }
    }
    octx.globalAlpha = 1

    // chromatic, intensity 20 — a short red/blue ghost
    octx.globalCompositeOperation = 'screen'
    octx.globalAlpha = 0.18
    octx.filter = 'none'
    octx.drawImage(off, 2, 0)
    octx.globalAlpha = 0.14
    octx.drawImage(off, -2, 0)
    octx.globalCompositeOperation = 'source-over'
    octx.globalAlpha = 1

    // halftone, intensity 20
    octx.globalAlpha = 0.2
    octx.fillStyle = '#0a0a0a'
    const step = CELL * 2
    for (let y = 0; y < rows; y += 2) {
      for (let x = 0; x < cols; x += 2) {
        const l = lum[y * cols + x]
        const r = (1 - l) * 2.1
        if (r < 0.4) continue
        octx.beginPath()
        octx.arc(x * CELL + CELL, y * CELL + CELL, r, 0, Math.PI * 2)
        octx.fill()
      }
    }
    octx.globalAlpha = 1

    // film dust, intensity 20
    const dust = 18 + Math.floor((time / 180) % 7)
    octx.fillStyle = '#f2f2f0'
    for (let n = 0; n < dust; n++) {
      const sx = Math.abs(Math.sin(time * 0.0004 + n * 12.3)) * w
      const sy = Math.abs(Math.sin(time * 0.00027 + n * 4.7)) * h
      octx.globalAlpha = 0.15 + (n % 5) * 0.05
      octx.fillRect(sx, sy, n % 4 === 0 ? 2 : 1, n % 3 === 0 ? 2 : 1)
    }
    octx.globalAlpha = 1
  }

  function composite() {
    const w = off.width
    const h = off.height
    bctx.filter = 'blur(10px)'
    bctx.drawImage(off, 0, 0, w, h)
    bctx.filter = 'none'
    view!.drawImage(blur, 0, 0)
    // sharp band
    octx.save()
    octx.globalCompositeOperation = 'destination-in'
    octx.drawImage(mask, 0, 0)
    octx.restore()
    view!.drawImage(off, 0, 0)
  }

  function frame(time: number) {
    if (!alive) return
    raf = requestAnimationFrame(frame)
    if (!visible || document.hidden) return
    if (time - last < minDelta) return
    last = time
    if (!lum) {
      sample()
      if (!lum) return
    }
    drawGlyphs(time)
    // destination-in consumes the glyph canvas, so redraw next frame from scratch (drawGlyphs clears via photo)
    composite()
    if (reduced) {
      cancelAnimationFrame(raf)
      running = false
    }
  }

  function start() {
    if (running) return
    running = true
    raf = requestAnimationFrame(frame)
  }

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting)
      if (visible) start()
    },
    { threshold: 0.05 },
  )
  io.observe(canvas)

  const ro = new ResizeObserver(() => {
    layout()
  })
  ro.observe(canvas)

  img.addEventListener('load', () => {
    layout()
    start()
  })
  if (img.complete) {
    layout()
    start()
  }

  const onVis = () => {
    if (!document.hidden && visible) start()
  }
  document.addEventListener('visibilitychange', onVis)

  return () => {
    alive = false
    cancelAnimationFrame(raf)
    io.disconnect()
    ro.disconnect()
    document.removeEventListener('visibilitychange', onVis)
  }
}
