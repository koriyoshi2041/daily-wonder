// Trust Cascade - Visualizing how trust/poison spreads through networks
// Daily Wonder Sketch - 2026-03-13

var nodes = [];
var particles = [];
var paused = false;
const NODE_COUNT = 80;
const CONNECTION_DISTANCE = 120;
const SPREAD_PROBABILITY = 0.6;
const SPREAD_DELAY = 150; // ms

// Colors
const COLORS = {
  neutral: { r: 100, g: 100, b: 100 },
  trusted: { r: 59, g: 130, b: 246 },  // Blue
  poisoned: { r: 239, g: 68, b: 68 }   // Red
};

class Node {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-0.3, 0.3);
    this.vy = random(-0.3, 0.3);
    this.state = 'neutral';
    this.targetState = 'neutral';
    this.neighbors = [];
    this.radius = random(6, 12);
    this.pulsePhase = random(TWO_PI);
    
    // Animation
    this.colorTransition = 1;
    this.currentColor = { ...COLORS.neutral };
    this.targetColor = { ...COLORS.neutral };
    
    // Spread queue
    this.pendingSpread = null;
  }
  
  findNeighbors(allNodes) {
    this.neighbors = [];
    for (let other of allNodes) {
      if (other !== this) {
        let d = dist(this.x, this.y, other.x, other.y);
        if (d < CONNECTION_DISTANCE) {
          this.neighbors.push(other);
        }
      }
    }
  }
  
  setState(newState) {
    if (this.state === newState) return;
    
    // If neutral, accept any state
    // If trusted/poisoned, can be "converted" by opposing state
    if (this.state === 'neutral' || 
        (this.state === 'trusted' && newState === 'poisoned') ||
        (this.state === 'poisoned' && newState === 'trusted')) {
      
      this.state = newState;
      this.targetColor = { ...COLORS[newState] };
      this.currentColor = { ...COLORS[newState] }; // Immediately show color
      this.colorTransition = 0;
      
      // Create burst particles
      for (let i = 0; i < 8; i++) {
        particles.push(new Particle(this.x, this.y, this.targetColor));
      }
      
      // Schedule spread to neighbors
      this.scheduleSpread();
    }
  }
  
  scheduleSpread() {
    if (this.state === 'neutral') return;
    
    for (let neighbor of this.neighbors) {
      setTimeout(() => {
        if (!paused && random() < SPREAD_PROBABILITY) {
          neighbor.setState(this.state);
        }
      }, SPREAD_DELAY + random(100));
    }
  }
  
  update() {
    // Gentle floating motion
    this.x += this.vx;
    this.y += this.vy;
    
    // Bounce off edges
    if (this.x < 30 || this.x > width - 30) this.vx *= -1;
    if (this.y < 30 || this.y > height - 30) this.vy *= -1;
    
    // Keep in bounds
    this.x = constrain(this.x, 20, width - 20);
    this.y = constrain(this.y, 20, height - 20);
    
    // Color transition
    if (this.colorTransition < 1) {
      this.colorTransition += 0.05;
      this.currentColor.r = lerp(this.currentColor.r, this.targetColor.r, 0.1);
      this.currentColor.g = lerp(this.currentColor.g, this.targetColor.g, 0.1);
      this.currentColor.b = lerp(this.currentColor.b, this.targetColor.b, 0.1);
    }
    
    // Pulse
    this.pulsePhase += 0.03;
  }
  
  draw() {
    let pulse = sin(this.pulsePhase) * 2;
    let r = this.radius + pulse;
    
    // Glow effect for non-neutral nodes
    if (this.state !== 'neutral') {
      noStroke();
      for (let i = 3; i > 0; i--) {
        fill(this.currentColor.r, this.currentColor.g, this.currentColor.b, 20 * i);
        ellipse(this.x, this.y, r * 2 + i * 10);
      }
    }
    
    // Main node
    fill(this.currentColor.r, this.currentColor.g, this.currentColor.b);
    noStroke();
    ellipse(this.x, this.y, r * 2);
    
    // Inner highlight
    fill(255, 255, 255, 50);
    ellipse(this.x - r * 0.2, this.y - r * 0.2, r * 0.8);
  }
  
  drawConnections() {
    for (let neighbor of this.neighbors) {
      let d = dist(this.x, this.y, neighbor.x, neighbor.y);
      let alpha = map(d, 0, CONNECTION_DISTANCE, 80, 10);
      
      // Color based on states
      let c1 = this.currentColor;
      let c2 = neighbor.currentColor;
      
      // Gradient line
      let steps = 10;
      for (let i = 0; i < steps; i++) {
        let t = i / steps;
        let x1 = lerp(this.x, neighbor.x, t);
        let y1 = lerp(this.y, neighbor.y, t);
        let x2 = lerp(this.x, neighbor.x, t + 1/steps);
        let y2 = lerp(this.y, neighbor.y, t + 1/steps);
        
        let r = lerp(c1.r, c2.r, t);
        let g = lerp(c1.g, c2.g, t);
        let b = lerp(c1.b, c2.b, t);
        
        stroke(r, g, b, alpha);
        strokeWeight(1);
        line(x1, y1, x2, y2);
      }
    }
  }
  
  contains(px, py) {
    return dist(px, py, this.x, this.y) < this.radius + 10;
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = { ...color };
    this.vx = random(-3, 3);
    this.vy = random(-3, 3);
    this.life = 1;
    this.decay = random(0.02, 0.04);
    this.size = random(2, 5);
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life -= this.decay;
  }
  
  draw() {
    noStroke();
    fill(this.color.r, this.color.g, this.color.b, this.life * 200);
    ellipse(this.x, this.y, this.size * this.life);
  }
  
  isDead() {
    return this.life <= 0;
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  initializeNetwork();
}

function initializeNetwork() {
  nodes = [];
  particles = [];
  
  // Create nodes with some spacing
  for (let i = 0; i < NODE_COUNT; i++) {
    let x = random(50, width - 50);
    let y = random(50, height - 50);
    
    // Ensure minimum spacing
    let tooClose = false;
    for (let node of nodes) {
      if (dist(x, y, node.x, node.y) < 40) {
        tooClose = true;
        break;
      }
    }
    
    if (!tooClose) {
      nodes.push(new Node(x, y));
    } else {
      i--; // Try again
    }
  }
  
  // Find neighbors
  for (let node of nodes) {
    node.findNeighbors(nodes);
  }
}

function draw() {
  background(10, 10, 10);
  
  // Draw title
  fill(255, 255, 255, 100);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  text('Trust Cascade', 20, 20);
  
  // Draw instructions
  fill(255, 255, 255, 50);
  textSize(11);
  text('Left click: Trust (blue)  |  Right click: Poison (red)  |  R: Reset  |  Space: Pause', 20, 40);
  
  // Draw status
  let trustedCount = nodes.filter(n => n.state === 'trusted').length;
  let poisonedCount = nodes.filter(n => n.state === 'poisoned').length;
  let neutralCount = nodes.filter(n => n.state === 'neutral').length;
  
  textAlign(RIGHT, TOP);
  fill(COLORS.trusted.r, COLORS.trusted.g, COLORS.trusted.b, 200);
  text(`Trusted: ${trustedCount}`, width - 20, 20);
  fill(COLORS.poisoned.r, COLORS.poisoned.g, COLORS.poisoned.b, 200);
  text(`Poisoned: ${poisonedCount}`, width - 20, 36);
  fill(COLORS.neutral.r, COLORS.neutral.g, COLORS.neutral.b, 200);
  text(`Neutral: ${neutralCount}`, width - 20, 52);
  
  if (paused) {
    fill(255, 255, 255, 150);
    textAlign(CENTER, CENTER);
    textSize(24);
    text('PAUSED', width / 2, height / 2);
  }
  
  if (!paused) {
    // Update nodes
    for (let node of nodes) {
      node.update();
    }
    
    // Update neighbors (connections change as nodes move)
    if (frameCount % 30 === 0) {
      for (let node of nodes) {
        node.findNeighbors(nodes);
      }
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      if (particles[i].isDead()) {
        particles.splice(i, 1);
      }
    }
  }
  
  // Draw connections first (behind nodes)
  for (let node of nodes) {
    node.drawConnections();
  }
  
  // Draw nodes
  for (let node of nodes) {
    node.draw();
  }
  
  // Draw particles
  for (let particle of particles) {
    particle.draw();
  }
}

function mousePressed() {
  for (let node of nodes) {
    if (node.contains(mouseX, mouseY)) {
      if (mouseButton === LEFT) {
        node.setState('trusted');
      } else if (mouseButton === RIGHT) {
        node.setState('poisoned');
      }
      break;
    }
  }
  return false; // Prevent default
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    initializeNetwork();
  }
  if (key === ' ') {
    paused = !paused;
  }
}

function windowResized() {
  // Just resize canvas, don't reset the network
  resizeCanvas(windowWidth, windowHeight);
  // Keep nodes within new bounds
  for (let node of nodes) {
    node.x = constrain(node.x, 20, width - 20);
    node.y = constrain(node.y, 20, height - 20);
  }
}

// Prevent context menu on right click
document.addEventListener('contextmenu', e => e.preventDefault());
