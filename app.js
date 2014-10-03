var http = require('http');
var mongoose = require('mongoose');
var express = require('express');
var Q = require('q');
var request = require('request');
var app = express();
var bodyParser = require("body-parser");
var db;
var AccountRepository = require("./repositories/AccountRepository")
var SecurityToken = require('./infrastructure/securityToken');

app.use(bodyParser.json({
  extended: true
}));

var config = {
	"USER"     : "",
	"PASS"     : "",
	"HOST"     : "127.0.0.1",
	"PORT"     : "27017",
	"DATABASE" : "my_example"
};

var dbPath  = "mongodb://"+config.USER + ":"+
	config.PASS + "@"+ 
	config.HOST + ":"+
	config.PORT + "/"+
	config.DATABASE;

function handleFacebookMobileLoginRequest(req, res) {
	console.log('handleFacebookRequest\n');
	var facebookAccessToken = req.body.fbToken;
	var applicationName = req.body.appName;
	console.log(req.headers);
	console.log(req.body);
	if (facebookAccessToken && facebookAccessToken.length > 0 && applicationName && applicationName.length > 0) {
		verifyFacebookUserAccessToken(facebookAccessToken).
			then(function(user) { 
				console.log("Success!");
				performFacebookLogin(applicationName, user, facebookAccessToken).
					then(function(apiToken) {
						console.log("Did all of it")
						res.send("{\"token\":\"" + apiToken + "\"}");

					});
			}, function (error) {
				console.log("Failed!");
				res.send("{\"result\":\"Failed!\"}");

				//log error...
			}
		).fail(function(error){
			//log,,,
		});
	} else {
		//log again...
	}
}

function verifyFacebookUserAccessToken(token) {
	console.log("verifyFacebookUserAccessToken()")
	var deferred = Q.defer();
	var path = 'https://graph.facebook.com/me?access_token=' + token;
	request(path, function (error, response, body) {
		var data = JSON.parse(body);
		console.log("request");
		console.log(data);
		if (!error && response && response.statusCode == 200) {
			var user = {
				facebookUserId: data.id,
				firstName: data.first_name,
				lastName: data.last_name,
				email: data.email
			};
			console.log("resolving request");
			deferred.resolve(user);
		}
		else {
			console.log("errored out");
			deferred.reject();
			//logA
			//
		}
	});
	return deferred.promise;
}

function performFacebookLogin(appName, userProfile, fbAccessToken) {
	console.log("pfl start");
	var deferred = Q.defer();
	if (appName && userProfile && fbAccessToken) {
		console.log("going to create accountRepository");
		var accountRepository = new AccountRepository();
		console.log("test");
		console.log(userProfile);

		console.log("done");
		accountRepository.findOrCreateAccount(userProfile.facebookUserId, userProfile.email, userProfile.firstName, userProfile.lastName).then(function(account) {
			console.log("found");
			if (account.facebookUserId != userProfile.facebookUserId) {
				deferred.reject(new Error("Invalid token"));
			}
			else {
				if (account.hasChanged(userProfile.firstName, userProfile.lastName, userProfile.email)) {
					accountRepository.updateAccount({
						firstName: userProfile.firstName,
						lastName: userProfile.lastName,
						email: userProfile.email
					});
				}
				console.log("going to create a securityToken")
				//var apiAccessToken = new ApiAccessToken(account._id, appName);
				var securityToken = SecurityToken.createFromUserIdAndFacebookToken(account._id, fbAccessToken)
				console.log("done creating")
				
				SecurityToken.saveSecurityToken(securityToken).then(function(savedSecurityToken){
					//var loginViewModel = new LoginViewModel(account._id, account.username, account.firstName, account.lastName, apiAccessToken.accessToken);
					//accountRepository.updateLastLoginDate(account, Date.now());
					console.log("returning");
					var apiToken = savedSecurityToken.apiAccessToken;
					console.log(apiToken);
					deferred.resolve(apiToken);
				});
			}
		})
	}
	return deferred.promise;

}


var standardGreeting = 'Hello World!';

var eventSchema = new mongoose.Schema({
	Name: String,
	Description: String,
	Source: String,
	URL: String,
	image: String
});

var userSchema = new mongoose.Schema({
	Email: String,
	Token: String,
});
	
app.post('/api/auth/facebook', handleFacebookMobileLoginRequest);

//var Greeting= mongoose.model('greeting', greetingSchema);

db = mongoose.connect(dbPath);

mongoose.connection.once('open', function() {
	console.log('once connection happening!\n');
	/*var greeting;
	Greeting.find( function(err, greetings) {
		if( !false ) {
			console.log('Creating new greeting...!\n');
			greeting = new Greeting({ sentence: standardGreeting });
			greeting.save();
		}
	});*/
	
});

app.get('/', function(req, res){
	console.log('app get happening!\n');
	//Greeting.findOne(function (err, greeting) {
		res.send("Halllo");
	//});
});

app.use(function(err, req, res, next){
	console.log('error reporting happening!\n');
	if (req.xhr) {
		res.send(500, 'Something went wrong!');
	} else {
		next(err);
	}
});

console.log('starting Express (NodeJS) Web server');
app.listen(8080);
console.log('Webserverlistening on port 8080');
