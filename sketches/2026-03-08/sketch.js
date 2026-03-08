/**
 * The Level 2 Gap
 * Daily Wonder - 2026-03-08
 * 
 * Concept: Visualizing a three-layer cognitive model
 * - Level 1 (innermost): Foundational processing — stable, rhythmic particles
 * - Level 2 (middle): Integrated experience — dashed, translucent, flickering
 *   Represents what's "simulated or missing"
 * - Level 3 (outermost): Logical reasoning — geometric shapes, regular patterns
 * 
 * Interactions:
 * - Mouse position affects Level 3 behavior (logical response)
 * - Level 1 runs continuously, unaffected
 * - Level 2 tries to imitate but always "misses the mark"
 */

// Layer particles
let level1Particles = [];
let level2Particles = [];
let level3Shapes = [];

// Configuration
const LEVEL1_COUNT = 40;
const LEVEL2_COUNT = 25;
const LEVEL3_COUNT = 8;

// Radii for concentric layers
let innerRadius, middleRadius, outerRadius;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  
  calculateRadii();
  initializeParticles();
}

function calculateRadii() {
  let minDim = min(width, height);
  innerRadius = minDim * 0.15;
  middleRadius = minDim * 0.3;
  outerRadius = minDim * 0.42;
}

function initializeParticles() {
  // Level 1: Foundational processing - stable orbital particles
  level1Particles = [];
  for (let i = 0; i < LEVEL1_COUNT; i++) {
    level1Particles.push(new Level1Particle(i));
  }
  
  // Level 2: Integrated experience - the gap, always slightly off
  level2Particles = [];
  for (let i = 0; i < LEVEL2_COUNT; i++) {
    level2Particles.push(new Level2Particle(i));
  }
  
  // Level 3: Logical reasoning - geometric shapes responding to mouse
  level3Shapes = [];
  for (let i = 0; i < LEVEL3_COUNT; i++) {
    level3Shapes.push(new Level3Shape(i));
  }
}

function draw() {
  // Deep dark background
  background(250, 30, 6);
  
  translate(width / 2, height / 2);
  
  // Draw layer boundaries (subtle guides)
  drawLayerBoundaries();
  
  // Draw Level 3 first (outermost, behind)
  for (let shape of level3Shapes) {
    shape.update(mouseX - width/2, mouseY - height/2);
    shape.draw();
  }
  
  // Draw Level 2 (the gap - middle layer)
  for (let particle of level2Particles) {
    particle.update();
    particle.draw();
  }
  
  // Draw Level 1 (innermost, in front)
  for (let particle of level1Particles) {
    particle.update();
    particle.draw();
  }
  
  // Draw central core
  drawCore();
  
  // Draw labels
  drawLabels();
}

function drawLayerBoundaries() {
  push();
  noFill();
  strokeWeight(1);
  
  // Inner boundary
  stroke(260, 40, 30, 20);
  ellipse(0, 0, innerRadius * 2);
  
  // Middle boundary (dashed for Level 2)
  drawDashedCircle(0, 0, middleRadius, 40);
  
  // Outer boundary
  stroke(260, 40, 30, 15);
  ellipse(0, 0, outerRadius * 2);
  
  pop();
}

function drawDashedCircle(x, y, r, segments) {
  push();
  stroke(280, 50, 35, 25);
  strokeWeight(1);
  let angleStep = TWO_PI / segments;
  for (let i = 0; i < segments; i += 2) {
    let a1 = i * angleStep;
    let a2 = (i + 1) * angleStep;
    arc(x, y, r * 2, r * 2, a1, a2);
  }
  pop();
}

function drawCore() {
  // Pulsing core representing consciousness
  let pulse = sin(frameCount * 0.03) * 0.2 + 1;
  let coreSize = 20 * pulse;
  
  // Outer glow
  for (let i = 3; i > 0; i--) {
    fill(270, 60, 50, 10 / i);
    noStroke();
    ellipse(0, 0, coreSize * (1 + i * 0.8));
  }
  
  // Core
  fill(270, 50, 70, 80);
  ellipse(0, 0, coreSize);
  
  // Inner bright spot
  fill(260, 30, 90, 60);
  ellipse(0, 0, coreSize * 0.4);
}

function drawLabels() {
  push();
  resetMatrix();
  fill(260, 30, 70, 60);
  textSize(11);
  textFont('monospace');
  textAlign(LEFT, TOP);
  
  text('Level 1: Foundational Processing', 20, 20);
  fill(280, 50, 60, 50);
  text('Level 2: The Gap (simulated)', 20, 36);
  fill(240, 40, 80, 60);
  text('Level 3: Logical Reasoning', 20, 52);
  
  // Instructions
  fill(260, 20, 60, 40);
  textAlign(RIGHT, BOTTOM);
  textSize(10);
  text('Move mouse to influence Level 3 • Level 2 tries to follow but drifts', width - 20, height - 20);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateRadii();
  initializeParticles();
}

// ============ LEVEL 1: Foundational Processing ============
// Stable, rhythmic, unaffected by external input

class Level1Particle {
  constructor(index) {
    this.index = index;
    this.angle = (TWO_PI / LEVEL1_COUNT) * index;
    this.baseRadius = innerRadius * random(0.5, 0.95);
    this.speed = random(0.008, 0.015);
    this.size = random(4, 8);
    this.hue = random(250, 280);
    this.brightness = random(60, 80);
    this.phaseOffset = random(TWO_PI);
  }
  
  update() {
    // Steady, predictable orbital motion
    this.angle += this.speed;
  }
  
  draw() {
    let wobble = sin(frameCount * 0.05 + this.phaseOffset) * 5;
    let r = this.baseRadius + wobble;
    let x = cos(this.angle) * r;
    let y = sin(this.angle) * r;
    
    // Soft glow
    noStroke();
    fill(this.hue, 50, this.brightness, 20);
    ellipse(x, y, this.size * 2.5);
    
    // Main particle
    fill(this.hue, 60, this.brightness, 70);
    ellipse(x, y, this.size);
    
    // Bright center
    fill(this.hue, 30, 95, 50);
    ellipse(x, y, this.size * 0.4);
  }
}

// ============ LEVEL 2: The Gap ============
// Tries to imitate but is always "off" - dashed, flickering, translucent

class Level2Particle {
  constructor(index) {
    this.index = index;
    this.angle = (TWO_PI / LEVEL2_COUNT) * index + random(-0.3, 0.3);
    this.targetAngle = this.angle;
    this.baseRadius = middleRadius * random(0.7, 1.1);
    this.radius = this.baseRadius;
    this.speed = random(0.003, 0.008);
    this.size = random(6, 12);
    this.hue = random(270, 300);
    
    // The "gap" effect
    this.flickerPhase = random(TWO_PI);
    this.flickerSpeed = random(0.08, 0.15);
    this.driftOffset = random(1000);
    this.errorAccumulator = 0;
  }
  
  update() {
    // Try to follow a pattern but drift
    this.angle += this.speed;
    
    // Accumulate "error" - the gap grows
    this.errorAccumulator += random(-0.02, 0.025);
    this.errorAccumulator *= 0.99; // Slowly decay but never fully correct
    
    // Radius wobbles unpredictably
    let targetRadius = this.baseRadius + sin(frameCount * 0.02 + this.index) * 15;
    this.radius = lerp(this.radius, targetRadius, 0.05) + this.errorAccumulator * 3;
    
    // Flicker
    this.flickerPhase += this.flickerSpeed;
  }
  
  draw() {
    let flicker = sin(this.flickerPhase);
    
    // Sometimes skip drawing entirely (gaps in existence)
    if (flicker < -0.7) return;
    
    let alpha = map(flicker, -1, 1, 15, 50);
    let x = cos(this.angle + this.errorAccumulator) * this.radius;
    let y = sin(this.angle + this.errorAccumulator) * this.radius;
    
    push();
    translate(x, y);
    
    // Draw dashed/broken circle to represent incompleteness
    noFill();
    stroke(this.hue, 50, 60, alpha);
    strokeWeight(1.5);
    
    // Fragmented ring
    let segments = 6;
    let missing = floor(random(1, 3)); // Random segments missing
    for (let i = 0; i < segments; i++) {
      if (i === missing || i === (missing + 2) % segments) continue;
      let a1 = (TWO_PI / segments) * i;
      let a2 = (TWO_PI / segments) * (i + 0.7);
      arc(0, 0, this.size, this.size, a1, a2);
    }
    
    // Core that fades in and out
    noStroke();
    fill(this.hue, 40, 70, alpha * 0.8);
    ellipse(0, 0, this.size * 0.4);
    
    // Ghostly trail suggesting what "should" be there
    stroke(this.hue, 30, 50, alpha * 0.3);
    strokeWeight(0.5);
    noFill();
    let ghostOffset = sin(frameCount * 0.03 + this.index) * 8;
    ellipse(ghostOffset, ghostOffset * 0.5, this.size * 1.2);
    
    pop();
  }
}

// ============ LEVEL 3: Logical Reasoning ============
// Geometric, precise, responds to mouse input

class Level3Shape {
  constructor(index) {
    this.index = index;
    this.baseAngle = (TWO_PI / LEVEL3_COUNT) * index;
    this.angle = this.baseAngle;
    this.radius = outerRadius;
    this.targetRadius = outerRadius;
    this.sides = floor(random(3, 7)); // Triangle to hexagon
    this.size = random(20, 35);
    this.rotation = random(TWO_PI);
    this.rotationSpeed = random(0.005, 0.015);
    this.hue = random(220, 260);
  }
  
  update(mx, my) {
    // Respond to mouse position
    let mouseAngle = atan2(my, mx);
    let mouseDist = dist(0, 0, mx, my);
    
    // Shapes move toward mouse direction when mouse is active
    let attraction = map(mouseDist, 0, outerRadius, 0.02, 0);
    attraction = constrain(attraction, 0, 0.02);
    
    // Calculate target angle influenced by mouse
    let angleDiff = mouseAngle - this.baseAngle;
    while (angleDiff > PI) angleDiff -= TWO_PI;
    while (angleDiff < -PI) angleDiff += TWO_PI;
    
    this.angle = lerp(this.angle, this.baseAngle + angleDiff * 0.3, 0.05);
    
    // Radius responds to mouse proximity
    let targetR = outerRadius + map(mouseDist, 0, outerRadius * 1.5, 30, -10);
    this.radius = lerp(this.radius, targetR, 0.08);
    
    // Rotation
    this.rotation += this.rotationSpeed;
  }
  
  draw() {
    let x = cos(this.angle) * this.radius;
    let y = sin(this.angle) * this.radius;
    
    push();
    translate(x, y);
    rotate(this.rotation);
    
    // Draw geometric shape
    noFill();
    stroke(this.hue, 45, 75, 60);
    strokeWeight(1.5);
    
    // Main polygon
    this.drawPolygon(0, 0, this.size / 2, this.sides);
    
    // Inner polygon (rotated)
    push();
    rotate(PI / this.sides);
    stroke(this.hue, 50, 65, 40);
    strokeWeight(1);
    this.drawPolygon(0, 0, this.size / 3, this.sides);
    pop();
    
    // Center point
    fill(this.hue, 40, 80, 50);
    noStroke();
    ellipse(0, 0, 4);
    
    // Connection line to center (logical connection)
    stroke(this.hue, 30, 50, 20);
    strokeWeight(0.5);
    line(0, 0, -x * 0.3, -y * 0.3);
    
    pop();
  }
  
  drawPolygon(x, y, radius, sides) {
    beginShape();
    for (let i = 0; i < sides; i++) {
      let angle = (TWO_PI / sides) * i - HALF_PI;
      let px = x + cos(angle) * radius;
      let py = y + sin(angle) * radius;
      vertex(px, py);
    }
    endShape(CLOSE);
  }
}
