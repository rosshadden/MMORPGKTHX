var i,me,
	canvas,ctx,
	WIDTH = 600,
	HEIGHT = 400,
	players = {},
	
	socket = new io.connect(location.hostname),
	
	main = function(){
			window.webkitRequestAnimationFrame
			&&	webkitRequestAnimationFrame(main)
		||	window.mozRequestAnimationFrame
			&&	mozRequestAnimationFrame(main)
		||	window.requestAnimationFrame
			&&	requestAnimationFrame(main);
		draw.scrap('players');
		for(player in players){
			if(players[player].visible){
				players[player].move();
				players[player].draw();
			}
		}
		me.move();
		me.draw();
		draw.game(5);
	},
	bind = function(){
		$('#game').bind({
			'click':	function(v){
				var point = {
					x:		~~((v.pageX - $('#game')[0].offsetLeft) / 25) * 25,
					y:		~~((v.pageY - $('#game')[0].offsetTop) / 25) * 25
				};
				if(!me.isMoving){
					socket.emit('player.move',{
						id:		me.id,
						x:		point.x,
						y:		point.y,
						old:	{
							x:	me.x,
							y:	me.y
						}
					});
					$(world).trigger(
						'world.click:'
						+world.toGrid(point.x)
						+'.'
						+world.toGrid(point.y)
					);
				}
			}
		});
		$(window).bind({
			'keydown':	function(v){
				switch(v.which){
					case 16:
						me.speed = (me.speed === 1) ? 4 : 1;
						break;
					case 13:
						menu.toggle();
						break;
					case 77:
						menu.toggle();
						break;
					default:
						//console.log('keydown:',v.which);
				}
			}
		});
		socket.on('player.move',function(position){
			var path;
			if(position.path){
				path = position.path;
				me.position = position;
				for(var i = 0, l = path.length; i < l; i++){
					draw.path(
						world.toXY(path[i].x) + 12,
						world.toXY(path[i].y) + 12,
						world.toXY(path[i].x) + 13,
						world.toXY(path[i].y) + 13,
						'ground',{
							width:	5,
							color:	'rgba(200,200,100,.4)'
						}
					);
				}
			}
		});
		socket.on('player.warp',function(position){
			if(position.path){
				me.position.path = [];
				me.setPosition(world.toXY(position.path[0]));
			}
		});
		socket.on('player.update',function(position){
			if(!players[position.user]){
				players[position.user] = new Player(position.user);
				players[position.user].path = [];
				players[position.user].setPosition(world.toXY(position.path[0]));
			}else{
				players[position.user].position = position;
			}
			players[position.user].visible = true;
		});
		socket.on('player.exitMap',function(user){
			if(players[user]){
				players[user].visible = false;
			}
		});
		socket.on('party.invite',function(user){
			var response =	'<div class="invite">';
				response +=		'<span class="stress">';
				response +=			user;
				response +=		'</span>';
				response +=		' just invited you to join their party';
				response += 	'<a class="party-accept button">Accept</a><a class="party-reject button">Reject</a>';
				response += '</div>';
			$('#log').append(response);
			$('a.party-accept').on('click',function(){
				$('.invite').remove();
				$.get('GET',{
					on:		'accept',
					user:	user
				});
			});
		});
		socket.on('logoff',function(user){
			if(players[user]){
				players[user].visible = false;
			}
		});
	},
	game = (function(){
		var post = function(action,data){
				$.get('POST' + action,data || {});
			},
			get = function(action,data,holla){
				data = data || {};
				data.on = action;
				$.getJSON('GET',data,holla);
			},
			debug = function(){
				var def = new $.Deferred();
				get('debug',{},function(data){
					console.log('debug:',data);
					def.resolve(data);
				});
				return def.promise();
			},
			getPlayers = function(){
				var def = new $.Deferred();
				get('players',{},function(players){
					console.log('players:',players);
					def.resolve(players);
				});
				return def.promise();
			},
			getParty = function(){
				var def = new $.Deferred();
				get('party',{},function(party){
					console.log('party:',party);
					def.resolve(party);
				});
				return def.promise();
			};
		return {
			post:		post,
			debug:		debug,
			getPlayers:	getPlayers,
			getParty:	getParty
		};
	})(),
	init = (function(){
		canvas = document.getElementById('players');
		ctx = canvas.getContext('2d');
		
		canvas.width = WIDTH;
		canvas.height = HEIGHT;
		
		socket.emit('login',Math.round(Math.random() * 1e4));
		socket.on('login',function(data){
			me = new Player(data);
			me.setPosition(300,200);
			
			bind();
			world.render({
				map: {
					x:	1,
					y:	1
				}
			});
			draw.terrain();
			main();
		});
	})();