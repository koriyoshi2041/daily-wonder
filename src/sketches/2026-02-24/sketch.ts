import p5 from 'p5'

/**
 * Flow Field Painter
 * 
 * Interactive particle flow field with multiple modes:
 * - Drag to paint trails
 * - Click to create particle explosions
 * - Keys 1/2/3: Switch interaction mode (Attract/Repel/Vortex)
 * - Key C: Cycle color schemes
 * - Key R: Reset canvas
 * - Key G: Toggle gravity
 * - Key Space: Freeze/unfreeze particles
 */

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  hue: number
  size: number
}

type InteractionMode = 'attract' | 'repel' | 'vortex'

interface ColorScheme {
  name: string
  hueRange: [number, number]
  saturation: number
  brightness: number
}

const colorSchemes: ColorScheme[] = [
  { name: 'Ocean', hueRange: [160, 220], saturation: 70, brightness: 90 },
  { name: 'Fire', hueRange: [0, 40], saturation: 85, brightness: 95 },
  { name: 'Forest', hueRange: [80, 150], saturation: 60, brightness: 80 },
  { name: 'Neon', hueRange: [280, 340], saturation: 90, brightness: 100 },
  { name: 'Sunset', hueRange: [10, 60], saturation: 80, brightness: 95 },
]

export default function setup(container: HTMLElement): void {
  const sketch = (p: p5) => {
    const PARTICLE_COUNT = 1000
    const NOISE_SCALE = 0.004
    
    let particles: Particle[] = []
    let canvasWidth: number
    let canvasHeight: number
    
    // Interaction state
    let mode: InteractionMode = 'attract'
    let colorSchemeIndex = 0
    let gravityEnabled = false
    let frozen = false
    let mouseTrail: { x: number; y: number; age: number }[] = []
    
    function getCurrentScheme(): ColorScheme {
      return colorSchemes[colorSchemeIndex]
    }

    function createParticle(x?: number, y?: number, burst = false): Particle {
      const scheme = getCurrentScheme()
      const px = x ?? p.random(canvasWidth)
      const py = y ?? p.random(canvasHeight)
      
      return {
        x: px,
        y: py,
        vx: burst ? p.random(-5, 5) : 0,
        vy: burst ? p.random(-5, 5) : 0,
        life: 0,
        maxLife: burst ? p.random(30, 80) : p.random(100, 300),
        hue: p.random(scheme.hueRange[0], scheme.hueRange[1]),
        size: burst ? p.random(3, 6) : p.random(1.5, 3),
      }
    }

    function createBurst(x: number, y: number, count: number): void {
      for (let i = 0; i < count; i++) {
        if (particles.length < PARTICLE_COUNT + 200) {
          particles.push(createParticle(x, y, true))
        }
      }
    }

    function getInteractionForce(particle: Particle, mx: number, my: number): { fx: number; fy: number } {
      const dx = particle.x - mx
      const dy = particle.y - my
      const distSq = dx * dx + dy * dy
      const radius = 150
      
      if (distSq > radius * radius) return { fx: 0, fy: 0 }
      
      const dist = Math.sqrt(distSq)
      const strength = (1 - dist / radius) * 1.5
      
      switch (mode) {
        case 'attract':
          return {
            fx: (-dx / dist) * strength,
            fy: (-dy / dist) * strength,
          }
        case 'repel':
          return {
            fx: (dx / dist) * strength,
            fy: (dy / dist) * strength,
          }
        case 'vortex':
          // Perpendicular force + slight inward pull
          return {
            fx: (-dy / dist) * strength * 0.8 + (-dx / dist) * strength * 0.2,
            fy: (dx / dist) * strength * 0.8 + (-dy / dist) * strength * 0.2,
          }
      }
    }

    function updateParticle(particle: Particle, time: number): Particle {
      if (frozen) return particle
      
      // Flow field angle
      const angle = p.noise(
        particle.x * NOISE_SCALE,
        particle.y * NOISE_SCALE,
        time
      ) * p.TWO_PI * 2
      
      const flowSpeed = 1.2
      let ax = Math.cos(angle) * flowSpeed
      let ay = Math.sin(angle) * flowSpeed
      
      // Mouse interaction
      if (p.mouseX > 0 && p.mouseX < canvasWidth && p.mouseY > 0 && p.mouseY < canvasHeight) {
        const force = getInteractionForce(particle, p.mouseX, p.mouseY)
        ax += force.fx
        ay += force.fy
      }
      
      // Trail influence
      mouseTrail.forEach(point => {
        const dx = particle.x - point.x
        const dy = particle.y - point.y
        const distSq = dx * dx + dy * dy
        const radius = 80
        if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq)
          const strength = (1 - dist / radius) * (1 - point.age / 60) * 0.5
          ax += (-dx / dist) * strength
          ay += (-dy / dist) * strength
        }
      })
      
      // Gravity
      if (gravityEnabled) {
        ay += 0.1
      }
      
      let newVx = (particle.vx + ax) * 0.96
      let newVy = (particle.vy + ay) * 0.96
      
      let newX = particle.x + newVx
      let newY = particle.y + newVy
      
      // Boundary wrap
      if (newX < 0) newX += canvasWidth
      if (newX > canvasWidth) newX -= canvasWidth
      if (gravityEnabled) {
        // Bounce at bottom with gravity
        if (newY > canvasHeight) {
          newY = canvasHeight
          newVy *= -0.6
        }
        if (newY < 0) newY = 0
      } else {
        if (newY < 0) newY += canvasHeight
        if (newY > canvasHeight) newY -= canvasHeight
      }
      
      return {
        ...particle,
        x: newX,
        y: newY,
        vx: newVx,
        vy: newVy,
        life: particle.life + 1,
      }
    }

    function drawUI(): void {
      const scheme = getCurrentScheme()
      
      // Mode indicator
      p.fill(255, 200)
      p.noStroke()
      p.textSize(12)
      p.textAlign(p.LEFT, p.TOP)
      
      const modeText = `Mode: ${mode.toUpperCase()}`
      const colorText = `Color: ${scheme.name}`
      const gravText = gravityEnabled ? 'Gravity: ON' : 'Gravity: OFF'
      const frozenText = frozen ? '⏸ PAUSED' : ''
      
      p.text(modeText, 15, 15)
      p.text(colorText, 15, 32)
      p.text(gravText, 15, 49)
      if (frozen) {
        p.fill(255, 100, 100)
        p.text(frozenText, 15, 66)
      }
      
      // Instructions
      p.fill(255, 120)
      p.textAlign(p.RIGHT, p.TOP)
      p.textSize(10)
      const instructions = [
        'Drag to paint',
        'Click for burst',
        '1/2/3: Mode',
        'C: Colors',
        'G: Gravity',
        'R: Reset',
        'Space: Pause'
      ]
      instructions.forEach((text, i) => {
        p.text(text, canvasWidth - 15, 15 + i * 14)
      })
    }

    p.setup = () => {
      canvasWidth = Math.min(container.clientWidth, 800)
      canvasHeight = canvasWidth
      const canvas = p.createCanvas(canvasWidth, canvasHeight)
      canvas.parent(container)
      p.colorMode(p.HSB, 360, 100, 100, 100)
      p.background(0, 0, 4)
      
      particles = Array.from({ length: PARTICLE_COUNT }, () => createParticle())
    }

    p.draw = () => {
      // Fade background
      p.background(0, 0, 4, frozen ? 0 : 4)
      
      const time = p.frameCount * 0.003
      const scheme = getCurrentScheme()
      
      // Update trail ages
      mouseTrail = mouseTrail
        .map(point => ({ ...point, age: point.age + 1 }))
        .filter(point => point.age < 60)
      
      // Update and draw particles
      particles = particles.map(particle => {
        const updated = updateParticle(particle, time)
        
        if (updated.life > updated.maxLife) {
          return createParticle()
        }
        
        return updated
      })
      
      // Draw particles
      for (const particle of particles) {
        const lifeRatio = particle.life / particle.maxLife
        const alpha = lifeRatio < 0.1
          ? lifeRatio * 10 * 60
          : lifeRatio > 0.8
            ? (1 - lifeRatio) * 5 * 60
            : 60
        
        p.noStroke()
        p.fill(particle.hue, scheme.saturation, scheme.brightness, alpha)
        p.circle(particle.x, particle.y, particle.size)
      }
      
      // Draw trail hints
      mouseTrail.forEach(point => {
        const alpha = (1 - point.age / 60) * 30
        p.fill(255, alpha)
        p.circle(point.x, point.y, 4)
      })
      
      // Draw interaction radius hint when mouse is in canvas
      if (p.mouseX > 0 && p.mouseX < canvasWidth && p.mouseY > 0 && p.mouseY < canvasHeight) {
        p.noFill()
        p.stroke(255, 30)
        p.strokeWeight(1)
        p.circle(p.mouseX, p.mouseY, 300)
      }
      
      drawUI()
    }

    p.mousePressed = () => {
      if (p.mouseX > 0 && p.mouseX < canvasWidth && p.mouseY > 0 && p.mouseY < canvasHeight) {
        createBurst(p.mouseX, p.mouseY, 30)
      }
    }

    p.mouseDragged = () => {
      if (p.mouseX > 0 && p.mouseX < canvasWidth && p.mouseY > 0 && p.mouseY < canvasHeight) {
        mouseTrail.push({ x: p.mouseX, y: p.mouseY, age: 0 })
        
        // Occasionally spawn particles along drag
        if (p.frameCount % 3 === 0) {
          particles.push(createParticle(p.mouseX + p.random(-20, 20), p.mouseY + p.random(-20, 20)))
        }
      }
    }

    p.keyPressed = () => {
      if (p.key === '1') mode = 'attract'
      if (p.key === '2') mode = 'repel'
      if (p.key === '3') mode = 'vortex'
      
      if (p.key === 'c' || p.key === 'C') {
        colorSchemeIndex = (colorSchemeIndex + 1) % colorSchemes.length
        // Update existing particle colors
        const scheme = getCurrentScheme()
        particles = particles.map(particle => ({
          ...particle,
          hue: p.random(scheme.hueRange[0], scheme.hueRange[1]),
        }))
      }
      
      if (p.key === 'g' || p.key === 'G') {
        gravityEnabled = !gravityEnabled
      }
      
      if (p.key === 'r' || p.key === 'R') {
        particles = Array.from({ length: PARTICLE_COUNT }, () => createParticle())
        mouseTrail = []
        p.background(0, 0, 4)
      }
      
      if (p.key === ' ') {
        frozen = !frozen
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
