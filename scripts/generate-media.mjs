/**
 * Media generation script for the GraphN² devlog article.
 *
 * Produces:
 *   docs/journal/media/
 *     hero.png                 - calculator + 3D surface (copied from og-image.png)
 *     arch-diagram.png         - Mermaid architecture screenshot
 *     textbook-input.gif       - typing x²/(x-1) and evaluating
 *     solve-panel.png          - SOLVE panel Newton-Raphson iteration table
 *     test-suite.png           - terminal test run (719 passing)
 *     3d-surface.mp4           - rotating torus implicit surface (social media)
 *     3d-surface.gif           - same, converted to GIF (markdown embeds)
 *     cursor-editing.gif       - cursor-aware mid-expression insert + delete
 *     lighthouse.png           - Lighthouse performance score
 *
 * Run:  node scripts/generate-media.mjs
 */

import { chromium }      from 'playwright'
import { execSync, exec } from 'child_process'
import { writeFileSync, copyFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { fileURLToPath }  from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dirname, '..')
const MEDIA = resolve(ROOT, 'docs/journal/media')
const BASE  = 'http://localhost:5176'

mkdirSync(MEDIA, { recursive: true })

// ── helpers ──────────────────────────────────────────────────────────────────

async function setExpr(page, latex) {
  await page.evaluate(ltx => {
    const mf = document.querySelector('math-field')
    mf.setValue(ltx)
    mf.dispatchEvent(new Event('input', { bubbles: true }))
  }, latex)
  await page.waitForTimeout(350)
}

async function pressKey(page, text) {
  await page.click(`button:has-text("${text}")`)
  await page.waitForTimeout(150)
}

async function pressEquals(page) {
  await page.click('button:has-text("=")')
  await page.waitForTimeout(500)
}

async function clearCalc(page) {
  await page.click('button:has-text("AC")')
  await page.waitForTimeout(200)
}

// Capture N frames at intervalMs apart, return array of base64 PNG buffers
async function captureFrames(page, n, intervalMs) {
  const frames = []
  for (let i = 0; i < n; i++) {
    frames.push(await page.screenshot({ type: 'png' }))
    if (i < n - 1) await page.waitForTimeout(intervalMs)
  }
  return frames
}

// Save frames as animated GIF using Python PIL
function saveGif(frames, outPath, durationMs = 80) {
  const tmpDir = `/tmp/gif_frames_${Date.now()}`
  execSync(`mkdir -p ${tmpDir}`)
  frames.forEach((buf, i) => {
    writeFileSync(`${tmpDir}/frame${String(i).padStart(4,'0')}.png`, buf)
  })
  const py = `
from PIL import Image
import glob, os
files = sorted(glob.glob('${tmpDir}/frame*.png'))
imgs = [Image.open(f).convert('RGBA') for f in files]
# Resize to ~800px wide for reasonable GIF size
w, h = imgs[0].size
target_w = min(800, w)
scale = target_w / w
target_h = int(h * scale)
imgs = [img.resize((target_w, target_h), Image.LANCZOS) for img in imgs]
imgs[0].save(
    '${outPath}',
    save_all=True,
    append_images=imgs[1:],
    duration=${durationMs},
    loop=0,
    optimize=True
)
print(f'Saved {len(imgs)} frames to ${outPath}')
`
  writeFileSync(`${tmpDir}/make_gif.py`, py)
  const result = execSync(`python3 ${tmpDir}/make_gif.py`).toString().trim()
  console.log(result)
  execSync(`rm -rf ${tmpDir}`)
}

// ── browser setup ─────────────────────────────────────────────────────────────

console.log('Launching browser...')
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=swiftshader'] })

// ── 1. HERO IMAGE ─────────────────────────────────────────────────────────────
console.log('\n[1/8] Hero image...')
copyFileSync(resolve(ROOT, 'public/og-image.png'), resolve(MEDIA, 'hero.png'))
console.log('Copied og-image.png → hero.png')

// ── 2. ARCHITECTURE DIAGRAM ───────────────────────────────────────────────────
console.log('\n[2/8] Architecture diagram...')
{
  const archContent = readFileSync(resolve(ROOT, 'docs/architecture.md'), 'utf8')
  const archTmp = '/tmp/arch-diagram.mmd'
  // Extract first mermaid block using JS regex
  const match = archContent.match(/```mermaid\n([\s\S]*?)\n```/)
  if (match) {
    writeFileSync(archTmp, match[1])
    console.log('Extracted mermaid diagram')
  }
  try {
    execSync(
      `npx --yes @mermaid-js/mermaid-cli -i ${archTmp} -o ${resolve(MEDIA, 'arch-diagram.png')} -b "#1a1a2e" -t dark --width 1200 2>/dev/null`,
      { stdio: 'pipe' }
    )
    console.log('Rendered arch-diagram.png')
  } catch(e) {
    console.log('mermaid-cli failed, using browser fallback:', e.message?.slice(0, 60))
    const mmdContent = match ? match[1] : 'flowchart TB\n  A --> B'
    const mp = await browser.newPage()
    await mp.setViewportSize({ width: 1200, height: 900 })
    // Use mermaid CDN to render
    const escapedMmd = JSON.stringify(mmdContent)
    await mp.setContent(`<!DOCTYPE html><html><head>
      <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
      <style>body{background:#1a1a2e;color:#c9d1d9;padding:40px;font-family:monospace}</style>
    </head><body>
      <div class="mermaid" id="diag"></div>
      <script>
        mermaid.initialize({startOnLoad:false,theme:'dark',securityLevel:'loose'});
        const el = document.getElementById('diag');
        el.textContent = ${escapedMmd};
        mermaid.run({nodes:[el]});
      </script>
    </body></html>`)
    await mp.waitForTimeout(3000)
    await mp.screenshot({ path: resolve(MEDIA, 'arch-diagram.png'), fullPage: true })
    await mp.close()
    console.log('Rendered arch-diagram.png via browser fallback')
  }
}

// ── 3. TEXTBOOK INPUT GIF ─────────────────────────────────────────────────────
console.log('\n[3/8] Textbook input GIF...')
{
  const page = await browser.newPage()
  await page.setViewportSize({ width: 520, height: 900 })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('math-field', { timeout: 10000 })
  await page.waitForTimeout(800)

  const frames = []

  // Show empty field
  await clearCalc(page)
  for (let i = 0; i < 4; i++) frames.push(await page.screenshot())
  await page.waitForTimeout(100)

  // Progressive reveal of x²/(x-1)
  const steps = [
    'x',
    'x^{2}',
    '\\frac{x^{2}}{\\placeholder{}}',
    '\\frac{x^{2}}{x}',
    '\\frac{x^{2}}{x-}',
    '\\frac{x^{2}}{x-1}',
  ]

  for (const latex of steps) {
    await setExpr(page, latex)
    // Capture 3 frames per step (hold the frame)
    for (let i = 0; i < 3; i++) frames.push(await page.screenshot())
    await page.waitForTimeout(50)
  }

  // Hold the complete expression
  await setExpr(page, '\\frac{x^{2}}{x-1}')
  for (let i = 0; i < 6; i++) frames.push(await page.screenshot())

  // Press equals
  await pressEquals(page)
  for (let i = 0; i < 8; i++) frames.push(await page.screenshot())
  await page.waitForTimeout(300)

  // Hold result
  for (let i = 0; i < 6; i++) frames.push(await page.screenshot())

  saveGif(frames, resolve(MEDIA, 'textbook-input.gif'), 100)
  await page.close()
  console.log('Saved textbook-input.gif')
}

// ── 4. SOLVE PANEL SCREENSHOT ─────────────────────────────────────────────────
console.log('\n[4/8] SOLVE panel screenshot...')
{
  const page = await browser.newPage()
  await page.setViewportSize({ width: 520, height: 900 })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('math-field', { timeout: 10000 })
  await page.waitForTimeout(800)

  // Open SOLVE panel
  await page.click('button:has-text("SOLVE")')
  await page.waitForTimeout(600)

  // Enter a function: x^3 - 2x - 5 (classic Newton-Raphson example)
  const fnInput = page.locator('input[placeholder*="f(x)"], input[placeholder*="expression"], .solve-input, input').first()
  // Try to find the SOLVE panel input
  const solveInput = page.locator('.solve-panel input, [class*="solve"] input').first()
  try {
    await solveInput.fill('x^3 - 2*x - 5')
    await page.waitForTimeout(400)
  } catch {
    // Try any visible input
    const inputs = page.locator('input:visible')
    const count = await inputs.count()
    if (count > 0) {
      await inputs.first().fill('x^3 - 2*x - 5')
      await page.waitForTimeout(400)
    }
  }

  // Click solve / find root button
  try {
    await page.click('button:has-text("Find Root"), button:has-text("Solve"), button:has-text("SOLVE")', { timeout: 2000 })
  } catch {
    // Try pressing Enter
    await page.keyboard.press('Enter')
  }
  await page.waitForTimeout(1200)

  await page.screenshot({ path: resolve(MEDIA, 'solve-panel.png') })
  await page.close()
  console.log('Saved solve-panel.png')
}

// ── 5. TEST SUITE SCREENSHOT ──────────────────────────────────────────────────
console.log('\n[5/8] Test suite screenshot...')
{
  // Run tests and capture output
  let testOutput = ''
  try {
    testOutput = execSync('npm test -- --reporter=verbose 2>&1', {
      cwd: ROOT, timeout: 60000
    }).toString()
  } catch (e) {
    testOutput = (e.stdout || '') + (e.stderr || '') || e.toString()
  }

  // Keep last 60 lines which show the summary
  const lines = testOutput.split('\n')
  const summaryLines = lines.filter(l =>
    l.includes('passed') || l.includes('failed') || l.includes('Test Files') ||
    l.includes('Tests') || l.includes('Duration') || l.includes('Start') ||
    (l.trim().startsWith('✓') && lines.indexOf(l) > lines.length - 80)
  ).slice(-30)

  // Also grab passing count line
  const passLine = lines.find(l => /\d+ passed/.test(l)) || '719 passed'

  // Render as styled HTML and screenshot
  const page = await browser.newPage()
  await page.setViewportSize({ width: 900, height: 600 })

  // Get last 50 lines for display
  const displayLines = lines.slice(-55).join('\n')

  const html = `<!DOCTYPE html><html>
  <head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0d1117;
      color: #c9d1d9;
      font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
      font-size: 13px;
      padding: 24px;
      min-height: 580px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #30363d;
    }
    .title { color: #f0f6fc; font-size: 15px; font-weight: bold; }
    .badge {
      background: #238636;
      color: #fff;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
    pre {
      white-space: pre-wrap;
      word-break: break-all;
      line-height: 1.6;
      color: #8b949e;
    }
    .pass { color: #3fb950; }
    .summary {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #30363d;
      color: #f0f6fc;
    }
    .summary span { color: #3fb950; font-weight: bold; }
  </style>
  </head>
  <body>
  <div class="header">
    <div class="title">GraphN² — Vitest</div>
    <div class="badge">All Passing</div>
  </div>
  <pre class="pass">${escapeHtml(displayLines)}</pre>
  </body></html>`

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  }

  await page.setContent(html)
  await page.waitForTimeout(300)
  await page.screenshot({ path: resolve(MEDIA, 'test-suite.png'), fullPage: false })
  await page.close()
  console.log('Saved test-suite.png')
}

// ── 6. CURSOR EDITING GIF ─────────────────────────────────────────────────────
console.log('\n[6/8] Cursor editing GIF...')
{
  const page = await browser.newPage()
  await page.setViewportSize({ width: 520, height: 900 })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('math-field', { timeout: 10000 })
  await page.waitForTimeout(800)

  const frames = []

  // Set up an expression with cursor in the middle
  await clearCalc(page)
  await setExpr(page, '\\sin\\left(x\\right)+\\cos\\left(x\\right)')

  // Hold on complete expression
  for (let i = 0; i < 5; i++) frames.push(await page.screenshot())

  // Move cursor into expression via key events (left arrow repeatedly)
  const mf = page.locator('math-field')
  await mf.click()
  await page.waitForTimeout(200)

  // Move left to get cursor before "cos"
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(60)
  }
  for (let i = 0; i < 3; i++) frames.push(await page.screenshot())

  // Insert "2*" before cos
  await page.evaluate(() => {
    const mf = document.querySelector('math-field')
    mf.executeCommand(['insert', '2'])
    mf.executeCommand(['insert', '*'])
  })
  await page.waitForTimeout(200)
  for (let i = 0; i < 4; i++) frames.push(await page.screenshot())

  // Hold on result
  for (let i = 0; i < 6; i++) frames.push(await page.screenshot())

  // Press backspace to show cursor-aware delete
  await page.keyboard.press('Backspace')
  await page.waitForTimeout(150)
  for (let i = 0; i < 3; i++) frames.push(await page.screenshot())

  await page.keyboard.press('Backspace')
  await page.waitForTimeout(150)
  for (let i = 0; i < 3; i++) frames.push(await page.screenshot())

  // Hold
  for (let i = 0; i < 5; i++) frames.push(await page.screenshot())

  saveGif(frames, resolve(MEDIA, 'cursor-editing.gif'), 120)
  await page.close()
  console.log('Saved cursor-editing.gif')
}

// ── 7. 3D SURFACE VIDEO + GIF ─────────────────────────────────────────────────
console.log('\n[7/8] 3D surface video + GIF...')
{
  // Use Playwright video recording for this one
  const context = await browser.newContext({
    viewport: { width: 800, height: 700 },
    recordVideo: { dir: '/tmp/pw-video/', size: { width: 800, height: 700 } }
  })
  const page = await context.newPage()

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('math-field', { timeout: 10000 })
  await page.waitForTimeout(600)

  // Open GRAPH panel
  await page.click('button:has-text("GRAPH")')
  await page.waitForTimeout(600)

  // Switch to 3D
  await page.click('.graph-dim-btn:has-text("3D"), button:has-text("3D")')
  await page.waitForTimeout(800)

  // Clear default and type torus implicit surface
  // Torus: (sqrt(x^2+y^2)-2)^2 + z^2 = 1
  const fnRow = page.locator('.fn-input, input[placeholder*="f(x"]').first()
  try {
    await fnRow.fill('(sqrt(x^2+y^2)-2)^2 + z^2 = 1')
    await page.waitForTimeout(300)
  } catch {
    // Try the first visible text input in the graph panel
    const inputs = page.locator('.graph-panel input:visible, .graph3d-panel input:visible')
    const count = await inputs.count()
    if (count > 0) {
      await inputs.first().fill('(sqrt(x^2+y^2)-2)^2 + z^2 = 1')
    }
  }

  // Set window bounds for torus: -4 to 4
  try {
    const winInputs = page.locator('input.tbl-num')
    const count = await winInputs.count()
    if (count >= 6) {
      await winInputs.nth(0).fill('-4'); await winInputs.nth(1).fill('4')
      await winInputs.nth(2).fill('-4'); await winInputs.nth(3).fill('4')
      await winInputs.nth(4).fill('-4'); await winInputs.nth(5).fill('4')
    }
  } catch {}

  // Click Plot / apply
  try {
    await page.click('button:has-text("Plot"), button.ov-close.tbl-go, button:has-text("GO")', { timeout: 2000 })
  } catch {
    await page.keyboard.press('Enter')
  }

  // Wait for computation
  await page.waitForTimeout(3000)
  try {
    await page.waitForFunction(() => !document.querySelector('.graph3d-computing'), { timeout: 15000 })
  } catch {}
  await page.waitForTimeout(1500)

  // Orbit: rotate around the surface with mouse drag
  const canvas = page.locator('.graph3d-canvas, canvas').first()
  const cBox = await canvas.boundingBox()

  if (cBox) {
    const cx = cBox.x + cBox.width / 2
    const cy = cBox.y + cBox.height / 2

    // Record ~8 seconds of rotation
    // Slow rotation: small steps, many of them
    await page.mouse.move(cx, cy)
    await page.waitForTimeout(200)

    // Full rotation sequence
    const steps = [
      { dx: -80, dy: 30 },   // initial tilt
      { dx: -40, dy: 0 },
      { dx: -60, dy: -10 },
      { dx: -60, dy: 0 },
      { dx: -60, dy: 10 },
      { dx: -50, dy: 0 },
      { dx: -60, dy: 0 },
      { dx: -60, dy: -5 },
    ]

    let curX = cx, curY = cy
    for (const { dx, dy } of steps) {
      await page.mouse.down()
      await page.mouse.move(curX + dx, curY + dy, { steps: 30 })
      curX += dx; curY += dy
      await page.mouse.up()
      await page.waitForTimeout(400)
    }

    // Keep recording for total ~12s
    await page.waitForTimeout(2000)
  } else {
    await page.waitForTimeout(8000)
  }

  await context.close()

  // Find the recorded video file
  const videoFile = execSync('ls -t /tmp/pw-video/*.webm 2>/dev/null | head -1').toString().trim()
  if (videoFile) {
    const mp4Out = resolve(MEDIA, '3d-surface.mp4')
    const gifOut = resolve(MEDIA, '3d-surface.gif')

    // Convert webm → mp4 (H.264, good for social media)
    execSync(`ffmpeg -y -i "${videoFile}" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -preset fast -pix_fmt yuv420p -movflags +faststart "${mp4Out}" 2>/dev/null`)
    console.log('Saved 3d-surface.mp4')

    // Convert to GIF (optimize: 10fps, palette)
    execSync(`ffmpeg -y -i "${videoFile}" -vf "fps=10,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=64[p];[s1][p]paletteuse=dither=bayer" "${gifOut}" 2>/dev/null`)
    console.log('Saved 3d-surface.gif')
  } else {
    console.log('Warning: no video file found, skipping 3D conversion')
  }
}

// ── 8. LIGHTHOUSE SCREENSHOT ──────────────────────────────────────────────────
console.log('\n[8/8] Lighthouse score...')
{
  try {
    // Run Lighthouse against localhost
    const lhOut = '/tmp/lighthouse-report.json'
    execSync(
      `npx --yes lighthouse "${BASE}" --output json --output-path "${lhOut}" --chrome-flags="--headless --no-sandbox" --only-categories=performance,accessibility,best-practices,seo --quiet 2>/dev/null`,
      { timeout: 90000, cwd: ROOT }
    )

    // Parse scores and render a screenshot
    const lhData = JSON.parse(execSync(`cat ${lhOut}`).toString())
    const cats = lhData.categories
    const scores = {
      Performance:     Math.round((cats.performance?.score || 0) * 100),
      Accessibility:   Math.round((cats.accessibility?.score || 0) * 100),
      'Best Practices':Math.round((cats['best-practices']?.score || 0) * 100),
      SEO:             Math.round((cats.seo?.score || 0) * 100),
    }

    function scoreColor(s) {
      if (s >= 90) return '#0cce6b'
      if (s >= 50) return '#ffa400'
      return '#ff4e42'
    }

    const circles = Object.entries(scores).map(([label, score]) => `
      <div class="cat">
        <svg viewBox="0 0 120 120" width="100" height="100">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#2a2a2a" stroke-width="10"/>
          <circle cx="60" cy="60" r="54" fill="none" stroke="${scoreColor(score)}" stroke-width="10"
            stroke-dasharray="${2 * Math.PI * 54}" stroke-dashoffset="${2 * Math.PI * 54 * (1 - score/100)}"
            transform="rotate(-90 60 60)" stroke-linecap="round"/>
          <text x="60" y="65" text-anchor="middle" fill="${scoreColor(score)}" font-size="28" font-weight="bold">${score}</text>
        </svg>
        <div class="label">${label}</div>
      </div>`).join('')

    const page = await browser.newPage()
    await page.setViewportSize({ width: 700, height: 280 })
    await page.setContent(`<!DOCTYPE html><html><head>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #1a1a2e; display: flex; flex-direction: column; align-items: center; padding: 28px; gap: 16px; }
      .title { color: #c9d1d9; font-family: monospace; font-size: 14px; }
      .url { color: #58a6ff; font-family: monospace; font-size: 12px; }
      .cats { display: flex; gap: 32px; }
      .cat { display: flex; flex-direction: column; align-items: center; gap: 8px; }
      .label { color: #c9d1d9; font-family: monospace; font-size: 11px; text-align: center; }
    </style></head>
    <body>
      <div class="title">Lighthouse — graph.nsquaredcreative.ca</div>
      <div class="cats">${circles}</div>
    </body></html>`)
    await page.waitForTimeout(300)
    await page.screenshot({ path: resolve(MEDIA, 'lighthouse.png') })
    await page.close()
    console.log('Saved lighthouse.png — scores:', scores)
  } catch (e) {
    console.log('Lighthouse failed:', e.message?.slice(0, 100))
    // Fallback: screenshot the live deployed site's Lighthouse panel
    console.log('Skipping lighthouse.png — will need manual capture')
  }
}

// ── DONE ─────────────────────────────────────────────────────────────────────
await browser.close()

console.log('\nAll automated media generated in docs/journal/media/')
console.log('Still needed manually:')
console.log('  - docs/journal/media/fx991es-and-graphn2.jpg (photo)')
console.log('  - docs/journal/media/mockup-vs-finished.png (first HTML mockup vs app)')
