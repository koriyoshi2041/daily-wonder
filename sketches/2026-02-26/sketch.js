/**
 * Identity Fingerprint
 * Visualizing the hidden patterns that reveal who we are
 * 
 * Inspired by research on LLM de-anonymization:
 * AI can identify anonymous authors through subtle writing patterns,
 * like invisible fingerprints left in every sentence we write.
 * 
 * Interactions:
 * - Mouse movement: Reveals the hidden fingerprint pattern
 * - Mouse still: Patterns dissolve back into chaos
 * - Click: Toggle between text and particle modes
 * - R: Reset and regenerate
 * - F: Toggle fingerprint visibility
 */

let particles = [];
let fingerprintLines = [];
let revealRadius = 150;
let revealIntensity = 0;
let lastMouseMove = 0;
let showFingerprint = true;
let textMode = true;
let time = 0;

// Characters that represent "anonymous text"
const chars = 'abcdefghijklmnopqrstuvwxyz0123456789@#$%&*?.,:;\'\"[]{}()<>-+=_/\\|~`';
const meaningfulWords = ['who', 'am', 'I', '???', 'anonymous', 'hidden', 'revealed', 'identity', 'style', 'pattern'];

// Cyberpunk color palette
const palette = {
  bg: [8, 10, 18],
  particle: [120, 160, 200],
  revealed: [0, 255, 180],
  fingerprint: [255, 100, 150],
  accent: [255, 200, 80],
  text: [200, 210, 230]
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Courier New, monospace');
  
  generateFingerprint();
  generateParticles();
}

function generateFingerprint() {
  fingerprintLines = [];
  
  // Create fingerprint pattern - arches and whorls
  let centerX = width / 2;
  let centerY = height / 2;
  let numLines = 25;
  
  for (let i = 0; i < numLines; i++) {
    let line = [];
    let baseY = map(i, 0, numLines - 1, -180, 180);
    
    // Create wave pattern like fingerprint ridges
    let amplitude = 30 + sin(i * 0.3) * 20;
    let frequency = 0.015 + sin(i * 0.2) * 0.005;
    let phase = i * 0.5;
    
    // Add some randomness for organic feel
    let noise1 = random(1000);
    let noise2 = random(1000);
    
    for (let x = -250; x <= 250; x += 5) {
      // Core fingerprint curve
      let curve = sin(x * frequency + phase) * amplitude;
      
      // Add whorl effect in center
      let distFromCenter = abs(x) / 250;
      let whorl = sin(sqrt(x * x + baseY * baseY) * 0.05 + i * 0.3) * 20 * (1 - distFromCenter);
      
      // Perlin noise for organic variation
      let noiseVal = noise(x * 0.01 + noise1, baseY * 0.01 + noise2) * 30 - 15;
      
      let y = baseY + curve + whorl + noiseVal;
      
      // Fade edges
      let edgeFade = 1 - pow(abs(x) / 280, 3);
      if (edgeFade > 0) {
        line.push({
          x: centerX + x,
          y: centerY + y,
          baseX: centerX + x,
          baseY: centerY + y,
          edgeFade: edgeFade
        });
      }
    }
    
    if (line.length > 0) {
      fingerprintLines.push(line);
    }
  }
}

function generateParticles() {
  particles = [];
  let numParticles = 2000;
  
  for (let i = 0; i < numParticles; i++) {
    let p = createParticle();
    particles.push(p);
  }
}

function createParticle() {
  // Random position
  let x = random(width);
  let y = random(height);
  
  // Find nearest fingerprint point for this particle
  let nearestPoint = findNearestFingerprintPoint(x, y);
  
  return {
    x: x,
    y: y,
    homeX: x,
    homeY: y,
    targetX: nearestPoint ? nearestPoint.x : x,
    targetY: nearestPoint ? nearestPoint.y : y,
    char: random() < 0.1 ? random(meaningfulWords) : chars[floor(random(chars.length))],
    size: random(8, 14),
    alpha: random(40, 100),
    noiseOffset: random(1000),
    speed: random(0.02, 0.05),
    revealed: false,
    revealProgress: 0,
    lineIndex: nearestPoint ? nearestPoint.lineIndex : -1
  };
}

function findNearestFingerprintPoint(x, y) {
  let minDist = Infinity;
  let nearest = null;
  
  for (let li = 0; li < fingerprintLines.length; li++) {
    let line = fingerprintLines[li];
    for (let pi = 0; pi < line.length; pi++) {
      let p = line[pi];
      let d = dist(x, y, p.x, p.y);
      if (d < minDist && d < 300) {
        minDist = d;
        nearest = { x: p.x, y: p.y, lineIndex: li };
      }
    }
  }
  
  return nearest;
}

function draw() {
  time += deltaTime * 0.001;
  
  // Background
  background(palette.bg[0], palette.bg[1], palette.bg[2]);
  
  // Draw subtle grid
  drawGrid();
  
  // Update reveal intensity based on mouse movement
  let timeSinceMove = millis() - lastMouseMove;
  let targetIntensity = timeSinceMove < 100 ? 1 : 0;
  revealIntensity = lerp(revealIntensity, targetIntensity, 0.05);
  
  // Update and draw particles
  updateParticles();
  drawParticles();
  
  // Draw fingerprint lines (faint guide)
  if (showFingerprint) {
    drawFingerprintGuide();
  }
  
  // Draw reveal circle
  drawRevealCircle();
  
  // Draw UI
  drawUI();
}

function drawGrid() {
  stroke(255, 5);
  strokeWeight(1);
  let gridSize = 40;
  
  for (let x = 0; x < width; x += gridSize) {
    line(x, 0, x, height);
  }
  for (let y = 0; y < height; y += gridSize) {
    line(0, y, width, y);
  }
}

function updateParticles() {
  particles.forEach(p => {
    // Check if within reveal radius
    let d = dist(mouseX, mouseY, p.x, p.y);
    let inRevealZone = d < revealRadius;
    
    // Update reveal progress
    if (inRevealZone && revealIntensity > 0.5) {
      p.revealProgress = min(1, p.revealProgress + 0.03);
      p.revealed = true;
    } else {
      p.revealProgress = max(0, p.revealProgress - 0.01);
      if (p.revealProgress === 0) p.revealed = false;
    }
    
    // Move particle
    let targetX, targetY;
    
    if (p.revealProgress > 0) {
      // Move toward fingerprint position
      targetX = lerp(p.homeX, p.targetX, p.revealProgress);
      targetY = lerp(p.homeY, p.targetY, p.revealProgress);
    } else {
      // Drift randomly around home
      let noiseX = noise(p.noiseOffset + time * 0.3) * 40 - 20;
      let noiseY = noise(p.noiseOffset + 1000 + time * 0.3) * 40 - 20;
      targetX = p.homeX + noiseX;
      targetY = p.homeY + noiseY;
    }
    
    p.x = lerp(p.x, targetX, p.speed);
    p.y = lerp(p.y, targetY, p.speed);
  });
}

function drawParticles() {
  textAlign(CENTER, CENTER);
  noStroke();
  
  particles.forEach(p => {
    // Calculate color based on reveal state
    let r, g, b, a;
    
    if (p.revealProgress > 0) {
      // Transition from anonymous to revealed
      let t = p.revealProgress;
      r = lerp(palette.particle[0], palette.revealed[0], t);
      g = lerp(palette.particle[1], palette.revealed[1], t);
      b = lerp(palette.particle[2], palette.revealed[2], t);
      a = lerp(p.alpha, 200, t);
      
      // Add line-based coloring for organized particles
      if (p.lineIndex >= 0) {
        let lineHue = map(p.lineIndex, 0, fingerprintLines.length, 0, 1);
        let accentAmount = t * 0.3;
        r = lerp(r, palette.fingerprint[0], accentAmount * sin(lineHue * PI));
        g = lerp(g, palette.fingerprint[1], accentAmount);
        b = lerp(b, palette.fingerprint[2], accentAmount * cos(lineHue * PI));
      }
    } else {
      r = palette.particle[0];
      g = palette.particle[1];
      b = palette.particle[2];
      a = p.alpha;
    }
    
    fill(r, g, b, a);
    
    if (textMode) {
      textSize(p.size * (1 + p.revealProgress * 0.3));
      text(p.char, p.x, p.y);
    } else {
      let size = p.size * 0.4 * (1 + p.revealProgress);
      ellipse(p.x, p.y, size, size);
    }
  });
}

function drawFingerprintGuide() {
  noFill();
  strokeWeight(1);
  
  fingerprintLines.forEach((line, li) => {
    beginShape();
    line.forEach((p, pi) => {
      // Only show near mouse
      let d = dist(mouseX, mouseY, p.x, p.y);
      let alpha = map(d, 0, revealRadius * 1.5, 30, 0);
      alpha *= revealIntensity * p.edgeFade;
      
      if (alpha > 0) {
        stroke(palette.fingerprint[0], palette.fingerprint[1], palette.fingerprint[2], alpha);
        vertex(p.x, p.y);
      }
    });
    endShape();
  });
}

function drawRevealCircle() {
  // Scanning circle effect
  noFill();
  let alpha = 30 + sin(time * 3) * 15;
  
  for (let i = 3; i > 0; i--) {
    strokeWeight(i);
    stroke(palette.revealed[0], palette.revealed[1], palette.revealed[2], alpha / i);
    ellipse(mouseX, mouseY, revealRadius * 2 * (1 + i * 0.1), revealRadius * 2 * (1 + i * 0.1));
  }
  
  // Scanning line
  strokeWeight(1);
  stroke(palette.revealed[0], palette.revealed[1], palette.revealed[2], 50);
  let scanAngle = time * 2;
  let scanX = mouseX + cos(scanAngle) * revealRadius;
  let scanY = mouseY + sin(scanAngle) * revealRadius;
  line(mouseX, mouseY, scanX, scanY);
}

function drawUI() {
  // Title
  fill(palette.text[0], palette.text[1], palette.text[2]);
  textAlign(LEFT, TOP);
  textSize(24);
  text("Identity Fingerprint", 20, 20);
  
  textSize(12);
  fill(100, 110, 130);
  text("Every word you write leaves a unique mark", 20, 50);
  
  // Stats
  let revealedCount = particles.filter(p => p.revealProgress > 0.5).length;
  let percentage = ((revealedCount / particles.length) * 100).toFixed(1);
  
  textSize(11);
  fill(palette.revealed[0], palette.revealed[1], palette.revealed[2], 180);
  text(`Identity revealed: ${percentage}%`, 20, 75);
  
  // Reveal intensity indicator
  drawProgressBar(20, 95, 120, 6, revealIntensity, palette.revealed);
  
  // Instructions
  textAlign(RIGHT, TOP);
  fill(80, 90, 110);
  textSize(10);
  let instructions = [
    "Move mouse to reveal hidden identity",
    "Click - Toggle text/particle mode",
    "R - Regenerate pattern",
    "F - Toggle fingerprint guide",
    "+/- Adjust reveal radius"
  ];
  instructions.forEach((inst, i) => {
    text(inst, width - 20, 20 + i * 14);
  });
  
  // Mode indicator
  textAlign(LEFT, BOTTOM);
  textSize(10);
  fill(palette.accent[0], palette.accent[1], palette.accent[2], 150);
  text(`Mode: ${textMode ? 'TEXT' : 'PARTICLES'} | Radius: ${revealRadius}`, 20, height - 20);
}

function drawProgressBar(x, y, w, h, value, color) {
  // Background
  fill(30, 35, 50);
  noStroke();
  rect(x, y, w, h, h / 2);
  
  // Fill
  fill(color[0], color[1], color[2], 200);
  rect(x, y, w * value, h, h / 2);
}

function mouseMoved() {
  lastMouseMove = millis();
}

function mouseDragged() {
  lastMouseMove = millis();
}

function mousePressed() {
  textMode = !textMode;
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    generateFingerprint();
    generateParticles();
  }
  
  if (key === 'f' || key === 'F') {
    showFingerprint = !showFingerprint;
  }
  
  if (key === '=' || key === '+') {
    revealRadius = min(300, revealRadius + 20);
  }
  
  if (key === '-' || key === '_') {
    revealRadius = max(50, revealRadius - 20);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateFingerprint();
  generateParticles();
}
