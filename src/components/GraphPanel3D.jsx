import { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { parseExpr3D, compileExplicit3DFn, compileImplicit3DFn, buildExplicitMesh, marchingCubes } from '../engine/numeric3d'
import { CURVE_COLORS } from './GraphPanel'
import { trackEvent } from '../analytics'

const DEFAULT_WIN = { xmin: '-5', xmax: '5', ymin: '-5', ymax: '5', zmin: '-5', zmax: '5' }

function parseWin3D(s) {
  const keys = ['xmin', 'xmax', 'ymin', 'ymax', 'zmin', 'zmax']
  const w = {}
  for (const k of keys) {
    const v = parseFloat(s[k])
    if (isNaN(v)) return null
    w[k] = v
  }
  if (w.xmin >= w.xmax || w.ymin >= w.ymax || w.zmin >= w.zmax) return null
  return w
}

function fmtWin(n) { return String(parseFloat(n.toPrecision(6))) }

export default function GraphPanel3D({ angleMode }) {
  const [fns, setFns] = useState([{ expr: 'sin(x)*cos(y)', visible: true }])
  const [winStr, setWinStr] = useState(DEFAULT_WIN)
  const [wireframe, setWireframe] = useState(false)
  const [computing, setComputing] = useState(false)
  const [error, setError] = useState(null)
  const [zInfo, setZInfo] = useState(null)  // auto-computed z range for explicit

  const canvasRef    = useRef(null)
  const sceneRef     = useRef(null)
  const rendererRef  = useRef(null)
  const cameraRef    = useRef(null)
  const controlsRef  = useRef(null)
  const animFrameRef = useRef(null)
  const surfacesRef  = useRef([])   // [{ mesh, wfMesh }]
  const wireframeRef = useRef(wireframe)
  wireframeRef.current = wireframe

  // ── Three.js scene setup (once on mount) ──────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0F1117)
    sceneRef.current = scene

    const W = canvas.clientWidth || 600
    const H = canvas.clientHeight || 400

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 2000)
    camera.position.set(12, -12, 8)
    camera.up.set(0, 0, 1)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(W, H, false)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.target.set(0, 0, 0)
    controlsRef.current = controls

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.45))
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.85)
    dir1.position.set(10, -10, 15)
    scene.add(dir1)
    const dir2 = new THREE.DirectionalLight(0x7799ff, 0.35)
    dir2.position.set(-8, 8, -10)
    scene.add(dir2)

    // XY grid (Z-up): rotate a standard horizontal grid 90° around X
    const grid = new THREE.GridHelper(20, 20, 0x1C2030, 0x1C2030)
    grid.rotation.x = Math.PI / 2
    scene.add(grid)

    // Axes: X=red, Y=green, Z=blue
    scene.add(new THREE.AxesHelper(6))

    // Resize observer
    const onResize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight
      if (!w || !h) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(canvas.parentElement || canvas)

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
    }
  }, [])

  // ── Toggle wireframe on existing meshes ───────────────────────────────────
  useEffect(() => {
    surfacesRef.current.forEach(({ wfMesh }) => {
      if (wfMesh) wfMesh.visible = wireframe
    })
  }, [wireframe])

  // ── Remove all plotted surfaces from scene ────────────────────────────────
  const clearSurfaces = () => {
    const scene = sceneRef.current
    if (!scene) return
    surfacesRef.current.forEach(({ mesh, wfMesh }) => {
      scene.remove(mesh)
      mesh.geometry.dispose()
      mesh.material.dispose()
      if (wfMesh) {
        scene.remove(wfMesh)
        wfMesh.geometry.dispose()
        wfMesh.material.dispose()
      }
    })
    surfacesRef.current = []
  }

  // ── Plot ──────────────────────────────────────────────────────────────────
  const plot = useCallback(() => {
    const scene = sceneRef.current
    if (!scene) return

    const win = parseWin3D(winStr)
    if (!win) { setError('Invalid window settings'); return }

    const toPlot = fns
      .map((f, i) => ({ ...f, idx: i }))
      .filter(f => f.visible && f.expr.trim())

    if (!toPlot.length) { setError('No visible functions to plot'); return }

    setError(null)
    setComputing(true)
    setZInfo(null)

    requestAnimationFrame(() => {
      try {
        clearSurfaces()
        const surfaces = []
        let autoZmin = Infinity, autoZmax = -Infinity
        let hasExplicit = false

        for (const { expr, idx } of toPlot) {
          const { implicit } = parseExpr3D(expr.trim())
          const color = CURVE_COLORS[idx % CURVE_COLORS.length]
          const color3 = new THREE.Color(color)

          if (!implicit) {
            hasExplicit = true
            const fn = compileExplicit3DFn(expr.trim(), angleMode)
            const { positions, normals, colors, indices, zmin, zmax } = buildExplicitMesh(
              fn, win.xmin, win.xmax, win.ymin, win.ymax, 80
            )
            if (zmin < autoZmin) autoZmin = zmin
            if (zmax > autoZmax) autoZmax = zmax

            const geom = new THREE.BufferGeometry()
            geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
            geom.setAttribute('normal',   new THREE.BufferAttribute(normals, 3))
            geom.setAttribute('color',    new THREE.BufferAttribute(colors, 3))
            geom.setIndex(new THREE.BufferAttribute(indices, 1))

            const mat = new THREE.MeshPhongMaterial({
              vertexColors: true,
              side: THREE.DoubleSide,
              shininess: 40,
            })
            const mesh = new THREE.Mesh(geom, mat)
            scene.add(mesh)

            const wfGeom = new THREE.WireframeGeometry(geom)
            const wfMat = new THREE.LineBasicMaterial({ color: 0x1C2030, transparent: true, opacity: 0.25 })
            const wfMesh = new THREE.LineSegments(wfGeom, wfMat)
            wfMesh.visible = wireframeRef.current
            scene.add(wfMesh)

            surfaces.push({ mesh, wfMesh })
          } else {
            const fn = compileImplicit3DFn(expr.trim(), angleMode)
            const { positions, normals } = marchingCubes(
              fn, win.xmin, win.xmax, win.ymin, win.ymax, win.zmin, win.zmax, 40
            )

            if (positions.length === 0) continue

            const geom = new THREE.BufferGeometry()
            geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
            geom.setAttribute('normal',   new THREE.BufferAttribute(normals, 3))

            const mat = new THREE.MeshPhongMaterial({
              color: color3,
              side: THREE.DoubleSide,
              shininess: 40,
              transparent: true,
              opacity: 0.85,
            })
            const mesh = new THREE.Mesh(geom, mat)
            scene.add(mesh)

            const wfGeom = new THREE.WireframeGeometry(geom)
            const wfMat = new THREE.LineBasicMaterial({ color: color3, transparent: true, opacity: 0.15 })
            const wfMesh = new THREE.LineSegments(wfGeom, wfMat)
            wfMesh.visible = wireframeRef.current
            scene.add(wfMesh)

            surfaces.push({ mesh, wfMesh })
          }
        }

        surfacesRef.current = surfaces
        if (hasExplicit && isFinite(autoZmin)) {
          setZInfo({ zmin: fmtWin(autoZmin), zmax: fmtWin(autoZmax) })
        }

        trackEvent('graph3d_plotted', {
          fn_count: toPlot.length,
          has_implicit: toPlot.some(f => parseExpr3D(f.expr.trim()).implicit),
        })
      } catch (e) {
        setError(e?.message || 'Plot error')
      } finally {
        setComputing(false)
      }
    })
  }, [fns, winStr, angleMode])

  const handleReset = () => {
    const camera = cameraRef.current, controls = controlsRef.current
    if (!camera || !controls) return
    camera.position.set(12, -12, 8)
    camera.up.set(0, 0, 1)
    controls.target.set(0, 0, 0)
    controls.update()
  }

  const updateFn = (i, patch) => setFns(prev => prev.map((f, j) => j === i ? { ...f, ...patch } : f))

  const WIN_FIELDS = [
    ['xmin','Xmin'],['xmax','Xmax'],['ymin','Ymin'],
    ['ymax','Ymax'],['zmin','Zmin'],['zmax','Zmax'],
  ]

  return (
    <>
      <div className="graph-fns">
        {fns.map(({ expr, visible }, i) => {
          const { implicit } = parseExpr3D(expr.trim())
          const label = implicit ? `f${i+1}(x,y,z)` : `f${i+1}(x,y)`
          return (
            <div key={i} className={`graph-fn-row${visible ? '' : ' graph-fn-hidden'}`}>
              <span className="graph-fn-label" style={{ color: visible ? CURVE_COLORS[i % CURVE_COLORS.length] : '#555B6E' }}>{label}</span>
              <input
                className="graph-fn-input"
                value={expr}
                placeholder={implicit ? 'e.g. x^2+y^2+z^2=9' : 'e.g. sin(x)*cos(y)'}
                onChange={e => updateFn(i, { expr: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && plot()}
              />
              <button className={`graph-fn-eye${visible ? ' active' : ''}`} onClick={() => updateFn(i, { visible: !visible })} title={visible ? 'Hide' : 'Show'}>{visible ? '●' : '○'}</button>
              {fns.length > 1 && <button className="graph-fn-remove" onClick={() => setFns(prev => prev.filter((_, j) => j !== i))} aria-label="Remove">×</button>}
            </div>
          )
        })}
        <button className="graph-fn-add" onClick={() => setFns(prev => [...prev, { expr: '', visible: true }])}>+ add function</button>
        <p className="graph-fn-tip">z=f(x,y) for explicit surfaces · include z for implicit (e.g. x²+y²+z²=9 for a sphere)</p>
      </div>

      <div className="graph-win">
        {WIN_FIELDS.map(([k, label]) => (
          <label key={k} className="graph-win-field">
            <span>{label}</span>
            <input className="tbl-num" value={winStr[k]} onChange={e => setWinStr(w => ({ ...w, [k]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && plot()} />
          </label>
        ))}
        <div className="graph-view-toggle">
          <button className={`graph-view-btn${wireframe ? ' active' : ''}`} onClick={() => setWireframe(w => !w)} title="Toggle wireframe overlay">WIRE</button>
          <button className="graph-view-btn" onClick={handleReset} title="Reset camera to default view">RESET</button>
        </div>
        <button className="ov-close tbl-go" onClick={plot} disabled={computing}>{computing ? '…' : 'plot'}</button>
        <span className="graph-crosshair-hint">
          {computing ? 'computing…' : 'drag to rotate · scroll to zoom · right-drag to pan'}
        </span>
      </div>

      {error && <div className="ov-note tbl-error">{error}</div>}
      {zInfo && <div className="ov-note graph3d-zinfo">auto z: {zInfo.zmin} to {zInfo.zmax}</div>}

      <div className="graph3d-canvas-wrapper">
        {computing && <div className="graph3d-computing">computing…</div>}
        <canvas ref={canvasRef} className="graph3d-canvas" />
      </div>
    </>
  )
}
