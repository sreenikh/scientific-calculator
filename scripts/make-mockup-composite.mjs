import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { resolve } from 'path'

const MEDIA = '/Users/niknam/Projects/Nikhil/scientific-calculator/docs/journal/media'

const browser = await chromium.launch({ headless: true })

// Screenshot the static mockup at 480px wide
const mockupPage = await browser.newPage()
await mockupPage.setViewportSize({ width: 480, height: 760 })
await mockupPage.goto('file:///tmp/calc-mockup.html', { waitUntil: 'networkidle' })
await mockupPage.waitForTimeout(300)
const mockupShot = await mockupPage.screenshot({ type: 'png' })
writeFileSync('/tmp/mockup-shot.png', mockupShot)
console.log('Mockup screenshot saved')

// Screenshot the current finished app
const appPage = await browser.newPage()
await appPage.setViewportSize({ width: 480, height: 760 })
await appPage.goto('http://localhost:5176', { waitUntil: 'networkidle' })
await appPage.waitForSelector('math-field', { timeout: 10000 })
// Set a nice expression to show off textbook rendering
await appPage.evaluate(() => {
  const mf = document.querySelector('math-field')
  mf.setValue('\\sin(30) + \\sqrt{16}')
  mf.dispatchEvent(new Event('input', { bubbles: true }))
})
await appPage.waitForTimeout(300)
await appPage.click('button:has-text("=")')
await appPage.waitForTimeout(500)
const appShot = await appPage.screenshot({ type: 'png' })
writeFileSync('/tmp/app-shot.png', appShot)
console.log('App screenshot saved')

await browser.close()

// Composite side by side with Python PIL
const py = `
from PIL import Image, ImageDraw, ImageFont

mockup = Image.open('/tmp/mockup-shot.png').convert('RGBA')
app    = Image.open('/tmp/app-shot.png').convert('RGBA')

TARGET_H = 820
PADDING  = 36
GAP      = 52
LABEL_H  = 32

def scale_to_height(img, h):
    ratio = h / img.height
    return img.resize((int(img.width * ratio), h), Image.LANCZOS)

m = scale_to_height(mockup, TARGET_H)
a = scale_to_height(app,    TARGET_H)

total_w = PADDING + m.width + GAP + a.width + PADDING
total_h = PADDING + LABEL_H + TARGET_H + PADDING

# Light grey background to make both versions distinct
out = Image.new('RGB', (total_w, total_h), (245, 245, 248))

# Labels
draw = ImageDraw.Draw(out)
try:
    font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 18)
except:
    font = ImageFont.load_default()

label_y = PADDING + 4
draw.text((PADDING + m.width // 2, label_y), 'First mockup', fill=(100,100,100), font=font, anchor='mm')
draw.text((PADDING + m.width + GAP + a.width // 2, label_y), 'Finished app', fill=(40,40,40), font=font, anchor='mm')

img_y = PADDING + LABEL_H

# Paste mockup (RGBA on light bg)
bg = Image.new('RGB', m.size, (245, 245, 248))
bg.paste(m, mask=m.split()[3])
out.paste(bg, (PADDING, img_y))

# Thin separator
mid_x = PADDING + m.width + GAP // 2
draw.line([(mid_x, img_y + 30), (mid_x, img_y + TARGET_H - 30)], fill=(180, 180, 190), width=1)

# Paste finished app
bg2 = Image.new('RGB', a.size, (245, 245, 248))
bg2.paste(a, mask=a.split()[3])
out.paste(bg2, (PADDING + m.width + GAP, img_y))

out.save('${MEDIA}/mockup-vs-finished.png', optimize=True)
print(f'Composite size: {out.size}')
`

writeFileSync('/tmp/make_mockup_composite.py', py)
const result = execSync('python3 /tmp/make_mockup_composite.py').toString().trim()
console.log(result)
console.log('Saved mockup-vs-finished.png')
