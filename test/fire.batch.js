var redis = require('redis');
var config = require('./fire.batch.json');
var Stream = require('../client').Stream;

var redisClient = redis.createClient(config.port, config.addr, config.auth_pass);
var stream = new Stream(redisClient, config.channel);

var outClient = redis.createClient(config.port, config.addr, config.auth_pass);
var output = new Stream(outClient, config.output);
output.listenEvents(function (ev){
	console.log("---------------------------------");
	console.log("Received output event.");
	console.dir(ev);
	console.log("---------------------------------");
});

var count = 10;
var tagcount = 10;
var topics = [];
for (var i=1; i<=count; i++){
	topics.push('test' + i);
}
var x = 0, y = 0, i = 0;

setInterval(function(){
	var d = new Date();
	var evs = [];
	topics.forEach(function(topic){
		var ev = {
			"topic" : topic,
			"class" : "demo",
			"fields" : {
				"data":{'bad_tag':'-'},
				"recv":d.valueOf(),
				"source":d.valueOf(),
				"quality":{
					'bad_tag':'NOT_CONNECTED'
				}
			}
		};
		for (var i=0; i<tagcount; i++){
			ev.fields.data['tag'+i] = i;
		}

		evs.push(ev);
	});

	var sendEvent = function (){
		for (var i=0; i<evs.length; i++) {
			var evt_ = evs[i];
			stream.sendEvent(evt_.topic, evt_.class, evt_.fields);
		}
	};

	var sendEvents = function (){
		stream.sendEvents(evs);
	};

	var start = (new Date()).valueOf();
	sendEvents();
	var end = (new Date()).valueOf();
	
	console.log('%s fire %s events, %s tags per event, %s ms', 
		(new Date()).valueOf(), evs.length, tagcount, (end-start));

}, 1000);