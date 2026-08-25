// Base-N engine: arbitrary-precision arithmetic, bitwise ops, Karnaugh map solver.
// Numbers are BigInt internally; format functions return strings.

// ---------- Parsing ----------

function parseBigInt(str, base) {
  const bigBase = BigInt(base)
  let result = 0n
  for (const c of str.toLowerCase()) {
    const d = parseInt(c, base)
    if (isNaN(d)) throw new Error('Invalid digit: ' + c)
    result = result * bigBase + BigInt(d)
  }
  return result
}

export function parseBase(str, base) {
  const s = str.replace(/\s/g, '')
  if (!s) return null
  const neg = s[0] === '-'
  const digits = neg ? s.slice(1) : s
  if (!digits) return null
  for (const c of digits.toLowerCase()) {
    if (isNaN(parseInt(c, base))) return null
  }
  try {
    const val = parseBigInt(digits, base)
    return neg ? -val : val
  } catch {
    return null
  }
}

// ---------- BigInt formatting ----------

function formatBigIntBin(n) {
  if (n < 0n) return '-' + formatBigIntBin(-n)
  if (n === 0n) return '0000'
  const bits = n.toString(2)
  const padded = bits.padStart(Math.ceil(bits.length / 4) * 4, '0')
  return padded.match(/.{1,4}/g).join(' ')
}

export function formatAllBases(n) {
  return {
    bin: formatBigIntBin(n),
    oct: n.toString(8),
    dec: n.toString(10),
    hex: n.toString(16).toUpperCase(),
  }
}

// Legacy 32-bit format helpers (still used by baseN tests)
export function formatBin(n) {
  n = n >>> 0
  if (n === 0) return '0000'
  const bits = n.toString(2)
  const padded = bits.padStart(Math.ceil(bits.length / 4) * 4, '0')
  return padded.match(/.{1,4}/g).join(' ')
}
export function formatOct(n) { return (n >>> 0).toString(8) }
export function formatDec(n) { return (n >>> 0).toString(10) }
export function formatHex(n) { return (n >>> 0).toString(16).toUpperCase() }

// ---------- BigInt expression evaluator ----------
// Supports: +  -  *  /  %  AND/&  OR/|  XOR/^  NOT/~  <<  >>  ()  unary minus
// Operator precedence (low to high): | < ^ < & < << >> < + - < * / % < unary < primary
// NOT uses 64-bit mask so NOT(0) = 0xFFFF...FFFF (16 hex digits).

const MASK64 = (1n << 64n) - 1n

// Read an integer literal starting at position i, honouring 0b/0x/0o/0d prefixes.
// Returns { value: BigInt, end: number } or throws.
function readNumber(expr, i, defaultBase) {
  const c0 = expr[i].toLowerCase()
  const c1 = expr[i + 1]?.toLowerCase()

  // Prefix override: 0b, 0x / 0h, 0o, 0d
  if (c0 === '0' && c1 && 'bxhod'.includes(c1)) {
    const prefixBase = c1 === 'b' ? 2 : (c1 === 'x' || c1 === 'h') ? 16 : c1 === 'o' ? 8 : 10
    let j = i + 2
    const start = j
    while (j < expr.length) {
      const d = parseInt(expr[j], prefixBase)
      if (isNaN(d) || d < 0) break
      j++
    }
    if (j === start) throw new Error('Expected digits after base prefix')
    return { value: parseBigInt(expr.slice(start, j), prefixBase), end: j }
  }

  // Default base digits
  let j = i
  while (j < expr.length) {
    const d = parseInt(expr[j], defaultBase)
    if (isNaN(d) || d < 0) break
    j++
  }
  if (j === i) throw new Error("Invalid character '" + expr[i] + "' for base " + defaultBase)
  return { value: parseBigInt(expr.slice(i, j), defaultBase), end: j }
}

function isHexStart(c, base) {
  return !isNaN(parseInt(c, Math.max(base, 16)))
}

function tokenize(expr, base) {
  expr = expr
    .replace(/\bAND\b/gi, '&')
    .replace(/\bOR\b/gi, '|')
    .replace(/\bXOR\b/gi, '^')
    .replace(/\bNOT\b/gi, '~')
    .replace(/\bMOD\b/gi, '%')

  const tokens = []
  let i = 0

  function isDigitStart(c) {
    // A digit start is a valid digit in the current base OR the start of a 0b/0x/0o/0d prefix
    if (!isNaN(parseInt(c, base)) && parseInt(c, base) >= 0) return true
    if (c === '0') return true  // could be a prefix
    return false
  }

  while (i < expr.length) {
    const c = expr[i]
    if (/\s/.test(c)) { i++; continue }
    if (c === '(') { tokens.push({ t: 'lp' }); i++; continue }
    if (c === ')') { tokens.push({ t: 'rp' }); i++; continue }
    if ('+-*/%&|^~'.includes(c)) { tokens.push({ t: 'op', v: c }); i++; continue }
    if (c === '<' && expr[i + 1] === '<') { tokens.push({ t: 'op', v: '<<' }); i += 2; continue }
    if (c === '>' && expr[i + 1] === '>') { tokens.push({ t: 'op', v: '>>' }); i += 2; continue }
    if (isDigitStart(c)) {
      const { value, end } = readNumber(expr, i, base)
      tokens.push({ t: 'num', v: value })
      i = end
      continue
    }
    throw new Error("Invalid character '" + c + "' for base " + base)
  }
  return tokens
}

function makeParser(tokens) {
  let pos = 0
  const at   = () => tokens[pos]
  const next = () => tokens[pos++]
  function expect(t) {
    const tok = next()
    if (!tok || tok.t !== t) throw new Error('Unexpected token')
    return tok
  }
  function isOp(v) { const t = at(); return t?.t === 'op' && (Array.isArray(v) ? v.includes(t.v) : t.v === v) }

  const parse = () => parseOr()

  function parseOr()  { let l = parseXor(); while (isOp('|'))            { next(); l = l |  parseXor()  } return l }
  function parseXor() { let l = parseAnd(); while (isOp('^'))            { next(); l = l ^  parseAnd()  } return l }
  function parseAnd() { let l = parseShift(); while (isOp('&'))          { next(); l = l &  parseShift()} return l }
  function parseShift() {
    let l = parseAdd()
    while (isOp(['<<', '>>'])) {
      const op = next().v; const r = parseAdd()
      l = op === '<<' ? (l << r) & MASK64 : l >> r
    }
    return l
  }
  function parseAdd() {
    let l = parseMul()
    while (isOp(['+', '-'])) { const op = next().v; const r = parseMul(); l = op === '+' ? l + r : l - r }
    return l
  }
  function parseMul() {
    let l = parseUnary()
    while (isOp(['*', '/', '%'])) {
      const op = next().v; const r = parseUnary()
      if (r === 0n && (op === '/' || op === '%')) throw new Error('Division by zero')
      l = op === '*' ? l * r : op === '/' ? l / r : l % r
    }
    return l
  }
  function parseUnary() {
    if (isOp('-')) { next(); return -parseUnary() }
    if (isOp('~')) { next(); return MASK64 ^ parseUnary() }
    return parsePrimary()
  }
  function parsePrimary() {
    const t = at()
    if (!t) throw new Error('Unexpected end of expression')
    if (t.t === 'num') { next(); return t.v }
    if (t.t === 'lp')  { next(); const v = parse(); expect('rp'); return v }
    throw new Error('Unexpected token')
  }

  return { parse: () => { const r = parse(); if (pos < tokens.length) throw new Error('Unexpected token'); return r } }
}

export function evaluateBaseExpr(expr, base) {
  const s = expr.trim()
  if (!s) return { ok: false, error: 'Empty expression' }
  try {
    const tokens = tokenize(s, base)
    if (!tokens.length) return { ok: false, error: 'Empty expression' }
    return { ok: true, value: makeParser(tokens).parse() }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

// ---------- Legacy 32-bit bitwise (still referenced by existing tests) ----------

export function bitwiseOp(op, a, b) {
  a = a >>> 0; b = b >>> 0
  switch (op) {
    case 'AND': return (a & b) >>> 0
    case 'OR':  return (a | b) >>> 0
    case 'XOR': return (a ^ b) >>> 0
    case 'NOT': return (~a) >>> 0
    case 'LSH': return (a << (b & 31)) >>> 0
    case 'RSH': return (a >>> (b & 31))
    default: return null
  }
}

// ---------- Karnaugh map ----------

const GRAY2 = [0, 1, 3, 2]
const GRAY3 = [0, 1, 3, 2, 6, 7, 5, 4]

export function kmapDims(vars) {
  if (vars === 2) return { rows: 2,  cols: 2 }
  if (vars === 3) return { rows: 2,  cols: 4 }
  if (vars === 4) return { rows: 4,  cols: 4 }
  if (vars === 5) return { rows: 4,  cols: 8 }
  if (vars === 6) return { rows: 8,  cols: 8 }
  return null  // 7-8 use flat minterm list
}

export function kmapHeaders(vars) {
  if (vars === 2) return { rowLabel: 'A',   colLabel: 'B',   rowVals: ['0','1'],                           colVals: ['0','1'] }
  if (vars === 3) return { rowLabel: 'A',   colLabel: 'BC',  rowVals: ['0','1'],                           colVals: ['00','01','11','10'] }
  if (vars === 4) return { rowLabel: 'AB',  colLabel: 'CD',  rowVals: ['00','01','11','10'],               colVals: ['00','01','11','10'] }
  if (vars === 5) return { rowLabel: 'AB',  colLabel: 'CDE', rowVals: ['00','01','11','10'],               colVals: ['000','001','011','010','110','111','101','100'] }
  if (vars === 6) return { rowLabel: 'ABC', colLabel: 'DEF', rowVals: ['000','001','011','010','110','111','101','100'], colVals: ['000','001','011','010','110','111','101','100'] }
  return null
}

export function kmapMinterm(vars, row, col) {
  if (vars === 2) return row * 2 + col
  if (vars === 3) return (row << 2) | GRAY2[col]
  if (vars === 4) return (GRAY2[row] << 2) | GRAY2[col]
  if (vars === 5) return (GRAY2[row] << 3) | GRAY3[col]
  if (vars === 6) return (GRAY3[row] << 3) | GRAY3[col]
  return -1
}

// ---------- Quine-McCluskey ----------

function countOnes(n) {
  let c = 0; while (n) { c += n & 1; n >>>= 1 }; return c
}

function differ1Bit(a, b) {
  const x = a ^ b; return x !== 0 && (x & (x - 1)) === 0
}

export function findPrimeImplicants(numVars, minterms, dontCares) {
  const all = [...new Set([...minterms, ...dontCares])].sort((a, b) => a - b)
  const dontCareSet = new Set(dontCares)
  if (!all.length) return []

  let groups = {}
  for (const m of all) {
    const k = countOnes(m)
    if (!groups[k]) groups[k] = []
    groups[k].push({ value: m, mask: 0 })
  }

  const primes = []
  const totalMask = (1 << numVars) - 1

  while (true) {
    const nextGroups = {}
    const used = new Set()
    const keys = Object.keys(groups).map(Number).sort((a, b) => a - b)

    for (let i = 0; i < keys.length - 1; i++) {
      const g1 = groups[keys[i]], g2 = groups[keys[i + 1]]
      for (const im of g1) {
        for (const jm of g2) {
          if (im.mask !== jm.mask) continue
          if (!differ1Bit(im.value ^ jm.value, 0)) continue
          const newMask = im.mask | (im.value ^ jm.value)
          const newVal  = im.value & ~newMask & totalMask
          const merged  = { value: newVal, mask: newMask }
          const k = countOnes(newVal & ~newMask)
          if (!nextGroups[k]) nextGroups[k] = []
          const key = newVal + ':' + newMask
          if (!nextGroups[k].some(x => x.value + ':' + x.mask === key)) nextGroups[k].push(merged)
          used.add(im.value + ':' + im.mask)
          used.add(jm.value + ':' + jm.mask)
        }
      }
    }

    for (const g of Object.values(groups)) {
      for (const im of g) {
        if (!used.has(im.value + ':' + im.mask) && !primes.some(p => p.value === im.value && p.mask === im.mask))
          primes.push(im)
      }
    }
    if (!Object.keys(nextGroups).length) break
    groups = nextGroups
  }

  return primes.filter(p => {
    for (let m = 0; m < (1 << numVars); m++) {
      if ((m & ~p.mask & totalMask) === (p.value & ~p.mask & totalMask) && !dontCareSet.has(m)) return true
    }
    return false
  })
}

function covers(prime, minterms, numVars) {
  const mask = (1 << numVars) - 1
  return minterms.filter(m => (m & ~prime.mask & mask) === (prime.value & ~prime.mask & mask))
}

export function findMinimalCover(numVars, minterms, primes) {
  if (!minterms.length) return []
  if (!primes.length) return null
  const covered = new Set()
  const selected = []

  for (const m of minterms) {
    const covering = primes.filter(p => covers(p, [m], numVars).length > 0)
    if (covering.length === 1) {
      const p = covering[0]
      const key = p.value + ':' + p.mask
      if (!selected.some(s => s.value + ':' + s.mask === key)) {
        selected.push(p)
        for (const c of covers(p, minterms, numVars)) covered.add(c)
      }
    }
  }

  let remaining = minterms.filter(m => !covered.has(m))
  while (remaining.length) {
    let best = null, bestCount = 0
    for (const p of primes) {
      const c = covers(p, remaining, numVars).length
      if (c > bestCount) { best = p; bestCount = c }
    }
    if (!best) break
    selected.push(best)
    for (const c of covers(best, remaining, numVars)) covered.add(c)
    remaining = remaining.filter(m => !covered.has(m))
  }
  return selected
}

const DEFAULT_VARS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export function formatImplicant(prime, numVars, varNames = DEFAULT_VARS) {
  const names = varNames.slice(0, numVars)
  let term = ''
  for (let i = numVars - 1; i >= 0; i--) {
    const bit = numVars - 1 - i
    if (prime.mask & (1 << i)) continue
    const val = (prime.value >> i) & 1
    term += val ? names[bit] : names[bit] + "'"
  }
  return term || '1'
}

// Returns an error string if any numeric literal in expr uses a digit invalid for baseMode.
// BIN: only 0 and 1 allowed. OCT: only 0-7 allowed. HEX/DEC: no restriction.
export function validateBaseDigits(expr, baseMode) {
  if (baseMode === 'dec' || baseMode === 'hex') return null
  const invalid = baseMode === 'bin' ? /[2-9]/ : /[89]/
  const nums = expr.match(/\d+/g) || []
  for (const n of nums) {
    const m = n.match(invalid)
    if (m) return `'${m[0]}' is not a valid digit in ${baseMode.toUpperCase()} mode`
  }
  return null
}

export function karnaughMinimize(vars, cells) {
  const total = 1 << vars
  const minterms = [], dontCares = []
  for (let i = 0; i < total; i++) {
    if (cells[i] === 1) minterms.push(i)
    else if (cells[i] === 2) dontCares.push(i)
  }
  if (!minterms.length) return '0'
  if (minterms.length + dontCares.length === total) return '1'
  const primes = findPrimeImplicants(vars, minterms, dontCares)
  if (!primes.length) return '0'
  const cover = findMinimalCover(vars, minterms, primes)
  if (!cover?.length) return '0'
  return cover.map(p => formatImplicant(p, vars)).join(' + ')
}
