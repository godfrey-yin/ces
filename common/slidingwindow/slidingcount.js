//
// 滑动时间窗口类
//
var SlidingWindow = require('./slidingwindow');

function SlidingCountWindow(topic, services, count){
	// base
	SlidingWindow.call(this, topic, services);
	this.count_ = count || 3;	// 默认是3个值

	// init
	this.init();
};
require('util').inherits(SlidingCountWindow, SlidingWindow);
SlidingCountWindow.prototype.constructor = SlidingCountWindow;
module.exports = SlidingCountWindow;

SlidingCountWindow.prototype.init = function() {
	this.ready_ = true;
};

// 
// 滑动计数器窗口(从父类继承)
//
SlidingCountWindow.prototype.slide = function(topic, fields, timestamp) {
	if (!fields)
		return;
	this.slidingCount_(fields, this.count_, timestamp);
};

//
// 滑动计数器窗口
//
SlidingCountWindow.prototype.slidingCount_ = function(fields, count, timestamp) {
	var timestamp_ = isNaN(timestamp) ? Date.now() : timestamp;

	for(var key in fields){
		if (!this.fields_[key]) 
			this.fields_[key] = {};
		this.fields_[key][timestamp_] = fields[key];

		var times_of_key = Object.keys(this.fields_[key]).sort();
		if (times_of_key.length > count){
			delete this.fields_[key][times_of_key.shift()];
		}
	}
};