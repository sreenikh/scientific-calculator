# Project phases

## Phase 1 - Core scientific calculator `[done]`

**Goal:** A usable scientific calculator with textbook-style math input.

### Delivered

- MathLive uncontrolled math field with cursor-aware LaTeX insertion
- Keypad with three layers: primary / SHIFT / ALPHA
  - Trig: sin/cos/tan + inverses + reciprocals (sec/csc/cot)
  - Log/exp: log (log10), ln, logₐ, 10^x, e^x
  - Roots and powers: sqrt, nth root, x², x³, x^y
  - Combinatorics: nCr, nPr, x!
  - Imaginary unit i, Ans recall
- Degree / radian toggle (DRG key)
- CONST panel: CODATA-style constants (Math, Universal, Electromagnetic, Atomic, Thermodynamic)
- CONV panel: 16 unit categories, ~90 units, live from/to conversion
- SOLVE panel: Newton-Raphson / Secant / Bisection on any f(x), shows iteration table
- Calculus panel: numeric derivative (central difference) and definite integral (Simpson's rule)
- normalizeExpression bridge: handles MathLive ascii-math quirks for nth-root, log base, nCr/nPr, Ans
- 225 Vitest tests (keypad contracts + engine coverage)
- GitHub Actions deploy to GitHub Pages

### Not in scope for Phase 1

See phases below.

---

## Phase 2 - Graphing `[planned]`

**Goal:** Plot and explore functions visually.

- Canvas-based function plotter (y = f(x))
- Pan and zoom with mouse / touch
- Trace mode: cursor snaps to curve, shows (x, y) coordinates
- Multiple functions on one graph, color-coded
- Shaded region between bounds for definite integrals
- Intersection and zero finder (reuses numeric.js root finders)
- Window settings: Xmin/Xmax/Ymin/Ymax/Xscl/Yscl

---

## Phase 3 - Advanced calculator modes `[planned]`

### Equation mode

- Polynomial root solver (UI for `polyRoots` in numeric.js - math already done)
- Linear system solver 2x2 / 3x3 (UI for `solveLinearSystem` - math already done)

### Statistics mode

- 1-variable: mean, median, std dev, variance, min/max, quartiles
- 2-variable: linear/quadratic/exponential/power regression, r and r²
- Data entry via a list editor

### Distribution mode

- Normal distribution: pdf, cdf, inverse cdf
- Binomial distribution: pdf, cdf
- Input: parameters + x value or probability
- Visual bell curve overlay

### Matrix / Vector mode

- Matrix entry (up to 4x4)
- Operations: add, multiply, inverse, determinant, transpose, eigenvalues
- Vector dot/cross product

---

## Phase 4 - Base-N and QoL `[planned]`

### Base-N calculator

- UI for the BASE-N button (keypad placeholder already exists)
- Input and display in decimal / binary / octal / hex
- Bitwise operations: AND, OR, XOR, NOT, shift

### Memory

- STO and RCL for variables A-F
- Variable display in screen status bar when set

### Format and display options

- Math/Line display toggle (MathLive already supports both)
- DMS entry and conversion (degrees/minutes/seconds)
- Fraction to decimal toggle
- Recurring decimal detection and display

### Table mode

- Evaluate f(x) over a range with configurable step
- Display as scrollable table
- Optional second function g(x) side by side

---

## Notes

- `engine/numeric.js` already contains `polyRoots` and `solveLinearSystem` - Phase 3 Equation mode is UI work only.
- The test suite (`npm test`) is intended as a merge gate on every PR. New phases should add tests before wiring UI.
- GitHub Pages deploy is live via `.github/workflows/deploy.yml` on push to `main`.
