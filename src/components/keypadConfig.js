// Key layout shared between Keypad.jsx (rendering) and tests (validation).
// `insert`: LaTeX fragment sent to MathLive field.
// `action`: string handled by App.jsx.
// `shift` / `alpha`: alternate layers activated by SHIFT / ALPHA.
export const ROWS = [
  [
    { id: 'shift', label: 'SHIFT', action: 'toggleShift', mod: true },
    { id: 'alpha', label: 'ALPHA', action: 'toggleAlpha', mod: true },
    { id: 'mode',  label: 'MODE',  action: 'openModeMenu', mod: true },
    { id: 'angle', label: 'DRG',   action: 'toggleAngle',  mod: true },
    { id: 'base',  label: 'BASE',  action: 'cycleBase',    mod: true },
  ],
  [
    { id: 'sin', label: 'sin', insert: '\\sin(',   shift: { label: 'sin⁻¹', insert: '\\arcsin(' }, alpha: { label: 'csc', insert: '\\csc(' } },
    { id: 'cos', label: 'cos', insert: '\\cos(',   shift: { label: 'cos⁻¹', insert: '\\arccos(' }, alpha: { label: 'sec', insert: '\\sec(' } },
    { id: 'tan', label: 'tan', insert: '\\tan(',   shift: { label: 'tan⁻¹', insert: '\\arctan(' }, alpha: { label: 'cot', insert: '\\cot(' } },
    { id: 'log', label: 'log', insert: '\\log(',   shift: { label: '10ˣ',   insert: '10^{#0}'    }, alpha: { label: 'logₐ', insert: '\\log_{#0}(' } },
    { id: 'ln',  label: 'ln',  insert: '\\ln(',    shift: { label: 'eˣ',    insert: 'e^{#0}'     } },
  ],
  [
    { id: 'sinh', label: 'sinh', insert: '\\sinh(',  shift: { label: 'sinh⁻¹', insert: '\\operatorname{asinh}(' } },
    { id: 'cosh', label: 'cosh', insert: '\\cosh(',  shift: { label: 'cosh⁻¹', insert: '\\operatorname{acosh}(' } },
    { id: 'tanh', label: 'tanh', insert: '\\tanh(',  shift: { label: 'tanh⁻¹', insert: '\\operatorname{atanh}(' } },
    { id: 'eul',  label: 'e',    insert: 'e' },
    { id: 'cpi',  label: 'π',    insert: '\\pi' },
  ],
  [
    { id: 'x2',     label: 'x²', insert: '^2',          shift: { label: 'x³', insert: '^3' } },
    { id: 'sqrt',   label: '√',  insert: '\\sqrt{#0}',  shift: { label: 'ˣ√y', insert: '\\sqrt[#0]{#0}' } },
    { id: 'pow',    label: 'xʸ', insert: '^{#0}' },
    { id: 'lparen', label: '(',  insert: '(' },
    { id: 'rparen', label: ')',  insert: ')' },
  ],
  [
    { id: 'fact',  label: 'x!',   insert: '!' },
    { id: 'deriv', label: 'd/dx', action: 'openDeriv' },
    { id: 'integ', label: '∫dx',  action: 'openInteg' },
    { id: 'npr',   label: 'nPr',  insert: '\\operatorname{nPr}(#0,#0)' },
    { id: 'ncr',   label: 'nCr',  insert: '\\operatorname{nCr}(#0,#0)' },
  ],
  [
    { id: '7',   label: '7',   insert: '7', alpha: { label: 'G', insert: 'G' }, rcl: { label: 'Q' } },
    { id: '8',   label: '8',   insert: '8', alpha: { label: 'H', insert: 'H' }, rcl: { label: 'R' } },
    { id: '9',   label: '9',   insert: '9', alpha: { label: 'I', insert: 'I' }, rcl: { label: 'S' } },
    { id: 'del', label: 'DEL', action: 'del' },
    { id: 'ac',  label: 'AC',  action: 'clear', shift: { label: 'STO', action: 'activateSto' }, alpha: { label: 'RCL', action: 'activateRcl' } },
  ],
  [
    { id: '4',   label: '4', insert: '4', alpha: { label: 'D', insert: 'D' }, rcl: { label: 'N' } },
    { id: '5',   label: '5', insert: '5', alpha: { label: 'E', insert: 'E' }, rcl: { label: 'O' } },
    { id: '6',   label: '6', insert: '6', alpha: { label: 'F', insert: 'F' }, rcl: { label: 'P' } },
    { id: 'mul', label: '×', insert: '\\times ', alpha: { label: '%', insert: '%' } },
    { id: 'div', label: '÷', insert: '\\frac{#0}{}' },
  ],
  [
    { id: '1',   label: '1', insert: '1', alpha: { label: 'A', insert: 'A' }, rcl: { label: 'K' } },
    { id: '2',   label: '2', insert: '2', alpha: { label: 'B', insert: 'B' }, rcl: { label: 'L' } },
    { id: '3',   label: '3', insert: '3', alpha: { label: 'C', insert: 'C' }, rcl: { label: 'M' } },
    { id: 'add', label: '+', insert: '+' },
    { id: 'sub', label: '−', insert: '-' },
  ],
  [
    { id: '0',   label: '0',   insert: '0', alpha: { label: 'J', insert: 'J' }, rcl: { label: 'T' } },
    { id: 'dot', label: '.',   insert: '.' },
    { id: 'ans', label: 'Ans', insert: '\\mathrm{Ans}', shift: { label: 'i', insert: 'i' } },
    { id: 'exe', label: '=',   action: 'evaluate', wide: true },
  ],
  [
    { id: 'const', label: 'CONST',  action: 'openConst', mod: true },
    { id: 'conv',  label: 'CONV',   action: 'openConv',  mod: true },
    { id: 'solve', label: 'SOLVE',  action: 'openSolve', mod: true },
    { id: 'basen', label: 'BASE-N', action: 'openBaseN', mod: true },
    { id: 'ops',   label: 'OPS',    action: 'openOps',   mod: true },
    { id: 'graph', label: 'GRAPH',  action: 'openGraph', mod: true },
  ],
]
