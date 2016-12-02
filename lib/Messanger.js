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
	this.create("__system__", {});

	// какойто клиент подключился к нам
	this.wss.on('connection', function connection(ws) {

		self.register("__system__", ws);

		ws.on('message', function incoming(message) {
			console.log('received: %s', message);
			try {
				let json = JSON.parse(message);

				// if (!json)
				// 	return console.log("это не является сообщением: ", json);

				if (typeof json !== "object")
					return console.log("это не является сообщением: ", json);

				if (json && 'name' in json)
					self.broadcast(json.name, json.data);
			} catch (err) {

			}

		});


	});

}


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

	// создаем с объекте с клиентским соединением уникальный идентификатор
	if (!('unique_id' in client))
		client.unique_id = unique_id();

	// возврат если клиент уже подписан на эту рассылку
	if (client.unique_id in this.mailing[name].clients)
		return console.log("клиент уже подписанн на рассылку " + name);

	// подписываем клиента на рассылку
	this.mailing[name].clients[client.unique_id] = client;
	return console.log("клиент успешно подписанн на рассылку " + name);

};


// отправить сообщение
// где:
//	client - объект с соединением с конкретным клиентом
//	name - название списка рассылки
//	data - данные для отправки
Messanger.prototype.send = function(client, name, data) {
	const json = {
		name: name,
		data: data
	};

	try {
		client.send(JSON.stringify(json));
	} catch (err) {}
};

// отправить сообщение всем
// где:
//	name - список рассылки
//	data - json с данными для отправки
Messanger.prototype.broadcast = function(name, data) {
	// возврат если не указанно название рассылки
	if (!name && typeof name !== 'string' && name.length == 0)
		return console.log("не указанно название рассылки");

	// возврат если рассылка с таким именем уже существует
	if (!(name in this.mailing))
		return console.log("рассылки " + name + " не существует");

	// в цикле просматриваем подключенных клиентов и отправляем им сообщение

	const self = this;
	const clients = self.mailing[name].clients
	Object.keys(clients).forEach(function(key) {
		try {
			// фильтры должны применятся гдето тут :)
			self.send(clients[key], name, data);
		} catch (err) {
			console.log("ERROR ", err);
		}
	});
};


module.exports = Messanger;
