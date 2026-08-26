# User manual

## Overview

Model FX-∞G is a browser-based scientific calculator with textbook-style math input. Expressions look the way they do on paper - fractions stack vertically, roots draw a vinculum, exponents sit above the baseline - and pressing **=** evaluates them.

The layout scales to fit any window size. Resize the browser freely; font sizes and button heights adjust automatically.

---

## The display

```
DEG  RAD  SHIFT  ALPHA        <- status bar
+-----------------------------+
|  sin(30)                    |  <- math input field (editable)
|                          0.5|  <- result line
+-----------------------------+
#2  inv(A)*transpose(B)  [matrix]
#1  dot(C,D)                11  <- history strip (click to restore)
```

- **DEG / RAD** - current angle mode; active one is bright, inactive is dimmed.
- **SHIFT** - lights up amber when SHIFT is active (next key uses its orange label).
- **ALPHA** - lights up teal when ALPHA is active (next key uses its teal label).
- The result line shows the last evaluated answer, or an error message in red.
- A column of toggle buttons sits to the left of the result:
  - **MATH / LINE** - always visible; switches the input field between textbook layout (fractions stack, roots draw a vinculum) and linear text entry. Press to toggle; active mode is shown on the button.
  - **DMS** - appears when the last result is a real number; press to reformat it as D degrees M' S" (e.g. `45.5` shows as `45°30'0"`). Press again to return to decimal.
  - **RECT / POLAR** - appears when the last result is a complex number; toggles between rectangular (`a+bi`) and polar (`r∠θ`) display.

---

## Entering expressions

Click anywhere in the math field to place the cursor. The keypad inserts math at the cursor position.

### Basic arithmetic

| Key | Inserts | Example |
|-----|---------|---------|
| 0-9 | digit | `42` |
| + | + | `2+3` |
| - | - | `10-4` |
| x | multiplication | `3x4` |
| / | fraction bar | `1/2` |
| . | decimal point | `3.14` |
| ( ) | parentheses | `(2+3)x4` |

Press **=** to evaluate. The result appears on the right side of the result line.

### Editing

- **DEL** removes the character or structure to the left of the cursor.
- **AC** clears the entire expression and resets the result to 0.

---

## SHIFT and ALPHA keys

Each key has up to three functions:

```
 sin^-1  csc       <- SHIFT label (orange, top-left) / ALPHA label (teal, top-right)
  sin              <- primary label
```

- Press **SHIFT** once - SHIFT lights up amber. The next key pressed uses its orange function. SHIFT cancels automatically after one key.
- Press **ALPHA** once - ALPHA lights up teal. The next key pressed uses its teal function. ALPHA cancels automatically after one key.
- Press SHIFT or ALPHA again to cancel without pressing another key.

---

## Variable keys (ALPHA layer)

ALPHA+number inserts a matrix/vector variable name into the expression:

| ALPHA + | Variable |
|---------|----------|
| 1 | A |
| 2 | B |
| 3 | C |
| 4 | D |
| 5 | E |
| 6 | F |
| 7 | G |
| 8 | H |
| 9 | I |
| 0 | J |

Variables A-J are evaluated from stored values in the Matrix/Vector panel. Typing `inv(A)` evaluates to the inverse of whatever matrix is stored in slot A. If a slot has no stored value, the variable is undefined.

---

## Math functions

### Trig

| Press | Inserts | SHIFT (orange) | ALPHA (teal) |
|-------|---------|----------------|--------------|
| sin | sin( | sin^-1( | csc( |
| cos | cos( | cos^-1( | sec( |
| tan | tan( | tan^-1( | cot( |

### Hyperbolic trig

| Press | Inserts | SHIFT |
|-------|---------|-------|
| sinh | sinh( | sinh^-1 (asinh) |
| cosh | cosh( | cosh^-1 (acosh) |
| tanh | tanh( | tanh^-1 (atanh) |
| e | Euler's number (2.718...) | - |
| π | Pi (3.14159...) | - |

Close the parenthesis after entering the argument, or use the **)** key.

**Angle mode matters.** `sin(30)` in DEG mode = 0.5. In RAD mode it gives sin(30 radians). Toggle with the **DRG** key.

Hyperbolic functions are not angle-mode-sensitive: `sinh(1)` always returns 1.1752...

### Logarithms and exponentials

| Press | Inserts | SHIFT | ALPHA |
|-------|---------|-------|-------|
| log | log( | 10^box | logbase( |
| ln | ln( | e^box | - |

- **log** computes log base 10.
- **ln** computes the natural log.
- **SHIFT log** (10^x): type the exponent into the box.
- **ALPHA log** (logbase): type the base into the subscript box, then the argument.

### Roots and powers

| Press | Inserts | SHIFT |
|-------|---------|-------|
| sqrt | square root | nth root (fill index first, then radicand) |
| x^2 | ^2 | ^3 |
| x^y | exponent box | - |

**Nth root:** press **SHIFT sqrt**, type the root degree (e.g. 3 for cube root), then press the right arrow or Tab to move into the radicand.

### Combinatorics

| Press | Inserts | Note |
|-------|---------|------|
| nPr | nPr(box,box) | Fill n, Tab to r |
| nCr | nCr(box,box) | Fill n, Tab to r |
| x! | ! | Type number first, then x! |

Factorial: type `5` then press **x!** to get `5!`.

### Ans and imaginary unit

| Press | Inserts | SHIFT |
|-------|---------|-------|
| Ans | last result | i (imaginary unit) |

**Ans** holds the result of the last successful evaluation. Use it to chain calculations: evaluate `25`, then type `sqrt(Ans)` to get 5.

---

## Memory (STO / RCL)

The calculator has 10 scalar memory slots: **K through T**. These are separate from matrix/vector variables (A-J) and from hex digits (A-F), so there is no conflict between modes.

### Storing a value

1. Evaluate an expression to get a result.
2. Press **SHIFT** then **AC** - the status bar shows **STO** in amber.
3. Press a digit key **1-9** or **0** to store to slot K-T (1=K, 2=L, ..., 9=S, 0=T).

The STO indicator clears and the slot letter appears in teal in the status bar.

Pressing any non-digit key while STO is active cancels the store and processes that key normally.

### Recalling a value

Press **ALPHA** then **AC** - the status bar shows **RCL** in teal. Then press a digit to insert the slot variable name into the expression:

| Press | Inserts |
|-------|---------|
| RCL + 1 | K |
| RCL + 2 | L |
| ... | ... |
| RCL + 0 | T |

Pressing any non-digit key while RCL is active cancels and processes that key normally. Press **=** to evaluate the expression with the stored value substituted.

**Example:**
1. Evaluate `25 * 4` - result is `100`.
2. Press SHIFT + AC + 1 - stores `100` to slot K.
3. Press ALPHA + AC + 1 - inserts `K` into the expression.
4. Build `sqrt(K)` and press `=` - result is `10`.

**Note:** Matrix and memory variables share the evaluation scope. If a letter somehow ends up in both (not possible given the K-T vs A-J split), the matrix value takes precedence.

---

## Angle mode (DRG)

Press **DRG** to toggle between **DEG** and **RAD**. The status bar updates immediately. All trig functions and their inverses use the active mode.

---

## Complex numbers

When a result is complex, it appears in rectangular form by default: `a + bi`. A small **RECT** button appears to the left of the result. Click it to switch to polar form `r∠θ`, where the angle follows the current DEG/RAD mode. Click again to switch back.

The toggle only appears when the last result is complex. Evaluating a real result hides it.

---

## History strip

The strip between the screen and keypad shows the last 100 evaluated expressions, newest first, indexed from #1 (oldest) to #n (newest).

- **Click any entry** to restore that expression into the math field. Pressing **=** then re-evaluates it with the current stored variables and angle mode.
- The **clear** button at the top right of the strip wipes the history.

---

## MODE menu

Press **MODE** to open the mode menu.

| # | Mode | Description |
|---|------|-------------|
| 1 | EQUATION | Polynomial roots (degree 1-10), linear systems (2x2 to 5x5) |
| 2 | MATRIX / VECTOR | Opens the matrix/vector storage panel |
| 3 | STATISTICS | 1-var stats; linear/quadratic/exponential/power regression |
| 4 | DISTRIBUTION | Normal (pdf/cdf/inv) and Binomial (pdf/cdf) |


---

## Distribution panel

Open via **MODE -> 4 DISTRIBUTION**.

### Normal tab

Set the distribution parameters:

| Field | Description |
|-------|-------------|
| μ (mean) | Center of the distribution (default 0) |
| σ (std dev) | Spread; must be > 0 (default 1) |

Then pick a function:

| Function | Input | Result |
|----------|-------|--------|
| pdf | x | Probability density at x |
| cdf | x | P(X ≤ x); the complement P(X > x) is also shown |
| inv | p (0 to 1) | x such that P(X ≤ x) = p (inverse cdf) |

Press **Compute** to evaluate.

### Binomial tab

Set the distribution parameters:

| Field | Description |
|-------|-------------|
| n (trials) | Number of trials; positive integer |
| p (prob) | Probability of success per trial (0 to 1) |

Then pick a function:

| Function | Input | Result |
|----------|-------|--------|
| pdf | k | P(X = k) -- probability of exactly k successes |
| cdf | k | P(X ≤ k) -- probability of at most k successes |

k is automatically floored to the nearest integer. Large n values are supported via log-space calculation.

---

## Equation panel

Open via **MODE -> 1 EQUATION**.

### Polynomial roots

1. Select the degree (1 through 10) using the degree buttons.
2. Enter the coefficients from highest degree to lowest. Empty cells default to 0.
3. Press **Solve**.

Roots appear below, labeled x₁, x₂, etc. Real roots show as a decimal; complex roots show as `a + bi` or `a - bi`.

The leading coefficient (highest degree) cannot be zero. Degree 1 and 2 use closed-form formulas. Degree 3 and above use companion-matrix eigenvalues; highly degenerate or pathological polynomials may fail to converge.

### Linear system (Ax = b)

1. Select the system size: 2x2, 3x3, 4x4, or 5x5.
2. Fill in the augmented matrix [A | b]. Each row represents one equation; the rightmost column is the right-hand side.
3. Press **Solve**.

The solution x₁, x₂, ... appears below. If the system has no unique solution (singular or dependent equations), an error message is shown instead.

---

## Statistics panel

Open via **MODE -> 3 STATISTICS**.

### 1-Variable tab

Enter x values in the data list (one per row). Empty rows are ignored. Press **Compute** to get:

| Result | Description |
|--------|-------------|
| n | Count of valid entries |
| Σx | Sum |
| Σx² | Sum of squares |
| x̅ | Mean |
| Median | Middle value (P50) |
| Mode | Most frequent value(s); "none" if all unique |
| Q1 / Q3 | Lower / upper quartile (P25 / P75, linear interpolation) |
| IQR | Interquartile range (Q3 - Q1) |
| Range | Max - Min |
| σ | Population standard deviation |
| σ² | Population variance |
| s | Sample standard deviation |
| s² | Sample variance |
| CV | Coefficient of variation (s / x̅); — when mean is zero |
| SEM | Standard error of mean (s / √n); — for n = 1 |
| Skewness | Adjusted Fisher-Pearson skewness; — for n < 3 |
| Kurtosis | Excess kurtosis (Fisher); — for n < 4 |
| Min / Max | Smallest / largest value |

Fixed percentiles P10, P25, P50, P75, P90 are shown below the main stats. Press **+ Add percentile** to add a custom Pn query (enter any value 0-100); press **×** to remove it.

### 2-Variable tab

Enter (x, y) pairs. Select a regression model, then press **Compute**.

| Model | Equation | Notes |
|-------|----------|-------|
| Linear | y = a + bx | Always available |
| Quadratic | y = a + bx + cx² | Needs 3+ points |
| Exponential | y = a·e^(bx) | Requires all y > 0 |
| Power | y = a·x^b | Requires all x > 0 and y > 0 |

Results include the fitted equation, coefficients a, b (and c for quadratic), r (where applicable), and r².

### k-Variable tab

Multiple linear regression with 2 to 5 predictors: y = b₀ + b₁x₁ + b₂x₂ + ... + bₖxₖ

1. Choose the number of predictors (2, 3, 4, or 5) using the buttons at the top.
2. Enter one data point per row: fill in x₁, x₂, ..., xₖ, then y.
3. Press **Compute**.

Results show the fitted equation, each coefficient b₀ through bₖ, R², and adjusted R².

At least k+2 data points are required. If predictors are collinear (one is a linear combination of others), the design matrix is singular and an error is returned.

### Data entry

- Use **+ Add rows** to extend the list.
- Click the **x** button on any row to remove it.
- Rows with blank or non-numeric values are silently ignored when computing.

---

## Matrix / Vector panel

Open via **MODE -> 2 MATRIX / VECTOR**.

### Storing a matrix

1. Click a slot button (A through J) to select it.
2. Set the number of rows and columns using the dropdowns (1-4 each).
3. Fill in the cells. Empty cells are treated as 0.
4. Press **Store to X** to save.

### Storing a vector

Set rows to **1** and columns to the number of components. A 1-row slot is automatically treated as a vector for OPS functions (dot, norm, cross). Store `[1, 2, 3]` as a 1x3 slot, for example.

### Slot buttons

- **Amber border** - slot has stored data.
- **Active (teal background)** - currently selected slot.
- **Recall** - appears when the slot has data; loads the stored values into the grid editor.
- **Clear** - removes the stored data from the slot.

### Using stored variables in expressions

Type `inv(A)`, `A*B`, `det(A)`, `transpose(B)`, `A-B`, `2*C` directly in the main math field, or use the ALPHA keys to insert variable names. Press **=** to evaluate.

---

## OPS panel

Press **OPS** to open the operations menu. Click an operation to insert it into the math field, then fill in the arguments and press **=**.

### Convert tab

| Operation | Description |
|-----------|-------------|
| fromDMS | Degrees/minutes/seconds to decimal degrees: `fromDMS(d, m, s)` |
| toDMS | Decimal degrees to D°M'S" string: `toDMS(x)` |

**Key sequences:**

1. `fromDMS(45, 30, 0)` - press `=` - result is `45.5`
2. `fromDMS(12, 30, 45)` - press `=` - result is approximately `12.5125`
3. `toDMS(45.5)` - press `=` - result is `45°30'0"`
4. `sin(fromDMS(30, 0, 0))` in DEG mode - press `=` - result is `0.5`

The **DMS** toggle on the result line is a shortcut for the common case: evaluate any expression that returns a real number, then press **DMS** to reformat the result without re-entering it.

### Math tab

| Operation | Description |
|-----------|-------------|
| abs | Absolute value (real numbers) or complex magnitude |
| mod | Remainder after division: `mod(a, b)` |
| floor | Round down to nearest integer |
| ceil | Round up to nearest integer |
| round | Round to nearest integer |
| sign | Sign of a number: -1, 0, or 1 |

**Percentage vs modulo:** `%` (ALPHA+×) means divide by 100 -- `50%` evaluates to 0.5. For integer remainder use `mod(a, b)` from the Math tab.

### Matrix tab

| Operation | Description | Requires |
|-----------|-------------|----------|
| inv | Matrix inverse | Square matrix (2x2, 3x3, ...) |
| det | Determinant | Square matrix |
| trace | Sum of diagonal elements | Square matrix |
| transpose | Transpose rows and columns | Any matrix |
| size | Dimensions [rows, cols] | Any matrix |

### Vector tab

| Operation | Description | Requires |
|-----------|-------------|----------|
| dot | Dot product | Two vectors of the same length |
| cross | Cross product | Two vectors of exactly 3 components |
| norm | Magnitude / length | Any vector |

Vectors can be stored as 1-row slots (e.g. slot C at 1x3) or entered inline as `[1, 2, 3]`. Cross product requires 3-component vectors specifically.

### Complex tab

| Operation | Description |
|-----------|-------------|
| polar | Build complex from polar: `polar(r, θ)` -- angle follows DEG/RAD mode |
| abs | Magnitude of a complex number |
| arg | Argument (angle) -- follows DEG/RAD mode |
| conj | Complex conjugate: a+bi → a-bi |
| re | Real part |
| im | Imaginary part |

---

## Graph panel

Press **GRAPH** (bottom mod row, rightmost key) to open the graph panel.

The panel plots explicit functions y = f(x) and implicit curves F(x,y) = 0 on a canvas. It opens with f(x) = sin(x) and standard window settings already plotted.

### Function inputs

Any number of functions can be plotted. A 10-color palette (teal, red, amber, blue, purple, cyan, orange, green, dark red, indigo) repeats for additional functions.

- Press **+ add function** to add another input row.
- Press **×** on a row to remove that function. The last remaining row cannot be removed.
- Press **●/○** on a row to show or hide that curve without removing it. Hidden functions are dimmed and excluded from the plot.
- Press **Enter** in any input or click **plot** to redraw.

**Explicit functions** use x as the variable (e.g. `sin(x)`, `x^3 - 2x`, `1/x`). The label shows `f(x)`.

**Implicit equations** contain y or an `=` sign (e.g. `x^2 + y^2 = 4`, `x^2/4 + y^2/9 = 1`). The label changes to `f(x,y)`. The curve is plotted using marching squares. `y = sin(x)` is treated as explicit (the RHS is extracted automatically).

### Zoom and pan

| Gesture | Action |
|---------|--------|
| Scroll wheel | Zoom in/out centered on cursor |
| Trackpad two-finger swipe | Pan (left/right/up/down) |
| Trackpad pinch | Zoom in/out centered on pinch midpoint |
| Click and drag | Pan |
| Touch one-finger drag | Pan |
| Touch two-finger pinch | Zoom |

Grid lines and axis labels rescale automatically (`niceStep`) so they stay readable at any zoom level. Implicit curves render at reduced resolution during the gesture and sharpen when you release.

### Crosshair inspection

Move the mouse over the graph to show a crosshair at the cursor x position:

- A dashed vertical line spans the full height at x = cursor.
- For each explicit curve at that x: a dot appears at (x, y) with a dashed horizontal line and a `(x, y)` label in the curve color.
- For each implicit curve: the plotter sweeps the y range to find all intersection points and marks each one the same way.
- **Click** to lock the crosshair in place (line turns amber). Click again to release and resume hover tracking. In split view, the locked line appears on all subplots at the same x.

### Trace mode

Press **T** (keyboard) or the **TRACE** button to enter trace mode. A cursor snaps to the first visible explicit curve.

| Key | Action |
|-----|--------|
| ← → | Step left/right along the curve |
| ↑ ↓ | Switch to the previous/next explicit curve |
| Escape or T | Exit trace mode |

The coordinate badge at the top of the graph shows `x=... y=...` for the current trace point. Moving the mouse also repositions the trace cursor. Zoom and pan are disabled while trace mode is active. Trace is cleared on any replot.

### Combined vs. split view

The **combined / split** toggle (in the window settings row) controls how functions are displayed:

- **combined** (default): all visible functions share one canvas, overlaid.
- **split**: each visible function gets its own subplot in a 2-column grid. Subplots share the same window settings. Scroll down if there are more subplots than fit on screen.

### Window settings

| Field | Default | Meaning |
|-------|---------|---------|
| Xmin  | -10     | Left edge of the x-axis |
| Xmax  | 10      | Right edge of the x-axis |
| Ymin  | -6.2    | Bottom edge of the y-axis |
| Ymax  | 6.2     | Top edge of the y-axis |
| Xscl  | 1       | Spacing of vertical grid lines and x-axis tick marks |
| Yscl  | 1       | Spacing of horizontal grid lines and y-axis tick marks |

All six fields are editable. Press **Enter** in any field or click **plot** to apply the new window.

The **1:1** button (next to the split toggle) adjusts Ymin/Ymax so that one math unit covers the same number of pixels in both axes. Use this to make circles appear circular rather than elliptical when the canvas is not square.

**Example - zoom in on sin(x) near the origin:**

```
Xmin: -3.14    Xmax: 3.14
Ymin: -1.2     Ymax: 1.2
Xscl: 1        Yscl: 0.5
```

**Example - unit circle:**

```
Expression: x^2 + y^2 = 1
Xmin: -2  Xmax: 2  then click 1:1 to equalize y scale
```

### Angle mode

The **DEG** or **RAD** badge in the panel header shows the active angle mode. Trig functions in the expression use that mode. Switch the mode with the **DRG** key before opening the panel (or close, switch, and reopen).

### Discontinuities

The plotter detects large vertical jumps between consecutive samples and lifts the pen rather than drawing a spike. Functions like `tan(x)` and `1/x` display gaps at their asymptotes.

---

## Table mode

Open via **MODE -> 5 TABLE**.

Enter an expression for f(x), an optional second expression for g(x), and a start, end, and step value. Press **go** to generate the table.

| Field | Description |
|-------|-------------|
| f(x)  | Required. Any expression in x. |
| g(x)  | Optional second function. Leave blank for a single-column table. |
| Start | First x value (inclusive). |
| End   | Last x value (inclusive within floating-point tolerance). |
| Step  | Increment between rows. Must be positive. |

Up to 500 rows are generated. The table scrolls vertically with sticky column headers.

**Examples:**

- f(x) = `x^2`, start = `-5`, end = `5`, step = `1` - 11 rows of perfect squares
- f(x) = `sin(x)`, g(x) = `cos(x)`, start = `0`, end = `360`, step = `30` - trig values in DEG mode (note: the table uses math.js directly, so use `sin(x * pi / 180)` for degree input, or switch to RAD mode before opening)

---

## BASE key

Press **BASE** (top modifier row, next to DRG) to cycle through base modes: DEC -> HEX -> OCT -> BIN -> DEC.

- The status bar updates immediately: **HEX**, **OCT**, or **BIN** appears next to DEG/RAD when a non-decimal base is active.
- The current result is reformatted in the new base as soon as you press BASE - no need to press = again.
- The screen, math field, and keypad are unchanged - everything works exactly as in decimal mode.
- Press BASE again to cycle to the next base.

**Digit validation:** when a non-decimal base is active, pressing = validates the expression before evaluating:

| Mode | Invalid digits |
|------|----------------|
| BIN | 2 3 4 5 6 7 8 9 |
| OCT | 8 9 |
| HEX | none (0-9 are all valid hex digits) |

Typing `5 + 6` in BIN mode and pressing = shows an error: `'5' is not a valid digit in BIN mode`.

---

## BASE-N panel

Press **BASE-N** (bottom mod row) to open the Base-N panel. It has two tabs: Numbers and K-map.

### Numbers tab

The **base selector** (DEC / HEX / OCT / BIN) at the top switches the global base mode, same as the BASE button.

**Expression evaluator:** type any integer expression in the input field and press **Evaluate** or Enter.

| Operator | Description |
|----------|-------------|
| + - * / | Arithmetic (integer division truncates) |
| % | Remainder |
| AND or & | Bitwise AND |
| OR or \| | Bitwise OR |
| XOR or ^ | Bitwise XOR |
| NOT or ~ | Bitwise complement (64-bit) |
| << >> | Left / logical right shift |
| ( ) | Grouping |

The result is shown in all four bases. The row matching the active base is highlighted:

```
BIN   1 1111 1111
OCT   377
DEC   255
HEX   FF     <- highlighted when HEX is active
```

Numbers are arbitrary-precision (BigInt) - no overflow.

### K-map tab - Karnaugh map minimization

1. Choose the number of variables (2-8) using the buttons at the top.
2. Click cells to cycle their value: **0** (output = 0), **1** (output = 1), **X** (don't care).
3. Press **Minimize**.

For 2-6 variables a Gray-code grid is shown. For 7-8 variables a flat scrollable minterm list is used (128 or 256 cells).

The result is a minimal sum-of-products (SOP) expression. Variables are named A-H. Complemented literals use an apostrophe: `A'`, `BC'`, etc.

**Examples:**
- 2-var: m1 and m3 set to 1 -> `B`
- 3-var: m0-m3 set to 1 -> `A'`
- All cells 1 -> `1`
- No cells 1 -> `0`
- Don't-care (X) cells can be used by the minimizer but are not required to be covered

---

## CONST panel

Press **CONST** to open the constants library.

- Pick a category from the tabs (Math, Universal, Electromagnetic, Atomic, Thermodynamic).
- Click a constant to insert its numeric value into the math field.
- Press **close** to dismiss without inserting.

---

## CONV panel (unit converter)

Press **CONV** to open the converter.

1. Select a category (Length, Mass, Temperature, etc.).
2. Type a value in the number field.
3. Pick the **from** unit and the **to** unit.
4. The converted result appears as you type.

The result is not inserted into the math field.

---

## SOLVE panel

Press **SOLVE** to find roots of f(x) = 0.

1. Type your function in the **f(x)** field (e.g. `x^2 - 2`).
2. Choose a method: Newton-Raphson, Secant, or Bisection.
3. Enter a starting point (x0) or interval (a, b for bisection).
4. Press **solve**.

The iteration table shows how the method converged.

**Tips:**
- Newton-Raphson needs a good starting guess near the root.
- Bisection requires f(a) and f(b) to have opposite signs.
- If Newton fails (derivative is zero), switch to secant or bisection.

---

## Calculus panel

Press **d/dx** for derivatives or **integral dx** for integrals.

### Derivative

1. Enter f(x).
2. Enter the x value.
3. Press **compute**.

Returns a numeric approximation using the central difference method.

### Integral

1. Enter f(x).
2. Enter lower and upper bounds.
3. Press **compute**.

Returns a numeric approximation using Simpson's rule with 200 subintervals.

---

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| Undefined variable or function | Name not recognized | Check spelling; matrix variables need a stored value |
| Incomplete expression | Missing closing parenthesis or trailing operator | Complete the expression |
| Enter the root degree | Pressed = with the nth root index unfilled | Click the index box and type a number |
| Enter the radicand | nth root index is filled but radicand is empty | Tab into the radicand and type a value |
| Dimension mismatch | Matrix sizes incompatible for the operation | Check that matrix dimensions are compatible |
| cross() requires 3-component vectors | cross called on 2D or other non-3D vectors | Store or enter vectors as 1x3 |
| Matrix must be square | det or inv called on a non-square matrix | Use a 2x2, 3x3, etc. slot |
| Math error: division by zero | Expression divides by zero | Check the denominator |
| 'X' is not a valid digit in BIN/OCT mode | Expression contains a digit outside the active base | Use only 0-1 in BIN, 0-7 in OCT |

**Result shows `-inf`** - the input is outside the function's domain (e.g. `log(0)`). This is a math domain issue, not a calculator bug.
