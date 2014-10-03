var Account = require('../models/account');
var logger = require('../util/logger');
var Q = require('q');

function AccountRepository() {
	this.findById = findAccountById;
	this.createAccount = createAccount;
	this.findAccountByEmail = findAccountByEmail;
	this.updateAccount = updateAccount;
	this.updateLastLoginDate = updateLastLoginDate;
	this.disableAccount = disableAccount;
	this.findOrCreateAccount = findOrCreateAccount;
}

function findAccountById(id) {
	var deferred = Q.defer();
	var query = {
		_id: id
	};
	Account.findOne(query, function(err, profile) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(profile);
		}
	});
	return deferred.promise;
}

function createAccount(firstName, lastName, email, facebookUserId) {
	console.log("create account...")
	var deferred = Q.defer();
	var account = new Account({
		firstName: firstName,
		lastName: lastName,
		facebookUserId: facebookUserId || null,
		email: email
	});
	account.save(function(err, account) {
		console.log("accountsave...")

		if (err) {
			console.log(err)

			deferred.reject(new Error(err));
		}
		else {
			console.log("resolve...")

			deferred.resolve(account);
		}
	});
	return deferred.promise;
}

function findAccountByEmail(email) {
	console.log("inside findAccountByEmail()");
	var deferred = Q.defer();
	Account.findOne({
		email: email
	}, function(err, foundUsername) {
		console.log("doing the finding");
		if (err) {
			console.log("finderr");

			deferred.reject(new Error(err));
		}
		else {
			console.log("resolve");
			deferred.resolve(foundUsername);
		}
	});
	return deferred.promise;
}

function updateAccount(account) {
	var deferred = Q.defer();
	var query = {
		username: account.username
	};
	var options = {
		'new': true
	};
	Account.findOneAndUpdate(query,
		{
			firstName: account.firstName,
			lastName: account.lastName,
			email: account.email
		},
		options,
		function(err, account) {
			if (err) {
				deferred.reject(new Error(err));
			}
			else {
				deferred.resolve(account);
			}
		}
	);
	return deferred.promise;
}

function updateLastLoginDate(account, lastLogin) {
	var deferred = Q.defer();
	var query = {
		username: account.username
	};
	var options = {
		'new': true
	};
	Account.findOneAndUpdate(query,
		{
			lastLogin: lastLogin
		},
		options,
		function(err, account) {
			if (err) {
				deferred.reject(new Error(err));
			}
			else {
				deferred.resolve(account);
			}
		}
	);
	return deferred.promise;
}

function disableAccount(userId) {
	var deferred = Q.defer();
	var query = {
		_id: userId
	};
	var options = {
		'new': true
	};
	Account.findOneAndUpdate(query,
		{
			isActive: false,
			canLogin: false
		},
		options,
		function(err, account) {
			if (err) {
				deferred.reject(new Error(err));
			}
			else {
				deferred.resolve(account);
			}
		}
	);
	return deferred.promise;
}

// Attempt to find an existing account by username, and if it cannot find it, it creates it
// userProfile is of type UserProfile from Passport.js. See http://passportjs.org/guide/profile/
function findOrCreateAccount(facebookUserId, email, firstName, lastName) {
	console.log("findorcreateaccount...")
	var deferred = Q.defer();
	this.findAccountByEmail(email)
		.then(function(account) {
			console.log("findByEmail done")
			console.log(account)
			
			if (account && account.email && account.email !== '') {
				deferred.resolve(account); // Found!
			}
			else {
				console.log("going to create....")

				// Let's create the account
				createAccount(firstName, lastName, email, facebookUserId)
					.then(function(account) {
						console.log("created, ended deferred")
						deferred.resolve(account);
					});
			}
		})
		.fail(function(err) {
			deferred.reject(err);
		});
	return deferred.promise;
}

module.exports = AccountRepository;