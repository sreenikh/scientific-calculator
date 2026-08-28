# GraphN²

A browser-based graphing scientific calculator with textbook-style math input.

**Live:** https://graph.nsquaredcreative.ca

[![GraphN² - calculator and 3D surface](https://graph.nsquaredcreative.ca/og-image.png)](https://graph.nsquaredcreative.ca)

---

## Features

- Textbook-style math input via MathLive (fractions stack, roots draw a vinculum, exponents sit above baseline)
- Degree/radian-aware trig: sin/cos/tan, inverses, and reciprocals (sec/csc/cot)
- Hyperbolic trig: sinh, cosh, tanh (primary row); inverses asinh, acosh, atanh via SHIFT
- Constants e and π as dedicated keypad keys
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
- Memory STO/RCL: SHIFT+AC enters STO mode; press digit 1-9/0 to store current result to slot K-T; ALPHA+AC enters RCL mode, then press digit 1-9/0 to insert the slot variable name (K-T) into the expression; set slots shown as teal letters in status bar. Slots K-T are distinct from matrix variables A-J and hex digits A-F
- BASE button (top modifier row, next to DRG): cycles DEC/HEX/OCT/BIN just like DRG cycles DEG/RAD; status bar shows active base; integer results reformatted automatically; main screen and keypad unchanged
- BASE-N panel: Numbers tab has a base selector and BigInt expression evaluator (+/-/*/% AND/OR/XOR/NOT/<</>>), result shown in all four bases; K-map tab for Karnaugh map minimization
- K-Map (BASE-N -> K-map tab): 2-8 variables; 2-6 vars use a Gray-code grid; 7-8 vars use a flat scrollable minterm list; cells cycle 0/1/X (don't care); Quine-McCluskey minimization to minimal SOP
- Math/Line display toggle: MATH button in the result area switches the MathLive input between textbook layout and linear text; active mode highlighted
- DMS conversion: `fromDMS(d, m, s)` converts degrees/minutes/seconds to decimal degrees (OPS panel, Convert tab); DMS button on the result line converts any real numeric result to D°M'S" format
- Table mode: evaluate f(x) and optional g(x) over a range with configurable step; up to 500 rows; scrollable with sticky headers; accessible via MODE -> 5 TABLE
- Responsive layout: scales to any window size using dvh/vw units, no breakpoints

- Graph panel (2D): explicit y = f(x) curves and implicit F(x,y) = 0 curves (circles, ellipses, hyperbolas via marching squares); combined or split-subplot view; scroll/pinch to zoom, trackpad swipe or drag to pan; hover crosshair with (x, y) labels; click to lock crosshair; trace mode (T key: step along explicit or implicit curve with ←→, switch curves with ↑↓); 1:1 aspect-ratio button; RESET restores default window; FIT zooms to where the curves exist
- Graph panel (3D): 2D/3D toggle in header; explicit surfaces z = f(x,y) rendered on an 80×80 grid with viridis colormap and smooth normals; implicit surfaces F(x,y,z) = 0 extracted via marching cubes (6-tet-per-cube decomposition): spheres, ellipsoids, cones, hyperboloids, tori, cylinders; OrbitControls (drag-rotate, scroll-zoom, right-drag-pan); wireframe overlay toggle; RESET camera; up to 5 surfaces per plot; Three.js WebGL renderer

## Planned

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

702 Vitest tests covering the expression engine, keypad contracts, graph coordinate transforms (implicit curves, zoom niceStep, trace contour walking, findPlotBounds), 3D engine (viridis, explicit mesh builder, marching cubes), statistics engine, distributions, and base-N/bitwise/K-map engine.

---

## Deployment

The app is hosted on Cloudflare Pages at https://graph.nsquaredcreative.ca. Cloudflare builds and deploys automatically on every push to `main`.

To check a deployment:
1. Go to the **Actions** tab on GitHub and confirm the CI build passes
2. Open the Cloudflare Pages dashboard (Workers & Pages > graphn2) to see the deployment status
3. Visit https://graph.nsquaredcreative.ca to confirm

---

## Docs

- [Architecture](docs/architecture.md)
- [Phases and roadmap](docs/phases.md)
- [User manual](docs/user-manual.md)
- [Quick reference](docs/user-manual-quickref.md)

---

## Project structure

```
src/
  engine/
    mathEngine.js       - math.js wrapper, angle-mode trig, normalizeExpression, formatValue
    numeric.js          - root finding, numeric derivative/integral, poly solver, linear system solver
    numeric3d.js        - viridis colormap, explicit mesh builder, marching cubes for 3D graphing
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
    GraphPanel.jsx      - 2D graph overlay with 2D/3D toggle in header
    GraphPanel3D.jsx    - Three.js WebGL 3D graph scene (explicit + implicit surfaces)
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
