import { math, normalizeExpression } from './mathEngine'

function angleScopeFor(angleMode) {
  const toRad = (x) => angleMode === 'deg' ? x * Math.PI / 180 : x
  const toOut = (r) => angleMode === 'deg' ? r * 180 / Math.PI : r
  return {
    sin: (x) => Math.sin(toRad(x)),
    cos: (x) => Math.cos(toRad(x)),
    tan: (x) => Math.tan(toRad(x)),
    sec: (x) => 1 / Math.cos(toRad(x)),
    csc: (x) => 1 / Math.sin(toRad(x)),
    cot: (x) => 1 / Math.tan(toRad(x)),
    asin: (x) => toOut(Math.asin(x)),
    acos: (x) => toOut(Math.acos(x)),
    atan: (x) => toOut(Math.atan(x)),
    arcsin: (x) => toOut(Math.asin(x)),
    arccos: (x) => toOut(Math.acos(x)),
    arctan: (x) => toOut(Math.atan(x)),
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
    log: (x) => Math.log10(x),
    ln:  (x) => Math.log(x),
    logb: (x, b) => Math.log(x) / Math.log(b),
  }
}

// Viridis colormap: t in [0,1] → [r, g, b] each in [0,1]
// 6th-degree polynomial approximation by Matt Zucker (public domain)
export function viridis(t) {
  t = Math.max(0, Math.min(1, t))
  const r = 0.2777273272234177 + t*(0.1050930431085774 + t*(-0.3308618287255563 + t*(-4.634230498983486 + t*(6.228269936347081 + t*(4.776384997670288 - t*5.435455855934631)))))
  const g = 0.005407344544966578 + t*(1.404613529219888 + t*(0.214847559468213 + t*(-5.799100973351585 + t*(14.17993336680509 + t*(-13.74514537774601 + t*4.645852612178535)))))
  const b = 0.3340998053353061 + t*(1.384590162594685 + t*(0.09509516302823659 + t*(-19.33244095627987 + t*(56.69055260068105 + t*(-65.35303263337234 + t*26.3124352495832)))))
  return [Math.max(0, Math.min(1, r)), Math.max(0, Math.min(1, g)), Math.max(0, Math.min(1, b))]
}

// Detect if expression contains z → implicit 3D surface; otherwise → explicit z=f(x,y)
export function parseExpr3D(rawExpr) {
  const expr = rawExpr.trim()
  if (!expr) return { implicit: false, expr }
  if (/(?<![a-zA-Z])z(?![a-zA-Z])/.test(expr)) return { implicit: true, expr }
  return { implicit: false, expr }
}

// Compile z = f(x,y). Throws on invalid expression.
export function compileExplicit3DFn(exprString, angleMode = 'rad') {
  const code = math.parse(normalizeExpression(exprString.trim())).compile()
  const scope = { ...angleScopeFor(angleMode), x: 0, y: 0 }
  return (x, y) => { scope.x = x; scope.y = y; return code.evaluate(scope) }
}

// Compile implicit F(x,y,z) = 0. "LHS = RHS" becomes LHS - RHS. Throws on invalid.
export function compileImplicit3DFn(exprString, angleMode = 'rad') {
  const raw = exprString.trim()
  const eqIdx = raw.indexOf('=')
  const combined = eqIdx >= 0
    ? `(${raw.slice(0, eqIdx).trim()}) - (${raw.slice(eqIdx + 1).trim()})`
    : raw
  const code = math.parse(normalizeExpression(combined)).compile()
  const scope = { ...angleScopeFor(angleMode), x: 0, y: 0, z: 0 }
  return (x, y, z) => { scope.x = x; scope.y = y; scope.z = z; return code.evaluate(scope) }
}

// Build explicit surface mesh data for Three.js BufferGeometry.
// Returns { positions, normals, colors, indices, zmin, zmax }.
export function buildExplicitMesh(fn, xmin, xmax, ymin, ymax, N = 80) {
  const cols = N + 1, rows = N + 1
  const dx = (xmax - xmin) / N, dy = (ymax - ymin) / N

  const zv = new Float64Array(rows * cols)
  let zDataMin = Infinity, zDataMax = -Infinity
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let z; try { z = fn(xmin + i * dx, ymin + j * dy) } catch { z = NaN }
      if (!isFinite(z)) z = NaN
      zv[j * cols + i] = z
      if (!isNaN(z)) {
        if (z < zDataMin) zDataMin = z
        if (z > zDataMax) zDataMax = z
      }
    }
  }
  if (!isFinite(zDataMin)) { zDataMin = 0; zDataMax = 1 }
  const zRange = zDataMax - zDataMin || 1

  const positions = new Float32Array(rows * cols * 3)
  const colors    = new Float32Array(rows * cols * 3)
  const normals   = new Float32Array(rows * cols * 3)

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i
      const z = zv[k]
      positions[k*3]   = xmin + i * dx
      positions[k*3+1] = ymin + j * dy
      positions[k*3+2] = isNaN(z) ? 0 : z
      const rgb = viridis(isNaN(z) ? 0 : (z - zDataMin) / zRange)
      colors[k*3] = rgb[0]; colors[k*3+1] = rgb[1]; colors[k*3+2] = rgb[2]
    }
  }

  // Smooth normals via central differences of z
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i
      if (isNaN(zv[k])) { normals[k*3+2] = 1; continue }
      const zl = i > 0      ? zv[j * cols + (i-1)]   : NaN
      const zr = i < cols-1 ? zv[j * cols + (i+1)]   : NaN
      const zb = j > 0      ? zv[(j-1) * cols + i]   : NaN
      const zt = j < rows-1 ? zv[(j+1) * cols + i]   : NaN
      const dzdx = (!isNaN(zl) && !isNaN(zr)) ? (zr-zl)/(2*dx) : (!isNaN(zr)) ? (zr-zv[k])/dx : (!isNaN(zl)) ? (zv[k]-zl)/dx : 0
      const dzdy = (!isNaN(zb) && !isNaN(zt)) ? (zt-zb)/(2*dy) : (!isNaN(zt)) ? (zt-zv[k])/dy : (!isNaN(zb)) ? (zv[k]-zb)/dy : 0
      const len = Math.sqrt(dzdx*dzdx + dzdy*dzdy + 1)
      normals[k*3]   = -dzdx / len
      normals[k*3+1] = -dzdy / len
      normals[k*3+2] = 1 / len
    }
  }

  const idxList = []
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const a = j*cols+i, b = j*cols+(i+1), c = (j+1)*cols+i, d = (j+1)*cols+(i+1)
      if (isNaN(zv[a]) || isNaN(zv[b]) || isNaN(zv[c]) || isNaN(zv[d])) continue
      idxList.push(a, b, d, a, d, c)
    }
  }

  return { positions, normals, colors, indices: new Uint32Array(idxList), zmin: zDataMin, zmax: zDataMax }
}

// Marching cubes for implicit surface F(x,y,z) = 0.
// Uses 6-tetrahedra-per-cube decomposition (small, verifiable tri table).
// Returns { positions, normals } as flat Float32Arrays (3 verts × 3 coords per triangle).
export function marchingCubes(fn, xmin, xmax, ymin, ymax, zmin, zmax, N = 40) {
  const nx = N+1, ny = N+1, nz = N+1
  const dx = (xmax-xmin)/N, dy = (ymax-ymin)/N, dz = (zmax-zmin)/N

  const field = new Float32Array(nx * ny * nz)
  for (let iz = 0; iz < nz; iz++) {
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        let f; try { f = fn(xmin+ix*dx, ymin+iy*dy, zmin+iz*dz) } catch { f = 0 }
        field[iz*ny*nx + iy*nx + ix] = isFinite(f) ? f : 0
      }
    }
  }

  // Each of the 6 tets per cube is [A,B,C,D] as cube-vertex indices (0-7)
  // Cube vertex 0=(0,0,0) 1=(1,0,0) 2=(1,1,0) 3=(0,1,0) 4=(0,0,1) 5=(1,0,1) 6=(1,1,1) 7=(0,1,1)
  const CUBE_TETS = [
    [0,5,1,6], [0,1,2,6], [0,2,3,6],
    [0,3,7,6], [0,7,4,6], [0,4,5,6],
  ]
  // Cube vertex (ix,iy,iz) offset for each of the 8 cube corners
  const VTX = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]]
  // Edge vertex index pairs for tet [A,B,C,D]: edge i connects TET_EDGE_VERTS[i]
  const TET_EDGES = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]]
  // Triangle edge triplets per 4-bit inside-mask (bit i = vertex i of tet is inside)
  const TET_TRI = [
    [],                      // 0000 all outside
    [[0,2,1]],               // 0001 A in
    [[0,3,4]],               // 0010 B in
    [[1,3,4],[1,4,2]],       // 0011 AB in
    [[1,3,5]],               // 0100 C in
    [[0,3,5],[0,5,2]],       // 0101 AC in
    [[0,1,5],[0,5,4]],       // 0110 BC in
    [[2,4,5]],               // 0111 ABC in
    [[2,5,4]],               // 1000 D in
    [[0,5,1],[0,4,5]],       // 1001 AD in
    [[0,2,5],[0,5,3]],       // 1010 BD in
    [[1,5,3]],               // 1011 ABD in
    [[1,4,3],[1,2,4]],       // 1100 CD in
    [[0,4,3]],               // 1101 ACD in
    [[0,1,2]],               // 1110 BCD in
    [],                      // 1111 all inside
  ]

  const fAt = (ix, iy, iz) => field[iz*ny*nx + iy*nx + ix]
  const positions = [], normals = []

  for (let iz = 0; iz < N; iz++) {
    for (let iy = 0; iy < N; iy++) {
      for (let ix = 0; ix < N; ix++) {
        const cx = xmin+ix*dx, cy = ymin+iy*dy, cz = zmin+iz*dz
        const cv = VTX.map(([vx,vy,vz]) => ({
          x: cx+vx*dx, y: cy+vy*dy, z: cz+vz*dz,
          f: fAt(ix+vx, iy+vy, iz+vz),
        }))

        for (const tet of CUBE_TETS) {
          const tv = tet.map(i => cv[i])
          const cfg = tv.reduce((acc, v, i) => acc | (v.f < 0 ? 1 << i : 0), 0)
          const tris = TET_TRI[cfg]
          if (!tris.length) continue

          const ep = TET_EDGES.map(([a, b]) => {
            const va = tv[a], vb = tv[b]
            const denom = va.f - vb.f
            const t = Math.abs(denom) < 1e-10 ? 0.5 : va.f / denom
            return [va.x + t*(vb.x-va.x), va.y + t*(vb.y-va.y), va.z + t*(vb.z-va.z)]
          })

          for (const [e0, e1, e2] of tris) {
            const p0 = ep[e0], p1 = ep[e1], p2 = ep[e2]
            // Face normal via cross product (p1-p0) × (p2-p0)
            const ux = p1[0]-p0[0], uy = p1[1]-p0[1], uz = p1[2]-p0[2]
            const vx = p2[0]-p0[0], vy = p2[1]-p0[1], vz = p2[2]-p0[2]
            const nx_ = uy*vz-uz*vy, ny_ = uz*vx-ux*vz, nz_ = ux*vy-uy*vx
            const nl = Math.sqrt(nx_*nx_+ny_*ny_+nz_*nz_)
            if (nl < 1e-10) continue  // skip degenerate (zero-area) triangles
            const nnx = nx_/nl, nny = ny_/nl, nnz = nz_/nl
            positions.push(...p0, ...p1, ...p2)
            normals.push(nnx,nny,nnz, nnx,nny,nnz, nnx,nny,nnz)
          }
        }
      }
    }
  }

  return { positions: new Float32Array(positions), normals: new Float32Array(normals) }
}
