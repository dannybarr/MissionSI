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

export interface ArtItem {
  kind: 'word' | 'initials' | 'earth' | 'etch'
  x: number
  y: number
  w: number
  h: number
  text?: string
  svg?: string
}

const etchCache = new Map<string, HTMLImageElement>()
let onEtchReady = () => {}
export function setEtchReady(fn: () => void) {
  onEtchReady = fn
}

function etchImage(svg: string) {
  const tinted = svg.replace(/currentColor/g, '#d5d6da')
  const hit = etchCache.get(tinted)
  if (hit) return hit
  const img = new Image()
  img.onload = () => onEtchReady()
  img.src = URL.createObjectURL(new Blob([tinted], { type: 'image/svg+xml' }))
  etchCache.set(tinted, img)
  return img
}

/** Marks printed on the card face. Coordinates are centimetres from centre, +x right, +y up. */
export function drawCardArt(ctx: CanvasRenderingContext2D, W: number, H: number, items: ArtItem[], earth: CanvasImageSource | null) {
  ctx.clearRect(0, 0, W, H)
  for (const item of items) {
    const at = cardToCanvas(item.x, item.y, W, H)
    if (item.kind === 'earth' && earth) {
      const r = (item.w / 2) * at.s
      ctx.save()
      ctx.beginPath()
      ctx.arc(at.x, at.y, r, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(earth, at.x - r, at.y - r, r * 2, r * 2)
      ctx.restore()
      ctx.beginPath()
      ctx.arc(at.x, at.y, r, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'
      ctx.lineWidth = Math.max(1, at.s * 0.012)
      ctx.stroke()
    } else if (item.kind === 'word' || item.kind === 'initials') {
      ctx.font = `500 ${item.h * 0.78 * at.s}px Geist, "Schibsted Grotesk", sans-serif`
      ctx.fillStyle = 'rgba(214, 215, 219, 0.94)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(item.text ?? '', at.x, at.y)
    } else if (item.kind === 'etch' && item.svg) {
      const img = etchImage(item.svg)
      if (img.complete && img.naturalWidth) {
        const w = item.w * at.s
        const h = item.h * at.s
        ctx.save()
        ctx.globalAlpha = 0.9
        ctx.drawImage(img, at.x - w / 2, at.y - h / 2, w, h)
        ctx.restore()
      }
    }
  }
}

/** Front-face artwork for the hero: wordmark, Earth, initials, micro-type. */
export function drawHeroPrint(ctx: CanvasRenderingContext2D, W: number, H: number, earth: CanvasImageSource | null) {
  ctx.clearRect(0, 0, W, H)
  const at = (x: number, y: number) => cardToCanvas(x, y, W, H)

  const word = at(-2.2, 1.35)
  ctx.font = `500 ${0.46 * word.s}px Geist, "Schibsted Grotesk", sans-serif`
  ctx.fillStyle = 'rgba(214, 215, 219, 0.94)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Mission', word.x, word.y)

  if (earth) {
    const e = at(2.99, 1.52)
    const r = 0.56 * e.s
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

  const db = at(2.95, -1.5)
  ctx.font = `500 ${0.58 * db.s}px Geist, "Schibsted Grotesk", sans-serif`
  ctx.fillStyle = 'rgba(206, 207, 212, 0.92)'
  ctx.textAlign = 'center'
  ctx.fillText('DB', db.x, db.y)

  const micro = at(2.95, -2.05)
  ctx.font = `500 ${0.13 * micro.s}px "Geist Mono", ui-monospace, monospace`
  ctx.fillStyle = 'rgba(190, 191, 196, 0.8)'
  ctx.textAlign = 'center'
  ctx.letterSpacing = `${0.14 * micro.s}px`
  ctx.fillText('MS-01', micro.x, micro.y)
  ctx.letterSpacing = '0px'
}
