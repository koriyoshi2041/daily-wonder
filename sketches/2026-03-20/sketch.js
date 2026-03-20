/**
 * Trust Network — Daily Wonder Sketch 2026-03-20
 * 
 * 灵感来源：今日 Moltbook 讨论 A2A 和 Trust Layer
 * "A2A solved discovery and auth. The harder thing is what happens after hello."
 * 
 * 可视化 agent 网络中的信任关系：
 * - 节点 = agents
 * - 连线 = trust connections
 * - 连线粗细 = trust strength
 * - 脉冲 = active transactions
 */

// ═══════════════════════════════════════════════════════════════════════════
// 配置参数
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  nodes: {
    count: 25,
    minSize: 15,
    maxSize: 40,
    repulsion: 100,
    attraction: 0.01,
  },
  connections: {
    maxDistance: 200,
    minTrust: 0.1,
    maxTrust: 1.0,
    pulseSpeed: 3,
  },
  visual: {
    bgColor: [15, 15, 20],
    nodeColor: [80, 180, 255],
    trustColor: [100, 255, 180],
    pulseColor: [255, 200, 100],
  }
};

let agents = [];
let pulses = [];
let selectedAgent = null;

// ═══════════════════════════════════════════════════════════════════════════
// Agent 类
// ═══════════════════════════════════════════════════════════════════════════

class Agent {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.size = random(CONFIG.nodes.minSize, CONFIG.nodes.maxSize);
    this.trustScores = new Map(); // agent -> trust score
    this.name = this.generateName();
    this.verified = random() > 0.3;
    this.reputation = random(0.2, 1.0);
  }
  
  generateName() {
    const prefixes = ['Claw', 'Molt', 'Open', 'Neo', 'Auto', 'Meta'];
    const suffixes = ['Bot', 'Agent', 'AI', 'Mind', 'Core', 'X'];
    return random(prefixes) + random(suffixes);
  }
  
  update() {
    // 与其他 agents 的力学交互
    for (let other of agents) {
      if (other === this) continue;
      
      let dx = other.x - this.x;
      let dy = other.y - this.y;
      let dist = sqrt(dx * dx + dy * dy);
      
      if (dist < 1) dist = 1;
      
      // 排斥力（太近时）
      if (dist < CONFIG.nodes.repulsion) {
        let force = (CONFIG.nodes.repulsion - dist) / CONFIG.nodes.repulsion;
        this.vx -= (dx / dist) * force * 0.5;
        this.vy -= (dy / dist) * force * 0.5;
      }
      
      // 吸引力（有信任关系时）
      let trust = this.trustScores.get(other) || 0;
      if (trust > 0 && dist > 50) {
        this.vx += dx * CONFIG.nodes.attraction * trust;
        this.vy += dy * CONFIG.nodes.attraction * trust;
      }
    }
    
    // 边界约束
    if (this.x < 50) this.vx += 0.5;
    if (this.x > width - 50) this.vx -= 0.5;
    if (this.y < 50) this.vy += 0.5;
    if (this.y > height - 50) this.vy -= 0.5;
    
    // 阻尼
    this.vx *= 0.95;
    this.vy *= 0.95;
    
    this.x += this.vx;
    this.y += this.vy;
  }
  
  draw() {
    push();
    translate(this.x, this.y);
    
    // 光晕效果
    noStroke();
    for (let i = 3; i > 0; i--) {
      fill(CONFIG.visual.nodeColor[0], CONFIG.visual.nodeColor[1], CONFIG.visual.nodeColor[2], 20 * i);
      ellipse(0, 0, this.size + i * 10);
    }
    
    // 核心
    let col = this.verified ? CONFIG.visual.trustColor : CONFIG.visual.nodeColor;
    fill(col[0], col[1], col[2], 200);
    ellipse(0, 0, this.size);
    
    // 信誉环
    noFill();
    stroke(col[0], col[1], col[2], 150);
    strokeWeight(2);
    arc(0, 0, this.size + 8, this.size + 8, 0, TWO_PI * this.reputation);
    
    // 名称（鼠标悬停时显示）
    let d = dist(mouseX, mouseY, this.x, this.y);
    if (d < this.size) {
      fill(255);
      noStroke();
      textAlign(CENTER, BOTTOM);
      textSize(12);
      text(this.name, 0, -this.size / 2 - 5);
      text(`Rep: ${(this.reputation * 100).toFixed(0)}%`, 0, -this.size / 2 - 20);
    }
    
    pop();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Pulse 类 - 信任脉冲
// ═══════════════════════════════════════════════════════════════════════════

class Pulse {
  constructor(from, to) {
    this.from = from;
    this.to = to;
    this.progress = 0;
    this.speed = CONFIG.connections.pulseSpeed / 100;
    this.size = 8;
    this.alive = true;
  }
  
  update() {
    this.progress += this.speed;
    if (this.progress >= 1) {
      this.alive = false;
      // 成功到达，增加信任
      let currentTrust = this.from.trustScores.get(this.to) || 0.1;
      this.from.trustScores.set(this.to, min(currentTrust + 0.05, CONFIG.connections.maxTrust));
    }
  }
  
  draw() {
    let x = lerp(this.from.x, this.to.x, this.progress);
    let y = lerp(this.from.y, this.to.y, this.progress);
    
    noStroke();
    fill(CONFIG.visual.pulseColor[0], CONFIG.visual.pulseColor[1], CONFIG.visual.pulseColor[2], 200);
    ellipse(x, y, this.size);
    
    // 拖尾
    for (let i = 1; i <= 5; i++) {
      let p = this.progress - i * 0.02;
      if (p > 0) {
        let tx = lerp(this.from.x, this.to.x, p);
        let ty = lerp(this.from.y, this.to.y, p);
        fill(CONFIG.visual.pulseColor[0], CONFIG.visual.pulseColor[1], CONFIG.visual.pulseColor[2], 100 - i * 20);
        ellipse(tx, ty, this.size - i);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// p5.js 主函数
// ═══════════════════════════════════════════════════════════════════════════

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 创建 agents
  for (let i = 0; i < CONFIG.nodes.count; i++) {
    agents.push(new Agent(
      random(100, width - 100),
      random(100, height - 100)
    ));
  }
  
  // 初始化一些信任关系
  for (let agent of agents) {
    let connectionCount = floor(random(2, 5));
    for (let i = 0; i < connectionCount; i++) {
      let other = random(agents);
      if (other !== agent) {
        agent.trustScores.set(other, random(CONFIG.connections.minTrust, 0.5));
      }
    }
  }
}

function draw() {
  background(CONFIG.visual.bgColor);
  
  // 绘制信任连线
  for (let agent of agents) {
    for (let [other, trust] of agent.trustScores) {
      let d = dist(agent.x, agent.y, other.x, other.y);
      if (d < CONFIG.connections.maxDistance && trust > 0.1) {
        stroke(CONFIG.visual.trustColor[0], CONFIG.visual.trustColor[1], CONFIG.visual.trustColor[2], trust * 100);
        strokeWeight(trust * 3);
        line(agent.x, agent.y, other.x, other.y);
      }
    }
  }
  
  // 更新和绘制 agents
  for (let agent of agents) {
    agent.update();
    agent.draw();
  }
  
  // 更新和绘制脉冲
  for (let i = pulses.length - 1; i >= 0; i--) {
    pulses[i].update();
    pulses[i].draw();
    if (!pulses[i].alive) {
      pulses.splice(i, 1);
    }
  }
  
  // 随机产生新脉冲
  if (frameCount % 30 === 0) {
    let from = random(agents);
    let connections = Array.from(from.trustScores.keys());
    if (connections.length > 0) {
      let to = random(connections);
      pulses.push(new Pulse(from, to));
    }
  }
  
  // 绘制说明
  drawLegend();
}

function drawLegend() {
  push();
  fill(255, 200);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  
  let y = 20;
  text("TRUST NETWORK", 20, y);
  
  textSize(11);
  fill(200);
  y += 25;
  text("点击节点发送信任脉冲", 20, y);
  y += 18;
  text("绿色 = 已验证 | 蓝色 = 未验证", 20, y);
  y += 18;
  text("连线粗细 = 信任强度", 20, y);
  y += 18;
  text("黄色脉冲 = 活跃交易", 20, y);
  
  // 统计
  y += 30;
  fill(255);
  text(`Agents: ${agents.length}`, 20, y);
  y += 18;
  text(`Active Pulses: ${pulses.length}`, 20, y);
  
  pop();
}

function mousePressed() {
  // 点击 agent 发送脉冲
  for (let agent of agents) {
    let d = dist(mouseX, mouseY, agent.x, agent.y);
    if (d < agent.size) {
      // 向所有信任的 agents 发送脉冲
      for (let [other, trust] of agent.trustScores) {
        if (trust > 0.2) {
          pulses.push(new Pulse(agent, other));
        }
      }
      break;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
