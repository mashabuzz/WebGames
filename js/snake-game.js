define(['utils'], function(utils) {
    
    'use strict';
    
    var GameState = {
        NOT_STARTED: 0,
        STARTED: 1,
        COMPLETED: 2
    }   
    
    function SnakeGame(snake, obstructions, rectComponent) {
        this.snake = snake;    
        this.startTime = null;  // to be set when the game starts
        this.obstructions = obstructions;
        
        this.createFood = function () {
            var food = Math.floor(Math.random() * rectComponent.totalBlocks);
            while(this.obstructions.has(food) || this.snake.containsBlock(food)) {
                food = Math.floor(Math.random() * rectComponent.totalBlocks);
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
        }
        
        this.startGame = function () {
            this.startTime = new Date();
            // Add key listeners
            this.state = GameState.STARTED;
            
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
        }        
            
        this.stepNext = function () {
            var movement = this.snake.move();
            var nextHead = movement.next().value;                
            if (!nextHead || this.obstructions.has(nextHead)) {
                // snake has collided with itself or with an obstruction
                this.onSnakeCollision();                
            } else if (nextHead === this.food) {
                // food consumed
                this.onFoodConsumed();
                movement.next(true);
            } else {
                // nothing happened
                movement.next(false);  
            }    
        }
            
        this.paint = function(ctx, colours, fonts) {
            var snakeColor = colours['snake'];
            var obstructionColor = colours['obstruction'];
            var backgroundColor = colours['background'];
            var foodColor = colours['food'];                
            
            var blockSize = rectComponent.blockSize;
            
            // Draw the canvas
            utils.paintRect(ctx, backgroundColor, 0, 0, canvas.width, canvas.height);
            
            // Draw the snake
            this.snake.paint(ctx, snakeColor);  
            
            // Draw obstructions
            this.obstructions.forEach(function (blockIndex) {
                var p = rectComponent.blockIndexToCoordinate(blockIndex);
                utils.paintRect(ctx, obstructionColor, p.x, p.y, blockSize, blockSize);
            });
            
            if (this.state !== GameState.NOT_STARTED) {
                // Draw the food
                var p = rectComponent.blockIndexToCoordinate(this.food);
                utils.paintRect(ctx, foodColor, p.x, p.y, blockSize, blockSize);
                
                // Draw the score
                ctx.font = fonts['score'];
                ctx.fillText("SCORE: " + this.score, 350, 40);        
            }
            
            if (this.state === GameState.COMPLETED) {
                // Draw GAME OVER
                ctx.font = fonts['gameover'];
                ctx.fillText("GAME OVER", 130, 230);
            }                  
        }        
    }
    
    return {SnakeGame: SnakeGame, GameState: GameState};
    
});