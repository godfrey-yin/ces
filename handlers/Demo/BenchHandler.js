var BaseHandler = require('../BaseHandler');

function BenchHandler(topic, broker){
	BaseHandler.call(this, topic, broker);

	// TODO
	// Add your own initialize functions here
	this.on('message', this.handleEvent);

	// Close when handler destroy
	this.on('close', function(){
		// TODO
	});

};
require('util').inherits(BenchHandler, BaseHandler);
module.exports = BenchHandler;
BenchHandler.prototype.constructor = BenchHandler;

// -- TODO --
/******************************************************************
 *     Add your own prototype members here.                       *
 *                                                                *
 ******************************************************************/

BenchHandler.prototype.handleEvent = function(topic, fields) {
	// TODO
};