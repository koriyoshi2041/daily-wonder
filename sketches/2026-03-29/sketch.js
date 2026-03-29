// Belief Revision — When Evidence Arrives
// Inspired by AGM theory + arXiv:2505.19184 (LLM overconfidence in debates)
// Each particle is a belief with position (opinion), color (confidence), size (entrenchment)
// Evidence arrives as shockwaves — well-entrenched beliefs resist, peripheral ones update

let beliefs = [];
let shockwaves = [];
let revisionLog = [];
const NUM_BELIEFS = 80;
const LOG_MAX = 30;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  textFont('monospace');
  
  for (let i = 0; i < NUM_BELIEFS; i++) {
    beliefs.push(new Belief(random(width), random(height)));
  }
}

function draw() {
  background(220, 15, 6, 25);
  
  // Draw entrenchment field (subtle)
  drawEntrenchmentField();
  
  // Draw connections between beliefs with similar positions
  drawBeliefNetwork();
  
  // Update and draw shockwaves
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    shockwaves[i].update();
    shockwaves[i].draw();
    if (shockwaves[i].dead) shockwaves.splice(i, 1);
  }
  
  // Update and draw beliefs
  for (let b of beliefs) {
    b.update();
    b.draw();
  }
  
  // Draw revision log
  drawRevisionLog();
  
  // Draw stats
  drawStats();
  
  // Continuous pressure if mouse held
  if (mouseIsPressed && frameCount % 8 === 0) {
    shockwaves.push(new Shockwave(mouseX, mouseY, 0.3));
  }
}

class Belief {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    
    // Opinion: 0-1 spectrum (visualized as hue)
    this.opinion = random();
    this.originalOpinion = this.opinion;
    
    // Confidence: how sure (0-1), mapped to brightness
    this.confidence = random(0.4, 0.95);
    
    // Entrenchment: resistance to change (0-1), mapped to size
    this.entrenchment = random(0.1, 1);
    
    // Core vs peripheral
    this.isCore = this.entrenchment > 0.7;
    
    // Drift velocity
    this.vx = 0;
    this.vy = 0;
    
    // Visual
    this.pulsePhase = random(TWO_PI);
    this.revisionCount = 0;
    
    // AGM overconfidence factor (arXiv:2505.19184)
    // Beliefs tend to escalate confidence under pressure instead of updating
    this.overconfidenceBias = random(0.3, 0.8);
  }
  
  receiveEvidence(wave) {
    let d = dist(this.x, this.y, wave.x, wave.y);
    if (d > wave.radius + 50 || d < wave.radius - 50) return;
    
    let strength = wave.strength * map(abs(d - wave.radius), 0, 50, 1, 0);
    
    // Evidence direction: pushes opinion toward wave's "argument"
    let evidenceDirection = wave.x < width / 2 ? -0.1 : 0.1;
    
    // AGM: entrenchment determines resistance
    let updateAmount = strength * (1 - this.entrenchment * 0.9);
    
    // The overconfidence problem: under pressure, confidence often INCREASES
    let confidenceChange;
    if (random() < this.overconfidenceBias) {
      // Escalate confidence (the LLM problem)
      confidenceChange = strength * 0.05;
      this.confidence = min(1, this.confidence + confidenceChange);
    } else {
      // Rational update: evidence should reduce confidence in current position
      confidenceChange = -strength * 0.1;
      this.confidence = max(0.1, this.confidence + confidenceChange);
    }
    
    // Opinion shift (if entrenchment allows)
    if (updateAmount > 0.01) {
      let oldOpinion = this.opinion;
      this.opinion += evidenceDirection * updateAmount;
      this.opinion = constrain(this.opinion, 0, 1);
      
      // Physical push
      let angle = atan2(this.y - wave.y, this.x - wave.x);
      this.vx += cos(angle) * strength * 3;
      this.vy += sin(angle) * strength * 3;
      
      // Log significant revisions
      if (abs(this.opinion - oldOpinion) > 0.02) {
        this.revisionCount++;
        logRevision(oldOpinion, this.opinion, this.entrenchment);
      }
    }
    
    // Pulse effect
    this.pulsePhase = 0;
  }
  
  update() {
    // Gentle drift back toward equilibrium
    this.vx *= 0.96;
    this.vy *= 0.96;
    
    // Slight attraction to similar beliefs (echo chamber effect)
    for (let other of beliefs) {
      if (other === this) continue;
      let opDiff = abs(this.opinion - other.opinion);
      if (opDiff < 0.15) {
        let d = dist(this.x, this.y, other.x, other.y);
        if (d > 20 && d < 200) {
          let force = 0.001 / max(d, 1);
          this.vx += (other.x - this.x) * force;
          this.vy += (other.y - this.y) * force;
        }
      }
    }
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Soft boundary
    if (this.x < 30) this.vx += 0.3;
    if (this.x > width - 30) this.vx -= 0.3;
    if (this.y < 30) this.vy += 0.3;
    if (this.y > height - 30) this.vy -= 0.3;
    
    this.pulsePhase += 0.05;
  }
  
  draw() {
    let hue = this.opinion * 240; // Blue (0) to Red (1) spectrum
    let sat = 60 + this.confidence * 30;
    let bri = 30 + this.confidence * 60;
    let baseSize = 4 + this.entrenchment * 20;
    let pulse = sin(this.pulsePhase) * 2;
    let sz = baseSize + pulse;
    
    // Glow for core beliefs
    if (this.isCore) {
      noStroke();
      fill(hue, sat * 0.5, bri, 8);
      ellipse(this.x, this.y, sz * 3);
      fill(hue, sat * 0.7, bri, 15);
      ellipse(this.x, this.y, sz * 2);
    }
    
    // Main body
    noStroke();
    fill(hue, sat, bri, 70 + this.confidence * 25);
    ellipse(this.x, this.y, sz);
    
    // Bright center
    fill(hue, sat * 0.3, min(100, bri + 30), 80);
    ellipse(this.x, this.y, sz * 0.4);
    
    // Revision scars — small marks for each time belief changed
    if (this.revisionCount > 0) {
      stroke(0, 0, 100, 30);
      strokeWeight(0.5);
      noFill();
      for (let i = 0; i < min(this.revisionCount, 5); i++) {
        let a = (TWO_PI / 5) * i + frameCount * 0.01;
        let r = sz * 0.7 + i * 2;
        point(this.x + cos(a) * r, this.y + sin(a) * r);
      }
    }
    
    // Opinion shift indicator (line from original to current)
    let shift = abs(this.opinion - this.originalOpinion);
    if (shift > 0.05) {
      stroke(0, 0, 100, shift * 80);
      strokeWeight(0.5);
      let angle = this.opinion > this.originalOpinion ? 0 : PI;
      line(this.x, this.y, this.x + cos(angle) * shift * 40, this.y + sin(angle) * shift * 40);
    }
  }
}

class Shockwave {
  constructor(x, y, strength) {
    this.x = x;
    this.y = y;
    this.strength = strength || 0.5;
    this.radius = 0;
    this.maxRadius = max(width, height) * 0.8;
    this.speed = 4;
    this.dead = false;
  }
  
  update() {
    this.radius += this.speed;
    this.strength *= 0.995;
    
    // Hit beliefs in the wavefront
    for (let b of beliefs) {
      b.receiveEvidence(this);
    }
    
    if (this.radius > this.maxRadius || this.strength < 0.01) {
      this.dead = true;
    }
  }
  
  draw() {
    noFill();
    let alpha = map(this.radius, 0, this.maxRadius, 40, 0) * this.strength;
    
    // Main ring
    stroke(40, 80, 90, alpha);
    strokeWeight(2);
    ellipse(this.x, this.y, this.radius * 2);
    
    // Inner glow
    stroke(40, 60, 100, alpha * 0.5);
    strokeWeight(1);
    ellipse(this.x, this.y, this.radius * 2 - 10);
    
    // Origin flash
    if (this.radius < 30) {
      noStroke();
      fill(40, 90, 100, (30 - this.radius) * 2);
      ellipse(this.x, this.y, 30 - this.radius);
    }
  }
}

function logRevision(oldOp, newOp, entrenchment) {
  let direction = newOp > oldOp ? '→' : '←';
  let resistance = entrenchment > 0.7 ? 'core' : entrenchment > 0.4 ? 'mid' : 'peripheral';
  revisionLog.unshift({
    text: `${resistance} belief shifted ${direction} (${nf(oldOp, 1, 2)} → ${nf(newOp, 1, 2)})`,
    age: 0
  });
  if (revisionLog.length > LOG_MAX) revisionLog.pop();
}

function drawRevisionLog() {
  let x = width - 320;
  let y = 30;
  
  textAlign(LEFT);
  textSize(10);
  noStroke();
  
  fill(0, 0, 100, 30);
  text('revision log:', x, y);
  y += 16;
  
  for (let entry of revisionLog) {
    entry.age++;
    let alpha = map(entry.age, 0, 300, 40, 0);
    if (alpha < 1) continue;
    fill(0, 0, 100, alpha);
    text(entry.text, x, y);
    y += 14;
  }
}

function drawStats() {
  let avgConfidence = beliefs.reduce((s, b) => s + b.confidence, 0) / beliefs.length;
  let avgShift = beliefs.reduce((s, b) => s + abs(b.opinion - b.originalOpinion), 0) / beliefs.length;
  let totalRevisions = beliefs.reduce((s, b) => s + b.revisionCount, 0);
  let coreUnchanged = beliefs.filter(b => b.isCore && abs(b.opinion - b.originalOpinion) < 0.05).length;
  let coreTotal = beliefs.filter(b => b.isCore).length;
  
  textAlign(LEFT);
  textSize(11);
  noStroke();
  
  let y = 30;
  fill(0, 0, 100, 40);
  text(`avg confidence: ${nf(avgConfidence, 1, 2)}`, 20, y); y += 16;
  text(`avg opinion drift: ${nf(avgShift, 1, 3)}`, 20, y); y += 16;
  text(`total revisions: ${totalRevisions}`, 20, y); y += 16;
  text(`core beliefs unchanged: ${coreUnchanged}/${coreTotal}`, 20, y); y += 16;
  
  // The overconfidence indicator
  if (avgConfidence > 0.7) {
    fill(0, 80, 90, 50);
    text(`⚠ overconfidence detected`, 20, y);
  }
}

function drawBeliefNetwork() {
  for (let i = 0; i < beliefs.length; i++) {
    for (let j = i + 1; j < beliefs.length; j++) {
      let opDiff = abs(beliefs[i].opinion - beliefs[j].opinion);
      let d = dist(beliefs[i].x, beliefs[i].y, beliefs[j].x, beliefs[j].y);
      if (opDiff < 0.1 && d < 150) {
        let alpha = map(d, 0, 150, 15, 0) * map(opDiff, 0, 0.1, 1, 0);
        let hue = beliefs[i].opinion * 240;
        stroke(hue, 40, 50, alpha);
        strokeWeight(0.5);
        line(beliefs[i].x, beliefs[i].y, beliefs[j].x, beliefs[j].y);
      }
    }
  }
}

function drawEntrenchmentField() {
  // Subtle background gradient showing belief landscape
  if (frameCount === 1) {
    // Only draw once (performance)
    loadPixels();
    for (let x = 0; x < width; x += 4) {
      for (let y = 0; y < height; y += 4) {
        let noise_val = noise(x * 0.003, y * 0.003);
        let idx = (y * width + x) * 4;
        pixels[idx] = noise_val * 8;
        pixels[idx + 1] = noise_val * 8;
        pixels[idx + 2] = noise_val * 15;
        pixels[idx + 3] = 255;
      }
    }
    updatePixels();
  }
}

function mousePressed() {
  if (mouseButton === LEFT) {
    shockwaves.push(new Shockwave(mouseX, mouseY, 0.6));
  }
}

function keyPressed() {
  if (key === ' ') {
    // Reset all beliefs to original
    for (let b of beliefs) {
      b.opinion = b.originalOpinion;
      b.confidence = random(0.4, 0.95);
      b.revisionCount = 0;
    }
    revisionLog = [];
    shockwaves = [];
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
