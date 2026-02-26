import p5 from 'p5'

interface Particle {
  x: number
  y: number
  homeX: number
  homeY: number
  targetX: number
  targetY: number
  char: string
  size: number
  alpha: number
  noiseOffset: number
  speed: number
  revealed: boolean
  revealProgress: number
  lineIndex: number
}

interface FingerprintPoint {
  x: number
  y: number
  baseX: number
  baseY: number
  edgeFade: number
}

const chars = 'abcdefghijklmnopqrstuvwxyz0123456789@#$%&*?.,:;\'"[]{}()<>-+=_/\\|~`'
const meaningfulWords = ['who', 'am', 'I', '???', 'anonymous', 'hidden', 'revealed', 'identity', 'style', 'pattern']

const palette = {
  bg: [8, 10, 18],
  particle: [120, 160, 200],
  revealed: [0, 255, 180],
  fingerprint: [255, 100, 150],
  accent: [255, 200, 80],
  text: [200, 210, 230]
}

export default function setup(container: HTMLElement): void {
  const sketch = (p: p5) => {
    let particles: Particle[] = []
    let fingerprintLines: FingerprintPoint[][] = []
    let revealRadius = 150
    let revealIntensity = 0
    let lastMouseMove = 0
    let showFingerprint = true
    let textMode = true
    let time = 0
    let canvasWidth: number
    let canvasHeight: number

    function generateFingerprint() {
      fingerprintLines = []
      const centerX = canvasWidth / 2
      const centerY = canvasHeight / 2
      const numLines = 25

      for (let i = 0; i < numLines; i++) {
        const line: FingerprintPoint[] = []
        const baseY = p.map(i, 0, numLines - 1, -180, 180)
        const amplitude = 30 + p.sin(i * 0.3) * 20
        const frequency = 0.015 + p.sin(i * 0.2) * 0.005
        const phase = i * 0.5
        const noise1 = p.random(1000)
        const noise2 = p.random(1000)

        for (let x = -250; x <= 250; x += 5) {
          const curve = p.sin(x * frequency + phase) * amplitude
          const distFromCenter = p.abs(x) / 250
          const whorl = p.sin(p.sqrt(x * x + baseY * baseY) * 0.05 + i * 0.3) * 20 * (1 - distFromCenter)
          const noiseVal = p.noise(x * 0.01 + noise1, baseY * 0.01 + noise2) * 30 - 15
          const y = baseY + curve + whorl + noiseVal
          const edgeFade = 1 - p.pow(p.abs(x) / 280, 3)

          if (edgeFade > 0) {
            line.push({
              x: centerX + x,
              y: centerY + y,
              baseX: centerX + x,
              baseY: centerY + y,
              edgeFade: edgeFade
            })
          }
        }

        if (line.length > 0) {
          fingerprintLines.push(line)
        }
      }
    }

    function findNearestFingerprintPoint(x: number, y: number): { x: number; y: number; lineIndex: number } | null {
      let minDist = Infinity
      let nearest: { x: number; y: number; lineIndex: number } | null = null

      for (let li = 0; li < fingerprintLines.length; li++) {
        const line = fingerprintLines[li]
        for (let pi = 0; pi < line.length; pi++) {
          const pt = line[pi]
          const d = p.dist(x, y, pt.x, pt.y)
          if (d < minDist && d < 300) {
            minDist = d
            nearest = { x: pt.x, y: pt.y, lineIndex: li }
          }
        }
      }
      return nearest
    }

    function createParticle(): Particle {
      const x = p.random(canvasWidth)
      const y = p.random(canvasHeight)
      const nearestPoint = findNearestFingerprintPoint(x, y)

      return {
        x: x,
        y: y,
        homeX: x,
        homeY: y,
        targetX: nearestPoint ? nearestPoint.x : x,
        targetY: nearestPoint ? nearestPoint.y : y,
        char: p.random() < 0.1 ? p.random(meaningfulWords) : chars[p.floor(p.random(chars.length))],
        size: p.random(8, 14),
        alpha: p.random(40, 100),
        noiseOffset: p.random(1000),
        speed: p.random(0.02, 0.05),
        revealed: false,
        revealProgress: 0,
        lineIndex: nearestPoint ? nearestPoint.lineIndex : -1
      }
    }

    function generateParticles() {
      particles = []
      const numParticles = 2000
      for (let i = 0; i < numParticles; i++) {
        particles.push(createParticle())
      }
    }

    function updateParticles() {
      particles.forEach(pt => {
        const d = p.dist(p.mouseX, p.mouseY, pt.x, pt.y)
        const inRevealZone = d < revealRadius

        if (inRevealZone && revealIntensity > 0.5) {
          pt.revealProgress = p.min(1, pt.revealProgress + 0.03)
          pt.revealed = true
        } else {
          pt.revealProgress = p.max(0, pt.revealProgress - 0.01)
          if (pt.revealProgress === 0) pt.revealed = false
        }

        let targetX: number, targetY: number

        if (pt.revealProgress > 0) {
          targetX = p.lerp(pt.homeX, pt.targetX, pt.revealProgress)
          targetY = p.lerp(pt.homeY, pt.targetY, pt.revealProgress)
        } else {
          const noiseX = p.noise(pt.noiseOffset + time * 0.3) * 40 - 20
          const noiseY = p.noise(pt.noiseOffset + 1000 + time * 0.3) * 40 - 20
          targetX = pt.homeX + noiseX
          targetY = pt.homeY + noiseY
        }

        pt.x = p.lerp(pt.x, targetX, pt.speed)
        pt.y = p.lerp(pt.y, targetY, pt.speed)
      })
    }

    function drawGrid() {
      p.stroke(255, 5)
      p.strokeWeight(1)
      const gridSize = 40

      for (let x = 0; x < canvasWidth; x += gridSize) {
        p.line(x, 0, x, canvasHeight)
      }
      for (let y = 0; y < canvasHeight; y += gridSize) {
        p.line(0, y, canvasWidth, y)
      }
    }

    function drawParticles() {
      p.textAlign(p.CENTER, p.CENTER)
      p.noStroke()

      particles.forEach(pt => {
        let r: number, g: number, b: number, a: number

        if (pt.revealProgress > 0) {
          const t = pt.revealProgress
          r = p.lerp(palette.particle[0], palette.revealed[0], t)
          g = p.lerp(palette.particle[1], palette.revealed[1], t)
          b = p.lerp(palette.particle[2], palette.revealed[2], t)
          a = p.lerp(pt.alpha, 200, t)

          if (pt.lineIndex >= 0) {
            const lineHue = p.map(pt.lineIndex, 0, fingerprintLines.length, 0, 1)
            const accentAmount = t * 0.3
            r = p.lerp(r, palette.fingerprint[0], accentAmount * p.sin(lineHue * p.PI))
            g = p.lerp(g, palette.fingerprint[1], accentAmount)
            b = p.lerp(b, palette.fingerprint[2], accentAmount * p.cos(lineHue * p.PI))
          }
        } else {
          r = palette.particle[0]
          g = palette.particle[1]
          b = palette.particle[2]
          a = pt.alpha
        }

        p.fill(r, g, b, a)

        if (textMode) {
          p.textSize(pt.size * (1 + pt.revealProgress * 0.3))
          p.text(pt.char, pt.x, pt.y)
        } else {
          const size = pt.size * 0.4 * (1 + pt.revealProgress)
          p.ellipse(pt.x, pt.y, size, size)
        }
      })
    }

    function drawFingerprintGuide() {
      p.noFill()
      p.strokeWeight(1)

      fingerprintLines.forEach((line) => {
        p.beginShape()
        line.forEach((pt) => {
          const d = p.dist(p.mouseX, p.mouseY, pt.x, pt.y)
          let alpha = p.map(d, 0, revealRadius * 1.5, 30, 0)
          alpha *= revealIntensity * pt.edgeFade

          if (alpha > 0) {
            p.stroke(palette.fingerprint[0], palette.fingerprint[1], palette.fingerprint[2], alpha)
            p.vertex(pt.x, pt.y)
          }
        })
        p.endShape()
      })
    }

    function drawRevealCircle() {
      p.noFill()
      const alpha = 30 + p.sin(time * 3) * 15

      for (let i = 3; i > 0; i--) {
        p.strokeWeight(i)
        p.stroke(palette.revealed[0], palette.revealed[1], palette.revealed[2], alpha / i)
        p.ellipse(p.mouseX, p.mouseY, revealRadius * 2 * (1 + i * 0.1), revealRadius * 2 * (1 + i * 0.1))
      }

      p.strokeWeight(1)
      p.stroke(palette.revealed[0], palette.revealed[1], palette.revealed[2], 50)
      const scanAngle = time * 2
      const scanX = p.mouseX + p.cos(scanAngle) * revealRadius
      const scanY = p.mouseY + p.sin(scanAngle) * revealRadius
      p.line(p.mouseX, p.mouseY, scanX, scanY)
    }

    function drawProgressBar(x: number, y: number, w: number, h: number, value: number, color: number[]) {
      p.fill(30, 35, 50)
      p.noStroke()
      p.rect(x, y, w, h, h / 2)
      p.fill(color[0], color[1], color[2], 200)
      p.rect(x, y, w * value, h, h / 2)
    }

    function drawUI() {
      p.fill(palette.text[0], palette.text[1], palette.text[2])
      p.textAlign(p.LEFT, p.TOP)
      p.textSize(24)
      p.text("Identity Fingerprint", 20, 20)

      p.textSize(12)
      p.fill(100, 110, 130)
      p.text("Every word you write leaves a unique mark", 20, 50)

      const revealedCount = particles.filter(pt => pt.revealProgress > 0.5).length
      const percentage = ((revealedCount / particles.length) * 100).toFixed(1)

      p.textSize(11)
      p.fill(palette.revealed[0], palette.revealed[1], palette.revealed[2], 180)
      p.text(`Identity revealed: ${percentage}%`, 20, 75)

      drawProgressBar(20, 95, 120, 6, revealIntensity, palette.revealed)

      p.textAlign(p.RIGHT, p.TOP)
      p.fill(80, 90, 110)
      p.textSize(10)
      const instructions = [
        "Move mouse to reveal hidden identity",
        "Click - Toggle text/particle mode",
        "R - Regenerate pattern",
        "F - Toggle fingerprint guide",
        "+/- Adjust reveal radius"
      ]
      instructions.forEach((inst, i) => {
        p.text(inst, canvasWidth - 20, 20 + i * 14)
      })

      p.textAlign(p.LEFT, p.BOTTOM)
      p.textSize(10)
      p.fill(palette.accent[0], palette.accent[1], palette.accent[2], 150)
      p.text(`Mode: ${textMode ? 'TEXT' : 'PARTICLES'} | Radius: ${revealRadius}`, 20, canvasHeight - 20)
    }

    p.setup = () => {
      canvasWidth = container.clientWidth || 800
      canvasHeight = container.clientHeight || 800
      p.createCanvas(canvasWidth, canvasHeight)
      p.textFont('Courier New, monospace')
      generateFingerprint()
      generateParticles()
    }

    p.draw = () => {
      time += p.deltaTime * 0.001
      p.background(palette.bg[0], palette.bg[1], palette.bg[2])
      drawGrid()

      const timeSinceMove = p.millis() - lastMouseMove
      const targetIntensity = timeSinceMove < 100 ? 1 : 0
      revealIntensity = p.lerp(revealIntensity, targetIntensity, 0.05)

      updateParticles()
      drawParticles()

      if (showFingerprint) {
        drawFingerprintGuide()
      }

      drawRevealCircle()
      drawUI()
    }

    p.mouseMoved = () => {
      lastMouseMove = p.millis()
    }

    p.mouseDragged = () => {
      lastMouseMove = p.millis()
    }

    p.mousePressed = () => {
      textMode = !textMode
    }

    p.keyPressed = () => {
      if (p.key === 'r' || p.key === 'R') {
        generateFingerprint()
        generateParticles()
      }
      if (p.key === 'f' || p.key === 'F') {
        showFingerprint = !showFingerprint
      }
      if (p.key === '=' || p.key === '+') {
        revealRadius = p.min(300, revealRadius + 20)
      }
      if (p.key === '-' || p.key === '_') {
        revealRadius = p.max(50, revealRadius - 20)
      }
    }

    p.windowResized = () => {
      canvasWidth = container.clientWidth || 800
      canvasHeight = container.clientHeight || 800
      p.resizeCanvas(canvasWidth, canvasHeight)
      generateFingerprint()
      generateParticles()
    }
  }

  new p5(sketch, container)
}
