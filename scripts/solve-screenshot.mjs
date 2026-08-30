import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.setViewportSize({ width: 520, height: 900 })
await page.goto('http://localhost:5176', { waitUntil: 'networkidle' })
await page.waitForSelector('math-field', { timeout: 10000 })
await page.waitForTimeout(800)

// Open SOLVE
await page.click('button:has-text("SOLVE")')
await page.waitForTimeout(600)

// Fill in the function using page.evaluate to bypass overlay issues
await page.evaluate(() => {
  const inputs = document.querySelectorAll('.overlay.active input')
  if (inputs[0]) {
    inputs[0].value = 'x^3 - 2*x - 5'
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }))
    inputs[0].dispatchEvent(new Event('change', { bubbles: true }))
  }
})
await page.waitForTimeout(400)

// Click "solve" button via evaluate
await page.evaluate(() => {
  const buttons = document.querySelectorAll('.overlay.active button')
  for (const btn of buttons) {
    if (btn.textContent.trim() === 'solve') {
      btn.click()
      break
    }
  }
})
await page.waitForTimeout(1500)

await page.screenshot({ path: '/Users/niknam/Projects/Nikhil/scientific-calculator/docs/journal/media/solve-panel.png' })
console.log('saved solve-panel.png')

await browser.close()
