"use strict";
var chalk           = require('chalk');
var colors          = require('colors/safe');
var config          = require('../bin/format-config.js');
var expect          = require('chai').expect;
var format          = require('../bin/format');

describe('format', function() {
    chalk.enabled = true;
    colors.enabled = true;

    config.config.trimEndOfLine = false;

    after(function() {
        config.config.trimEndOfLine = true;
    });

    describe('#columns.lines', function() {

        describe('one column', function() {
            var lines;
            before(function() {
                lines = format.columns.lines(['01234 678 012'], { ansi: false, width: 10 });
            });

            it('has two lines', function() {
                expect(lines.length).to.equal(2);
            });

            it('first line', function() {
                expect(lines[0]).to.equal('01234 678 ');
            });

            it('second line', function() {
                expect(lines[1]).to.equal('012       ');
            });

        });

        describe('two column', function() {
            var lines;
            before(function() {
                lines = format.columns.lines(['01234 678 012', 'abcd fghij lmnop'], { ansi: false, width: 20, paddingMiddle: '' });
            });

            it('has two lines', function() {
                expect(lines.length).to.equal(2);
            });

            it('first line', function() {
                expect(lines[0]).to.equal('01234 678 abcd fghij');
            });

            it('second line', function() {
                expect(lines[1]).to.equal('012       lmnop     ');
            });

        });

        describe('two columns, first with more lines', function() {
            var lines;
            before(function() {
                lines = format.columns.lines(['01234 678 012', 'abcd'], { ansi: false, width: 20, paddingMiddle: '' });
            });

            it('has two lines', function() {
                expect(lines.length).to.equal(2);
            });

            it('first line', function() {
                expect(lines[0]).to.equal('01234 678 abcd      ');
            });

            it('second line', function() {
                expect(lines[1]).to.equal('012                 ');
            });

        });

        describe('two columns, second with more lines', function() {
            var lines;
            before(function() {
                lines = format.columns.lines(['abcd', '01234 678 012'], { ansi: false, width: 20, paddingMiddle: '' });
            });

            it('has two lines', function() {
                expect(lines.length).to.equal(2);
            });

            it('first line', function() {
                expect(lines[0]).to.equal('abcd      01234 678 ');
            });

            it('second line', function() {
                expect(lines[1]).to.equal('          012       ');
            });

        });

        describe('two columns padding middle', function() {
            var lines;
            before(function() {
                lines = format.columns.lines(['01234 678 012', 'abcd'], { ansi: false, width: 20, paddingMiddle: ' | ' });
            });

            it('has two lines', function() {
                expect(lines.length).to.equal(2);
            });

            it('first line', function() {
                expect(lines[0]).to.equal('01234 678 | abcd    ');
            });

            it('second line', function() {
                expect(lines[1]).to.equal('012       |         ');
            });

        });

        describe('two columns with new line', function() {
            var lines;
            before(function() {
                lines = format.columns.lines(['abcd', '01234\n01 2345'], { ansi: false, width: 20, paddingMiddle: '' });
            });

            it('has two lines', function() {
                expect(lines.length).to.equal(2);
            });

            it('first line', function() {
                expect(lines[0]).to.equal('abcd      01234     ');
            });

            it('second line', function() {
                expect(lines[1]).to.equal('          01 2345   ');
            });

        });

        describe('two columns with different configurations', function() {
            var lines;
            before(function() {
                var config = { ansi: false, paddingMiddle: '' };
                lines = format.columns.lines([
                    { content: '1234 678 0123', ansi: false, width: 10 },
                    { content: '123456 89012 4567 123456', ansi: true, width: 20 }
                ], config);
            });

            it('has two lines', function() {
                expect(lines.length).to.equal(2);
            });

            it('first line', function() {
                expect(lines[0]).to.equal('1234 678  \u001b[0m123456 89012 4567 \u001b[0m  \u001b[0m');
            });

            it('second line', function() {
                expect(lines[1]).to.equal('0123      \u001b[0m123456\u001b[0m              \u001b[0m');
            });
        });

        describe('two columns, first is empty', function() {
            var lines;
            before(function() {
                lines = format.columns.lines([null, '1234'], { ansi: false, paddingMiddle: '', width: 20 });
            });

            it('has one line', function() {
                expect(lines.length).to.equal(1);
            });

            it('first line', function() {
                expect(lines[0]).to.equal('          1234      ');
            });
        });
    });

    describe('#column.wrap', function() {

        it('has two lines', function() {
            var result = format.columns.wrap(['123 567 1234', '123456 890 0123'], { ansi: false, paddingMiddle: '', width: 22 });
            expect(result).to.equal('123 567    123456 890\n1234       0123      ');
        });

    });

    describe('#justify', function() {

        it('equal justification', function() {
            //           0123456789 123456              0123456789 123456789
            var input = 'This is a string.';
            expect(format.justify(input, 20)).to.equal('This  is  a  string.')
        });

        it('inequal justification', function() {
            //           0123456789 123456              0123456789 1234567
            var input = 'This is a string.';
            expect(format.justify(input, 18)).to.equal('This  is a string.')
        });

    });

    describe('#lines', function() {

        describe('no formatting', function() {
            var config = { filler: '', ansi: false, width: 20 };

            describe('exact line length', function() {
                var input = '0123456789 123456789 1';
                var lines = format.lines(input, config);

                it('has two lines', function() {
                    expect(lines.length).to.be.equal(2);
                });

                it('first line is full', function() {
                    expect(lines[0].length).to.be.equal(20);
                });

                it('first line', function() {
                    expect(lines[0]).to.be.equal('0123456789 123456789');
                });

                it('second line', function() {
                    expect(lines[1]).to.be.equal('1');
                });
            });

            describe('line ends in space', function() {
                var input = '0123456789 12345678 01';
                var lines = format.lines(input, config);

                it('has two lines', function() {
                    expect(lines.length).to.be.equal(2);
                });

                it('first line', function() {
                    expect(lines[0]).to.be.equal('0123456789 12345678 ');
                });

                it('second line', function() {
                    expect(lines[1]).to.be.equal('01');
                });
            });

            describe('line ends in dash', function() {
                var input = '0123456789 12345678-01';
                var lines = format.lines(input, config);

                it('has two lines', function() {
                    expect(lines.length).to.be.equal(2);
                });

                it('first line', function() {
                    expect(lines[0]).to.be.equal('0123456789 12345678-');
                });

                it('second line', function() {
                    expect(lines[1]).to.be.equal('01');
                });
            });

            describe('long word', function() {
                var input = '0123 56789012345678901234 6789 1234';
                var lines = format.lines(input, config);

                it('has three lines', function() {
                    expect(lines.length).to.be.equal(3);
                });

                it('first line', function() {
                    expect(lines[0]).to.be.equal('0123 ');
                });

                it('second line', function() {
                    expect(lines[1]).to.be.equal('56789012345678901234');
                });

                it('third line', function() {
                    expect(lines[2]).to.be.equal('6789 1234');
                });
            });

            describe('too long word same line', function() {
                var input = '0123 5678901234567890123456789 1234';
                var lines = format.lines(input, config);

                it('has two lines', function() {
                    expect(lines.length).to.be.equal(2);
                });

                it('first line', function() {
                    expect(lines[0]).to.be.equal('0123 56789012345678-');
                });

                it('second line', function() {
                    expect(lines[1]).to.be.equal('90123456789 1234');
                });
            });

            describe('too long word next line', function() {
                var input = '012345 7890123456 8901234567890123456789 1234';
                var lines = format.lines(input, config);

                it('has three lines', function() {
                    expect(lines.length).to.be.equal(3);
                });

                it('first line', function() {
                    expect(lines[0]).to.be.equal('012345 7890123456 ');
                });

                it('second line', function() {
                    expect(lines[1]).to.be.equal('8901234567890123456-');
                });

                it('third line', function() {
                    expect(lines[2]).to.be.equal('789 1234');
                });
            });

            describe('too long word first line indent', function() {
                var input = '2345678901234567890 23456789 1234';
                var lines = format.lines(input, { filler: '', ansi: false, width: 20, firstLineIndent: '  ' });

                it('has two lines', function() {
                    expect(lines.length).to.be.equal(2);
                });

                it('first line', function() {   //01234
                    expect(lines[0]).to.be.equal('  23456789012345678-');
                });

                it('second line', function() {
                    expect(lines[1]).to.be.equal('90 23456789 1234');
                });
            });

            describe('too long word hanging indent', function() {
                var input = '0123 567890123456789012345 789 1234';
                var lines = format.lines(input, { filler: '', ansi: false, width: 20, hangingIndent: '  ' });

                it('has two lines', function() {
                    expect(lines.length).to.be.equal(2);
                });

                it('first line', function() {
                    expect(lines[0]).to.be.equal('0123 56789012345678-');
                });

                it('second line', function() {
                    expect(lines[1]).to.be.equal('  9012345 789 1234');
                });
            });

            describe('too long word for 3 lines', function() {
                var input = '0123 56789012345678901234567890123456789012345 6789 1234';
                var lines = format.lines(input, { filler: '', ansi: false, width: 20 });

                it('has three lines', function() {
                    expect(lines.length).to.be.equal(3);
                });

                it('first line', function() {
                    expect(lines[0]).to.be.equal('0123 56789012345678-');
                });

                it('second line', function() {
                    expect(lines[1]).to.be.equal('9012345678901234567-');
                });

                it('third line', function() {
                    expect(lines[2]).to.be.equal('89012345 6789 1234');
                });
            });

            describe('justification across lines', function() {
                           //0123456789 123456789
                var input = '0123 56 89 abcdef ' +
                            '012 45678 0abc efg ' +
                            '01234567890abcdefghi ' +
                            '01234 67';
                var lines = format.lines(input, { filler: '', ansi: false, width: 20, justify: true });

                it('has 3 lines', function() {
                    expect(lines.length).to.be.equal(4);
                });

                it('first line', function() {
                    expect(lines[0]).to.be.equal('0123  56  89  abcdef');
                });

                it('second line', function() {
                    expect(lines[1]).to.be.equal('012  45678  0abc efg');
                });

                it('third line', function() {   //01234567890123456789
                    expect(lines[2]).to.be.equal('01234567890abcdefghi');
                });

                it('fourth line', function() {
                    expect(lines[3]).to.be.equal('01234 67');
                });
            });

            describe('justification with new lines', function() {
                           //0123456789 123456789
                var input = '0123 56 89 abcdef\n' +
                            '012 45678 0abc efg ' +
                            '01234567890abcdefghi ' +
                            '01234 67';
                var lines = format.lines(input, { filler: '', ansi: false, width: 20, justify: true });

                it('has 3 lines', function() {
                    expect(lines.length).to.be.equal(4);
                });

                it('first line', function() {
                    expect(lines[0]).to.be.equal('0123 56 89 abcdef');
                });

                it('second line', function() {
                    expect(lines[1]).to.be.equal('012  45678  0abc efg');
                });

                it('third line', function() {   //01234567890123456789
                    expect(lines[2]).to.be.equal('01234567890abcdefghi');
                });

                it('fourth line', function() {
                    expect(lines[3]).to.be.equal('01234 67');
                });
            });
        });

        describe('formatting', function() {
            var config = { filler: '', ansi: true, width: 20 };

            describe('ends at line length', function() {
                var input = '0123456789 ' + chalk.bold(123456789) + ' 1';
                var lines = format.lines(input, config);
                var expected = [
                    { '0': [0],  '11': [1],  '19': [22], '20': [0] },
                    { '0': [0],  '1': [0] }
                ];
                multiLineFormatValidator(2, lines, expected);

            });

            describe('ends before line length', function() {
                var input = '0123456789 ' + chalk.bold('12345') + '6789 1';
                var lines = format.lines(input, config);
                var expected = [
                    { '0': [0],  '11': [1],  '16': [22], '20': [0] },
                    { '0': [0],  '1': [0] }
                ];
                multiLineFormatValidator(2, lines, expected);

            });

            describe('traverses multiple lines', function() {
                var input = '0123456789 ' + chalk.bold('1234567 012345') + ' 789';
                var lines = format.lines(input, config);
                var expected = [
                    { '0': [0],     '11': [1],  '19': [0] },
                    { '0': [0, 1],  '6': [22],  '10': [0] }
                ];
                multiLineFormatValidator(2, lines, expected);

            });

            describe('traverses new line', function() {
                var input = '012 ' + chalk.bold('45\n0123') + ' 567';
                var lines = format.lines(input, config);
                var expected = [
                    { '0': [0],     '4': [1],   '6': [0] },
                    { '0': [0, 1],  '4': [22],  '8': [0] }
                ];
                multiLineFormatValidator(2, lines, expected);

            });

            describe('new format per line', function() {
                var input = '01\n' + chalk.bold('23\n') + chalk.italic('45') + '\n' + chalk.underline('67');
                var lines = format.lines(input, config);
                var expected = [
                    { '0': [0],     '2': [0] },
                    { '0': [0, 1],  '2': [0] },
                    { '0': [0, 3],  '2': [0] },
                    { '0': [0, 4],  '2': [0] }
                ];
                multiLineFormatValidator(4, lines, expected);

            });

        });

        describe('filler', function() {
            var config = { filler: 'abc', ansi: false, width: 10 };
            var input = '012345 789 012345 01234567';
            var lines = format.lines(input, config);

            it('has three lines', function() {
                expect(lines.length).to.equal(3);
            });

            it('first line', function() {
                expect(lines[0]).to.equal('012345 789');
            });

            it('second line', function() {
                expect(lines[1]).to.equal('012345 abc');
            });

            it('third line', function() {
                expect(lines[2]).to.equal('01234567ab');
            });

        });

        describe('paddingLeft', function() {
            var config = { filler: ' ', ansi: false, width: 10, paddingLeft: '>' };
            var input = '12345 789 123';
            var lines = format.lines(input, config);

            it('has two lines', function() {
                expect(lines.length).to.equal(2);
            });

            it('first line has padding', function() {
                expect(lines[0]).to.equal('>12345 789');
            });

            it('second line has padding', function() {
                expect(lines[1]).to.equal('>123      ');
            });

        });

        describe('paddingRight', function() {
            var config = { filler: ' ', ansi: false, width: 10, paddingRight: '<' };
            var input = '12345 789 123';
            var lines = format.lines(input, config);

            it('has two lines', function() {
                expect(lines.length).to.equal(2);
            });

            it('first line has padding', function() {
                expect(lines[0]).to.equal('12345 789<');
            });

            it('second line has padding', function() {
                expect(lines[1]).to.equal('123      <');
            });

        });

        describe('first line indent', function() {
            var config = { firstLineIndent: '  ', filler: ' ', ansi: false, width: 10 };
            var input = '2345 789 012345';
            var lines = format.lines(input, config);

            it('has two lines', function() {
                expect(lines.length).to.equal(2);
            });

            it('first line', function() {
                expect(lines[0]).to.equal('  2345 789');
            });

            it('second line', function() {
                expect(lines[1]).to.equal('012345    ');
            });

        });

        describe('hanging indent', function() {
            var config = { hangingIndent: '  ', filler: ' ', ansi: false, width: 10 };
            var input = '012345 789 2345';
            var lines = format.lines(input, config);

            it('has two lines', function() {
                expect(lines.length).to.equal(2);
            });

            it('first line', function() {
                expect(lines[0]).to.equal('012345 789');
            });

            it('second line', function() {
                expect(lines[1]).to.equal('  2345    ');
            });

        });

        describe('new line', function() {
            var config = { ansi: false, width: 10 };
            var input = '0123\n012 4567';
            var lines = format.lines(input, config);

            it('has two lines', function() {
                expect(lines.length).to.equal(2);
            });

            it('first line', function() {
                expect(lines[0]).to.equal('0123');
            });

            it('second line', function() {
                expect(lines[1]).to.equal('012 4567');
            });
        });

    });

    describe('#separate', function() {
        config.ansi = true;

        describe('chalk none-bold-boldItalic-italic-none', function() {
            var str = '01' + chalk.bold('23') + chalk.bold.italic('45') + chalk.italic('67') + '89';
            var sep = format.separate(str);

            it('has string without formatting', function() {
                expect(sep.value).to.equal('0123456789');
            });

            it('has 4 format changes', function() {
                expect(sep.format.length).to.equal(4);
            });

            it('has first format change at index 2', function() {
                expect(sep.format[0].index).to.equal(2);
            });

            it('has first format change to [1]', function() {
                expect(sep.format[0].codes).to.deep.equal([1]);
            });

            it('has second format change at index 4', function() {
                expect(sep.format[1].index).to.equal(4);
            });

            it('has second format change to [1,3]', function() {
                expect(sep.format[1].codes).to.deep.equal([1, 3]);
            });

            it('has third format change at index 6', function() {
                expect(sep.format[2].index).to.equal(6);
            });

            it('has third format change to [22,3]', function() {
                expect(sep.format[2].codes).to.deep.equal([22, 3]);
            });

            it('has forth format change at index 8', function() {
                expect(sep.format[3].index).to.equal(8);
            });

            it('has forth format change to [23]', function() {
                expect(sep.format[3].codes).to.deep.equal([23]);
            });
        });

        describe('colors none-bold-boldItalic-italic-none', function() {
            var str = '01' + colors.bold('23') + colors.bold.italic('45') + colors.italic('67') + '89';
            var sep = format.separate(str);

            it('has string without formatting', function() {
                expect(sep.value).to.equal('0123456789');
            });

            it('has 4 format changes', function() {
                expect(sep.format.length).to.equal(4);
            });

            it('has first format change at index 2', function() {
                expect(sep.format[0].index).to.equal(2);
            });

            it('has first format change to [1]', function() {
                expect(sep.format[0].codes).to.deep.equal([1]);
            });

            it('has second format change at index 4', function() {
                expect(sep.format[1].index).to.equal(4);
            });

            it('has second format change to [1,3]', function() {
                expect(sep.format[1].codes).to.deep.equal([1, 3]);
            });

            it('has third format change at index 6', function() {
                expect(sep.format[2].index).to.equal(6);
            });

            it('has third format change to [22,3]', function() {
                expect(sep.format[2].codes).to.deep.equal([22, 3]);
            });

            it('has forth format change at index 8', function() {
                expect(sep.format[3].index).to.equal(8);
            });

            it('has forth format change to [23]', function() {
                expect(sep.format[3].codes).to.deep.equal([23]);
            });
        });

    });

    describe('#transform', function() {

        it('uses default transforms', function() {
            expect(format.transform('Hello\r\nBob')).to.be.equal('Hello\nBob');
        });

        it('accepts additional transforms', function() {
            expect(format.transform('abc', { b: 'B' })).to.be.equal('aBc');
        });

    });

    describe('#trim', function() {

        describe('without ansi', function() {

            it('trims start', function() {
                expect(format.trim('   abc   ', true, false)).to.equal('abc   ');
            });

            it('trims end', function() {
                expect(format.trim('   abc   ', false, true)).to.equal('   abc');
            });

            it('trims some of start', function() {
                expect(format.trim('   abc   ', 2, false)).to.equal(' abc   ');
            });

            it('trims some of end', function() {
                expect(format.trim('   abc   ', false, 2)).to.equal('   abc ');
            });

        });

        describe('with ansi', function() {

            it('trims start', function() {
                expect(format.trim(chalk.blue('   abc   '), true, false)).to.equal('\u001b[34mabc   \u001b[39m');
            });

            it('trims end', function() {
                expect(format.trim(chalk.blue('   abc   '), false, true)).to.equal('\u001b[34m   abc\u001b[39m');
            });

            it('trims some of start', function() {
                expect(format.trim(chalk.blue('   abc   '), 2, false)).to.equal('\u001b[34m abc   \u001b[39m');
            });

            it('trims some of end', function() {
                expect(format.trim(chalk.blue('   abc   '), false, 2)).to.equal('\u001b[34m   abc \u001b[39m');
            });

        });

    });

    describe('#width', function() {

        it('double width character', function() {
            expect(format.width('古')).to.equal(2);
        });

        it('zero width character', function() {
            expect(format.width('\u200B')).to.equal(0);
        });

        it('single width character', function() {
            expect(format.width('x')).to.equal(1);
        });

        it('ansi has zero width', function() {
            var input = chalk.bold('x');
            expect(format.width(input)).to.equal(1);
        });

    });

    describe('#words', function() {

        it('spaces', function() {
            var result = format.words('This is a test');
            expect(result).to.deep.equal(['This ', 'is ', 'a ', 'test']);
        });

        it('dash', function() {
            var result = format.words('crazy-good');
            expect(result).to.deep.equal(['crazy-', 'good']);
        });

        it('new line', function() {
            var result = format.words('new\nline');
            expect(result).to.deep.equal(['new\n', 'line']);
        });

    });

    describe('#wrap', function() {
        var input = '123 56 890 2345';
        var result = format.wrap(input, { ansi: false, width: 10 });

        it('has two lines', function() {
            expect(result.split('\n').length).to.be.equal(2);
        });

        it('has expected content', function() {
            expect(result).to.be.equal('123 56 \n890 2345');
        });

    });

});

function formatValidator(formats, expectedMap) {
    var keys = Object.keys(expectedMap);

    it('has ' + keys.length + ' format sets', function() {
        expect(formats.length).to.equal(keys.length);
    });

    keys.forEach(function(key, index) {
        var value = expectedMap[key];

        describe('format ' + index, function() {

            it('has index ' + key, function() {
                expect(formats[index].index).to.equal(parseInt(key));
            });

            it('has code [' + value.join(',') + ']', function() {
                expect(formats[index].codes).to.deep.equal(value)
            });

        });

    });
}

function multiLineFormatValidator(expectedLines, lines, expected) {
    var formats = lines.map((line) => format.separate(line).format);

    it('has ' + expectedLines + ' lines', function() {
        expect(lines.length).to.be.equal(expectedLines);
    });

    formats.forEach(function(format, lineNo) {
        describe('line ' + (lineNo + 1), function() {
            formatValidator(format, expected[lineNo]);
        })
    });
}