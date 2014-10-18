var Event = require('../models/event');
var AccountRepository = require('../repositories/AccountRepository');
var logger = require('../util/logger');
var Q = require('q');

function EventRepository() {
	this.findById = findEventById;
	this.find = findByCriteria;
	this.findInDates = findEventsBetweenDates;
	this.createEvent = createEvent;
	//this.findTemplatesListsForUser = findTemplatesListsForUser;
	this.updateEvent = updateEvent;
	//this.deleteEvent = deleteEvent;
	//this.addItemToShoppingList = addItem;
	//this.updateShoppingListItem = updateItem;
	//this.deleteShoppingListItem = deleteItem;
	//this.crossoutShoppingListItem = crossoutItem;
}

function findEventsBetweenDates(start, end) {
	var deferred = Q.defer();
	console.log(start);
	console.log(end);
	Event.find({"date": {"$gte": start, "$lt": end}}, function(err, list) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			if (list) {
				deferred.resolve(list);
			}
			else {
				deferred.resolve(null);
			}
		}
	});
	return deferred.promise;
}

function findEventById(id) {
	var deferred = Q.defer();
	Event.findOne({ _id: id }, function(err, template) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			if (template && template.isActive) {
				deferred.resolve(template);
			}
			else {
				deferred.resolve(null);
			}
		}
	});
	return deferred.promise;
}

function findByCriteria(criteria) {
	var deferred = Q.defer();
	Event.find(criteria, function(err, lists) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(lists);
		}
	});
	return deferred.promise;
}

function createEvent(title, description, date, imageID) {
	var deferred = Q.defer();
	var newEvent = new Event({
		title: title,
		description: description,
		date: date,
		imageID: imageID,
	});
	//var accountRepository = new AccountRepository();
console.log(newEvent);
	newEvent.save(function(err, savedEvent) {
		console.log("INSIDEOUTSIDE");
		if (err) {
			console.log(err);
			deferred.reject(new Error(err));
		}
		else {
			console.log("DONE INSIDE");
			deferred.resolve(savedEvent);
		}
	});

	return deferred.promise;
}

function updateEvent(id, parameters) {
	var deferred = Q.defer();

	// Check for unknown parameters
	for (var key in parameters) {
		if (key !== 'title' && key !== 'description' && key !== 'date' && key !== 'location') {
			// Unexpected parameters, raise error
			var err = {
				message: 'Unexpected parameter: ' + key,
				isBadRequest: true
			};
			deferred.reject(err);
		}
	}

	var query = {
		_id: id
	};
	var options = {
		'new': true
	};
	var update = {};
	// Setup field to update

	if (parameters.title) {
		update.title = parameters.title;
	}
	if (parameters.description) {
		update.description = parameters.description;
	}
	if (parameters.date) {
		update.date = parameters.date;
	}

	Event.findOneAndUpdate(query, update, options, function(err, shoppingList) {
		if (err) {
			deferred.reject(err);
		}
		else {
			deferred.resolve(shoppingList);
		}
	});
	return deferred.promise;
}

//make it invoke the AccountRepository method that removes the list id from the collection of shopping lists of the user
//and mark the deleted shopping list as active = false
/*function deleteEvent(account, shoppingList) {
	var deferred = Q.defer();
	// 1) Mark the list as active = false
	shoppingList.isActive = false;
	shoppingList.lastUpdate = Date.now();
	shoppingList.save(function(err, savedShoppingList) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			// 2) Remove the id of the list from the collection of shopping lists of the user
			account.shoppingLists.pull(savedShoppingList._id);
			account.save(function(err, savedAccount) {
				if (err) {
					deferred.reject(new Error(err));
				}
				else {
					deferred.resolve(savedShoppingList);
				}
			});
		}
	});
	return deferred.promise;
}*/
/*
function addItem(shoppingList, name, quantity, comment) {
	var deferred = Q.defer();
	var item = {
		name: name,
		quantity: quantity,
		comment: comment,
		isInTheCart: false
	};
	shoppingList.shoppingItems.push(item);
	shoppingList.save(function(err, savedShoppingList) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(savedShoppingList);
		}
	});
	return deferred.promise;
}

function updateItem(shoppingList, item, name, quantity, comment) {
	var deferred = Q.defer();
	item.name = name;
	item.quantity = quantity;
	item.comment = comment;
	shoppingList.save(function(err, savedShoppingList) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(savedShoppingList);
		}
	});
	return deferred.promise;
}

function deleteItem(shoppingList, itemId) {
	var deferred = Q.defer();
	shoppingList.shoppingItems.id(itemId).remove(); // remove the item
	shoppingList.save(function(err, savedShoppingList) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(savedShoppingList);
		}
	});
	return deferred.promise;
}

function crossoutItem(shoppingList, itemId) {
	var deferred = Q.defer();
	var item = shoppingList.shoppingItems.id(itemId);
	item.isInTheCart = true;
	shoppingList.save(function(err, savedShoppingList) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(savedShoppingList);
		}
	});
	return deferred.promise;
}
*/
module.exports = EventRepository;