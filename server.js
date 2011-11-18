var fs = require('fs'),
	express = require('express'),
	app = express.createServer(),
	Session = require('connect').middleware.session.Session,
	parseCookie = require('connect').utils.parseCookie,
	parseURL = require('url').parse,
	sessionStore = new express.session.MemoryStore(),
	
	auth = require('./auth'),
	world = require('./ink/js/world'),
	pathfinder = require('./ink/js/pathfinder.js'),
	
	players = {},
	parties = {},
	numClients = 0,
	
	init = function(){
		app.configure(function(){
			app.set('views',__dirname + '/views');
			app.set('view engine','jade');
			app.use(express.bodyParser());
			app.use(express.cookieParser());
			app.use(express.session({
				store:	sessionStore,
				secret:	'asdf',
				key:	'express.sid'
			}));
			app.use(require('./auth').configure(app));
			app.use(app.router);
			app.use(express.static(__dirname + '/ink'));
		});
		app.get('/',function(request,response){
			response.render('index');
		});
		app.get('/GET',function(request,response){
			var data = '',
				url = parseURL(request.url,true),
				username = request.user;
				//protocol = Object.keys(request.session.auth)[0],
				//username = protocol + '|' + request.session.auth[protocol].user.id;
			response.contentType('application/json');
			
			switch(url.query.on){
				case 'debug':
					data = username;
					console.log(parties);
					break;
				case 'players':
					data = [];
					for(person in players){
						data.push(person);
					}
					break;
				case 'party':
					data = [];
					for(person in parties[players[username].leader]){
						data.push(person);
					}
					break;
				case 'invite':
					if(players[url.query.user]){
						console.log('invite:',players[username].user,'->',url.query.user);
						players[url.query.user].socket.emit('party.invite',players[username].user);
					}
					break;
				case 'accept':
					console.log('accept:',url.query.user,'->',players[username].user);
					if(!parties[url.query.user]){
						parties[url.query.user] = {};
						parties[url.query.user][url.query.user] = players[url.query.user];
						players[url.query.user].leader = url.query.user;
					}
					parties[url.query.user][players[username].user] = players[players[username].user];
					players[players[username].user].leader = url.query.user;
					break;
				default:
					data = 'default';
			}
			
			response.end(JSON.stringify(data));
		});
	},
	serve = function(){
		init();
		var io = require('socket.io').listen(app);
		io.set('log level',1);
		world.collision.render({
			map: {
				x:	1,
				y:	1
			}
		});
		console.log('http://localhost:%d | %s',+(process.argv[2] || 4),app.settings.env);
		app.listen(+(process.argv[2] || 4));
		
		io.set('authorization',function(data,accept){
			if(data.headers.cookie){
				data.cookie = parseCookie(data.headers.cookie);
				data.sessionID = data.cookie['express.sid'];
				//	save the session store to the data object 
				//	(as required by the Session constructor)
				data.sessionStore = sessionStore;
				sessionStore.get(data.sessionID,function(err,session){
					if(err || !session){
						accept('Error',false);
					}else{
						//	create a session object, passing data as request and our
						//	newly acquired session data
						data.session = new Session(data,session);
						accept(null,true);
					}
				});
			}else{
			   return accept('No cookie transmitted.',false);
			}
		});
		io.sockets.on('connection',function(socket){
			var me = socket.handshake.sessionID,
				protocol = Object.keys(socket.handshake.session.auth)[0],
				username = protocol + '|' + socket.handshake.session.auth[protocol].user.id;
			socket.on('login',function(){
				players[username] = {
					user:		username,
					socket:		socket,
					inventory:	[],
					position: {
						at: {
							x:	300,
							y:	200
						},
						map: {
							x:	1,
							y:	1
						}
					}
				};
				console.log('LOG:','Player ' + ++numClients + ' logged in:',socket.handshake.address.address,username);
				socket.emit('login',username);
				socket.broadcast.emit('player.update',{
					user:	username,
					path:	[{x:12,y:8}]
				});
				for(person in players){
					if(username === players[person].user && players[person].socket !== socket){
						//	Theoretically this is how we handle reentry.
						//	Or... just use sessions.
					}
					if(players[person].socket !== socket && players[person].position && players[person].position.map.x === 1 && players[person].position.map.y === 1){
						socket.emit('player.update',{
							user:	players[person].user,
							path:	[world.toGrid(players[person].position.at)]
						});
					}
				}
				socket.on('player.move',function(data){
					var collision = world.collision.check(data,players[username].position);
					if(!collision.vacant){
						socket.emit('player.move',false);
					}else{
						players[username].position.at.x = data.x;
						players[username].position.at.y = data.y;
						data = {
							user:	players[username].user,
							map:	players[username].position.map,
							path:	pathfinder(
								world.map(players[username].position),
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
							if(
								players[person].socket !== socket
							&&	players[person].position
							&&	players[username].position.map.x === players[person].position.map.x
							&&	players[username].position.map.y === players[person].position.map.y
							&&(		!players[username].position.instance
								&&	!players[person].position.instance
								||	players[username].position.instance
								&&	players[person].position.instance
								&&	players[username].position.instance.x === players[person].position.instance.x
								&&	players[username].position.instance.y === players[person].position.instance.y
							)
							){
								players[person].socket.emit('player.update',data);
							}
						}
						data.instance = players[username].position.instance;
						socket.emit('player.move',data);
					}
				});
			});
			socket.on('player.changeMap',function(data){
				var old = {
					map: {
						x:	players[username].position.map.x,
						y:	players[username].position.map.y
					},
					instance:	players[username].position.instance
				};
				if(data.door){
					if(data.door.instance){
						players[username].position.instance = data.door.instance;
					}else{
						delete players[username].position.instance;
					}
					players[username].position.path = [data.door.to];
				}else if(world.collision.onEdge(
					world.toGrid(players[username].position.at),
					data.dir
				)){
					switch(data.dir){
						case 'N':
							players[username].position.map.y -= 1;
							players[username].position.at.y = 375;
							break;
						case 'E':
							players[username].position.map.x += 1;
							players[username].position.at.x = 0;
							break;
						case 'S':
							players[username].position.map.y += 1;
							players[username].position.at.y = 0;
							break;
						case 'W':
							players[username].position.map.x -= 1;
							players[username].position.at.x = 575;
							break;
					}
					players[username].position.path = [world.toGrid(players[username].position.at)];
				}
				players[username].position.path[0].dir = data.dir;
				socket.emit('player.changeMap',players[username].position);
				socket.emit('player.warp',players[username].position);
				world.collision.render(players[username].position);
				for(person in players){
					if(
						players[person].socket !== socket
					&&  old && players[person].position
					&&	old.map.x === players[person].position.map.x
					&&	old.map.y === players[person].position.map.y
					){
						players[person].socket.emit('player.exitMap',players[username].user);
					}else if(
						players[person].socket !== socket
					&&  players[username].position && players[person].position
					&&	players[username].position.map.x === players[person].position.map.x
					&&	players[username].position.map.y === players[person].position.map.y
					&&(		!players[username].position.instance
						&&	!players[person].position.instance
						||	players[username].position.instance
						&&	players[person].position.instance
						&&	players[username].position.instance.x === players[person].position.instance.x
						&&	players[username].position.instance.y === players[person].position.instance.y
					)
					){
						players[username].position.user = players[username].user;
						players[person].socket.emit('player.update',players[username].position);
						
					}
				}
			});
			socket.on('players.update',function(){
				for(person in players){
					if(
						players[person].socket !== socket
					&&  players[username].position && players[person].position
					&&	players[username].position.map.x === players[person].position.map.x
					&&	players[username].position.map.y === players[person].position.map.y
					&&(		!players[username].position.instance
						&&	!players[person].position.instance
						||	players[username].position.instance
						&&	players[person].position.instance
						&&	players[username].position.instance.x === players[person].position.instance.x
						&&	players[username].position.instance.y === players[person].position.instance.y
					)
					){
						socket.emit('player.update',{
							user:	players[person].user,
							path:	[world.toGrid(players[person].position.at)]
						});
					}
				}
			});
			socket.on('player.openChest',function(){
					var i,response,
						positionFix = world.toGrid(players[username].position.at),
						item = world.map(players[username].position)[positionFix.x][positionFix.y];
					if(!item.data){
						item.data = {};
					}
					if(!item.data.opened){
						item.data.opened = [];
					}
					if(item.data.opened.indexOf(players[username].user) === -1){
						item.data.opened.push(players[username].user);
						response = 'Woot, you got an item.';
						for(i = 0; i < item.data.contents.length; i++){
							players[username].inventory.push(item.data.contents[i]);
						}
					}else{
						response = 'No such luck.';
					}
					socket.emit('player.openChest',response);
			});
			socket.on('inventory.get',function(){
				socket.emit('inventory.get',players[username].inventory);
			});
			socket.on('disconnect',function(person){
				delete players[person];
				console.log('LOG:','Player ' + numClients-- + ' logged out:',socket.handshake.address.address,players[username].user);
				socket.broadcast.emit('logoff',players[username].user);
			});
		});
	};
exports.start = serve;