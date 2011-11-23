var viewport = (function(){
	var self = this,
	
		x = 0,
		y = 0,
		
		getPosition = function(){
			return {
				x:	x,
				y:	y
			};
		},
		move = function(newX,newY){
			x = (typeof newX === 'number') ? newX : x;
			y = (typeof newY === 'number') ? newY : y;
		},
		moveBy = function(newX,newY){
			move(x + newX,y + newY);
		},
		center = function(dontMove){
			var x = me.x,
				y = me.y;
			if(!dontMove){
				move(~~(x - world.dim.x / 2),~~(y - world.dim.y / 2));
			}
			return {
				x:	~~(world.dim.x / 2),
				y:	~~(world.dim.y / 2)
			};
		};
		
	return {
		get:		getPosition,
		move:		move,
		moveBy:		moveBy,
		center:		center
	};
})();