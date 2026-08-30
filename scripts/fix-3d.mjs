/**
 * Retake 3D surface video/GIF:
 * - Torus implicit surface: (sqrt(x^2+y^2)-2)^2+z^2-1
 * - Matches article alt text: "torus rendered via marching cubes in WebGL"
 * - No angle-mode dependency; visually striking
 */
import { chromium }   from 'playwright'
import { execSync }   from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync }  from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dirname, '..')
const MEDIA = resolve(ROOT, 'docs/journal/media')

mkdirSync('/tmp/pw-3d2', { recursive: true })

const browser = await chromium.launch({
  headless: false,
  args: ['--enable-webgl', '--enable-accelerated-2d-canvas', '--ignore-gpu-blocklist']
})

const context = await browser.newContext({
  viewport: { width: 900, height: 780 },
  recordVideo: { dir: '/tmp/pw-3d2/', size: { width: 900, height: 780 } }
})
const page = await context.newPage()

await page.goto('http://localhost:5176', { waitUntil: 'networkidle' })
await page.waitForSelector('math-field', { timeout: 10000 })
await page.waitForTimeout(800)

// Open GRAPH, switch to 3D
await page.click('button:has-text("GRAPH")')
await page.waitForTimeout(800)
try {
  await page.click('.graph-dim-btn:has-text("3D")', { timeout: 3000 })
} catch {
  await page.click('button:has-text("3D")', { timeout: 3000 })
}
await page.waitForTimeout(1200)

// Focus function input and type torus implicit surface
await page.evaluate(() => {
  const allInputs = Array.from(document.querySelectorAll('input'))
  const fn = allInputs.find(el => {
    const style = window.getComputedStyle(el)
    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 100
  })
  if (fn) {
    fn.focus()
    fn.select()
    fn.value = ''
    fn.dispatchEvent(new Event('input', { bubbles: true }))
  }
})
await page.waitForTimeout(200)

// Torus: (sqrt(x^2+y^2)-2)^2+z^2-1 = 0
// Major radius 2, minor radius 1 — window must include z
await page.keyboard.type('(sqrt(x^2+y^2)-2)^2+z^2-1', { delay: 30 })
await page.waitForTimeout(400)

// Set window to -4..4 x,y and -2..2 z to capture full torus
await page.evaluate(() => {
  const vals = ['-4', '4', '-4', '4', '-2', '2']
  const tblNums = Array.from(document.querySelectorAll('input.tbl-num'))
  const numInputs = Array.from(document.querySelectorAll('input'))
    .filter(el => {
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && el.offsetWidth < 80 && el.offsetWidth > 0
    })
  const targets = tblNums.length > 0 ? tblNums : numInputs
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  targets.forEach((el, i) => {
    if (i < vals.length) {
      nativeSetter.call(el, vals[i])
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })
})
await page.waitForTimeout(300)

// Click Plot
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'))
  const plot = btns.find(b => /^plot$/i.test(b.textContent.trim()))
  if (plot) plot.click()
})

// Marching cubes takes longer — wait up to 30s
await page.waitForTimeout(4000)
try {
  await page.waitForFunction(() => !document.querySelector('.graph3d-computing'), { timeout: 30000 })
} catch {}
await page.waitForTimeout(3000)

await page.screenshot({ path: '/tmp/3d-check2.png' })
console.log('Saved diagnostic screenshot')

// Camera positioning
const canvas = page.locator('canvas').last()
const cBox = await canvas.boundingBox()
console.log('Canvas:', JSON.stringify(cBox))

const cx = cBox ? cBox.x + cBox.width / 2  : 450
const cy = cBox ? cBox.y + cBox.height / 2 : 500

// Initial tilt to 3/4 view
await page.mouse.move(cx, cy)
await page.waitForTimeout(300)
await page.mouse.down()
await page.mouse.move(cx - 70, cy + 50, { steps: 40 })
await page.mouse.up()
await page.waitForTimeout(600)

await page.screenshot({ path: '/tmp/3d-check3.png' })
console.log('Saved post-tilt screenshot')

// Slow cinematic rotation
const sweeps = [
  { fromX: cx - 70,  fromY: cy + 50,  toX: cx - 150, toY: cy + 40,  steps: 60 },
  { fromX: cx - 150, fromY: cy + 40,  toX: cx - 230, toY: cy + 65,  steps: 60 },
  { fromX: cx - 230, fromY: cy + 65,  toX: cx - 310, toY: cy + 45,  steps: 60 },
  { fromX: cx - 310, fromY: cy + 45,  toX: cx - 390, toY: cy + 70,  steps: 60 },
  { fromX: cx - 390, fromY: cy + 70,  toX: cx - 470, toY: cy + 50,  steps: 60 },
  { fromX: cx - 470, fromY: cy + 50,  toX: cx - 550, toY: cy + 40,  steps: 60 },
]

for (const { fromX, fromY, toX, toY, steps } of sweeps) {
  await page.mouse.move(fromX, fromY)
  await page.mouse.down()
  await page.mouse.move(toX, toY, { steps })
  await page.mouse.up()
  await page.waitForTimeout(350)
}

await page.waitForTimeout(2000)
await context.close()

const videoFile = execSync('ls -t /tmp/pw-3d2/*.webm 2>/dev/null | head -1').toString().trim()
if (videoFile) {
  console.log('Video file:', videoFile)
  const mp4 = resolve(MEDIA, '3d-surface.mp4')
  const gif = resolve(MEDIA, '3d-surface.gif')
  execSync(`ffmpeg -y -i "${videoFile}" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -preset fast -crf 16 -pix_fmt yuv420p -movflags +faststart "${mp4}" 2>/dev/null`)
  console.log('Saved 3d-surface.mp4')
  execSync(`ffmpeg -y -i "${videoFile}" -vf "fps=10,scale=700:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" "${gif}" 2>/dev/null`)
  console.log('Saved 3d-surface.gif')
} else {
  console.log('ERROR: no video file')
}

await browser.close()
console.log('Done.')
