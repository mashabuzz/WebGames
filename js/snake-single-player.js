define(['utils'], function(utils) {
    
    'use strict';
    
    console.log("loading snake-single-player.js");
    
    var canvas;
    var game;
    var ctx;
    var rectComponent;
    
    console.log("load document ready");   
    canvas = document.getElementById("canvas");
    console.log("canvas-width = " + canvas.width + ", canvas-height = " + canvas.height);   
        
    var blockSize = 10;
    var widthInBlocks = Math.floor(canvas.width / blockSize);
    var heightInBlocks = Math.floor(canvas.height / blockSize);
    var totalBlocks = widthInBlocks * heightInBlocks;
    rectComponent = new utils.RectComponent(blockSize, widthInBlocks, heightInBlocks);    
    
    var SnakeMoveResults = {
        NO_INCIDENCE: 0,
        FOOD_CONSUMED: 1,
        COLLISION: 2
    }
    
    
    var GameState = {
        NOT_STARTED: 0,
        STARTED: 1,
        COMPLETED: 2
    }    
    
    ctx = canvas.getContext("2d");   
    game = createGame();
    paintScreen();    
    
    function Snake(tailBlock, initialLength, color) {
        
        this.blocks = [];
        this.direction = 'r';
        this.color = color;
        this.dirSet = [['r', 'l'], ['u', 'd']];
        this.pendingInstructions = [];
        
        this.addInstruction = function (direction) {
            this.pendingInstructions.push(direction);
        }
        
        for (var i = 0; i < initialLength; i++) {
            this.blocks.push(tailBlock + i);
        }  
        
        this.move = function (food, obstructions) {
            // console.log("Moving snake ...");
            var nextHead;
            var currentHead = this.blocks[this.blocks.length -1];
            var currentRow = Math.floor(currentHead / widthInBlocks);
            var currentCol = currentHead % widthInBlocks;  
            var pendingDirection = this.pendingInstructions.shift();
            if (pendingDirection) {
                this.changeDirection(pendingDirection);
            }      
            
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
                result = SnakeMoveResults.COLLISION;
            } else if (obstructions.has(nextHead)) {
                // collision with an obstruction
                result = SnakeMoveResults.COLLISION;
            } else {
                this.blocks.shift();
                this.blocks.push(nextHead);
                result = SnakeMoveResults.NO_INCIDENCE;   
            }        
            return result;
        }
        
        this.changeDirection = function (newDirection) {        
            var findDirSetIndex = function (direction, dirSet) {
                for (var i = 0; i < dirSet.length; i++) {
                    if (dirSet[i].indexOf(direction) >= 0) {
                        return i;
                    }
                }
                return -1;
            }
            var i1 = findDirSetIndex(this.direction, this.dirSet);
            var i2 = findDirSetIndex(newDirection, this.dirSet);
            console.log('i1 = ' + i1 + ', i2 = ' + i2);
            if (i1 !== i2) {
                this.direction = newDirection;
                console.log('Changed direction to ' + this.direction);
            }
        }
    }
    
    
    function Game(snake) {
        this.snake = snake;    
        this.startTime = null;
        this.obstructions = createObstructions();
        
        this.createFood = function () {
            var food = Math.floor(Math.random() * totalBlocks);
            while(this.obstructions.has(food) || this.snake.blocks.indexOf(food) != -1) {
                food = Math.floor(Math.random() * totalBlocks);
            }
            return food;
        }
            
        this.food = this.createFood();  // food is represented by an integer (the block index of the food block)
        this.score = 0;
        this.numFoodConsumed = 0;
        this.state = GameState.NOT_STARTED;
        this.jobId = -1;   
        
        this.onFoodConsumed = function () {
            this.numFoodConsumed += 1;
            this.score += this.numFoodConsumed;
            this.food = this.createFood();
        }
        
        this.onSnakeCollision = function () {
            clearInterval(this.jobId);
            this.state = GameState.COMPLETED;        
            console.log("GAME END");
            console.log("score = " + this.score);
            // display startGame button
            document.getElementById('startButton').style.visibility = '';
            postScoreToServer('rahul', this.score, this.startTime, new Date());
        }
        
        this.startGame = function () {
            this.startTime = new Date();
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
                        that.snake.addInstruction('l');
                        break;
                    case 39:
                        // right
                        console.log('Right key pressed');
                        that.snake.addInstruction('r');
                        break;
                    case 38:
                        // up
                        console.log('Up key pressed');
                        that.snake.addInstruction('u');
                        break;
                    case 40:
                        // down
                        console.log('Down key pressed');
                        that.snake.addInstruction('d');
                        break;
                } 
            });        
            
            var refreshSnake = function () {
                var result = that.snake.move(that.food, that.obstructions);
                if (result === SnakeMoveResults.FOOD_CONSUMED) {
                    // food is consumed
                    that.onFoodConsumed();
                } else if (result === SnakeMoveResults.COLLISION) {
                    that.onSnakeCollision();
                }
                paintScreen();
            }   
            
            this.jobId = setInterval(refreshSnake, 100);     
        }
    }    
   
   
    function createSnake() {
        var initialLength = 6;
        var snakePosition = rectComponent.twoDtoOneDBlockIndex(2, 2);    
        var color = "#17202A";
        return new Snake(snakePosition, initialLength, color);
    }


    function createGame() {
        return new Game(createSnake());
    }


    function createObstructions() {
        // TODO simplify    
        var width = Math.floor(widthInBlocks / 7);
        var r1, r2, r3, r4;
        r1 = Math.floor (1.5 * heightInBlocks / 8);
        r2 = Math.floor (2.5 * heightInBlocks / 8);   
        r3 = heightInBlocks - r2;
        r4 = heightInBlocks - r1;
        
        var rows = [[r2, r3], [r1, r4], [r2, r3]];  
        
        var n = 3;
        var margin = Math.floor(.10 * widthInBlocks);
        var effectiveWidth = Math.floor((widthInBlocks - 2*margin) / n);
        var diff = Math.floor((effectiveWidth - width)/2);
        
        var cols = [];
        for (var i=0; i<n; i++) {
            var c = margin + i*effectiveWidth;
            cols[i] = c + diff;
        }
        
        var s1 = new Set();
        // horizontal walls
        for (var i=0; i<n; i++) {
            for (var j=0; j<width; j++) {
                s1.add(rectComponent.twoDtoOneDBlockIndex(rows[i][0]-1, cols[i] + j));
                s1.add(rectComponent.twoDtoOneDBlockIndex(rows[i][0], cols[i] + j));
                
                s1.add(rectComponent.twoDtoOneDBlockIndex(rows[i][1], cols[i] + j));   
                s1.add(rectComponent.twoDtoOneDBlockIndex(rows[i][1]+1, cols[i] + j));         
            }        
        }    
        
        var c1 = cols[0] + Math.floor(width / 2);
        var c2 = cols[cols.length - 1] + Math.floor(width / 2);
        
        var r = Math.floor((r3 + r2) / 2 - width/2);
        // vertical walls
        for (var i=0; i<width; i++) {
            s1.add(rectComponent.twoDtoOneDBlockIndex(r+i, c1-1));
            s1.add(rectComponent.twoDtoOneDBlockIndex(r+i, c1));
            
            s1.add(rectComponent.twoDtoOneDBlockIndex(r+i, c2));
            s1.add(rectComponent.twoDtoOneDBlockIndex(r+i, c2+1));        
        }
        return s1;    
    }


    function paintScreen() {
        
        function paintRect(color, x, y, w, h) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, w, h);
        }
        
        // Draw the canvas
        paintRect("#FAFAFA", 0, 0, canvas.width, canvas.height);
        
        // Draw the snake
        var snake = game.snake;
        snake.blocks.forEach(function (blockIndex) {
            var p = rectComponent.blockIndexToCoordinate(blockIndex);
            paintRect(snake.color, p.x, p.y, blockSize, blockSize);
        });
        
        // Draw obstructions
        game.obstructions.forEach(function (blockIndex) {
            var p = rectComponent.blockIndexToCoordinate(blockIndex);
            paintRect("#1F618D", p.x, p.y, blockSize, blockSize);
        });
            
        if (game.state !== GameState.NOT_STARTED) {
            // Draw the food
            var p = rectComponent.blockIndexToCoordinate(game.food);
            paintRect('#1D8348', p.x, p.y, blockSize, blockSize);
            
            // Draw the score
            ctx.font = "15px Consolas";
            ctx.fillText("SCORE: " + game.score, 350, 40);        
        }    
        
        if (game.state === GameState.COMPLETED) {
            // Draw GAME OVER
            ctx.font = "30px Arial";
            ctx.fillText("GAME OVER", 130, 230);
        }
    }


    function postScoreToServer(userId, score, startTime, endTime) {    
        $.ajax({
            type: 'POST',              
            url: 'scores',
            contentType: 'application/json',  
            data: JSON.stringify({'score': score, 'userId': userId, 'game': 'vintage-snake', 'start_time': startTime, 'end_time': endTime}),
            success: function() {
                console.log('Successfully posted data to server');
            }
        });
    }


    function startGame() {    
        if (game.state === GameState.COMPLETED) {
            // create new game
            game = createGame();
        }    
        game.startGame();
    } 
    
    return startGame;  
    
});