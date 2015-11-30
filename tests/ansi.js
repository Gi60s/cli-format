"use strict";
var ansi                = require('../bin/ansi');
var test                = require('tape');

test('ansi.escape is array of strings', function(t) {
    if (!Array.isArray(ansi.escape)) {
        t.fail('ansi.escape is not an array');
    } else {
        ansi.escape.forEach(function (escape) {
            t.equal(typeof escape, 'string', 'is string');
        });
    }
    t.end();
});

test('ansi.codes is object map', function(t) {
    t.equal(typeof ansi.codes, 'object', 'is object');
    t.end();
});

test('ansi.codes properties map to group objects', function(t) {
    if (typeof ansi.codes === 'object') {
        Object.keys(ansi.codes).forEach(function(group) {
            t.equal(typeof ansi.codes[group], 'object', 'is object');
        });
    }
    t.end();
});

test('ansi.codes groups map objects with values as numbers', function(t) {
    if (typeof ansi.codes === 'object') {
        Object.keys(ansi.codes).forEach(function(group) {
            if (typeof ansi.codes === 'object') {
                Object.keys(ansi.codes[group]).forEach(function(name) {
                    var value = ansi.codes[group][name];
                    t.equal(typeof value, 'number', 'is number');
                    t.ok(!isNaN(value), 'is number (!NaN)');
                });
            }
        });
    }
    t.end();
});