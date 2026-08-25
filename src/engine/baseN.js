// Base conversion and bitwise operations on unsigned 32-bit integers.
// Karnaugh map solver using Quine-McCluskey minimization.

const UINT32 = 0xFFFFFFFF

// ---------- Base conversion ----------

export function parseBase(str, base) {
  const s = str.replace(/\s/g, '')
  if (!s) return null
  const DIGITS = '0123456789abcdef'
  const allowed = DIGITS.slice(0, base)
  if (!/^-?[0-9a-fA-F]+$/.test(s)) return null
  const neg = s[0] === '-'
  const digits = neg ? s.slice(1).toLowerCase() : s.toLowerCase()
  if (!digits || digits.split('').some(c => !allowed.includes(c))) return null
  const val = parseInt(digits, base)
  if (!isFinite(val)) return null
  return (neg ? -val : val) & UINT32
}

export function formatBin(n) {
  n = n >>> 0
  if (n === 0) return '0000'
  const bits = n.toString(2)
  const padded = bits.padStart(Math.ceil(bits.length / 4) * 4, '0')
  return padded.match(/.{1,4}/g).join(' ')
}

export function formatOct(n) {
  return (n >>> 0).toString(8)
}

export function formatDec(n) {
  return (n >>> 0).toString(10)
}

export function formatHex(n) {
  return (n >>> 0).toString(16).toUpperCase()
}

// ---------- Bitwise operations ----------

export function bitwiseOp(op, a, b) {
  a = a >>> 0
  b = b >>> 0
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

// ---------- Karnaugh map helpers ----------

// Gray code sequence for 2 positions: [0, 1, 3, 2]
const GRAY2 = [0, 1, 3, 2]

export function kmapDims(vars) {
  if (vars === 2) return { rows: 2, cols: 2 }
  if (vars === 3) return { rows: 2, cols: 4 }
  if (vars === 4) return { rows: 4, cols: 4 }
  return null
}

export function kmapHeaders(vars) {
  if (vars === 2) return {
    rowLabel: 'A', colLabel: 'B',
    rowVals: ['0', '1'],
    colVals: ['0', '1'],
  }
  if (vars === 3) return {
    rowLabel: 'A', colLabel: 'BC',
    rowVals: ['0', '1'],
    colVals: ['00', '01', '11', '10'],
  }
  if (vars === 4) return {
    rowLabel: 'AB', colLabel: 'CD',
    rowVals: ['00', '01', '11', '10'],
    colVals: ['00', '01', '11', '10'],
  }
  return null
}

// Convert K-map row, col to minterm index.
export function kmapMinterm(vars, row, col) {
  if (vars === 2) return row * 2 + col
  if (vars === 3) return (row << 2) | GRAY2[col]
  if (vars === 4) return (GRAY2[row] << 2) | GRAY2[col]
  return -1
}

// ---------- Quine-McCluskey ----------

function countOnes(n) {
  let c = 0
  while (n) { c += n & 1; n >>>= 1 }
  return c
}

function differ1Bit(a, b) {
  const x = a ^ b
  return x !== 0 && (x & (x - 1)) === 0
}

// Find all prime implicants for the given minterms + don't-cares.
// Returns array of { value, mask, covered } where mask bits = 1 mean "this bit is irrelevant".
export function findPrimeImplicants(numVars, minterms, dontCares) {
  const all = [...new Set([...minterms, ...dontCares])].sort((a, b) => a - b)
  const dontCareSet = new Set(dontCares)

  if (all.length === 0) return []

  // Groups by number of ones.
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
      const g1 = groups[keys[i]]
      const g2 = groups[keys[i + 1]]
      for (const im of g1) {
        for (const jm of g2) {
          if (im.mask !== jm.mask) continue
          const diff = (im.value & ~im.mask) ^ (jm.value & ~jm.mask)
          if (!differ1Bit(diff, 0) && diff !== 0) continue
          if (im.mask === jm.mask && differ1Bit(im.value ^ jm.value, 0)) {
            const newMask = im.mask | (im.value ^ jm.value)
            const newVal  = im.value & ~newMask & totalMask
            const merged  = { value: newVal, mask: newMask }
            const k = countOnes(newVal & ~newMask)
            if (!nextGroups[k]) nextGroups[k] = []
            const key = `${newVal}:${newMask}`
            const alreadyIn = nextGroups[k].some(x => `${x.value}:${x.mask}` === key)
            if (!alreadyIn) nextGroups[k].push(merged)
            used.add(`${im.value}:${im.mask}`)
            used.add(`${jm.value}:${jm.mask}`)
          }
        }
      }
    }

    for (const g of Object.values(groups)) {
      for (const im of g) {
        if (!used.has(`${im.value}:${im.mask}`)) {
          const isDup = primes.some(p => p.value === im.value && p.mask === im.mask)
          if (!isDup) primes.push(im)
        }
      }
    }

    if (Object.keys(nextGroups).length === 0) break
    groups = nextGroups
  }

  // Filter out any prime that covers only don't-cares.
  return primes.filter(p => {
    const numVarsMask = (1 << numVars) - 1
    for (let m = 0; m < (1 << numVars); m++) {
      if ((m & ~p.mask & numVarsMask) === (p.value & ~p.mask & numVarsMask)) {
        if (!dontCareSet.has(m)) return true
      }
    }
    return false
  })
}

// Returns which minterms a prime implicant covers (excluding don't-cares).
function covers(prime, minterms, numVars) {
  const numVarsMask = (1 << numVars) - 1
  return minterms.filter(m => (m & ~prime.mask & numVarsMask) === (prime.value & ~prime.mask & numVarsMask))
}

// Greedy essential prime cover.
export function findMinimalCover(numVars, minterms, primes) {
  if (minterms.length === 0) return []
  if (primes.length === 0) return null

  const covered = new Set()
  const selected = []

  // Find essential primes.
  for (const m of minterms) {
    const covering = primes.filter(p => covers(p, [m], numVars).length > 0)
    if (covering.length === 1) {
      const p = covering[0]
      const key = `${p.value}:${p.mask}`
      if (!selected.some(s => `${s.value}:${s.mask}` === key)) {
        selected.push(p)
        for (const c of covers(p, minterms, numVars)) covered.add(c)
      }
    }
  }

  // Greedy cover remaining.
  let remaining = minterms.filter(m => !covered.has(m))
  while (remaining.length > 0) {
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

const DEFAULT_VAR_NAMES = ['A', 'B', 'C', 'D']

export function formatImplicant(prime, numVars, varNames = DEFAULT_VAR_NAMES) {
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

// Main entry point: cells is an array of length 2^vars, each cell 0=min, 1=max, 2=dc.
export function karnaughMinimize(vars, cells) {
  const total = 1 << vars
  const minterms = []
  const dontCares = []
  for (let i = 0; i < total; i++) {
    if (cells[i] === 1) minterms.push(i)
    else if (cells[i] === 2) dontCares.push(i)
  }

  if (minterms.length === 0) return '0'
  if (minterms.length + dontCares.length === total) return '1'

  const primes = findPrimeImplicants(vars, minterms, dontCares)
  if (primes.length === 0) return '0'

  const cover = findMinimalCover(vars, minterms, primes)
  if (!cover || cover.length === 0) return '0'

  return cover.map(p => formatImplicant(p, vars)).join(' + ')
}
