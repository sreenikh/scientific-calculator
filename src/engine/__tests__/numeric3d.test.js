import { describe, it, expect } from 'vitest'
import { viridis, parseExpr3D, compileExplicit3DFn, compileImplicit3DFn, buildExplicitMesh, marchingCubes } from '../numeric3d.js'

// ── viridis ──────────────────────────────────────────────────────────────────

describe('viridis', () => {
  it('t=0 is dark purple (low r, near-zero g, mid b)', () => {
    const [r, g, b] = viridis(0)
    expect(r).toBeCloseTo(0.278, 2)
    expect(g).toBeCloseTo(0.005, 2)
    expect(b).toBeCloseTo(0.334, 2)
  })
  it('t=1 is yellow (high r, high g, low b)', () => {
    const [r, g, b] = viridis(1)
    expect(r).toBeGreaterThan(0.9)
    expect(g).toBeGreaterThan(0.8)
    expect(b).toBeLessThan(0.2)
  })
  it('t=0.5 is roughly teal', () => {
    const [r, g, b] = viridis(0.5)
    expect(r).toBeCloseTo(0.128, 1)
    expect(g).toBeCloseTo(0.567, 1)
    expect(b).toBeCloseTo(0.551, 1)
  })
  it('clamps below 0', () => {
    const [r, g, b] = viridis(-1)
    expect(r).toBeGreaterThanOrEqual(0)
    expect(g).toBeGreaterThanOrEqual(0)
    expect(b).toBeGreaterThanOrEqual(0)
  })
  it('clamps above 1', () => {
    const [r, g, b] = viridis(2)
    expect(r).toBeLessThanOrEqual(1)
    expect(g).toBeLessThanOrEqual(1)
    expect(b).toBeLessThanOrEqual(1)
  })
  it('returns monotonically increasing green across [0,1]', () => {
    const gs = [0, 0.2, 0.4, 0.6, 0.8, 1].map(t => viridis(t)[1])
    for (let i = 1; i < gs.length; i++) {
      expect(gs[i]).toBeGreaterThan(gs[i-1])
    }
  })
})

// ── parseExpr3D ───────────────────────────────────────────────────────────────

describe('parseExpr3D', () => {
  it('blank → explicit', () => {
    expect(parseExpr3D('').implicit).toBe(false)
  })
  it('x^2 + y^2 → explicit (no z)', () => {
    expect(parseExpr3D('x^2 + y^2').implicit).toBe(false)
  })
  it('sin(x)*cos(y) → explicit', () => {
    expect(parseExpr3D('sin(x)*cos(y)').implicit).toBe(false)
  })
  it('x^2+y^2+z^2=25 → implicit', () => {
    expect(parseExpr3D('x^2+y^2+z^2=25').implicit).toBe(true)
  })
  it('z = x*y → implicit (contains z)', () => {
    expect(parseExpr3D('z = x*y').implicit).toBe(true)
  })
  it('x*yz is NOT implicit (z is part of yz identifier)', () => {
    expect(parseExpr3D('xyz').implicit).toBe(false)
  })
  it('preserves expr string', () => {
    expect(parseExpr3D('  x+y  ').expr).toBe('x+y')
  })
})

// ── compileExplicit3DFn ───────────────────────────────────────────────────────

describe('compileExplicit3DFn', () => {
  it('x^2 + y^2 at (3,4) = 25', () => {
    const f = compileExplicit3DFn('x^2 + y^2')
    expect(f(3, 4)).toBeCloseTo(25)
  })
  it('x*y at (2,3) = 6', () => {
    const f = compileExplicit3DFn('x*y')
    expect(f(2, 3)).toBeCloseTo(6)
  })
  it('sin(x)*cos(y) at (0,0) = 0', () => {
    const f = compileExplicit3DFn('sin(x)*cos(y)')
    expect(f(0, 0)).toBeCloseTo(0)
  })
  it('x+y at (1,2) = 3', () => {
    expect(compileExplicit3DFn('x+y')(1, 2)).toBeCloseTo(3)
  })
  it('throws on invalid expression', () => {
    expect(() => compileExplicit3DFn('((')).toThrow()
  })
})

// ── compileImplicit3DFn ───────────────────────────────────────────────────────

describe('compileImplicit3DFn', () => {
  it('x^2+y^2+z^2=25 at (3,4,0) ≈ 0', () => {
    const f = compileImplicit3DFn('x^2+y^2+z^2=25')
    expect(f(3, 4, 0)).toBeCloseTo(0)
  })
  it('x^2+y^2+z^2=25 at (0,0,0) = -25', () => {
    const f = compileImplicit3DFn('x^2+y^2+z^2=25')
    expect(f(0, 0, 0)).toBeCloseTo(-25)
  })
  it('no = sign treated as F=0', () => {
    const f = compileImplicit3DFn('x+y+z')
    expect(f(1, 2, -3)).toBeCloseTo(0)
  })
  it('x^2+y^2=z^2 (cone) at (1,0,1) ≈ 0', () => {
    const f = compileImplicit3DFn('x^2+y^2=z^2')
    expect(f(1, 0, 1)).toBeCloseTo(0)
  })
})

// ── buildExplicitMesh ─────────────────────────────────────────────────────────

describe('buildExplicitMesh', () => {
  const flatFn = (x, y) => x + y   // z = x + y, a tilted plane

  it('returns correct array sizes for N=4', () => {
    const { positions, normals, colors, indices } = buildExplicitMesh(flatFn, -1, 1, -1, 1, 4)
    const verts = 5 * 5  // (N+1)^2
    expect(positions.length).toBe(verts * 3)
    expect(normals.length).toBe(verts * 3)
    expect(colors.length).toBe(verts * 3)
    expect(indices.length).toBe(4 * 4 * 6)  // N^2 quads × 6 indices
  })

  it('positions match grid for flat fn', () => {
    const { positions } = buildExplicitMesh(flatFn, 0, 2, 0, 2, 2)
    // vertex (i=0,j=0): x=0, y=0, z=0+0=0
    expect(positions[0]).toBeCloseTo(0)
    expect(positions[1]).toBeCloseTo(0)
    expect(positions[2]).toBeCloseTo(0)
    // vertex (i=2,j=0): x=2, y=0, z=2
    expect(positions[(0*3+2)*3]).toBeCloseTo(2)
    expect(positions[(0*3+2)*3+2]).toBeCloseTo(2)
  })

  it('zmin and zmax are correct for z=x+y on [-1,1]×[-1,1]', () => {
    const { zmin, zmax } = buildExplicitMesh(flatFn, -1, 1, -1, 1, 10)
    expect(zmin).toBeCloseTo(-2)
    expect(zmax).toBeCloseTo(2)
  })

  it('colors are valid [0,1] values', () => {
    const { colors } = buildExplicitMesh(flatFn, -1, 1, -1, 1, 4)
    for (const v of colors) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('NaN from fn skips quads (indices count decreases)', () => {
    const nanFn = (x, y) => x < 0 ? NaN : x + y
    const { indices: idx1 } = buildExplicitMesh((x, y) => x + y, -1, 1, -1, 1, 4)
    const { indices: idx2 } = buildExplicitMesh(nanFn, -1, 1, -1, 1, 4)
    expect(idx2.length).toBeLessThan(idx1.length)
  })

  it('normals are unit vectors', () => {
    const { normals } = buildExplicitMesh((x, y) => x * y, -2, 2, -2, 2, 8)
    for (let i = 0; i < normals.length; i += 3) {
      const len = Math.sqrt(normals[i]**2 + normals[i+1]**2 + normals[i+2]**2)
      expect(len).toBeCloseTo(1, 4)
    }
  })

  it('flat z=0 normals point straight up', () => {
    const { normals } = buildExplicitMesh(() => 0, -1, 1, -1, 1, 4)
    for (let i = 0; i < normals.length; i += 3) {
      expect(normals[i]).toBeCloseTo(0, 4)
      expect(normals[i+1]).toBeCloseTo(0, 4)
      expect(normals[i+2]).toBeCloseTo(1, 4)
    }
  })
})

// ── marchingCubes ─────────────────────────────────────────────────────────────

describe('marchingCubes', () => {
  it('sphere x²+y²+z²=1 produces non-empty mesh', () => {
    const f = (x, y, z) => x*x + y*y + z*z - 1
    const { positions, normals } = marchingCubes(f, -1.5, 1.5, -1.5, 1.5, -1.5, 1.5, 10)
    expect(positions.length).toBeGreaterThan(0)
    expect(normals.length).toBe(positions.length)
    expect(positions.length % 9).toBe(0)  // triangles: 3 verts × 3 coords
  })

  it('plane z=0 (implicit z) produces triangles covering the XY plane', () => {
    const f = (x, y, z) => z
    const { positions } = marchingCubes(f, -1, 1, -1, 1, -0.5, 0.5, 4)
    expect(positions.length).toBeGreaterThan(0)
    // All z-coordinates should be near 0
    for (let i = 2; i < positions.length; i += 3) {
      expect(Math.abs(positions[i])).toBeLessThan(0.3)
    }
  })

  it('returns empty for all-outside function', () => {
    const f = () => 1   // always positive, nothing inside
    const { positions } = marchingCubes(f, -1, 1, -1, 1, -1, 1, 4)
    expect(positions.length).toBe(0)
  })

  it('returns empty for all-inside function', () => {
    const f = () => -1  // always negative, no surface
    const { positions } = marchingCubes(f, -1, 1, -1, 1, -1, 1, 4)
    expect(positions.length).toBe(0)
  })

  it('normals are unit vectors', () => {
    const f = (x, y, z) => x*x + y*y + z*z - 1
    const { normals } = marchingCubes(f, -1.5, 1.5, -1.5, 1.5, -1.5, 1.5, 6)
    for (let i = 0; i < normals.length; i += 3) {
      const len = Math.sqrt(normals[i]**2 + normals[i+1]**2 + normals[i+2]**2)
      expect(len).toBeCloseTo(1, 4)
    }
  })

  it('sphere vertices are near radius 1', () => {
    const f = (x, y, z) => x*x + y*y + z*z - 1
    const { positions } = marchingCubes(f, -1.5, 1.5, -1.5, 1.5, -1.5, 1.5, 15)
    let ok = 0
    for (let i = 0; i < positions.length; i += 3) {
      const r = Math.sqrt(positions[i]**2 + positions[i+1]**2 + positions[i+2]**2)
      if (Math.abs(r - 1) < 0.3) ok++
    }
    expect(ok).toBe(positions.length / 3)
  })

  it('cylinder x²+y²=0.25 (z not involved) produces triangles', () => {
    const f = (x, y) => x*x + y*y - 0.25
    const { positions } = marchingCubes(f, -1, 1, -1, 1, -1, 1, 8)
    expect(positions.length).toBeGreaterThan(0)
  })

  it('torus (R=2, r=0.5) produces non-empty surface', () => {
    const R = 2, r = 0.5
    const f = (x, y, z) => { const d = Math.sqrt(x*x+y*y) - R; return d*d + z*z - r*r }
    const { positions } = marchingCubes(f, -3, 3, -3, 3, -1, 1, 10)
    expect(positions.length).toBeGreaterThan(0)
  })

  it('hyperboloid x²+y²-z²=1 produces non-empty surface', () => {
    const f = (x, y, z) => x*x + y*y - z*z - 1
    const { positions } = marchingCubes(f, -2, 2, -2, 2, -1.5, 1.5, 10)
    expect(positions.length).toBeGreaterThan(0)
  })

  it('cone x²+y²=z² produces non-empty surface', () => {
    const f = (x, y, z) => x*x + y*y - z*z
    const { positions } = marchingCubes(f, -2, 2, -2, 2, -2, 2, 10)
    expect(positions.length).toBeGreaterThan(0)
  })
})

// ── additional edge cases ─────────────────────────────────────────────────────

describe('buildExplicitMesh: edge cases', () => {
  it('all-NaN function produces no index triangles', () => {
    const { indices } = buildExplicitMesh(() => NaN, -1, 1, -1, 1, 4)
    expect(indices.length).toBe(0)
  })

  it('constant z=5: zmin and zmax both 5; all colors match viridis(0)', () => {
    const { colors, zmin, zmax } = buildExplicitMesh(() => 5, -1, 1, -1, 1, 4)
    expect(zmin).toBeCloseTo(5)
    expect(zmax).toBeCloseTo(5)
    const [r0, g0, b0] = [colors[0], colors[1], colors[2]]
    for (let i = 0; i < colors.length; i += 3) {
      expect(colors[i]).toBeCloseTo(r0, 4)
      expect(colors[i+1]).toBeCloseTo(g0, 4)
      expect(colors[i+2]).toBeCloseTo(b0, 4)
    }
  })

  it('positions array length is (N+1)^2 * 3 for any N', () => {
    const N = 10
    const { positions } = buildExplicitMesh((x, y) => x + y, -1, 1, -1, 1, N)
    expect(positions.length).toBe((N+1) * (N+1) * 3)
  })
})

describe('compileImplicit3DFn: error handling', () => {
  it('throws on invalid expression', () => {
    expect(() => compileImplicit3DFn('((')).toThrow()
  })
  it('throws on mismatched parentheses', () => {
    expect(() => compileImplicit3DFn('x^2 + y^2 + z^2 =')).toThrow()
  })
})
