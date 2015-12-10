"use strict";
var ansi                = require('../bin/ansi');
var config              = require('../bin/format-config');
var chalk               = require('chalk');
var colors              = require('colors/safe');
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

test('format.lines ansi', function(t) {
    var actual;
    var inject;
    var input;
    var expected;
    var name;
    var run = function(input, inject, config) {
        return format.lines(ansiInject(input.join(''), inject),
            Object.assign({
                ansi: true,
                availableWidth: 80,
                firstLineIndent: '',
                hangingIndent: '',
                filler: '',
                hardBreak: '-',
                paddingLeft: '',
                paddingMiddle: '   ',
                paddingRight: '',
                trimEndOfLine: false,
                trimStartOfLine: false,
                width: 80
            }, config || {})
        );
    };

    //   _123456789_123456789_123456789_123456789_
    name = 'No formatting and no filler';
    inject = {};
    input = [
        'This statement is being placed ',
        'into multiple lines because it ',
        'hits the width limit of its ',
        'own accord.'
    ];
    expected = [
        ansiLine('This statement is being placed'),
        ansiLine('into multiple lines because it'),
        ansiLine('hits the width limit of its '),
        ansiLine('own accord.')
    ];
    actual = run(input, inject, { width: 30 });
    t.deepEqual(actual, expected, name);

    //   _123456789_123456789_123456789_123456789_
    name = 'No formatting and with filler';
    inject = {};
    input = [
        'This statement is being placed ',
        'into multiple lines because it ',
        'hits the width limit of its ',
        'own accord.'
    ];
    expected = [
        ansiLine('This statement is being placed'),
        ansiLine('into multiple lines because it'),
        ansiLine('hits the width limit of its ') + '  ',
        ansiLine('own accord.') + '                   '
    ];
    actual = run(input, inject, { width: 30, filler: ' ' });
    t.deepEqual(actual, expected, name);

    //   _123456789_123456789_123456789_123456789_
    name = 'Formatting one word mid line';
    input = [
        'Hello, friend Bob'
    ];
    inject = { 7: [1], 13: [0] };
    expected = [
        ansiLine(input[0], inject)
    ];
    actual = run(input, inject, {});
    t.deepEqual(actual, expected, name);

    //   _123456789_123456789_123456789_123456789_
    name = 'Formatting two words mid line';
    input = [
        'Hello, friend Bob of mine'
    ];
    inject = { 7: [1], 17: [0] };
    expected = [
        ansiLine(input[0], inject)
    ];
    actual = run(input, inject, {});
    t.deepEqual(actual, expected, name);

    //   _123456789_123456789_123456789_123456789_
    name = 'Formatting inside one word mid line';
    input = [
        'Hello, friend Bob of mine'
    ];
    inject = { 8: [1], 11: [0] };
    expected = [
        ansiLine(input[0], inject)
    ];
    actual = run(input, inject, {});
    t.deepEqual(actual, expected, name);

    //   _123456789_123456789_123456789_123456789_
    name = 'Formatting inside one word to inside another word mid line';
    input = [
        'Hello, friend Bob of mine'
    ];
    inject = { 8: [1], 15: [0] };
    expected = [
        ansiLine(input[0], inject)
    ];
    actual = run(input, inject, {});
    t.deepEqual(actual, expected, name);

    //   _123456789_123456789_123456789_123456789_
    name = 'Formatting to end';
    input = [
        'Hello, friend Bob of mine'
    ];
    inject = { 21: [1], 25: [0] };
    expected = [
        ansiLine(input[0], inject)
    ];
    actual = run(input, inject, {});
    t.deepEqual(actual, expected, name);

    //   _123456789_123456789_123456789_123456789_
    name = 'Formatting to exactly end of line';
    input = [
        '01234 6789 ',
        '01 3456 8 ',
        '0 23456789'
    ];
    inject = { 6: [1], 10: [0] };
    expected = [
        ansiLine(input[0].substring(0, input[0].length - 1), inject),
        ansiLine(input[1], inject, 10),
        ansiLine(input[2], inject, 20)
    ];
    actual = run(input, inject, { width: 10 });
    t.deepEqual(actual, expected, name);

    //   _123456789_123456789_123456789_123456789_
    name = 'Formatting to space before end of line';
    input = [
        '01234 678 ',
        '01 3456 8 ',
        '0 23456789'
    ];
    inject = { 6: [1], 9: [0] };
    expected = [
        ansiLine(input[0], inject),
        ansiLine(input[1], inject, 10),
        ansiLine(input[2], inject, 20)
    ];
    actual = run(input, inject, { width: 10 });
    t.deepEqual(actual, expected, name);

    //   _123456789_123456789_123456789_123456789_
    name = 'Formatting from line 1 to line 2 without trimmed end';
    input = [
        '01234 678 ',
        '01 3456 8 ',
        '0 23456789'
    ];
    inject = { 6: [1], 12: [0] };
    expected = [
        ansiLine(input[0], inject),
        ansiLine(input[1], Object.assign({}, inject, { 10: [0, 1] }), 10),
        ansiLine(input[2], inject, 20)
    ];
    actual = run(input, inject, { width: 10 });
    t.deepEqual(actual, expected, name);

    //   _123456789_123456789_123456789_123456789_
    name = 'Formatting from line 1 to line 2 with trimmed end';
    input = [
        '01234 678 ',
        '01 3456 8 ',
        '0 23456789'
    ];
    inject = { 6: [1], 12: [0] };
    expected = [
        ansiLine(input[0].substr(0, input[0].length - 1), inject),
        ansiLine(input[1].substr(0, input[0].length - 1), Object.assign({}, inject, { 10: [0, 1] }), 10),
        ansiLine(input[2], inject, 20)
    ];
    actual = run(input, inject, { width: 10, trimEndOfLine: true });
    t.deepEqual(actual, expected, name);

    //   _123456789_123456789_123456789_123456789_
    name = 'Formatting first word';
    input = [
        '01234 678 ',
        '01 3456 8 ',
        '0 23456789'
    ];
    inject = { 0: [1], 5: [0] };
    expected = [
        ansiLine(input[0], inject),
        ansiLine(input[1], inject, 10),
        ansiLine(input[2], inject, 20)
    ];
    actual = run(input, inject, { width: 10 });
    t.deepEqual(actual, expected, name);

    //   _123456789_123456789_123456789_123456789_
    name = 'Formatting first word on second line';
    input = [
        '01234 678 ',
        '01 3456 8 ',
        '0 23456789'
    ];
    inject = { 10: [1], 12: [0] };
    expected = [
        ansiLine(input[0], {}),
        ansiLine(input[1], inject, 10),
        ansiLine(input[2], {}, 20)
    ];
    actual = run(input, inject, { width: 10 });
    t.deepEqual(actual, expected, name);

    //   _123456789_123456789_123456789_123456789_
    name = 'Formatting first word with first line indent';
    input = [
        '234 6789 ',
        '01 3456 8 ',
        '0 23456789'
    ];
    inject = { 0: [1], 3: [0] };
    expected = [
        '\u001b[0m  ' + ansiLine(input[0].substr(0, input[0].length - 1), inject),
        ansiLine(input[1], inject, 10),
        ansiLine(input[2], inject, 20)
    ];
    actual = run(input, inject, { width: 10, firstLineIndent: '  ' });
    t.deepEqual(actual, expected, name);

    //   _123456789_123456789_123456789_123456789_
    name = 'Formatting with hanging line indent';
    input = [
        '01234 678 ',
        '01 345 ',
        '012345'
    ];
    inject = { 13: [1], 16: [0] };
    expected = [
        ansiLine(input[0], inject),
        '\u001b[0m  ' + ansiLine(input[1], inject, 10),
        '\u001b[0m  ' + ansiLine(input[2], inject, 20)
    ];
    actual = run(input, inject, { width: 10, hangingIndent: '  ' });
    t.deepEqual(actual, expected, name);

    //   _123456789_123456789_123456789_123456789_
    name = 'Formatting last word before new line character';
    input = [
        '01 34\n012 45'
    ];
    inject = { 3: [1], 5: [0] };
    expected = [
        ansiLine(input[0].split('\n')[0], inject),
        ansiLine(input[0].split('\n')[1], {}),
    ];
    actual = run(input, inject, { width: 10 });
    t.deepEqual(actual, expected, name);

    //   _123456789_123456789_123456789_123456789_
    name = 'Formatting across hard break';
    input = [
        '0123456789012 45 7'
    ];
    inject = { 0: [1], 13: [0] };
    expected = [
        ansiLine(input[0].substr(0, 9) + '-', inject),
        ansiLine(input[0].substr(9), Object.assign({}, inject, { 10: [0, 1] }), 10)
    ];
    actual = run(input, inject, { width: 10 });
    t.deepEqual(actual, expected, name);

    t.end();
});

test('format.lines no-ansi', function(t) {
    var input;
    var config = {
        ansi: false,
        availableWidth: 80,
        firstLineIndent: '',
        hangingIndent: '',
        filler: '',
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
        format.lines(input, Object.assign({}, config, { width: 30 })),
        [
            'This statement is being placed',
            'into multiple lines because it',
            'hits the width limit of its',
            'own accord.'
        ],
        'no fill'
    );
    t.deepEqual(
        format.lines(input, Object.assign({}, config, { width: 30, filler: ' ' })),
        [
            'This statement is being placed',
            'into multiple lines because it',
            'hits the width limit of its   ',
            'own accord.                   '
        ],
        'fill with spaces'
    );

    //   123456789 123456789
    input =
        'Here you ' +
        'see a ' +
        'superlongwordwithoutspaces';
    t.deepEqual(
        format.lines(input, Object.assign({}, config, { width: 10 })),
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
        format.lines(input, Object.assign({}, config, { width: 80, filler: '' })),
        [
            'Two new lines',
            '',
            'Side by side'
        ],
        'side by side new line characters'
    );

    input = 'One word per line\njust\nlike\nthis';
    t.deepEqual(
        format.lines(input, Object.assign({}, config, { width: 80 })),
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
        format.lines(input, Object.assign({}, config, { width: 80 })),
        [
            'Space before',
            'new line'
        ],
        'space before new line'
    );

    //       123456789 123456789 123456789
    input = 'New line after\nsoft wrap';
    t.deepEqual(
        format.lines(input, Object.assign({}, config, { width: 12 })),
        [
            'New line',
            'after',
            'soft wrap'
        ],
        'new line after soft wrap'
    );

    //       123456789 12345
    input = 'Dash break-line';
    var r = format.lines(input, Object.assign({}, config, { width: 11 }));
    t.deepEqual(
        r,
        [
            'Dash break-',
            'line'
        ],
        'Dash as last character in line'
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

test('format.seperate chalk', function(t) {
    var actual;
    var expected;
    var input;

    chalk.enabled = true;

    input = chalk.bold('Hello');
    expected = [
        {
            codes: [1],
            index: 0
        },
        {
            codes: [1, 22],
            index: 5
        }
    ];
    actual = format.separate(input).format;
    t.deepEqual(actual, expected, 'bold');

    input = chalk.underline.bold('Hello');
    expected = [
        {
            codes: [4, 1],
            index: 0
        },
        {
            codes: [4, 1, 22, 24],
            index: 5
        }
    ];
    actual = format.separate(input).format;
    t.deepEqual(actual, expected, 'bold underline');

    t.end();
});

test('format.seperate colors', function(t) {
    var actual;
    var expected;
    var input;
    colors.enabled = true;

    input = colors.bold('Hello');
    expected = [
        {
            codes: [1],
            index: 0
        },
        {
            codes: [1, 22],
            index: 5
        }
    ];
    actual = format.separate(input).format;
    t.deepEqual(actual, expected, 'bold');

    input = colors.underline.bold('Hello');
    expected = [
        {
            codes: [4, 4, 1],
            index: 0
        },
        {
            codes: [4, 1, 22, 4, 1, 22, 24],
            index: 5
        }
    ];
    actual = format.separate(input).format;
    t.deepEqual(actual, expected, 'bold underline');

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

test('format.columns', function(t) {
    var col1;
    var col2;
    var config;

    //      123456789 12345
    col1 = 'Dash break-line';
    config = { width: [ 11, 10 ], filler: '.', paddingMiddle: '|', ansi: false };
    t.deepEqual(
        format.columns(col1, col1, config),
        'Dash break-|Dash......\n' +
        'line.......|break-line\n',
        'Dash as last character in line 1'
    );

    config = { width: [ 12, 10 ], filler: '.', paddingMiddle: '|', ansi: false };
    t.deepEqual(
        format.columns(col1, col1, config),
        'Dash break-.|Dash......\n' +
        'line........|break-line\n',
        'Dash as last character in line 2'
    );

    config = { width: [ 12, 10 ], filler: '.', paddingLeft: '>', paddingMiddle: '|', paddingRight: '<', ansi: false };
    t.deepEqual(
        format.columns(col1, col1, config),
        '>Dash break-.|Dash......<\n' +
        '>line........|break-line<\n',
        'Modified left and right padding'
    );

    config = { width: null, filler: '.', paddingLeft: '>', paddingMiddle: '|', paddingRight: '<', ansi: false, availableWidth: 24 };
    t.deepEqual(
        format.columns(col1, col1, config),
        '>Dash break-|Dash......<\n' +
        '>line.......|break-line<\n',
        'Auto width with padding left and right'
    );

    config = { width: null, filler: '.', paddingLeft: '>', paddingMiddle: '|', paddingRight: '<', ansi: false, availableWidth: 35 };
    t.deepEqual(
        format.columns(col1, col1, col1, config),
        '>Dash break-|Dash......|Dash......<\n' +
        '>line.......|break-line|break-line<\n',
        'Auto width, 3 columns, with padding left and right'
    );

    col2 = format('Dash break-line', { width: 13, paddingLeft: '/', paddingRight: '\\', ansi: false, filler: '.' });
    config = { width: null, filler: '.', paddingLeft: '>', paddingMiddle: '|', paddingRight: '<', ansi: false, availableWidth: 27 };
    t.deepEqual(
        format.columns(col2, col1, config),
    //   123456789-123456789-123456789
        '>/Dash break-\\|Dash break-<\n' +
        '>/line.......\\|line.......<\n',
        'Custom column and auto width, with padding left and right'
    );

    col2 = format('Dash break-line', { width: 13, paddingLeft: '/', paddingRight: '\\', ansi: false, filler: '.' });
    config = { width: null, filler: '.', paddingLeft: '>', paddingMiddle: '|', paddingRight: '<', ansi: false, availableWidth: 24 };
    t.deepEqual(
        format.columns(col2, col1, config),
    ///  123456789-1234-56789-1234
        '>/Dash break-\\|Dash....<\n' +
        '>/line.......\\|break-..<\n' +
        '>/...........\\|line....<\n',
        'Auto width, 3 columns, with padding left and right'
    );


    t.end();
});



function ansiAddZero(array) {
    if (array[0] !== 0) array.unshift(0);
}

function ansiInject(input, map, offset) {
    var i;
    var index;
    var result = '';
    if (typeof offset == 'undefined') offset = 0;
    map = map ? Object.assign({}, map) : {};
    for (i = 0; i < input.length; i++) {
        index = offset + i;
        if (map[index]) {
            ansiAddZero(map[index]);
            result += '\u001b[' + map[index].join(';') + 'm';
        }
        result += input[i];
    }

    index = offset + input.length;
    if (map[index]) {
        ansiAddZero(map[index]);
        result += '\u001b[' + map[index].join(';') + 'm';
    }
    return result;
}

function ansiLine(input, map, offset) {
    if (typeof offset == 'undefined') offset = 0;
    map = map ? Object.assign({}, map) : {};
    if (!map[offset]) map[offset] = [0];
    ansiAddZero(map[offset]);
    if (!map[offset + input.length]) map[offset + input.length] = [0];
    ansiAddZero(map[offset + input.length]);
    return ansiInject(input, map, offset);
}

/*
function ansiLine(input, map, offset) {
    var i;
    var indexes = Object.keys(map ? Object.assign({}, map) : {}).map(parseInt);
    var last;

    if (typeof offset == 'undefined') offset = 0;

    last = indexes[indexes.length - 1] || 0;
    if (last < offset + input.length) last = offset + input.length;

    for (i = 0; i < last; i++) {

    }
}*/
