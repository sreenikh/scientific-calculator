# Project phases

## Phase 1 - Core scientific calculator `[done]`

**Goal:** A usable scientific calculator with textbook-style math input.

### Delivered

- MathLive uncontrolled math field with cursor-aware LaTeX insertion
- Keypad with three layers: primary / SHIFT / ALPHA
  - Trig: sin/cos/tan + inverses + reciprocals (sec/csc/cot)
- Hyperbolic trig: sinh/cosh/tanh (dedicated row); inverses asinh/acosh/atanh via SHIFT layer
- Direct e and π keys on the hyperbolic row
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

## Phase 2 - Graphing `[in progress]`

**Goal:** Plot and explore functions visually.

### Basic plot + window settings `[done]`

- Canvas-based function plotter (y = f(x)) accessed via the GRAPH key (bottom row)
- Window settings: Xmin/Xmax/Ymin/Ymax/Xscl/Yscl with Casio-style defaults (-10/10/-6.2/6.2/1/1)
- Grid lines at scale intervals, axes, tick marks with numeric labels
- Discontinuity detection: large pixel jumps lift the pen (handles tan, 1/x, etc.)
- DEG/RAD badge in header; angle mode passed to compileFn for correct sin/cos/tan
- DPR-aware canvas for crisp rendering on retina displays
- Enter key or "plot" button triggers redraw; auto-plots sin(x) on open

### Multiple functions `[done]`

- Unlimited functions (10-color palette, cycles for more); add/remove rows freely
- Show/hide toggle per function (filled/hollow dot); hidden functions are excluded from the plot
- Combined mode: all visible functions on one canvas
- Split mode: one canvas per visible function in a 2-column grid, each labeled with its color; scrollable when many functions are active

### Implicit curves `[done]`

- Expressions containing `y` or `=` are auto-detected as implicit (e.g. `x^2 + y^2 = 4`, `x^2/4 + y^2/9 = 1`)
- Plotted using marching squares on a 300×300 grid; handles circles, ellipses, hyperbolas, and arbitrary F(x,y)=0 forms
- `y = f(x)` form is recognized and converted to an explicit curve automatically
- `compileImplicitFn` in `numeric.js` handles LHS−RHS compilation with a mutable scope for performance

### Crosshair inspection `[done]`

- Hover over the graph to show a dashed vertical line at x = cursor position
- For each explicit curve: dot + dashed horizontal line + `(x, y)` label in the curve color
- For implicit curves: y-range sweep (300 samples, linear interpolation) finds all intersections; each is marked with dot + horizontal line + label
- Click to lock crosshair in place (turns amber); click again to release
- In split view, the crosshair x is shared across all subplots simultaneously

### Axis scaling `[done]`

- **1:1 button**: adjusts Ymin/Ymax so one math unit = same pixel count in both axes; prevents circles from appearing elliptical on non-square canvases

### Zoom and pan `[done]`

- **Scroll / Ctrl+scroll**: zoom in and out centered on cursor (mouse wheel zooms; Ctrl key on trackpad gestures = pinch)
- **Trackpad two-finger swipe**: pans the graph (fires as `wheel` with deltaX/deltaY, same as Google Maps on desktop)
- **Mouse drag**: click and drag pans; a small movement threshold (4 px) distinguishes a drag from a click
- **Touch pinch**: two-finger pinch zooms around the midpoint; one-finger drag pans
- **Auto tick steps**: grid lines and axis labels recalculate a human-friendly step (`niceStep`) during every zoom/pan so the graph never shows 0 or 10000 grid lines
- **Draft quality during gesture**: implicit curves (marching squares) render at 80×80 during active zoom/pan for responsiveness; full 300×300 quality redraws on gesture end (250 ms debounce)

### Trace `[done]`

- Press **T** key or the **TRACE** button to enter trace mode
- Mouse hover moves a trace cursor along the nearest curve (explicit or implicit) at x = cursor
- **← →** step along the curve (1/300 of the current range per step); for implicit curves, walks the zero-contour via tangent step + Newton projection (`implicitStep`)
- **↑ ↓** cycle through all visible curves (explicit and implicit)
- Coordinate badge at top of canvas shows `x=... y=...` prominently; `[impl]` tag shown for implicit curves
- **Escape** or **T** exits trace mode; trace is cleared on any replot

### RESET and FIT `[done]`

- **RESET** button restores the default window (-10/10/-6.2/6.2)
- **FIT** button runs `findPlotBounds()`: progressive search (±5/±15/±50/±150), 5% percentile clipping, 15% padding; adjusts the window to show where the curves actually are

### 3D graphing `[done]`

- **2D/3D toggle** in graph panel header; 2D and 3D preserve independent function lists and window states
- **Explicit surfaces** z = f(x,y): 80×80 meshgrid, NaN-hole skipping, smooth per-vertex normals (central differences), viridis colormap vertex coloring (dark purple at min z → yellow at max z), auto Z-range readout
- **Implicit surfaces** F(x,y,z) = 0: marching cubes using 6-tetrahedra-per-cube decomposition (small verifiable tri table, no black-box 256-case lookup), face normals from cross product, degenerate-triangle skip; supports spheres, ellipsoids, cones, hyperboloids, tori, cylinders
- **Three.js WebGL scene**: Z-up coordinate system, 45° perspective camera, ambient + two directional lights, XY grid, axes helper (X=red, Y=green, Z=blue), auto-resize via ResizeObserver
- **OrbitControls**: left-drag rotates, scroll zooms, right-drag pans; damping for smooth feel
- **Wireframe overlay**: WIRE button toggles translucent wireframe on all plotted surfaces simultaneously
- Up to 5 surfaces per plot, color-coded with the same 10-color palette as 2D graphs
- **RESET camera**: restores default diagonal view
- Window settings: Xmin/Xmax/Ymin/Ymax/Zmin/Zmax (Z bounds used only by marching cubes)
- `numeric3d.js` exports: `viridis`, `parseExpr3D`, `compileExplicit3DFn`, `compileImplicit3DFn`, `buildExplicitMesh`, `marchingCubes`; 47 tests

### Planned

- Shaded region between bounds for definite integrals
- Intersection and zero finder (reuses numeric.js root finders)

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
- Ans and memory slots K-T accept and propagate complex values; stored complex values work in subsequent expressions
- nth root / sqrt of a complex argument (or real-negative even root) shows all n roots in a panel below the result; principal value is Ans by default; clicking any root promotes it to Ans so it can be STO-ed independently; real-negative odd roots still return the real result (e.g. `∛(-8)` = -2, no panel)

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
  - Linear interpolation percentile method; NaN values display as '--' rather than erroring
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

### Base-N mode `[done]`

**BASE button** (top modifier row, alongside SHIFT / ALPHA / MODE / DRG):
- Cycles DEC -> HEX -> OCT -> BIN -> DEC, exactly like DRG cycles DEG/RAD
- Status bar shows the active base when non-decimal; integer results are reformatted immediately when cycling
- The main screen, MathLive field, and keypad remain unchanged
- Digit validation: BIN rejects digits 2-9; OCT rejects 8-9; invalid input shows an error instead of evaluating

**BASE-N panel** (bottom mod row key) - overlay with two tabs:

*Numbers tab:*
- Base selector (DEC/HEX/OCT/BIN) provides the same mode switch as the BASE button
- Plain-text expression evaluator with +/-/*/% and AND/OR/XOR/NOT/<</>>
- Numbers are arbitrary-precision BigInt - no overflow
- Result shown in all four bases simultaneously; active base highlighted

*K-map tab:*
- Variable count: 2-6 variables use a visual Gray-code grid (5-var: 4x8, 6-var: 8x8); 7-8 variables use a flat scrollable minterm list
- Cells cycle 0 -> 1 -> X (don't care) on click
- Minimize runs Quine-McCluskey: essential primes + greedy cover
- Result: minimal SOP in A/B/C/D/E/F/G/H with complements as A'/B'
- Clear button resets all cells

### Memory `[done]`

- **STO**: SHIFT+AC enters STO mode (amber STO indicator in status bar); press digit 1-9 or 0 to store the current result to memory slot K-T; any non-digit key cancels STO mode and processes normally
- **RCL**: ALPHA+AC enters RCL mode (teal RCL indicator in status bar); press digit 1-9 or 0 to insert the slot variable name (K-T) into the expression; any non-digit key cancels RCL mode and processes normally
- Memory slots K-T are scalars distinct from matrix variables A-J and hex digits A-F; injected into the evaluation scope alongside matrix variables
- Status bar: set memory slots appear as small teal letters (e.g. K M) to the right of the ALPHA indicator

### Format and display options `[done]`

- **Math/Line toggle**: MATH button in the display row switches the MathLive input field between textbook (math) mode and linear text (line) mode; active mode shown on the button; button is always visible
- **DMS**: `fromDMS(d, m, s)` converts degrees/minutes/seconds to decimal degrees; available in OPS panel (Convert tab); DMS toggle button on the result line converts the last numeric result to D degrees M' S" format; toggle only appears when the last result is a real number

### Table mode `[done]`

Accessed via **MODE -> 5 TABLE**.

- Enter f(x) and an optional g(x); set start, end, and step
- Generates up to 500 rows; step-accumulation uses integer rounding to avoid float drift
- Scrollable table with sticky headers; x column left-aligned, f(x)/g(x) right-aligned
- Hover highlight per row for readability

### Master reset `[done]`

Two entry points, same two-step confirmation flow:

- **Double-AC**: press AC when the expression field is already empty; result line shows "Press AC again to reset all" with a dimmed hint "Or wait 3 seconds to cancel"
- **MODE -> 6 RESET ALL**: menu closes and the same prompt appears

Confirming (press AC within 3 seconds) wipes all state: expression, result, history, memory slots K-T, matrix variables A-J, angle mode (DEG), base mode (DEC), display mode (MATH), complex mode (rect), DMS toggle, SHIFT/ALPHA/STO/RCL modifiers, and any open panel.

---

## Notes

- The test suite (`npm test`) is the merge gate on every PR. New phases add tests before wiring UI.
- Cloudflare Pages is live at https://graph.nsquaredcreative.ca; Cloudflare builds and deploys on every push to `main`.
