var viewport = (function(){
	var self = this,
	
		x = 0,
		y = 0,
		dim = {
			width:	0,
			height:	0
		},
		
		setDimensions = function(){
			dim.width = ~~(window.innerWidth / world.cell / 2) * world.cell * 2 - 1e2;
			dim.height = ~~(window.innerHeight / world.cell / 2) * world.cell * 2 - 1e2;
			
			$('#game').css({
				height:	dim.height
			}).add('#main').css({
				width:	dim.width
			});
			
			draw.setDimensions(dim.width,dim.height);
		},
		getDimensions = function(){
			return {
				width:	dim.width,
				height:	dim.height
			};
		},
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
				move(~~(x - viewport.getDimensions().width / 2),~~(y - viewport.getDimensions().height / 2));
			}
			return {
				x:	~~(viewport.getDimensions().width / 2),
				y:	~~(viewport.getDimensions().height / 2)
			};
		};
		
	return {
		setDimensions:	setDimensions,
		getDimensions:	getDimensions,
		get:			getPosition,
		move:			move,
		moveBy:			moveBy,
		center:			center
	};
})();