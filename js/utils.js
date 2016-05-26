define([], function () {
    
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
        this.heightInBlocks;
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
    
    return {Point: Point, RectComponent: RectComponent};
        
});
