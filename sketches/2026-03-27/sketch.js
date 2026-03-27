// Self-Reference: A visualization of recursive self-modification
// Inspired by HyperAgents (Meta AI) - agents that modify their own modification process

let agents = [];
let history = [];
const MAX_HISTORY = 100;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  
  // Create initial agents
  for (let i = 0; i < 5; i++) {
    agents.push(new SelfModifyingAgent(random(width), random(height)));
  }
}

function draw() {
  background(240, 5, 8, 10); // Dark blue-gray with trail
  
  // Draw history trails
  stroke(200, 50, 50, 20);
  noFill();
  for (let trail of history) {
    beginShape();
    for (let p of trail) {
      vertex(p.x, p.y);
    }
    endShape();
  }
  
  // Update and draw agents
  for (let agent of agents) {
    agent.update();
    agent.display();
    
    // Self-modification: agents can change their own rules
    if (frameCount % 60 === 0) {
      agent.modifySelf();
    }
  }
  
  // Draw info
  fill(0, 0, 100);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);
  text(`Self-Reference | Agents: ${agents.length} | Frame: ${frameCount}`, 20, 20);
  text(`Click to spawn | Press 'R' to reset | Press 'M' to force modification`, 20, 40);
}

class SelfModifyingAgent {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-2, 2), random(-2, 2));
    this.acc = createVector(0, 0);
    
    // Modifiable parameters (the "meta" level)
    this.hue = random(360);
    this.size = random(10, 30);
    this.speed = random(0.5, 2);
    this.attractionStrength = random(0.001, 0.01);
    this.noiseScale = random(0.001, 0.01);
    
    // Modification rules (the "meta-meta" level)
    this.modificationRate = random(0.1, 0.3);
    this.modificationMagnitude = random(0.05, 0.2);
    
    this.trail = [];
  }
  
  update() {
    // Perlin noise movement
    let angle = noise(this.pos.x * this.noiseScale, this.pos.y * this.noiseScale, frameCount * 0.01) * TWO_PI * 2;
    this.acc = p5.Vector.fromAngle(angle).mult(0.1);
    
    // Mouse attraction
    if (mouseIsPressed) {
      let mouse = createVector(mouseX, mouseY);
      let force = p5.Vector.sub(mouse, this.pos);
      force.setMag(this.attractionStrength * 100);
      this.acc.add(force);
    }
    
    this.vel.add(this.acc);
    this.vel.limit(this.speed * 3);
    this.pos.add(this.vel);
    
    // Wrap around edges
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;
    
    // Record trail
    this.trail.push(this.pos.copy());
    if (this.trail.length > 50) {
      this.trail.shift();
    }
  }
  
  display() {
    // Draw trail
    stroke(this.hue, 60, 80, 30);
    noFill();
    beginShape();
    for (let p of this.trail) {
      vertex(p.x, p.y);
    }
    endShape();
    
    // Draw agent
    noStroke();
    fill(this.hue, 70, 90, 80);
    circle(this.pos.x, this.pos.y, this.size);
    
    // Inner circle shows modification state
    fill(this.hue, 30, 100, 90);
    circle(this.pos.x, this.pos.y, this.size * 0.4);
  }
  
  modifySelf() {
    // This is where the "hyperagent" magic happens
    // The agent modifies its own parameters based on its modification rules
    
    if (random() < this.modificationRate) {
      // Modify behavior parameters
      this.hue = (this.hue + random(-30, 30) * this.modificationMagnitude * 10) % 360;
      if (this.hue < 0) this.hue += 360;
      
      this.size += random(-5, 5) * this.modificationMagnitude;
      this.size = constrain(this.size, 5, 50);
      
      this.speed += random(-0.5, 0.5) * this.modificationMagnitude;
      this.speed = constrain(this.speed, 0.2, 4);
      
      this.noiseScale += random(-0.005, 0.005) * this.modificationMagnitude;
      this.noiseScale = constrain(this.noiseScale, 0.001, 0.02);
    }
    
    // Meta-modification: sometimes modify the modification rules themselves
    if (random() < 0.1) {
      this.modificationRate += random(-0.1, 0.1);
      this.modificationRate = constrain(this.modificationRate, 0.05, 0.5);
      
      this.modificationMagnitude += random(-0.05, 0.05);
      this.modificationMagnitude = constrain(this.modificationMagnitude, 0.02, 0.4);
    }
  }
}

function mousePressed() {
  agents.push(new SelfModifyingAgent(mouseX, mouseY));
  
  // Store current trails in history
  for (let agent of agents) {
    if (agent.trail.length > 10) {
      history.push([...agent.trail]);
      if (history.length > MAX_HISTORY) {
        history.shift();
      }
    }
  }
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    agents = [];
    history = [];
    for (let i = 0; i < 5; i++) {
      agents.push(new SelfModifyingAgent(random(width), random(height)));
    }
  }
  if (key === 'm' || key === 'M') {
    for (let agent of agents) {
      agent.modifySelf();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
