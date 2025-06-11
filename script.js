// Game Constants
const GAME_CONFIG = {
  BRICK_COLUMNS: 5,
  BRICK_ROWS: 5,
  BRICK_WIDTH: 70,
  BRICK_HEIGHT: 20,
  BRICK_PADDING: 10,
  BRICK_OFFSET_X: 45,
  BRICK_OFFSET_Y: 60,
  // CANVAS_WIDTH: 800,
  // CANVAS_HEIGHT_RATIO: 1.7,
  BALL_INITIAL_SIZE: 10,
  BALL_INITIAL_SPEED: 1,
  BALL_INITIAL_POWER: 1,
  BALL_INITIAL_HP: 1,
  SPEED_INCREASE_FACTOR: 1.2,
  CORNER_ESCAPE_ANGLE: Math.PI / 4,
  MIN_BRICK_WIDTH: 50,
  MAX_BRICK_WIDTH: 100
};

// DOM Elements
const DOM = {
  canvas: document.getElementById("canvas"),
  score: document.getElementById("score"),
  currentLevel: document.getElementById("current-level"),
  ballsCount: document.getElementById("balls-count"),
  speedBall: document.getElementById("speed-ball"),
  powerBall: document.getElementById("power-ball"),
  btnAddBall: document.getElementById("addball-btn"),
  btnIncSpeedBall: document.getElementById("inc-speed-ball-btn"),
  btnIncPowerBall: document.getElementById("inc-power-ball-btn"),
  controlsBtn: document.getElementById("controls-btn"),
  gameControls: document.getElementById("game-controls"),
  closeControlsBtn: document.getElementById("close-controls-btn")
};

// Game State
const gameState = {
  score: 0,
  ballsCount: 1,
  speedBall: GAME_CONFIG.BALL_INITIAL_SPEED,
  powerBall: GAME_CONFIG.BALL_INITIAL_POWER,
  sizeBall: GAME_CONFIG.BALL_INITIAL_SIZE,
  startHP: GAME_CONFIG.BALL_INITIAL_HP,
  currentLevel: 1,
  balls: [],
  bricks: []
};

// Initialize canvas
const ctx = DOM.canvas.getContext("2d");
const color = getComputedStyle(document.documentElement).getPropertyValue("--button-color");
const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue("--sidebar-color");

// Set canvas dimensions
// DOM.canvas.height = DOM.canvas.width * GAME_CONFIG.CANVAS_HEIGHT_RATIO;
DOM.canvas.width = window.innerWidth * 0.96;
DOM.canvas.height = window.innerHeight * 0.8;
// ctx.canvas.width = window.innerWidth * 0.96;
// ctx.canvas.height = window.innerHeight * 0.8;
// ctx.canvas.width = GAME_CONFIG.CANVAS_WIDTH;
// ctx.canvas.height = ctx.canvas.width * GAME_CONFIG.CANVAS_HEIGHT_RATIO;
console.log(GAME_CONFIG)
console.log(canvas.width, canvas.height)


// Ball class with improved constructor
class Ball {
  constructor({x, y, size, speed, power}) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.power = power;
    this.dx = speed;
    this.dy = -speed;
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
  const availableWidth = canvasWidth - (GAME_CONFIG.BRICK_PADDING * 2);
  
  // Calculate optimal brick width
  let brickWidth = Math.floor(availableWidth / GAME_CONFIG.BRICK_ROWS);
  
  // Ensure brick width is within reasonable limits
  brickWidth = Math.max(
    GAME_CONFIG.MIN_BRICK_WIDTH,
    Math.min(brickWidth, GAME_CONFIG.MAX_BRICK_WIDTH)
  );
  
  // Calculate actual number of bricks that can fit
  const actualBrickCount = Math.floor(availableWidth / brickWidth);
  
  // Calculate offset to center the bricks
  const totalBricksWidth = (brickWidth * actualBrickCount) + 
                          (GAME_CONFIG.BRICK_PADDING * (actualBrickCount - 1));
  const offsetX = (canvasWidth - totalBricksWidth) / 2;
  
  return {
    width: brickWidth,
    height: Math.floor(brickWidth * 0.3), // Maintain aspect ratio
    count: actualBrickCount,
    offsetX: offsetX
  };
}

// Initialize bricks with dynamic dimensions
function initializeBricks() {
  const dimensions = calculateBrickDimensions();
  
  const brickInfo = {
    w: dimensions.width,
    h: dimensions.height,
    padding: GAME_CONFIG.BRICK_PADDING,
    offsetX: dimensions.offsetX,
    offsetY: GAME_CONFIG.BRICK_OFFSET_Y,
    visible: true,
    hp: gameState.startHP
  };

  gameState.bricks = Array.from({ length: dimensions.count }, (_, i) =>
    Array.from({ length: GAME_CONFIG.BRICK_COLUMNS }, (_, j) => ({
      x: i * (brickInfo.w + brickInfo.padding) + brickInfo.offsetX,
      y: j * (brickInfo.h + brickInfo.padding) + brickInfo.offsetY,
      ...brickInfo
    }))
  );
}

// Handle window resize
function handleResize() {
  // Update canvas size
  const containerWidth = Math.min(800, window.innerWidth * 0.95);
  DOM.canvas.width = containerWidth;
  DOM.canvas.height = containerWidth * GAME_CONFIG.CANVAS_HEIGHT_RATIO;
  
  // Reinitialize bricks with new dimensions
  initializeBricks();
  
  // Update ball positions if needed
  if (gameState.balls.length > 0) {
    const centerX = DOM.canvas.width / 2;
    const centerY = DOM.canvas.height / 2;
    gameState.balls.forEach(ball => {
      ball.x = centerX;
      ball.y = centerY;
    });
  }
}

// Add resize event listener
window.addEventListener('resize', handleResize);

// Update initialization
function initializeGame() {
  // Set initial canvas size
  handleResize();
  
  // Create initial balls
  createInitialBalls();
  
  // Start game loop
  update();
}

// Create initial balls
function createInitialBalls() {
  const centerX = DOM.canvas.width / 2;
  const centerY = DOM.canvas.height / 2;
  
  gameState.balls = Array.from({ length: gameState.ballsCount }, () => 
    new Ball({
      x: centerX,
      y: centerY,
      size: gameState.sizeBall,
      speed: gameState.speedBall,
      power: gameState.powerBall
    })
  );
}

// Elements
let ball = {
  x: DOM.canvas.width / 2,
  y: DOM.canvas.height / 2,
  size: gameState.sizeBall,
  power: gameState.powerBall,
  speed: gameState.speedBall,
  dx: gameState.speedBall,
  dy: -gameState.speedBall,
};

function drawBall() {
  if (gameState.balls.length == 0) {
    for (let i = 0; i < gameState.ballsCount; i++) {
      gameState.balls.push(new Ball({...ball}));
    }
  }
  if (gameState.balls.length != gameState.ballsCount) {
    for (let i = gameState.balls.length; i < gameState.ballsCount; i++) {
      gameState.balls.push(new Ball({
        ...ball,
        size: gameState.sizeBall,
        power: gameState.powerBall,
        speed: gameState.speedBall
      }))
    }
  }
  gameState.balls.forEach((ball) => {
    ctx.beginPath();
    ctx.arc(ball.x, 
            ball.y,
            ball.size,
            0,
            Math.PI * 2
          );
    ctx.fillStyle = secondaryColor;
    ctx.fill();
    ctx.closePath();
  });
}

// function drawScore() {
//   ctx.font = '20px "Balsamiq Sans"';
//   ctx.fillText(`Score: ${gameState.score}`, DOM.canvas.width - 100, 30);
// }

function drawBricks() {
  gameState.bricks.forEach((column) => {
    column.forEach((brick) => {
      ctx.beginPath();
      ctx.fillStyle = brick.visible ? color : "transparent";
      ctx.rect(brick.x, brick.y, brick.w, brick.h);
      ctx.fill();
      ctx.closePath();
      ctx.beginPath();
      ctx.font = '12px "Balsamiq Sans"';
      ctx.fillStyle = brick.visible ? secondaryColor : "transparent";
      ctx.fillText(brick.hp, brick.x  + (brick.w + GAME_CONFIG.BRICK_PADDING) / 2, brick.y + (brick.h + GAME_CONFIG.BRICK_PADDING) / 2);
      ctx.fill();
      ctx.closePath();
    });
  });
}

function draw() {
  // clear
  ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
  // draw
  drawBall();
  // drawScore();
  drawBricks();
}

function moveBall() {
  const canvasRight = DOM.canvas.width;
  const canvasBottom = DOM.canvas.height;
  
  gameState.balls.forEach((ball) => {
    const oldX = ball.x;
    const oldY = ball.y;

    // Calculate movement steps based on speed
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    const steps = Math.max(1, Math.ceil(speed));
    const stepX = ball.dx / steps;
    const stepY = ball.dy / steps;

    let collisionOccurred = false;

    // Move ball in small steps
    for (let i = 0; i < steps && !collisionOccurred; i++) {
      ball.move(stepX, stepY);

      // Handle wall collisions
      handleWallCollisions(ball, canvasRight, canvasBottom);

      // Handle brick collisions
      collisionOccurred = handleBrickCollisions(ball, oldX, oldY);
      if (collisionOccurred) break;
    }
  });

  // Check level completion after all balls have moved
  checkLevelCompletion();
}

function handleWallCollisions(ball, canvasRight, canvasBottom) {
  // Horizontal walls
  if (ball.x + ball.size > canvasRight) {
    ball.x = canvasRight - ball.size;
    ball.reverseDirection('x');
  } else if (ball.x - ball.size < 0) {
    ball.x = ball.size;
    ball.reverseDirection('x');
  }

  // Vertical walls
  if (ball.y + ball.size > canvasBottom) {
    ball.y = canvasBottom - ball.size;
    ball.reverseDirection('y');
  } else if (ball.y - ball.size < 0) {
    ball.y = ball.size;
    ball.reverseDirection('y');
  }

  // Handle corner cases
  handleCornerCases(ball, canvasRight, canvasBottom);
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
  for (const column of gameState.bricks) {
    for (const brick of column) {
      if (!brick.visible) continue;

      if (checkBrickCollision(ball, brick)) {
        handleBrickCollision(ball, brick, oldX, oldY);
        return true;
      }
    }
  }
  return false;
}

function checkBrickCollision(ball, brick) {
  return ball.x + ball.size > brick.x &&
         ball.x - ball.size < brick.x + brick.w &&
         ball.y + ball.size > brick.y &&
         ball.y - ball.size < brick.y + brick.h;
}

function handleBrickCollision(ball, brick, oldX, oldY) {
  const deltaX = ball.x - oldX;
  const deltaY = ball.y - oldY;

  // Determine collision side
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    ball.reverseDirection('x');
  } else {
    ball.reverseDirection('y');
  }

  // Handle brick damage
  increaseScore();
  if (brick.hp > 1) {
    brick.hp -= ball.power;
    if (brick.hp <= 0) brick.visible = false;
  } else {
    brick.visible = false;
  }
}

function levelUp() {
  gameState.currentLevel++;
  let healthIncrease = 1; // Default increase

  // Calculate health increase based on level ranges
  if (gameState.currentLevel >= 20 && gameState.currentLevel <= 29) {
    healthIncrease = 2;
  } else if (gameState.currentLevel >= 30 && gameState.currentLevel <= 39) {
    healthIncrease = 3;
  } else if (gameState.currentLevel >= 40 && gameState.currentLevel <= 49) {
    healthIncrease = 4;
  } else if (gameState.currentLevel >= 50) {
    healthIncrease = 5;
  }

  // Update startHP with the new health increase
  gameState.startHP += healthIncrease;
  
  // Update UI to show current level
  const levelElement = document.getElementById('current-level');
  if (levelElement) {
    levelElement.textContent = `${gameState.currentLevel}`;
  }
}

function increaseScore() {
  gameState.score++;
}

function showAllBricks() {
  gameState.bricks.forEach((column) => {
    column.forEach((brick) => {
      brick.visible = true;
      brick.hp = gameState.startHP;
    });
  });
}

function drawInterface() {
  DOM.ballsCount.textContent = gameState.ballsCount;
  DOM.speedBall.textContent = gameState.speedBall.toFixed(1);
  DOM.powerBall.textContent = gameState.powerBall;
}

// Update Canvas
function update() {
  // update
  moveBall();
  // draw
  draw();
  drawInterface();
  drawScore();
  requestAnimationFrame(update);
}

// Event Listeners
DOM.btnAddBall.addEventListener("click", () => {
  gameState.ballsCount++;
  drawInterface();
});

DOM.btnIncSpeedBall.addEventListener("click", () => {
  gameState.speedBall *= GAME_CONFIG.SPEED_INCREASE_FACTOR;
  gameState.speedBall = Math.round(gameState.speedBall * 10) / 10;
  gameState.balls.forEach((ball) => {
    const signX = Math.sign(ball.dx);
    const signY = Math.sign(ball.dy);
    ball.dx = gameState.speedBall * signX;
    ball.dy = gameState.speedBall * signY;
  });
  drawInterface();
});

DOM.btnIncPowerBall.addEventListener("click", () => {
  gameState.powerBall += 1;
  gameState.balls.forEach((ball) => {
    ball.power += 1;
  });
  drawInterface();
});

DOM.controlsBtn.addEventListener("click", () => DOM.gameControls.classList.add("show"));
DOM.closeControlsBtn.addEventListener("click", () => DOM.gameControls.classList.remove("show"));
window.addEventListener("click", (e) => {
  if (e.target === DOM.gameControls) {
    DOM.gameControls.classList.remove("show");
  }
});

// Init
initializeGame();

function checkLevelCompletion() {
  // Check if all bricks are destroyed
  const allBricksDestroyed = gameState.bricks.every(column => 
    column.every(brick => !brick.visible)
  );

  if (allBricksDestroyed) {
    levelUp();
    showAllBricks();
  }
}

function drawScore() {
  DOM.score.textContent = gameState.score;
  DOM.currentLevel.textContent = gameState.currentLevel;
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

