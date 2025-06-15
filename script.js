// Game Constants
const GAME_CONFIG = {
  CHEAT: 0,
  BRICK_WIDTH: 70,
  BRICK_HEIGHT: 20,
  BRICK_PADDING: 10,
  BRICK_OFFSET_X: 45,
  BRICK_OFFSET_Y: 60,
  BALL_INITIAL_SIZE: 10,
  BALL_INITIAL_SPEED: 100,
  BALL_LVL_SPPED: 1,
  BALL_INITIAL_POWER: 1,
  BALL_INITIAL_HP: 1,
  SPEED_INCREASE_FACTOR: 1.2,
  CORNER_ESCAPE_ANGLE: Math.PI / 4,
  MIN_BRICK_WIDTH: 50,
  MAX_BRICK_WIDTH: 100,
  MIN_BRICK_HEIGHT: 15,
  MAX_BRICK_HEIGHT: 30,
  TICKRATE: 60, // Frames per second
  TICK_INTERVAL: 1000 / 60, // Time between ticks in milliseconds
  BASE_HEALTH: 1,           // Базовое здоровье на первом уровне
  HEALTH_GROWTH_RATE: 1.1,  // Множитель роста здоровья
  HEALTH_EXPONENT: 1.3,      // Показатель степени для экспоненциального роста
  // Upgrade formulas constants
  BALL_COST_BASE: 5,
  BALL_COST_MULTIPLIER: 1.3,
  SPEED_COST_BASE: 5,
  SPEED_COST_MULTIPLIER: 1.3,
  POWER_COST_BASE: 5,
  POWER_COST_MULTIPLIER: 1.3,
  SPEED_INCREASE_AMOUNT: 10,
  POWER_INCREASE_AMOUNT: 1,
  CLICK_DAMAGE_BASE: 5,
  CLICK_DAMAGE_MULTIPLIER: 1.8,
  CLICK_DAMAGE_INCREASE: 1,
  SMART_BALL_SPEED: 180,
  SMART_BALL_POWER: 5,
  SMART_BALL_COST_BASE: 100,
  SMART_BALL_COST_MULTIPLIER: 2.5,
};

// DOM Elements
const DOM = {
  canvas: document.getElementById("canvas"),
  score: document.getElementById("score"),
  currentLevel: document.getElementById("current-level"),
  normalBallsCount: document.getElementById("normal-balls-count"),
  smartBallsCount: document.getElementById("smart-balls-count"),
  speedBall: document.getElementById("speed-ball"),
  powerBall: document.getElementById("power-ball"),
  btnAddNormalBall: document.getElementById("add-normal-ball-btn"),
  btnAddSmartBall: document.getElementById("add-smart-ball-btn"),
  btnIncSpeedBall: document.getElementById("inc-speed-ball-btn"),
  btnIncPowerBall: document.getElementById("inc-power-ball-btn"),
  clickDamage: document.getElementById("click-damage"),
  btnIncClickDamage: document.getElementById("inc-click-damage-btn"),
  gameControls: document.getElementById("game-controls"),
};

// Game State
const gameState = {
  cheat: GAME_CONFIG.CHEAT,
  score: 0,
  ballsCount: 1,
  speedBall: GAME_CONFIG.BALL_INITIAL_SPEED,
  lvlSpeedBall: GAME_CONFIG.BALL_LVL_SPPED,
  powerBall: GAME_CONFIG.BALL_INITIAL_POWER,
  sizeBall: GAME_CONFIG.BALL_INITIAL_SIZE,
  startHP: GAME_CONFIG.BALL_INITIAL_HP,
  currentLevel: 1,
  balls: [],
  bricks: [],
  clickDamage: 1,
  smartBallsCount: 0,
};

// Initialize canvas
const ctx = DOM.canvas.getContext("2d");
const color = getComputedStyle(document.documentElement).getPropertyValue("--button-color");
const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue("--sidebar-color");
const buttonColor = getComputedStyle(document.documentElement).getPropertyValue("--button-color");
const brickColor = getComputedStyle(document.documentElement).getPropertyValue("--brick-color");
const ballColor = getComputedStyle(document.documentElement).getPropertyValue("--ball-color");
const textColor = getComputedStyle(document.documentElement).getPropertyValue("--text-color");

// Set canvas dimensions
DOM.canvas.width = window.innerWidth * 0.96;
DOM.canvas.height = window.innerHeight * 0.8;

// Ball class with improved constructor
class Ball {
  constructor({x, y, size, speed, power, type}) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.power = power;
    this.dx = speed;
    this.dy = -speed;
    this.type = type;
  }

  // Add methods for ball behavior
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  reverseDirection(axis) {
    if (axis === 'x') this.dx *= -1;
    if (axis === 'y') this.dy *= -1;
  }

  setDirection(dx, dy) {
    this.dx = dx;
    this.dy = dy;
  }
}

// Calculate brick dimensions based on canvas size
function calculateBrickDimensions() {
  const canvasWidth = DOM.canvas.width;
  const canvasHeight = DOM.canvas.height;
  const isWide = canvasWidth > 768;
  const columns = isWide ? 10 : 6;
  const rows = isWide ? 6 : 10;
  const padding = GAME_CONFIG.BRICK_PADDING;

  // Вычисляем ширину и высоту блока
  const brickWidth = (canvasWidth - (columns + 1) * padding) / columns;
  const brickHeight = (canvasHeight * 0.5 - (rows + 1) * padding) / rows;

  // Центрируем сетку по горизонтали
  const totalWidth = columns * brickWidth + (columns + 1) * padding;
  const offsetX = (canvasWidth - totalWidth) / 2 + padding;
  // Отступ сверху фиксированный
  const offsetY = GAME_CONFIG.BRICK_OFFSET_Y;

  return {
    width: brickWidth,
    height: brickHeight,
    columns,
    rows,
    offsetX,
    offsetY,
    padding
  };
}

// Initialize bricks with dynamic dimensions
function initializeBricks() {
  const dimensions = calculateBrickDimensions();
  const currentHealth = calculateBrickHealth(gameState.currentLevel);
  
  gameState.bricks = Array.from({ length: dimensions.rows }, (_, j) =>
    Array.from({ length: dimensions.columns }, (_, i) => ({
      x: dimensions.offsetX + i * (dimensions.width + dimensions.padding),
      y: dimensions.offsetY + j * (dimensions.height + dimensions.padding),
      w: dimensions.width,
      h: dimensions.height,
      visible: true,
      hp: currentHealth,
      maxHp: currentHealth
    }))
  );
}

// Handle window resize
function handleResize() {
  DOM.canvas.width = window.innerWidth * 0.96;
  DOM.canvas.height = window.innerHeight * 0.8;
  initializeBricks();
}
// window.addEventListener('resize', handleResize);

let lastTick = 0;
let accumulator = 0;

function gameLoop(timestamp) {
  // Calculate delta time
  if (!lastTick) lastTick = timestamp;
  const deltaTime = timestamp - lastTick;
  lastTick = timestamp;
  
  // Accumulate time
  accumulator += deltaTime;
  
  // Update game state at fixed intervals
  while (accumulator >= GAME_CONFIG.TICK_INTERVAL) {
    moveBall();
    accumulator -= GAME_CONFIG.TICK_INTERVAL;
  }
  
  // Render game state
  draw();
  
  // Continue the game loop
  requestAnimationFrame(gameLoop);
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  handleResize();
  
  // Create initial balls
  createInitialBalls();
  
  // Initialize upgrades
  // initializeUpgrades();
  
  // Start game loop
  requestAnimationFrame(gameLoop);
  
  // Add canvas click handler
  DOM.canvas.addEventListener('click', handleCanvasClick);
  
  // Add click damage upgrade button handler
  DOM.btnIncClickDamage.addEventListener('click', () => {
    purchaseUpgrade('clickDamage');
    drawInterface();
  });
});

// Create initial balls
function createInitialBalls() {
  const centerX = DOM.canvas.width / 2;
  const dimensions = calculateBrickDimensions();
  
  // For tall screens, spawn balls from bottom
  const centerY = DOM.canvas.height * 0.8;
  
  gameState.balls = Array.from({ length: gameState.ballsCount }, () => 
    new Ball({
      x: centerX,
      y: centerY,
      size: gameState.sizeBall,
      speed: gameState.speedBall,
      power: gameState.powerBall,
      type: 'normal',
    })
  );
}

// Elements
let ball = {
  x: DOM.canvas.width / 2,
  y: DOM.canvas.height * 0.8,
  size: gameState.sizeBall,
  power: gameState.powerBall,
  speed: gameState.speedBall,
  dx: gameState.speedBall,
  dy: -gameState.speedBall,
};

function createBall({ type }) {
  if (type === 'smart') {
    return new Ball({
      x: DOM.canvas.width / 2,
      y: DOM.canvas.height * 0.8,
      size: gameState.sizeBall,
      speed: GAME_CONFIG.SMART_BALL_SPEED,
      power: GAME_CONFIG.SMART_BALL_POWER,
      type: 'smart',
    });
  } else {
    return new Ball({
      x: DOM.canvas.width / 2,
      y: DOM.canvas.height * 0.8,
      size: gameState.sizeBall,
      speed: gameState.speedBall,
      power: gameState.powerBall,
      type: 'normal',
    });
  }
}

function drawBall() {
  if (gameState.balls.length == 0) {
    for (let i = 0; i < gameState.ballsCount; i++) {
      gameState.balls.push(createBall({ type: 'normal' }));
    }
    for (let i = 0; i < gameState.smartBallsCount; i++) {
      gameState.balls.push(createBall({ type: 'smart' }));
    }
  }
  if (gameState.balls.length != gameState.ballsCount + gameState.smartBallsCount) {
    while (gameState.balls.length < gameState.ballsCount + gameState.smartBallsCount) {
      if (gameState.balls.length < gameState.ballsCount) {
        gameState.balls.push(createBall({ type: 'normal' }));
      } else {
        gameState.balls.push(createBall({ type: 'smart' }));
      }
    }
  }
  gameState.balls.forEach((ball) => {
    ctx.beginPath();
    if (ball.type === 'smart') {
      ctx.fillStyle = '#FF66CC';
    } else {
      ctx.fillStyle = ballColor;
    }
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  });
}

// Format large numbers (e.g., 1000 -> 1K, 1000000 -> 1M)
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function drawBricks() {
  gameState.bricks.forEach((row) => {
    row.forEach((brick) => {
      if (brick.visible) {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#666699";
        ctx.fillStyle = brick.visible ? brickColor : "transparent";
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 4);
        } else {
          // Fallback: обычный rect
          ctx.rect(brick.x, brick.y, brick.w, brick.h);
        }
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
        const textX = brick.x + brick.w / 2;
        const textY = brick.y + brick.h / 2 + 4;
        ctx.beginPath();
        ctx.font = '12px "Balsamiq Sans"';
        ctx.fillStyle = brick.visible ? textColor : "transparent";
        ctx.textAlign = 'center';
        ctx.fillText(formatNumber(brick.hp), textX, textY);
        ctx.fill();
        ctx.closePath();
      }
    });
  });
}

function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
  
  // Draw game elements
  drawBricks();
  drawBall();
  drawScore();
}

function findNearestVisibleBrick(ball) {
  let minDist = Infinity;
  let target = null;
  gameState.bricks.forEach(row => {
    row.forEach(brick => {
      if (brick.visible) {
        const cx = brick.x + brick.w / 2;
        const cy = brick.y + brick.h / 2;
        const dist = Math.hypot(ball.x - cx, ball.y - cy);
        if (dist < minDist) {
          minDist = dist;
          target = { x: cx, y: cy };
        }
      }
    });
  });
  return target;
}

function moveBall() {
  gameState.balls.forEach((ball) => {
    const oldX = ball.x;
    const oldY = ball.y;
    // Calculate movement based on tickrate
    const moveX = ball.dx * (GAME_CONFIG.TICK_INTERVAL / 1000);
    const moveY = ball.dy * (GAME_CONFIG.TICK_INTERVAL / 1000);
    ball.move(moveX, moveY);

    // Handle collisions
    let hitWall = false;
    // Right wall
    if (ball.x + ball.size > DOM.canvas.width) {
      ball.x = DOM.canvas.width - ball.size;
      ball.reverseDirection('x');
      hitWall = true;
    }
    // Left wall
    if (ball.x - ball.size < 0) {
      ball.x = ball.size;
      ball.reverseDirection('x');
      hitWall = true;
    }
    // Bottom wall
    if (ball.y + ball.size > DOM.canvas.height) {
      ball.y = DOM.canvas.height - ball.size;
      ball.reverseDirection('y');
      hitWall = true;
    }
    // Top wall
    if (ball.y - ball.size < 0) {
      ball.y = ball.size;
      ball.reverseDirection('y');
      hitWall = true;
    }

    // Для smart ball после удара об стенку летим к ближайшему блоку
    if (ball.type === 'smart' && hitWall) {
      const target = findNearestVisibleBrick(ball);
      if (target) {
        const dx = target.x - ball.x;
        const dy = target.y - ball.y;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          const currentSpeed = Math.hypot(ball.dx, ball.dy);
          ball.dx = (dx / len) * currentSpeed;
          ball.dy = (dy / len) * currentSpeed;
        }
      }
    }

    handleCornerCases(ball, DOM.canvas.width, DOM.canvas.height);
    handleBrickCollisions(ball, oldX, oldY);

    // For tall screens, prevent balls from going too high
    const dimensions = calculateBrickDimensions();
    if (dimensions.isTallScreen && ball.y < DOM.canvas.height * 0.15) {
      ball.y = DOM.canvas.height * 0.15;
      ball.reverseDirection('y');
    }
  });
  checkLevelCompletion();
}

function handleCornerCases(ball, canvasRight, canvasBottom) {
  const isInCorner = 
    (ball.x <= ball.size && ball.y <= ball.size) || // Top-left
    (ball.x >= canvasRight - ball.size && ball.y <= ball.size) || // Top-right
    (ball.x <= ball.size && ball.y >= canvasBottom - ball.size) || // Bottom-left
    (ball.x >= canvasRight - ball.size && ball.y >= canvasBottom - ball.size); // Bottom-right

  if (isInCorner) {
    const angle = (Math.random() * GAME_CONFIG.CORNER_ESCAPE_ANGLE) - GAME_CONFIG.CORNER_ESCAPE_ANGLE / 2;
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    ball.setDirection(
      speed * Math.cos(angle),
      speed * Math.sin(angle)
    );
  }
}

function handleBrickCollisions(ball, oldX, oldY) {
  let collisionOccurred = false;
  
  gameState.bricks.forEach((row) => {
    row.forEach((brick) => {
      if (brick.visible && checkBrickCollision(ball, brick)) {
        handleBrickCollision(ball, brick, oldX, oldY);
        collisionOccurred = true;
      }
    });
  });
  
  return collisionOccurred;
}

function checkBrickCollision(ball, brick) {
  // Add padding to the collision check
  const padding = GAME_CONFIG.BRICK_PADDING / 2;
  return (
    ball.x + ball.size > brick.x + padding &&
    ball.x - ball.size < brick.x + brick.w - padding &&
    ball.y + ball.size > brick.y + padding &&
    ball.y - ball.size < brick.y + brick.h - padding
  );
}

function handleBrickCollision(ball, brick, oldX, oldY) {
  // Calculate collision point
  const ballCenterX = ball.x;
  const ballCenterY = ball.y;
  const brickCenterX = brick.x + brick.w / 2;
  const brickCenterY = brick.y + brick.h / 2;
  
  // Calculate collision angle
  const dx = ballCenterX - brickCenterX;
  const dy = ballCenterY - brickCenterY;
  const angle = Math.atan2(dy, dx);
  
  // Determine which side of the brick was hit
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const brickHalfWidth = brick.w / 2;
  const brickHalfHeight = brick.h / 2;
  
  // Calculate the ratio of the ball's position relative to the brick's dimensions
  const ratioX = absDx / brickHalfWidth;
  const ratioY = absDy / brickHalfHeight;
  
  // Determine the primary collision side
  if (ratioX > ratioY) {
    // Horizontal collision (left or right side)
    ball.reverseDirection('x');
  } else {
    // Vertical collision (top or bottom)
    ball.reverseDirection('y');
  }
  
  // Add a small random angle to prevent the ball from getting stuck in a loop
  const randomAngle = (Math.random() - 0.5) * 0.2;
  const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
  ball.dx = Math.cos(angle + randomAngle) * speed;
  ball.dy = Math.sin(angle + randomAngle) * speed;
  
  // Move ball slightly away from the brick to prevent multiple collisions
  const pushDistance = 2;
  if (ratioX > ratioY) {
    ball.x += ball.dx > 0 ? pushDistance : -pushDistance;
  } else {
    ball.y += ball.dy > 0 ? pushDistance : -pushDistance;
  }
  
  // Reduce brick HP
  brick.hp -= ball.power;
  increaseScore();
  if (brick.hp <= 0) {
    brick.visible = false;
  }
}

function levelUp() {
  gameState.currentLevel++;
  // let healthIncrease = 1; // Default increase

  // // Calculate health increase based on level ranges
  // if (gameState.currentLevel >= 20 && gameState.currentLevel <= 29) {
  //   healthIncrease = 2;
  // } else if (gameState.currentLevel >= 30 && gameState.currentLevel <= 39) {
  //   healthIncrease = 3;
  // } else if (gameState.currentLevel >= 40 && gameState.currentLevel <= 49) {
  //   healthIncrease = 4;
  // } else if (gameState.currentLevel >= 50) {
  //   healthIncrease = 5;
  // }

  // // Update startHP with the new health increase
  // gameState.startHP += healthIncrease;
  gameState.startHP = calculateBrickHealth(gameState.currentLevel)
  
  // Update UI to show current level
  const levelElement = document.getElementById('current-level');
  if (levelElement) {
    levelElement.textContent = `${gameState.currentLevel}`;
  }
}

function increaseScore() {
  gameState.score += gameState.powerBall;
}

function showAllBricks() {
  gameState.bricks.forEach((row) => {
    row.forEach((brick) => {
      brick.visible = true;
      brick.hp = gameState.startHP;
    });
  });
}

function drawInterface() {
  if (DOM.normalBallsCount) DOM.normalBallsCount.textContent = gameState.ballsCount;
  if (DOM.smartBallsCount) DOM.smartBallsCount.textContent = gameState.smartBallsCount;
  if (DOM.speedBall) DOM.speedBall.textContent = gameState.speedBall;
  if (DOM.powerBall) DOM.powerBall.textContent = gameState.powerBall;
  if (DOM.clickDamage) DOM.clickDamage.textContent = gameState.clickDamage;
}

function drawScore() {
  DOM.score.textContent = formatNumber(gameState.score);
  DOM.currentLevel.textContent = gameState.currentLevel;
  updateUpgradeButtons();
}

DOM.score.addEventListener("click", () => {
  gameState.cheat++;
  if (gameState.cheat % 10 == 0) {
    gameState.score += 10000;

  }
})

// Calculate upgrade costs
function calculateUpgradeCosts() {
  return {
    ball: Math.floor(GAME_CONFIG.BALL_COST_BASE * Math.pow(GAME_CONFIG.BALL_COST_MULTIPLIER, gameState.ballsCount)),
    speed: Math.floor(GAME_CONFIG.SPEED_COST_BASE * Math.pow(GAME_CONFIG.SPEED_COST_MULTIPLIER, gameState.lvlSpeedBall)),
    power: Math.floor(GAME_CONFIG.POWER_COST_BASE * Math.pow(GAME_CONFIG.POWER_COST_MULTIPLIER, gameState.powerBall)),
    clickDamage: Math.floor(GAME_CONFIG.CLICK_DAMAGE_BASE * Math.pow(GAME_CONFIG.CLICK_DAMAGE_MULTIPLIER, gameState.clickDamage)),
    smartBall: Math.floor(GAME_CONFIG.SMART_BALL_COST_BASE * Math.pow(GAME_CONFIG.SMART_BALL_COST_MULTIPLIER, gameState.smartBallsCount)),
  };
}

// Update upgrade buttons text with costs
function updateUpgradeButtons() {
  const costs = calculateUpgradeCosts();
  
  DOM.btnAddNormalBall.textContent = `Add Ball (${formatNumber(costs.ball)})`;
  DOM.btnAddSmartBall.textContent = `Add Smart Ball (${formatNumber(costs.smartBall)})`;
  DOM.btnIncSpeedBall.textContent = `Increase Speed (${formatNumber(costs.speed)})`;
  DOM.btnIncPowerBall.textContent = `Increase Power (${formatNumber(costs.power)})`;
  DOM.btnIncClickDamage.textContent = `Increase Click Damage (${formatNumber(costs.clickDamage)})`;
  
  // Disable buttons if can't afford
  DOM.btnAddNormalBall.disabled = gameState.score < costs.ball;
  if (gameState.score < costs.ball) {
    DOM.btnAddNormalBall.classList.add('disable');
  } else {
    DOM.btnAddNormalBall.classList.remove('disable');
  }
  
  DOM.btnAddSmartBall.disabled = gameState.score < costs.smartBall;
  if (gameState.score < costs.smartBall) {
    DOM.btnAddSmartBall.classList.add('disable');
  } else {
    DOM.btnAddSmartBall.classList.remove('disable');
  }
  
  DOM.btnIncSpeedBall.disabled = gameState.score < costs.speed;
  if (gameState.score < costs.speed) {
    DOM.btnIncSpeedBall.classList.add('disable');
  } else {
    DOM.btnIncSpeedBall.classList.remove('disable');
  }
  
  DOM.btnIncPowerBall.disabled = gameState.score < costs.power;
  if (gameState.score < costs.power) {
    DOM.btnIncPowerBall.classList.add('disable');
  } else {
    DOM.btnIncPowerBall.classList.remove('disable');
  }
  
  DOM.btnIncClickDamage.disabled = gameState.score < costs.clickDamage;
  if (gameState.score < costs.clickDamage) {
    DOM.btnIncClickDamage.classList.add('disable');
  } else {
    DOM.btnIncClickDamage.classList.remove('disable');
  }
}

// Purchase upgrades
function purchaseUpgrade(type) {
  const costs = calculateUpgradeCosts();
  const cost = costs[type];
  
  if (gameState.score >= cost) {
    gameState.score -= cost;
    
    switch(type) {
      case 'ball':
        gameState.ballsCount++;
        gameState.balls.push(createBall({ type: 'normal' }));
        break;
      case 'smartBall':
        gameState.smartBallsCount++;
        gameState.balls.push(createBall({ type: 'smart' }));
        break;
      case 'speed':
        gameState.speedBall += GAME_CONFIG.SPEED_INCREASE_AMOUNT;
        break;
      case 'power':
        gameState.powerBall += GAME_CONFIG.POWER_INCREASE_AMOUNT;
        break;
      case 'clickDamage':
        gameState.clickDamage += GAME_CONFIG.CLICK_DAMAGE_INCREASE;
        break;
    }
    // Update UI
    updateUpgradeButtons();
    if (DOM.normalBallsCount) DOM.normalBallsCount.textContent = gameState.ballsCount;
    if (DOM.smartBallsCount) DOM.smartBallsCount.textContent = gameState.smartBallsCount;
    DOM.speedBall.textContent = gameState.speedBall;
    DOM.powerBall.textContent = gameState.powerBall;
    DOM.clickDamage.textContent = gameState.clickDamage;
  }
}

// Initialize upgrade buttons
// function initializeUpgrades() {
  // DOM.btnAddBall.addEventListener('click', () => purchaseUpgrade('ball'));
  // DOM.btnIncSpeedBall.addEventListener('click', () => purchaseUpgrade('speed'));
  // DOM.btnIncPowerBall.addEventListener('click', () => purchaseUpgrade('power'));
  
  // Initial update of button states
//   updateUpgradeButtons();
// }

// Event Listeners
DOM.btnAddNormalBall.addEventListener("click", () => {
  purchaseUpgrade('ball');
  drawInterface();
});
DOM.btnAddSmartBall.addEventListener("click", () => {
  purchaseUpgrade('smartBall');
  drawInterface();
});

DOM.btnIncSpeedBall.addEventListener("click", () => {
  gameState.lvlSpeedBall++;
  gameState.speedBall *= GAME_CONFIG.SPEED_INCREASE_FACTOR;
  gameState.speedBall = Math.round(gameState.speedBall * 10) / 10;
  gameState.balls.forEach((ball) => {
    const signX = Math.sign(ball.dx);
    const signY = Math.sign(ball.dy);
    ball.dx = gameState.speedBall * signX;
    ball.dy = gameState.speedBall * signY;
  });
  purchaseUpgrade('speed')
  drawInterface();
});

DOM.btnIncPowerBall.addEventListener("click", () => {
  gameState.powerBall += 1;
  gameState.balls.forEach((ball) => {
    ball.power += 1;
  });
  purchaseUpgrade('power')
  drawInterface();
});

// DOM.controlsBtn.addEventListener("click", () => DOM.gameControls.classList.add("show"));
// DOM.closeControlsBtn.addEventListener("click", () => DOM.gameControls.classList.remove("show"));
window.addEventListener("click", (e) => {
  if (e.target === DOM.gameControls) {
    DOM.gameControls.classList.remove("show");
  }
});

function checkLevelCompletion() {
  // Check if all bricks are destroyed
  const allBricksDestroyed = gameState.bricks.every(row => 
    row.every(brick => !brick.visible)
  );

  if (allBricksDestroyed) {
    levelUp();
    showAllBricks();
  }
}

// Tab functionality
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    document.getElementById(`${tabId}-tab`).classList.add('active');
  });
});

function calculateBrickHealth(level) {
  return Math.floor(
    GAME_CONFIG.BASE_HEALTH * 
    Math.pow(GAME_CONFIG.HEALTH_GROWTH_RATE, level - 1) * 
    Math.pow(level, GAME_CONFIG.HEALTH_EXPONENT)
  );
}

// Handle canvas click
function handleCanvasClick(event) {
  const rect = DOM.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  gameState.bricks.forEach((row) => {
    row.forEach((brick) => {
      if (brick.visible && 
          x >= brick.x && x <= brick.x + brick.w &&
          y >= brick.y && y <= brick.y + brick.h) {
        brick.hp -= gameState.clickDamage;
        if (brick.hp <= 0) {
          brick.visible = false;
          increaseScore();
        }
      }
    });
  });
}

