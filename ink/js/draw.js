var	draw = (function(){
	var	self = this,
		easel = {
			background:	$('#background').attr({
				width:	world.dim.view.x,
				height:	world.dim.view.y
			})[0].getContext('2d'),
			foreground:	$('#foreground').attr({
				width:	world.dim.view.x,
				height:	world.dim.view.y
			})[0].getContext('2d'),
			screen:		$('#screen').attr({
				width:	world.dim.view.x,
				height:	world.dim.view.y
			})[0].getContext('2d'),
			element: {
				background:	$('#background')[0],
				foreground:	$('#foreground')[0],
				screen:		$('#screen')[0]
			}
		},
		scrap = function(canvas){
			clear(0,0,world.dim.x,world.dim.view.y,canvas || 'screen');
		},
		clear = function(x,y,x2,y2,canvas){
			easel[canvas || 'screen'].clearRect(x,y,x2,y2);
		},
		terrain = (function(){
			easel.screen.fillStyle = '#000000';
			return function(){
				easel.screen.fillRect(0,0,world.dim.view.x,world.dim.view.y);
			};
		})(),
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
					canvas = easel.screen;
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
		paint = function(){
			
		},
		object = function(item,canvas){
			var image = new Image(),
				canvas = easel[canvas] || easel.screen;
			//	These cases are so similar! Must... combine!
			if(item.type === 'canvas'){
				canvas.drawImage(
					easel.element[item.src],
					item.x,
					item.y,
					item.w,
					item.h,
					world.toXY(item.where.x) - viewport.get().x,
					world.toXY(item.where.y) - viewport.get().y,
					item.width || world.cell,
					item.height || world.cell
				);
			}else{
				image.onload = function(){
					canvas.drawImage(
						image,
						item.x,
						item.y,
						item.w,
						item.h,
						world.toXY(item.where.x),
						world.toXY(item.where.y),
						item.width || world.cell,
						item.height || world.cell
					);
				};
				image.src = item.src;
			}
		},
		cells = (function(){
			/*var x,y;
			for(x = world.cell; x < world.dim.view.x; x += world.cell){
				path(x,0,x,world.dim.view.y,'grid',{color:'rgba(0,0,0,.2)'});
			}
			for(y = world.cell; y < world.dim.view.y; y += world.cell){
				path(0,y,world.dim.view.x,y,'grid',{color:'rgba(0,0,0,.2)'});
			}*/
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