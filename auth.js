var everyauth = require('everyauth'),
	
	nextUserId = 0,
	users = {},
	googleID = {},
	twitterID = {},
	githubID = {},
	facebookID = {},
	
	addUser = function(source,sourceUser){
		var user = users[++nextUserId] = {id: nextUserId};
			user[source] = sourceUser;
		return user;
	};

module.exports.configure = function(app){
	everyauth.debug = false;
	
	everyauth.google
		.appId('888576786409.apps.googleusercontent.com')
		.appSecret('IFCE9K7ho3ICCMIFK6rb05pJ')
		.scope('https://www.google.com/m8/feeds')
		.handleAuthCallbackError(function(request,response){
			console.log('auth.error:',request,response);
		})
		.findOrCreateUser(function(session,accessToken,accessTokenExtra,googleUserMetadata){
			return googleID[googleUserMetadata.id] || (googleID[googleUserMetadata.id] = addUser('google',googleUserMetadata));
		})
		.redirectPath('/');
	everyauth.twitter
		.consumerKey('kiKNZ1y5Jw5dCYxHFoDVA')
		.consumerSecret('jJQEQguVqEj8YLnO6Ch5QiV74I6vYVCFva6rQUcUcs')
		.findOrCreateUser(function(sess,accessToken,accessSecret,twitUser){
			return twitterID[twitUser.id] || (twitterID[twitUser.id] = addUser('twitter',twitUser));
		})
		.redirectPath('/');
	everyauth.github
		.appId('c09cf8b4d7d112266e51')
		.appSecret('f86dbd4c5b6dfdaf9a4bdaa3e307a5e4968888b6')
		.findOrCreateUser(function(sess,accessToken, accessTokenExtra,ghUser){
			return githubID[ghUser.id] || (githubID[ghUser.id] = addUser('github',ghUser));
		})
		.redirectPath('/');
	everyauth.facebook
		.appId('294934693859231')
		.appSecret('2b77a53643850578682ca236a9edd63e')
		.findOrCreateUser(function(session,accessToken,accessTokExtra,fbUserMetadata){
			return facebookID[fbUserMetadata.id] || (facebookID[fbUserMetadata.id] = addUser('facebook',fbUserMetadata));
		})
		.redirectPath('/');
	
	everyauth.helpExpress(app);
	
	return everyauth.middleware();
};