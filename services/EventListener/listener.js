/*
 * event listen service wrapper class
 */

var BaseService = require('../../common/baseservice')
	, redis = require('redis');

//
// 事件处理器基类
// folder - string, 该服务所在的绝对路径
//
function EventListener(folder, config){
	BaseService.call(this, folder, config, 'EventListener');

	var self = this;
	this.is_subing_ = false;

	this.on('init', function(){
		self.init(config);
	});

	// 不要忘记响应关闭事件
	this.on('close', function(){
		self.close();
	});
};
require('util').inherits(EventListener, BaseService);
EventListener.prototype.constructor = EventListener;
module.exports=EventListener;

EventListener.prototype.close = function() {
	// cancel subscribe
	this.unsub();

	// cancel stream's listeners
	if (this.redisClient_) {
		this.redisClient_.quit();
	}

	if (this.interval_){
		clearInterval(this.interval_);
	}
	this.removeAllListeners();
};

EventListener.prototype.init = function(config) {
	var self = this;

	// 需要公开访问的服务的方法在这里定义
	this.public_ = {
		'sub' : this.sub,
		'unsub' : this.unsub
	};

	// 当初始化完成后，需要触发ready事件通知框架
	this.doConnect(config, function(){
		self.emit('ready');
	});	
	
};

EventListener.prototype.doConnect = function(config, cb) {
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

EventListener.prototype.sub = function(cb) {
	var self = this;
	if (this.is_subing_)
		return;

	this.is_subing_ = true;

	// do sub
	this.config_.channels.forEach(function (channel){
		self.redisClient_.subscribe(channel);
	});

	this.redisClient_.on('message', function (channel, message){
		// event == message
		try {
			var jsonEvt = JSON.parse(message);
			cb && cb([jsonEvt]);
		}
		catch (ex){
			console.error("Parse event error: %s.", ex.message);
		}
	});
};

EventListener.prototype.unsub = function() {
	var self = this;
	if (!this.is_subing_)
		return;

	// set signal
	this.is_subing_ = false;

	// unsub
	this.config_.channels.forEach(function (channel){
		self.redisClient_.unsubscribe(channel);
	});
};
