# Model FX-∞G

A browser-based graphing scientific calculator with textbook-style math input.

**Live:** https://sreenikh.github.io/scientific-calculator/

---

## Features

- Textbook-style math input via MathLive (fractions stack, roots draw a vinculum, exponents sit above baseline)
- Degree/radian-aware trig: sin/cos/tan, inverses, and reciprocals (sec/csc/cot)
- Logarithms: log base 10, natural log, log to any base
- Roots and powers: sqrt, nth root, x², x³, x^y
- Combinatorics: nCr, nPr, factorial
- SHIFT and ALPHA key layers (three-function keypad)
  - ALPHA+1..6 inserts matrix variables A..F; ALPHA+7..9 inserts G..I; ALPHA+0 inserts J
- CONST panel: CODATA-style constants (Math, Universal, Electromagnetic, Atomic, Thermodynamic)
- CONV panel: 16 unit categories, ~90 units, live from/to conversion
- SOLVE panel: Newton-Raphson, Secant, and Bisection root finders with iteration table
- Calculus panel: numeric derivative (central difference) and definite integral (Simpson's rule)
- Complex number display: rectangular (a+bi) or polar (r∠θ) with toggle on the result line
- History strip: last 100 expressions with indexed entries; click any to restore; clear button
- MODE menu: Equation, Statistics, and Matrix/Vector panel
- Equation mode: polynomial roots (degree 1-10) and linear system solver (2x2 to 5x5)
- Statistics mode: 1-var (mean, median, quartiles, std dev, variance, min/max) and 2-var regression (linear, quadratic, exponential, power)
- Matrix/Vector panel: named slots A-J, size picker 1-4 rows/cols; 1-row slots act as vectors
- OPS panel: Matrix tab (inv, det, trace, transpose, size) and Vector tab (dot, cross, norm)
- Responsive layout: scales to any window size using dvh/vw units, no breakpoints

## Planned

- Phase 2: Graphing (canvas plotter, pan/zoom, trace, shaded integral regions)
- Phase 3 remaining: Distributions
- Phase 4: Base-N, STO/RCL memory, Format options, Table mode

See [docs/phases.md](docs/phases.md) for the full roadmap.

---

## Local development

```
npm install
npm run dev
```

Tests:

```
npm test
```

331 Vitest tests covering the expression engine, keypad contracts, and statistics engine.

---

## Deployment

The app deploys automatically to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.

To check a deployment:
1. Go to the **Actions** tab on GitHub
2. Click the latest **Deploy to GitHub Pages** run
3. The **deploy** job shows build output and the live URL once complete
4. Visit https://sreenikh.github.io/scientific-calculator/ to confirm

---

## Docs

- [Architecture](docs/architecture.md)
- [Phases and roadmap](docs/phases.md)
- [User manual](docs/user-manual.md)

---

## Project structure

```
src/
  engine/
    mathEngine.js       - math.js wrapper, angle-mode trig, normalizeExpression, formatValue
    numeric.js          - root finding, numeric derivative/integral, poly solver, linear system solver
    stats.js            - 1-variable stats and 2-variable regression (linear/quadratic/exp/power)
    units.js            - unit conversion data (16 categories)
    constants.js        - scientific constants library
  components/
    Screen.jsx          - MathLive math-field and result/error line
    Keypad.jsx          - renders ROWS from keypadConfig; handles SHIFT/ALPHA layers
    keypadConfig.js     - ROWS key layout data (shared with tests)
    HistoryStrip.jsx    - scrollable history log above the keypad
    ConstPanel.jsx      - constants overlay
    ConvPanel.jsx       - unit converter overlay
    SolvePanel.jsx      - equation solver overlay
    CalculusPanel.jsx   - calculus overlay
    ModePanel.jsx       - mode selection menu
    MatrixPanel.jsx     - matrix/vector storage, slots A-J
    OperationsPanel.jsx - matrix and vector operations menu
    EquationPanel.jsx   - polynomial roots and linear system solver
    StatPanel.jsx       - 1-variable stats and regression
  App.jsx               - top-level state and wiring
```
