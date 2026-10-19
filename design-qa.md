# Mission landing design QA — 2026-10-19

Reference: user-supplied Ghost grey-grain screenshot and Earth mark; user-supplied everyday-carry tray photograph and prior card prototype references.

## Verified in desktop browser

- Grey tonal background and fine grain replace the cream/grid backdrop. Light-chapter text is black. Handjet loads across the landing page and Studio UI.
- Earth mark appears in the top-left navigation; navigation remains fixed while scrolling.
- The supplied tray photograph is mapped to a plane in the Three.js opening scene. The concept card travels to its left; the whole tray is visible at the end pose. The separate static tray is only used with reduced motion.
- Card shadow changes position and spread as the card moves. The white cable, Apple Mac photo and card appear in the connection beat. The Apple iPhone image appears in the later hardware beat.
- “Design your card” has a prominent Design Centre link.

## Remaining issues before a public launch

- The photographed tray is a 2.5D textured surface, not reconstructed tray geometry. It preserves the exact supplied photo, but it cannot show true side parallax or realistic shadows between individual contents.
- The Apple Mac photo in the opening cable beat is a cropped 2024 press image. It still reads more like compositing than a single product photograph. A licensed bespoke top-down photograph or a real MacBook 3D asset would materially improve it.
- Rights to publish the tray and Apple Newsroom imagery commercially have not been confirmed. See `IMAGE_CREDITS.md`.
- Mobile visual QA of the full 3D scroll sequence remains to be completed.

Build, TypeScript and unit tests passed after this design pass. Desktop visual review does not constitute launch approval.
