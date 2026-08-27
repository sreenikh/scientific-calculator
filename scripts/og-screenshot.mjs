/**
 * Two-panel og-image generator.
 *
 * Left  – main calculator: history strip + golden-ratio in textbook MATH mode
 * Right – 3D sin(x)·cos(y) surface with viridis colormap
 *
 * Run: npm install playwright (temp), then node scripts/og-screenshot.mjs
 */

import { chromium } from 'playwright'
import { execSync }  from 'child_process'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT       = resolve(__dirname, '../public/og-image.png')
const LEFT_TMP  = '/tmp/og-left.png'
const RIGHT_TMP = '/tmp/og-right.png'

// ── helpers ──────────────────────────────────────────────────────────────────

async function setExpr(page, latex) {
  await page.evaluate(ltx => {
    const mf = document.querySelector('math-field')
    mf.setValue(ltx)
    mf.dispatchEvent(new Event('input', { bubbles: true }))
  }, latex)
  await page.waitForTimeout(400)
}

async function pressEquals(page) {
  await page.click('button:has-text("=")')
  await page.waitForTimeout(500)
}

// Wait for the result line to show a specific substring
async function waitForResult(page, substring, timeout = 5000) {
  await page.waitForFunction(
    sub => {
      const el = document.querySelector('.result-val, .screen-result, [class*="result"]')
      return el && el.textContent.includes(sub)
    },
    substring,
    { timeout }
  ).catch(() => {})
  await page.waitForTimeout(300)
}

// ── browser setup ─────────────────────────────────────────────────────────────

const browser = await chromium.launch({ headless: false, args: ['--enable-webgl'] })
const page    = await browser.newPage()
await page.setViewportSize({ width: 1200, height: 630 })
await page.goto('http://localhost:5173/scientific-calculator/', { waitUntil: 'networkidle' })

// Switch DEG → RAD
await page.waitForSelector('button:has-text("DRG")', { timeout: 10000 })
await page.click('button:has-text("DRG")')
await page.waitForTimeout(300)

// Measure device for clipping
const deviceBox = await page.locator('.device').first().boundingBox()
const clip = { x: Math.round(deviceBox.x), y: 0,
               width: Math.round(deviceBox.width), height: 630 }
console.log('Device clip:', clip)

// ── LEFT PANEL ────────────────────────────────────────────────────────────────

// Build up history strip: three quick evaluations
await setExpr(page, '\\sin\\left(\\frac{\\pi}{3}\\right)')
await pressEquals(page)

await setExpr(page, '\\operatorname{nCr}\\left(10,3\\right)')
await pressEquals(page)

await setExpr(page, '10!')
await pressEquals(page)

// Hero expression: golden ratio as a typeset fraction
await setExpr(page, '\\frac{1+\\sqrt{5}}{2}')
// Press = so the result updates from the current expression, not the previous
await pressEquals(page)
// Wait for result to show the golden-ratio digits
await page.waitForTimeout(600)

await page.screenshot({ path: LEFT_TMP, clip })
console.log('Left panel saved')

// ── RIGHT PANEL: 3D graph ─────────────────────────────────────────────────────

await page.click('button:has-text("GRAPH")')
await page.waitForSelector('.graph-dim-btn', { timeout: 5000 })
await page.click('.graph-dim-btn:has-text("3D")')
await page.waitForSelector('.graph3d-canvas', { timeout: 8000 })

// Window: -4..4 for clear wave peaks
const winInputs = page.locator('input.tbl-num')
await winInputs.nth(0).fill('-4')
await winInputs.nth(1).fill('4')
await winInputs.nth(2).fill('-4')
await winInputs.nth(3).fill('4')

await page.click('button.ov-close.tbl-go')
await page.waitForSelector('.graph3d-computing', { timeout: 10000 }).catch(() => {})
await page.waitForFunction(() => !document.querySelector('.graph3d-computing'), { timeout: 20000 })
await page.waitForTimeout(1200)

// Rotate to a nice 3/4 view
const canvas = page.locator('.graph3d-canvas')
const cBox   = await canvas.boundingBox()
const cx = cBox.x + cBox.width  / 2
const cy = cBox.y + cBox.height / 2

await page.mouse.move(cx, cy)
await page.mouse.down()
await page.mouse.move(cx - 60, cy + 130, { steps: 30 })
await page.mouse.up()
await page.waitForTimeout(600)
await page.mouse.move(cx - 60, cy + 130)
await page.mouse.down()
await page.mouse.move(cx + 20, cy + 130, { steps: 20 })
await page.mouse.up()
await page.waitForTimeout(2500)

await page.screenshot({ path: RIGHT_TMP, clip })
console.log('Right panel saved')

await browser.close()

// ── STITCH with Python PIL ────────────────────────────────────────────────────

const py = `
from PIL import Image, ImageDraw
left  = Image.open('${LEFT_TMP}')
right = Image.open('${RIGHT_TMP}')
left  = left.resize((600, 630),  Image.LANCZOS)
right = right.resize((600, 630), Image.LANCZOS)
out = Image.new('RGB', (1200, 630))
out.paste(left,  (0,   0))
out.paste(right, (600, 0))
# Thin separator line between panels
draw = ImageDraw.Draw(out)
draw.line([(600, 0), (600, 630)], fill=(55, 65, 80), width=2)
out.save('${OUT}')
print('Composite saved')
`

writeFileSync('/tmp/og-stitch.py', py)
console.log(execSync('python3 /tmp/og-stitch.py').toString().trim())
console.log('Done:', OUT)
