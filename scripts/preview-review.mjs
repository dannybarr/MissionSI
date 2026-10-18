import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const out = new URL('../../artifacts/product-preview/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] })
const errors = []
const scenarios = [
  ['desktop', 1440, 960, 'no-preference'],
  ['mobile', 390, 844, 'no-preference'],
  ['reduced', 390, 844, 'reduce'],
]
for (const [label, width, height, reducedMotion] of scenarios.filter(([label]) => !process.argv[2] || process.argv[2] === label)) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion })
  page.on('pageerror', error => { errors.push(`${label}: ${error.message}`); console.log('PAGE ERROR', error.message) })
  page.on('console', message => { if (message.type() === 'error') console.log('CONSOLE ERROR', message.text()) })
  await page.goto('http://127.0.0.1:5180', { waitUntil: 'networkidle', timeout: 120000 })
  if (label !== 'reduced') await page.waitForSelector('.opening.is-ready', { timeout: 30000 }).catch(async () => {
    console.log('SCENE NOT READY', await page.locator('body').innerText())
    await page.screenshot({ path: `${out}/${label}-failure.png` })
  })
  await page.waitForTimeout(2200)
  for (const [name, progress] of label === 'reduced' ? [['hero', 0]] : [['hero', 0], ['front', 0.2], ['edge', 0.37], ['connected', 0.59], ['tray', 1]]) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), height * (width < 760 ? 3.2 : 3.8) * progress)
    await page.waitForTimeout(1300)
    await page.screenshot({ path: `${out}/${label}-${name}.png` })
  }
  console.log(label, await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, title: document.title, canvases: document.querySelectorAll('canvas').length })))
  await page.close()
}
console.log(JSON.stringify({ errors }, null, 2))
await browser.close()
