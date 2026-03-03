// Daily Wonder - 2026-03-03
// Theme: Recovery/Rollback — Visualizing Agent Recovery

let particles = [];
let checkpoints = [];
let isRollingBack = false;
let flashAlpha = 0;
let lastCheckpointTime = 0;

const NUM_PARTICLES = 80;
const ROLLBACK_SPEED = 0.08;

class Particle {
  constructor(x, y) {
    this.x = x || random(width);
    this.y = y || random(height);
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.targetX = this.x;
    this.targetY = this.y;
    this.size = random(4, 12);
    this.hue = random(160, 220); // cyan-blue range
    this.trail = [];
    this.maxTrail = 15;
  }

  update(mouseInfluence) {
    if (isRollingBack) {
      // Smooth animation back to checkpoint position
      this.x = lerp(this.x, this.targetX, ROLLBACK_SPEED);
      this.y = lerp(this.y, this.targetY, ROLLBACK_SPEED);
      this.vx *= 0.95;
      this.vy *= 0.95;
    } else {
      // Mouse influence
      if (mouseInfluence) {
        let dx = mouseX - this.x;
        let dy = mouseY - this.y;
        let dist = sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          let force = map(dist, 0, 150, 0.5, 0);
          this.vx += (dx / dist) * force;
          this.vy += (dy / dist) * force;
        }
      }

      // Apply velocity with damping
      this.vx *= 0.98;
      this.vy *= 0.98;
      
      // Add slight random movement
      this.vx += random(-0.1, 0.1);
      this.vy += random(-0.1, 0.1);

      this.x += this.vx;
      this.y += this.vy;

      // Wrap around edges
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;
    }

    // Update trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrail) {
      this.trail.shift();
    }
  }

  draw() {
    // Draw trail
    noFill();
    for (let i = 0; i < this.trail.length - 1; i++) {
      let alpha = map(i, 0, this.trail.length, 0, 150);
      stroke(this.hue, 80, 100, alpha);
      strokeWeight(map(i, 0, this.trail.length, 1, this.size * 0.5));
      line(this.trail[i].x, this.trail[i].y, this.trail[i + 1].x, this.trail[i + 1].y);
    }

    // Draw particle
    noStroke();
    
    // Glow effect
    for (let r = this.size * 2; r > 0; r -= 2) {
      let alpha = map(r, 0, this.size * 2, 255, 0);
      fill(this.hue, 70, 100, alpha * 0.3);
      ellipse(this.x, this.y, r, r);
    }
    
    // Core
    fill(this.hue, 30, 100);
    ellipse(this.x, this.y, this.size, this.size);
  }

  getState() {
    return { x: this.x, y: this.y, vx: this.vx, vy: this.vy };
  }

  setTarget(state) {
    this.targetX = state.x;
    this.targetY = state.y;
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 255);
  
  // Initialize particles
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  // Dark background with slight fade for trails
  background(220, 30, 8, 40);
  
  // Flash effect when checkpoint is created
  if (flashAlpha > 0) {
    background(180, 50, 100, flashAlpha);
    flashAlpha -= 15;
  }

  // Check if rollback is complete
  if (isRollingBack) {
    let allArrived = true;
    for (let p of particles) {
      if (dist(p.x, p.y, p.targetX, p.targetY) > 2) {
        allArrived = false;
        break;
      }
    }
    if (allArrived) {
      isRollingBack = false;
    }
  }

  // Update and draw particles
  let mouseInfluence = mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height;
  for (let p of particles) {
    p.update(mouseInfluence);
    p.draw();
  }

  // Draw UI
  drawUI();
}

function drawUI() {
  // Checkpoint indicator
  fill(255);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  text(`Checkpoints: ${checkpoints.length}`, 20, 20);
  
  // Draw checkpoint timeline
  let timelineY = 50;
  for (let i = 0; i < checkpoints.length; i++) {
    let x = 20 + i * 20;
    fill(180, 80, 100);
    ellipse(x, timelineY, 12, 12);
    if (i < checkpoints.length - 1) {
      stroke(180, 80, 100, 100);
      strokeWeight(2);
      line(x + 6, timelineY, x + 14, timelineY);
    }
  }

  // Instructions
  fill(255, 150);
  textSize(12);
  textAlign(RIGHT, BOTTOM);
  text('SPACE: Create Checkpoint | R: Rollback | Mouse: Attract Particles', width - 20, height - 20);

  // Rollback indicator
  if (isRollingBack) {
    textAlign(CENTER, CENTER);
    textSize(24);
    fill(60, 100, 100);
    text('⟲ ROLLING BACK...', width / 2, height / 2 - 50);
  }
}

function keyPressed() {
  if (key === ' ' || keyCode === 32) {
    createCheckpoint();
    return false; // Prevent page scrolling
  }
  
  if (key === 'r' || key === 'R') {
    rollback();
  }
}

function createCheckpoint() {
  // Save current state of all particles
  let state = particles.map(p => p.getState());
  checkpoints.push({
    particles: state,
    time: millis()
  });
  
  // Visual feedback
  flashAlpha = 100;
  lastCheckpointTime = millis();
  
  // Limit checkpoint history
  if (checkpoints.length > 10) {
    checkpoints.shift();
  }
}

function rollback() {
  if (checkpoints.length === 0) return;
  
  // Get last checkpoint
  let checkpoint = checkpoints.pop();
  
  // Set target positions for all particles
  for (let i = 0; i < particles.length; i++) {
    if (checkpoint.particles[i]) {
      particles[i].setTarget(checkpoint.particles[i]);
    }
  }
  
  isRollingBack = true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  // Create a burst of velocity towards mouse
  for (let p of particles) {
    let dx = mouseX - p.x;
    let dy = mouseY - p.y;
    let dist_val = sqrt(dx * dx + dy * dy);
    if (dist_val < 200) {
      let force = map(dist_val, 0, 200, 3, 0);
      p.vx += (dx / dist_val) * force;
      p.vy += (dy / dist_val) * force;
    }
  }
}
