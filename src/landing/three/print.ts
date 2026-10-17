import { CARD } from './geometry'

/** The print plane is inset so it stays inside the notches. Coordinates below are centimetres, card centre, +x right, +y up. */
export const PRINT = { inset: 0.2 }

export function printPlaneSize() {
  return { w: CARD.w - PRINT.inset * 2, h: CARD.h - PRINT.inset * 2 }
}

export function cardToCanvas(x: number, y: number, W: number, H: number) {
  const pw = CARD.w - PRINT.inset * 2
  const ph = CARD.h - PRINT.inset * 2
  const u = (x + CARD.w / 2 - PRINT.inset) / pw
  const v = (y + CARD.h / 2 - PRINT.inset) / ph
  return { x: u * W, y: (1 - v) * H, s: W / pw }
}

/** Front-face artwork for the hero: wordmark, Earth, initials, micro-type. */
export function drawHeroPrint(ctx: CanvasRenderingContext2D, W: number, H: number, earth: CanvasImageSource | null) {
  ctx.clearRect(0, 0, W, H)
  const at = (x: number, y: number) => cardToCanvas(x, y, W, H)

  const word = at(-2.05, 1.28)
  ctx.font = `500 ${0.56 * word.s}px Geist, "Schibsted Grotesk", sans-serif`
  ctx.fillStyle = 'rgba(214, 215, 219, 0.94)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Mission', word.x, word.y)

  if (earth) {
    const e = at(2.68, 1.46)
    const r = 0.5 * e.s
    ctx.save()
    ctx.beginPath()
    ctx.arc(e.x, e.y, r, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(earth, e.x - r, e.y - r, r * 2, r * 2)
    ctx.restore()
    ctx.beginPath()
    ctx.arc(e.x, e.y, r, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.lineWidth = Math.max(1.25, e.s * 0.018)
    ctx.stroke()
  }

  const db = at(2.85, -1.38)
  ctx.font = `500 ${0.74 * db.s}px Geist, "Schibsted Grotesk", sans-serif`
  ctx.fillStyle = 'rgba(206, 207, 212, 0.92)'
  ctx.textAlign = 'center'
  ctx.fillText('DB', db.x, db.y)

  const micro = at(3.45, -2.18)
  ctx.font = `500 ${0.105 * micro.s}px "Geist Mono", ui-monospace, monospace`
  ctx.fillStyle = 'rgba(176, 177, 182, 0.8)'
  ctx.textAlign = 'right'
  ctx.fillText('MS-01', micro.x, micro.y)

  // engraved seat for the status light, top-right corner
  const led = at(3.58, 2.12)
  ctx.beginPath()
  ctx.arc(led.x, led.y, 0.11 * led.s, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(230, 236, 244, 0.35)'
  ctx.lineWidth = Math.max(1, led.s * 0.02)
  ctx.stroke()
}
