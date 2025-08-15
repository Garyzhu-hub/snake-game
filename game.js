class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        
        // 游戏设置
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // 游戏状态
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.highScoreElement.textContent = this.highScore;
        
        // 蛇的初始状态
        this.snake = [
            {x: 10, y: 10}
        ];
        this.dx = 0;
        this.dy = 0;
        
        // 食物位置
        this.apple = {
            x: 15,
            y: 15
        };
        
        // 宝箱道具
        this.treasure = null;
        this.treasureSpawnChance = 0.1; // 10%的概率生成宝箱
        this.treasureTimer = 0;
        this.treasureLifetime = 100; // 宝箱存在时间（游戏循环次数）
        
        this.initializeControls();
        this.setupKeyboardControls();
        this.drawGame();
    }
    
    initializeControls() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const resetBtn = document.getElementById('resetBtn');
        
        startBtn.addEventListener('click', () => this.startGame());
        pauseBtn.addEventListener('click', () => this.togglePause());
        resetBtn.addEventListener('click', () => this.resetGame());
    }
    
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused) return;
            
            // 防止蛇反向移动
            switch(e.key) {
                case 'ArrowUp':
                    if (this.dy !== 1) {
                        this.dx = 0;
                        this.dy = -1;
                    }
                    break;
                case 'ArrowDown':
                    if (this.dy !== -1) {
                        this.dx = 0;
                        this.dy = 1;
                    }
                    break;
                case 'ArrowLeft':
                    if (this.dx !== 1) {
                        this.dx = -1;
                        this.dy = 0;
                    }
                    break;
                case 'ArrowRight':
                    if (this.dx !== -1) {
                        this.dx = 1;
                        this.dy = 0;
                    }
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
    }
    
    startGame() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.gamePaused = false;
            this.dx = 1;
            this.dy = 0;
            this.gameLoop();
            
            document.getElementById('startBtn').disabled = true;
            document.getElementById('pauseBtn').disabled = false;
        }
    }
    
    togglePause() {
        if (this.gameRunning) {
            this.gamePaused = !this.gamePaused;
            const pauseBtn = document.getElementById('pauseBtn');
            pauseBtn.textContent = this.gamePaused ? '继续' : '暂停';
            
            if (!this.gamePaused) {
                this.gameLoop();
            }
        }
    }
    
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.scoreElement.textContent = this.score;
        
        this.snake = [{x: 10, y: 10}];
        this.dx = 0;
        this.dy = 0;
        
        // 重置宝箱状态
        this.treasure = null;
        this.treasureTimer = 0;
        
        this.generateApple();
        this.drawGame();
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = '暂停';
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        setTimeout(() => {
            this.clearCanvas();
            this.moveSnake();
            this.drawApple();
            
            // 宝箱逻辑
            this.updateTreasure();
            if (this.treasure) {
                this.drawTreasure();
            }
            
            this.drawSnake();
            
            if (this.checkCollision()) {
                this.gameOver();
                return;
            }
            
            if (this.checkAppleCollision()) {
                this.eatApple();
            }
            
            if (this.treasure && this.checkTreasureCollision()) {
                this.eatTreasure();
            }
            
            this.gameLoop();
        }, 150);
    }
    
    clearCanvas() {
        this.ctx.fillStyle = '#2d3748';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawSnake() {
        this.ctx.fillStyle = '#48bb78';
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            const size = this.gridSize - 2;
            
            if (index === 0) {
                // 绘制蛇头
                this.ctx.fillStyle = '#38a169';
                this.ctx.fillRect(x, y, size, size);
                
                // 绘制眼睛
                this.ctx.fillStyle = '#ffffff';
                const eyeSize = 4;
                const eyeOffset = 4;
                
                // 根据移动方向调整眼睛位置
                let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
                let antennaX1, antennaY1, antennaX2, antennaY2;
                
                if (this.dx === 1) { // 向右
                    leftEyeX = x + size - eyeOffset - eyeSize;
                    leftEyeY = y + eyeOffset;
                    rightEyeX = x + size - eyeOffset - eyeSize;
                    rightEyeY = y + size - eyeOffset - eyeSize;
                    // 触角
                    antennaX1 = x + size;
                    antennaY1 = y + 3;
                    antennaX2 = x + size;
                    antennaY2 = y + size - 3;
                } else if (this.dx === -1) { // 向左
                    leftEyeX = x + eyeOffset;
                    leftEyeY = y + eyeOffset;
                    rightEyeX = x + eyeOffset;
                    rightEyeY = y + size - eyeOffset - eyeSize;
                    // 触角
                    antennaX1 = x - 2;
                    antennaY1 = y + 3;
                    antennaX2 = x - 2;
                    antennaY2 = y + size - 3;
                } else if (this.dy === -1) { // 向上
                    leftEyeX = x + eyeOffset;
                    leftEyeY = y + eyeOffset;
                    rightEyeX = x + size - eyeOffset - eyeSize;
                    rightEyeY = y + eyeOffset;
                    // 触角
                    antennaX1 = x + 3;
                    antennaY1 = y - 2;
                    antennaX2 = x + size - 3;
                    antennaY2 = y - 2;
                } else { // 向下或静止
                    leftEyeX = x + eyeOffset;
                    leftEyeY = y + size - eyeOffset - eyeSize;
                    rightEyeX = x + size - eyeOffset - eyeSize;
                    rightEyeY = y + size - eyeOffset - eyeSize;
                    // 触角
                    antennaX1 = x + 3;
                    antennaY1 = y + size + 2;
                    antennaX2 = x + size - 3;
                    antennaY2 = y + size + 2;
                }
                
                // 绘制眼睛白色部分
                this.ctx.fillRect(leftEyeX, leftEyeY, eyeSize, eyeSize);
                this.ctx.fillRect(rightEyeX, rightEyeY, eyeSize, eyeSize);
                
                // 绘制眼珠
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(leftEyeX + 1, leftEyeY + 1, 2, 2);
                this.ctx.fillRect(rightEyeX + 1, rightEyeY + 1, 2, 2);
                
                // 绘制触角
                this.ctx.strokeStyle = '#2d5016';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(antennaX1, antennaY1);
                this.ctx.lineTo(antennaX1 + (this.dx * 6 || (this.dy === -1 ? -3 : 3)), antennaY1 + (this.dy * 6 || (this.dx === 1 ? -3 : 3)));
                this.ctx.moveTo(antennaX2, antennaY2);
                this.ctx.lineTo(antennaX2 + (this.dx * 6 || (this.dy === -1 ? 3 : -3)), antennaY2 + (this.dy * 6 || (this.dx === 1 ? 3 : -3)));
                this.ctx.stroke();
                
                // 触角末端小圆点
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.beginPath();
                this.ctx.arc(antennaX1 + (this.dx * 6 || (this.dy === -1 ? -3 : 3)), antennaY1 + (this.dy * 6 || (this.dx === 1 ? -3 : 3)), 1.5, 0, 2 * Math.PI);
                this.ctx.arc(antennaX2 + (this.dx * 6 || (this.dy === -1 ? 3 : -3)), antennaY2 + (this.dy * 6 || (this.dx === 1 ? 3 : -3)), 1.5, 0, 2 * Math.PI);
                this.ctx.fill();
                
            } else {
                // 绘制蛇身
                this.ctx.fillStyle = '#48bb78';
                this.ctx.fillRect(x, y, size, size);
            }
        });
    }
    
    moveSnake() {
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        this.snake.unshift(head);
        
        // 如果没有吃到苹果，移除尾部
        if (head.x !== this.apple.x || head.y !== this.apple.y) {
            this.snake.pop();
        }
    }
    
    drawApple() {
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(
            this.apple.x * this.gridSize,
            this.apple.y * this.gridSize,
            this.gridSize - 2,
            this.gridSize - 2
        );
    }
    
    generateApple() {
        let newApple;
        do {
            newApple = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === newApple.x && segment.y === newApple.y));
        
        this.apple = newApple;
    }
    
    checkAppleCollision() {
        return this.snake[0].x === this.apple.x && this.snake[0].y === this.apple.y;
    }
    
    eatApple() {
        this.score += 10;
        this.scoreElement.textContent = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
        
        this.generateApple();
    }
    
    checkCollision() {
        const head = this.snake[0];
        
        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return true;
        }
        
        // 检查自身碰撞
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    gameOver() {
        this.gameRunning = false;
        this.gamePaused = false;
        
        // 显示游戏结束信息
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏结束!', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`最终得分: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = '暂停';
    }
    
    updateTreasure() {
        // 如果没有宝箱，随机生成
        if (!this.treasure) {
            if (Math.random() < this.treasureSpawnChance) {
                this.generateTreasure();
                this.treasureTimer = 0;
            }
        } else {
            // 宝箱存在时间计时
            this.treasureTimer++;
            if (this.treasureTimer >= this.treasureLifetime) {
                this.treasure = null;
                this.treasureTimer = 0;
            }
        }
    }
    
    generateTreasure() {
        let newTreasure;
        do {
            newTreasure = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (
            this.snake.some(segment => segment.x === newTreasure.x && segment.y === newTreasure.y) ||
            (newTreasure.x === this.apple.x && newTreasure.y === this.apple.y)
        );
        
        this.treasure = newTreasure;
    }
    
    drawTreasure() {
        if (!this.treasure) return;
        
        const x = this.treasure.x * this.gridSize;
        const y = this.treasure.y * this.gridSize;
        const size = this.gridSize - 2;
        
        // 绘制宝箱主体（金色）
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillRect(x + 2, y + 4, size - 4, size - 6);
        
        // 绘制宝箱盖子（深金色）
        this.ctx.fillStyle = '#b8860b';
        this.ctx.fillRect(x + 1, y + 2, size - 2, 6);
        
        // 绘制宝箱锁扣
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(x + size/2 - 1, y + 3, 2, 4);
        
        // 绘制闪光效果
        const time = Date.now() * 0.01;
        const alpha = (Math.sin(time) + 1) * 0.3 + 0.2;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.fillRect(x + 3, y + 5, 3, 2);
        this.ctx.fillRect(x + size - 6, y + size - 4, 2, 2);
    }
    
    checkTreasureCollision() {
        return this.snake[0].x === this.treasure.x && this.snake[0].y === this.treasure.y;
    }
    
    eatTreasure() {
        // 增加两节身体
        const tail = this.snake[this.snake.length - 1];
        this.snake.push({x: tail.x, y: tail.y});
        this.snake.push({x: tail.x, y: tail.y});
        
        // 增加分数
        this.score += 50;
        this.scoreElement.textContent = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
        
        // 移除宝箱
        this.treasure = null;
        this.treasureTimer = 0;
    }
    
    drawGame() {
        this.clearCanvas();
        this.drawApple();
        if (this.treasure) {
            this.drawTreasure();
        }
        this.drawSnake();
    }
}

// 初始化游戏
window.addEventListener('load', () => {
    new SnakeGame();
});