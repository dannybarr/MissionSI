# Mission product preview — first implementation pass

## Direction and evidence

The prototype sheets supplied in the brief define the silhouette and artwork. The local recordings show an Oki page walkthrough, a ribbon composition, and the previous Mission card presentation. Contact sheets were extracted and inspected; these are visual samples, not a frame-by-frame playback review.

The current public Ghost and Oki pages were consulted on 18 October 2026:
- https://ghost.ai/
- https://okihome.ai/

Ghost establishes a product category and supports it with physical detail. Oki connects a tangible object to a simple ownership story. These are presentation benchmarks; no funding affiliation or endorsement is implied for Mission.

## What this pass addresses

- The old hero starts on the blank rear and launches a 1260-degree, time-driven spin at a scroll threshold. The replacement reveals the printed front immediately and uses bounded, reversible scroll poses.
- The recessed panel previously discarded the outer notches. Both the 3D geometry and SVG fallback now follow the stepped perimeter.
- Graphite uses a finer surface texture, a softer metallic response, and a separate face finish. Printed marks respond to lighting and sit close to the surface.
- The connector, cable, laptop and card share one local coordinate system in the opening scene. The laptop-end cable anchor stays fixed during connector travel. The cable withdraws before the tray transition.
- The card's tray height accounts for the floor and half its thickness. The final pose is flat; a small positive settling offset cannot bounce the card through the tray.
- Hidden opening links become inert, and reduced motion uses the existing static presentation.
- Phone framing uses a fixed WebGL view size so the camera stays calibrated while more of the scene is revealed. The connection beat moves closer to the card and port; the tray stays out of sight until the descent and moves clear of the closing caption.
- A pre-existing Windows import collision between `Captures.tsx` and `captures.ts` required renaming the data module to `captureContent.ts`.

## Critical review / remaining launch work

The product is still a procedural approximation based on concept imagery. No verified CAD, manufacturing dimensions, or measured material samples were supplied. The laptop is a restrained supporting model, not a finished photorealistic Mac asset.

The site still asks visitors to absorb a dense hero paragraph, a design/reservation CTA, multiple feature narratives and a concept hardware story. The wording “not taking orders” alongside “reserve yours” needs a later product/copy decision. This pass preserves that existing story.

Tray accessories and the Mac software preview remain visibly stylised and are the next realism pass. The multiple long pinned sections elsewhere also deserve a whole-page pacing pass. Do not describe the entire website as launch-ready based on this change.

## Verification

Run `npm install`, `npx tsc --noEmit`, `npm test`, and `npm run build`. Run `npm run dev -- --host 127.0.0.1 --port 5180` for the preview.

Inspect desktop and phone views at reveal, front, edge, connected, withdrawal and tray. Scroll backwards, resize while midway, navigate to Studio and back, and test OS reduced motion. Confirm no cut-off product, copy overlap, console errors or layout overflow. The motion tests cover front-face visibility, disconnection before transit, safe landing offset, and deterministic reverse scrolling.

`scripts/preview-review.mjs` captures checkpoints using Playwright. Pass `mobile`, `desktop`, or `reduced` to capture one layout. It requires Playwright installed in the project or an ancestor directory. Screenshots are written outside the website checkout into the workspace's artifacts directory.

The desktop and phone checkpoints were visually reviewed. The card front, port-facing angle, white-cable connection and final tray pose remain in frame; the phone tray caption sits below the tray. The browser reported no page exceptions or horizontal overflow in those captures. This is a first product-preview pass, not a final claim of photographic realism or launch readiness.
