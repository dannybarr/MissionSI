/** Deterministic scroll choreography. Every pose is reversible, including contact. */
export function phase(p: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (p - start) / (end - start)))
  return t * t * t * (t * (t * 6 - 15) + 10)
}

export function productMotion(p: number) {
  const front = phase(p, 0.04, 0.2)
  const edge = phase(p, 0.23, 0.38)
  const connect = phase(p, 0.39, 0.51)
  const leave = phase(p, 0.63, 0.71)
  const travel = phase(p, 0.71, 0.94)
  return {
    // Show the left edge without ever turning the printed face away.
    spin: 0.38 * (1 - front) + 0.67 * edge - 0.47 * connect,
    pitch: -0.12 * (1 - front) - 0.12 * edge - 0.35 * connect,
    connection: connect * (1 - leave),
    insertion: phase(p, 0.51, 0.56) * (1 - phase(p, 0.62, 0.66)),
    cam: travel,
    copy: 1 - phase(p, 0.22, 0.35),
    trayCopy: phase(p, 0.88, 0.97),
    // A shallow, positive-only settling arc: never intersect the tray floor.
    settle: p >= 0.96 ? 0 : Math.sin(Math.PI * phase(p, 0.86, 0.96)) * 0.06,
  }
}
