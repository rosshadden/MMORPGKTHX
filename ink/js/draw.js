var	draw = (function(){
	var	self = this;
		self.howManyCircles = 4;
		self.circles = [];
	var	easel = {
			grid:		$('#grid').attr({
				width:	world.dim.x,
				height:	world.dim.y
			})[0].getContext('2d'),
			background:	$('#background').attr({
				width:	world.dim.x,
				height:	world.dim.y
			})[0].getContext('2d'),
			ground:		$('#ground').attr({
				width:	world.dim.x,
				height:	world.dim.y
			})[0].getContext('2d'),
			foreground:	$('#foreground').attr({
				width:	world.dim.x,
				height:	world.dim.y
			})[0].getContext('2d'),
			players:	$('#players').attr({
				width:	world.dim.x,
				height:	world.dim.y
			})[0].getContext('2d')
		},
		scrap = function(canvas){
			clear(0,0,world.dim.x,world.dim.y,canvas);
		},
		clear = function(x,y,x2,y2,canvas){
			easel[canvas || 'ground'].clearRect(x,y,x2,y2);
		},
		terrain = function(){
			easel.background.fillStyle = '#386447';
			easel.background.beginPath();
			easel.background.fillRect(0,0,world.dim.x,world.dim.y);
			easel.background.closePath;
			easel.background.fill();
		},
		path = function(x,y,x2,y2,canvas,options){
			var defaults = {
				width:		1,
				color:		'rgba(0,0,0,1)',
				lineCap:	'round',
				lineJoin:	'round'
			};
			options = $.extend(defaults,options);
			switch(typeof canvas){
				case 'string':
					canvas = easel[canvas];
					break;
				case 'undefined':
					canvas = easel.foreground;
					break;
			}
			canvas.beginPath();
			canvas.moveTo(x,y);
			canvas.lineTo(x2,y2);
			canvas.strokeStyle = options.color;
			canvas.lineWidth = options.width;
			canvas.lineJoin = options.lineJoin;
			canvas.lineCap = options.lineCap;
			canvas.stroke();
		},
		object = function(item,canvas){
			if(item.type === 'building' || item.type === 'structure' || item.type === 'item'){
				var i,j,except,
					image = new Image(),
					where = world.toXY(item.where),
					canvas = canvas || easel.foreground,
					x = item.x || 0,
					y = item.y || 0,
					w = item.w || world,
					dw = item.dw || item.w,
					dh = item.dh || item.h;
					item.repeatX = item.repeatX || 0;
					item.repeatY = item.repeatY || 0;
				canvas = easel[item.layer] || canvas || easel.foreground;
				image.onload = function(){
					for(i = 0; i <= item.repeatX * world.cell; i += dw){
						for(j = 0; j <= item.repeatY * world.cell; j += dh){
							canvas.drawImage(
								image,
								x,
								y,
								item.w,
								item.h,
								where.x + i,
								where.y + j,
								dw,
								dh
							);
						}
					}
					for(except = 0; except < (item.except && item.except.length || 0); except++){
						item.except[except] = world.toXY(item.except[except]);
						clear(
							item.except[except].x,
							item.except[except].y,
							25,
							25,
							'foreground'
						);
					}
				};
				image.src = item.src;
			}
		},
		cells = (function(){
			var x,y;
			for(x = world.cell; x < world.dim.x; x += world.cell){
				path(x,0,x,world.dim.y,'grid',{color:'rgba(0,0,0,.2)'});
			}
			for(y = world.cell; y < world.dim.y; y += world.cell){
				path(0,y,world.dim.x,y,'grid',{color:'rgba(0,0,0,.2)'});
			}
		})();
	return {
		terrain:terrain,
		path:	path,
		scrap:	scrap,
		object:	object,
		clear:	clear
	};
})();

if(typeof window === 'undefined'){
	exports.draw = draw;
}