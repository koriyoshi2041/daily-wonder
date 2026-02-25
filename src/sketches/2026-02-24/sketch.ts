import p5 from 'p5'

interface Particle {
  readonly x: number
  readonly y: number
  readonly vx: number
  readonly vy: number
  readonly life: number
  readonly maxLife: number
  readonly hue: number
}

function createParticle(width: number, height: number, p: p5): Particle {
  return {
    x: p.random(width),
    y: p.random(height),
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: p.random(100, 300),
    hue: p.random(160, 200),
  }
}

function updateParticle(
  particle: Particle,
  flowAngle: number,
  mouseInfluence: { fx: number; fy: number },
  width: number,
  height: number
): Particle {
  const speed = 1.5
  const ax = Math.cos(flowAngle) * speed + mouseInfluence.fx
  const ay = Math.sin(flowAngle) * speed + mouseInfluence.fy

  const newVx = (particle.vx + ax) * 0.95
  const newVy = (particle.vy + ay) * 0.95

  let newX = particle.x + newVx
  let newY = particle.y + newVy

  if (newX < 0) newX += width
  if (newX > width) newX -= width
  if (newY < 0) newY += height
  if (newY > height) newY -= height

  return {
    ...particle,
    x: newX,
    y: newY,
    vx: newVx,
    vy: newVy,
    life: particle.life + 1,
  }
}

export default function setup(container: HTMLElement): void {
  const sketch = (p: p5) => {
    const PARTICLE_COUNT = 800
    const NOISE_SCALE = 0.003
    let particles: Particle[] = []
    let canvasWidth: number
    let canvasHeight: number

    p.setup = () => {
      canvasWidth = Math.min(container.clientWidth, 800)
      canvasHeight = canvasWidth
      const canvas = p.createCanvas(canvasWidth, canvasHeight)
      canvas.parent(container)
      p.colorMode(p.HSB, 360, 100, 100, 100)
      p.background(0, 0, 4)

      particles = Array.from({ length: PARTICLE_COUNT }, () =>
        createParticle(canvasWidth, canvasHeight, p)
      )
    }

    p.draw = () => {
      p.background(0, 0, 4, 3)

      const time = p.frameCount * 0.003

      particles = particles.map((particle) => {
        const angle =
          p.noise(
            particle.x * NOISE_SCALE,
            particle.y * NOISE_SCALE,
            time
          ) *
          p.TWO_PI *
          2

        let fx = 0
        let fy = 0

        if (p.mouseX > 0 && p.mouseX < canvasWidth && p.mouseY > 0 && p.mouseY < canvasHeight) {
          const dx = particle.x - p.mouseX
          const dy = particle.y - p.mouseY
          const distSq = dx * dx + dy * dy
          const radius = 120

          if (distSq < radius * radius) {
            const dist = Math.sqrt(distSq)
            const force = (1 - dist / radius) * 0.8
            fx = (dx / dist) * force
            fy = (dy / dist) * force
          }
        }

        const updated = updateParticle(particle, angle, { fx, fy }, canvasWidth, canvasHeight)

        if (updated.life > updated.maxLife) {
          return createParticle(canvasWidth, canvasHeight, p)
        }

        return updated
      })

      for (const particle of particles) {
        const lifeRatio = particle.life / particle.maxLife
        const alpha = lifeRatio < 0.1
          ? lifeRatio * 10 * 50
          : lifeRatio > 0.8
            ? (1 - lifeRatio) * 5 * 50
            : 50

        p.noStroke()
        p.fill(particle.hue, 60, 90, alpha)
        p.circle(particle.x, particle.y, 2)
      }
    }

    p.windowResized = () => {
      canvasWidth = Math.min(container.clientWidth, 800)
      canvasHeight = canvasWidth
      p.resizeCanvas(canvasWidth, canvasHeight)
    }
  }

  new p5(sketch)
}
