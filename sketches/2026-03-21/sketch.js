// Memory Decay - 2026-03-21
// Visualizing how memories fade and important ones strengthen

let particles = [];
let mouseMemory = [];
const MAX_PARTICLES = 200;
const DECAY_RATE = 0.995;
const BOOST_RADIUS = 100;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  background(0);
  
  // Initial particles representing memories
  for (let i = 0; i < 50; i++) {
    particles.push(new Memory(random(width), random(height)));
  }
}

function draw() {
  // Fade background slowly (memory decay)
  background(0, 5);
  
  // Update and draw all particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    
    // Check if mouse is near (attention strengthens memory)
    let d = dist(mouseX, mouseY, p.x, p.y);
    if (d < BOOST_RADIUS) {
      p.strengthen(map(d, 0, BOOST_RADIUS, 1, 0));
    }
    
    p.update();
    p.display();
    
    // Remove fully decayed memories
    if (p.strength < 0.01) {
      particles.splice(i, 1);
    }
  }
  
  // Spawn new memories occasionally
  if (frameCount % 30 === 0 && particles.length < MAX_PARTICLES) {
    particles.push(new Memory(random(width), random(height)));
  }
  
  // Draw mouse trail (current attention)
  mouseMemory.push({x: mouseX, y: mouseY, age: 0});
  if (mouseMemory.length > 50) mouseMemory.shift();
  
  noFill();
  beginShape();
  for (let i = 0; i < mouseMemory.length; i++) {
    let m = mouseMemory[i];
    let alpha = map(i, 0, mouseMemory.length, 10, 60);
    stroke(200, 80, 100, alpha);
    vertex(m.x, m.y);
  }
  endShape();
  
  // Instructions
  fill(0, 0, 100, 50);
  noStroke();
  textSize(14);
  textAlign(LEFT, BOTTOM);
  text("Move mouse to strengthen nearby memories. Watch others fade.", 20, height - 20);
}

class Memory {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.strength = random(0.3, 1);
    this.baseHue = random(360);
    this.size = random(5, 20);
    this.vx = random(-0.5, 0.5);
    this.vy = random(-0.5, 0.5);
  }
  
  update() {
    // Natural decay
    this.strength *= DECAY_RATE;
    
    // Gentle drift
    this.x += this.vx;
    this.y += this.vy;
    
    // Wrap around
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
  }
  
  strengthen(amount) {
    this.strength = min(1, this.strength + amount * 0.02);
  }
  
  display() {
    let alpha = this.strength * 80;
    let size = this.size * this.strength;
    
    // Glow effect
    for (let i = 3; i > 0; i--) {
      fill(this.baseHue, 70, 100, alpha / (i * 2));
      noStroke();
      ellipse(this.x, this.y, size * i, size * i);
    }
    
    // Core
    fill(this.baseHue, 50, 100, alpha);
    ellipse(this.x, this.y, size * 0.5, size * 0.5);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  // Click to create a strong new memory
  let m = new Memory(mouseX, mouseY);
  m.strength = 1;
  m.size = 30;
  particles.push(m);
}
