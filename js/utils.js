define([], function () {
    
    'use strict';
    console.log("Loading utils.js");
    
    function Point(x, y) {
        this.x = x;
        this.y = y;
        
        this.toString = function () {
            return "(" + this.x + ", " + this.y + ")";
        }    
    }


    function RectComponent(blockSize, widthInBlocks, heightInBlocks) {
        
        this.blockSize = blockSize;
        this.widthInBlocks = widthInBlocks;
        this.heightInBlocks = heightInBlocks;
        this.totalBlocks = widthInBlocks * heightInBlocks;
        
        this.blockIndexToCoordinate = (blockIndex) => {
            var y = Math.floor(blockIndex / widthInBlocks) * blockSize;
            var x = (blockIndex % widthInBlocks) * blockSize;
            return new Point(x, y);  
        }
        
        this.coordinateToBlockIndex = (x, y) => {
            return Math.floor(y / blockSize) * widthInBlocks + Math.floor(x / blockSize);
        }
        
        this.twoDtoOneDBlockIndex = (row, col) => {
            return row * widthInBlocks + col;
        }
    }
    
    function paintRect(ctx, color, x, y, w, h) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    }
    
    return {Point: Point, RectComponent: RectComponent, paintRect: paintRect};
        
});
