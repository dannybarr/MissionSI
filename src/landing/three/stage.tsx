import { Component, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Canvas, useFrame } from '@react-three/fiber'
import { View } from '@react-three/drei'
import * as THREE from 'three'

type Entry = { id: string; track: { current: HTMLElement }; node: ReactNode }

const views = new Map<string, Entry>()
const active = new Set<string>()
let notify = () => {}
let notifyLoop = (_on: boolean) => {}
let root: Root | null = null
let host: HTMLDivElement | null = null
let boot: Promise<void> | null = null
let alive = 0
let disposeTimer = 0

class StageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function ClearFrame() {
  useFrame(({ gl }) => {
    gl.setScissorTest(false)
    gl.setClearColor(0x000000, 0)
    gl.clear(true, true)
  }, -1)
  return null
}

function StageApp() {
  const [list, setList] = useState<Entry[]>([])
  const [loop, setLoop] = useState<'always' | 'never'>('always')
  useEffect(() => {
    let live = true
    notify = () => {
      if (live) setList([...views.values()])
    }
    notifyLoop = (on) => {
      if (live) setLoop(on ? 'always' : 'never')
    }
    notify()
    const onHide = () => notifyLoop(active.size > 0 && !document.hidden)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      live = false
      notify = () => {}
      notifyLoop = () => {}
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])
  return (
    <>
    <Canvas
      frameloop={loop}
      shadows="variance"
      dpr={[1, 1.6]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 16, near: 0.05, far: 400, position: [0, 0, 40] }}
      style={{ pointerEvents: 'none' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
        gl.shadowMap.type = THREE.VSMShadowMap
        gl.autoClear = false
      }}
    >
      <ClearFrame />
      <View.Port />
    </Canvas>
    {list.map((v, i) =>
      createPortal(
        <View key={v.id} index={i + 1} style={{ position: 'absolute', inset: '0', pointerEvents: 'none' }}>
          {v.node}
        </View>,
        v.track.current,
      ),
    )}
    </>
  )
}

function mount() {
  if (root) return
  host = document.createElement('div')
  host.className = 'm-stage-host'
  Object.assign(host.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '1',
    pointerEvents: 'none',
  })
  document.body.appendChild(host)
  root = createRoot(host)
  root.render(
    <StageBoundary>
      <StageApp />
    </StageBoundary>,
  )
}

export function acquireStage() {
  window.clearTimeout(disposeTimer)
  alive += 1
  if (!boot) {
    boot = Promise.resolve().then(() => {
      mount()
    })
  }
  return boot
}

export function releaseStage() {
  alive = Math.max(0, alive - 1)
  window.clearTimeout(disposeTimer)
  disposeTimer = window.setTimeout(() => {
    if (alive > 0 || !root) return
    root.unmount()
    host?.remove()
    root = null
    host = null
    boot = null
  }, 500)
}

export function registerView(id: string, track: HTMLElement, node: ReactNode) {
  const entry: Entry = { id, track: { current: track }, node }
  views.set(id, entry)
  notify()
  return () => {
    if (views.get(id) === entry) views.delete(id)
    active.delete(id)
    notify()
    notifyLoop(active.size > 0 && !document.hidden)
  }
}

/**
 * Every registered scene's useFrame runs whenever any view is active, because they share
 * one canvas. Heavy scenes check this to skip their work while they are off screen.
 */
export function isViewActive(id: string) {
  return active.has(id)
}

export function setViewActive(id: string, on: boolean) {
  if (on) active.add(id)
  else active.delete(id)
  notifyLoop(active.size > 0 && !document.hidden)
}
