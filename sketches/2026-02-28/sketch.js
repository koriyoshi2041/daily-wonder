/**
 * Signal Through Walls - 穿墙信号
 * Daily Wonder | 2026-02-28
 * 
 * 灵感来自 WiFi DensePose 技术：利用 WiFi 信号穿透墙壁检测人体姿态
 * 无形的信号波在空间中流动，遇到障碍物折射扭曲，
 * 最终勾勒出那个隐藏在墙后的幽灵般的存在
 * 
 * 交互：
 * - 鼠标控制"人体存在"的位置
 * - 'r' 键重置
 * - 's' 键保存截图
 */

// 信号场参数
let gridCols, gridRows;
const GRID_SPACING = 20;
let signalField = [];
let waves = [];

// 墙体
let walls = [];

// 颜色
let bgColor, waveColor, presenceColor, wallColor;

// 人体存在
let presence = { x: 0, y: 0, targetX: 0, targetY: 0 };
let presenceHistory = [];
const HISTORY_LENGTH = 12;

function setup() {
  createCanvas(800, 600);
  colorMode(HSB, 360, 100, 100, 100);
  
  // 颜色定义
  bgColor = color(220, 80, 12);       // 深蓝背景
  waveColor = color(185, 90, 80);     // 青色 WiFi 波
  presenceColor = color(25, 85, 95);  // 暖橙色存在
  wallColor = color(220, 50, 25);     // 暗蓝色墙
  
  // 初始化网格
  gridCols = ceil(width / GRID_SPACING) + 1;
  gridRows = ceil(height / GRID_SPACING) + 1;
  
  for (let i = 0; i < gridCols; i++) {
    signalField[i] = [];
    for (let j = 0; j < gridRows; j++) {
      signalField[i][j] = {
        baseX: i * GRID_SPACING,
        baseY: j * GRID_SPACING,
        offsetX: 0,
        offsetY: 0,
        intensity: 0
      };
    }
  }
  
  // 创建墙体
  createWalls();
  
  // 初始化存在位置
  presence.x = width / 2;
  presence.y = height / 2;
  presence.targetX = presence.x;
  presence.targetY = presence.y;
}

function createWalls() {
  walls = [];
  
  // 左侧竖墙
  walls.push({
    x: 150,
    y: 100,
    w: 20,
    h: 200
  });
  
  // 右侧竖墙
  walls.push({
    x: width - 170,
    y: height - 300,
    w: 20,
    h: 200
  });
  
  // 中间横墙
  walls.push({
    x: 300,
    y: height / 2 - 10,
    w: 200,
    h: 20
  });
  
  // 小块墙
  walls.push({
    x: 100,
    y: height - 150,
    w: 80,
    h: 15
  });
  
  walls.push({
    x: width - 200,
    y: 80,
    w: 100,
    h: 15
  });
}

function draw() {
  // 深蓝背景
  background(bgColor);
  
  // 更新存在位置（平滑跟随鼠标）
  presence.targetX = mouseX;
  presence.targetY = mouseY;
  presence.x = lerp(presence.x, presence.targetX, 0.08);
  presence.y = lerp(presence.y, presence.targetY, 0.08);
  
  // 记录存在历史
  presenceHistory.unshift({ x: presence.x, y: presence.y });
  if (presenceHistory.length > HISTORY_LENGTH) {
    presenceHistory.pop();
  }
  
  // 定期生成新波
  if (frameCount % 8 === 0) {
    waves.push(new SignalWave(presence.x, presence.y));
  }
  
  // 更新信号场
  updateSignalField();
  
  // 绘制背景网格
  drawBackgroundGrid();
  
  // 绘制墙体
  drawWalls();
  
  // 更新和绘制波
  for (let i = waves.length - 1; i >= 0; i--) {
    waves[i].update();
    waves[i].draw();
    if (waves[i].isDead()) {
      waves.splice(i, 1);
    }
  }
  
  // 绘制信号场
  drawSignalField();
  
  // 绘制幽灵般的人体存在
  drawGhostlyPresence();
  
  // 绘制信号发射源指示
  drawEmitterIndicator();
  
  // 绘制信息
  drawInfo();
}

function updateSignalField() {
  for (let i = 0; i < gridCols; i++) {
    for (let j = 0; j < gridRows; j++) {
      let point = signalField[i][j];
      let px = point.baseX;
      let py = point.baseY;
      
      // 计算到存在的距离影响
      let dx = px - presence.x;
      let dy = py - presence.y;
      let distToPresence = sqrt(dx * dx + dy * dy);
      
      // 存在产生的扰动
      let presenceInfluence = 0;
      if (distToPresence < 150) {
        presenceInfluence = map(distToPresence, 0, 150, 1, 0);
        presenceInfluence = pow(presenceInfluence, 0.5);
      }
      
      // 波的叠加影响
      let waveInfluence = 0;
      let waveOffsetX = 0;
      let waveOffsetY = 0;
      
      for (let wave of waves) {
        let waveEffect = wave.getInfluenceAt(px, py);
        waveInfluence += waveEffect.intensity;
        waveOffsetX += waveEffect.offsetX;
        waveOffsetY += waveEffect.offsetY;
      }
      
      // 墙体阻挡
      let wallFactor = 1;
      for (let wall of walls) {
        if (lineIntersectsRect(presence.x, presence.y, px, py, wall)) {
          wallFactor *= 0.3;
        }
      }
      
      // 应用扰动
      let totalInfluence = (presenceInfluence * 0.6 + waveInfluence * 0.4) * wallFactor;
      
      point.offsetX = lerp(point.offsetX, waveOffsetX * wallFactor, 0.15);
      point.offsetY = lerp(point.offsetY, waveOffsetY * wallFactor, 0.15);
      point.intensity = lerp(point.intensity, totalInfluence, 0.1);
    }
  }
}

function drawBackgroundGrid() {
  stroke(200, 30, 20, 15);
  strokeWeight(1);
  
  // 垂直线
  for (let x = 0; x <= width; x += GRID_SPACING * 2) {
    line(x, 0, x, height);
  }
  
  // 水平线
  for (let y = 0; y <= height; y += GRID_SPACING * 2) {
    line(0, y, width, y);
  }
}

function drawSignalField() {
  for (let i = 0; i < gridCols; i++) {
    for (let j = 0; j < gridRows; j++) {
      let point = signalField[i][j];
      let x = point.baseX + point.offsetX;
      let y = point.baseY + point.offsetY;
      
      // 基础信号点
      let baseAlpha = 20 + sin(frameCount * 0.03 + i * 0.5 + j * 0.5) * 10;
      
      // 强度影响
      let intensity = point.intensity;
      let size = 2 + intensity * 4;
      let alpha = baseAlpha + intensity * 60;
      
      // 根据强度混合颜色（青色到橙色）
      let hue = lerp(185, 25, pow(intensity, 0.7));
      let sat = 70 + intensity * 20;
      let bri = 40 + intensity * 50;
      
      noStroke();
      fill(hue, sat, bri, alpha);
      circle(x, y, size);
      
      // 高强度点的光晕
      if (intensity > 0.4) {
        fill(hue, sat * 0.7, bri, alpha * 0.3);
        circle(x, y, size * 2.5);
      }
    }
  }
}

function drawWalls() {
  noStroke();
  
  for (let wall of walls) {
    // 墙体阴影
    fill(220, 60, 8, 60);
    rect(wall.x + 4, wall.y + 4, wall.w, wall.h, 3);
    
    // 墙体主体
    fill(wallColor);
    rect(wall.x, wall.y, wall.w, wall.h, 3);
    
    // 墙体高光
    fill(200, 30, 35, 40);
    rect(wall.x, wall.y, wall.w, 3, 3, 3, 0, 0);
    
    // 墙体边缘发光（信号折射效果）
    drawWallGlow(wall);
  }
}

function drawWallGlow(wall) {
  // 墙体边缘的信号折射光效
  let glowIntensity = 0;
  
  // 检查存在与墙的距离
  let cx = wall.x + wall.w / 2;
  let cy = wall.y + wall.h / 2;
  let dist = sqrt(pow(presence.x - cx, 2) + pow(presence.y - cy, 2));
  
  if (dist < 250) {
    glowIntensity = map(dist, 0, 250, 0.8, 0);
  }
  
  if (glowIntensity > 0) {
    strokeWeight(2);
    for (let i = 0; i < 3; i++) {
      let a = glowIntensity * (30 - i * 10);
      stroke(185, 80, 70, a);
      noFill();
      rect(wall.x - i * 3, wall.y - i * 3, wall.w + i * 6, wall.h + i * 6, 5);
    }
    noStroke();
  }
}

function drawGhostlyPresence() {
  // 绘制幽灵般的人体轮廓
  push();
  translate(presence.x, presence.y);
  
  // 历史轨迹（动态残影）
  for (let i = presenceHistory.length - 1; i >= 0; i--) {
    let h = presenceHistory[i];
    let alpha = map(i, 0, presenceHistory.length, 30, 5);
    let size = map(i, 0, presenceHistory.length, 1, 0.4);
    
    push();
    translate(h.x - presence.x, h.y - presence.y);
    scale(size);
    drawHumanSilhouette(alpha * 0.5);
    pop();
  }
  
  // 主体
  drawHumanSilhouette(50);
  
  // 信号扫描线效果
  let scanY = (frameCount * 3) % 200 - 100;
  stroke(185, 90, 90, 40);
  strokeWeight(2);
  line(-40, scanY, 40, scanY);
  
  pop();
}

function drawHumanSilhouette(alpha) {
  noStroke();
  
  // 外层光晕
  for (let r = 80; r > 0; r -= 15) {
    fill(25, 70, 80, alpha * map(r, 0, 80, 0.3, 0.05));
    ellipse(0, 0, r * 1.2, r * 1.8);
  }
  
  // 头部
  fill(25, 85, 95, alpha);
  ellipse(0, -50, 30, 35);
  
  // 躯干
  fill(25, 80, 90, alpha * 0.9);
  ellipse(0, 0, 40, 60);
  
  // 信号点（关节位置）
  fill(185, 90, 95, alpha * 1.5);
  let jointSize = 5 + sin(frameCount * 0.1) * 2;
  
  // 头
  circle(0, -50, jointSize);
  // 肩
  circle(-20, -25, jointSize * 0.8);
  circle(20, -25, jointSize * 0.8);
  // 髋
  circle(-12, 20, jointSize * 0.8);
  circle(12, 20, jointSize * 0.8);
  // 中心
  circle(0, 0, jointSize * 1.2);
}

function drawEmitterIndicator() {
  // WiFi 信号发射指示
  push();
  translate(presence.x, presence.y - 80);
  
  // WiFi 弧线
  noFill();
  strokeWeight(2);
  for (let i = 0; i < 3; i++) {
    let arcAlpha = 50 - i * 15;
    let arcSize = 15 + i * 12;
    let pulse = sin(frameCount * 0.1 + i * 0.5) * 0.3 + 0.7;
    
    stroke(185, 80, 85, arcAlpha * pulse);
    arc(0, 0, arcSize, arcSize * 0.7, PI + 0.4, TWO_PI - 0.4);
  }
  
  // 中心点
  fill(185, 90, 95, 60);
  noStroke();
  circle(0, 5, 6);
  
  pop();
}

function drawInfo() {
  // 标题
  fill(200, 20, 60, 60);
  noStroke();
  textFont('monospace');
  textSize(11);
  textAlign(LEFT, TOP);
  text('SIGNAL THROUGH WALLS', 20, 20);
  text('WiFi DensePose Visualization', 20, 35);
  
  // 控制提示
  textAlign(RIGHT, BOTTOM);
  fill(200, 20, 50, 40);
  text('[R] Reset  [S] Save', width - 20, height - 20);
  
  // 信号强度指示
  let avgIntensity = 0;
  let count = 0;
  for (let i = 0; i < gridCols; i++) {
    for (let j = 0; j < gridRows; j++) {
      avgIntensity += signalField[i][j].intensity;
      count++;
    }
  }
  avgIntensity /= count;
  
  textAlign(LEFT, BOTTOM);
  fill(185, 70, 70, 50);
  text('Signal Strength: ' + nf(avgIntensity * 100, 1, 1) + '%', 20, height - 20);
}

// 信号波类
class SignalWave {
  constructor(x, y) {
    this.originX = x;
    this.originY = y;
    this.radius = 0;
    this.maxRadius = max(width, height) * 1.2;
    this.speed = 4;
    this.thickness = 30;
    this.life = 1;
  }
  
  update() {
    this.radius += this.speed;
    this.life = map(this.radius, 0, this.maxRadius, 1, 0);
  }
  
  draw() {
    noFill();
    
    // 多层波纹
    for (let i = 0; i < 3; i++) {
      let r = this.radius - i * 8;
      if (r > 0) {
        let alpha = this.life * (40 - i * 12);
        stroke(185, 80, 75, alpha);
        strokeWeight(2 - i * 0.5);
        
        // 绘制被墙阻挡的波（分段绘制）
        this.drawWaveWithWalls(r);
      }
    }
  }
  
  drawWaveWithWalls(radius) {
    // 简化：直接绘制椭圆，墙体阻挡由 signalField 处理
    beginShape();
    for (let a = 0; a < TWO_PI; a += 0.1) {
      let x = this.originX + cos(a) * radius;
      let y = this.originY + sin(a) * radius;
      
      // 检查是否被墙阻挡
      let blocked = false;
      for (let wall of walls) {
        if (pointInRect(x, y, wall)) {
          blocked = true;
          break;
        }
      }
      
      if (!blocked) {
        vertex(x, y);
      } else {
        endShape();
        beginShape();
      }
    }
    endShape();
  }
  
  getInfluenceAt(x, y) {
    let dx = x - this.originX;
    let dy = y - this.originY;
    let dist = sqrt(dx * dx + dy * dy);
    
    let influence = {
      intensity: 0,
      offsetX: 0,
      offsetY: 0
    };
    
    // 在波前沿附近产生影响
    let distFromWave = abs(dist - this.radius);
    if (distFromWave < this.thickness) {
      let strength = map(distFromWave, 0, this.thickness, 1, 0) * this.life;
      influence.intensity = strength * 0.5;
      
      // 波推动方向
      if (dist > 0) {
        let pushStrength = strength * 5;
        influence.offsetX = (dx / dist) * pushStrength;
        influence.offsetY = (dy / dist) * pushStrength;
      }
    }
    
    return influence;
  }
  
  isDead() {
    return this.radius > this.maxRadius;
  }
}

// 工具函数
function lineIntersectsRect(x1, y1, x2, y2, rect) {
  // 简化的线段-矩形相交检测
  let left = rect.x;
  let right = rect.x + rect.w;
  let top = rect.y;
  let bottom = rect.y + rect.h;
  
  return lineIntersectsLine(x1, y1, x2, y2, left, top, right, top) ||
         lineIntersectsLine(x1, y1, x2, y2, left, bottom, right, bottom) ||
         lineIntersectsLine(x1, y1, x2, y2, left, top, left, bottom) ||
         lineIntersectsLine(x1, y1, x2, y2, right, top, right, bottom);
}

function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
  let denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (abs(denom) < 0.0001) return false;
  
  let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  let u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w &&
         y >= rect.y && y <= rect.y + rect.h;
}

// 键盘控制
function keyPressed() {
  if (key === 'r' || key === 'R') {
    // 重置
    waves = [];
    presenceHistory = [];
    presence.x = width / 2;
    presence.y = height / 2;
    presence.targetX = presence.x;
    presence.targetY = presence.y;
    
    // 重置信号场
    for (let i = 0; i < gridCols; i++) {
      for (let j = 0; j < gridRows; j++) {
        signalField[i][j].offsetX = 0;
        signalField[i][j].offsetY = 0;
        signalField[i][j].intensity = 0;
      }
    }
  }
  
  if (key === 's' || key === 'S') {
    saveCanvas('signal-through-walls-' + frameCount, 'png');
  }
}

// 响应式画布
function windowResized() {
  resizeCanvas(min(windowWidth - 40, 800), min(windowHeight - 40, 600));
  createWalls();
  
  // 重新初始化网格
  gridCols = ceil(width / GRID_SPACING) + 1;
  gridRows = ceil(height / GRID_SPACING) + 1;
  
  signalField = [];
  for (let i = 0; i < gridCols; i++) {
    signalField[i] = [];
    for (let j = 0; j < gridRows; j++) {
      signalField[i][j] = {
        baseX: i * GRID_SPACING,
        baseY: j * GRID_SPACING,
        offsetX: 0,
        offsetY: 0,
        intensity: 0
      };
    }
  }
}
