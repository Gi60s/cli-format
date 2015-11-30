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

test('ansi.separate', function(t) {
    var maps;

    //set escape sequences to look for
    ansi.escape = [
        '\u001b',
        '\u009b'
    ];

    maps = [
        {
            input:
                '1' +
                '\u001b[1m 2' +
                '\u001b[4m 3' +
                '\u001b[0;3;4m 4' +
                '\u001b[0m',
            output: '1 2 3 4',
            format: [
                { index: 1, codes: [1] },
                { index: 3, codes: [1,4] },
                { index: 5, codes: [0,3,4] },
                { index: 7, codes: [0] }
            ]
        },
        {
            input:
                '1' +
                '\u009b[1m 2' +
                '\u009b[4m 3' +
                '\u009b[0;3;4m 4' +
                '\u009b[0m',
                output: '1 2 3 4',
            format: [
                { index: 1, codes: [1] },
                { index: 3, codes: [1,4] },
                { index: 5, codes: [0,3,4] },
                { index: 7, codes: [0] }
            ]
        }
    ];

    maps.forEach(function(map, eIndex) {
        //if (eIndex === 2) t.fail('>>> ' + (typeof process.stdout.isTTY === 'undefined'));
        var sep = ansi.separate(map.input);

        //validate string output
        t.equal(sep.string, map.output, 'string match at ' + eIndex);

        //validate format results length
        if (!process.stdout.isTTY) {
            t.skip('Cannot test format results when in a non-interactive terminal (i.e. when piping results)');
        } else if (sep.format.length !== map.format.length) {
            t.fail('Format length (' + sep.format.length + ') ' +
                'doesn\'t match mapped format length (' + map.format.length + ') at ' + eIndex);
        } else {

            //validate each format result
            map.format.forEach(function(format, index) {
                var f = sep.format[index];

                //validate format index
                t.equal(format.index, f.index, 'index match at ' + eIndex + ':' + index);

                //validate format codes
                if (f.codes.length !== format.codes.length) {
                    t.fail('Format codes length (' + f.codes.length + ') ' +
                        'doesn\'t match mapped codes length (' + format.codes.length + ') ' +
                        'at index: ' + eIndex + ':' + index);
                } else {
                    format.codes.forEach(function(code, cIndex) {
                        t.ok(f.codes.indexOf(code) !== -1, 'code match at index ' + eIndex + ':' + index + ':' + cIndex);
                    });
                }
            });
        }
    });

    t.end();
});

test('ansi.trim', function(t) {
    var input;
    var on = '\u001b[1;3m';
    var off = '\u001b[0m';

    //set escape sequences to look for
    ansi.escape = [
        '\u001b',
        '\u009b'
    ];

    t.equal(ansi.trim('   foo   ', true, false), 'foo   ',    'trim all start');
    t.equal(ansi.trim('   foo   ', -1,   false), '   foo   ', 'trim none start');
    t.equal(ansi.trim('   foo   ', 1,    false), '  foo   ',  'trim 1 start');
    t.equal(ansi.trim('   foo   ', 2,    false), ' foo   ',   'trim 2 start');
    t.equal(ansi.trim('   foo   ', 5,    false), 'foo   ',    'trim 5 start');

    t.equal(ansi.trim('   foo   ', false, true), '   foo',    'trim all end');
    t.equal(ansi.trim('   foo   ', false, -1),   '   foo   ', 'trim none end');
    t.equal(ansi.trim('   foo   ', false, 1),    '   foo  ',  'trim 1 end');
    t.equal(ansi.trim('   foo   ', false, 2),    '   foo ',   'trim 2 end');
    t.equal(ansi.trim('   foo   ', false, 5),    '   foo',    'trim 5 end');

    input = ' ' + on + '  foo   ';
    t.equal(ansi.trim(input, true, false), on + 'foo   ',     'trim all start');
    t.equal(ansi.trim(input, -1,   false), input,             'trim none start');
    t.equal(ansi.trim(input, 1,    false), on + '  foo   ',   'trim 1 start');
    t.equal(ansi.trim(input, 2,    false), on + ' foo   ',    'trim 2 start');
    t.equal(ansi.trim(input, 5,    false), on + 'foo   ',     'trim 5 start');

    input = '   foo  ' + off + ' ';
    t.equal(ansi.trim(input, false, true), '   foo' + off,    'trim all end');
    t.equal(ansi.trim(input, false, -1),   input,             'trim none end');
    t.equal(ansi.trim(input, false, 1),    '   foo  ' + off,  'trim 1 end');
    t.equal(ansi.trim(input, false, 2),    '   foo ' + off,   'trim 2 end');
    t.equal(ansi.trim(input, false, 5),    '   foo' + off,    'trim 5 end');

    t.end();
});