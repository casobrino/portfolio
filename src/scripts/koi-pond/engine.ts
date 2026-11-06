import { KoiRenderer } from './renderer'
import { World, type Box } from './world'

const STEP = 1 / 60
const MAX_STEPS = 4
const INTERACTIVE = "a, button, input, textarea, select, label, [role='button'], [data-koi-ignore]"
const AVOID_TARGETS = '[data-koi-avoid]'
const MEASURE_EVERY_FRAMES = 30
const MERGE_GAP_PX = 160

function mergeNearby (boxes: Box[]) {
  const merged: Box[] = []
  for (const b of [...boxes].sort((p, q) => p.top - q.top)) {
    const near = merged.find(
      (m) => b.top - m.bottom < MERGE_GAP_PX && b.left - m.right < MERGE_GAP_PX && m.left - b.right < MERGE_GAP_PX
    )
    if (!near) {
      merged.push({ ...b })
      continue
    }
    near.left = Math.min(near.left, b.left)
    near.right = Math.max(near.right, b.right)
    near.bottom = Math.max(near.bottom, b.bottom)
  }
  return merged
}

function isLightTheme () {
  return document.documentElement.dataset.theme === 'light'
}

class PondEngine {
  private world = new World()
  private renderer: KoiRenderer
  private raf = 0
  private last = 0
  private acc = 0
  private frames = 0
  private lastPointerTime = 0
  private visible = true
  private disposed = false
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  private resizeObserver = new ResizeObserver(() => this.resize())
  private intersectionObserver = new IntersectionObserver(([entry]) => {
    this.visible = entry.isIntersecting
    this.schedule()
  })

  constructor (private canvas: HTMLCanvasElement) {
    this.renderer = new KoiRenderer(canvas)
    this.resizeObserver.observe(canvas)
    this.intersectionObserver.observe(canvas)
    this.reducedMotion.addEventListener('change', this.schedule)
    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('click', this.onClick)
    document.documentElement.addEventListener('pointerleave', this.onPointerLeave)
    window.addEventListener('blur', this.onPointerLeave)
    this.setTheme(isLightTheme())
    this.resize()
    this.schedule()
  }

  destroy () {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.resizeObserver.disconnect()
    this.intersectionObserver.disconnect()
    this.reducedMotion.removeEventListener('change', this.schedule)
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('click', this.onClick)
    document.documentElement.removeEventListener('pointerleave', this.onPointerLeave)
    window.removeEventListener('blur', this.onPointerLeave)
  }

  setTheme (isLight: boolean) {
    this.renderer.setTheme(isLight)
    if (this.reducedMotion.matches) this.drawStill()
  }

  private resize () {
    const rect = this.canvas.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return
    this.renderer.resize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, 2))
    this.world.resize(rect.width, rect.height)
    this.measureContent()
    if (this.reducedMotion.matches) this.drawStill()
  }

  private schedule = () => {
    cancelAnimationFrame(this.raf)
    if (this.disposed || !this.visible) return
    if (this.reducedMotion.matches) {
      this.drawStill()
      return
    }
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  private measureContent () {
    const origin = this.canvas.getBoundingClientRect()
    const scope = this.canvas.closest('.hero') ?? document
    const measured = Array.from(scope.querySelectorAll(AVOID_TARGETS), (el) => el.getBoundingClientRect())
      .filter((b) => b.width > 0 && b.height > 0)
      .map((b) => ({
        left: b.left - origin.left,
        top: b.top - origin.top,
        right: b.right - origin.left,
        bottom: b.bottom - origin.top
      }))
    const boxes = mergeNearby(measured)
    this.renderer.setDimBoxes(boxes)
    this.world.avoid = boxes
  }

  private frame = (now: number) => {
    const dt = Math.min(0.1, (now - this.last) / 1000)
    this.last = now
    this.acc += dt
    let steps = 0
    while (this.acc >= STEP && steps < MAX_STEPS) {
      this.world.step(STEP)
      this.acc -= STEP
      steps++
    }
    if (steps === MAX_STEPS) this.acc = 0
    if (++this.frames % MEASURE_EVERY_FRAMES === 0) this.measureContent()
    this.renderer.render(this.world, dt)
    this.raf = requestAnimationFrame(this.frame)
  }

  private drawStill () {
    if (this.world.time < 4) {
      for (let i = 0; i < 240; i++) this.world.step(STEP)
    }
    this.measureContent()
    this.renderer.render(this.world, STEP)
  }

  private toLocal (e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    return { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height }
  }

  private onPointerMove = (e: PointerEvent) => {
    const { x, y, inside } = this.toLocal(e)
    const p = this.world.pointer
    const elapsed = Math.max(1, e.timeStamp - this.lastPointerTime) / 1000
    const speed = Math.hypot(x - p.x, y - p.y) / elapsed
    p.speed += (Math.min(speed, 5000) - p.speed) * 0.5
    this.lastPointerTime = e.timeStamp
    p.x = x
    p.y = y
    p.active = inside && e.pointerType !== 'touch'
  }

  private onClick = (e: MouseEvent) => {
    if (this.reducedMotion.matches) return
    if (e.composedPath().some((n) => n instanceof Element && n.matches(INTERACTIVE))) return
    if (window.getSelection()?.toString()) return
    const { x, y, inside } = this.toLocal(e)
    if (!inside) return
    this.world.feed(x, y)
  }

  private onPointerLeave = () => {
    this.world.pointer.active = false
    this.world.pointer.speed = 0
  }
}

export function startKoiPond (canvas: HTMLCanvasElement) {
  const engine = new PondEngine(canvas)
  const themeObserver = new MutationObserver(() => engine.setTheme(isLightTheme()))
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return {
    destroy () {
      themeObserver.disconnect()
      engine.destroy()
    }
  }
}
