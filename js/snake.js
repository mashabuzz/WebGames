define(['utils'], function(utils) {   
    
    'use strict';
    
    function Snake(blocks, rectComponent) {
        
        this._blocks = blocks;
        this._direction = 'r';        
        this._dirSet = [['r', 'l'], ['u', 'd']];
        this._pendingInstructions = [];
        
        var widthInBlocks = rectComponent.widthInBlocks;
        var heightInBlocks = rectComponent.heightInBlocks;
        
        
        this.addInstruction = function (direction) {
            this._pendingInstructions.push(direction);
        }
          
        
        this.changeDirection = function(newDirection) {        
            var findDirSetIndex = function (direction, dirSet) {
                for (var i = 0; i < dirSet.length; i++) {
                    if (dirSet[i].indexOf(direction) >= 0) {
                        return i;
                    }
                }
                return -1;
            }
            var i1 = findDirSetIndex(this._direction, this._dirSet);
            var i2 = findDirSetIndex(newDirection, this._dirSet);
            console.log('i1 = ' + i1 + ', i2 = ' + i2);
            if (i1 !== i2) {
                this._direction = newDirection;
                console.log('Changed direction to ' + this._direction);
            }
        }
        
        this.containsBlock = function(block) {
            return this._blocks.indexOf(block) >= 0;
        }
        
        this.move = function* () {
            // console.log("Moving snake ...");
            var nextHead;
            var currentHead = this._blocks[this._blocks.length -1];
            var currentRow = Math.floor(currentHead / widthInBlocks);
            var currentCol = currentHead % widthInBlocks;  
            var pendingDirection = this._pendingInstructions.shift();
            if (pendingDirection) {
                this.changeDirection(pendingDirection);
            }      
            
            switch(this._direction) {
                case 'r':                
                    currentCol = currentCol + 1 >= rectComponent.widthInBlocks ? 0 : currentCol + 1;
                    break;
                case 'l':
                    currentCol = currentCol -1 < 0 ? rectComponent.widthInBlocks - 1 : currentCol -1;
                    break;
                case 'd':
                    currentRow = currentRow + 1 >= rectComponent.heightInBlocks ? 0 : currentRow + 1;
                    break;
                case 'u':
                    currentRow = currentRow - 1 < 0 ? rectComponent.heightInBlocks - 1 : currentRow - 1;
            }
            
            nextHead = rectComponent.twoDtoOneDBlockIndex(currentRow, currentCol);
            
            if (this._blocks.indexOf(nextHead) >= 0) {
                return null;
            } else {
                var foodConsumed = yield nextHead;
                if (!foodConsumed) {
                    this._blocks.shift();
                }                
                this._blocks.push(nextHead);
            }
        }
        
        this.paint = function(ctx, colour) {            
            this._blocks.forEach(function (blockIndex) {
                var p = rectComponent.blockIndexToCoordinate(blockIndex);
                utils.paintRect(ctx, colour, p.x, p.y, rectComponent.blockSize, rectComponent.blockSize);
            });
        }
    }
    
    return Snake;
});