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
- Statistics mode: 1-var (n, mean, median, mode, quartiles, IQR, range, σ, σ², s, s², CV, SEM, skewness, kurtosis, min/max, fixed P10/25/50/75/90, custom percentile inputs), 2-var regression (linear, quadratic, exponential, power), and k-var multiple linear regression (2-5 predictors, R², adjusted R²)
- Distribution mode: Normal pdf/cdf/inverse-cdf and Binomial pdf/cdf; large-n binomial via log-space calculation
- Matrix/Vector panel: named slots A-J, size picker 1-4 rows/cols; 1-row slots act as vectors
- OPS panel: Math tab (abs, mod, floor, ceil, round, sign), Matrix tab (inv, det, trace, transpose, size), Vector tab (dot, cross, norm), Complex tab (polar, abs, arg, conj, re, im)
- `%` key (ALPHA+×) inserts a percentage: `50%` evaluates to 0.5; `mod(a,b)` is the separate modulo operation
- BASE button (top modifier row, next to DRG): cycles DEC/HEX/OCT/BIN just like DRG cycles DEG/RAD; status bar shows active base; integer results reformatted automatically; main screen and keypad unchanged
- BASE-N panel: Numbers tab has a base selector and BigInt expression evaluator (+/-/*/% AND/OR/XOR/NOT/<</>>), result shown in all four bases; K-map tab for Karnaugh map minimization
- K-Map (BASE-N -> K-map tab): 2-8 variables; 2-6 vars use a Gray-code grid; 7-8 vars use a flat scrollable minterm list; cells cycle 0/1/X (don't care); Quine-McCluskey minimization to minimal SOP
- Responsive layout: scales to any window size using dvh/vw units, no breakpoints

## Planned

- Phase 2: Graphing (canvas plotter, pan/zoom, trace, shaded integral regions)
- Phase 4 remaining: STO/RCL memory, Format options, Table mode

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

548 Vitest tests covering the expression engine, keypad contracts, statistics engine, distributions, and base-N/bitwise/K-map engine.

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
    distributions.js    - normal (pdf/cdf/inv) and binomial (pdf/cdf) distributions
    baseN.js            - base conversion, bitwise ops, K-map / Quine-McCluskey solver
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
    DistributionPanel.jsx  - normal and binomial distribution panel
    BaseNPanel.jsx         - base conversion (Numbers tab) and K-map solver (K-map tab)
  App.jsx               - top-level state and wiring
```
