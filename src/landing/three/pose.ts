/**
 * Shared, mutable scene pose. Scroll and pointer code on the page write it;
 * the WebGL scene reads it every frame. No three.js in this module, so the
 * landing page can import it without pulling the 3D chunk into the first paint.
 */
export const pose = {
  /** Front three-quarter presentation; rotations remain below a quarter turn. */
  spin: 0.38,
  pitch: -0.12,
  inspection: 0,
  tiltX: 0,
  tiltY: 0,
  /** 0 = hero framing, 1 = camera over the tray. */
  cam: 0,
  /** Card position along its glide: 0 = hero, 1 = resting in the tray. */
  lay: 0,
  /** 0 = upright for inspection, 1 = lying flat in the tray. */
  flat: 0,
  /** 0–1 roll into the glide's curve. */
  bank: 0,
  /** Small damped tilt (radians) after touchdown. */
  rock: 0,
  /** 0–1 impulse the resting tray objects answer with. */
  nudge: 0,
  spinning: 0,
}

export const signals = {
  onReady: () => {},
}
