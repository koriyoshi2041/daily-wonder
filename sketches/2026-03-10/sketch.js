/**
 * Sprawling DAG - Agent Collaboration Visualization
 * 
 * Inspired by Karpathy's AgentHub concept:
 * - Git commits forming a DAG
 * - Good paths branch more (more children)
 * - Bad paths die (no children)
 * - Click nodes to see lineage
 */

let nodes = [];
let rootNode;
let selectedNode = null;
let hoveredNode = null;

// Visual settings
const NODE_RADIUS = 12;
const SPAWN_INTERVAL = 60; // frames between spawns
const MAX_NODES = 150;
const BRANCH_PROBABILITY = 0.7;
const DEATH_PROBABILITY = 0.15;

// Colors
const ALIVE_COLOR = [46, 204, 113]; // Bright green
const DEAD_COLOR = [52, 73, 94]; // Dark gray-blue
const SELECTED_COLOR = [241, 196, 15]; // Gold
const LINEAGE_COLOR = [155, 89, 182]; // Purple
const EDGE_COLOR = [149, 165, 166, 100]; // Light gray with alpha

let frameCounter = 0;

class DAGNode {
  constructor(x, y, parent = null, generation = 0) {
    this.id = nodes.length;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.parent = parent;
    this.children = [];
    this.generation = generation;
    this.alive = true; // Can still spawn children
    this.birthFrame = frameCount;
    this.fitness = random(0.3, 1.0); // Higher = more likely to spawn
    
    if (parent) {
      parent.children.push(this);
    }
  }
  
  update() {
    // Smooth movement towards target
    this.x = lerp(this.x, this.targetX, 0.05);
    this.y = lerp(this.y, this.targetY, 0.05);
    
    // Nodes can "die" (stop spawning) based on probability
    if (this.alive && this.children.length === 0 && frameCount - this.birthFrame > 120) {
      if (random() < DEATH_PROBABILITY * (1 - this.fitness)) {
        this.alive = false;
      }
    }
  }
  
  draw() {
    let col;
    let r = NODE_RADIUS;
    
    // Determine color based on state
    if (this === selectedNode) {
      col = SELECTED_COLOR;
      r = NODE_RADIUS * 1.5;
    } else if (this.isInLineage(selectedNode)) {
      col = LINEAGE_COLOR;
      r = NODE_RADIUS * 1.2;
    } else if (this.children.length > 0 || this.alive) {
      // Interpolate color based on number of children
      let t = min(this.children.length / 5, 1);
      col = [
        lerp(ALIVE_COLOR[0], 52, 1 - t),
        lerp(ALIVE_COLOR[1], 152, 1 - t),
        lerp(ALIVE_COLOR[2], 219, 1 - t)
      ];
    } else {
      col = DEAD_COLOR;
    }
    
    // Hover effect
    if (this === hoveredNode) {
      r *= 1.3;
    }
    
    // Glow effect for alive nodes
    if (this.alive || this.children.length > 0) {
      noStroke();
      fill(col[0], col[1], col[2], 50);
      ellipse(this.x, this.y, r * 2.5);
    }
    
    // Main node
    noStroke();
    fill(col[0], col[1], col[2]);
    ellipse(this.x, this.y, r * 2);
    
    // Inner highlight
    fill(255, 255, 255, 80);
    ellipse(this.x - r * 0.2, this.y - r * 0.2, r * 0.8);
  }
  
  drawEdges() {
    if (this.parent) {
      let isLineage = this.isInLineage(selectedNode) && this.parent.isInLineage(selectedNode);
      
      if (isLineage) {
        stroke(LINEAGE_COLOR[0], LINEAGE_COLOR[1], LINEAGE_COLOR[2], 200);
        strokeWeight(3);
      } else {
        stroke(EDGE_COLOR[0], EDGE_COLOR[1], EDGE_COLOR[2], EDGE_COLOR[3]);
        strokeWeight(1.5);
      }
      
      // Curved edge using bezier
      noFill();
      let midX = (this.x + this.parent.x) / 2;
      let midY = (this.y + this.parent.y) / 2 - 20;
      bezier(
        this.parent.x, this.parent.y,
        midX, this.parent.y,
        midX, this.y,
        this.x, this.y
      );
    }
  }
  
  isInLineage(target) {
    if (!target) return false;
    if (this === target) return true;
    
    // Check if this is an ancestor of target
    let current = target;
    while (current) {
      if (current === this) return true;
      current = current.parent;
    }
    
    // Check if target is an ancestor of this
    current = this;
    while (current) {
      if (current === target) return true;
      current = current.parent;
    }
    
    return false;
  }
  
  getLineage() {
    let lineage = [];
    let current = this;
    while (current) {
      lineage.unshift(current);
      current = current.parent;
    }
    return lineage;
  }
  
  contains(px, py) {
    let d = dist(px, py, this.x, this.y);
    return d < NODE_RADIUS * 1.5;
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Create root node
  rootNode = new DAGNode(100, height / 2, null, 0);
  nodes.push(rootNode);
}

function draw() {
  background(24, 24, 32);
  
  // Draw title
  drawTitle();
  
  // Update hover state
  hoveredNode = null;
  for (let node of nodes) {
    if (node.contains(mouseX, mouseY)) {
      hoveredNode = node;
      break;
    }
  }
  
  // Spawn new nodes
  frameCounter++;
  if (frameCounter >= SPAWN_INTERVAL && nodes.length < MAX_NODES) {
    frameCounter = 0;
    spawnNewNode();
  }
  
  // Update and draw edges first
  for (let node of nodes) {
    node.update();
    node.drawEdges();
  }
  
  // Draw nodes on top
  for (let node of nodes) {
    node.draw();
  }
  
  // Draw info panel
  drawInfoPanel();
  
  // Draw cursor hint
  if (hoveredNode) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }
}

function spawnNewNode() {
  // Find alive nodes that can spawn
  let candidates = nodes.filter(n => n.alive && n.children.length < 4);
  
  if (candidates.length === 0) return;
  
  // Weight by fitness and recency
  let weights = candidates.map(n => n.fitness * (1 + n.children.length * 0.3));
  let totalWeight = weights.reduce((a, b) => a + b, 0);
  
  let r = random(totalWeight);
  let parent = candidates[0];
  let cumulative = 0;
  
  for (let i = 0; i < candidates.length; i++) {
    cumulative += weights[i];
    if (r <= cumulative) {
      parent = candidates[i];
      break;
    }
  }
  
  // Calculate position for new node
  let baseX = parent.x + 80 + random(40);
  let spread = 60 * (1 + parent.children.length * 0.5);
  let baseY = parent.y + random(-spread, spread);
  
  // Keep within bounds
  baseY = constrain(baseY, 60, height - 60);
  baseX = constrain(baseX, 0, width - 60);
  
  // Create new node
  let newNode = new DAGNode(parent.x, parent.y, parent, parent.generation + 1);
  newNode.targetX = baseX;
  newNode.targetY = baseY;
  newNode.fitness = parent.fitness * random(0.7, 1.3); // Inherit and vary fitness
  newNode.fitness = constrain(newNode.fitness, 0.1, 1.0);
  
  nodes.push(newNode);
  
  // Occasionally spawn multiple children (good path branching)
  if (random() < BRANCH_PROBABILITY * parent.fitness && nodes.length < MAX_NODES - 1) {
    let extraNode = new DAGNode(parent.x, parent.y, parent, parent.generation + 1);
    extraNode.targetX = baseX + random(-30, 30);
    extraNode.targetY = baseY + random(40, 80);
    extraNode.targetY = constrain(extraNode.targetY, 60, height - 60);
    extraNode.fitness = parent.fitness * random(0.6, 1.1);
    nodes.push(extraNode);
  }
}

function drawTitle() {
  fill(255, 255, 255, 200);
  noStroke();
  textSize(24);
  textAlign(LEFT, TOP);
  text("Sprawling DAG", 20, 20);
  
  textSize(14);
  fill(149, 165, 166);
  text("Agent Collaboration · Evolution of Ideas", 20, 50);
}

function drawInfoPanel() {
  let panelX = width - 280;
  let panelY = 20;
  
  // Panel background
  fill(30, 30, 40, 220);
  noStroke();
  rect(panelX, panelY, 260, selectedNode ? 200 : 120, 10);
  
  // Stats
  fill(255);
  textSize(14);
  textAlign(LEFT, TOP);
  
  let aliveCount = nodes.filter(n => n.alive || n.children.length > 0).length;
  let deadCount = nodes.length - aliveCount;
  
  text(`Total Nodes: ${nodes.length}`, panelX + 15, panelY + 15);
  
  fill(ALIVE_COLOR[0], ALIVE_COLOR[1], ALIVE_COLOR[2]);
  text(`Active: ${aliveCount}`, panelX + 15, panelY + 40);
  
  fill(DEAD_COLOR[0], DEAD_COLOR[1], DEAD_COLOR[2]);
  text(`Ended: ${deadCount}`, panelX + 130, panelY + 40);
  
  fill(149, 165, 166);
  textSize(12);
  text("Click a node to view lineage", panelX + 15, panelY + 70);
  text("Good paths branch, bad paths die", panelX + 15, panelY + 90);
  
  // Selected node info
  if (selectedNode) {
    fill(100, 100, 110);
    rect(panelX + 10, panelY + 115, 240, 1);
    
    fill(SELECTED_COLOR[0], SELECTED_COLOR[1], SELECTED_COLOR[2]);
    textSize(14);
    text(`Node #${selectedNode.id}`, panelX + 15, panelY + 125);
    
    fill(200);
    textSize(12);
    text(`Generation: ${selectedNode.generation}`, panelX + 15, panelY + 148);
    text(`Children: ${selectedNode.children.length}`, panelX + 130, panelY + 148);
    text(`Fitness: ${selectedNode.fitness.toFixed(2)}`, panelX + 15, panelY + 168);
    
    let status = selectedNode.alive ? "Active" : "Ended";
    let statusColor = selectedNode.alive ? ALIVE_COLOR : DEAD_COLOR;
    fill(statusColor[0], statusColor[1], statusColor[2]);
    text(`Status: ${status}`, panelX + 130, panelY + 168);
  }
}

function mousePressed() {
  if (hoveredNode) {
    selectedNode = hoveredNode;
  } else {
    selectedNode = null;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    // Reset
    nodes = [];
    rootNode = new DAGNode(100, height / 2, null, 0);
    nodes.push(rootNode);
    selectedNode = null;
  }
  
  if (key === ' ') {
    // Force spawn
    for (let i = 0; i < 5; i++) {
      spawnNewNode();
    }
  }
}
