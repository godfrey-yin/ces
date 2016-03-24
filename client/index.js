
/*
	redisClient - redis client object
	channel - channel name to sub/pub
*/
function Stream (redisClient, channel){

	/*
	evt定义
	{
		"topic":"<topic_name>",
		"class":"athena.real",
		"fields":{
			///////////////////
			// user define

			// for example.
			// ...

			"data":{
				"devid.pointid":"<tag_value>",
				"1.1":13.888,
				... ...
			},
			"recv":"<服务器接收时间，如：1412905743720>",
			"source":"<源时间戳（或者设备时间戳）>",
			"quality":{
				"tag2":"BAD",
				...
			},
			"sender":"<发送者ID>",
			"server":"<服务器ID>"
		}
	}
	*/	
	this.sendEvent = function (topic, class_name, fields){
		var evt = {
			"topic" : topic,
			"class" : class_name,
			"fields" : fields
		};

		redisClient.publish(channel, JSON.stringify(evt));
	};

	/*
		events - array of event
		[
			{
				"topic" : string,
				"class" : string,
				"fields" : object
			},
			...
		]
		cb - function (err, replies)
	*/
	this.sendEvents = function (events, cb){
		var pipe = redisClient.multi();
		events.forEach(function (event){
			pipe.publish(channel, JSON.stringify(event));
		});

		pipe.exec(cb);
	};

	/*
		cb - function (event)
			event {
				"topic" : string,
				"class" : string,
				"fields" : object
			}
	*/
	this.listenEvents = function (cb){
		redisClient.subscribe(channel);
		redisClient.on('message', function (channel, message){
			//
			// message is event
			//
			cb && cb(JSON.parse(message));
		});
	};

	this.closeListenEvents = function (){
		redisClient.unsubscribe(channel);
	};
};

exports.Stream = Stream;