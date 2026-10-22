/** Deterministic scroll choreography. Every pose is reversible. */
function clamp01(t: number) {
  return Math.max(0, Math.min(1, t))
}

/** Smootherstep between start and end: zero speed at both ends. */
export function phase(p: number, start: number, end: number) {
  const t = clamp01((p - start) / (end - start))
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/** Eases out only: moves from the first scroll pixel, then decelerates to rest. */
function rise(p: number, start: number, end: number) {
  const t = clamp01((p - start) / (end - start))
  return 1 - (1 - t) ** 3
}

/** A glide: gentle lift-off, fastest early, then a long, soft approach to the landing. */
function glide(p: number, start: number, end: number) {
  const t = clamp01((p - start) / (end - start))
  const u = t ** 0.78
  return u * u * u * (u * (u * 6 - 15) + 10)
}

/**
 * Phases overlap so one is always picking up speed while the previous slows down:
 * growth and turn, then the turn to the edge, then the glide to the tray.
 */
export function productMotion(p: number) {
  const front = rise(p, 0, 0.3)
  const edge = phase(p, 0.18, 0.44)
  // Position, camera and orientation share one glide; the card lays itself flat a beat
  // after it arrives, so it touches down on one edge and then rolls flat.
  const lay = glide(p, 0.3, 0.88)
  const flat = glide(p, 0.32, 0.94)
  const flight = clamp01((p - 0.3) / 0.58)
  // One small, damped rock past flat after touchdown. Never a cartoon bounce.
  const r = clamp01((p - 0.88) / 0.1)
  return {
    // Show the left edge without ever turning the printed face away.
    spin: 0.38 * (1 - front) + 0.67 * edge,
    pitch: -0.12 * (1 - front) - 0.12 * edge,
    inspection: rise(p, 0, 0.34),
    cam: phase(p, 0.28, 0.86),
    lay,
    flat,
    // Roll into the turn, strongest mid-flight, level again before landing.
    bank: flight > 0 && flight < 1 ? Math.sin(Math.PI * flight) ** 2 * (1 - flight * 0.4) : 0,
    rock: r > 0 && r < 1 ? Math.sin(Math.PI * r) * (1 - r) * 0.045 : 0,
    copy: 1 - phase(p, 0.02, 0.24),
    trayCopy: phase(p, 0.72, 0.95),
  }
}
