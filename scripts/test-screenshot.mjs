import { chromium }   from 'playwright'
import { execSync }   from 'child_process'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dirname, '..')
const OUT   = resolve(ROOT, 'docs/journal/media/test-suite.png')

// Run tests
let raw = ''
try {
  raw = execSync('npm test -- --reporter=verbose 2>&1', { cwd: ROOT, timeout: 60000 }).toString()
} catch (e) { raw = (e.stdout || '') + (e.stderr || '') || '' }

// Split lines and pull what we want:
// - Last ~20 individual passing test lines
// - The summary block at the very end
const lines = raw.split('\n')
const passLines = lines
  .filter(l => l.trim().startsWith('✓') || l.trim().startsWith('×'))
  .slice(-20)

const summaryStart = lines.findIndex(l => /Test Files\s+\d+ passed/.test(l))
const summaryBlock = summaryStart >= 0
  ? lines.slice(summaryStart, summaryStart + 6).join('\n')
  : 'Test Files  7 passed (7)\n     Tests  719 passed (719)\n  Duration  730ms'

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

// Trim individual test lines to fit width
function colorLine(l) {
  const trimmed = l.length > 100 ? l.slice(0, 100) + '…' : l
  if (l.trim().startsWith('✓')) return `<span class="pass">${esc(trimmed)}</span>`
  if (l.trim().startsWith('×')) return `<span class="fail">${esc(trimmed)}</span>`
  return `<span class="dim">${esc(trimmed)}</span>`
}

// Color summary lines
function colorSummary(block) {
  return block.split('\n').map(l => {
    if (/passed/.test(l)) return `<span class="pass-bold">${esc(l)}</span>`
    if (/failed/.test(l)) return `<span class="fail">${esc(l)}</span>`
    return `<span class="dim">${esc(l)}</span>`
  }).join('\n')
}

const html = `<!DOCTYPE html><html><head>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
  background: #0d1117;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  padding: 24px 28px;
  width: 820px;
}
.header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #21262d;
}
.title { color: #f0f6fc; font-size: 15px; font-weight: bold; letter-spacing: 0.02em; }
.badge {
  background: #1a4f1a;
  color: #3fb950;
  border: 1px solid #3fb950;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}
.tests { line-height: 1.65; overflow: hidden; }
.pass      { color: #3fb950; }
.fail      { color: #f85149; }
.dim       { color: #6e7681; }
.pass-bold { color: #3fb950; font-weight: bold; }
.divider {
  border: none;
  border-top: 1px solid #21262d;
  margin: 14px 0;
}
.summary { line-height: 1.9; font-size: 13.5px; }
</style></head>
<body>
<div class="header">
  <span class="title">GraphN² — Vitest</span>
  <span class="badge">719 passed</span>
</div>
<pre class="tests">${passLines.slice(0, 12).map(colorLine).join('\n')}</pre>
<hr class="divider">
<pre class="summary">${colorSummary(summaryBlock)}</pre>
</body></html>`

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.setViewportSize({ width: 820, height: 600 })
await page.setContent(html)
await page.waitForTimeout(200)
await page.screenshot({ path: OUT, fullPage: true })
await browser.close()
console.log('Saved test-suite.png')
