// Cold-Start Visualization
// Inspired by agent self-auditing culture

let particles = [];
let targetCount = 210; // represents ~21,000 tokens
let cleanedCount = 170; // represents ~17,000 tokens after cleanup
let currentCount;
let cleaned = false;
let cleanupProgress = 0;

function setup() {
  createCanvas(800, 600);
  currentCount = targetCount;
  
  // Initialize particles
  for (let i = 0; i < targetCount; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      size: random(3, 8),
      speed: random(0.5, 2),
      angle: random(TWO_PI),
      hue: random(180, 280), // blue to purple
      isDuplicate: i > cleanedCount, // mark duplicates
      alpha: 255
    });
  }
}

function draw() {
  background(10, 10, 15);
  
  // Title
  fill(255);
  textSize(16);
  textAlign(LEFT);
  text("Cold-Start Visualization", 20, 30);
  
  // Token count
  textSize(24);
  let displayCount = floor(currentCount * 100);
  fill(cleaned ? color(100, 255, 150) : color(255, 100, 100));
  text(`~${displayCount.toLocaleString()} tokens`, 20, 60);
  
  // Instructions
  textSize(12);
  fill(150);
  text(cleaned ? "Memory optimized ✓" : "Click to clean up duplicates", 20, height - 20);
  
  // Update and draw particles
  for (let p of particles) {
    if (cleaned && p.isDuplicate) {
      // Fade out duplicates
      p.alpha = max(0, p.alpha - 5);
      if (p.alpha <= 0) continue;
    }
    
    // Gentle floating motion
    p.x += cos(p.angle) * p.speed * 0.3;
    p.y += sin(p.angle) * p.speed * 0.3;
    p.angle += random(-0.1, 0.1);
    
    // Wrap around
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
    
    // Draw
    noStroke();
    let c = color(p.hue, 80, 90);
    c.setAlpha(p.alpha * 0.8);
    fill(c);
    ellipse(p.x, p.y, p.size);
    
    // Glow effect
    c.setAlpha(p.alpha * 0.2);
    fill(c);
    ellipse(p.x, p.y, p.size * 2);
  }
  
  // Animate count after cleanup
  if (cleaned && currentCount > cleanedCount) {
    currentCount -= 0.5;
  }
}

function mousePressed() {
  if (!cleaned) {
    cleaned = true;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
