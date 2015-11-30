"use strict";
var config              = require('../bin/format-config');
var format              = require('../bin/format');
var test                = require('tape');

test('format.stringWidth', function(t) {
    //assign special lengths to characters not handled by string-width module
    config.lengths = { '\u200B': 0 };

    //tests
    t.equal(format.stringWidth('古'), 2, 'double width character');
    t.equal(format.stringWidth('\u200B'), 0, 'zero width character');
    t.equal(format.stringWidth('x'), 1, 'single width character');
    t.end();
});

test('format.words', function(t) {
    //assign characters that represent word breaks
    config.breaks = [ ' ', '-', '\n', '\u2007', '\u2060' ];

    //tests
    t.deepEqual(format.words('This is a test').words, ['This ', 'is ', 'a ', 'test'], 'spaces');
    t.deepEqual(format.words('crazy-good').words, ['crazy-', 'good'], 'dash');
    t.deepEqual(format.words('new\nline').words, ['new\n', 'line'], 'new line');
    t.deepEqual(format.words('superlong\u2060word').words, ['superlong\u2060', 'word'], 'long word without space');
    t.end();
});

test('format.transform', function(t) {
    //assign transforms
    config.transform = {
        '\r\n': '\n',
        '\t': '  '
    };

    //tests
    t.equal(format.transform('Hello\r\nBob'), 'Hello\nBob', 'Unnecessary carriage return');
    t.equal(format.transform('Tab\tHere'), 'Tab  Here', 'Tab to spaces');
    t.end();
});

test('format.lines', function(t) {
    var input;
    var config = {
        ansi: true,
        availableWidth: 80,
        firstLineIndent: '',
        hangingIndent: '',
        filler: ' ',
        hardBreak: '-',
        paddingLeft: '',
        paddingMiddle: '   ',
        paddingRight: '',
        trimEndOfLine: true,
        trimStartOfLine: false,
        width: 80
    };

    //   123456789 123456789 123456789X
    input =
        'This statement is being placed ' +
        'into multiple lines because it ' +
        'hits the width limit of its ' +
        'own accord.';
    t.deepEqual(
        format.lines(input, Object.assign({}, config, { width: 30, filler: '' })),
        [
            '\u001b[0mThis statement is being placed\u001b[0m',
            '\u001b[0minto multiple lines because it\u001b[0m',
            '\u001b[0mhits the width limit of its\u001b[0m',
            '\u001b[0mown accord.\u001b[0m'
        ],
        'no formatting and no fill'
    );
    t.deepEqual(
        format.lines(input, Object.assign({}, config, { width: 30 })),
        [
            '\u001b[0mThis statement is being placed\u001b[0m',
            '\u001b[0minto multiple lines because it\u001b[0m',
            '\u001b[0mhits the width limit of its\u001b[0m   ',
            '\u001b[0mown accord.\u001b[0m                   '
        ],
        'no formatting and fill with spaces'
    );

    input = '1234 \u001b[1m678 901234\u001b[0m 56';
    t.deepEqual(
        format.lines(input, Object.assign({}, config, { width: 10, filler: '' })),
        [
            '\u001b[0m1234 \u001b[0;1m678\u001b[0m',
            '\u001b[0;1m901234\u001b[0m 56\u001b[0m'
        ]
        , 'formatting split between two lines');

    //   123456789 123456789
    input =
        'Here you ' +
        'see a ' +
        'superlongwordwithoutspaces';
    t.deepEqual(
        format.lines(input, Object.assign({}, config, { width: 10, filler: '', ansi: false })),
        [
            'Here you',
            'see a',
            'superlong-',
            'wordwitho-',
            'utspaces'
        ]
        , 'word longer than line and no-ansi');





    t.end();
});