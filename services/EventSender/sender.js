/*
 * event send service wrapper class
 */

var BaseService = require('../../common/baseservice')
	, redis = require('redis');

//
// 事件处理器基类
// folder - string, 该服务所在的绝对路径
//
function EventSender(folder, config){
	BaseService.call(this, folder, config, 'EventSender');
	var self = this;

	this.on('init', function(){
		self.init(config);
	});

	// 不要忘记响应关闭事件
	this.on('close', function(){
		self.close();
	});
};
require('util').inherits(EventSender, BaseService);
EventSender.prototype.constructor = EventSender;
module.exports=EventSender;

EventSender.prototype.close = function() {

	// cancel stream's listeners
	if (this.redisClient_) {
		this.redisClient_.quit();
	}

	if (this.interval_){
		clearInterval(this.interval_);
	}

	this.removeAllListeners();
};

EventSender.prototype.init = function(config) {
	var self = this;

	// 需要公开访问的服务的方法在这里定义
	this.public_ = {
		'fire' : this.fire,
		'fireImmediatelly' : this.fireImmediatelly
	};

	// 初始化发送事件队列
	this.initEventQueue(config);

	// 当初始化完成后，需要触发ready事件通知框架
	this.doConnect(config, function(){
		self.emit('ready');
	});	
	
};

EventSender.prototype.initEventQueue = function(config) {
	var self = this;	
	//
	// max_len 最大发送队列长度，当设置为1时表示立刻发射事件
	// max_time_to_fire 表示最大多长时间检查一次发射队列，默认为1毫秒
	//
	this.config_.max_len = this.config_["max_len"] || 1;
	this.config_.max_time_to_fire = this.config_["max_time_to_fire"] || 1;

	this.event_queue_ = [];
	this.interval_ = setInterval(function(){
		self.sendEventQueue();
	}, this.config_.max_time_to_fire);	

};

EventSender.prototype.doConnect = function(config, cb) {
	var self = this;

	// stream server(redis) config
	var redis_conf = config.stream_server[0];

	var addr = redis_conf.addr || "localhost";
	var port = redis_conf.port || 6379;
	var auth_pass = {
		auth_pass:redis_conf.auth_pass || null
	};

	this.redisClient_ = redis.createClient(port, addr, auth_pass);
	this.redisClient_.on('ready', function (){
		// return ready
		cb && cb();
	});

	this.redisClient_.on('error', function (err){
		logger.error('service <%s> connection error:%s.', self.name_, err.message);
	});
	this.redisClient_.on('end', function (){
		// redis will reconnect automatically
		logger.info("service <%s>, user end connection.", self.name_);
	});
};

EventSender.prototype.fire = function(topic, event_class, fields) {
	this.event_queue_.push({
		"topic" : topic,
		"class" : event_class,
		"fields" : fields
	});
	
	if (this.event_queue_.length >= this.config_.max_len){
		this.sendEventQueue();
	}
};

EventSender.prototype.fireImmediatelly = function(topic, event_class, fields, cb) {
	var jsonEvt = JSON.parse({
		"topic" : topic,
		"class" : event_class,
		"fields" : fields
	});

	var pipe = this.redisClient_.multi();
	this.config_.channels.forEach(function (channel){
		pipe.publish(channel, jsonEvt);
	});

	pipe.exec(cb);
};

EventSender.prototype.sendEventQueue = function() {
	var self = this;
	if (this.event_queue_.length) {
		var pipe = this.redisClient_.multi();
		var evt_queue = this.event_queue_;

		evt_queue.forEach(function(evt){
			// stringify event
			var jsonEvt = JSON.stringify(evt);

			// publish to each pub channels
			self.config_.channels.forEach(function (channel){
				pipe.publish(channel, jsonEvt);
			});			
		});

		// fire
		pipe.exec(function (err, replies){
			if (!err)
				return;

	        console.log("Fire events got " + replies.length + " replies");
	        /*
	        replies.forEach(function (reply, index) {
	            console.log("Reply " + index + ": " + reply.toString());
	        });	
	        */		
		});

		// reset event queue
		this.event_queue_ = [];
	}
};