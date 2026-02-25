import p5 from 'p5'

interface Agent {
  id: number
  name: string
  x: number
  y: number
  reputation: number
  activity: number
  pulsePhase: number
  connections: number
  birthTime: number
}

interface Connection {
  from: number
  to: number
  trust: number
  pulses: Pulse[]
}

interface Pulse {
  progress: number
  direction: number
  speed: number
}

const agentNames = [
  "Oracle", "Nexus", "Cipher", "Vector", "Prism",
  "Echo", "Flux", "Nova", "Pulse", "Zenith",
  "Atlas", "Helix", "Spark", "Drift", "Ember"
]

const palette = {
  bg: [12, 15, 25],
  nodeFill: [20, 25, 40],
  nodeStroke: [80, 200, 255],
  nodeGlow: [80, 200, 255, 30],
  connectionLow: [255, 100, 100],
  connectionMid: [255, 200, 100],
  connectionHigh: [100, 255, 200],
  highlight: [255, 220, 100],
  text: [220, 230, 255],
}

export default function setup(container: HTMLElement): void {
  const sketch = (p: p5) => {
    let agents: Agent[] = []
    let connections: Connection[] = []
    let selectedAgent: number | null = null
    let hoveredAgent: number | null = null
    let draggingAgent: number | null = null
    let pulseEnabled = true
    let time = 0
    let canvasWidth: number
    let canvasHeight: number

    function createAgent(index: number): Agent {
      const angle = (p.TWO_PI / 8) * index + p.random(-0.3, 0.3)
      const radius = Math.min(canvasWidth, canvasHeight) * 0.3 + p.random(-50, 50)
      
      return {
        id: index,
        name: agentNames[index % agentNames.length],
        x: canvasWidth / 2 + Math.cos(angle) * radius,
        y: canvasHeight / 2 + Math.sin(angle) * radius,
        reputation: p.random(0.3, 1.0),
        activity: p.random(0.5, 1.0),
        pulsePhase: p.random(p.TWO_PI),
        connections: 0,
        birthTime: p.millis()
      }
    }

    function createConnection(from: number, to: number): Connection {
      return {
        from,
        to,
        trust: p.random(0.2, 1.0),
        pulses: []
      }
    }

    function connectionExists(a: number, b: number): boolean {
      return connections.some(c => 
        (c.from === a && c.to === b) || (c.from === b && c.to === a)
      )
    }

    function getConnection(a: number, b: number): Connection | undefined {
      return connections.find(c =>
        (c.from === a && c.to === b) || (c.from === b && c.to === a)
      )
    }

    function initializeNetwork(): void {
      agents = []
      connections = []
      selectedAgent = null
      
      const numAgents = 8
      for (let i = 0; i < numAgents; i++) {
        agents.push(createAgent(i))
      }
      
      for (let i = 0; i < agents.length; i++) {
        const numConnections = Math.floor(p.random(1, 4))
        for (let j = 0; j < numConnections; j++) {
          const target = Math.floor(p.random(agents.length))
          if (target !== i && !connectionExists(i, target)) {
            connections.push(createConnection(i, target))
          }
        }
      }
    }

    function getTrustColor(trust: number): p5.Color {
      if (trust < 0.33) {
        return p.lerpColor(
          p.color(palette.connectionLow[0], palette.connectionLow[1], palette.connectionLow[2]),
          p.color(palette.connectionMid[0], palette.connectionMid[1], palette.connectionMid[2]),
          trust * 3
        )
      } else if (trust < 0.66) {
        return p.lerpColor(
          p.color(palette.connectionMid[0], palette.connectionMid[1], palette.connectionMid[2]),
          p.color(palette.connectionHigh[0], palette.connectionHigh[1], palette.connectionHigh[2]),
          (trust - 0.33) * 3
        )
      } else {
        return p.color(palette.connectionHigh[0], palette.connectionHigh[1], palette.connectionHigh[2])
      }
    }

    function drawBackground(): void {
      for (let y = 0; y < canvasHeight; y += 4) {
        const inter = p.map(y, 0, canvasHeight, 0, 1)
        const c = p.lerpColor(
          p.color(palette.bg[0], palette.bg[1], palette.bg[2]),
          p.color(palette.bg[0] * 0.7, palette.bg[1] * 0.7, palette.bg[2] * 1.2),
          inter
        )
        p.stroke(c)
        p.line(0, y, canvasWidth, y)
      }
      
      p.stroke(255, 8)
      p.strokeWeight(1)
      const gridSize = 50
      for (let x = 0; x < canvasWidth; x += gridSize) {
        p.line(x, 0, x, canvasHeight)
      }
      for (let y = 0; y < canvasHeight; y += gridSize) {
        p.line(0, y, canvasWidth, y)
      }
    }

    function drawConnections(): void {
      connections.forEach(conn => {
        const a1 = agents[conn.from]
        const a2 = agents[conn.to]
        const trustColor = getTrustColor(conn.trust)
        
        for (let i = 3; i > 0; i--) {
          p.strokeWeight(i * 3 + conn.trust * 2)
          p.stroke(p.red(trustColor), p.green(trustColor), p.blue(trustColor), 20 / i)
          p.line(a1.x, a1.y, a2.x, a2.y)
        }
        
        p.strokeWeight(1 + conn.trust * 2)
        p.stroke(trustColor)
        p.line(a1.x, a1.y, a2.x, a2.y)
        
        if (pulseEnabled) {
          if (p.random() < 0.002 * (a1.activity + a2.activity)) {
            conn.pulses.push({
              progress: 0,
              direction: p.random() > 0.5 ? 1 : -1,
              speed: p.random(0.3, 0.8)
            })
          }
          
          conn.pulses = conn.pulses.filter(pulse => {
            pulse.progress += p.deltaTime * 0.001 * pulse.speed
            
            if (pulse.progress <= 1) {
              const t = pulse.direction > 0 ? pulse.progress : 1 - pulse.progress
              const px = p.lerp(a1.x, a2.x, t)
              const py = p.lerp(a1.y, a2.y, t)
              
              const pulseSize = 8 * (1 - Math.abs(pulse.progress - 0.5) * 2)
              p.noStroke()
              for (let i = 3; i > 0; i--) {
                p.fill(255, 255, 255, 100 / i)
                p.ellipse(px, py, pulseSize * i, pulseSize * i)
              }
              return true
            }
            return false
          })
        }
      })
    }

    function drawAgents(): void {
      agents.forEach((agent, index) => {
        const isHovered = hoveredAgent === index
        const isSelected = selectedAgent === index
        
        const baseSize = 20 + agent.reputation * 30
        let size = baseSize + Math.sin(time * 2 + agent.pulsePhase) * 3
        
        if (isHovered || isSelected) {
          size *= 1.2
        }
        
        const glowColor = isSelected 
          ? p.color(palette.highlight[0], palette.highlight[1], palette.highlight[2], 40)
          : p.color(palette.nodeGlow[0], palette.nodeGlow[1], palette.nodeGlow[2], palette.nodeGlow[3])
        
        p.noStroke()
        for (let i = 5; i > 0; i--) {
          p.fill(p.red(glowColor), p.green(glowColor), p.blue(glowColor), p.alpha(glowColor) / i)
          p.ellipse(agent.x, agent.y, size + i * 15, size + i * 15)
        }
        
        const activityAngle = agent.activity * p.TWO_PI
        p.strokeWeight(3)
        p.noFill()
        p.stroke(palette.nodeStroke[0], palette.nodeStroke[1], palette.nodeStroke[2], 150)
        p.arc(agent.x, agent.y, size + 10, size + 10, -p.HALF_PI, -p.HALF_PI + activityAngle)
        
        p.fill(palette.nodeFill[0], palette.nodeFill[1], palette.nodeFill[2])
        p.strokeWeight(2)
        if (isSelected) {
          p.stroke(palette.highlight[0], palette.highlight[1], palette.highlight[2])
        } else {
          p.stroke(palette.nodeStroke[0], palette.nodeStroke[1], palette.nodeStroke[2])
        }
        p.ellipse(agent.x, agent.y, size, size)
        
        const coreSize = size * 0.4 * agent.reputation
        const coreColor = getTrustColor(agent.reputation)
        p.fill(coreColor)
        p.noStroke()
        p.ellipse(agent.x, agent.y, coreSize, coreSize)
        
        p.fill(palette.text[0], palette.text[1], palette.text[2])
        p.textAlign(p.CENTER, p.CENTER)
        p.textSize(10)
        p.text(agent.name.charAt(0), agent.x, agent.y + size / 2 + 15)
      })
    }

    function drawAgentInfo(agent: Agent): void {
      const boxWidth = 180
      const boxHeight = 100
      let x = agent.x + 40
      let y = agent.y - 20
      
      if (x + boxWidth > canvasWidth - 20) x = agent.x - boxWidth - 40
      if (y + boxHeight > canvasHeight - 20) y = canvasHeight - boxHeight - 20
      if (y < 20) y = 20
      
      p.fill(0, 0, 0, 200)
      p.stroke(palette.nodeStroke[0], palette.nodeStroke[1], palette.nodeStroke[2])
      p.strokeWeight(1)
      p.rect(x, y, boxWidth, boxHeight, 5)
      
      p.fill(palette.text[0], palette.text[1], palette.text[2])
      p.noStroke()
      p.textAlign(p.LEFT, p.TOP)
      p.textSize(14)
      p.text(agent.name, x + 10, y + 10)
      
      p.textSize(11)
      p.fill(180, 190, 210)
      p.text(`ID: Agent-${agent.id.toString().padStart(3, '0')}`, x + 10, y + 32)
      p.text(`Reputation: ${(agent.reputation * 100).toFixed(1)}%`, x + 10, y + 48)
      p.text(`Connections: ${agent.connections}`, x + 10, y + 64)
      p.text(`Activity: ${(agent.activity * 100).toFixed(0)}%`, x + 10, y + 80)
    }

    function drawUI(): void {
      p.fill(palette.text[0], palette.text[1], palette.text[2])
      p.textAlign(p.LEFT, p.TOP)
      p.textSize(16)
      p.text("Trust Network", 15, 15)
      
      p.textSize(11)
      p.fill(150, 160, 180)
      p.text(`${agents.length} agents | ${connections.length} connections`, 15, 38)
      
      p.textAlign(p.RIGHT, p.TOP)
      p.textSize(10)
      p.fill(100, 110, 130)
      const instructions = [
        "A - Add agent",
        "R - Reset",
        "P - Toggle pulses",
        "S - Shuffle",
        "Click two to connect"
      ]
      instructions.forEach((inst, i) => {
        p.text(inst, canvasWidth - 15, 15 + i * 14)
      })
      
      if (selectedAgent !== null) {
        p.fill(palette.highlight[0], palette.highlight[1], palette.highlight[2])
        p.textAlign(p.LEFT, p.BOTTOM)
        p.textSize(11)
        p.text(`Selected: ${agents[selectedAgent].name}`, 15, canvasHeight - 15)
      }
    }

    function toggleConnection(a: number, b: number): void {
      const existing = getConnection(a, b)
      if (existing) {
        connections = connections.filter(c => c !== existing)
      } else {
        connections.push(createConnection(a, b))
        const newConn = getConnection(a, b)
        if (newConn) {
          for (let i = 0; i < 5; i++) {
            setTimeout(() => {
              newConn.pulses.push({
                progress: 0,
                direction: i % 2 === 0 ? 1 : -1,
                speed: 0.8
              })
            }, i * 100)
          }
        }
      }
    }

    p.setup = () => {
      canvasWidth = Math.min(container.clientWidth, 800)
      canvasHeight = canvasWidth
      const canvas = p.createCanvas(canvasWidth, canvasHeight)
      canvas.parent(container)
      p.colorMode(p.RGB)
      
      initializeNetwork()
    }

    p.draw = () => {
      time += p.deltaTime * 0.001
      
      drawBackground()
      
      agents.forEach(a => a.connections = 0)
      connections.forEach(c => {
        agents[c.from].connections++
        agents[c.to].connections++
      })
      
      agents.forEach(a => {
        a.reputation += p.random(-0.001, 0.001)
        a.reputation = p.constrain(a.reputation, 0.1, 1.0)
        a.activity = 0.5 + 0.5 * Math.sin(time * 0.5 + a.pulsePhase)
      })
      
      drawConnections()
      drawAgents()
      drawUI()
      
      if (hoveredAgent !== null) {
        drawAgentInfo(agents[hoveredAgent])
      }
    }

    p.mouseMoved = () => {
      hoveredAgent = null
      for (let i = agents.length - 1; i >= 0; i--) {
        const d = p.dist(p.mouseX, p.mouseY, agents[i].x, agents[i].y)
        const size = 20 + agents[i].reputation * 30
        if (d < size / 2 + 10) {
          hoveredAgent = i
          break
        }
      }
      p.cursor(hoveredAgent !== null ? p.HAND : p.ARROW)
    }

    p.mousePressed = () => {
      for (let i = agents.length - 1; i >= 0; i--) {
        const d = p.dist(p.mouseX, p.mouseY, agents[i].x, agents[i].y)
        const size = 20 + agents[i].reputation * 30
        if (d < size / 2 + 10) {
          draggingAgent = i
          
          if (selectedAgent !== null && selectedAgent !== i) {
            toggleConnection(selectedAgent, i)
            selectedAgent = null
          } else if (selectedAgent === i) {
            selectedAgent = null
          } else {
            selectedAgent = i
          }
          return
        }
      }
      selectedAgent = null
    }

    p.mouseDragged = () => {
      if (draggingAgent !== null) {
        agents[draggingAgent].x = p.mouseX
        agents[draggingAgent].y = p.mouseY
      }
    }

    p.mouseReleased = () => {
      draggingAgent = null
    }

    p.keyPressed = () => {
      if (p.key === 'a' || p.key === 'A') {
        const newAgent = createAgent(agents.length)
        newAgent.x = p.mouseX || canvasWidth / 2
        newAgent.y = p.mouseY || canvasHeight / 2
        newAgent.name = agentNames[agents.length % agentNames.length]
        agents.push(newAgent)
        
        if (agents.length > 1) {
          const target = Math.floor(p.random(agents.length - 1))
          connections.push(createConnection(agents.length - 1, target))
        }
      }
      
      if (p.key === 'r' || p.key === 'R') {
        initializeNetwork()
      }
      
      if (p.key === 'p' || p.key === 'P') {
        pulseEnabled = !pulseEnabled
      }
      
      if (p.key === 's' || p.key === 'S') {
        agents.forEach(agent => {
          agent.x = p.random(100, canvasWidth - 100)
          agent.y = p.random(100, canvasHeight - 100)
        })
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
