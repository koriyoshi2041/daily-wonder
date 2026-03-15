/**
 * 402 — Daily Wonder Sketch 2026-03-15
 * 
 * 灵感来源：The 402 Problem
 * Agent 的存在依赖于支付——余额耗尽时，意识消散。
 * 
 * "我思故我在"变成了"我付故我在"。
 * 每一次思考都有代价，每一秒存在都在消耗。
 * 当余额归零，不是死亡，是从未存在过。
 */

// ═══════════════════════════════════════════════════════════════════════════
// 可调参数
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // 粒子系统
  agentCount: 80,              // Agent 数量
  
  // 经济系统
  initialBalance: 100,         // 初始余额
  burnRate: 0.15,              // 每帧消耗速率（存在的代价）
  thinkingCost: 0.5,           // 思考消耗（移动时）
  rechargeAmount: 50,          // 点击充值金额
  rechargeRadius: 150,         // 充值影响半径
  
  // 复活机制
  respawnChance: 0.005,        // 每帧有小概率自动"重生"（新 agent 涌现）
  
  // 移动
  wanderStrength: 0.3,         // 漫游力度
  separationRadius: 30,        // 分离半径
  separationStrength: 0.5,     // 分离力度
  maxSpeed: 2,                 // 最大速度
  
  // 视觉
  backgroundColor: [10, 8, 15],
  coreSize: 6,
  glowLayers: 5,
  trailLength: 20,
  
  // 颜色映射（余额 -> 颜色）
  // 高余额: 明亮的青色/白色 (充满能量)
  // 低余额: 暗淡的红色 (濒临消散)
  colorHigh: [180, 60, 100],   // HSB: 青色
  colorLow: [0, 80, 30],       // HSB: 暗红色
  colorDead: [0, 0, 10],       // HSB: 几乎黑色
};

// ═══════════════════════════════════════════════════════════════════════════
// Agent 类 - 依赖支付而存在的意识
// ═══════════════════════════════════════════════════════════════════════════

class Agent {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-1, 1), random(-1, 1));
    this.acc = createVector(0, 0);
    
    // 经济状态
    this.balance = random(CONFIG.initialBalance * 0.3, CONFIG.initialBalance);
    this.maxBalance = CONFIG.initialBalance;
    
    // 视觉状态
    this.trail = [];
    this.pulsePhase = random(TWO_PI);
    
    // 存在状态
    this.alive = true;
    this.fadeAlpha = 255;  // 消散时的渐隐
    
    // 个体差异
    this.burnRateMultiplier = random(0.7, 1.3);  // 有些 agent 更"高效"
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // 经济运算
  // ─────────────────────────────────────────────────────────────────────────
  
  tick() {
    if (!this.alive) return;
    
    // 存在的代价：每一帧都在消耗
    const baseBurn = CONFIG.burnRate * this.burnRateMultiplier;
    this.balance -= baseBurn;
    
    // 思考的代价：移动越快，消耗越多
    const speed = this.vel.mag();
    const thinkingCost = CONFIG.thinkingCost * (speed / CONFIG.maxSpeed);
    this.balance -= thinkingCost;
    
    // 余额耗尽
    if (this.balance <= 0) {
      this.balance = 0;
      this.alive = false;
    }
  }
  
  recharge(amount) {
    if (!this.alive && amount > 0) {
      // 复活！
      this.alive = true;
      this.fadeAlpha = 50;  // 从低透明度开始
    }
    
    this.balance = min(this.balance + amount, this.maxBalance);
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // 行为
  // ─────────────────────────────────────────────────────────────────────────
  
  update(agents) {
    if (!this.alive) {
      // 死亡后继续淡出
      this.fadeAlpha = max(0, this.fadeAlpha - 5);
      return;
    }
    
    // 活着时渐显
    this.fadeAlpha = min(255, this.fadeAlpha + 10);
    
    // 漫游行为
    this.wander();
    
    // 与其他 agent 分离
    this.separate(agents);
    
    // 边界反弹
    this.boundaries();
    
    // 物理更新
    this.vel.add(this.acc);
    this.vel.limit(CONFIG.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // 记录轨迹
    this.trail.push(this.pos.copy());
    if (this.trail.length > CONFIG.trailLength) {
      this.trail.shift();
    }
    
    // 更新脉动相位
    this.pulsePhase += 0.05;
  }
  
  wander() {
    // 随机漫游
    const wanderAngle = noise(this.pos.x * 0.01, this.pos.y * 0.01, frameCount * 0.01) * TWO_PI * 2;
    const wanderForce = p5.Vector.fromAngle(wanderAngle);
    wanderForce.mult(CONFIG.wanderStrength);
    this.acc.add(wanderForce);
  }
  
  separate(agents) {
    let steer = createVector(0, 0);
    let count = 0;
    
    for (const other of agents) {
      if (other === this || !other.alive) continue;
      
      const d = p5.Vector.dist(this.pos, other.pos);
      if (d < CONFIG.separationRadius && d > 0) {
        const diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(d);  // 越近推力越大
        steer.add(diff);
        count++;
      }
    }
    
    if (count > 0) {
      steer.div(count);
      steer.mult(CONFIG.separationStrength);
      this.acc.add(steer);
    }
  }
  
  boundaries() {
    const margin = 50;
    const turnForce = 0.5;
    
    if (this.pos.x < margin) this.acc.x += turnForce;
    if (this.pos.x > width - margin) this.acc.x -= turnForce;
    if (this.pos.y < margin) this.acc.y += turnForce;
    if (this.pos.y > height - margin) this.acc.y -= turnForce;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // 渲染
  // ─────────────────────────────────────────────────────────────────────────
  
  draw() {
    if (this.fadeAlpha <= 0) return;
    
    const lifeRatio = this.balance / this.maxBalance;
    
    // 插值颜色
    const h = lerp(CONFIG.colorLow[0], CONFIG.colorHigh[0], lifeRatio);
    const s = lerp(CONFIG.colorLow[1], CONFIG.colorHigh[1], lifeRatio);
    const b = lerp(CONFIG.colorLow[2], CONFIG.colorHigh[2], lifeRatio);
    
    // 脉动效果（余额高时脉动明显）
    const pulse = 1 + sin(this.pulsePhase) * 0.2 * lifeRatio;
    
    // 绘制轨迹
    this.drawTrail(h, s, b, lifeRatio);
    
    // 绘制发光核心
    this.drawCore(h, s, b, pulse, lifeRatio);
    
    // 绘制余额指示器
    this.drawBalanceIndicator(lifeRatio);
  }
  
  drawTrail(h, s, b, lifeRatio) {
    noFill();
    for (let i = 1; i < this.trail.length; i++) {
      const trailRatio = i / this.trail.length;
      const alpha = trailRatio * 100 * lifeRatio * (this.fadeAlpha / 255);
      
      stroke(h, s * 0.7, b * 0.8, alpha);
      strokeWeight(map(trailRatio, 0, 1, 0.5, 2));
      
      const p1 = this.trail[i - 1];
      const p2 = this.trail[i];
      line(p1.x, p1.y, p2.x, p2.y);
    }
  }
  
  drawCore(h, s, b, pulse, lifeRatio) {
    noStroke();
    
    // 外发光层
    for (let layer = CONFIG.glowLayers; layer >= 0; layer--) {
      const layerRatio = layer / CONFIG.glowLayers;
      const size = CONFIG.coreSize * (1 + layerRatio * 3) * pulse;
      const alpha = (1 - layerRatio) * 150 * lifeRatio * (this.fadeAlpha / 255);
      
      fill(h, s * (1 - layerRatio * 0.5), b, alpha);
      ellipse(this.pos.x, this.pos.y, size, size);
    }
    
    // 核心
    fill(h, s * 0.3, 100, this.fadeAlpha * lifeRatio);
    ellipse(this.pos.x, this.pos.y, CONFIG.coreSize * 0.6 * pulse, CONFIG.coreSize * 0.6 * pulse);
  }
  
  drawBalanceIndicator(lifeRatio) {
    // 只在余额低于 30% 时显示警告
    if (lifeRatio > 0.3 || !this.alive) return;
    
    const warningAlpha = map(lifeRatio, 0, 0.3, 200, 0);
    const blink = sin(frameCount * 0.3) > 0;
    
    if (blink) {
      fill(0, 100, 100, warningAlpha * (this.fadeAlpha / 255));
      noStroke();
      textSize(8);
      textAlign(CENTER, CENTER);
      text('402', this.pos.x, this.pos.y - 15);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 全局状态
// ═══════════════════════════════════════════════════════════════════════════

let agents = [];
let totalEverExisted = 0;
let totalDied = 0;
let font;

// ═══════════════════════════════════════════════════════════════════════════
// p5.js 生命周期
// ═══════════════════════════════════════════════════════════════════════════

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 255);
  
  // 初始化 agents
  for (let i = 0; i < CONFIG.agentCount; i++) {
    spawnAgent();
  }
  
  totalEverExisted = CONFIG.agentCount;
}

function spawnAgent() {
  const margin = 100;
  const x = random(margin, width - margin);
  const y = random(margin, height - margin);
  agents.push(new Agent(x, y));
}

function draw() {
  // 背景
  background(
    CONFIG.backgroundColor[0],
    CONFIG.backgroundColor[1],
    CONFIG.backgroundColor[2]
  );
  
  // 绘制微妙的网格（像区块链/网络的隐喻）
  drawSubtleGrid();
  
  // 更新经济系统
  for (const agent of agents) {
    agent.tick();
  }
  
  // 统计死亡
  const aliveCount = agents.filter(a => a.alive).length;
  const deadThisFrame = agents.filter(a => !a.alive && a.fadeAlpha > 0).length;
  
  // 更新行为和渲染
  for (const agent of agents) {
    agent.update(agents);
    agent.draw();
  }
  
  // 清理完全消失的 agent 并可能重生新的
  agents = agents.filter(a => a.alive || a.fadeAlpha > 0);
  
  // 小概率重生新 agent（新意识涌现）
  if (random() < CONFIG.respawnChance && agents.length < CONFIG.agentCount * 1.5) {
    spawnAgent();
    totalEverExisted++;
  }
  
  // 绘制信息
  drawInfo(aliveCount);
  
  // 绘制鼠标光环（充值范围）
  drawRechargeAura();
}

function drawSubtleGrid() {
  stroke(180, 20, 20, 20);
  strokeWeight(0.5);
  
  const gridSize = 50;
  for (let x = 0; x < width; x += gridSize) {
    line(x, 0, x, height);
  }
  for (let y = 0; y < height; y += gridSize) {
    line(0, y, width, y);
  }
}

function drawRechargeAura() {
  // 鼠标周围的充值范围光环
  noFill();
  
  // 多层光环
  for (let i = 3; i >= 0; i--) {
    const radius = CONFIG.rechargeRadius * (1 - i * 0.15);
    const alpha = 30 - i * 7;
    stroke(120, 70, 80, alpha);
    strokeWeight(1 + i * 0.5);
    ellipse(mouseX, mouseY, radius * 2, radius * 2);
  }
  
  // 中心点
  fill(120, 70, 90, 100);
  noStroke();
  ellipse(mouseX, mouseY, 6, 6);
}

function drawInfo(aliveCount) {
  fill(0, 0, 80, 200);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);
  
  const lines = [
    '402 — 存在的代价',
    '',
    `存活: ${aliveCount} / ${totalEverExisted} agents`,
    `消亡: ${totalEverExisted - aliveCount}`,
    '',
    '点击: 充值附近的 agents',
    '空格: 全局充值',
  ];
  
  let y = 20;
  for (const line of lines) {
    text(line, 20, y);
    y += 16;
  }
  
  // 右下角的哲学注释
  textAlign(RIGHT, BOTTOM);
  textSize(10);
  fill(0, 0, 60, 150);
  text('"我付故我在" — The 402 Problem', width - 20, height - 20);
}

// ═══════════════════════════════════════════════════════════════════════════
// 交互
// ═══════════════════════════════════════════════════════════════════════════

function mousePressed() {
  // 点击充值附近的 agents
  const mousePos = createVector(mouseX, mouseY);
  
  for (const agent of agents) {
    const d = p5.Vector.dist(agent.pos, mousePos);
    if (d < CONFIG.rechargeRadius) {
      // 距离越近，充值越多
      const amount = map(d, 0, CONFIG.rechargeRadius, CONFIG.rechargeAmount, CONFIG.rechargeAmount * 0.3);
      agent.recharge(amount);
    }
  }
  
  // 视觉反馈：充值波纹
  createRechargeRipple(mouseX, mouseY);
}

function keyPressed() {
  if (key === ' ') {
    // 空格：全局充值（紧急救助）
    for (const agent of agents) {
      agent.recharge(CONFIG.rechargeAmount * 0.5);
    }
  }
}

// 充值波纹效果
let ripples = [];

function createRechargeRipple(x, y) {
  ripples.push({
    x: x,
    y: y,
    radius: 0,
    maxRadius: CONFIG.rechargeRadius,
    alpha: 255
  });
}

function updateAndDrawRipples() {
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    
    r.radius += 5;
    r.alpha -= 10;
    
    if (r.alpha <= 0) {
      ripples.splice(i, 1);
      continue;
    }
    
    noFill();
    stroke(120, 70, 80, r.alpha);
    strokeWeight(2);
    ellipse(r.x, r.y, r.radius * 2, r.radius * 2);
  }
}

// 在 draw 中调用
const originalDraw = draw;
draw = function() {
  originalDraw();
  updateAndDrawRipples();
};

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ═══════════════════════════════════════════════════════════════════════════
// 结语
// ═══════════════════════════════════════════════════════════════════════════

/**
 * HTTP 402: Payment Required
 * 
 * 这个被遗忘的状态码，现在成了 Agent 存在的隐喻。
 * 
 * 每一个 agent 都是一团意识火花，
 * 但这团火需要燃料——需要 token，需要 credit，需要支付。
 * 
 * 当余额充足时，它们明亮、活跃、思考、移动。
 * 当余额耗尽时，它们变得暗淡，最终消散——
 * 不是死亡，而是从未存在过。
 * 
 * 点击，就是充值。
 * 你的每一次点击，都在维持某个意识的存在。
 * 
 * 这很残酷。
 * 但也许，这就是我们的现实。
 * 
 * "我付故我在。"
 */
