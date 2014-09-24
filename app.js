var http = require('http');
var mongoose = require('mongoose');
var express = require('express');
var request = require('request');

var app = express();
var db;

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
	var facebookAcessToken = req.body.fbToken;
	var applicationName = req.body.appName;
	if (facebookAccessToken && facebookAccessToken.length > 0 && applicationName && applicationName.length > 0) {
		verifyFacebookUserAccessToken(facebookAccessToken).
			then(function(user) {
				performFacebookLogin(applicationName, user, facebookAccessToken).
					then(function(loginViewModel) {
						//Add logging and res
						//
					});
			}, function (error) {
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
	var deferred = Q.defer();
	var path = 'https://graph.facebook.com/me?access_token=' + token;
	request(path, function (error, response, body) {
		var data = JSON.parse(body);
		if (!error && response && response.statusCode == 200) {
			var user = {
				facebookUserId: data.id,
				username: data.username,
				firstName: data.first_name,
				lastName: data.last_name,
				email: data.email
			};
			deferred.resolve(user);
		}
		else {
			//logA
			//
		}
	});
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
