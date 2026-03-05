// Nanoscale — Daily Wonder 2026-03-05
// Thousands of tiny particles converging into meaningful patterns

const NUM_PARTICLES = 3000;
let particles = [];
let targetPoints = [];
let convergenceProgress = 0;
let mouseInfluenceRadius = 150;

// Colors
const coldColors = [
  [100, 150, 255],  // ice blue
  [80, 200, 220],   // cyan
  [150, 100, 255],  // lavender
];

const warmColors = [
  [255, 150, 50],   // orange
  [255, 200, 100],  // gold
  [255, 100, 150],  // coral
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255);
  
  generateTargetShape();
  initParticles();
}

function generateTargetShape() {
  // Generate infinity symbol (∞) made of points
  targetPoints = [];
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = min(width, height) * 0.25;
  
  for (let i = 0; i < NUM_PARTICLES; i++) {
    // Parametric equation for lemniscate (infinity symbol)
    const t = map(i, 0, NUM_PARTICLES, 0, TWO_PI);
    const denominator = 1 + sin(t) * sin(t);
    
    const x = centerX + (scale * cos(t)) / denominator;
    const y = centerY + (scale * sin(t) * cos(t)) / denominator;
    
    // Add some thickness variation
    const offset = random(-15, 15);
    const angle = random(TWO_PI);
    
    targetPoints.push({
      x: x + cos(angle) * offset,
      y: y + sin(angle) * offset
    });
  }
}

function initParticles() {
  particles = [];
  convergenceProgress = 0;
  
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: random(-1, 1),
      vy: random(-1, 1),
      targetIndex: i,
      size: random(1, 3),
      noiseOffset: random(1000),
      settled: 0  // 0 = wandering, 1 = fully settled
    });
  }
}

function draw() {
  // Semi-transparent background for trails
  background(10, 10, 15, 25);
  
  // Slowly increase convergence over time
  convergenceProgress = min(1, convergenceProgress + 0.0003);
  
  // Calculate mouse influence
  const mouseActive = mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height;
  
  // Update and draw particles
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const target = targetPoints[p.targetIndex];
    
    // Distance to target
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const distToTarget = sqrt(dx * dx + dy * dy);
    
    // Convergence force (increases over time)
    const convergenceForce = convergenceProgress * 0.02;
    p.vx += dx * convergenceForce;
    p.vy += dy * convergenceForce;
    
    // Mouse interaction
    if (mouseActive) {
      const mdx = p.x - mouseX;
      const mdy = p.y - mouseY;
      const mouseDist = sqrt(mdx * mdx + mdy * mdy);
      
      if (mouseDist < mouseInfluenceRadius) {
        // Repulsion force near mouse
        const force = map(mouseDist, 0, mouseInfluenceRadius, 3, 0);
        const angle = atan2(mdy, mdx);
        p.vx += cos(angle) * force;
        p.vy += sin(angle) * force;
        p.settled = max(0, p.settled - 0.1);  // Unsettle near mouse
      }
    }
    
    // Add some organic noise movement when not settled
    if (p.settled < 0.8) {
      const noiseScale = 0.005;
      const noiseStrength = 0.3 * (1 - p.settled);
      p.vx += (noise(p.x * noiseScale, p.y * noiseScale, frameCount * 0.01 + p.noiseOffset) - 0.5) * noiseStrength;
      p.vy += (noise(p.x * noiseScale + 1000, p.y * noiseScale, frameCount * 0.01 + p.noiseOffset) - 0.5) * noiseStrength;
    }
    
    // Damping
    p.vx *= 0.95;
    p.vy *= 0.95;
    
    // Update position
    p.x += p.vx;
    p.y += p.vy;
    
    // Update settled state
    if (distToTarget < 5) {
      p.settled = min(1, p.settled + 0.02);
    } else {
      p.settled = max(0, p.settled - 0.005);
    }
    
    // Calculate color based on settled state
    const coldIdx = i % coldColors.length;
    const warmIdx = i % warmColors.length;
    const cold = coldColors[coldIdx];
    const warm = warmColors[warmIdx];
    
    const r = lerp(cold[0], warm[0], p.settled);
    const g = lerp(cold[1], warm[1], p.settled);
    const b = lerp(cold[2], warm[2], p.settled);
    
    // Alpha based on velocity (faster = more visible trail)
    const speed = sqrt(p.vx * p.vx + p.vy * p.vy);
    const alpha = map(speed, 0, 5, 150, 255);
    
    // Draw particle
    noStroke();
    fill(r, g, b, alpha);
    circle(p.x, p.y, p.size * (1 + p.settled * 0.5));
    
    // Glow effect for settled particles
    if (p.settled > 0.5) {
      fill(r, g, b, 30 * p.settled);
      circle(p.x, p.y, p.size * 4);
    }
  }
  
  // Draw subtle mouse influence indicator
  if (mouseActive) {
    noFill();
    stroke(255, 255, 255, 20);
    strokeWeight(1);
    circle(mouseX, mouseY, mouseInfluenceRadius * 2);
  }
  
  // Draw convergence progress indicator
  drawProgressIndicator();
}

function drawProgressIndicator() {
  const barWidth = 100;
  const barHeight = 3;
  const x = width - barWidth - 20;
  const y = height - 20;
  
  // Background
  noStroke();
  fill(255, 255, 255, 30);
  rect(x, y, barWidth, barHeight, 2);
  
  // Progress
  const progressColor = lerpColor(
    color(100, 150, 255),
    color(255, 180, 100),
    convergenceProgress
  );
  fill(progressColor);
  rect(x, y, barWidth * convergenceProgress, barHeight, 2);
}

function mousePressed() {
  // Reset on click
  initParticles();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateTargetShape();
  initParticles();
}

function keyPressed() {
  // 'S' to save screenshot
  if (key === 's' || key === 'S') {
    saveCanvas('nanoscale-' + Date.now(), 'png');
  }
  // 'R' to reset
  if (key === 'r' || key === 'R') {
    initParticles();
  }
}
