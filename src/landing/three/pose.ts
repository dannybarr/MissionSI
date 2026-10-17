/**
 * Shared, mutable scene pose. Scroll and pointer code on the page write it;
 * the WebGL scene reads it every frame. No three.js in this module, so the
 * landing page can import it without pulling the 3D chunk into the first paint.
 */
export const pose = {
  /** Y rotation in radians. π shows the blank back; π + 1260° shows the front. */
  spin: Math.PI,
  tiltX: 0,
  tiltY: 0,
  /** 0 = hero framing, 1 = card settled in the tray. */
  cam: 0,
  /** Extra vertical offset (cm) for the landing spring. */
  settle: 0,
  /** 0–1 impulse the resting tray objects answer with. */
  nudge: 0,
  spinning: 0,
}

export const signals = {
  onReady: () => {},
}
