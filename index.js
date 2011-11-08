var server = require('./server'),
	net = require('net');

server.start();

/*net.createServer(function(socket){
	socket.pipe(socket);
}).listen(44);*/