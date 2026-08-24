# User manual

## Overview

Model FX-∞G is a browser-based scientific calculator with textbook-style math input. You type expressions the way they look on paper - fractions stack vertically, roots draw a vinculum, exponents sit above the baseline - and press **=** to evaluate.

---

## The display

```
DEG  RAD  SHIFT  ALPHA        <- status bar
┌─────────────────────────┐
│  sin(30)                │   <- math input field (editable)
│                      0.5│   <- result line
└─────────────────────────┘
```

- **DEG / RAD** - current angle mode. Active one is bright, inactive is dimmed.
- **SHIFT** - lights up when SHIFT is active (next key uses its orange label).
- **ALPHA** - lights up when ALPHA is active (next key uses its teal label).
- The result line shows the last evaluated answer, or an error message in red.

---

## Entering expressions

Click anywhere in the math field to place the cursor. The keypad inserts math at the cursor position.

### Basic arithmetic

| Key | Inserts | Example |
|-----|---------|---------|
| 0-9 | digit | `42` |
| + | + | `2+3` |
| - | - | `10-4` |
| × | multiplication | `3×4` |
| ÷ | fraction bar (cursor goes to numerator) | `1/2` |
| . | decimal point | `3.14` |
| ( ) | parentheses | `(2+3)×4` |

Press **=** to evaluate. The result appears on the right side of the result line.

### Editing

- **DEL** removes the character or structure to the left of the cursor.
- **AC** clears the entire expression and resets the result to 0.

---

## SHIFT and ALPHA keys

Each key has up to three functions:

```
 sin⁻¹  csc       <- SHIFT label (orange, top-left)
                      ALPHA label (teal, top-right)
  sin              <- primary label
```

- Press **SHIFT** once - the SHIFT key lights up amber. The next key you press uses its orange function. SHIFT cancels automatically after one key.
- Press **ALPHA** once - the ALPHA key lights up teal. The next key uses its teal function. ALPHA cancels automatically after one key.
- Press SHIFT or ALPHA again to cancel without pressing another key.

---

## Math functions

### Trig

| Press | Inserts | SHIFT (orange) | ALPHA (teal) |
|-------|---------|----------------|--------------|
| sin | sin( | sin⁻¹ | csc( |
| cos | cos( | cos⁻¹ | sec( |
| tan | tan( | tan⁻¹ | cot( |

Close the parenthesis after entering the argument, or use the **)** key.

**Angle mode matters.** `sin(30)` in DEG mode = 0.5. In RAD mode it gives sin(30 radians). Toggle with the **DRG** key.

### Logarithms and exponentials

| Press | Inserts | SHIFT | ALPHA |
|-------|---------|-------|-------|
| log | log( | 10^■ | log_■( |
| ln | ln( | e^■ | - |

- **log** computes log base 10 (calculator convention).
- **ln** computes the natural log.
- **SHIFT log** (10^x): type the exponent into the box that appears.
- **ALPHA log** (log base): type the base into the subscript box, then the argument.

### Roots and powers

| Press | Inserts | SHIFT |
|-------|---------|-------|
| √ | square root (cursor inside radicand) | nth root (fill index first, then radicand) |
| x² | ^2 | ^3 (SHIFT gives cube) |
| x^y | exponent box (cursor inside) | - |

**Nth root:** press **SHIFT √**, type the root degree (e.g. 3 for cube root), then press the right arrow or Tab to move into the radicand and type the number.

### Combinatorics

| Press | Inserts | Note |
|-------|---------|------|
| nPr | nPr(■,■) | Fill n, Tab to r |
| nCr | nCr(■,■) | Fill n, Tab to r |
| x! | ! | Type number first, then x! |

Factorial: type `5` then press **x!** to get `5!`.

### Ans and imaginary unit

| Press | Inserts | SHIFT |
|-------|---------|-------|
| Ans | last result | i (imaginary unit) |

**Ans** automatically holds the result of the last successful evaluation. Use it to chain calculations: evaluate `25`, then type `√Ans` to get 5.

---

## Angle mode (DRG)

Press **DRG** to toggle between **DEG** and **RAD**. The status bar updates immediately.

All trig functions and their inverses use the active mode. Switching modes does not re-evaluate the current expression.

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
3. Pick the **from** unit and the **to** unit from the dropdowns.
4. The converted result appears below the row as you type.

The result is not inserted into the math field - it's a standalone reference tool.

---

## SOLVE panel

Press **SOLVE** to find roots of f(x) = 0.

1. Type your function in the **f(x)** field using standard math notation (e.g. `x^2 - 2`).
2. Choose a method: **Newton-Raphson**, **Secant**, or **Bisection**.
3. Enter a starting point (x0) or interval (a, b for bisection).
4. Press **solve**.

The root is shown to 8 decimal places. The iteration table shows how the method converged.

**Tips:**
- Newton-Raphson needs a good starting guess near the root.
- Bisection requires f(a) and f(b) to have opposite signs.
- If Newton fails (derivative is zero), switch to secant or bisection.

---

## Calculus panel

Press **d/dx** for derivatives or **∫dx** for integrals.

### Derivative

1. Enter f(x) in the expression field.
2. Enter the x value.
3. Press **compute**.

Returns a numeric approximation using the central difference method.

### Integral

1. Enter f(x) in the expression field.
2. Enter the lower and upper bounds.
3. Press **compute**.

Returns a numeric approximation using Simpson's rule with 200 subintervals.

---

## Common issues

**"Undefined variable or function"** - You used a name the engine doesn't know. Check spelling. Variable names other than `Ans` are not supported in Phase 1.

**"Incomplete expression"** - The expression is missing something (unclosed parenthesis, trailing operator).

**"Enter the root degree"** - You pressed = before filling in the index of an nth root. Click the index box and type a number first.

**"Enter the radicand"** - The nth root's index is filled but the radicand box is empty. Tab into it and type a value.

**"Enter the log base"** - Same idea for log base n.

**Result shows `-∞`** - Usually means the input is outside the function's domain (e.g. `log(0)`). Division by zero evaluates to `∞` (positive infinity), not an error.

**Cursor jumps outside a root or exponent** - After filling the last placeholder in a structure, MathLive moves the cursor past the structure. This is expected. Continue typing to build the rest of the expression.
