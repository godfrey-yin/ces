var BaseHandler = require('../BaseHandler')
	, STW = require('../../common/slidingwindow').SlidingTimeWindow
	, SCW = require('../../common/slidingwindow').SlidingCountWindow;

function ExampleHandler(topic, broker){
	BaseHandler.call(this, topic, broker);

	// TODO
	// Add your own initialize functions here
	this.on('message', this.handleEvent);

	// Close when handler destroy
	this.on('close', function(){
		// TODO
	});

	// 创建滑动时间窗口
	this.stw_ = new STW(topic, 5*1000);
	this.scw_ = new SCW(topic, 5);
};
require('util').inherits(ExampleHandler, BaseHandler);
module.exports = ExampleHandler;
ExampleHandler.prototype.constructor = ExampleHandler;

// -- TODO --
/******************************************************************
 *     Add your own prototype members here.                       *
 *                                                                *
 ******************************************************************/

ExampleHandler.prototype.handleEvent = function(topic, fields) {
	// TODO
	// Add your own functions here

	console.log('----------------- Demo/ExampleHandler -------------------');
	console.log('Topic:', topic);

	console.log('Fields:', JSON.stringify(fields));
	console.log('Services: ');
	console.log(this.services.list());
	console.log('comment me to see what\'s going on!');

	// 滑动时间窗口
	console.log('SlidingTimeWindow');
	console.dir(this.stw_.getSeries());

	console.log('SlidingCountWindow');
	console.dir(this.scw_.getSeries());

	var calcSum = function (series){
		var sum = 0;
		series.forEach(function (item){
			sum += item.v;
		});

		return sum;
	};

	//
	// 发射事件DEMO
	// 需要特别注意如下的写法，否则将会陷入无尽的循环中
	//
	if (topic != 'test_fire') {
		
		this.sender.fire('test_fire', "showme", 
			{
				'Time window average of tag0: ':calcSum(this.stw_.getSeries("tag0") || []),
				'Count window average of tag1: ':calcSum(this.scw_.getSeries("tag1") || [])
			}
		);
	}

	//
	// NOTE:
	// 不要忘记实现滑动
	//
	this.stw_.slide(topic, fields.data, fields.recv);
	this.scw_.slide(topic, fields.data);
};