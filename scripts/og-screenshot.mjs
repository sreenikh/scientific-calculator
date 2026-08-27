import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../public/og-image.png')

const browser = await chromium.launch({ headless: false, args: ['--enable-webgl'] })
const page = await browser.newPage()

await page.setViewportSize({ width: 1200, height: 630 })
await page.goto('http://localhost:5173/scientific-calculator/', { waitUntil: 'networkidle' })

// Switch to RAD mode so sin/cos use radians
await page.waitForSelector('button:has-text("DRG")', { timeout: 10000 })
await page.click('button:has-text("DRG")')  // DEG → RAD

// Open graph panel
await page.click('button:has-text("GRAPH")')

// Switch to 3D
await page.waitForSelector('.graph-dim-btn', { timeout: 5000 })
await page.click('.graph-dim-btn:has-text("3D")')
await page.waitForSelector('.graph3d-canvas', { timeout: 8000 })

// Set window: smaller x/y range for more visible waves, keep default z
const inputs = page.locator('input.tbl-num')
// GraphPanel3D window order: xmin, xmax, ymin, ymax, zmin, zmax
await inputs.nth(0).fill('-4')   // xmin
await inputs.nth(1).fill('4')    // xmax
await inputs.nth(2).fill('-4')   // ymin
await inputs.nth(3).fill('4')    // ymax

// Plot
await page.click('button.ov-close.tbl-go')
await page.waitForSelector('.graph3d-computing', { timeout: 10000 }).catch(() => {})
await page.waitForFunction(() => !document.querySelector('.graph3d-computing'), { timeout: 20000 })
await page.waitForTimeout(1200)

// Rotate camera: tilt up for a good 3/4 view
const canvas = page.locator('.graph3d-canvas')
const box = await canvas.boundingBox()
const cx = box.x + box.width / 2
const cy = box.y + box.height / 2

await page.mouse.move(cx, cy)
await page.mouse.down()
await page.mouse.move(cx - 60, cy + 130, { steps: 30 })
await page.mouse.up()
await page.waitForTimeout(800)

// Slight azimuth rotation
await page.mouse.move(cx - 60, cy + 130)
await page.mouse.down()
await page.mouse.move(cx + 20, cy + 130, { steps: 20 })
await page.mouse.up()

// Let damping settle and frames render
await page.waitForTimeout(2500)

await page.screenshot({ path: OUT })
console.log('Saved:', OUT)

await browser.close()
