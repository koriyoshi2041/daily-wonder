/**
 * Trust Network
 * Visualizing agent reputation and trust connections
 * 
 * Interactions:
 * - Hover: Show agent info
 * - Click: Select agent
 * - Drag: Move agent
 * - Click two agents: Toggle connection
 * - Press 'A': Add new agent
 * - Press 'R': Reset network
 * - Press 'P': Toggle pulse animation
 * - Press 'S': Shuffle positions
 */

let agents = [];
let connections = [];
let selectedAgent = null;
let hoveredAgent = null;
let draggingAgent = null;
let pulseEnabled = true;
let time = 0;

// Agent names for personality
const agentNames = [
  "Oracle", "Nexus", "Cipher", "Vector", "Prism",
  "Echo", "Flux", "Nova", "Pulse", "Zenith",
  "Atlas", "Helix", "Spark", "Drift", "Ember"
];

// Color palette - cyberpunk inspired
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
  pulse: [255, 255, 255]
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB);
  textFont('Consolas, monospace');
  
  initializeNetwork();
}

function initializeNetwork() {
  agents = [];
  connections = [];
  selectedAgent = null;
  
  // Create initial agents
  let numAgents = 8;
  for (let i = 0; i < numAgents; i++) {
    agents.push(createAgent(i));
  }
  
  // Create initial connections
  for (let i = 0; i < agents.length; i++) {
    let numConnections = floor(random(1, 4));
    for (let j = 0; j < numConnections; j++) {
      let target = floor(random(agents.length));
      if (target !== i && !connectionExists(i, target)) {
        connections.push(createConnection(i, target));
      }
    }
  }
}

function createAgent(index) {
  let angle = (TWO_PI / 8) * index + random(-0.3, 0.3);
  let radius = min(width, height) * 0.3 + random(-50, 50);
  
  return {
    id: index,
    name: agentNames[index % agentNames.length],
    x: width / 2 + cos(angle) * radius,
    y: height / 2 + sin(angle) * radius,
    targetX: 0,
    targetY: 0,
    reputation: random(0.3, 1.0),
    activity: random(0.5, 1.0),
    pulsePhase: random(TWO_PI),
    connections: 0,
    birthTime: millis()
  };
}

function createConnection(from, to) {
  return {
    from: from,
    to: to,
    trust: random(0.2, 1.0),
    pulses: [],
    lastPulse: 0
  };
}

function connectionExists(a, b) {
  return connections.some(c => 
    (c.from === a && c.to === b) || (c.from === b && c.to === a)
  );
}

function getConnection(a, b) {
  return connections.find(c =>
    (c.from === a && c.to === b) || (c.from === b && c.to === a)
  );
}

function draw() {
  // Update time
  time += deltaTime * 0.001;
  
  // Background with slight gradient
  drawBackground();
  
  // Update agents
  updateAgents();
  
  // Draw connections first (behind nodes)
  drawConnections();
  
  // Draw agents
  drawAgents();
  
  // Draw UI
  drawUI();
  
  // Draw hover info
  if (hoveredAgent !== null) {
    drawAgentInfo(agents[hoveredAgent]);
  }
}

function drawBackground() {
  // Dark gradient background
  for (let y = 0; y < height; y += 4) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(
      color(palette.bg[0], palette.bg[1], palette.bg[2]),
      color(palette.bg[0] * 0.7, palette.bg[1] * 0.7, palette.bg[2] * 1.2),
      inter
    );
    stroke(c);
    line(0, y, width, y);
  }
  
  // Subtle grid
  stroke(255, 8);
  strokeWeight(1);
  let gridSize = 50;
  for (let x = 0; x < width; x += gridSize) {
    line(x, 0, x, height);
  }
  for (let y = 0; y < height; y += gridSize) {
    line(0, y, width, y);
  }
}

function updateAgents() {
  // Count connections for each agent
  agents.forEach(a => a.connections = 0);
  connections.forEach(c => {
    agents[c.from].connections++;
    agents[c.to].connections++;
  });
  
  // Update reputation based on connections and activity
  agents.forEach(a => {
    // Slight reputation drift
    a.reputation += random(-0.001, 0.001);
    a.reputation = constrain(a.reputation, 0.1, 1.0);
    
    // Activity fluctuation
    a.activity = 0.5 + 0.5 * sin(time * 0.5 + a.pulsePhase);
  });
}

function drawConnections() {
  connections.forEach(conn => {
    let a1 = agents[conn.from];
    let a2 = agents[conn.to];
    
    // Connection color based on trust level
    let trustColor = getTrustColor(conn.trust);
    
    // Glow effect
    for (let i = 3; i > 0; i--) {
      strokeWeight(i * 3 + conn.trust * 2);
      stroke(red(trustColor), green(trustColor), blue(trustColor), 20 / i);
      line(a1.x, a1.y, a2.x, a2.y);
    }
    
    // Main line
    strokeWeight(1 + conn.trust * 2);
    stroke(trustColor);
    line(a1.x, a1.y, a2.x, a2.y);
    
    // Animated pulses
    if (pulseEnabled) {
      // Randomly create new pulses
      if (random() < 0.002 * (a1.activity + a2.activity)) {
        conn.pulses.push({
          progress: 0,
          direction: random() > 0.5 ? 1 : -1,
          speed: random(0.3, 0.8)
        });
      }
      
      // Update and draw pulses
      conn.pulses = conn.pulses.filter(pulse => {
        pulse.progress += deltaTime * 0.001 * pulse.speed;
        
        if (pulse.progress <= 1) {
          let t = pulse.direction > 0 ? pulse.progress : 1 - pulse.progress;
          let px = lerp(a1.x, a2.x, t);
          let py = lerp(a1.y, a2.y, t);
          
          // Pulse glow
          let pulseSize = 8 * (1 - abs(pulse.progress - 0.5) * 2);
          noStroke();
          for (let i = 3; i > 0; i--) {
            fill(255, 255, 255, 100 / i);
            ellipse(px, py, pulseSize * i, pulseSize * i);
          }
          return true;
        }
        return false;
      });
    }
  });
}

function getTrustColor(trust) {
  if (trust < 0.33) {
    return lerpColor(
      color(palette.connectionLow),
      color(palette.connectionMid),
      trust * 3
    );
  } else if (trust < 0.66) {
    return lerpColor(
      color(palette.connectionMid),
      color(palette.connectionHigh),
      (trust - 0.33) * 3
    );
  } else {
    return color(palette.connectionHigh);
  }
}

function drawAgents() {
  agents.forEach((agent, index) => {
    let isHovered = hoveredAgent === index;
    let isSelected = selectedAgent === index;
    
    // Calculate node size based on reputation
    let baseSize = 20 + agent.reputation * 30;
    let size = baseSize;
    
    // Breathing animation
    size += sin(time * 2 + agent.pulsePhase) * 3;
    
    // Hover/select enlargement
    if (isHovered || isSelected) {
      size *= 1.2;
    }
    
    // Outer glow
    let glowColor = color(palette.nodeGlow);
    if (isSelected) {
      glowColor = color(palette.highlight[0], palette.highlight[1], palette.highlight[2], 40);
    }
    
    noStroke();
    for (let i = 5; i > 0; i--) {
      fill(red(glowColor), green(glowColor), blue(glowColor), alpha(glowColor) / i);
      ellipse(agent.x, agent.y, size + i * 15, size + i * 15);
    }
    
    // Activity ring
    let activityAngle = agent.activity * TWO_PI;
    strokeWeight(3);
    noFill();
    stroke(palette.nodeStroke[0], palette.nodeStroke[1], palette.nodeStroke[2], 150);
    arc(agent.x, agent.y, size + 10, size + 10, -HALF_PI, -HALF_PI + activityAngle);
    
    // Node body
    fill(palette.nodeFill);
    strokeWeight(2);
    stroke(isSelected ? palette.highlight : palette.nodeStroke);
    ellipse(agent.x, agent.y, size, size);
    
    // Inner core (reputation indicator)
    let coreSize = size * 0.4 * agent.reputation;
    let coreColor = getTrustColor(agent.reputation);
    fill(coreColor);
    noStroke();
    ellipse(agent.x, agent.y, coreSize, coreSize);
    
    // Node label
    fill(palette.text);
    textAlign(CENTER, CENTER);
    textSize(10);
    text(agent.name.charAt(0), agent.x, agent.y + size / 2 + 15);
  });
}

function drawAgentInfo(agent) {
  let boxWidth = 180;
  let boxHeight = 100;
  let x = agent.x + 40;
  let y = agent.y - 20;
  
  // Keep on screen
  if (x + boxWidth > width - 20) x = agent.x - boxWidth - 40;
  if (y + boxHeight > height - 20) y = height - boxHeight - 20;
  if (y < 20) y = 20;
  
  // Info box background
  fill(0, 0, 0, 200);
  stroke(palette.nodeStroke);
  strokeWeight(1);
  rect(x, y, boxWidth, boxHeight, 5);
  
  // Content
  fill(palette.text);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(14);
  text(agent.name, x + 10, y + 10);
  
  textSize(11);
  fill(180, 190, 210);
  text(`ID: Agent-${agent.id.toString().padStart(3, '0')}`, x + 10, y + 32);
  text(`Reputation: ${(agent.reputation * 100).toFixed(1)}%`, x + 10, y + 48);
  text(`Connections: ${agent.connections}`, x + 10, y + 64);
  text(`Activity: ${(agent.activity * 100).toFixed(0)}%`, x + 10, y + 80);
}

function drawUI() {
  // Title
  fill(palette.text);
  textAlign(LEFT, TOP);
  textSize(24);
  text("Trust Network", 20, 20);
  
  textSize(12);
  fill(150, 160, 180);
  text(`${agents.length} agents | ${connections.length} connections`, 20, 50);
  
  // Instructions
  textAlign(RIGHT, TOP);
  textSize(11);
  fill(100, 110, 130);
  let instructions = [
    "A - Add agent",
    "R - Reset",
    "P - Toggle pulses",
    "S - Shuffle",
    "Click two agents to connect/disconnect"
  ];
  instructions.forEach((inst, i) => {
    text(inst, width - 20, 20 + i * 16);
  });
  
  // Connection status
  if (selectedAgent !== null) {
    fill(palette.highlight);
    textAlign(LEFT, BOTTOM);
    text(`Selected: ${agents[selectedAgent].name}`, 20, height - 20);
  }
}

function mouseMoved() {
  hoveredAgent = null;
  for (let i = agents.length - 1; i >= 0; i--) {
    let d = dist(mouseX, mouseY, agents[i].x, agents[i].y);
    let size = 20 + agents[i].reputation * 30;
    if (d < size / 2 + 10) {
      hoveredAgent = i;
      break;
    }
  }
  cursor(hoveredAgent !== null ? HAND : ARROW);
}

function mousePressed() {
  // Check if clicking on an agent
  for (let i = agents.length - 1; i >= 0; i--) {
    let d = dist(mouseX, mouseY, agents[i].x, agents[i].y);
    let size = 20 + agents[i].reputation * 30;
    if (d < size / 2 + 10) {
      draggingAgent = i;
      
      // Handle selection
      if (selectedAgent !== null && selectedAgent !== i) {
        // Toggle connection between selected and clicked
        toggleConnection(selectedAgent, i);
        selectedAgent = null;
      } else if (selectedAgent === i) {
        selectedAgent = null;
      } else {
        selectedAgent = i;
      }
      return;
    }
  }
  
  // Clicked on empty space - deselect
  selectedAgent = null;
}

function mouseDragged() {
  if (draggingAgent !== null) {
    agents[draggingAgent].x = mouseX;
    agents[draggingAgent].y = mouseY;
  }
}

function mouseReleased() {
  draggingAgent = null;
}

function toggleConnection(a, b) {
  let existing = getConnection(a, b);
  if (existing) {
    // Remove connection
    connections = connections.filter(c => c !== existing);
    
    // Visual feedback - flash
    flashConnection(agents[a], agents[b], false);
  } else {
    // Add connection
    connections.push(createConnection(a, b));
    
    // Visual feedback
    flashConnection(agents[a], agents[b], true);
  }
}

function flashConnection(a1, a2, isNew) {
  // Add a burst of pulses
  let conn = getConnection(agents.indexOf(a1), agents.indexOf(a2));
  if (conn) {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        conn.pulses.push({
          progress: 0,
          direction: i % 2 === 0 ? 1 : -1,
          speed: 0.8
        });
      }, i * 100);
    }
  }
}

function keyPressed() {
  if (key === 'a' || key === 'A') {
    // Add new agent
    let newAgent = createAgent(agents.length);
    newAgent.x = mouseX || width / 2;
    newAgent.y = mouseY || height / 2;
    newAgent.name = agentNames[agents.length % agentNames.length];
    agents.push(newAgent);
    
    // Connect to random existing agent
    if (agents.length > 1) {
      let target = floor(random(agents.length - 1));
      connections.push(createConnection(agents.length - 1, target));
    }
  }
  
  if (key === 'r' || key === 'R') {
    initializeNetwork();
  }
  
  if (key === 'p' || key === 'P') {
    pulseEnabled = !pulseEnabled;
  }
  
  if (key === 's' || key === 'S') {
    // Shuffle agent positions
    agents.forEach(agent => {
      agent.x = random(100, width - 100);
      agent.y = random(100, height - 100);
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
