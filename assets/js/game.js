const svg = document.getElementById('game');
const svgNS = 'http://www.w3.org/2000/svg';
const playerWidth = 40;
const playerHeight = 40;
const enemyWidth = 40;
const enemyHeight = 40;
const bulletWidth = 10;
const bulletHeight = 20;
const playerSpeed = 5;
const enemySpeed = 2;
let bulletSpeed = 8;
const fireRate = 50; // milliseconds
const enemySpawnRate = 2000; // milliseconds
const starCount = 30;
const starSize = 2;
const starSpeedMultiplier = 2;
let lastFireTime = 0;
let lastEnemySpawnTime = 0;
let score = 0;
let playerDirection = 0;
let gameOver = false;
let gameRunning = false;

let player;
let bullets = [];
let enemies = [];
let stars = [];


// Add other necessary variables and functions here
function createSVGElement(tag, attributes) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const key in attributes) {
        element.setAttribute(key, attributes[key]);
    }
    return element;
}

function createPlayer() {
    const player = createSVGElement('image', {
        width: playerWidth,
        height: playerHeight,
        href: 'assets/imgs/bitcoin.svg', // Use a Bitcoin icon SVG file
    });
    player.x.baseVal.value = svg.clientWidth / 2 - playerWidth / 2;
    player.y.baseVal.value = svg.clientHeight - playerHeight - 10;
    return player;
}

function createStar() {
    const star = createSVGElement('circle', {
        r: starSize,
        fill: 'white',
        cx: Math.random() * svg.clientWidth,
        cy: Math.random() * svg.clientHeight,
    });
    svg.appendChild(star);
    return star;
}

function initStars() {
    for (let i = 0; i < starCount; i++) {
        stars.push(createStar());
    }
}

function updateStars() {
    stars.forEach((star) => {
        star.cy.baseVal.value += enemySpeed * starSpeedMultiplier;

        if (star.cy.baseVal.value > svg.clientHeight) {
            star.cy.baseVal.value = -starSize;
            star.cx.baseVal.value = Math.random() * svg.clientWidth;
        }
    });
}

function createEnemy() {
    let sizeMultiplier = 1;
    const random = Math.random();
    if (random < 0.2) {
        sizeMultiplier = 1.5; // 20% are 50% larger
    } else if (random < 0.3) {
        sizeMultiplier = 3; // 10% are 100% larger
    }

    const enemy = createSVGElement('image', {
        width: enemyWidth * sizeMultiplier,
        height: enemyHeight * sizeMultiplier,
        href: 'assets/imgs/bank_note.svg', // Use a banknote icon SVG file
    });

    enemy.x.baseVal.value = Math.random() * (svg.clientWidth - enemy.width.baseVal.value);
    enemy.y.baseVal.value = 0;
    return enemy;
}

function createBullet(x, y) {
    // Generate a random shade of red
    const redValue = Math.floor(Math.random() * 150) + 100;
    const red = `rgb(${redValue}, 0, 0)`;
    const bullet = createSVGElement('rect', {
        width: bulletWidth,
        height: bulletHeight,
        fill: red,
        x,
        y,
    });
    return bullet;
}

function handlePlayerMovement() {
    // Compute the player speed based on their distance from the edges of the game area
    const distanceFromEdge = Math.min(player.x.baseVal.value, svg.clientWidth - playerWidth - player.x.baseVal.value);
    const t = distanceFromEdge / (svg.clientWidth / 2);
    const speed = playerSpeed * (1 / (1 + Math.exp(-t * 10)));

    // Move the player
    if (playerDirection === -1) {
        player.x.baseVal.value -= speed;
    } else if (playerDirection === 1) {
        player.x.baseVal.value += speed;
    }

    // Keep the player within the SVG container
    player.x.baseVal.value = Math.max(0, Math.min(svg.clientWidth - playerWidth, player.x.baseVal.value));
}

document.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowLeft') {
        playerDirection = -1;
    } else if (event.code === 'ArrowRight') {
        playerDirection = 1;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowLeft' && playerDirection === -1) {
        playerDirection = 0;
    } else if (event.code === 'ArrowRight' && playerDirection === 1) {
        playerDirection = 0;
    }
});

function handleBulletMovement() {
    bullets.forEach((bullet, index) => {
        if (playerDirection === 0) {
            // Triple the bullet speed when the player is not moving
            bullet.y.baseVal.value -= bulletSpeed * 5;
        } else {
            bullet.y.baseVal.value -= bulletSpeed;
        }
        if (bullet.y.baseVal.value < -bulletHeight) {
            svg.removeChild(bullet);
            bullets.splice(index, 1);
        }
    });
}

function fireBullet() {
    const now = Date.now();
    if (now - lastFireTime < fireRate) return;

    const bulletX = player.x.baseVal.value + playerWidth / 2 - bulletWidth / 2;
    const bulletY = player.y.baseVal.value - bulletHeight;
    const bullet = createBullet(bulletX, bulletY);
    bullets.push(bullet);
    svg.appendChild(bullet);

    lastFireTime = now;
}

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        fireBullet();
    }
});

function handleEnemyMovement() {
    const speedMultiplier = playerDirection === 0 ? 2 : 1;
    enemies.forEach((enemy, index) => {
        enemy.y.baseVal.value += enemySpeed * speedMultiplier;
        if (enemy.y.baseVal.value > svg.clientHeight) {
            svg.removeChild(enemy);
            enemies.splice(index, 1);
        }
    });
}

function spawnEnemy() {
    const now = Date.now();
    if (now - lastEnemySpawnTime < enemySpawnRate) return;

    const enemy = createEnemy();
    enemies.push(enemy);
    svg.appendChild(enemy);

    lastEnemySpawnTime = now;
}

function updateScoreDisplay() {
    const scoreText = document.getElementById('score');
    scoreText.textContent = `Score: ${score}`;
}

function checkCollisions() {
    enemies.forEach((enemy, enemyIndex) => {
        bullets.forEach((bullet, bulletIndex) => {
            if (bullet.x.baseVal.value < enemy.x.baseVal.value + enemy.width.baseVal.value &&
                bullet.x.baseVal.value + bulletWidth > enemy.x.baseVal.value &&
                bullet.y.baseVal.value < enemy.y.baseVal.value + enemy.height.baseVal.value &&
                bullet.y.baseVal.value + bulletHeight > enemy.y.baseVal.value) {
                svg.removeChild(bullet);
                bullets.splice(bulletIndex, 1);

                // Decrease the enemy size by 10% with each hit
                enemy.width.baseVal.value *= 0.8;
                enemy.height.baseVal.value *= 0.8;

                if (enemy.width.baseVal.value < 40) {
                    svg.removeChild(enemy);
                    enemies.splice(enemyIndex, 1);
                }

                score++;
                updateScoreDisplay();
            }
        });

        if ((player.x.baseVal.value < enemy.x.baseVal.value + enemy.width.baseVal.value &&
                player.x.baseVal.value + playerWidth > enemy.x.baseVal.value &&
                player.y.baseVal.value < enemy.y.baseVal.value + enemy.height.baseVal.value &&
                player.y.baseVal.value + playerHeight > enemy.y.baseVal.value) ||
            enemy.y.baseVal.value + enemy.height.baseVal.value > svg.clientHeight) {
            endGame();
        }
    });
}

function endGame() {
    // Stop the game loop
    cancelAnimationFrame(gameLoop);
    // Display the game over text
    const gameOverText = createSVGElement('text', {
        x: svg.clientWidth / 2,
        y: svg.clientHeight / 2,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-family': 'Arial, sans-serif',
        'font-size': '36',
        fill: 'white',
    });
    gameOverText.textContent = 'Game Over';
    svg.appendChild(gameOverText);
    // Prompt for the player's name and save the score
    const playerName = prompt("Enter your name:");
    if (playerName) {
        saveScore(playerName, score);
        displayLeaderboard();
    }
    location.reload();
}

function saveScore(name, score) {
    const savedScores = JSON.parse(localStorage.getItem('leaderboard')) || [];
    savedScores.push({ name, score });
    savedScores.sort((a, b) => b.score - a.score);
    savedScores.splice(10);
    localStorage.setItem('leaderboard', JSON.stringify(savedScores));
}

function displayLeaderboard() {
    const savedScores = JSON.parse(localStorage.getItem('leaderboard')) || [];
    const ol = document.querySelector('#leaderboard ol');
    ol.innerHTML = '';

    savedScores.forEach((entry) => {
        const li = document.createElement('li');
        li.textContent = `${entry.name}: ${entry.score}`;
        ol.appendChild(li);
    });
}

function startGame() {
    const startContainer = document.getElementById('start-container');
    startContainer.style.display = 'none';
    gameRunning = true;
    gameLoop();
}

function gameLoop() {
    handlePlayerMovement();
    handleBulletMovement();
    handleEnemyMovement();
    spawnEnemy();
    checkCollisions();
    displayLeaderboard();
    updateStars();

    requestAnimationFrame(gameLoop);
}

function init() {
    const startContainer = document.getElementById('start-container');
    startContainer.style.display = 'flex';
    initStars();
    player = createPlayer();
    svg.appendChild(player);
    displayLeaderboard();

    const startBtn = document.getElementById('startBtn');
    startBtn.addEventListener('click', startGame);
    document.addEventListener('keydown', (event) => {
        if ((event.code === 'Space')&&(gameRunning == false)) {
            startGame();
        }
    });
}
init();