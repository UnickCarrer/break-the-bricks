const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("score");
    const livesEl = document.getElementById("lives");
    const msgEl = document.getElementById("msg");
    const restartBtn = document.getElementById("restartBtn");

    let paddle = {
      width: 70, height: 12, x: canvas.width/2 - 70/2, y: canvas.height - 20, speed: 7, dx: 0
    };
    let ball = {
      radius: 8,
      x: canvas.width/2, y: canvas.height - 32,
      speed:1,
      dx:1 * (Math.random() > 0.5 ? 1 : -1), dy: -1
    };
    const brick = { rowCount: 5, colCount: 7, width: 48, height: 15, padding: 11, offsetTop: 28, offsetLeft: 17 };
    let bricks = [];
    let score = 0, lives = 3, isRunning = true, win = false;

    function initBricks() {
      bricks = [];
      for(let r=0;r<brick.rowCount;r++){
        bricks[r] = [];
        for(let c=0;c<brick.colCount;c++){
          // Random bright color for each brick
          const color = `hsl(${Math.floor(Math.random()*350)}, 76%, 60%)`;
          bricks[r][c] = { x:0, y:0, status:1, color };
        }
      }
    }

    function drawBricks() {
      for (let r = 0; r < brick.rowCount; r++) {
        for (let c = 0; c < brick.colCount; c++) {
          if (bricks[r][c].status == 1) {
            const bX = c * (brick.width + brick.padding) + brick.offsetLeft;
            const bY = r * (brick.height + brick.padding) + brick.offsetTop;
            bricks[r][c].x = bX;
            bricks[r][c].y = bY;
            ctx.beginPath();
            ctx.rect(bX, bY, brick.width, brick.height);
            ctx.fillStyle = bricks[r][c].color;
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.closePath();
          }
        }
      }
    }

    function drawPaddle() {
      ctx.beginPath();
      ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 10);
      ctx.fillStyle = "linear-gradient(90deg, #f7971e, #ffd200)";
      ctx.fillStyle = "#ffba08";
      ctx.shadowColor = "#666";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.closePath();
    }

    function drawBall() {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2, false);
      ctx.fillStyle = "#23fae2";
      ctx.shadowColor = "#21c2ce";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.closePath();
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBricks();
      drawPaddle();
      drawBall();
    }

    function movePaddle() {
      paddle.x += paddle.dx;
      if(paddle.x < 0) paddle.x = 0;
      if(paddle.x + paddle.width > canvas.width)
        paddle.x = canvas.width - paddle.width;
    }

    function moveBall() {
      ball.x += ball.dx; ball.y += ball.dy;

      // Wall bounce
      if(ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0)
        ball.dx *= -1;
      if(ball.y - ball.radius < 0)
        ball.dy *= -1;

      // Paddle hit
      if(ball.y + ball.radius > paddle.y) {
        if(ball.x > paddle.x && ball.x < paddle.x + paddle.width){
          ball.dy *= -1;
          // Slight ball control based on where it hit the paddle
          let delta = ball.x - (paddle.x + paddle.width/2);
          ball.dx = delta * 0.18;
        }else if(ball.y + ball.radius > canvas.height){
          lives--;
          livesEl.textContent = lives;
          if(lives<=0) endGame(false);
          else resetBall();
        }
      }

      // Brick collision
      for(let r=0;r<brick.rowCount;r++){
        for(let c=0;c<brick.colCount;c++){
          let b = bricks[r][c];
          if(b.status==1){
            if(ball.x > b.x && ball.x < b.x+brick.width &&
               ball.y - ball.radius < b.y + brick.height &&
               ball.y + ball.radius > b.y){
                ball.dy *= -1;
                b.status = 0;
                score += 5;
                scoreEl.textContent = score;
                if(isWin()) endGame(true);
            }
          }
        }
      }
    }

    function resetBall() {
      ball.x = canvas.width/2;
      ball.y = canvas.height - 32;
      ball.dx = ball.speed * (Math.random() > 0.5 ? 1 : -1);
      ball.dy = -ball.speed;
      paddle.x = canvas.width/2 - paddle.width/2;
    }

    function isWin() {
      return bricks.every(row => row.every(b => b.status == 0));
    }

    function endGame(won) {
      isRunning = false;
      win = won;
      msgEl.textContent = won ? "You Win! 🏆" : "Game Over 😢 Try Again!";
      restartBtn.style.display = 'block';
      ctx.globalAlpha = 0.65;
      draw();
      ctx.globalAlpha = 1.0;
    }

    function gameLoop() {
      if (!isRunning) return;
      movePaddle();
      moveBall();
      draw();
      requestAnimationFrame(gameLoop);
    }

    // Controls
    document.addEventListener('keydown', e => {
      if (e.key === "ArrowRight") paddle.dx = paddle.speed;
      else if (e.key === "ArrowLeft") paddle.dx = -paddle.speed;
    });
    document.addEventListener('keyup', e => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") paddle.dx = 0;
    });
    // Mouse & Touch control
    canvas.addEventListener('pointerdown', function(e){
      let x0 = (e.touches ? e.touches[0].clientX : e.clientX) - canvas.getBoundingClientRect().left;
      function move(e2){
        let x = (e2.touches?e2.touches[0].clientX:e2.clientX)-canvas.getBoundingClientRect().left;
        paddle.x = Math.min(Math.max(x - paddle.width/2,0),canvas.width-paddle.width);
      }
      function stop(){
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', stop);
      }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', stop);
    });

    // Restart logic
    restartBtn.addEventListener('click', ()=>{
      score = 0; lives = 3; isRunning = true; win = false;
      scoreEl.textContent = score;
      livesEl.textContent = lives;
      msgEl.textContent = '';
      restartBtn.style.display = 'none';
      initBricks();
      resetBall();
      gameLoop();
    });

    // Init
    initBricks();
    resetBall();
    gameLoop();