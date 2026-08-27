# GraphN² User Guide

**Browser-based graphing scientific calculator**
https://graph.nsquaredcreative.ca

---

## Contents

1. [Getting Started](#1-getting-started)
2. [Display and Input](#2-display-and-input)
3. [Basic Calculations](#3-basic-calculations)
4. [Scientific Functions](#4-scientific-functions)
5. [Angle Mode](#5-angle-mode)
6. [Complex Numbers](#6-complex-numbers)
7. [Memory (STO / RCL)](#7-memory-sto--rcl)
8. [Base Mode](#8-base-mode)
9. [Equation Mode](#9-equation-mode)
10. [Matrix and Vector Mode](#10-matrix-and-vector-mode)
11. [Statistics Mode](#11-statistics-mode)
12. [Distribution Mode](#12-distribution-mode)
13. [Table Mode](#13-table-mode)
14. [Base-N Panel](#14-base-n-panel)
15. [Graph Panel: 2D](#15-graph-panel-2d)
16. [Graph Panel: 3D](#16-graph-panel-3d)
17. [OPS Panel](#17-ops-panel)
18. [Constants Panel](#18-constants-panel)
19. [Unit Conversion Panel](#19-unit-conversion-panel)
20. [Solve Panel](#20-solve-panel)
21. [Calculus Panel](#21-calculus-panel)
22. [Error Reference](#22-error-reference)

---

## 1. Getting Started

### Layout

The calculator is arranged top to bottom:

```
┌────────────────────────┐
│  Status bar            │  DEG/RAD  SHIFT  ALPHA  base mode  memory slots
│  Math input field      │  Editable expression; results look like printed math
│  Result line           │  Latest answer (right-aligned); errors in red
│  History strip         │  Last 100 expressions; click any to restore
├────────────────────────┤
│  Top modifier row      │  SHIFT  ALPHA  MODE  DRG  BASE
│  Keypad rows           │  Scientific functions, digits, operators
│  Bottom modifier row   │  CONST  CONV  SOLVE  d/dx ∫  OPS  BASE-N  GRAPH
└────────────────────────┘
```

### Opening panels

- **MODE**: opens the mode menu (Equation, Matrix, Statistics, Distribution, Table)
- **CONST / CONV / SOLVE / OPS / BASE-N / GRAPH**: opens the corresponding overlay panel
- **d/dx ∫**: opens the Calculus panel

Press **close** (top-right of any panel) to return to the main calculator.

### Key layers

Each key has up to three functions printed on it:

```
  sin⁻¹    csc          ← SHIFT label (orange)  /  ALPHA label (teal)
    sin                  ← primary label
```

| Layer | How to activate | Status bar indicator |
|-------|-----------------|----------------------|
| Primary | Press the key directly | (none) |
| SHIFT | Press **SHIFT**, then the key | SHIFT lights up amber |
| ALPHA | Press **ALPHA**, then the key | ALPHA lights up teal |

SHIFT and ALPHA cancel automatically after one key press. Press them again to cancel without pressing another key.

---

## 2. Display and Input

### Math field

Click anywhere in the math field to position the cursor. The keypad inserts math at the cursor.

- **DEL**: deletes the character or structure to the left of the cursor
- **AC**: clears the entire expression and resets the result to 0

### MATH / LINE display toggle

Press the **MATH** button (in the display row, left side) to switch between:

- **MATH mode**: fractions stack vertically, roots show a vinculum, exponents sit above the baseline. This is the default.
- **LINE mode**: everything on one line as plain text. Useful for copying expressions.

The button shows the active mode and toggles on each press.

### Status bar

The top strip of the display shows calculator state at a glance:

| Indicator | Meaning |
|-----------|---------|
| **DEG** (bold) | Degree mode active |
| **RAD** (bold) | Radian mode active |
| **SHIFT** (amber) | SHIFT layer active; next key uses its orange function |
| **ALPHA** (teal) | ALPHA layer active; next key uses its teal function |
| **HEX / OCT / BIN** (teal) | Base mode is non-decimal; integer results reformat to the active base |
| Teal letters (K-T) | Memory slots that have stored values |
| **STO** (amber) | Store mode active; press a digit to store the current result |
| **RCL** (teal) | Recall mode active; press a digit to insert the slot variable |

When the base is decimal (DEC), no base indicator appears. When you press BASE to cycle to HEX, OCT, or BIN, the status bar shows the active base in teal. Press BASE again to return to DEC and the indicator disappears.

### Result line

After pressing **=**, the result appears right-aligned on the result line.

| Result type | Display | Extra toggle |
|-------------|---------|--------------|
| Real number | Decimal | **DMS** button (converts to D°M'S") |
| Complex number | `a + bi` | **RECT / POLAR** button |
| Matrix | `[a  b] / [c  d]` | - |
| Error | Red message | - |

### DMS display

After evaluating any real-number result, a **DMS** button appears on the left side of the result line. Press it to reformat the result as degrees, minutes, and seconds (e.g. `45.5` → `45°30'0"`). Press again to return to decimal.

### Ans

**Ans** holds the result of the most recent successful evaluation. Press the **Ans** key to insert it into the next expression.

**Example: chaining calculations:**
1. Type `25` → press `[=]` → result: `25`
2. Type `sqrt(` → press `[Ans]` → type `)` → press `[=]` → result: `5`

---

## 3. Basic Calculations

### Arithmetic operators

| Press | Operation | Example | Result |
|-------|-----------|---------|--------|
| `+` | Addition | `3 + 4` | `7` |
| `-` | Subtraction | `10 - 6` | `4` |
| `×` | Multiplication | `6 × 7` | `42` |
| `/` | Division (fraction bar) | `1 / 4` | `0.25` |
| `( )` | Parentheses | `(2 + 3) × 4` | `20` |

### Powers and roots

| Press | Inserts | Example | Result |
|-------|---------|---------|--------|
| `x²` | square | `7 x²` | `49` |
| `SHIFT x²` | cube | `3 SHIFT x²` | `27` |
| `x^y` | power | `2 x^y 10` | `1024` |
| `sqrt` | square root | `sqrt(144)` | `12` |
| `SHIFT sqrt` | nth root | `SHIFT sqrt` → type `3`, Tab, type `8` | `2` |

**Nth root procedure:**
1. Press `[SHIFT]` → `[sqrt]`
2. Type the root degree (e.g. `3` for cube root)
3. Press Tab or the right-arrow to move into the radicand
4. Type the value (e.g. `27`)
5. Press `[=]` → `3`

### Percentage

`ALPHA + ×` inserts a `%` suffix. `50%` evaluates to `0.5`. For the remainder operation, use `mod(a, b)` from the OPS panel.

### Order of operations

Standard mathematical precedence applies: exponents before multiplication/division before addition/subtraction. Use parentheses to override.

**Example:**
- `2 + 3 × 4` → `14`
- `(2 + 3) × 4` → `20`

---

## 4. Scientific Functions

### Trigonometry

| Press | Function | SHIFT (orange) | ALPHA (teal) |
|-------|----------|----------------|--------------|
| `sin` | sin( | sin⁻¹( | csc( |
| `cos` | cos( | cos⁻¹( | sec( |
| `tan` | tan( | tan⁻¹( | cot( |

Close the parenthesis after entering the argument.

**Example: sin(30°) in DEG mode:**
1. Confirm status bar shows **DEG**
2. Type `sin(30)` → press `[=]` → `0.5`

**Example: angle whose sine is 0.5:**
1. Press `[SHIFT]` → `[sin]` (inserts sin⁻¹)
2. Type `0.5)` → press `[=]` → `30` (in DEG mode)

### Hyperbolic functions

| Press | Function | SHIFT |
|-------|----------|-------|
| `sinh` | sinh( | sinh⁻¹( (asinh) |
| `cosh` | cosh( | cosh⁻¹( (acosh) |
| `tanh` | tanh( | tanh⁻¹( (atanh) |

Hyperbolic functions are not affected by angle mode.

**Example: verify sinh(1) ≈ 1.1752:**
- Type `sinh(1)` → press `[=]` → `1.175201194`

### Logarithms and exponentials

| Press | Function | SHIFT | ALPHA |
|-------|----------|-------|-------|
| `log` | log₁₀( | 10^x box | logbase( |
| `ln` | ln( | e^x box | - |
| `e` | Euler's number | - | - |
| `π` | Pi | - | - |

**Example: log base 2 of 64:**
1. Press `[ALPHA]` → `[log]` (inserts logbase)
2. Type `2`, press Tab, type `64)`
3. Press `[=]` → `6`

**Example: e^3:**
1. Press `[SHIFT]` → `[ln]` (inserts e^x box)
2. Type `3`
3. Press `[=]` → `20.08553692`

### Combinatorics and factorial

| Press | Inserts | Example | Result |
|-------|---------|---------|--------|
| `nCr` | nCr(n, r) | `nCr(10, 3)` | `120` |
| `nPr` | nPr(n, r) | `nPr(5, 2)` | `20` |
| `x!` | ! | `7!` | `5040` |

**Factorial procedure:** type the number first, then press `[x!]`.

---

## 5. Angle Mode

Press **DRG** (top modifier row) to toggle between **DEG** and **RAD**. The active mode is shown in the status bar and takes effect immediately on all trig calculations.

| Mode | Use for |
|------|---------|
| DEG | Everyday angles (0–360°, compass bearings, geometry) |
| RAD | Mathematical analysis, calculus, physics |

**Effect on trig functions:**

| Expression | DEG result | RAD result |
|------------|------------|------------|
| `sin(90)` | `1` | `0.8939966...` |
| `sin(π/2)` | `0.02745...` | `1` |

**Converting between degrees and radians:**
- Degrees to radians: multiply by `π/180`
- Radians to degrees: multiply by `180/π`

**Example: convert 45° to radians:**
- Type `45 × π / 180` → `[=]` → `0.7853981634`

---

## 6. Complex Numbers

The calculator handles complex numbers automatically when a result requires it.

### Entering complex numbers

Press `[SHIFT]` → `[Ans]` to insert **i** (the imaginary unit) into an expression.

**Example: compute (2 + 3i)²:**
- Type `(2 + 3i)²` → `[=]` → `-5 + 12i`

**Example: complex square root:**
- Type `sqrt(-4)` → `[=]` → `2i`

### Rectangular and polar display

When the result is complex, a toggle button appears to the left of the result:

- **RECT**: displays as `a + bi` (default)
- **POLAR**: displays as `r∠θ` where θ follows the current angle mode

Click the button to switch. Switching does not re-evaluate; it only reformats the display.

**Example: polar form of 1 + i (in DEG mode):**
1. Type `1 + 1i` → `[=]` → `1 + 1i`
2. Click **RECT** toggle → `1.414213562∠45°`

### Complex arithmetic

All standard operations work on complex numbers. Use functions from the OPS panel → Complex tab for `re`, `im`, `conj`, `arg`, `abs`, `polar`.

**Example: magnitude of 3 + 4i:**
- Use OPS → Complex → `abs`, type `abs(3 + 4i)` → `[=]` → `5`

---

## 7. Memory (STO / RCL)

The calculator has 10 scalar memory slots: **K through T** (distinct from matrix variables A–J and hex digits A–F).

### Storing a value

1. Evaluate an expression to produce a result.
2. Press `[SHIFT]` → `[AC]`: the status bar shows **STO** in amber.
3. Press a digit key:

| Digit | Slot |
|-------|------|
| 1 | K |
| 2 | L |
| 3 | M |
| 4 | N |
| 5 | O |
| 6 | P |
| 7 | Q |
| 8 | R |
| 9 | S |
| 0 | T |

The STO indicator clears; the stored slot letter appears as a small teal indicator in the status bar.

> **Note:** Pressing any non-digit key while STO is active cancels the store.

### Recalling a value

1. Press `[ALPHA]` → `[AC]`: the status bar shows **RCL** in teal.
2. Press a digit (1–9 or 0) to insert that slot's variable name into the expression.
3. Build and evaluate the full expression as normal.

### Full worked example

**Compute the hypotenuse of a 3-4-5 right triangle using memory:**
1. Type `3² + 4²` → `[=]` → `25`
2. `[SHIFT]` → `[AC]` → `[1]` → stores `25` into slot **K**
3. Press `[AC]` to clear the field
4. Type `sqrt(` → `[ALPHA]` → `[AC]` → `[1]` → inserts **K** → type `)` → `[=]` → `5`

---

## 8. Base Mode

Press **BASE** (top modifier row, next to DRG) to cycle:

**DEC → HEX → OCT → BIN → DEC**

The status bar shows the active base when non-decimal (HEX, OCT, or BIN). Integer results reformat immediately when the base changes. The math field, screen, and keypad work the same in all bases.

### Digit validation

When a non-decimal base is active, pressing `[=]` validates the expression first:

| Mode | Invalid digits |
|------|----------------|
| BIN | 2 3 4 5 6 7 8 9 |
| OCT | 8 9 |
| HEX | none (A–F are valid) |

**Example: convert 255 to hex:**
1. Type `255` → `[=]` → result: `255`
2. Press `[BASE]` until **HEX** appears → result reformats to `FF`

**Example: binary addition:**
1. Press `[BASE]` until **BIN** appears
2. Type `1010 + 110` → `[=]` → `10000` (= 16 in decimal)

---

## 9. Equation Mode

Press `[MODE]` → select **1 EQUATION**.

### Polynomial roots

Finds all roots (real and complex) of aₙxⁿ + … + a₁x + a₀ = 0.

**Procedure:**
1. Select the degree (1–10) using the degree buttons.
2. Enter the coefficients from the highest degree down. Leave unused boxes as `0`.
3. Press **Solve**.

Results appear below: `x₁`, `x₂`, … as real decimals or `a ± bi`.

**Example: roots of x² − 5x + 6 = 0:**
1. Select degree **2**.
2. Coefficients: `1`, `−5`, `6`
3. Press **Solve** → `x₁ = 3`, `x₂ = 2`

**Example: roots of x³ − 6x² + 11x − 6 = 0:**
1. Select degree **3**.
2. Coefficients: `1`, `−6`, `11`, `−6`
3. Press **Solve** → `x₁ = 3`, `x₂ = 2`, `x₃ = 1`

> **Note:** The leading coefficient (highest degree) cannot be zero. Degree 1–2 use closed-form formulas. Degree 3 and above use companion-matrix eigenvalues and may not converge for pathological polynomials.

### Linear system (Ax = b)

Solves systems of 2–5 simultaneous linear equations.

**Procedure:**
1. Select the system size: **2×2**, **3×3**, **4×4**, or **5×5**.
2. Fill in the augmented matrix [A | b]. Each row is one equation; the rightmost column is the right-hand side.
3. Press **Solve**.

**Example: solve the 2×2 system: 2x + y = 5, x − y = 1:**
1. Select **2×2**.
2. Row 1: `2`, `1`, `5`; Row 2: `1`, `−1`, `1`
3. Press **Solve** → `x₁ = 2`, `x₂ = 1`

> **Note:** If the system has no unique solution (singular or dependent equations), an error message is shown.

---

## 10. Matrix and Vector Mode

Press `[MODE]` → select **2 MATRIX / VECTOR**.

### Storing a matrix

1. Click a slot button (**A** through **J**) to select it. A slot with stored data has an amber border.
2. Set rows and columns (1–4 each) using the dropdowns.
3. Fill in the cells. Empty cells are treated as 0.
4. Press **Store to X** (where X is the selected slot letter).

### Storing a vector

Set rows to **1** and columns to the number of components. A 1×N slot becomes a vector and supports `dot`, `norm`, and `cross` operations.

**Example: store [1, 2, 3] as a vector in slot C:**
1. Select slot **C**; set rows = 1, cols = 3.
2. Enter `1`, `2`, `3` in the cells.
3. Press **Store to C**.

### Using stored variables in expressions

Type variable names directly in the math field, or use `[ALPHA]` + digit (1–9, 0 for A–J) to insert them. Press `[=]` to evaluate.

**Example: multiply matrices A and B:**
1. Store a 2×2 matrix in slot **A** and a 2×2 matrix in slot **B**.
2. In the math field, type `A × B` (or use ALPHA keys).
3. Press `[=]` → result matrix.

### Matrix operations

| Expression | Operation | Requirement |
|------------|-----------|-------------|
| `A × B` | Matrix multiply | Inner dimensions must match |
| `inv(A)` | Inverse | Square matrix |
| `det(A)` | Determinant | Square matrix |
| `trace(A)` | Trace | Square matrix |
| `transpose(A)` | Transpose | Any matrix |
| `size(A)` | Dimensions [rows, cols] | Any matrix |

**Example: find the determinant of a 3×3 matrix:**
1. Store the matrix in slot **A**.
2. Type `det(A)` → `[=]` → scalar result.

### Vector operations

| Expression | Operation | Requirement |
|------------|-----------|-------------|
| `dot(C, D)` | Dot product | Both same length |
| `cross(C, D)` | Cross product | Both 1×3 |
| `norm(C)` | Magnitude | Any vector |

**Example: angle between two vectors using dot product:**
1. Store `[1, 0, 0]` in slot **C** (1×3) and `[1, 1, 0]` in slot **D** (1×3).
2. Type `acos(dot(C, D) / (norm(C) × norm(D)))` → `[=]` → `45` (DEG mode)

---

## 11. Statistics Mode

Press `[MODE]` → select **3 STATISTICS**.

### 1-Variable statistics

**Procedure:**
1. Select the **1-Var** tab.
2. Enter x values in the data list, one per row. Press **+ Add rows** for more rows. Click **×** on a row to remove it.
3. Press **Compute**.

**Computed statistics:**

| Statistic | Description |
|-----------|-------------|
| n | Count of valid entries |
| Σx, Σx² | Sum, sum of squares |
| x̄ | Mean |
| Median | Middle value (P50) |
| Mode | Most frequent value(s) |
| Q1, Q3 | Lower/upper quartile (P25, P75) |
| IQR | Interquartile range |
| Range | Max − Min |
| σ, σ² | Population standard deviation and variance |
| s, s² | Sample standard deviation and variance |
| CV | Coefficient of variation (s / x̄) |
| SEM | Standard error of the mean |
| Skewness | Adjusted Fisher-Pearson skewness |
| Kurtosis | Excess (Fisher) kurtosis |
| Min, Max | Smallest and largest values |

Fixed percentiles P10/P25/P50/P75/P90 are shown. Press **+ Add percentile** to query any custom Pn.

**Example: find mean and standard deviation of 2, 4, 4, 4, 5, 5, 7, 9:**
1. Enter the 8 values in 1-Var data list.
2. Press **Compute** → x̄ = `5`, σ = `2`

### 2-Variable regression

**Procedure:**
1. Select the **2-Var** tab.
2. Enter (x, y) pairs; select a regression model.
3. Press **Compute**.

| Model | Equation | Notes |
|-------|----------|-------|
| Linear | y = a + bx | Always available |
| Quadratic | y = a + bx + cx² | Needs ≥ 3 points |
| Exponential | y = a·eᵇˣ | Requires all y > 0 |
| Power | y = a·xᵇ | Requires all x > 0 and y > 0 |

Results include the fitted equation, coefficients, r (correlation), and r².

**Example: linear fit for (1, 2.1), (2, 3.9), (3, 6.2), (4, 7.8):**
1. Enter the four (x, y) pairs.
2. Select **Linear** → Compute → a ≈ `0.23`, b ≈ `1.92`, r ≈ `0.999`

### Multiple linear regression (k-Variable)

**Procedure:**
1. Select the **k-Var** tab.
2. Choose the number of predictors (2–5).
3. Enter one data point per row: x₁, x₂, …, xₖ, then y.
4. Press **Compute**.

Returns b₀ through bₖ, R², and adjusted R². Requires at least k + 2 data points.

---

## 12. Distribution Mode

Press `[MODE]` → select **4 DISTRIBUTION**.

### Normal distribution

Set parameters **μ** (mean, default 0) and **σ** (std dev, default 1).

| Function | Input | Output |
|----------|-------|--------|
| pdf | x | Probability density at x |
| cdf | x | P(X ≤ x); complement P(X > x) also shown |
| inv | p ∈ (0,1) | x such that P(X ≤ x) = p |

**Example: P(X ≤ 1.96) for standard normal:**
1. μ = `0`, σ = `1`.
2. Select **cdf**, enter x = `1.96`.
3. Press **Compute** → P(X ≤ 1.96) ≈ `0.975002`

**Example: find the 99th percentile:**
1. Select **inv**, enter p = `0.99`.
2. Press **Compute** → `2.326347874`

### Binomial distribution

Set parameters **n** (trials, positive integer) and **p** (probability per trial, 0–1).

| Function | Input | Output |
|----------|-------|--------|
| pdf | k | P(X = k); exactly k successes |
| cdf | k | P(X ≤ k); at most k successes |

**Example: P(X = 3) with n=10, p=0.3:**
1. n = `10`, p = `0.3`.
2. Select **pdf**, enter k = `3`.
3. Press **Compute** → `0.2668279...`

**Example: P(X ≤ 5) with n=20, p=0.4:**
1. n = `20`, p = `0.4`.
2. Select **cdf**, enter k = `5`.
3. Press **Compute** → `0.1255144...`

> **Note:** Large n values are handled in log-space to avoid overflow.

---

## 13. Table Mode

Press `[MODE]` → select **5 TABLE**.

**Procedure:**
1. Enter an expression for **f(x)**. (Required.)
2. Optionally enter a second expression for **g(x)**.
3. Set **Start**, **End**, and **Step**.
4. Press **go**.

The table generates up to 500 rows. Scroll vertically; column headers stay fixed.

**Example: square and square-root table:**
- f(x) = `x^2`, g(x) = `sqrt(x)`
- Start = `0`, End = `10`, Step = `1`
- Press **go** → 11 rows showing x², √x side by side

**Example: sine and cosine at 30° intervals in DEG mode:**
- f(x) = `sin(x)`, g(x) = `cos(x)`
- Start = `0`, End = `360`, Step = `30`
- Press **go** → 13 rows

> **Note:** The table evaluates using the active angle mode (DEG or RAD). Switch mode with DRG before opening if needed.

---

## 14. Base-N Panel

Press `[BASE-N]` (bottom modifier row) to open the panel.

### Numbers tab

**Base selector**: click DEC / HEX / OCT / BIN to set the global base mode (same as the BASE key).

**Expression evaluator**: type any integer expression and press **Evaluate** or Enter.

Supported operators:

| Operator | Meaning |
|----------|---------|
| `+` `-` `*` `/` | Arithmetic (division truncates) |
| `%` | Remainder |
| `AND` or `&` | Bitwise AND |
| `OR` or `\|` | Bitwise OR |
| `XOR` or `^` | Bitwise XOR |
| `NOT` or `~` | Bitwise complement (64-bit) |
| `<<` `>>` | Left / logical right shift |
| `( )` | Grouping |

The result displays in all four bases simultaneously; the active base row is highlighted. Numbers are BigInt; no overflow.

**Mixed-base input:** prefix literals with `0b` (binary), `0x` or `0h` (hex), `0o` (octal), `0d` (decimal) regardless of the active base.

**Example: `0xFF AND 0b11110000` in any base:**
- Type `0xFF AND 0b11110000` → Evaluate → result in all four bases

### K-map tab

Minimizes a Boolean function using Quine-McCluskey.

**Procedure:**
1. Choose the number of variables (2–8).
2. Click cells to cycle: **0** (output = 0) → **1** (output = 1) → **X** (don't care).
3. Press **Minimize** → minimal sum-of-products expression in variables A–H.

For 2–6 variables: a Gray-code grid is shown. For 7–8 variables: a flat scrollable minterm list (128 or 256 cells).

Complemented literals use an apostrophe: `A'`, `BC'D`, etc.

**Example: minimize a 3-variable majority function (output = 1 when ≥ 2 inputs are 1):**
1. Choose **3 variables**.
2. Set cells: m₃=1, m₅=1, m₆=1, m₇=1 (all others 0).
3. Press **Minimize** → `AB + AC + BC`

---

## 15. Graph Panel: 2D

Press `[GRAPH]` (bottom modifier row, rightmost key). The panel opens in **2D** mode with `sin(x)` already plotted.

### Adding functions

- Press **+ add function** to add a row.
- Press **×** on a row to remove it (the last row cannot be removed).
- Press **●/○** to show or hide a function without removing it.
- Press Enter in any input or click **plot** to redraw.

Up to 10 colors cycle automatically (teal, red, amber, blue, purple, …).

### Explicit vs. implicit

| Expression | Type detected | Label |
|------------|---------------|-------|
| `sin(x)`, `x^3 − 2` | Explicit y = f(x) | `f(x)` |
| `x^2 + y^2 = 4` | Implicit F(x,y) = 0 | `f(x,y)` |
| `y = sin(x)` | Explicit (y= form) | `f(x)` |

Implicit curves are rendered using marching squares on a 300×300 grid.

### Window settings

| Field | Default | Meaning |
|-------|---------|---------|
| Xmin | −10 | Left edge |
| Xmax | 10 | Right edge |
| Ymin | −6.2 | Bottom edge |
| Ymax | 6.2 | Top edge |
| Xscl | 1 | Vertical grid line spacing |
| Yscl | 1 | Horizontal grid line spacing |

Edit any field and press **plot** or Enter to apply.

**Buttons:**
- **combined / split**: all functions on one canvas, or each in its own subplot
- **1:1**: adjusts Ymin/Ymax so one math unit = the same pixel count on both axes (makes circles circular)
- **RESET**: restores the default window (−10/10/−6.2/6.2/1/1)
- **FIT**: auto-zooms to where the curves exist

### Zoom and pan

| Gesture | Action |
|---------|--------|
| Scroll wheel | Zoom in/out centered on cursor |
| Ctrl + scroll (or trackpad pinch) | Zoom |
| Trackpad two-finger swipe | Pan |
| Click and drag | Pan |
| Touch one-finger drag | Pan |
| Touch two-finger pinch | Zoom |

### Crosshair inspection

Move the mouse over the canvas to show a crosshair at x = cursor.

- Explicit curves: a dot at (x, y) with a label in the curve color.
- Implicit curves: all intersection points at that x are marked.
- **Click** to lock the crosshair (line turns amber). Click again to release.

### Trace mode

Press `[T]` on the keyboard or the **TRACE** button to enter trace mode.

| Key | Action |
|-----|--------|
| ← → | Step left/right along the curve |
| ↑ ↓ | Switch to the previous/next curve |
| Escape or T | Exit trace mode |

The coordinate badge shows `x = … y = …` for the trace point. For implicit curves, an `[impl]` tag appears and the cursor walks the zero-contour.

**Example: trace a circle:**
1. Enter `x^2 + y^2 = 9`, press **plot**.
2. Press `[T]` to enter trace mode.
3. Press `[←]` / `[→]` to walk around the circle.
4. Press `[↑]` / `[↓]` to switch to another plotted curve.
5. Press `[Esc]` to exit.

**Example: compare two functions:**
1. f1: `sin(x)`, f2: `cos(x)`, press **plot**.
2. Press `[T]` → trace starts on f1.
3. Press `[↓]` to switch to f2.

---

## 16. Graph Panel: 3D

Click the **3D** button in the graph panel header (next to the "Graph" title) to switch to 3D mode. The 2D canvas is replaced by a Three.js WebGL scene. Click **2D** to return; the two modes preserve their states independently.

### Expression types

| Expression | Surface type | Detected by |
|------------|--------------|-------------|
| Any f(x,y) (no z) | Explicit surface z = f(x,y) | absence of z |
| Contains z | Implicit surface F(x,y,z) = 0 | presence of z |

**Explicit surfaces** are sampled on an 80×80 grid over Xmin/Xmax × Ymin/Ymax. Z values are colorized with the viridis colormap (dark purple = low Z, yellow = high Z).

**Implicit surfaces** are extracted by marching cubes over the 3D bounding box. Each surface gets a solid curve color.

### Common surface expressions

| Shape | Expression |
|-------|------------|
| Paraboloid | `x^2 + y^2` |
| Saddle | `x^2 − y^2` |
| Sine wave surface | `sin(x) * cos(y)` |
| Sphere (r = 3) | `x^2 + y^2 + z^2 = 9` |
| Ellipsoid | `x^2/4 + y^2/9 + z^2 = 1` |
| Cone | `x^2 + y^2 = z^2` |
| Torus (R=3, r=1) | `(sqrt(x^2+y^2) − 3)^2 + z^2 = 1` |
| Cylinder (r = 2) | `x^2 + y^2 = 4` |
| Hyperboloid | `x^2 + y^2 − z^2 = 1` |

### Window settings

| Field | Meaning |
|-------|---------|
| Xmin / Xmax | X domain (explicit) or marching cubes X bounds (implicit) |
| Ymin / Ymax | Y domain (explicit) or marching cubes Y bounds (implicit) |
| Zmin / Zmax | Marching cubes Z bounds only; explicit surfaces ignore these |

After plotting an explicit surface, the auto-computed Z range is shown below the window fields.

### Camera controls

| Gesture | Action |
|---------|--------|
| Left-drag | Rotate around target |
| Scroll wheel | Zoom in/out |
| Right-drag | Pan |
| Touch one-finger drag | Rotate |
| Touch pinch | Zoom |

Coordinate system: Z-up. Axes: X = red, Y = green, Z = blue.

### Controls

| Control | Action |
|---------|--------|
| **WIRE** | Toggle wireframe overlay on all surfaces |
| **RESET** | Restore default camera angle |
| **plot** | Evaluate and render all visible functions |

**Example: plot a sphere:**
1. Switch to 3D.
2. Enter `x^2 + y^2 + z^2 = 9`. Set Zmin = `−4`, Zmax = `4`.
3. Press **plot**. Drag to rotate; scroll to zoom.

**Example: compare a bowl and a saddle:**
1. f1: `x^2 + y^2`; f2: `x^2 − y^2`
2. Set Xmin = `−3`, Xmax = `3`, Ymin = `−3`, Ymax = `3`.
3. Press **plot**: both surfaces are plotted simultaneously with viridis coloring.

---

## 17. OPS Panel

Press `[OPS]` (bottom modifier row) to open the operations panel. Click any operation to insert it into the math field, then fill in the arguments and press `[=]`.

### Math tab

| Operation | Description | Example |
|-----------|-------------|---------|
| `abs(x)` | Absolute value or complex magnitude | `abs(−7)` → `7` |
| `mod(a, b)` | Remainder | `mod(17, 5)` → `2` |
| `floor(x)` | Round toward −∞ | `floor(3.7)` → `3` |
| `ceil(x)` | Round toward +∞ | `ceil(3.2)` → `4` |
| `round(x)` | Round to nearest integer | `round(3.5)` → `4` |
| `sign(x)` | Sign: −1, 0, or 1 | `sign(−8)` → `−1` |

### Matrix tab

| Operation | Requirement |
|-----------|-------------|
| `inv(A)` | Square matrix stored in slot A |
| `det(A)` | Square matrix |
| `trace(A)` | Square matrix |
| `transpose(A)` | Any matrix |
| `size(A)` | Any matrix; returns [rows, cols] |

### Vector tab

| Operation | Requirement |
|-----------|-------------|
| `dot(C, D)` | Two vectors, same length |
| `cross(C, D)` | Both 1×3 vectors |
| `norm(C)` | Any vector |

### Complex tab

| Operation | Description |
|-----------|-------------|
| `re(z)` | Real part |
| `im(z)` | Imaginary part |
| `conj(z)` | Conjugate: a+bi → a−bi |
| `abs(z)` | Magnitude |
| `arg(z)` | Argument (angle) in current angle mode |
| `polar(r, θ)` | Build complex from polar; θ follows angle mode |

### Convert tab (DMS)

| Operation | Description | Example |
|-----------|-------------|---------|
| `fromDMS(d, m, s)` | D°M'S" → decimal degrees | `fromDMS(30, 30, 0)` → `30.5` |
| `toDMS(x)` | Decimal degrees → D°M'S" string | `toDMS(30.5)` → `30°30'0"` |

---

## 18. Constants Panel

Press `[CONST]` to open the constants library.

1. Select a tab: **Math**, **Universal**, **Electromagnetic**, **Atomic**, or **Thermodynamic**.
2. Click a constant to insert its numeric value into the math field at the cursor.
3. Press **close** to dismiss without inserting.

**Example: compute the energy of a photon at 500 nm:**
1. Open CONST → Universal → click **c** (speed of light: 2.99792458×10⁸) → inserted
2. Build `h × c / λ` where h is Planck's constant and λ = `500e-9`
3. Press `[=]`

---

## 19. Unit Conversion Panel

Press `[CONV]` to open the converter.

1. Select a category (Length, Mass, Temperature, Speed, etc.).
2. Type a value in the number field.
3. Select the **from** unit and the **to** unit.
4. The converted result updates as you type.

> **Note:** The result is not inserted into the math field.

**Example: convert 100 miles to kilometers:**
- Category: Length → from: `mile` → to: `km` → value: `100` → result: `160.934`

**Example: convert 37°C to Fahrenheit:**
- Category: Temperature → from: `°C` → to: `°F` → value: `37` → result: `98.6`

---

## 20. Solve Panel

Press `[SOLVE]` to find real roots of f(x) = 0.

**Procedure:**
1. Enter f(x) in the **f(x)** field.
2. Choose a method and enter starting values.
3. Press **solve**.

The iteration table shows how the method converged.

### Methods

| Method | Starting input | When to use |
|--------|---------------|-------------|
| Newton-Raphson | x₀ (single guess) | Smooth functions, good initial guess available |
| Secant | x₀, x₁ (two guesses) | When derivative is expensive or unavailable |
| Bisection | a, b (bracket) | When you can bracket the root with opposite signs |

**Example: find √2 as a root of x² − 2 = 0:**
- f(x) = `x^2 − 2`
- Newton-Raphson, x₀ = `1`
- Press **solve** → root ≈ `1.41421356`

**Example: find the root of cos(x) = x (in RAD mode):**
- f(x) = `cos(x) − x`
- Bisection, a = `0`, b = `1`
- Press **solve** → root ≈ `0.73908513` (Dottie number)

---

## 21. Calculus Panel

Press `[d/dx ∫]` (bottom modifier row) to open the calculus panel.

### Numeric derivative

Approximates f′(x) at a given point using the central difference method.

**Procedure:**
1. Enter f(x).
2. Enter the x value.
3. Press **compute**.

**Example: slope of sin(x) at x = π/4 (RAD mode):**
- f(x) = `sin(x)`, x = `pi/4`
- Press **compute** → `0.7071067812` (= cos(π/4))

### Definite integral

Approximates ∫ₐᵇ f(x) dx using Simpson's rule with 200 subintervals.

**Procedure:**
1. Enter f(x).
2. Enter lower and upper bounds.
3. Press **compute**.

**Example: area under sin(x) from 0 to π (RAD mode):**
- f(x) = `sin(x)`, lower = `0`, upper = `pi`
- Press **compute** → `2` (exact)

**Example: ∫₀¹ e^(−x²) dx (Gaussian integral half):**
- f(x) = `e^(−x^2)`, lower = `0`, upper = `1`
- Press **compute** → `0.7468241328`

> **Note:** Simpson's rule is highly accurate for smooth functions but may lose precision near singularities or on very large intervals.

---

## 22. Error Reference

| Message | Cause | Fix |
|---------|-------|-----|
| Undefined variable or function | Name not recognized by the engine | Check spelling; matrix variables need a stored value |
| Incomplete expression | Missing closing parenthesis or operator at end | Complete the expression |
| Enter the root degree | Pressed = with an unfilled nth-root index | Click the index box and type a number |
| Enter the radicand | Root index filled but radicand empty | Tab into the radicand and enter a value |
| Dimension mismatch | Matrix sizes incompatible for the operation | Check that matrix dimensions are compatible |
| cross() requires 3-component vectors | cross called on non-3D vectors | Store or enter vectors as 1×3 |
| Matrix must be square | `det`, `inv`, or `trace` on a non-square matrix | Use a square slot (2×2, 3×3, etc.) |
| Division by zero | Expression divides by zero | Check the denominator |
| 'X' is not a valid digit in BIN/OCT mode | Expression contains a digit outside the base | BIN: use 0–1 only; OCT: use 0–7 only |
| System has no unique solution | Singular or dependent linear system | Check that the equations are independent |
| Did not converge in max iterations | Numerical solver could not converge | Try a different starting point or method |
| f(a) and f(b) must have opposite signs | Bisection bracket does not contain a root | Choose a and b so that f(a) × f(b) < 0 |

**Result shows `−Infinity` or `Infinity`:** the input is outside the function's domain (e.g. `log(0)`, `1/0`). This is a math domain issue, not a calculator error.

**Result shows `NaN`:** the expression produced an undefined value (e.g. `0/0`, `sqrt(−1)` in a real-only context). Use imaginary unit `i` explicitly when working with complex numbers.
