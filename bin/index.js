"use strict";

var factory = Object.assign({}, require('./format'));
factory.ansi = Object.assign({}, require('./ansi'));
factory.config = Object.assign({}, require('./format-config'));

module.exports = factory;