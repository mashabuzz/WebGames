'use strict';

// global variables 
var blockSize, widthInBlocks, heightInBlocks, totalBlocks;
var canvas;
var game;
var ctx;


function onLoad() {
   console.log("load document ready");
   
   canvas = document.getElementById("canvas");
   console.log("canvas-width = " + canvas.width + ", canvas-height = " + canvas.height);   
   
   blockSize = 10;
   widthInBlocks = Math.floor(canvas.width / blockSize);
   heightInBlocks = Math.floor(canvas.height / blockSize);
   totalBlocks = widthInBlocks * heightInBlocks;
   
   ctx = canvas.getContext("2d");   
   game = new Game(createSnake(), createFood());
   paintScreen();
      
};


function Point(x, y) {
    this.x = x;
    this.y = y;
    
    this.toString = function () {
        return "(" + this.x + ", " + this.y + ")";
    }    
}

var SnakeMoveResults = {
    NO_INCIDENCE: 0,
    FOOD_CONSUMED: 1,
    SELF_COLLISION: 2
}

function Snake(tailBlock, initialLength, color) {
    
    this.blocks = [];
    this.direction = 'r';
    this.color = color;
    this.dirSet = [['r', 'l'], ['u', 'd']];  
    
    for (var i = 0; i < initialLength; i++) {
        this.blocks.push(tailBlock + i);
    }  
    
    this.move = function (food) {
        // console.log("Moving snake ...");
        var nextHead;
        var currentHead = this.blocks[this.blocks.length -1];
        var currentRow = Math.floor(currentHead / widthInBlocks);
        var currentCol = currentHead % widthInBlocks;        
        switch(this.direction) {
            case 'r':                
                currentCol = currentCol + 1 >= widthInBlocks ? 0 : currentCol + 1;
                break;
            case 'l':
                currentCol = currentCol -1 < 0 ? widthInBlocks - 1 : currentCol -1;
                break;
            case 'd':
                currentRow = currentRow + 1 >= heightInBlocks ? 0 : currentRow + 1;
                break;
            case 'u':
                currentRow = currentRow - 1 < 0 ? heightInBlocks - 1 : currentRow - 1;
        }
        
        nextHead = currentRow * widthInBlocks + currentCol;
        var result;
        if (nextHead === food) {
            // TODO : check that the food does not lie on the snake
            result = SnakeMoveResults.FOOD_CONSUMED;
            this.blocks.push(nextHead);
        } else if (this.blocks.indexOf(nextHead) >= 0) {
            // TODO : this is a naive way of detecting collision
            // check if we can do it more efficiently
            result = SnakeMoveResults.SELF_COLLISION;
        } else {
            this.blocks.shift();
            this.blocks.push(nextHead);
            result = SnakeMoveResults.NO_INCIDENCE;   
        }        
        return result;
    }
    
    this.changeDirection = function (newDirection) {
        var that = this;
        var findDirSetIndex = function (direction) {
            for (var i = 0; i < that.dirSet.length; i++) {
                if (that.dirSet[i].indexOf(direction) >= 0) {
                    return i;
                }
            }
            return -1;
        }
        var i1 = findDirSetIndex(this.direction);
        var i2 = findDirSetIndex(newDirection);
        console.log('i1 = ' + i1 + ', i2 = ' + i2);
        if (i1 !== i2) {
            this.direction = newDirection;
            console.log('Changed direction to ' + this.direction);
        }
    }
}


var GameState = {
    NOT_STARTED: 0,
    STARTED: 1,
    COMPLETED: 2
}


function Game(snake, food) {
    this.snake = snake;
    this.food = food;  // food is represented by an integer (the block index of the food block)
    this.score = 0;
    this.numFoodConsumed = 0;
    this.state = GameState.NOT_STARTED;
    this.jobId = -1;
    
    this.onFoodConsumed = function () {
        this.numFoodConsumed += 1;
        this.score += this.numFoodConsumed;
        this.food = createFood();
    }
    
    this.onSnakeCollision = function () {
        clearInterval(this.jobId);
        this.state = GameState.COMPLETED;        
        console.log("GAME END");
        console.log("score = " + this.score);
        // display startGame button
        document.getElementById('startButton').style.visibility = '';
    }
    
    this.startGame = function () {
        // Add key listeners
        this.state = GameState.STARTED;
        
        // hide the startGame button
        document.getElementById('startButton').style.visibility = 'hidden';
        
        var that = this;
        document.addEventListener('keydown', function (event) {
            switch(event.keyCode) {
                case 37:
                    // left
                    console.log('Left key pressed');
                    that.snake.changeDirection('l');
                    break;
                case 39:
                    // right
                    console.log('Right key pressed');
                    that.snake.changeDirection('r');
                    break;
                case 38:
                    // up
                    console.log('Up key pressed');
                    that.snake.changeDirection('u');
                    break;
                case 40:
                    // down
                    console.log('Down key pressed');
                    that.snake.changeDirection('d');
                    break;
            } 
        });        
        
        var refreshSnake = function () {
            var result = that.snake.move(that.food);
            if (result === SnakeMoveResults.FOOD_CONSUMED) {
                // food is consumed
                that.onFoodConsumed();
            } else if (result === SnakeMoveResults.SELF_COLLISION) {
                that.onSnakeCollision();
            }
            paintScreen();
        }   
        
        this.jobId = setInterval(refreshSnake, 100);     
    }
}


var createFood = function () {
    return Math.floor(Math.random() * totalBlocks);
}


var createSnake = function () {
    var snakePosition = widthInBlocks * Math.floor(heightInBlocks / 2) + Math.floor(widthInBlocks / 4);
    var initialLength = 5;
    var color = "#0A0909";
    return new Snake(snakePosition, initialLength, color);
}


var createGame = function () {
    return new Game(createSnake(), createFood());
}


var blockIndexToCoordinate = function (blockIndex) {
    var y = Math.floor(blockIndex / widthInBlocks) * blockSize;
    var x = (blockIndex % widthInBlocks) * blockSize;
    return new Point(x, y);  
}


var coordinateToBlockIndex = function (x, y) {
    return Math.floor(y / blockSize) * widthInBlocks + Math.floor(x / blockSize);
}


var paintScreen = function () {
    
    function paintRect(color, x, y, w, h) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    }
    
    // Draw the canvas
    paintRect("#00FFFF", 0, 0, canvas.width, canvas.height);
    
    // Draw the snake
    var snake = game.snake;
    snake.blocks.forEach(function (blockIndex) {
        var p = blockIndexToCoordinate(blockIndex);
        paintRect(snake.color, p.x, p.y, blockSize, blockSize);
    });
        
    if (game.state !== GameState.NOT_STARTED) {
        // Draw the food
        var p = blockIndexToCoordinate(game.food);
        paintRect('#C11A25', p.x, p.y, blockSize, blockSize);
        
        // Draw the score
        ctx.font = "15px Consolas";
        ctx.fillText("SCORE: " + game.score, 350, 40);
    }    
    
    if (game.state === GameState.COMPLETED) {
        // Draw GAME OVER
        ctx.font = "30px Arial";
        ctx.fillText("GAME OVER", 120, 230);
    }
}


function startGame() {    
    if (game.state === GameState.COMPLETED) {
        // create new game
        game = createGame();
    }
    
    game.startGame();
}