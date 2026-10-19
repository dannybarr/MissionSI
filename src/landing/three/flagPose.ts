/** Scroll and pointer state for the agent ribbons. No three.js here, same as pose.ts. */
export const flagPose = {
  /** 0 = ribbons pulled back off the top-right corner, 1 = fully streamed out. */
  unfurl: 0,
  /** 0–1 gust from pointer movement; decays in the scene. */
  wind: 0,
  /** Section scroll progress, for a slight lift as the section passes. */
  drift: 0,
}

export const flagSignals = {
  onReady: () => {},
}
