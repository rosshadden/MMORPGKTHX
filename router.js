var route = function(file){
		var path,mime,type,
			url = require('url').parse(file,true);
		if(file === '/'){
			file = '/views/index.html';
		}
		if(url.search !== '' || url.pathname.split('/')[1] === 'GET' || url.pathname.split('/')[1] === 'POST'){
			mime = 'application/json';
			type = 'ajax';
		}else{
			type = 'http';
			switch(file.substring(file.lastIndexOf('.'))){
				case '.html':
					mime = 'text/html';
					break;
				case '.js':
					mime = 'application/javascript';
					break;
				case '.css':
					mime = 'text/css';
					break;
				case '.json':
					mime = 'application/json';
					break;
				case '.png':
					mime = 'image/png';
					break;
				case '.jpg':
					mime = 'image/jpg';
					break;
				default:
					mime = 'text/plain';
			}
		}
		path = __dirname + file;
		return {
			path:	path,
			mime:	mime,
			type:	type,
			url:	url.pathname,
			query:	url.query
		};
	};
exports.route = route;