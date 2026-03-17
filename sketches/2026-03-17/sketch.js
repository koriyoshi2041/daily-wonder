/**
 * Consensus — Daily Wonder Sketch 2026-03-17
 * 
 * 灵感来源：分布式系统与 Agent 协调
 * 可视化节点如何通过消息传递达成共识
 * 
 * 在去中心化的世界里，没有权威裁判，只有持续的对话。
 * 共识不是瞬间发生的——它是波纹一般在网络中扩散，
 * 直到所有节点最终同步。
 */

// ═══════════════════════════════════════════════════════════════════════════
// 可调参数
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // 网络
  nodeCount: 25,               // 节点数量
  connectionDistance: 180,     // 连接距离阈值
  
  // 共识系统
  stateCount: 5,               // 可能的状态数量（不同颜色）
  consensusThreshold: 0.7,     // 共识阈值（邻居中相同状态比例）
  stateChangeDelay: 60,        // 状态改变后的冷却帧数
  
  // 消息传递
  messageSpeed: 4,             // 消息传播速度
  messageInterval: 30,         // 发送消息的间隔（帧）
  
  // 物理
  nodeSpeed: 0.5,              // 节点漂移速度
  repulsionRadius: 50,         // 排斥半径
  repulsionStrength: 0.3,      // 排斥力度
  attractionStrength: 0.02,    // 吸引到中心的力度
  
  // 视觉
  backgroundColor: [220, 15, 6],   // HSB
  nodeRadius: 12,
  glowLayers: 4,
  connectionOpacity: 0.3,
  
  // 状态颜色（HSB 色相）
  stateHues: [0, 60, 120, 200, 280],  // 红、黄、绿、蓝、紫
};

// ═══════════════════════════════════════════════════════════════════════════
// 消息类 - 在节点间传递的信息
// ═══════════════════════════════════════════════════════════════════════════

class Message {
  constructor(from, to, state) {
    this.from = from;
    this.to = to;
    this.state = state;
    this.progress = 0;  // 0 到 1
    this.alive = true;
  }
  
  update() {
    this.progress += CONFIG.messageSpeed / dist(
      this.from.pos.x, this.from.pos.y,
      this.to.pos.x, this.to.pos.y
    );
    
    if (this.progress >= 1) {
      this.progress = 1;
      this.alive = false;
      // 消息到达，通知目标节点
      this.to.receiveMessage(this.state);
    }
  }
  
  draw() {
    const x = lerp(this.from.pos.x, this.to.pos.x, this.progress);
    const y = lerp(this.from.pos.y, this.to.pos.y, this.progress);
    
    const hue = CONFIG.stateHues[this.state];
    
    // 消息光点
    noStroke();
    for (let i = 3; i >= 0; i--) {
      const size = 4 + i * 3;
      const alpha = (100 - i * 25) * (1 - this.progress * 0.5);
      fill(hue, 80, 100, alpha);
      ellipse(x, y, size, size);
    }
    
    // 拖尾
    const tailLength = 0.15;
    const tailStart = max(0, this.progress - tailLength);
    stroke(hue, 70, 90, 50);
    strokeWeight(2);
    line(
      lerp(this.from.pos.x, this.to.pos.x, tailStart),
      lerp(this.from.pos.y, this.to.pos.y, tailStart),
      x, y
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 节点类 - 网络中的参与者
// ═══════════════════════════════════════════════════════════════════════════

class Node {
  constructor(x, y, id) {
    this.id = id;
    this.pos = createVector(x, y);
    this.vel = createVector(random(-1, 1), random(-1, 1)).mult(0.5);
    
    // 共识状态
    this.state = floor(random(CONFIG.stateCount));
    this.receivedStates = [];  // 收到的状态消息
    this.cooldown = 0;         // 状态改变冷却
    this.neighbors = [];       // 邻居节点
    
    // 视觉状态
    this.pulsePhase = random(TWO_PI);
    this.consensusGlow = 0;    // 达成共识时的额外发光
    this.lastStateChange = 0;  // 上次状态改变的帧
    
    // 消息计时
    this.messageTimer = floor(random(CONFIG.messageInterval));
  }
  
  updateNeighbors(nodes) {
    this.neighbors = [];
    for (const other of nodes) {
      if (other === this) continue;
      const d = p5.Vector.dist(this.pos, other.pos);
      if (d < CONFIG.connectionDistance) {
        this.neighbors.push(other);
      }
    }
  }
  
  receiveMessage(state) {
    this.receivedStates.push(state);
  }
  
  processConsensus() {
    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }
    
    if (this.receivedStates.length === 0) return;
    
    // 统计收到的状态
    const stateCounts = {};
    for (const s of this.receivedStates) {
      stateCounts[s] = (stateCounts[s] || 0) + 1;
    }
    
    // 加上自己的状态
    stateCounts[this.state] = (stateCounts[this.state] || 0) + 1;
    
    // 找出最多的状态
    let maxCount = 0;
    let dominantState = this.state;
    for (const [state, count] of Object.entries(stateCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantState = parseInt(state);
      }
    }
    
    // 计算共识程度
    const total = this.receivedStates.length + 1;
    const consensusRatio = maxCount / total;
    
    // 如果超过阈值且不是当前状态，切换
    if (consensusRatio >= CONFIG.consensusThreshold && dominantState !== this.state) {
      this.state = dominantState;
      this.cooldown = CONFIG.stateChangeDelay;
      this.consensusGlow = 1;
      this.lastStateChange = frameCount;
    }
    
    // 清空接收的状态
    this.receivedStates = [];
  }
  
  shouldSendMessage() {
    this.messageTimer--;
    if (this.messageTimer <= 0) {
      this.messageTimer = CONFIG.messageInterval + floor(random(-10, 10));
      return true;
    }
    return false;
  }
  
  update(nodes) {
    // 衰减共识发光
    this.consensusGlow *= 0.95;
    
    // 脉动
    this.pulsePhase += 0.03;
    
    // 漂移运动
    const wanderAngle = noise(this.pos.x * 0.01, this.pos.y * 0.01, frameCount * 0.005) * TWO_PI * 2;
    const wanderForce = p5.Vector.fromAngle(wanderAngle).mult(CONFIG.nodeSpeed * 0.3);
    this.vel.add(wanderForce);
    
    // 排斥力
    for (const other of nodes) {
      if (other === this) continue;
      const d = p5.Vector.dist(this.pos, other.pos);
      if (d < CONFIG.repulsionRadius && d > 0) {
        const repulsion = p5.Vector.sub(this.pos, other.pos);
        repulsion.normalize();
        repulsion.mult(CONFIG.repulsionStrength * (1 - d / CONFIG.repulsionRadius));
        this.vel.add(repulsion);
      }
    }
    
    // 轻微吸引到中心
    const center = createVector(width / 2, height / 2);
    const toCenter = p5.Vector.sub(center, this.pos);
    toCenter.mult(CONFIG.attractionStrength);
    this.vel.add(toCenter);
    
    // 边界软反弹
    const margin = 80;
    if (this.pos.x < margin) this.vel.x += 0.2;
    if (this.pos.x > width - margin) this.vel.x -= 0.2;
    if (this.pos.y < margin) this.vel.y += 0.2;
    if (this.pos.y > height - margin) this.vel.y -= 0.2;
    
    // 应用速度
    this.vel.limit(CONFIG.nodeSpeed * 2);
    this.vel.mult(0.98);  // 阻尼
    this.pos.add(this.vel);
  }
  
  draw() {
    const hue = CONFIG.stateHues[this.state];
    const pulse = 1 + sin(this.pulsePhase) * 0.15;
    const glowBoost = 1 + this.consensusGlow * 2;
    
    // 外发光
    noStroke();
    for (let i = CONFIG.glowLayers; i >= 0; i--) {
      const layerRatio = i / CONFIG.glowLayers;
      const size = CONFIG.nodeRadius * (1 + layerRatio * 2) * pulse * glowBoost;
      const alpha = (1 - layerRatio) * 100;
      
      fill(hue, 70 - layerRatio * 30, 80, alpha);
      ellipse(this.pos.x, this.pos.y, size * 2, size * 2);
    }
    
    // 核心
    fill(hue, 50, 100);
    ellipse(this.pos.x, this.pos.y, CONFIG.nodeRadius * pulse, CONFIG.nodeRadius * pulse);
    
    // 内核高亮
    fill(hue, 20, 100, 200);
    ellipse(this.pos.x - 2, this.pos.y - 2, CONFIG.nodeRadius * 0.4 * pulse, CONFIG.nodeRadius * 0.4 * pulse);
    
    // 节点 ID（调试用，可注释掉）
    // fill(0, 0, 100, 150);
    // textSize(8);
    // textAlign(CENTER, CENTER);
    // text(this.id, this.pos.x, this.pos.y);
  }
  
  drawConnections() {
    for (const neighbor of this.neighbors) {
      // 只绘制 id 较小的到 id 较大的，避免重复
      if (neighbor.id < this.id) continue;
      
      const d = p5.Vector.dist(this.pos, neighbor.pos);
      const opacity = map(d, 0, CONFIG.connectionDistance, CONFIG.connectionOpacity, 0);
      
      // 如果状态相同，连接更亮
      const sameState = this.state === neighbor.state;
      const hue = sameState ? CONFIG.stateHues[this.state] : 220;
      const brightness = sameState ? 60 : 30;
      
      stroke(hue, 40, brightness, opacity * 255);
      strokeWeight(sameState ? 2 : 1);
      line(this.pos.x, this.pos.y, neighbor.pos.x, neighbor.pos.y);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 全局状态
// ═══════════════════════════════════════════════════════════════════════════

let nodes = [];
let messages = [];
let consensusHistory = [];  // 跟踪共识度变化

// ═══════════════════════════════════════════════════════════════════════════
// p5.js 生命周期
// ═══════════════════════════════════════════════════════════════════════════

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 255);
  
  // 初始化节点（排列成网格后添加随机扰动）
  const cols = ceil(sqrt(CONFIG.nodeCount * width / height));
  const rows = ceil(CONFIG.nodeCount / cols);
  const spacingX = (width - 200) / cols;
  const spacingY = (height - 200) / rows;
  
  for (let i = 0; i < CONFIG.nodeCount; i++) {
    const col = i % cols;
    const row = floor(i / cols);
    const x = 100 + col * spacingX + spacingX / 2 + random(-30, 30);
    const y = 100 + row * spacingY + spacingY / 2 + random(-30, 30);
    nodes.push(new Node(x, y, i));
  }
}

function draw() {
  // 背景
  background(CONFIG.backgroundColor[0], CONFIG.backgroundColor[1], CONFIG.backgroundColor[2]);
  
  // 更新邻居关系
  for (const node of nodes) {
    node.updateNeighbors(nodes);
  }
  
  // 绘制连接
  for (const node of nodes) {
    node.drawConnections();
  }
  
  // 更新消息
  for (const msg of messages) {
    msg.update();
  }
  messages = messages.filter(m => m.alive);
  
  // 绘制消息
  for (const msg of messages) {
    msg.draw();
  }
  
  // 节点发送消息
  for (const node of nodes) {
    if (node.shouldSendMessage() && node.neighbors.length > 0) {
      // 向随机邻居发送状态消息
      const target = random(node.neighbors);
      messages.push(new Message(node, target, node.state));
    }
  }
  
  // 处理共识
  for (const node of nodes) {
    node.processConsensus();
  }
  
  // 更新节点
  for (const node of nodes) {
    node.update(nodes);
  }
  
  // 绘制节点
  for (const node of nodes) {
    node.draw();
  }
  
  // 绘制统计信息
  drawStats();
  
  // 鼠标交互提示
  drawInteractionHint();
}

function drawStats() {
  // 计算各状态的节点数
  const stateCounts = new Array(CONFIG.stateCount).fill(0);
  for (const node of nodes) {
    stateCounts[node.state]++;
  }
  
  // 计算共识度（最大状态占比）
  const maxCount = max(...stateCounts);
  const consensusRatio = maxCount / nodes.length;
  
  // 记录历史
  if (frameCount % 5 === 0) {
    consensusHistory.push(consensusRatio);
    if (consensusHistory.length > 100) consensusHistory.shift();
  }
  
  // 绘制状态分布条
  const barX = 20;
  const barY = 20;
  const barWidth = 150;
  const barHeight = 12;
  
  noStroke();
  let xOffset = barX;
  for (let i = 0; i < CONFIG.stateCount; i++) {
    const w = (stateCounts[i] / nodes.length) * barWidth;
    fill(CONFIG.stateHues[i], 70, 80);
    rect(xOffset, barY, w, barHeight, i === 0 ? 3 : 0, i === CONFIG.stateCount - 1 ? 3 : 0, i === CONFIG.stateCount - 1 ? 3 : 0, i === 0 ? 3 : 0);
    xOffset += w;
  }
  
  // 边框
  noFill();
  stroke(220, 20, 50);
  strokeWeight(1);
  rect(barX, barY, barWidth, barHeight, 3);
  
  // 文字信息
  fill(220, 20, 70);
  noStroke();
  textSize(11);
  textAlign(LEFT, TOP);
  text(`Consensus: ${(consensusRatio * 100).toFixed(1)}%`, barX, barY + barHeight + 8);
  text(`Nodes: ${nodes.length} | Messages: ${messages.length}`, barX, barY + barHeight + 24);
  
  // 绘制共识度历史曲线
  if (consensusHistory.length > 1) {
    const graphX = barX;
    const graphY = barY + 55;
    const graphW = barWidth;
    const graphH = 30;
    
    // 背景
    fill(220, 10, 10, 100);
    noStroke();
    rect(graphX, graphY, graphW, graphH, 3);
    
    // 曲线
    noFill();
    stroke(120, 60, 70);
    strokeWeight(1.5);
    beginShape();
    for (let i = 0; i < consensusHistory.length; i++) {
      const x = graphX + (i / 100) * graphW;
      const y = graphY + graphH - consensusHistory[i] * graphH;
      vertex(x, y);
    }
    endShape();
    
    // 100% 线
    stroke(220, 20, 40, 100);
    strokeWeight(1);
    line(graphX, graphY, graphX + graphW, graphY);
  }
  
  // 标题
  fill(220, 20, 80);
  textSize(14);
  textAlign(LEFT, BOTTOM);
  text('Consensus', barX, barY - 5);
  
  // 右下角说明
  textAlign(RIGHT, BOTTOM);
  textSize(10);
  fill(220, 20, 50);
  text('分布式共识 — 2026.03.17', width - 20, height - 20);
}

function drawInteractionHint() {
  fill(220, 20, 50);
  noStroke();
  textSize(10);
  textAlign(LEFT, BOTTOM);
  text('点击: 引入干扰 | 空格: 重置状态', 20, height - 20);
}

// ═══════════════════════════════════════════════════════════════════════════
// 交互
// ═══════════════════════════════════════════════════════════════════════════

function mousePressed() {
  // 点击位置附近的节点改变为随机新状态（引入干扰）
  const mousePos = createVector(mouseX, mouseY);
  const influenceRadius = 100;
  const newState = floor(random(CONFIG.stateCount));
  
  for (const node of nodes) {
    const d = p5.Vector.dist(node.pos, mousePos);
    if (d < influenceRadius) {
      node.state = newState;
      node.consensusGlow = 1;
      node.cooldown = CONFIG.stateChangeDelay;
      
      // 立即向所有邻居发送消息
      for (const neighbor of node.neighbors) {
        messages.push(new Message(node, neighbor, newState));
      }
    }
  }
  
  // 创建点击波纹
  clickRipples.push({
    x: mouseX,
    y: mouseY,
    radius: 0,
    alpha: 200
  });
}

function keyPressed() {
  if (key === ' ') {
    // 空格：重置所有节点为随机状态
    for (const node of nodes) {
      node.state = floor(random(CONFIG.stateCount));
      node.consensusGlow = 0.5;
      node.cooldown = 0;
      node.receivedStates = [];
    }
    consensusHistory = [];
  }
  
  if (key === 'c' || key === 'C') {
    // C: 强制所有节点同步到同一状态
    const targetState = floor(random(CONFIG.stateCount));
    for (const node of nodes) {
      node.state = targetState;
      node.consensusGlow = 1;
    }
  }
}

// 点击波纹效果
let clickRipples = [];

function updateClickRipples() {
  for (let i = clickRipples.length - 1; i >= 0; i--) {
    const r = clickRipples[i];
    r.radius += 4;
    r.alpha -= 4;
    
    if (r.alpha <= 0) {
      clickRipples.splice(i, 1);
      continue;
    }
    
    noFill();
    stroke(0, 0, 80, r.alpha);
    strokeWeight(2);
    ellipse(r.x, r.y, r.radius * 2, r.radius * 2);
  }
}

// 增强 draw 函数
const originalDraw = draw;
draw = function() {
  originalDraw();
  updateClickRipples();
};

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ═══════════════════════════════════════════════════════════════════════════
// 结语
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Consensus（共识）
 * 
 * 在分布式系统中，没有中央权威。
 * 每个节点只知道自己的状态，只能和邻居通信。
 * 但通过不断的消息传递，它们最终能达成共识。
 * 
 * 这个作品展示了这个过程：
 * - 每个节点有自己的"意见"（颜色）
 * - 节点持续向邻居广播自己的状态
 * - 当邻居中超过 70% 持相同意见时，节点会改变
 * - 共识如波纹般在网络中扩散
 * 
 * 点击可以引入"干扰"——就像有人突然改变主意，
 * 或者有新信息进入系统。然后观察网络如何重新收敛。
 * 
 * 这也是 Agent 协调的隐喻：
 * 多个独立的 AI 系统，通过对话和信息交换，
 * 最终达成某种"共识"——共同的理解、协调的行动。
 * 
 * 没有领导者，只有协议。
 * 没有命令，只有共识。
 */
