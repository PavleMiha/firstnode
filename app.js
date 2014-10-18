var http = require('http');
var mongoose = require('mongoose');
var express = require('express');
var Q = require('q');
var request = require('request');
var app = express();
var bodyParser = require("body-parser");
var db;
var AccountRepository = require("./repositories/AccountRepository")
var EventRepository = require("./repositories/EventRepository")
var path = require("path")
var SecurityToken = require('./infrastructure/securityToken');
var FileDriver = require('./infrastructure/FileDriver')
var moment = require('moment');
var busboy = require('connect-busboy');
app.use(bodyParser.json({
  extended: true,
}));
app.use(busboy());
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
function postEvent(req, res) {
	console.log('postEvent\n');
	
	var eventRepository = new EventRepository();
	
	var date = moment(req.body.date, 'YYYY-MM-DD HH:mm');
	eventRepository.createEvent(req.body.title, req.body.description, date, req.body.imageID).then(
		function() {
			console.log("ASDFASDFASDFASDFDONE");
		})
	console.log(date.toDate());
	res.send("{\"result\":\"success\"}");


}
function getEventsForDate(req, res) {
	console.log('getEventsForData\n');
	
	console.log(req.body);

	var apiAccessToken = req.body.token;
	var dateString = req.body.date;
	
	var date = moment(dateString, 'YYYY-MM-DD HH:mm');
	var endDate = moment(dateString, 'YYYY-MM-DD HH:mm').add(2, 'days');
	console.log(date);
	
	var eventRepository = new EventRepository();
	
	eventRepository.findInDates(date.toDate(), endDate.toDate()).then(
		function(list) {
			console.log("FIND WORKED\n")
			console.log(JSON.stringify(list))
			res.send(JSON.stringify(list));
		}, function (error) {
			console.log("FIND FAILED\n")
			res.send("{\"token\":\"complete fuckup of the heart\"}");
		}
 	);
}

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
app.post('/api/postevent', postEvent);
app.post('/api/getevents', getEventsForDate);

app.post('/api/auth/facebook', handleFacebookMobileLoginRequest);

//var Greeting= mongoose.model('greeting', greetingSchema);

db = mongoose.connect(dbPath);
var fileDriver = new FileDriver(db);
app.use(express.static(path.join(__dirname, 'public')));

 
app.post('/files', function(req,res) {fileDriver.handleUploadRequest(req,res);});
app.get('/files/:id', function(req, res) {fileDriver.handleGet(req,res);});
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
