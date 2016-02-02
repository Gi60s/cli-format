"use strict";

var factory = require('./format');
factory.ansi = Object.assign({}, require('./ansi'));
factory.defaults = Object.assign({}, require('./format-config'));

module.exports = factory;