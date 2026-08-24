# Model FX-∞G — graphing scientific calculator

Phase 1 scaffold: Vite + React, math.js as the evaluation engine, MathLive
for textbook-style editable input.

## What's working in this phase

- Calc mode: textbook math input via MathLive, evaluated through math.js
- Degree/radian-aware trig, including sec/csc/cot
- `logb(x, b)` for log to any base, `nPr`/`nCr`, factorial (`!` is native to math.js)
- SHIFT / ALPHA key layers (inverse trig, x³, xth root, 10ˣ/eˣ, csc/sec/cot, logₐ)
- CONST panel — full CODATA-style constants library (5 categories)
- CONV panel — 16 unit categories, ~90 units, live From/To conversion
- SOLVE panel — Newton-Raphson / Secant / Bisection on any user-typed f(x)
- Calculus panel — numeric derivative (central difference) and definite
  integral (Simpson's rule) on any user-typed f(x)

## Not yet built (later phases)

- Graph mode (canvas plotting, pan/zoom/trace, shaded integral regions)
- Table mode for arbitrary expressions
- Statistics mode (regression, 1-var/2-var stats)
- Distribution mode (normal/binomial pdf/cdf/inverse)
- Equation mode (poly-solv, sys-solv) — the underlying math (`polyRoots`,
  `solveLinearSystem`) already exists in `src/engine/numeric.js`, just not
  wired to a UI panel yet
- Matrix / Vector modes
- Base-N mode
- STO→ / RCL / variable memory workflow
- FORMAT key (Math/Line toggle, DMS entry, fraction⇄decimal, recurring decimal)

## Known risk area to verify once running in a real browser

Evaluation currently uses MathLive's `getValue('ascii-math')` export as the
bridge into math.js (`src/components/Screen.jsx` → `src/App.jsx`). This
conversion is usually close to math.js syntax (fractions, `sqrt()`, `^`),
but hasn't been checked against every notation math.js needs — this is worth
testing thoroughly with real fraction/root/exponent input before relying on
it. If specific LaTeX constructs don't survive the round-trip cleanly, the
fix is a small normalization pass in `mathEngine.normalizeExpression`, or
switching the bridge to walk MathLive's `getValue('math-json')` output
instead, which is more structured than the ascii-math string.

## Local development

```
npm install
npm run dev
```

## Deploying to GitHub Pages

1. Push this project to a GitHub repo.
2. **Important**: in `vite.config.js`, set `base: '/your-repo-name/'` to
   match your actual repo name (currently set to `/sci-calc/`).
3. In your repo settings → Pages, set the source to **GitHub Actions**.
4. Push to `main` — `.github/workflows/deploy.yml` builds and deploys
   automatically. Your app will be live at
   `https://<username>.github.io/<repo-name>/`.

## Project structure

```
src/
  engine/
    mathEngine.js   — math.js wrapper, angle-mode-aware trig, error handling
    numeric.js      — root-finding (Newton/secant/bisection), poly-solv,
                       sys-solv, numeric derivative/integral
    units.js        — 16-category unit conversion data
    constants.js     — scientific constants library
  components/
    Screen.jsx      — MathLive math-field + result line
    Keypad.jsx       — primary/shift/alpha key layout
    ConstPanel.jsx / ConvPanel.jsx / SolvePanel.jsx / CalculusPanel.jsx
  App.jsx            — top-level state and wiring
```
