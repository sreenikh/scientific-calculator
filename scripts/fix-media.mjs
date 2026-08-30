/**
 * Fix three media assets:
 *   1. textbook-input.gif  - use golden ratio (1+√5)/2 which evaluates cleanly
 *   2. 3d-surface.gif/.mp4 - use headless:false (real GPU) with explicit wave surface
 *   3. arch-diagram.png    - light/neutral color scheme
 *   4. fx991es composite   - side-by-side Casio photo + GraphN² screenshot
 */

import { chromium }        from 'playwright'
import { execSync }        from 'child_process'
import { writeFileSync, copyFileSync, readFileSync } from 'fs'
import { fileURLToPath }   from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dirname, '..')
const MEDIA = resolve(ROOT, 'docs/journal/media')
const BASE  = 'http://localhost:5176'

// ── helpers ───────────────────────────────────────────────────────────────────

async function setExpr(page, latex) {
  await page.evaluate(ltx => {
    const mf = document.querySelector('math-field')
    mf.setValue(ltx)
    mf.dispatchEvent(new Event('input', { bubbles: true }))
  }, latex)
  await page.waitForTimeout(350)
}

async function pressEquals(page) {
  await page.click('button:has-text("=")')
  await page.waitForTimeout(600)
}

async function clearCalc(page) {
  await page.click('button:has-text("AC")')
  await page.waitForTimeout(200)
}

function saveGif(frames, outPath, durationMs = 100) {
  const tmpDir = `/tmp/gif_${Date.now()}`
  execSync(`mkdir -p ${tmpDir}`)
  frames.forEach((buf, i) => {
    writeFileSync(`${tmpDir}/frame${String(i).padStart(4,'0')}.png`, buf)
  })
  const py = `
from PIL import Image
import glob
files = sorted(glob.glob('${tmpDir}/frame*.png'))
imgs = [Image.open(f).convert('RGBA') for f in files]
w, h = imgs[0].size
tw = min(700, w); th = int(h * tw / w)
imgs = [img.resize((tw, th), Image.LANCZOS) for img in imgs]
imgs[0].save('${outPath}', save_all=True, append_images=imgs[1:],
    duration=${durationMs}, loop=0, optimize=True)
print(f'GIF: {len(imgs)} frames -> ${outPath}')
`
  writeFileSync(`${tmpDir}/make.py`, py)
  console.log(execSync(`python3 ${tmpDir}/make.py`).toString().trim())
  execSync(`rm -rf ${tmpDir}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1: textbook-input.gif — golden ratio (1+√5)/2
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[1/4] Fixing textbook-input.gif...')
{
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 480, height: 900 })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('math-field', { timeout: 10000 })
  await page.waitForTimeout(600)

  const frames = []

  // Start clean
  await clearCalc(page)
  for (let i = 0; i < 5; i++) frames.push(await page.screenshot())

  // Progressive build of (1+√5)/2
  const steps = [
    '\\frac{}{2}',
    '\\frac{1}{2}',
    '\\frac{1+}{2}',
    '\\frac{1+\\sqrt{\\placeholder{}}}{2}',
    '\\frac{1+\\sqrt{5}}{2}',
  ]

  for (const latex of steps) {
    await setExpr(page, latex)
    for (let i = 0; i < 3; i++) frames.push(await page.screenshot())
    await page.waitForTimeout(80)
  }

  // Hold on complete expression
  await setExpr(page, '\\frac{1+\\sqrt{5}}{2}')
  for (let i = 0; i < 8; i++) frames.push(await page.screenshot())

  // Press = and show 1.618033...
  await pressEquals(page)
  for (let i = 0; i < 10; i++) frames.push(await page.screenshot())

  saveGif(frames, resolve(MEDIA, 'textbook-input.gif'), 110)
  await browser.close()
  console.log('Saved textbook-input.gif')
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2: 3D surface — headless:false, real GPU, explicit wave surface
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[2/4] Fixing 3D surface (headless:false for WebGL)...')
{
  const browser = await chromium.launch({
    headless: false,
    args: ['--enable-webgl', '--enable-accelerated-2d-canvas', '--ignore-gpu-blocklist']
  })

  // ── Video recording ──
  const context = await browser.newContext({
    viewport: { width: 900, height: 750 },
    recordVideo: { dir: '/tmp/pw-3d/', size: { width: 900, height: 750 } }
  })
  const page = await context.newPage()

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('math-field', { timeout: 10000 })
  await page.waitForTimeout(800)

  // Open GRAPH panel
  await page.click('button:has-text("GRAPH")')
  await page.waitForTimeout(800)

  // Switch to 3D
  try {
    await page.click('.graph-dim-btn:has-text("3D")', { timeout: 3000 })
  } catch {
    await page.click('button:has-text("3D")', { timeout: 3000 })
  }
  await page.waitForTimeout(1000)

  // Enter an explicit wave surface: sin(sqrt(x^2+y^2))
  // This is visually stunning with viridis and definitely renders
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('.overlay input, .graph-panel input, .graph3d-panel input')
    const fnInput = Array.from(inputs).find(el => el.closest('.fn-row') || el.closest('.graph3d-fn'))
    const first = fnInput || inputs[0]
    if (first) {
      first.value = 'sin(sqrt(x^2+y^2))'
      first.dispatchEvent(new Event('input', { bubbles: true }))
      first.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })
  await page.waitForTimeout(400)

  // Set window to -8..8 for nice wave pattern
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input.tbl-num')
    const vals = ['-8','8','-8','8','-3','3']
    inputs.forEach((el, i) => { if (i < vals.length) { el.value = vals[i]; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})) }})
  })
  await page.waitForTimeout(300)

  // Click Plot button
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button')
    const plot = Array.from(btns).find(b => /^plot$/i.test(b.textContent.trim()))
    if (plot) plot.click()
  })

  // Wait for surface to render (up to 20s)
  await page.waitForTimeout(2000)
  try {
    await page.waitForFunction(() => !document.querySelector('.graph3d-computing'), { timeout: 20000 })
  } catch {}
  await page.waitForTimeout(2500)

  // Verify something is rendered - take a diagnostic screenshot
  await page.screenshot({ path: '/tmp/3d-check.png' })

  // Orbit: slow, cinematic rotation sequence (~15 seconds total)
  const canvas = page.locator('canvas').last()
  const cBox = await canvas.boundingBox()

  if (cBox) {
    const cx = cBox.x + cBox.width / 2
    const cy = cBox.y + cBox.height / 2

    // Start from a nice viewing angle
    await page.mouse.move(cx, cy)
    await page.waitForTimeout(300)

    // Initial positioning drag
    await page.mouse.down()
    await page.mouse.move(cx - 100, cy + 50, { steps: 40 })
    await page.mouse.up()
    await page.waitForTimeout(600)

    // Slow continuous rotation — 4 full sweeps
    const rotations = [
      { dx: -80, dy: 0,   steps: 60, wait: 500 },
      { dx: -80, dy: 20,  steps: 60, wait: 500 },
      { dx: -80, dy: -20, steps: 60, wait: 500 },
      { dx: -80, dy: 0,   steps: 60, wait: 500 },
      { dx: -60, dy: 30,  steps: 50, wait: 400 },
      { dx: -60, dy: 0,   steps: 50, wait: 400 },
    ]

    let curX = cx - 100, curY = cy + 50
    for (const { dx, dy, steps, wait } of rotations) {
      await page.mouse.down()
      await page.mouse.move(curX + dx, curY + dy, { steps })
      curX += dx; curY += dy
      await page.mouse.up()
      await page.waitForTimeout(wait)
    }

    // Extra hold for video end
    await page.waitForTimeout(1500)
  } else {
    console.log('Warning: canvas not found, recording empty scene')
    await page.waitForTimeout(10000)
  }

  await context.close()

  const videoFile = execSync('ls -t /tmp/pw-3d/*.webm 2>/dev/null | head -1').toString().trim()
  if (videoFile) {
    const mp4 = resolve(MEDIA, '3d-surface.mp4')
    const gif = resolve(MEDIA, '3d-surface.gif')

    execSync(`ffmpeg -y -i "${videoFile}" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -movflags +faststart "${mp4}" 2>/dev/null`)
    console.log('Saved 3d-surface.mp4')

    execSync(`ffmpeg -y -i "${videoFile}" -vf "fps=10,scale=700:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" "${gif}" 2>/dev/null`)
    console.log('Saved 3d-surface.gif')
  } else {
    console.log('ERROR: no video file found')
  }

  await browser.close()
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 3: arch-diagram — light neutral theme (white bg, colored nodes)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[3/4] Fixing arch-diagram.png (light theme)...')
{
  const archContent = readFileSync(resolve(ROOT, 'docs/architecture.md'), 'utf8')
  const archTmp = '/tmp/arch-light.mmd'
  const match = archContent.match(/```mermaid\n([\s\S]*?)\n```/)
  if (match) writeFileSync(archTmp, match[1])

  try {
    execSync(
      `npx --yes @mermaid-js/mermaid-cli -i ${archTmp} -o ${resolve(MEDIA, 'arch-diagram.png')} -b "white" -t neutral --width 1400 2>/dev/null`,
      { stdio: 'pipe' }
    )
    console.log('Rendered arch-diagram.png with neutral/light theme')
  } catch (e) {
    console.log('mmdc neutral failed, trying default theme:', e.message?.slice(0, 60))
    try {
      execSync(
        `npx --yes @mermaid-js/mermaid-cli -i ${archTmp} -o ${resolve(MEDIA, 'arch-diagram.png')} -b "#f6f8fa" -t default --width 1400 2>/dev/null`,
        { stdio: 'pipe' }
      )
      console.log('Rendered arch-diagram.png with default/light theme')
    } catch (e2) {
      console.log('Both mmdc attempts failed:', e2.message?.slice(0, 60))
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 4: fx991es composite — Casio image + GraphN² screenshot side by side
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[4/4] Creating fx991es-and-graphn2.jpg composite...')
{
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 480, height: 860 })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('math-field', { timeout: 10000 })
  await page.waitForTimeout(600)

  // Set a nice expression showing the calculator in use
  await page.evaluate(() => {
    const mf = document.querySelector('math-field')
    mf.setValue('\\frac{1+\\sqrt{5}}{2}')
    mf.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await page.waitForTimeout(300)
  await page.click('button:has-text("=")')
  await page.waitForTimeout(500)

  const appScreenshot = await page.screenshot({ type: 'png' })
  writeFileSync('/tmp/graphn2-screenshot.png', appScreenshot)
  await browser.close()

  // Composite with Python PIL
  const py = `
from PIL import Image, ImageDraw, ImageFont

casio = Image.open('/tmp/casio-fx991es.png').convert('RGBA')
app   = Image.open('/tmp/graphn2-screenshot.png').convert('RGBA')

# Target height: 900px
TARGET_H = 900
PADDING  = 40
GAP      = 48
LABEL_H  = 0

# Scale each image to target height
def scale_to_height(img, h):
    ratio = h / img.height
    return img.resize((int(img.width * ratio), h), Image.LANCZOS)

casio_s = scale_to_height(casio, TARGET_H)
app_s   = scale_to_height(app,   TARGET_H)

total_w = PADDING + casio_s.width + GAP + app_s.width + PADDING
total_h = PADDING + TARGET_H + PADDING

out = Image.new('RGB', (total_w, total_h), (18, 18, 30))

# Paste images
casio_x = PADDING
app_x   = PADDING + casio_s.width + GAP

# Convert RGBA to RGB for compositing
bg = Image.new('RGB', casio_s.size, (18, 18, 30))
bg.paste(casio_s, mask=casio_s.split()[3])
out.paste(bg, (casio_x, PADDING))

bg2 = Image.new('RGB', app_s.size, (18, 18, 30))
bg2.paste(app_s, mask=app_s.split()[3])
out.paste(bg2, (app_x, PADDING))

# Thin separator line between the two
draw = ImageDraw.Draw(out)
mid_x = PADDING + casio_s.width + GAP // 2
draw.line([(mid_x, PADDING + 40), (mid_x, PADDING + TARGET_H - 40)], fill=(60, 60, 80), width=1)

out.save('/tmp/fx991es-composite.jpg', quality=92)
print(f'Composite size: {out.size}')
`
  writeFileSync('/tmp/make_composite.py', py)
  const result = execSync('python3 /tmp/make_composite.py').toString().trim()
  console.log(result)
  execSync(`cp /tmp/fx991es-composite.jpg ${resolve(MEDIA, 'fx991es-and-graphn2.jpg')}`)
  console.log('Saved fx991es-and-graphn2.jpg')
}

console.log('\nAll fixes complete.')
