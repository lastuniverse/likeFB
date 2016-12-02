'use strict';

/*!
 * ws: a node.js websocket client
 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
 * MIT Licensed
 */

var messanger = require('./lib/Messanger');

var server = new messanger({port: 3000});

// var Server = require('./lib/LFBserver');

// var LFB = {};

// LFB.Server = Server;

// var server = new LFB.Server({port: 3000});




var WebSocket = require('ws');
var ws1 = new WebSocket('ws://localhost:3000/', {
  protocolVersion: 8,
  origin: 'http://localhost:3000/'
});

ws1.on('open', function open() {
  //console.log('connected');
  ws1.send(
    JSON.stringify({name: "__system__",data: {test: "blablabla1"}})
  );
  ws1.send(
    JSON.stringify({name: "12345",data: {test: "blablabla2"}})
  );
  ws1.send(JSON.stringify("blablabla3"));

});

ws1.on('close', function close() {
  //console.log('disconnected');
});

ws1.on('message', function (data, flags) {
  console.log('ws1 get message: ', data);
});

var ws2 = new WebSocket('ws://localhost:3000/', {
  protocolVersion: 8,
  origin: 'http://localhost:3000/'
});

ws2.on('open', function open() {
  // console.log('connected');
  // ws2.send("ws2.send1", {mask: true});
});

ws2.on('close', function close() {
  // console.log('disconnected');
});

ws2.on('message', function (data, flags) {
  console.log('ws2 get message: ', data);
});
