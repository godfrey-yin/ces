var BaseHandler = require('../BaseHandler');

function ShowMeHandler(topic, broker){
	BaseHandler.call(this, topic, broker);

	// TODO
	// Add your own initialize functions here
	this.on('message', this.handleEvent);

	// Close when handler destroy
	this.on('close', function(){
		// TODO
	});
};
require('util').inherits(ShowMeHandler, BaseHandler);
module.exports = ShowMeHandler;
ShowMeHandler.prototype.constructor = ShowMeHandler;

// -- TODO --
/******************************************************************
 *     Add your own prototype members here.                       *
 *                                                                *
 ******************************************************************/

ShowMeHandler.prototype.handleEvent = function(topic, fields) {
	// TODO
	// Add your own functions here
	console.log("#######################################");
	console.log("Show Me!");
	console.dir(fields);
	console.log("#######################################")
};