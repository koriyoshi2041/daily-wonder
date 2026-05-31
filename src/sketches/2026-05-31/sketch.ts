import p5 from 'p5'

type Block = {
  label: string
  x: number
  y: number
  vx: number
  vy: number
  r: number
  charge: number
  bias: number
}

type Ray = {
  from: number
  to: number
  u: number
  speed: number
  hue: number
}

const labels = ['claim', 'source', 'context', 'exception', 'model', 'test', 'memory', 'transfer', 'risk']

export default function setup(container: HTMLElement): void {
  const sketch = (p: p5) => {
    let blocks: Block[] = []
    let rays: Ray[] = []
    let active: number | null = null
    let touchField = { x: 0, y: 0, force: 0 }
    let mode = 0
    let size = 720

    const resize = (): void => {
      const rect = container.getBoundingClientRect()
      size = Math.max(320, Math.min(900, rect.width || 720))
      p.resizeCanvas(size, size)
      seedBlocks()
    }

    const seedBlocks = (): void => {
      blocks = labels.map((label, i) => {
        const a = (p.TWO_PI * i) / labels.length - p.HALF_PI
        const ring = size * (0.23 + (i % 3) * 0.045)
        return {
          label,
          x: size * 0.5 + Math.cos(a) * ring,
          y: size * 0.52 + Math.sin(a) * ring,
          vx: p.random(-0.4, 0.4),
          vy: p.random(-0.4, 0.4),
          r: p.constrain(size * 0.045 + label.length * 1.2, 25, 46),
          charge: p.random(0.25, 0.85),
          bias: p.random(p.TWO_PI),
        }
      })
      rays = []
      for (let i = 0; i < 7; i += 1) emitRay(Math.floor(p.random(blocks.length)))
    }

    p.setup = () => {
      const rect = container.getBoundingClientRect()
      size = Math.max(320, Math.min(900, rect.width || 720))
      const canvas = p.createCanvas(size, size)
      canvas.parent(container)
      p.pixelDensity(Math.min(2, window.devicePixelRatio || 1))
      p.textFont('system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif')
      seedBlocks()
    }

    p.draw = () => {
      p.background('#f4f0e7')
      drawAtmosphere()
      updateBlocks()
      drawRelations()
      updateRays()
      drawBlocks()
      drawHud()
      touchField.force *= 0.92
    }

    const drawAtmosphere = (): void => {
      p.noFill()
      for (let i = 0; i < 19; i += 1) {
        const w = size * (0.15 + i * 0.055)
        const wobble = Math.sin(p.frameCount * 0.01 + i) * 9
        p.stroke(i % 2 ? '#d9cdb5' : '#c7d6c5')
        p.strokeWeight(i % 5 === 0 ? 1.4 : 0.65)
        p.ellipse(size * 0.5 + wobble, size * 0.52, w, w * (0.62 + i * 0.006))
      }

      p.noStroke()
      p.fill(44, 59, 63, 16)
      p.textAlign(p.LEFT, p.TOP)
      p.textStyle(p.BOLD)
      p.textSize(size * 0.105)
      p.text('WEATHER', size * 0.035, size * 0.81)
      p.textStyle(p.NORMAL)
    }

    const updateBlocks = (): void => {
      const cx = size * 0.5
      const cy = size * 0.51
      for (let i = 0; i < blocks.length; i += 1) {
        const b = blocks[i]
        if (active === i) continue

        let ax = (cx - b.x) * 0.00085
        let ay = (cy - b.y) * 0.00085
        const swirl = mode === 0 ? 1 : mode === 1 ? -1 : 0.35
        ax += Math.cos(p.frameCount * 0.018 + b.bias) * 0.035 * swirl
        ay += Math.sin(p.frameCount * 0.015 + b.bias) * 0.035

        for (let j = 0; j < blocks.length; j += 1) {
          if (i === j) continue
          const other = blocks[j]
          const dx = b.x - other.x
          const dy = b.y - other.y
          const d2 = Math.max(80, dx * dx + dy * dy)
          const push = (660 + b.charge * 220) / d2
          ax += dx * push
          ay += dy * push
        }

        if (touchField.force > 0.01) {
          const dx = b.x - touchField.x
          const dy = b.y - touchField.y
          const d2 = Math.max(70, dx * dx + dy * dy)
          const sign = mode === 2 ? -1 : 1
          ax += (dx / d2) * 170 * touchField.force * sign
          ay += (dy / d2) * 170 * touchField.force * sign
        }

        b.vx = (b.vx + ax) * 0.91
        b.vy = (b.vy + ay) * 0.91
        b.x = p.constrain(b.x + b.vx, b.r + 12, size - b.r - 12)
        b.y = p.constrain(b.y + b.vy, b.r + 12, size - b.r - 12)
        b.charge = p.lerp(b.charge, 0.3 + 0.45 * p.noise(b.x * 0.005, b.y * 0.005, p.frameCount * 0.006), 0.04)
      }
    }

    const drawRelations = (): void => {
      for (let i = 0; i < blocks.length; i += 1) {
        for (let j = i + 1; j < blocks.length; j += 1) {
          const a = blocks[i]
          const b = blocks[j]
          const d = p.dist(a.x, a.y, b.x, b.y)
          if (d > size * 0.42) continue
          const strength = 1 - d / (size * 0.42)
          p.stroke(48, 57, 50, 28 + strength * 80)
          p.strokeWeight(0.7 + strength * 2.4)
          const bend = Math.sin((i + j) * 1.7 + p.frameCount * 0.018) * 18 * strength
          p.noFill()
          p.bezier(a.x, a.y, (a.x + b.x) * 0.5 + bend, (a.y + b.y) * 0.5 - bend, (a.x + b.x) * 0.5 + bend, (a.y + b.y) * 0.5 - bend, b.x, b.y)
        }
      }
    }

    const updateRays = (): void => {
      if (p.frameCount % 22 === 0) emitRay(Math.floor(p.random(blocks.length)))
      for (let i = rays.length - 1; i >= 0; i -= 1) {
        const ray = rays[i]
        ray.u += ray.speed
        if (ray.u >= 1) {
          blocks[ray.to].charge = 1
          if (p.random() < 0.55) emitRay(ray.to)
          rays.splice(i, 1)
          continue
        }
        const a = blocks[ray.from]
        const b = blocks[ray.to]
        const u = 1 - Math.pow(1 - ray.u, 3)
        const x = p.lerp(a.x, b.x, u)
        const y = p.lerp(a.y, b.y, u)
        p.noStroke()
        p.fill(ray.hue, 95, 64, 170)
        p.circle(x, y, 5 + Math.sin(ray.u * Math.PI) * 13)
        p.fill('#fff8df')
        p.circle(x, y, 3)
      }
    }

    const drawBlocks = (): void => {
      blocks.forEach((b, i) => {
        const hot = active === i || p.dist(p.mouseX, p.mouseY, b.x, b.y) < b.r * 1.2
        const r = b.r + b.charge * 8 + Math.sin(p.frameCount * 0.04 + b.bias) * 2
        const colors = ['#3f6058', '#bb6b45', '#425d82', '#8d7045', '#7d4b5b', '#526f48', '#29363c', '#9a8642', '#5b6d77']

        p.noStroke()
        p.fill(48, 57, 50, hot ? 58 : 34)
        p.circle(b.x, b.y, r * 2.75)
        p.fill(colors[i % colors.length])
        p.circle(b.x, b.y, r * 1.72)
        p.fill(255, 247, 221, 220)
        p.circle(b.x - r * 0.2, b.y - r * 0.18, r * 0.56)
        p.fill('#263036')
        p.textAlign(p.CENTER, p.CENTER)
        p.textStyle(p.BOLD)
        p.textSize(p.constrain(r * 0.28, 10, 15))
        p.text(b.label, b.x, b.y + 1)
        p.textStyle(p.NORMAL)
      })
    }

    const drawHud = (): void => {
      const pressure = Math.floor(p.constrain(p.map(meanDistance(), size * 0.18, size * 0.36, 91, 28), 12, 96))
      p.noStroke()
      p.fill('#263036')
      p.textAlign(p.LEFT, p.TOP)
      p.textStyle(p.BOLD)
      p.textSize(14)
      p.text('Argument Weather Station', 16, 16)
      p.textStyle(p.NORMAL)
      p.fill('#65685e')
      p.text(`coherence ${pressure}% · drag labels · tap to stir · M mode ${mode + 1} · R reset`, 16, 38, size - 32)
    }

    const meanDistance = (): number => {
      let sum = 0
      let count = 0
      for (let i = 0; i < blocks.length; i += 1) {
        for (let j = i + 1; j < blocks.length; j += 1) {
          sum += p.dist(blocks[i].x, blocks[i].y, blocks[j].x, blocks[j].y)
          count += 1
        }
      }
      return sum / count
    }

    const emitRay = (from: number): void => {
      const candidates = blocks.map((_, index) => index).filter((index) => index !== from)
      const to = candidates[Math.floor(p.random(candidates.length))]
      rays.push({ from, to, u: 0, speed: p.random(0.008, 0.019), hue: p.random([70, 138, 202, 18]) })
    }

    const pickBlock = (x: number, y: number): number | null => {
      let best: number | null = null
      let bestD = Infinity
      blocks.forEach((b, i) => {
        const d = p.dist(x, y, b.x, b.y)
        if (d < b.r * 1.35 && d < bestD) {
          best = i
          bestD = d
        }
      })
      return best
    }

    p.mousePressed = () => {
      active = pickBlock(p.mouseX, p.mouseY)
      touchField = { x: p.mouseX, y: p.mouseY, force: active === null ? 1 : 0.35 }
      if (active === null) emitRay(Math.floor(p.random(blocks.length)))
      return false
    }

    p.mouseDragged = () => {
      touchField = { x: p.mouseX, y: p.mouseY, force: 1 }
      if (active !== null) {
        const b = blocks[active]
        b.x = p.constrain(p.mouseX, b.r + 12, size - b.r - 12)
        b.y = p.constrain(p.mouseY, b.r + 12, size - b.r - 12)
        b.vx = p.movedX * 0.25
        b.vy = p.movedY * 0.25
        b.charge = 1
      }
      return false
    }

    p.mouseReleased = () => {
      active = null
    }

    p.touchStarted = () => p.mousePressed()
    p.touchMoved = () => p.mouseDragged()
    p.touchEnded = () => {
      active = null
      return false
    }

    p.keyPressed = () => {
      if (p.key === 'r' || p.key === 'R') seedBlocks()
      if (p.key === 'm' || p.key === 'M') mode = (mode + 1) % 3
      if (p.key === ' ') emitRay(Math.floor(p.random(blocks.length)))
    }

    p.windowResized = resize
  }

  new p5(sketch)
}
