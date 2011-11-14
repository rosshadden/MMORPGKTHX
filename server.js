var //http = require('http'),
	fs = require('fs'),
	util = require('util'),
	express = require('express'),
	app = express.createServer(),
	io = require('socket.io'),
	router = require('./router'),
	world = require('./ink/js/world'),
	pathfinder = require('./ink/js/pathfinder.js'),
	
	me,
	players = {},
	parties = {},
	numClients = 0,
	
	start = function(){
		app.configure(function(){
			app.use(app.router);
			app.use(express.static(__dirname + '/ink'));
		});
		app.set('views',__dirname + '/views');
		app.set('view engine','jade');
		app.set('view options',{
			layout:false
		});
		app.get('/',function(request,response){
			response.render('index');
		});
		var /*server = http.createServer(function(request,response){
				var rs,
					route = router.route(request.url);
				response.writeHead(200,{
					'Content-Type':	route.mime
				});
				if(route.type === 'http'){
					rs = fs.createReadStream(route.path,response);
					util.pump(rs,response);
				}else if(route.type === 'ajax'){
					response.end(JSON.stringify(ajax[route.url.split('/')[2]](route.query)));
				}else{
					console.log('Invalid Request.');
					response.end('Invalid Request.');
				}
			}),*/
			socket = io.listen(app);
		socket.set('log level',1);
		world.collision.render({
			map: {
				x:	1,
				y:	1
			}
		});
		app.listen(+(process.argv[2] || 4));

		socket.sockets.on('connection',function(client){
			me = client;
			client.on('login',function(clientUser){
				players[clientUser] = client;
				console.log('LOG:','Player ' + ++numClients + ' logged in:',client.handshake.address.address,clientUser);
				client.emit('login',clientUser);
				client.set('user',clientUser);
				client.set('position',{
					at: {
						x:	300,
						y:	200
					},
					map: {
						x:	1,
						y:	1
					}
				});
				client.set('inventory',[]);
				client.broadcast.emit('player.update',{
					user:	clientUser,
					path:	[{x:12,y:8}]
				});
				for(person in players){
					players[person].get('user',function(err,user){
						players[person].get('position',function(err,position){
							if(clientUser === user && players[person] !== client){
								//	Theoretically this is how we handle reentry.
								//	Or... just use sessions.
							}
							if(players[person] !== client && position && position.map.x === 1 && position.map.y === 1){
								client.emit('player.update',{
									user:	user,
									path:	[world.toGrid(position.at)]
								});
							}
						});
					});
				}
				client.on('player.move',function(data){
					client.get('position',function(err,position){
						client.get('user',function(err,user){
							var collision = world.collision.check(data,position);
							if(!collision.vacant){
								client.emit('player.move',false);
							}else{
								position.at.x = data.x;
								position.at.y = data.y;
								data = {
									user:	user,
									map:	position.map,
									path:	pathfinder(
										world.map(position),
										world.toGrid(data.old),
										world.toGrid(data),
										'manhattan'
									),
									entity:	collision.vacant,
									door:	collision.door
								};
								if(collision.vacant === 'item' || collision.vacant === 'door'){
									data.to = data.path[data.path.length - 1];
									data.path = data.path.slice(0,-1);
								}
								for(person in players){
									players[person].get('position',function(err,remotePosition){
										if(
											players[person] !== client
										&&	remotePosition
										&&	position.map.x === remotePosition.map.x
										&&	position.map.y === remotePosition.map.y
										&&(		!position.instance
											&&	!remotePosition.instance
											||	position.instance
											&&	remotePosition.instance
											&&	position.instance.x === remotePosition.instance.x
											&&	position.instance.y === remotePosition.instance.y
										)
										){
											players[person].emit('player.update',data);
										}
									});
								}
								data.instance = position.instance;
								client.set('position',position);
								client.emit('player.move',data);
							}
						});
					});
				});
			});
			client.on('player.changeMap',function(data){
				client.get('position',function(err,position){
					client.get('user',function(err,user){
						var old = {
							map: {
								x:	position.map.x,
								y:	position.map.y
							},
							instance:	position.instance
						};
						if(data.door){
							if(data.door.instance){
								position.instance = data.door.instance;
							}else{
								delete position.instance;
							}
							position.path = [data.door.to];
						}else if(world.collision.onEdge(
							world.toGrid(position.at),
							data.dir
						)){
							switch(data.dir){
								case 'N':
									position.map.y -= 1;
									position.at.y = 375;
									break;
								case 'E':
									position.map.x += 1;
									position.at.x = 0;
									break;
								case 'S':
									position.map.y += 1;
									position.at.y = 0;
									break;
								case 'W':
									position.map.x -= 1;
									position.at.x = 575;
									break;
							}
							position.path = [world.toGrid(position.at)];
						}
						position.path[0].dir = data.dir;
						client.set('position',position);
						client.emit('player.changeMap',position);
						client.emit('player.warp',position);
						world.collision.render(position);
						for(person in players){
							players[person].get('position',function(err,remotePosition){
								if(
									players[person] !== client
								&&  old && remotePosition
								&&	old.map.x === remotePosition.map.x
								&&	old.map.y === remotePosition.map.y
								){
									players[person].emit('player.exitMap',user);
								}else if(
									players[person] !== client
								&&  position && remotePosition
								&&	position.map.x === remotePosition.map.x
								&&	position.map.y === remotePosition.map.y
								&&(		!position.instance
									&&	!remotePosition.instance
									||	position.instance
									&&	remotePosition.instance
									&&	position.instance.x === remotePosition.instance.x
									&&	position.instance.y === remotePosition.instance.y
								)
								){
									position.user = user;
									players[person].emit('player.update',position);
									
								}
							});
						}
					});
				});
			});
			client.on('players.update',function(){
				client.get('position',function(err,position){
					for(person in players){
						players[person].get('user',function(err,user){
							players[person].get('position',function(err,remotePosition){
								if(
									players[person] !== client
								&&  position && remotePosition
								&&	position.map.x === remotePosition.map.x
								&&	position.map.y === remotePosition.map.y
								&&(		!position.instance
									&&	!remotePosition.instance
									||	position.instance
									&&	remotePosition.instance
									&&	position.instance.x === remotePosition.instance.x
									&&	position.instance.y === remotePosition.instance.y
								)
								){
									client.emit('player.update',{
										user:	user,
										path:	[world.toGrid(remotePosition.at)]
									});
								}
							});
						});
					}
				});
			});
			client.on('player.openChest',function(){
				client.get('user',function(err,user){
					client.get('position',function(err,position){
						var i,response,
							positionFix = world.toGrid(position.at),
							item = world.map(position)[positionFix.x][positionFix.y];
						if(!item.data){
							item.data = {};
						}
						if(!item.data.opened){
							item.data.opened = [];
						}
						if(item.data.opened.indexOf(user) === -1){
							item.data.opened.push(user);
							response = 'Woot, you got an item.';
							client.get('inventory',function(err,inventory){
								for(i = 0; i < item.data.contents.length; i++){
									inventory.push(item.data.contents[i]);
								}
								client.set('inventory',inventory);
							});
						}else{
							response = 'No such luck.';
						}
						client.emit('player.openChest',response);
					});
				});
			});
			client.on('inventory.get',function(){
				client.get('inventory',function(err,inventory){
					client.emit('inventory.get',inventory);
				});
			});
			client.on('disconnect',function(person){
				delete players[person];
				client.get('user',function(err,user){
					console.log('LOG:','Player ' + numClients-- + ' logged out:',client.handshake.address.address,user);
					client.broadcast.emit('logoff',user);
				});
			});
		});
	},
	ajax = {
		players: function(){
			var people = [];
			for(person in players){
				people.push(person);
			}
			return people;
		},
		party: function(){
			var party = [];
			me.get('leader',function(err,leader){
				for(person in parties[leader]){
					party.push(parties[leader][person]);
				}
			});
			return party;
		},
		invite: function(guest){
			if(players[guest.user]){
				me.get('user',function(err,host){
console.log('invite:',host,'->',guest.user);
					players[guest.user].emit('party.invite',host);
				});
			}
		},
		accept: function(host){
			me.get('user',function(err,guest){
console.log('accept:',host.user,'->',guest);
				if(!parties[host.user]){
					parties[host.user] = {};
					parties[host.user][host.user] = players[host.user];
				}
				parties[host.user][guest] = players[guest];
console.log(parties);
			});
		}
	};
exports.start = start;