var everyauth = require('everyauth'),
	
	nextUserId = 0,
	users = {},
	localUsers = {},
	googleID = {},
	twitterID = {},
	githubID = {},
	facebookID = {},
	
	addUser = function(protocol,sourceUser){
		var user = users[++nextUserId] = {
			id:			nextUserId,
			protocol:	protocol
		};
		user[protocol] = sourceUser;
		return user;
	};

module.exports.configure = function(app){
	everyauth.debug = false;
	everyauth.everymodule.moduleTimeout(-1);
	
	everyauth.google
		.appId('888576786409.apps.googleusercontent.com')
		.appSecret('IFCE9K7ho3ICCMIFK6rb05pJ')
		.redirectPath('/')
		.scope('https://www.google.com/m8/feeds')
		.findOrCreateUser(function(session,accessToken,accessTokenExtra,googleUserMetadata){
			return googleID[googleUserMetadata.id] || (googleID[googleUserMetadata.id] = addUser('google',googleUserMetadata));
		})
		.handleAuthCallbackError(function(request,response){
			console.log('auth.error:',request,response);
		});
		
	everyauth.twitter
		.consumerKey('kiKNZ1y5Jw5dCYxHFoDVA')
		.consumerSecret('jJQEQguVqEj8YLnO6Ch5QiV74I6vYVCFva6rQUcUcs')
		.redirectPath('/')
		.findOrCreateUser(function(sess,accessToken,accessSecret,twitUser){
			return twitterID[twitUser.id] || (twitterID[twitUser.id] = addUser('twitter',twitUser));
		})
		.handleAuthCallbackError(function(request,response){
			console.log('auth.error:',request,response);
		});
		
	everyauth.github
		.appId('c09cf8b4d7d112266e51')
		.appSecret('f86dbd4c5b6dfdaf9a4bdaa3e307a5e4968888b6')
		.redirectPath('/')
		.findOrCreateUser(function(sess,accessToken, accessTokenExtra,ghUser){
			return githubID[ghUser.id] || (githubID[ghUser.id] = addUser('github',ghUser));
		})
		.handleAuthCallbackError(function(request,response){
			console.log('auth.error:',request,response);
		});
		
	everyauth.facebook
		.appId('294934693859231')
		.appSecret('2b77a53643850578682ca236a9edd63e')
		.redirectPath('/')
		.findOrCreateUser(function(session,accessToken,accessTokExtra,fbUserMetadata){
			return facebookID[fbUserMetadata.id] || (facebookID[fbUserMetadata.id] = addUser('facebook',fbUserMetadata));
		})
		.handleAuthCallbackError(function(request,response){
			console.log('auth.error:',request,response);
		});
		
	everyauth
	  .password
		.loginWith('email')
		.getLoginPath('/login')
		.postLoginPath('/login')
		.loginView('login.jade')
		//    .loginLocals({
		//      title: 'Login'
		//    })
		/*.loginLocals(function (req, res) {
			return {
				title: 'Login'
			}
		})*/
		.loginLocals(function(req,res,done){
			setTimeout(function(){
				done(null,{
					title:	'Async login'
				});
			},200);
		})
		.authenticate(function(login,password){
			var errors = [];
			if (!login) errors.push('Missing login');
			if (!password) errors.push('Missing password');
			if (errors.length) return errors;
			var user = localUsers[login];
			if (!user) return ['Login failed'];
			if (user.password !== password) return ['Login failed'];
			return user;
		})

		.getRegisterPath('/register')
		.postRegisterPath('/register')
		.registerView('register.jade')
		//    .registerLocals({
		//      title: 'Register'
		//    })
		.registerLocals(function (req, res) {
			return {
				title: 'Sync Register'
			}
		})
		/*.registerLocals( function (req, res, done) {
		  setTimeout( function () {
			done(null, {
			  title: 'Async Register'
			});
		  }, 200);
		})*/
		.validateRegistration( function (newUserAttrs, errors) {
		  var login = newUserAttrs.login;
		  if (localUsers[login]) errors.push('Login already taken');
		  return errors;
		})
		.registerUser( function (newUserAttrs) {
		  var login = newUserAttrs[this.loginKey()];
		  localUsers[login] = addUser('local',newUserAttrs);
		  return localUsers[login];
		})

		.loginSuccessRedirect('/')
		.registerSuccessRedirect('/');
	
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