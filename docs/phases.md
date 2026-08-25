# Project phases

## Phase 1 - Core scientific calculator `[done]`

**Goal:** A usable scientific calculator with textbook-style math input.

### Delivered

- MathLive uncontrolled math field with cursor-aware LaTeX insertion
- Keypad with three layers: primary / SHIFT / ALPHA
  - Trig: sin/cos/tan + inverses + reciprocals (sec/csc/cot)
  - Log/exp: log (log10), ln, logbase, 10^x, e^x
  - Roots and powers: sqrt, nth root, x², x³, x^y
  - Combinatorics: nCr, nPr, x!
  - Imaginary unit i, Ans recall
- Degree / radian toggle (DRG key)
- CONST panel: CODATA-style constants (Math, Universal, Electromagnetic, Atomic, Thermodynamic)
- CONV panel: 16 unit categories, ~90 units, live from/to conversion
- SOLVE panel: Newton-Raphson / Secant / Bisection on any f(x), shows iteration table
- Calculus panel: numeric derivative (central difference) and definite integral (Simpson's rule)
- normalizeExpression bridge: handles MathLive ascii-math quirks for nth-root, log base, nCr/nPr, Ans
- Responsive layout: `dvh`/`vw` units throughout, no pixel values, no breakpoints
- JetBrains Mono font (keypad, result line, overlays)
- 225 Vitest tests (keypad contracts + engine coverage)
- GitHub Actions deploy to GitHub Pages

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

## Phase 3 - Advanced calculator modes `[in progress]`

### History log `[done]`

- Scrollable strip between screen and keypad
- Up to 100 entries, indexed chronologically (#1 oldest, #n newest)
- Click any entry to restore the expression into the math field (state synced, = evaluates correctly)
- Clear button in the header row

### Complex number display `[done]`

- Results that are complex numbers display as `a + bi` (rectangular) or `r∠θ` (polar)
- Toggle button on the result line switches between the two forms
- Polar angle follows the current DEG/RAD mode
- Toggle only appears when the last result is complex

### Matrix / Vector mode `[done]`

Accessed via MODE menu.

- Named slots A-J (10 variables); slots shown in the matrix panel with dimension labels
- Size picker: 1-4 rows, 1-4 cols independently; non-square matrices supported
- 1-row slots are automatically treated as vectors in scope (flattened to 1D arrays)
  - Enables `dot(C,D)`, `norm(C)`, `cross(C,D)` when C/D are stored as 1xN
- 2+ row slots are math.js DenseMatrix; enables `inv(A)`, `det(A)`, `trace(A)`, `transpose(A)`
- Recall / Clear buttons per slot; stored matrix list at bottom of panel with dimension and preview
- ALPHA key layer for variable insertion: ALPHA+1=A, +2=B, ..., +6=F, +7=G, +8=H, +9=I, +0=J

### OPS panel `[done]`

Dedicated OPS button in the bottom row opens an operations menu with two tabs:

- Matrix: inv, det, trace, transpose, size
- Vector: dot (any length, both same size), cross (requires 3-component vectors), norm

Operations insert `\operatorname{fn}(` via the MathLive API, which normalizeExpression converts to valid math.js syntax before evaluation.

### Equation mode `[done]`

Accessed via MODE menu (item 1).

- Polynomial tab: degree selector 1-10, coefficient inputs (highest degree first), roots displayed as real or complex (a + bi)
- Linear System tab: 2x2 through 5x5 size selector, augmented matrix [A|b] input, solution via Gaussian elimination with partial pivoting
- Degree 1-2: closed-form formulas; degree 3+: companion-matrix eigenvalues via math.js `eigs`

### Statistics mode `[done]`

Accessed via MODE menu (item 3).

- 1-variable tab: enter x values; computes n, Σx, Σx², mean, median, mode, Q1, Q3, IQR, range, population std dev (σ) and variance (σ²), sample std dev (s) and variance (s²), CV, SEM, skewness (Fisher), excess kurtosis, min, max
  - Fixed percentiles P10/P25/P50/P75/P90; dynamic custom percentile inputs (add/remove any number of Pn queries)
  - Linear interpolation percentile method; NaN values display as — rather than erroring
- 2-variable tab: enter (x, y) pairs; choose Linear, Quadratic, Exponential, or Power regression
  - Linear/Exp/Power: returns a, b, r, r²
  - Quadratic: returns a, b, c, r² (normal equations via 3x3 Gaussian elimination)
  - Exponential and Power models linearize via log transform; require y > 0 (Power also requires x > 0)
- Scrollable data list; rows added on demand; individual rows deletable

### Distribution mode `[planned]`

- Normal distribution: pdf, cdf, inverse cdf
- Binomial distribution: pdf, cdf
- Input: distribution parameters + x value or probability

---

## Phase 4 - Base-N and QoL `[planned]`

### Base-N calculator

- UI for the BASE-N button (keypad placeholder already exists)
- Input and display in decimal / binary / octal / hex
- Bitwise operations: AND, OR, XOR, NOT, shift

### Memory

- STO and RCL for variables
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

- The test suite (`npm test`) is the merge gate on every PR. New phases add tests before wiring UI.
- GitHub Pages is live at https://sreenikh.github.io/scientific-calculator/ via `.github/workflows/deploy.yml` on push to `main`.
