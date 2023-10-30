'use client';
import React from 'react'
import { useEffect } from 'react'

const Gameboard = () => {
  let speed: number = 1;

  // Board
  let board: HTMLCanvasElement;
  let boardWidth = 360;
  let boardHeight = 640;
  let context: CanvasRenderingContext2D;

  // Bird
  let birdWidth: number = 51; // width/height ratio = 408/228 = 17/12
  let birdHeight: number = 36;
  let birdX: number = boardWidth / 8;
  let birdY: number = boardHeight / 2;
  const birdImg: CanvasImageSource[] = [];

  // Bird Tilt & Flapping
  const maxRotation = 25;
  let tilt: number;
  let rotationVelocity: number = 20;
  let animationTime: number = 20 / speed;
  const birdImgPaths = ["/TWT/bird1.png", "/TWT/bird2.png", "/TWT/bird3.png"]
  let tickCount: number = 0;
  let imgCount: number = 0;


  let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight,
    tilt: 0,
    tickCount: tickCount,
    rotationVelocity: rotationVelocity,
  }

  // Pipes
  let pipeArray: any = [];
  let pipeWidth: number = 64; // width/height ratio = 384/3072 = 1/8
  let pipeHeight: number = 512;
  let pipeX: number = boardWidth;
  let pipeY: number = 0;

  let topPipeImg: CanvasImageSource;
  let bottomPipeImg: CanvasImageSource;

  // Game Physics
  let velocityX: number = -0.5 * speed; // Pipes moving left at 2px / 4
  let velocityY: number = 0; // Bird jump speed
  let gravity: number = 0.02 * speed;

  // Game State
  let gameOver: boolean = false;
  let score: any = 0;

  useEffect(() => {
    board = document.getElementById('game') as HTMLCanvasElement;
    if (board) {
      board.width = boardWidth;
      board.height = boardHeight;
      context = board.getContext('2d')!;

      // load Flappy Bird
      birdImgPaths.forEach((path, index) => {
        const img = new Image();
        img.src = path;
        img.onload = function () {
          birdImg[index] = img;
          context.rotate(bird.tilt);
          context.drawImage(birdImg[0], bird.x, bird.y, bird.width, bird.height)
        }
      })


      // load Pipes
      topPipeImg = new Image();
      topPipeImg.src = "/KYC/toppipe.png";

      bottomPipeImg = new Image();
      bottomPipeImg.src = "/KYC/bottompipe.png";

      requestAnimationFrame(update);
      const intervalId = setInterval(placePipes, 1500 / speed); // place pipes every 1.5 seconds
      document.addEventListener("keydown", moveBird);
      return () => {
        clearInterval(intervalId);
      };

    }
  }, []);

  // At the top of your component, near other variable declarations:
  let birdImgSequence = [0, 1, 2, 1]; // Defines the sequence
  let imgSequenceIndex = 0;  // Current position in the sequence
  let frameCount = 0;

  function update() {
    requestAnimationFrame(update);
    if (gameOver) {
      return;
    }
    context.clearRect(0, 0, board.width, board.height);

    frameCount++;  // Increment frame count
    if (frameCount % animationTime === 0) {  // Change bird image every 'animationTime' frames
      imgSequenceIndex = (imgSequenceIndex + 1) % birdImgSequence.length;  // Cycle through birdImgSequence
      imgCount = birdImgSequence[imgSequenceIndex];
    }

    // bird
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0);  // bird cannot go further than top of the board

    if (birdImg[imgCount]) {
      context.drawImage(birdImg[imgCount], bird.x, bird.y, bird.width, bird.height);
    }

    if (bird.y > board.height) {
      gameOver = true;
    }

    // pipes
    for (let i = 0; i < pipeArray.length; i++) {
      let pipe = pipeArray[i];
      pipe.x += velocityX;
      context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

      if (!pipe.passed && bird.x > pipe.x + pipe.width) {
        score += 0.5;
        pipe.passed = true;
      }

      if (detectCollision(bird, pipe)) {
        gameOver = true;
      }
    }

    // Clear pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
      pipeArray.shift(); // removes first element from the array when they are past the canvas
    }

    // Display score
    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText(score, 5, 45);

    if (gameOver) {
      context.fillText("GAME OVER", 60, 200)
    }
  }

  function placePipes() {
    if (gameOver) {
      return;
    }

    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    let openingSpace = board.height / 4;

    let topPipe = {
      img: topPipeImg,
      x: pipeX,
      y: randomPipeY,
      width: pipeWidth,
      height: pipeHeight,
      passed: false
    }
    pipeArray.push(topPipe);

    let bottomPipe = {
      img: bottomPipeImg,
      x: pipeX,
      y: randomPipeY + pipeHeight + openingSpace,
      width: pipeWidth,
      height: pipeHeight,
      passed: false
    }
    pipeArray.push(bottomPipe);
  }

  function moveBird(e: { code: string; }) {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyX") {
      // jump
      jump();

      // Rotation
      let d = velocityY * tickCount + 1.5 * tickCount ** 2;
      if (d >= 16) {
        d = 4;
      }

      if (d < 0) {
        d -= 0.5;
      }

      if (d < 0 || bird.y < birdY + 12.5) {
        if (bird.tilt < maxRotation) {
          bird.tilt = -maxRotation;
        }
        if (bird.tilt < -90) {
          bird.tilt -= rotationVelocity;
        }
      }

      // reset game
      if (gameOver) {
        bird.y = birdY;
        pipeArray = [];
        score = 0;
        gameOver = false;
      }
    }
  }

  function jump() {
    velocityY = -1.5;
    tickCount = 0;
  }



  function detectCollision(a: { x: any; y: any; width: any; height: any; }, b: { x: number; width: any; y: number; height: any; }) {
    return a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y;
  }

  return (
    <div>
      <canvas id="game"
        width={boardWidth}
        height={boardHeight}
        style={{ width: `${boardWidth}px`, height: `${boardHeight}px` }}
        className="w-full h-full">
      </canvas>
    </div>
  )
}

export default Gameboard