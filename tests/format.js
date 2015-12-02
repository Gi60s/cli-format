"use strict";
var ansi                = require('../bin/ansi');
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
    var result;

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

    //       123456789 123456789 123456789
    input = 'In this example ' +
            'there is an\n' +
            'un\u001b[4mder\u001b[0mlined word';
    result = format.lines(input, Object.assign({}, config, { width: 20, filler: '' }));
    t.deepEqual(
        result,
        [
            '\u001b[0mIn this example\u001b[0m',
            '\u001b[0mthere is an\u001b[0m',
            '\u001b[0mun\u001b[0;4mder\u001b[0mlined word\u001b[0m'
        ],
        'formatted word after new line character'
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


    input = 'Two new lines\n\nSide by side';
    t.deepEqual(
        format.lines(input, { width: 80, filler: '', ansi: false }),
        [
            'Two new lines',
            '',
            'Side by side'
        ],
        'side by side new line characters'
    );

    input = 'One word per line\njust\nlike\nthis';
    t.deepEqual(
        format.lines(input, { width: 80, filler: '', ansi: false }),
        [
            'One word per line',
            'just',
            'like',
            'this'
        ],
        'one word between new line characters'
    );

    input = 'Space before \nnew line';
    t.deepEqual(
        format.lines(input, { width: 80, filler: '', ansi: false }),
        [
            'Space before',
            'new line'
        ],
        'space before new line'
    );

    //       123456789 123456789 123456789
    input = 'New line after\nsoft wrap';
    t.deepEqual(
        format.lines(input, { width: 12, filler: '', ansi: false }),
        [
            'New line',
            'after',
            'soft wrap'
        ],
        'new line after soft wrap'
    );



    t.end();
});

test('format.wrap', function(t) {
    var input;

    input = 'Two new lines\n\nSide by side';
    t.equal(
        format.wrap(input, { width: 80, filler: '', ansi: false }),
        input,
        'new line characters'
    );

    t.end();
});

test('format.separate', function(t) {
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
        var sep = format.separate(map.input);

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

test('format.trim', function(t) {
    var input;
    var on = '\u001b[1;3m';
    var off = '\u001b[0m';

    //set escape sequences to look for
    ansi.escape = [
        '\u001b',
        '\u009b'
    ];

    t.equal(format.trim('   foo   ', true, false), 'foo   ',    'trim all start');
    t.equal(format.trim('   foo   ', -1,   false), '   foo   ', 'trim none start');
    t.equal(format.trim('   foo   ', 1,    false), '  foo   ',  'trim 1 start');
    t.equal(format.trim('   foo   ', 2,    false), ' foo   ',   'trim 2 start');
    t.equal(format.trim('   foo   ', 5,    false), 'foo   ',    'trim 5 start');

    t.equal(format.trim('   foo   ', false, true), '   foo',    'trim all end');
    t.equal(format.trim('   foo   ', false, -1),   '   foo   ', 'trim none end');
    t.equal(format.trim('   foo   ', false, 1),    '   foo  ',  'trim 1 end');
    t.equal(format.trim('   foo   ', false, 2),    '   foo ',   'trim 2 end');
    t.equal(format.trim('   foo   ', false, 5),    '   foo',    'trim 5 end');

    input = ' ' + on + '  foo   ';
    t.equal(format.trim(input, true, false), on + 'foo   ',     'trim all start');
    t.equal(format.trim(input, -1,   false), input,             'trim none start');
    t.equal(format.trim(input, 1,    false), on + '  foo   ',   'trim 1 start');
    t.equal(format.trim(input, 2,    false), on + ' foo   ',    'trim 2 start');
    t.equal(format.trim(input, 5,    false), on + 'foo   ',     'trim 5 start');

    input = '   foo  ' + off + ' ';
    t.equal(format.trim(input, false, true), '   foo' + off,    'trim all end');
    t.equal(format.trim(input, false, -1),   input,             'trim none end');
    t.equal(format.trim(input, false, 1),    '   foo  ' + off,  'trim 1 end');
    t.equal(format.trim(input, false, 2),    '   foo ' + off,   'trim 2 end');
    t.equal(format.trim(input, false, 5),    '   foo' + off,    'trim 5 end');

    t.end();
});