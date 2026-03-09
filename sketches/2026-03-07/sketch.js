/**
 * Memory Decay Visualization
 * Daily Wonder - 2026-03-07
 * 
 * Concept: Visualizing how agent memories decay over time.
 * Based on research findings:
 * - 43% of memories are never accessed
 * - 3-access threshold improves relevance
 * 
 * Interactions:
 * - Click near particles to "access" them
 * - Watch unaccessed memories fade and disappear
 * - Golden particles = accessed 3+ times (threshold effect)
 */

let memories = [];
const MAX_MEMORIES = 80;
const SPAWN_INTERVAL = 60; // frames between spawns
const ACCESS_RADIUS = 60;
const DECAY_RATE = 0.001;
const GOLDEN_THRESHOLD = 3;

let frameCounter = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  noStroke();
  
  // Initialize with some memories
  for (let i = 0; i < 30; i++) {
    spawnMemory();
  }
}

function draw() {
  // Dark background with slight trail effect
  background(230, 30, 8, 95);
  
  frameCounter++;
  
  // Spawn new memories periodically
  if (frameCounter % SPAWN_INTERVAL === 0 && memories.length < MAX_MEMORIES) {
    spawnMemory();
  }
  
  // Update and draw all memories
  for (let i = memories.length - 1; i >= 0; i--) {
    let m = memories[i];
    m.update();
    m.draw();
    
    // Remove dead memories
    if (m.isDead()) {
      memories.splice(i, 1);
    }
  }
  
  // Draw stats
  drawStats();
  
  // Draw instructions
  drawInstructions();
}

function spawnMemory() {
  memories.push(new Memory(
    random(50, width - 50),
    random(80, height - 80)
  ));
}

function mousePressed() {
  // Access memories near click
  for (let m of memories) {
    let d = dist(mouseX, mouseY, m.x, m.y);
    if (d < ACCESS_RADIUS) {
      m.access();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function drawStats() {
  let total = memories.length;
  let neverAccessed = memories.filter(m => m.accessCount === 0).length;
  let golden = memories.filter(m => m.accessCount >= GOLDEN_THRESHOLD).length;
  let percentage = total > 0 ? Math.round((neverAccessed / total) * 100) : 0;
  
  push();
  fill(0, 0, 100, 80);
  textSize(14);
  textFont('monospace');
  textAlign(LEFT, TOP);
  
  let y = 20;
  text(`Total Memories: ${total}`, 20, y);
  text(`Never Accessed: ${neverAccessed} (${percentage}%)`, 20, y + 20);
  text(`Golden (3+ access): ${golden}`, 20, y + 40);
  pop();
}

function drawInstructions() {
  push();
  fill(0, 0, 100, 40);
  textSize(12);
  textAlign(RIGHT, BOTTOM);
  text('Click to access memories • Watch them decay', width - 20, height - 20);
  pop();
}

class Memory {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.baseSize = random(15, 35);
    this.size = this.baseSize;
    this.brightness = 100;
    this.accessCount = 0;
    this.life = 1.0; // 1.0 = full life, 0 = dead
    this.age = 0;
    
    // Subtle floating motion
    this.offsetX = random(1000);
    this.offsetY = random(1000);
    this.driftSpeed = random(0.003, 0.008);
    
    // Visual properties
    this.hue = random(180, 260); // Blue-purple range for normal memories
    this.saturation = random(60, 80);
    
    // Pulse effect
    this.pulsePhase = random(TWO_PI);
    this.pulseSpeed = random(0.02, 0.04);
  }
  
  update() {
    this.age++;
    
    // Decay over time (slower if accessed more)
    let decayMultiplier = map(this.accessCount, 0, 5, 1.0, 0.3);
    this.life -= DECAY_RATE * decayMultiplier;
    this.life = max(0, this.life);
    
    // Update visual properties based on life
    if (this.accessCount < GOLDEN_THRESHOLD) {
      this.brightness = map(this.life, 0, 1, 10, 80);
      this.size = this.baseSize * map(this.life, 0, 1, 0.3, 1.0);
    } else {
      // Golden memories stay bright longer
      this.brightness = map(this.life, 0, 1, 30, 100);
      this.size = this.baseSize * map(this.life, 0, 1, 0.5, 1.2);
    }
    
    // Subtle drift
    this.x += (noise(this.offsetX) - 0.5) * 0.5;
    this.y += (noise(this.offsetY) - 0.5) * 0.5;
    this.offsetX += this.driftSpeed;
    this.offsetY += this.driftSpeed;
    
    // Keep in bounds
    this.x = constrain(this.x, 20, width - 20);
    this.y = constrain(this.y, 60, height - 40);
    
    // Pulse
    this.pulsePhase += this.pulseSpeed;
  }
  
  draw() {
    push();
    translate(this.x, this.y);
    
    let pulse = sin(this.pulsePhase) * 0.1 + 1;
    let displaySize = this.size * pulse;
    
    // Determine color based on access count
    let h, s, b;
    if (this.accessCount >= GOLDEN_THRESHOLD) {
      // Golden - accessed enough times
      h = 45; // Gold hue
      s = 80;
      b = this.brightness;
    } else if (this.accessCount > 0) {
      // Accessed but not golden - warmer color
      h = map(this.accessCount, 1, GOLDEN_THRESHOLD - 1, this.hue, 60);
      s = this.saturation;
      b = this.brightness;
    } else {
      // Never accessed - cool colors, fading
      h = this.hue;
      s = this.saturation * 0.7;
      b = this.brightness * 0.8;
    }
    
    // Glow effect for active memories
    if (this.accessCount > 0) {
      let glowAlpha = map(this.accessCount, 1, 5, 15, 30) * (this.life);
      fill(h, s * 0.5, b, glowAlpha);
      ellipse(0, 0, displaySize * 2.5);
      
      fill(h, s * 0.7, b, glowAlpha * 1.5);
      ellipse(0, 0, displaySize * 1.8);
    }
    
    // Main particle
    fill(h, s, b, 80 * this.life);
    ellipse(0, 0, displaySize);
    
    // Inner highlight
    fill(h, s * 0.3, min(100, b + 20), 60 * this.life);
    ellipse(-displaySize * 0.15, -displaySize * 0.15, displaySize * 0.4);
    
    // Access count indicator for golden memories
    if (this.accessCount >= GOLDEN_THRESHOLD) {
      fill(45, 90, 100, 70 * this.life);
      textSize(10);
      textAlign(CENTER, CENTER);
      text(this.accessCount, 0, 0);
    }
    
    pop();
  }
  
  access() {
    this.accessCount++;
    // Refresh life partially on access
    this.life = min(1.0, this.life + 0.3);
    this.brightness = 100;
    
    // Visual feedback - spawn access ripple
    this.pulsePhase = 0;
    
    // Grow slightly
    this.baseSize = min(45, this.baseSize + 2);
  }
  
  isDead() {
    return this.life <= 0;
  }
}
