/**
 * Scroll writes this. The exploded-card scene reads it.
 * Kept free of three.js so the landing bundle can import it.
 */
export const explodePose = {
  /** 0 = closed card, 1 = shell fully split and the last callout focused. */
  p: 0,
  /** Part id currently emphasised. Empty until the shell has opened. */
  focus: "",
};

export const explodeSignals = {
  onReady: () => {},
};
