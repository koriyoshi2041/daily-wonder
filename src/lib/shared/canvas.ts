/** Create a canvas with proper DPI scaling */
export function createCanvas(
  container: HTMLElement,
  width: number,
  height: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get 2d context')

  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx.scale(dpr, dpr)

  container.appendChild(canvas)

  return { canvas, ctx }
}

/** Animation loop with cleanup */
export function createAnimationLoop(
  callback: (time: number, deltaTime: number) => void
): { start: () => void; stop: () => void } {
  let rafId: number | null = null
  let lastTime = 0

  const frame = (time: number) => {
    const dt = lastTime === 0 ? 0 : time - lastTime
    lastTime = time
    callback(time, dt)
    rafId = requestAnimationFrame(frame)
  }

  return {
    start: () => {
      if (rafId === null) {
        lastTime = 0
        rafId = requestAnimationFrame(frame)
      }
    },
    stop: () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
        lastTime = 0
      }
    },
  }
}
