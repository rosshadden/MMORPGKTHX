var world = (function(){
	var cell = 25,
		dim = {
			x:	6e2,//1e3,
			y:	4e2,//1e3,
			view: {
				x:	6e2,
				y:	4e2
			}
		},
		map = [],
		tiles = {},
		grid = function(){
			var x,y,
				cells = [];
			for(x = 0; x < dim.x / cell; x++){
				cells[x] = [];
				for(y = 0; y < dim.y / cell; y++){
					cells[x][y] = {
						x:		x * cell,
						y:		y * cell,
						vacant:	'maybe'
					};
				}
			}
			return cells;
		},
		getMap = function(position){
			if(!map[position.map.x]){
				map[position.map.x] = [];
			}
			if(!map[position.map.x][position.map.y]){
				map[position.map.x][position.map.y] = grid();
			}
			if(!position.instance){
				return map[position.map.x][position.map.y];
			}else{
				if(!map[position.map.x][position.map.y].instance){
					map[position.map.x][position.map.y].instance = [];
				}
				if(!map[position.map.x][position.map.y].instance[position.instance.x]){
					map[position.map.x][position.map.y].instance[position.instance.x] = [];
				}
				if(!map[position.map.x][position.map.y].instance[position.instance.x][position.instance.y]){
					map[position.map.x][position.map.y].instance[position.instance.x][position.instance.y] = grid();
				}
				return map[position.map.x][position.map.y].instance[position.instance.x][position.instance.y];
			}
		},
		render = function(position){
			var map,
				script = document.createElement('script');
			//	Think about changing .src instead of remove/add.
			$('script.map.events').remove();
			script.src='map/events.' + position.map.x + '.' + position.map.y + '.js';
			script.className = 'map events';
			document.body.appendChild(script);
			draw.terrain();
			map = position.map.x + '.' + position.map.y;
			if(position.instance){
				map += '+' + position.instance.x + '.' + position.instance.y;
			}
			$.getJSON('map/map.' + map + '.json',function(newMap){
				var i,j,rX,rY,x,y,w,h,except;
				for(i = 0; i < world.dim.x; i += world.cell){
					for(j = 0; j < world.dim.y; j += world.cell){
						draw.object({
							src:	newMap.properties.background.src,
							x:		newMap.properties.background.x,
							y:		newMap.properties.background.y,
							w:		newMap.properties.background.w,
							h:		newMap.properties.background.h,
							where: world.toGrid(i,j)
						},'background');
					}
				}
				$.each(newMap.tiles,function(t,tile){
					except = [];
					tile.repeatX = tile.repeatX || 0;
					tile.repeatY = tile.repeatY || 0;
					x = tile.x;
					y = tile.y;
					w = tile.w / (tile.dw / world.cell);
					h = tile.h / (tile.dh / world.cell);
					if(tile.except){
						for(i = 0; i < tile.except.length; i++){
							except.push(tile.except[i].x + ',' + tile.except[i].y);
						}
					}
					for(i = 0; i < tile.dw / cell; i++){
						for(j = 0; j < tile.dh / cell; j++){
							for(rX = 0; rX <= tile.repeatX; rX++){
								for(rY = 0; rY <= tile.repeatY; rY++){
									if(
										except.indexOf(
											(tile.where.x + i + rX)
											+','
											+(tile.where.y + j + rY)
										) === -1
									){
										draw.object({
											src:	tile.src,
											x:		x + i * w,
											y:		y + j * h,
											w:		w,
											h:		h,
											where: {
												x:	tile.where.x + i + rX,
												y:	tile.where.y + j + rY
											}
										},'foreground');
									}
								}
							}
						}
					}
				});
				/*for(tile in tiles){
					draw.object(tiles[tile],'foreground');
				}*/
			});
		},
		paint = function(layer){
			draw.object({
				type:	'canvas',
				src:	layer,
				x:		0,
				y:		0,
				w:		600,
				h:		400,
				width:	600,
				height:	400,
				where: {
					x:	0,
					y:	0
				}
			});
		},
		toGrid = function(x,y){
			if(typeof y === 'undefined'){
				if(typeof x === 'object'){
					y = x.y || x.top || null;
					x = x.x || x.left || null;
				}else{
					return Math.floor(x / cell);
				}
			}
			return {
				x:	Math.floor(x / cell),
				y:	Math.floor(y / cell)
			};
		},
		toXY = function(x,y){
			if(typeof y === 'undefined'){
				if(typeof x === 'object'){
					y = x.y;
					x = x.x;
				}else{
					return x * cell;
				}
			}
			return {
				x:	x * cell,
				y:	y * cell
			};
		},
		toPoint = function(x,y){
			return {
				x:	x,
				y:	y
			};
		},
		conform = function(x,y){
			if(typeof x === 'object'){
				y = x.y;
				x = x.x;
			}
			return {
				x:	Math.floor(x / cell) * cell,
				y:	Math.floor(y / cell) * cell
			};
		},
		collision = (function(){
			var render = function(position){
					var map = position.map.x + '.' + position.map.y;
					if(position.instance){
						map += '+' + position.instance.x + '.' + position.instance.y;
					}
					map = require('../map/map.' + map + '.json');
					for(object in map){
						switch(map[object].type){
							case 'building':
								world.collision.add(map[object],position);
								break;
							case 'structure':
								world.collision.add(map[object],position);
								break;
							case 'item':
								world.collision.add(map[object],position,'item');
								break;
						}
					}
				},
				add = function(object,position,entity){
					var x,y,i,j,
						map = world.map(position);
					entity = entity || false;
					object.repeatX = object.repeatX || 0;
					object.repeatY = object.repeatY || 0;
					for(i = 0; i <= object.repeatX; i++){
						for(j = 0; j <= object.repeatY; j++){
							for(x = 0; x < object.dw / world.cell; x++){
								for(y = 0; y < object.dh / world.cell; y++){
									if(map[object.where.x + x + i][object.where.y + y + j].vacant !== 'door'){
										map[object.where.x + x + i][object.where.y + y + j].vacant = entity;
									}
									if(object.data){
										map[object.where.x + x + i][object.where.y + y + j].data = object.data;
									}
								}
							}
						}
					}
					for(i = 0; i < (object.except && object.except.length || 0); i++){
						if(map[object.except[i].x][object.except[i].y].vacant !== 'door'){
							map[object.except[i].x][object.except[i].y].vacant = true;
						}
					}
					if(object.door){
						map[object.door.at.x][object.door.at.y].vacant = 'door';
						map[object.door.at.x][object.door.at.y].door = object.door;
						map[object.door.at.x][object.door.at.y].instance = grid();
					}
				},
				check = function(cell,position){
					cell = world.toGrid(cell);
					cell = world.map(position)[cell.x][cell.y];
					return cell;
				},
				get = function(position){
					position.at = world.toGrid(position.at);
					if(!position.instance){
						return world.map(position)[position.at.x][position.at.y];
					}else{
						//return world.map(position)[position.at.x][position.at.y].instance[position.instance.x][position.instance.y];
						return world.map(position)[position.at.x][position.at.y];//.instance[position.instance.x][position.instance.y];
					}
				},
				onEdge = function(position,facing){
					if(typeof world === 'undefined'){
						world = require('./world');
					}
					if(
						position.x === 0
						&&	facing === 'W'
					||	position.x === world.toGrid(world.dim.x) - 1
						&&	facing === 'E'
					||	position.y === 0
						&&	facing === 'N'
					||	position.y === world.toGrid(world.dim.y) - 1
						&&	facing === 'S'
					){
						return true;
					}else{
						return false;
					}
				};
			return {
				add:	add,
				render:	render,
				check:	check,
				get:	get,
				onEdge:	onEdge
			};
		})();
	return {
		cell:		cell,
		dim:		dim,
		map:		getMap,
		render:		render,
		draw:		paint,
		toGrid:		toGrid,
		toXY:		toXY,
		toPoint:	toPoint,
		conform:	conform,
		collision:	collision
	};
})();

if(typeof window === 'undefined'){
	module.exports = world;
}