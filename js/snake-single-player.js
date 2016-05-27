define(['utils', 'snake', 'snake-game'], function(utils, Snake, snake_game) {
    
    'use strict';
    
    var SnakeGame = snake_game.SnakeGame;
    var GameState = snake_game.GameState;
    
    var blockSize = 10;
    var rectComponent;
    
    console.log("load document ready");   
    var canvas = document.getElementById("canvas");
    console.log("canvas-width = " + canvas.width + ", canvas-height = " + canvas.height);   
    
    (function() {
        var widthInBlocks = Math.floor(canvas.width / blockSize);
        var heightInBlocks = Math.floor(canvas.height / blockSize);
        var totalBlocks = widthInBlocks * heightInBlocks;
        rectComponent = new utils.RectComponent(blockSize, widthInBlocks, heightInBlocks);  
    })();  
        
    var ctx = canvas.getContext("2d");    
    
    var colours = {
            background: "#FAFAFA",
            snake: "#17202A",
            obstruction: "#1F618D",
            food: "#1D8348"
    };  
        
    var fonts = {
            score: "15px Consolas",
            gameover: "30px Arial"
    }; 
    
    var game = createGame();
    game.paint(ctx, colours, fonts);          

    function createGame() {
        
        function createSnake() {
            var initialLength = 6;
            var tailBlock = rectComponent.twoDtoOneDBlockIndex(2, 2);
            var blocks = [];    
            for (var i = 0; i < initialLength; i++) {
                blocks.push(tailBlock + i);
            }    
            return new Snake(blocks, rectComponent);
        }
        
        return new SnakeGame(createSnake(), createObstructions(), rectComponent);
    }


    function createObstructions() {
        // TODO simplify    
        var widthInBlocks = rectComponent.widthInBlocks;
        var heightInBlocks = rectComponent.heightInBlocks;
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

    function postScoreToServer(score, startTime, endTime) {    
        $.ajax({
            type: 'POST',              
            url: 'scores',
            contentType: 'application/json',  
            data: JSON.stringify({'score': score, 'game': 'vintage-snake', 'start_time': startTime, 'end_time': endTime}),
            success: function() {
                console.log('Successfully posted data to server');
            }
        });
    }


    function startGame() {    
        console.log("start game ...");
        
        // hide the startGame button
        document.getElementById('startButton').style.visibility = 'hidden';
        
        if (game.state === GameState.COMPLETED) {
            // create new game
            game = createGame();
        }    
        game.startGame();
        
        var jobId = setInterval(refresh, 100);
        
        function refresh() {
            game.stepNext();
            game.paint(ctx, colours, fonts);
            
            if (game.state === GameState.COMPLETED) {
                clearInterval(jobId);   
                // display startGame button
                document.getElementById('startButton').style.visibility = '';              
                postScoreToServer(game.score, game.startTime, new Date());
            }
        }       
    } 
    
    return startGame;  
    
});