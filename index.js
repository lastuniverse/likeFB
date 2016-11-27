'use strict';

/*!
 * ws: a node.js websocket client
 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
 * MIT Licensed
 */

var LFB = {};

LFB.Server = require('./lib/LFBserver');

var server = new LFB.Server({port: 3000});
