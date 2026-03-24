// Network Emergence - 2026-03-24
// Visualizing how individual nodes form networks and emergent structures
// Inspired by the agent ecosystem explosion on GitHub

let nodes = [];
let connections = [];
let attractorPos;
let emergentClusters = [];
let globalEnergy = 0;
let time = 0;

const NUM_NODES = 120;
const CONNECTION_DISTANCE = 100;
const ATTRACTION_STRENGTH = 0.0008;
const REPULSION_STRENGTH = 0.5;
const DAMPING = 0.98;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  
  attractorPos = createVector(width / 2, height / 2);
  
  // Initialize nodes with different "types" (like different agent capabilities)
  for (let i = 0; i < NUM_NODES; i++) {
    nodes.push({
      pos: createVector(random(width), random(height)),
      vel: createVector(random(-1, 1), random(-1, 1)),
      type: floor(random(5)), // 5 different node types
      size: random(4, 12),
      connectionCount: 0,
      energy: random(0.5, 1),
      id: i
    });
  }
}

function draw() {
  // Dark background with slight fade for trails
  background(240, 30, 8, 95);
  
  time += 0.01;
  attractorPos.set(mouseX || width/2, mouseY || height/2);
  
  // Update physics
  updateNodes();
  
  // Find and draw connections
  findConnections();
  drawConnections();
  
  // Draw emergent structure indicators
  drawEmergentPatterns();
  
  // Draw nodes
  drawNodes();
  
  // Draw attractor influence
  drawAttractor();
  
  // UI
  drawUI();
}

function updateNodes() {
  globalEnergy = 0;
  
  for (let node of nodes) {
    // Attraction to mouse
    let toMouse = p5.Vector.sub(attractorPos, node.pos);
    let distToMouse = toMouse.mag();
    
    if (distToMouse > 50) {
      toMouse.normalize();
      toMouse.mult(ATTRACTION_STRENGTH * node.energy * (distToMouse * 0.01));
      node.vel.add(toMouse);
    }
    
    // Repulsion from other nodes (prevents overlap)
    for (let other of nodes) {
      if (other.id === node.id) continue;
      
      let diff = p5.Vector.sub(node.pos, other.pos);
      let dist = diff.mag();
      
      if (dist < 30 && dist > 0) {
        diff.normalize();
        diff.mult(REPULSION_STRENGTH / (dist * 0.5));
        node.vel.add(diff);
      }
    }
    
    // Slight random movement
    node.vel.add(createVector(random(-0.1, 0.1), random(-0.1, 0.1)));
    
    // Apply velocity with damping
    node.vel.mult(DAMPING);
    node.pos.add(node.vel);
    
    // Wrap around edges with soft boundary
    let margin = 50;
    if (node.pos.x < margin) node.vel.x += 0.5;
    if (node.pos.x > width - margin) node.vel.x -= 0.5;
    if (node.pos.y < margin) node.vel.y += 0.5;
    if (node.pos.y > height - margin) node.vel.y -= 0.5;
    
    // Keep in bounds
    node.pos.x = constrain(node.pos.x, 0, width);
    node.pos.y = constrain(node.pos.y, 0, height);
    
    // Track global energy
    globalEnergy += node.vel.mag();
  }
}

function findConnections() {
  connections = [];
  
  // Reset connection counts
  for (let node of nodes) {
    node.connectionCount = 0;
  }
  
  // Find connections based on distance and type affinity
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      let dist = p5.Vector.dist(nodes[i].pos, nodes[j].pos);
      
      // Same type nodes connect at greater distances
      let typeAffinity = nodes[i].type === nodes[j].type ? 1.5 : 1.0;
      let maxDist = CONNECTION_DISTANCE * typeAffinity;
      
      if (dist < maxDist) {
        let strength = map(dist, 0, maxDist, 1, 0);
        connections.push({
          a: nodes[i],
          b: nodes[j],
          strength: strength,
          sameType: nodes[i].type === nodes[j].type
        });
        nodes[i].connectionCount++;
        nodes[j].connectionCount++;
      }
    }
  }
}

function drawConnections() {
  for (let conn of connections) {
    let alpha = conn.strength * 60;
    
    // Color based on whether same type (stronger bonds)
    if (conn.sameType) {
      let hue = (conn.a.type * 72 + 180) % 360;
      stroke(hue, 60, 80, alpha);
    } else {
      stroke(200, 20, 60, alpha * 0.5);
    }
    
    strokeWeight(conn.strength * 2);
    line(conn.a.pos.x, conn.a.pos.y, conn.b.pos.x, conn.b.pos.y);
  }
}

function drawNodes() {
  for (let node of nodes) {
    let hue = (node.type * 72 + 180) % 360; // Spread across color wheel
    let sat = 70;
    let bri = 80 + node.connectionCount * 2;
    
    // Glow effect for highly connected nodes
    if (node.connectionCount > 5) {
      let glowSize = node.size + node.connectionCount * 1.5;
      noStroke();
      for (let g = glowSize; g > node.size; g -= 2) {
        let glowAlpha = map(g, node.size, glowSize, 30, 0);
        fill(hue, sat * 0.5, bri, glowAlpha);
        ellipse(node.pos.x, node.pos.y, g * 2);
      }
    }
    
    // Node core
    noStroke();
    fill(hue, sat, bri, 90);
    ellipse(node.pos.x, node.pos.y, node.size * 2);
    
    // Inner highlight
    fill(hue, sat * 0.3, 100, 50);
    ellipse(node.pos.x - node.size * 0.2, node.pos.y - node.size * 0.2, node.size * 0.8);
  }
}

function drawEmergentPatterns() {
  // Find clusters (groups of highly connected nodes)
  let hubs = nodes.filter(n => n.connectionCount > 6);
  
  // Draw emergent cluster halos
  for (let hub of hubs) {
    let hue = (hub.type * 72 + 180) % 360;
    noFill();
    stroke(hue, 40, 60, 15);
    strokeWeight(1);
    
    // Pulsing ring
    let pulse = sin(time * 3 + hub.id) * 10 + 30;
    ellipse(hub.pos.x, hub.pos.y, hub.connectionCount * 15 + pulse);
  }
  
  // Draw network "spine" - connections between hubs
  if (hubs.length > 1) {
    stroke(50, 30, 90, 20);
    strokeWeight(3);
    for (let i = 0; i < hubs.length - 1; i++) {
      for (let j = i + 1; j < hubs.length; j++) {
        let dist = p5.Vector.dist(hubs[i].pos, hubs[j].pos);
        if (dist < CONNECTION_DISTANCE * 2.5) {
          // Curved connection between hubs
          let midX = (hubs[i].pos.x + hubs[j].pos.x) / 2;
          let midY = (hubs[i].pos.y + hubs[j].pos.y) / 2;
          let offset = sin(time * 2) * 20;
          
          noFill();
          beginShape();
          curveVertex(hubs[i].pos.x, hubs[i].pos.y);
          curveVertex(hubs[i].pos.x, hubs[i].pos.y);
          curveVertex(midX + offset, midY - offset);
          curveVertex(hubs[j].pos.x, hubs[j].pos.y);
          curveVertex(hubs[j].pos.x, hubs[j].pos.y);
          endShape();
        }
      }
    }
  }
}

function drawAttractor() {
  // Soft gradient influence indicator
  let maxDist = 200;
  noStroke();
  for (let r = maxDist; r > 0; r -= 10) {
    let alpha = map(r, 0, maxDist, 8, 0);
    fill(200, 50, 70, alpha);
    ellipse(attractorPos.x, attractorPos.y, r * 2);
  }
  
  // Center point
  fill(200, 60, 90, 40);
  ellipse(attractorPos.x, attractorPos.y, 8);
}

function drawUI() {
  // Title
  fill(200, 20, 90, 70);
  noStroke();
  textSize(20);
  textAlign(LEFT, TOP);
  textFont('Georgia');
  text("Network Emergence", 30, 30);
  
  // Stats
  fill(200, 15, 70, 50);
  textSize(13);
  let hubCount = nodes.filter(n => n.connectionCount > 6).length;
  text(`Nodes: ${nodes.length}`, 30, 60);
  text(`Connections: ${connections.length}`, 30, 80);
  text(`Hub nodes: ${hubCount}`, 30, 100);
  text(`Network energy: ${globalEnergy.toFixed(1)}`, 30, 120);
  
  // Connection density indicator
  let density = connections.length / (nodes.length * (nodes.length - 1) / 2);
  let densityWidth = 100;
  fill(200, 10, 30, 50);
  rect(30, 145, densityWidth, 8, 4);
  fill(200, 60, 80, 70);
  rect(30, 145, densityWidth * density * 10, 8, 4);
  fill(200, 15, 70, 50);
  text("Density", 140, 143);
  
  // Instructions
  fill(200, 15, 60, 40);
  textSize(12);
  textAlign(LEFT, BOTTOM);
  text("Move mouse to attract nodes • Click to add energy burst • Press R to reset", 30, height - 20);
  
  // Concept note
  fill(200, 20, 80, 30);
  textSize(11);
  textAlign(RIGHT, BOTTOM);
  text("\"The whole emerges from the interactions of the parts\"", width - 30, height - 20);
}

function mousePressed() {
  // Energy burst - push nearby nodes away
  for (let node of nodes) {
    let dist = p5.Vector.dist(createVector(mouseX, mouseY), node.pos);
    if (dist < 150) {
      let force = p5.Vector.sub(node.pos, createVector(mouseX, mouseY));
      force.normalize();
      force.mult(map(dist, 0, 150, 8, 1));
      node.vel.add(force);
      node.energy = min(2, node.energy + 0.3);
    }
  }
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    // Reset positions
    for (let node of nodes) {
      node.pos = createVector(random(width), random(height));
      node.vel = createVector(random(-1, 1), random(-1, 1));
      node.energy = random(0.5, 1);
    }
  }
  
  if (key === ' ') {
    // Add new nodes
    for (let i = 0; i < 10; i++) {
      nodes.push({
        pos: createVector(mouseX + random(-50, 50), mouseY + random(-50, 50)),
        vel: createVector(random(-2, 2), random(-2, 2)),
        type: floor(random(5)),
        size: random(4, 12),
        connectionCount: 0,
        energy: 1.5,
        id: nodes.length
      });
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
