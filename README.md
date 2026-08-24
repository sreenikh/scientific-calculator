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
- SHIFT and ALPHA key layers for a three-function keypad
- CONST panel: CODATA-style constants library (Math, Universal, Electromagnetic, Atomic, Thermodynamic)
- CONV panel: 16 unit categories, ~90 units, live from/to conversion
- SOLVE panel: Newton-Raphson, Secant, and Bisection root finders with iteration table
- Calculus panel: numeric derivative (central difference) and definite integral (Simpson's rule)
- Responsive layout: scales to any window size using dvh/vw units

## Planned

- Phase 2: Graphing (canvas plotter, pan/zoom, trace, shaded integral regions)
- Phase 3: Equation mode, Statistics, Distributions, Matrix/Vector
- Phase 4: Base-N, Memory (STO/RCL), Format options, Table mode

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
    mathEngine.js     - math.js wrapper, angle-mode-aware trig, error handling
    numeric.js        - root finding, numeric derivative/integral, poly solver
    units.js          - unit conversion data (16 categories)
    constants.js      - scientific constants library
  components/
    Screen.jsx        - MathLive math-field and result line
    Keypad.jsx        - primary/shift/alpha key layout
    ConstPanel.jsx    - constants overlay
    ConvPanel.jsx     - unit converter overlay
    SolvePanel.jsx    - equation solver overlay
    CalculusPanel.jsx - calculus overlay
  App.jsx             - top-level state and wiring
```
