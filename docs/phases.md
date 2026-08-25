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

Dedicated OPS button in the bottom row opens an operations menu with four tabs:

- Math: abs (absolute value / complex magnitude), mod (remainder after division), floor, ceil, round, sign
- Matrix: inv, det, trace, transpose, size
- Vector: dot (any length, both same size), cross (requires 3-component vectors), norm
- Complex: polar, abs, arg, conj, re, im

Operations insert `\operatorname{fn}(` via the MathLive API, which normalizeExpression converts to valid math.js syntax before evaluation.

`%` is available on ALPHA+× and evaluates as percentage (divide by 100): `50%` = 0.5. Modulo is separate via `mod(a, b)` in the Math tab.

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
- k-variable tab: multiple linear regression with 2-5 predictors; y = b0 + b1*x1 + ... + bk*xk
  - Normal equations solved via Gaussian elimination; returns b0..bk, R², adjusted R²
  - Detects collinear predictors and returns an error
- Scrollable data list; rows added on demand; individual rows deletable

### Distribution mode `[done]`

Accessed via MODE menu (item 4).

- Normal tab: parameters μ and σ; three functions:
  - pdf -- probability density at x
  - cdf -- P(X ≤ x); complement P(X > x) shown alongside
  - inv -- inverse cdf: x such that P(X ≤ x) = p (Acklam rational approximation, error < 1.15e-9)
- Binomial tab: parameters n (trials) and p (probability); two functions:
  - pdf -- P(X = k) via log-space calculation to handle large n without overflow
  - cdf -- P(X ≤ k)

---

## Phase 4 - Base-N and QoL `[in progress]`

### Base-N panel `[done]`

Accessed via the **BASE-N** key in the bottom mod row. Opens an overlay with two tabs.

**Numbers tab:**
- Base selector (DEC/HEX/OCT/BIN) acts like the DRG toggle: selecting a base changes the calculator mode
- When a non-decimal base is active, the status bar shows HEX/OCT/BIN and integer results on the main screen are reformatted in that base
- Expression input accepts any base-valid digits and operators: + - * / % AND OR XOR NOT & | ^ ~ << >> ( )
- Numbers are arbitrary-precision BigInt - no overflow
- Result is shown in all four bases; the active base row is highlighted

**K-map tab:**
- Variable count: 2-6 variables use a visual Gray-code grid (5-var: 4x8, 6-var: 8x8); 7-8 variables use a flat scrollable minterm list
- Cells cycle 0 -> 1 -> X (don't care) on click
- Minimize runs Quine-McCluskey: essential primes + greedy cover
- Result: minimal SOP in A/B/C/D/E/F/G/H with complements as A'/B'
- Clear button resets all cells

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
