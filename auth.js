var everyauth = require('everyauth'),
	
	nextUserId = 0,
	users = {},
	googleID = {},
	twitterID = {},
	githubID = {},
	facebookID = {},
	
	addUser = function(source,sourceUser){
		var user = users[++nextUserId] = {
			id:			nextUserId,
			protocol:	source
		};
		user[source] = sourceUser;
		return user;
	};

module.exports.configure = function(app){
	everyauth.debug = false;
	everyauth.everymodule.moduleTimeout(-1);
	
	//everyauth.everymodule.redirectPath('/');
	
	everyauth.google
		.appId('888576786409.apps.googleusercontent.com')
		.appSecret('IFCE9K7ho3ICCMIFK6rb05pJ')
		.redirectPath('/')
		.scope('https://www.google.com/m8/feeds')
		.handleAuthCallbackError(function(request,response){
			console.log('auth.error:',request,response);
		})
		.findOrCreateUser(function(session,accessToken,accessTokenExtra,googleUserMetadata){
			return googleID[googleUserMetadata.id] || (googleID[googleUserMetadata.id] = addUser('google',googleUserMetadata));
		});
	everyauth.twitter
		.consumerKey('kiKNZ1y5Jw5dCYxHFoDVA')
		.consumerSecret('jJQEQguVqEj8YLnO6Ch5QiV74I6vYVCFva6rQUcUcs')
		.redirectPath('/')
		.findOrCreateUser(function(sess,accessToken,accessSecret,twitUser){
			return twitterID[twitUser.id] || (twitterID[twitUser.id] = addUser('twitter',twitUser));
		});
	everyauth.github
		.appId('c09cf8b4d7d112266e51')
		.appSecret('f86dbd4c5b6dfdaf9a4bdaa3e307a5e4968888b6')
		.redirectPath('/')
		.findOrCreateUser(function(sess,accessToken, accessTokenExtra,ghUser){
			return githubID[ghUser.id] || (githubID[ghUser.id] = addUser('github',ghUser));
		});
	everyauth.facebook
		.appId('294934693859231')
		.appSecret('2b77a53643850578682ca236a9edd63e')
		.redirectPath('/')
		.findOrCreateUser(function(session,accessToken,accessTokExtra,fbUserMetadata){
			return facebookID[fbUserMetadata.id] || (facebookID[fbUserMetadata.id] = addUser('facebook',fbUserMetadata));
		});
	
	everyauth.everymodule.findUserById(function(id,callback){
		var protocol = users[id].protocol,
			username = protocol + '|' + users[id][protocol].id;
		//	If I decide to do so, here would be a good place to handle passing
		//	protocol-specific usernames.  Maybe pass ghUser to addUser(), etc.
		callback(null,username);
	});
	everyauth.helpExpress(app);
	
	return everyauth.middleware();
};