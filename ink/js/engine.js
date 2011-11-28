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
			var x = me.position.at.x,
				y = me.position.at.y;
			if(!dontMove){
				move(~~(x - world.dim.view.x / 2),~~(y - world.dim.view.y / 2));
			}
			return {
				x:	~~(world.dim.view.x / 2),
				y:	~~(world.dim.view.y / 2)
			};
		};
		
	return {
		get:		getPosition,
		move:		move,
		moveBy:		moveBy,
		center:		center
	};
})();