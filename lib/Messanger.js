'use strict';

var WebSocketServer = require('ws').Server;
//var EventEmitter = require('events').EventEmitter;
//var util = require('util');
var unique_id = require('./Unique');



function Messanger(options) {
	// всякая инициализационная хрень
	if (this instanceof Messanger === false) {
		return new Messanger(options);
	}

	// всегда имеем доступ к this xthtp self
	var self = this;

	// задаем парамеиры по умолчанию
	this.options = options;

	// создаем объект WebSocketServer-а слушающий на порту options.port
	// будет доступен из внешнего объекта object.wss
	this.wss = new WebSocketServer({
		port: options.port
	});

	// создаем в объекте хранилище для регистрации рассылок
	this.mailing = {};

	// создаем в объекте хранилище для middlewares
	this.middlewares = [];

	// создаем системную рассылку. на нее будут подписанны все входящие соединения
	this.create("/__system__", {});

	// какойто клиент подключился к нам
	this.wss.on('connection', function connection(ws) {

		// создаем с объекте с клиентским соединением уникальный идентификатор
		if (!('unique_id' in ws))
			ws.unique_id = unique_id();

		// все входящие подключения подписываем на системную рассылку
		self.register("/__system__", ws);

		// если мы получили сообщение от клиента
		ws.on('message', function incoming(message) {
			try {

				// допустимое сообщение - json
				let json = JSON.parse(message);

				// если сообщение не json выходим
				if (typeof json !== "object")
					console.log("это не является сообщением: ", json);

				// если в сообщении нет name и data - выходим
				if (!('name' in json) || !('data' in json))
					console.log("это не является сообщением: ", json);

				// формируем объект request
				let req = {
					"client": ws,
					"message": json
				};

				// флаг остановки обработки middlewares
				// выставляется в false если вызван broadcast или не вызван next
				let next_turn = false;

				// формируем объект response
				let res = {
					"client": ws,
					"req": ws.upgradeReq,
					"message": json,
					"end": function (){
						// прекращаем обработку сообщения
						next_turn = false;
					},
					"send": function (name, data){
						if(!name)
							// отправляем обратно отправителю от имени рассылки
							return self._send(ws, json.name, json.data);
						if(!data)
							// отправляем обратно отправителю от имени рассылки с произвольной data
							return self._send(ws, json.name, name);
						// отправляем обратно отправителю от произвольной рассылки и data
						self._send(ws, name, data);
					},
					"broadcast": function (name,data){
						if(!name){
							// отправляем всем от имени рассылки и прекращаем
							// обработку сообщения в последующих middlewares
							next_turn = false;
							return self._broadcast(json.name, json.data);
						}
						if(!data){
							// отправляем всем от имени рассылки с произвольной data
							// и прекращаем обработку сообщения в последующих middlewares
							next_turn = false;
							return self._broadcast(json.name, name);
						}
						// позволяем отправить всем от произвольного имени рассылки
						// без прекращения обработки сообщения в последующих middlewares
						self._broadcast(name, data);
					}
				};

				let next = function(err) {
					next_turn = true;
				};

				for (let key in self.middlewares) {
					const middleware = self.middlewares[key];

					if (self._test_middleware(middleware.name, json.name)) {
						next_turn == false;

						// вызываем все обработчики по очереди из очередного подходящего middleware
						middleware.cb(req, res, next);

						// прервать цепочку middlewares если в очередном не был вызван next
						if (next_turn == false)
							break;
					}
				}

				//self._broadcast(json.name, json.data);

			} catch (err) {
				return console.log("ошибка обработки сообщения от ...: ", err);
			}

		});


	});

}



// создать middleware
// где:
//	name - название списка рассылки (строка или regexp)
//	cb - промежуточный обработчик
Messanger.prototype.use = function(name, cb) {

	// возврат если name не строка или не регулярка
	if (!name && ((typeof name !== 'string') || (typeof name !== 'object')))
		return console.log("не задано имя рассылки: ", name);

	// возврат если cb не функция
	if (!cb && typeof cb !== 'function')
		return console.log("не задан обработчик для: ", name);


	// формируем объект с обработчиком и его именем
	const middleware = {
		name: name,
		cb: cb
	};

	// сохраняем обработчик
	this.middlewares.push(middleware);

	return console.log("middleware " + name + " успешно добавлен");

};


// внутренняя функция проверки наличия middleware и правильности задания имени middleware
// где:
//	name - название списка рассылки (строка или regexp)
Messanger.prototype._test_middleware = function(name, middleware_name) {
	// возврат если name не существует или задан неверно
	// минимальный name '/' или //
	if (!name)
		return false;

	// возврат true если name строка и соответствует текущему middleware_name
	if (typeof name === 'string' && name == middleware_name)
		return true;

	// возврат если name репулярка и соответствует текущему middleware_name
	if (Object.prototype.toString.call(name) == "[object RegExp]" && name.test(middleware_name))
		return true;
	// если ни с чем не совпало возвращаем false
	return false;
};

// создаем рассылку рассылку
// где:
//	name - название списка рассылки
//	options - параметры рассылки
Messanger.prototype.create = function(name, options) {

	// возврат если не указанно название рассылки
	if (!name && typeof name !== 'string' && name.length == 0)
		return console.log("не указанно название рассылки");

	// возврат если рассылка с таким именем уже существует
	if (name in this.mailing)
		return console.log("рассылка " + name + " уже существует");

	// создаем рассылку
	this.mailing[name] = {
		clients: {},
		filters: options.filters || {},
		queue: options.queue || false
	};
	return console.log("рассылка " + name + " успешно создана");
};


// подписаться на рассылку
// где:
//	name - название списка рассылки
//	client - объект с соединением с конкретным клиентом
Messanger.prototype.register = function(name, client) {

	// возврат если не указанно название рассылки
	if (!name && typeof name !== 'string' && name.length == 0)
		return console.log("не указанно название рассылки");

	// возврат если рассылки с таким именем не существует
	if (!(name in this.mailing))
		return console.log("рассылка " + name + " не существует");

	// возврат если клиент уже подписан на эту рассылку
	if (client.unique_id in this.mailing[name].clients)
		return console.log("клиент уже подписанн на рассылку " + name);

	// подписываем клиента на рассылку
	this.mailing[name].clients[client.unique_id] = client;
	return console.log("клиент успешно подписанн на рассылку " + name);

};


// внутренняя функция отправки сообщения
// где:
//	client - объект с соединением с конкретным клиентом
//	name - название списка рассылки
//	data - данные для отправки
Messanger.prototype._send = function(client, name, data) {
	const json = {
		name: name,
		data: data
	};

	try {
		client.send(JSON.stringify(json));
	} catch (err) {}
};

// внутренняя функция отправки сообщения всем
// где:
//	name - список рассылки
//	data - json с данными для отправки
Messanger.prototype._broadcast = function(name, data) {
	// возврат если не указанно название рассылки
	if (!name && typeof name !== 'string' && name.length == 0)
		return console.log("не указанно название рассылки");

	// возврат если рассылка с таким именем уже существует
	if (!(name in this.mailing))
		return console.log("рассылки " + name + " не существует");

	// в цикле просматриваем подключенных клиентов и отправляем им сообщение

	const self = this;

	// получаем клиентов подписанных на рассылку name
	const clients = self.mailing[name].clients

	// отправляем им всем сообщение от имени рассылки name
	Object.keys(clients).forEach(function(key) {
		try {
			// фильтры должны применятся гдето тут :)
			self._send(clients[key], name, data);
		} catch (err) {
			console.log("ERROR ", err);
		}
	});
};


module.exports = Messanger;
