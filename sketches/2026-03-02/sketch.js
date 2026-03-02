// Daily Wonder: Agent Payment Flow
// 2026-03-02 - Visualizing the flow of value between agents

let agents = [];
let transactions = [];
let time = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  
  // Create agent nodes
  for (let i = 0; i < 12; i++) {
    agents.push({
      x: random(100, width - 100),
      y: random(100, height - 100),
      vx: random(-0.5, 0.5),
      vy: random(-0.5, 0.5),
      size: random(20, 40),
      hue: random(180, 280), // Blue to purple range
      balance: random(100, 1000),
      name: `Agent ${i + 1}`
    });
  }
}

function draw() {
  background(220, 10, 8, 30); // Dark blue-gray with trail
  time += 0.01;
  
  // Update and draw connections
  stroke(200, 30, 50, 20);
  strokeWeight(1);
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      let d = dist(agents[i].x, agents[i].y, agents[j].x, agents[j].y);
      if (d < 200) {
        line(agents[i].x, agents[i].y, agents[j].x, agents[j].y);
      }
    }
  }
  
  // Update and draw agents
  for (let agent of agents) {
    // Gentle floating movement
    agent.x += agent.vx + sin(time + agent.hue) * 0.3;
    agent.y += agent.vy + cos(time + agent.hue) * 0.3;
    
    // Bounce off edges
    if (agent.x < 50 || agent.x > width - 50) agent.vx *= -1;
    if (agent.y < 50 || agent.y > height - 50) agent.vy *= -1;
    
    // Draw glow
    noStroke();
    for (let r = agent.size * 2; r > 0; r -= 5) {
      fill(agent.hue, 60, 70, map(r, 0, agent.size * 2, 30, 0));
      ellipse(agent.x, agent.y, r);
    }
    
    // Draw core
    fill(agent.hue, 50, 90);
    ellipse(agent.x, agent.y, agent.size);
    
    // Draw balance indicator
    fill(120, 60, 80);
    let balanceWidth = map(agent.balance, 0, 1000, 0, agent.size);
    rect(agent.x - agent.size/2, agent.y + agent.size/2 + 5, balanceWidth, 4, 2);
  }
  
  // Draw transactions
  for (let i = transactions.length - 1; i >= 0; i--) {
    let t = transactions[i];
    t.progress += 0.02;
    
    let x = lerp(t.from.x, t.to.x, t.progress);
    let y = lerp(t.from.y, t.to.y, t.progress);
    
    // Transaction particle
    fill(60, 80, 100, map(t.progress, 0, 1, 100, 0)); // Yellow/gold
    noStroke();
    ellipse(x, y, 10);
    
    // Trail
    stroke(60, 80, 100, 20);
    strokeWeight(2);
    line(t.from.x, t.from.y, x, y);
    
    if (t.progress >= 1) {
      t.to.balance += t.amount;
      t.from.balance -= t.amount;
      transactions.splice(i, 1);
    }
  }
  
  // Randomly create transactions
  if (frameCount % 60 === 0 && transactions.length < 5) {
    let from = random(agents);
    let to = random(agents);
    if (from !== to && from.balance > 50) {
      let amount = random(10, 50);
      transactions.push({
        from: from,
        to: to,
        amount: amount,
        progress: 0
      });
    }
  }
  
  // Title
  fill(0, 0, 100);
  noStroke();
  textSize(16);
  textAlign(LEFT, TOP);
  text("Agent Payment Flow", 20, 20);
  textSize(12);
  fill(0, 0, 70);
  text("Click to trigger a transaction • Move mouse to attract agents", 20, 45);
  text(`Active transactions: ${transactions.length}`, 20, 65);
}

function mousePressed() {
  // Find closest agent to mouse
  let closest = null;
  let minDist = Infinity;
  for (let agent of agents) {
    let d = dist(mouseX, mouseY, agent.x, agent.y);
    if (d < minDist) {
      minDist = d;
      closest = agent;
    }
  }
  
  // Create transaction from closest to random other
  if (closest && closest.balance > 50) {
    let to = random(agents.filter(a => a !== closest));
    transactions.push({
      from: closest,
      to: to,
      amount: random(20, 100),
      progress: 0
    });
  }
}

function mouseMoved() {
  // Attract agents slightly toward mouse
  for (let agent of agents) {
    let d = dist(mouseX, mouseY, agent.x, agent.y);
    if (d < 200) {
      let force = map(d, 0, 200, 0.5, 0);
      agent.vx += (mouseX - agent.x) * force * 0.001;
      agent.vy += (mouseY - agent.y) * force * 0.001;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
