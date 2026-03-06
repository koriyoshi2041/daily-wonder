/**
 * Derivative - 衍生
 * Daily Wonder | 2026-03-06
 * 
 * 探索"原创"与"衍生"的视觉关系
 * 灵感来自 AI relicensing 研究
 * 
 * 左侧：原始形状 (The Original)
 * 右侧：衍生形状 (The Derivative)
 * 鼠标 X 位置控制衍生程度 (0% = 完全相同, 100% = 完全不同)
 * 
 * 交互：
 * - 鼠标 X：控制衍生程度
 * - 鼠标 Y：控制形变的"有机性"
 * - 空格键：切换形状类型
 * - 'r' 键：重新生成种子
 * - 's' 键：保存截图
 */

// 配置
const POINT_COUNT = 120;
const BASE_RADIUS = 120;

// 状态
let originalPoints = [];
let derivedPoints = [];
let noiseSeed = 0;
let shapeType = 0; // 0: circle, 1: square, 2: star
const shapeNames = ['CIRCLE', 'SQUARE', 'STAR'];

// 动画
let time = 0;
let derivationAmount = 0;
let targetDerivation = 0;

// 颜色
let colors = {
  bg: null,
  original: null,
  derived: null,
  connection: null,
  text: null
};

function setup() {
  createCanvas(900, 600);
  colorMode(HSB, 360, 100, 100, 100);
  
  // 深色背景配色
  colors.bg = color(220, 30, 8);
  colors.original = color(200, 70, 85);     // 青蓝色 - 原始
  colors.derived = color(340, 65, 85);      // 粉红色 - 衍生
  colors.connection = color(55, 50, 70);    // 金色连线
  colors.text = color(220, 15, 60);
  
  noiseSeed = random(10000);
  generateBaseShape();
}

function generateBaseShape() {
  originalPoints = [];
  
  for (let i = 0; i < POINT_COUNT; i++) {
    let angle = (TWO_PI / POINT_COUNT) * i;
    let r = getShapeRadius(angle, shapeType);
    
    originalPoints.push({
      angle: angle,
      baseRadius: r,
      x: 0,
      y: 0
    });
  }
}

function getShapeRadius(angle, type) {
  switch(type) {
    case 0: // Circle
      return BASE_RADIUS;
    
    case 1: // Rounded square
      let n = 4;
      let a = angle + PI/4;
      return BASE_RADIUS * 0.9 / pow(pow(abs(cos(a * n/2)), 2.5) + pow(abs(sin(a * n/2)), 2.5), 1/2.5);
    
    case 2: // Star
      let spikes = 5;
      let inner = BASE_RADIUS * 0.5;
      let outer = BASE_RADIUS * 1.1;
      let spike = (angle * spikes / TWO_PI) % 1;
      return lerp(outer, inner, abs(spike - 0.5) * 2);
    
    default:
      return BASE_RADIUS;
  }
}

function draw() {
  background(colors.bg);
  time += 0.01;
  
  // 计算目标衍生度
  targetDerivation = constrain(map(mouseX, 100, width - 100, 0, 1), 0, 1);
  derivationAmount = lerp(derivationAmount, targetDerivation, 0.08);
  
  // 有机性由 mouseY 控制
  let organicness = constrain(map(mouseY, height - 100, 100, 0.3, 2), 0.3, 2);
  
  // 中心位置
  let leftCenterX = width * 0.28;
  let rightCenterX = width * 0.72;
  let centerY = height * 0.5;
  
  // 计算所有点的位置
  calculatePositions(leftCenterX, rightCenterX, centerY, organicness);
  
  // 绘制连接线（DNA螺旋感）
  drawConnections(leftCenterX, rightCenterX, centerY);
  
  // 绘制原始形状
  drawShape(leftCenterX, centerY, originalPoints, colors.original, 'original');
  
  // 绘制衍生形状
  drawShape(rightCenterX, centerY, derivedPoints, colors.derived, 'derived');
  
  // 绘制相似度指示
  drawSimilarityMeter();
  
  // 绘制信息
  drawInfo(organicness);
  
  // 绘制流动粒子
  drawFlowParticles(leftCenterX, rightCenterX, centerY);
}

function calculatePositions(leftX, rightX, centerY, organicness) {
  derivedPoints = [];
  
  for (let i = 0; i < originalPoints.length; i++) {
    let op = originalPoints[i];
    
    // 原始点位置（带轻微呼吸动画）
    let breathe = sin(time * 2 + op.angle * 2) * 3;
    op.x = leftX + cos(op.angle) * (op.baseRadius + breathe);
    op.y = centerY + sin(op.angle) * (op.baseRadius + breathe);
    
    // 计算衍生点
    // 使用多层噪声创造有机变形
    let n1 = noise(
      noiseSeed + cos(op.angle) * 0.5 + time * 0.5,
      sin(op.angle) * 0.5,
      derivationAmount * 2
    );
    let n2 = noise(
      noiseSeed + 100 + cos(op.angle * 2) * 0.3,
      sin(op.angle * 2) * 0.3,
      time * 0.3 + derivationAmount
    );
    let n3 = noise(
      noiseSeed + 200 + cos(op.angle * 3) * 0.2,
      sin(op.angle * 3) * 0.2,
      time * 0.2
    );
    
    // 组合噪声
    let noiseVal = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2) * 2 - 1;
    
    // 衍生程度影响变形幅度
    let deformation = noiseVal * derivationAmount * 80 * organicness;
    
    // 角度偏移（衍生越大，角度变化越大）
    let angleOffset = noiseVal * derivationAmount * 0.3 * organicness;
    
    let derivedAngle = op.angle + angleOffset;
    let derivedRadius = op.baseRadius + breathe + deformation;
    
    derivedPoints.push({
      angle: derivedAngle,
      radius: derivedRadius,
      x: rightX + cos(derivedAngle) * derivedRadius,
      y: centerY + sin(derivedAngle) * derivedRadius,
      deformation: abs(deformation) / 80  // 标准化变形量
    });
  }
}

function drawConnections(leftX, rightX, centerY) {
  // 绘制连接原始和衍生的线条（像DNA或脐带）
  let connectionCount = 12;
  let step = floor(POINT_COUNT / connectionCount);
  
  for (let i = 0; i < connectionCount; i++) {
    let idx = i * step;
    let op = originalPoints[idx];
    let dp = derivedPoints[idx];
    
    // 连接线的透明度与衍生度相关
    let alpha = map(derivationAmount, 0, 1, 40, 15);
    
    // 贝塞尔曲线连接
    noFill();
    
    // 渐变效果
    let segments = 20;
    for (let j = 0; j < segments; j++) {
      let t1 = j / segments;
      let t2 = (j + 1) / segments;
      
      // 控制点
      let cx1 = lerp(op.x, rightX - 50, 0.5);
      let cy1 = centerY + sin(time * 2 + i * 0.5) * 30;
      let cx2 = lerp(leftX + 50, dp.x, 0.5);
      let cy2 = centerY + sin(time * 2 + i * 0.5 + 1) * 30;
      
      let x1 = bezierPoint(op.x, cx1, cx2, dp.x, t1);
      let y1 = bezierPoint(op.y, cy1, cy2, dp.y, t1);
      let x2 = bezierPoint(op.x, cx1, cx2, dp.x, t2);
      let y2 = bezierPoint(op.y, cy1, cy2, dp.y, t2);
      
      // 颜色插值
      let c = lerpColor(colors.original, colors.derived, t1);
      stroke(hue(c), saturation(c) * 0.6, brightness(c), alpha * (1 - dp.deformation * 0.5));
      strokeWeight(1 + sin(time + i + t1 * PI) * 0.5);
      line(x1, y1, x2, y2);
    }
  }
}

function drawShape(centerX, centerY, points, baseColor, type) {
  push();
  
  // 外发光
  noFill();
  for (let r = 30; r > 0; r -= 5) {
    let a = map(r, 0, 30, 20, 0);
    stroke(hue(baseColor), saturation(baseColor) * 0.5, brightness(baseColor), a);
    strokeWeight(r * 0.3);
    beginShape();
    for (let p of points) {
      vertex(p.x, p.y);
    }
    endShape(CLOSE);
  }
  
  // 主形状填充
  let fillAlpha = type === 'derived' ? map(derivationAmount, 0, 1, 80, 50) : 60;
  fill(hue(baseColor), saturation(baseColor) * 0.3, brightness(baseColor), fillAlpha);
  stroke(hue(baseColor), saturation(baseColor), brightness(baseColor), 80);
  strokeWeight(2);
  
  beginShape();
  for (let p of points) {
    vertex(p.x, p.y);
  }
  endShape(CLOSE);
  
  // 点装饰
  noStroke();
  for (let i = 0; i < points.length; i += 6) {
    let p = points[i];
    let deform = type === 'derived' ? derivedPoints[i].deformation : 0;
    let size = 4 + deform * 6;
    
    fill(hue(baseColor), saturation(baseColor) * 0.5, 100, 70);
    circle(p.x, p.y, size);
  }
  
  // 中心标签
  fill(hue(baseColor), saturation(baseColor) * 0.3, brightness(baseColor), 60);
  textAlign(CENTER, CENTER);
  textFont('monospace');
  textSize(10);
  text(type === 'original' ? 'ORIGINAL' : 'DERIVATIVE', centerX, centerY + BASE_RADIUS + 50);
  
  pop();
}

function drawFlowParticles(leftX, rightX, centerY) {
  // 从原始流向衍生的粒子
  let particleCount = 8;
  
  noStroke();
  for (let i = 0; i < particleCount; i++) {
    let t = (time * 0.3 + i / particleCount) % 1;
    
    // 只在有一定衍生度时显示
    if (derivationAmount < 0.1) continue;
    
    let startAngle = (TWO_PI / particleCount) * i;
    let startR = BASE_RADIUS * 0.8;
    
    let startX = leftX + cos(startAngle) * startR;
    let startY = centerY + sin(startAngle) * startR;
    
    let idx = floor((i / particleCount) * derivedPoints.length);
    let endX = derivedPoints[idx].x;
    let endY = derivedPoints[idx].y;
    
    // 弧形路径
    let x = lerp(startX, endX, t);
    let y = lerp(startY, endY, t) + sin(t * PI) * -50;
    
    // 粒子
    let alpha = sin(t * PI) * derivationAmount * 60;
    let c = lerpColor(colors.original, colors.derived, t);
    fill(hue(c), saturation(c), brightness(c), alpha);
    circle(x, y, 4 + sin(t * PI) * 3);
  }
}

function drawSimilarityMeter() {
  let meterX = width / 2;
  let meterY = height - 60;
  let meterWidth = 300;
  let meterHeight = 8;
  
  // 背景
  fill(220, 20, 20, 40);
  noStroke();
  rect(meterX - meterWidth/2, meterY - meterHeight/2, meterWidth, meterHeight, 4);
  
  // 渐变填充
  for (let i = 0; i < meterWidth; i++) {
    let t = i / meterWidth;
    let c = lerpColor(colors.original, colors.derived, t);
    let alpha = t <= derivationAmount ? 80 : 20;
    fill(hue(c), saturation(c), brightness(c), alpha);
    rect(meterX - meterWidth/2 + i, meterY - meterHeight/2, 1, meterHeight);
  }
  
  // 当前位置指示器
  let indicatorX = meterX - meterWidth/2 + derivationAmount * meterWidth;
  fill(0, 0, 100, 90);
  noStroke();
  triangle(
    indicatorX, meterY - meterHeight/2 - 6,
    indicatorX - 5, meterY - meterHeight/2 - 12,
    indicatorX + 5, meterY - meterHeight/2 - 12
  );
  
  // 标签
  textFont('monospace');
  textSize(10);
  textAlign(CENTER, TOP);
  
  fill(hue(colors.original), saturation(colors.original), brightness(colors.original), 70);
  text('IDENTICAL', meterX - meterWidth/2, meterY + 10);
  
  fill(hue(colors.derived), saturation(colors.derived), brightness(colors.derived), 70);
  text('TRANSFORMED', meterX + meterWidth/2, meterY + 10);
  
  // 百分比
  fill(0, 0, 80);
  textSize(14);
  text(floor(derivationAmount * 100) + '%', meterX, meterY - 30);
  
  // 相似度文字
  let similarity = floor((1 - derivationAmount) * 100);
  fill(220, 15, 50, 50);
  textSize(9);
  text('SIMILARITY: ' + similarity + '%', meterX, meterY + 30);
}

function drawInfo(organicness) {
  fill(colors.text);
  noStroke();
  textFont('monospace');
  textSize(12);
  textAlign(LEFT, TOP);
  text('DERIVATIVE', 25, 25);
  
  textSize(10);
  fill(220, 15, 45, 50);
  text('Shape: ' + shapeNames[shapeType], 25, 45);
  text('Organicness: ' + nf(organicness, 1, 2), 25, 60);
  
  textAlign(RIGHT, TOP);
  text('[SPACE] Shape  [R] Randomize  [S] Save', width - 25, 25);
  
  // 概念说明
  textAlign(CENTER, BOTTOM);
  textSize(9);
  fill(220, 15, 40, 40);
  text('Move mouse horizontally to control derivation | Vertically for organic complexity', width/2, height - 100);
}

function keyPressed() {
  if (key === ' ') {
    shapeType = (shapeType + 1) % 3;
    generateBaseShape();
  }
  
  if (key === 'r' || key === 'R') {
    noiseSeed = random(10000);
  }
  
  if (key === 's' || key === 'S') {
    saveCanvas('derivative-' + floor(derivationAmount * 100) + '-' + frameCount, 'png');
  }
}

function windowResized() {
  resizeCanvas(min(windowWidth - 40, 900), min(windowHeight - 40, 600));
}
