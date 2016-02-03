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
            var lines = format.columns.lines(['01234 678 012'], { width: 10 });

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
            var lines = format.columns.lines(['01234 678 012', 'abcd fghij lmnop'], { width: 20, paddingMiddle: '' });

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
            var lines = format.columns.lines(['01234 678 012', 'abcd'], { width: 20, paddingMiddle: '' });

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
            var lines = format.columns.lines(['abcd', '01234 678 012'], { width: 20, paddingMiddle: '' });

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
            var lines = format.columns.lines(['01234 678 012', 'abcd'], { width: 20, paddingMiddle: ' | ' });

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
            var lines = format.columns.lines(['abcd', '01234\n01 2345'], { width: 20, paddingMiddle: '' });

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
                var input = '0123 5678901234567890123456789 1234';
                var lines = format.lines(input, config);

                it('has three lines', function() {
                    expect(lines.length).to.be.equal(3);
                });

                it('first line', function() {
                    expect(lines[0]).to.be.equal('0123 ');
                });

                it('second line', function() {
                    expect(lines[1]).to.be.equal('5678901234567890123-');
                });

                it('third line', function() {
                    expect(lines[2]).to.be.equal('456789 1234');
                });
            });
        });

        describe('formatting', function() {
            var config = { filler: '', ansi: true, width: 20 };

            describe('ends at line length', function() {
                var input = '0123456789 ' + chalk.bold(123456789) + ' 1';
                var lines = format.lines(input, config);
                var formats = lines.map((line) => format.separate(line).format);

                describe('first line', function() {

                    it('has four format sets', function() {
                        expect(formats[0].length).to.equal(4);
                    });

                    describe('first format', function() {

                        it('has index 0', function() {
                            expect(formats[0][0].index).to.equal(0);
                        });

                        it('has code [0]', function() {
                            expect(formats[0][0].codes).to.deep.equal([0])
                        });

                    });

                    describe('second format', function() {

                        it('has index 11', function() {
                            expect(formats[0][1].index).to.equal(11);
                        });

                        it('has code [1]', function() {
                            expect(formats[0][1].codes).to.deep.equal([1])
                        });

                    });

                    describe('third format', function() {

                        it('has index 19', function() {
                            expect(formats[0][2].index).to.equal(19);
                        });

                        it('has code [22]', function() {
                            expect(formats[0][2].codes).to.deep.equal([22])
                        });

                    });

                    describe('forth format', function() {

                        it('has index 20', function() {
                            expect(formats[0][3].index).to.equal(20);
                        });

                        it('has code [22]', function() {
                            expect(formats[0][3].codes).to.deep.equal([0])
                        });

                    });

                });

                describe('second line', function() {

                    it('has two format sets', function() {
                        expect(formats[1].length).to.equal(2);
                    });

                    describe('first format', function() {

                        it('has index 0', function() {
                            expect(formats[1][0].index).to.equal(0);
                        });

                        it('has code [0]', function() {
                            expect(formats[1][0].codes).to.deep.equal([0])
                        });

                    });

                    describe('second format', function() {

                        it('has index 1', function() {
                            expect(formats[1][1].index).to.equal(1);
                        });

                        it('has code [0]', function() {
                            expect(formats[1][1].codes).to.deep.equal([0])
                        });

                    });

                });

            });

            describe('ends before line length', function() {
                var input = '0123456789 ' + chalk.bold('12345') + '6789 1';
                var lines = format.lines(input, config);
                var formats = lines.map((line) => format.separate(line).format);

                describe('first line', function() {

                    it('first line has four format sets', function () {
                        expect(formats[0].length).to.equal(4);
                    });

                    describe('first format', function () {

                        it('has index 0', function () {
                            expect(formats[0][0].index).to.equal(0);
                        });

                        it('has code [0]', function () {
                            expect(formats[0][0].codes).to.deep.equal([0])
                        });

                    });

                    describe('second format', function () {

                        it('has index 11', function () {
                            expect(formats[0][1].index).to.equal(11);
                        });

                        it('has code [1]', function () {
                            expect(formats[0][1].codes).to.deep.equal([1])
                        });

                    });

                    describe('third format', function () {

                        it('has index 16', function () {
                            expect(formats[0][2].index).to.equal(16);
                        });

                        it('has code [0]', function () {
                            expect(formats[0][2].codes).to.deep.equal([22])
                        });

                    });

                    describe('forth format', function () {

                        it('has index 20', function () {
                            expect(formats[0][3].index).to.equal(20);
                        });

                        it('has code [0]', function () {
                            expect(formats[0][3].codes).to.deep.equal([0])
                        });

                    });

                });

                describe('second line', function() {

                    it('has two format sets', function() {
                        expect(formats[1].length).to.equal(2);
                    });

                    describe('first format', function() {

                        it('has index 0', function() {
                            expect(formats[1][0].index).to.equal(0);
                        });

                        it('has code [0]', function() {
                            expect(formats[1][0].codes).to.deep.equal([0])
                        });

                    });

                    describe('second format', function() {

                        it('has index 1', function() {
                            expect(formats[1][1].index).to.equal(1);
                        });

                        it('has code [0]', function() {
                            expect(formats[1][1].codes).to.deep.equal([0])
                        });

                    });

                });

            });

            describe('traverses multiple lines', function() {
                var input = '0123456789 ' + chalk.bold('1234567 012345') + ' 789';
                var lines = format.lines(input, config);
                var formats = lines.map((line) => format.separate(line).format);

                describe('first line', function() {

                    it('first line has three format sets', function () {
                        expect(formats[0].length).to.equal(3);
                    });

                    describe('first format', function () {

                        it('has index 0', function () {
                            expect(formats[0][0].index).to.equal(0);
                        });

                        it('has code [0]', function () {
                            expect(formats[0][0].codes).to.deep.equal([0])
                        });

                    });

                    describe('second format', function () {

                        it('has index 11', function () {
                            expect(formats[0][1].index).to.equal(11);
                        });

                        it('has code [1]', function () {
                            expect(formats[0][1].codes).to.deep.equal([1])
                        });

                    });

                    describe('third format', function () {

                        it('has index 19', function () {
                            expect(formats[0][2].index).to.equal(19);
                        });

                        it('has code [0]', function () {
                            expect(formats[0][2].codes).to.deep.equal([0])
                        });

                    });

                });

                describe('second line', function() {

                    it('has three format sets', function() {
                        expect(formats[1].length).to.equal(3);
                    });

                    describe('first format', function() {

                        it('has index 0', function() {
                            expect(formats[1][0].index).to.equal(0);
                        });

                        it('has code [0]', function() {
                            expect(formats[1][0].codes).to.deep.equal([0,1])
                        });

                    });

                    describe('second format', function() {

                        it('has index 1', function() {
                            expect(formats[1][1].index).to.equal(6);
                        });

                        it('has code [0]', function() {
                            expect(formats[1][1].codes).to.deep.equal([22])
                        });

                    });

                    describe('third format', function() {

                        it('has index 10', function() {
                            expect(formats[1][2].index).to.equal(10);
                        });

                        it('has code [0]', function() {
                            expect(formats[1][2].codes).to.deep.equal([0])
                        });

                    });

                });

            });


            describe('traverses new line', function() {
                var input = '012 ' + chalk.bold('45\n0123') + ' 567';
                var lines = format.lines(input, config);
                var formats = lines.map((line) => format.separate(line).format);

                describe('first line', function() {

                    it('first line has three format sets', function () {
                        expect(formats[0].length).to.equal(3);
                    });

                    describe('first format', function () {

                        it('has index 0', function () {
                            expect(formats[0][0].index).to.equal(0);
                        });

                        it('has code [0]', function () {
                            expect(formats[0][0].codes).to.deep.equal([0])
                        });

                    });

                    describe('second format', function () {

                        it('has index 4', function () {
                            expect(formats[0][1].index).to.equal(4);
                        });

                        it('has code [1]', function () {
                            expect(formats[0][1].codes).to.deep.equal([1])
                        });

                    });

                    describe('third format', function () {

                        it('has index 6', function () {
                            expect(formats[0][2].index).to.equal(6);
                        });

                        it('has code [0]', function () {
                            expect(formats[0][2].codes).to.deep.equal([0])
                        });

                    });

                });

                describe('second line', function() {

                    it('has three format sets', function() {
                        expect(formats[1].length).to.equal(3);
                    });

                    describe('first format', function() {

                        it('has index 0', function() {
                            expect(formats[1][0].index).to.equal(0);
                        });

                        it('has code [0]', function() {
                            expect(formats[1][0].codes).to.deep.equal([0,1])
                        });

                    });

                    describe('second format', function() {

                        it('has index 4', function() {
                            expect(formats[1][1].index).to.equal(4);
                        });

                        it('has code [22]', function() {
                            expect(formats[1][1].codes).to.deep.equal([22])
                        });

                    });

                    describe('third format', function() {

                        it('has index 8', function() {
                            expect(formats[1][2].index).to.equal(8);
                        });

                        it('has code [0]', function() {
                            expect(formats[1][2].codes).to.deep.equal([0])
                        });

                    });

                });

            });



        });

        describe('paddingLeft', function() {
            var config = { filler: '', ansi: false, width: 10, paddingLeft: '>' };
            var input = '12345 789 123';
            var lines = format.lines(input, config);

            it('has two lines', function() {
                expect(lines.length).to.equal(2);
            });

            it('first line has padding', function() {
                expect(lines[0]).to.equal('>12345 789');
            });

            it('second line has padding', function() {
                expect(lines[1]).to.equal('>123');
            });

        });

        describe('paddingRight', function() {
            var config = { filler: '', ansi: false, width: 10, paddingRight: '<' };
            var input = '12345 789 123';
            var lines = format.lines(input, config);

            it('has two lines', function() {
                expect(lines.length).to.equal(2);
            });

            it('first line has padding', function() {
                expect(lines[0]).to.equal('12345 789<');
            });

            it('second line has padding', function() {
                expect(lines[1]).to.equal('123<');
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

        describe('first line indent', function() {
            var config = { firstLineIndent: '  ', ansi: false, width: 10 };
            var input = '2345 789 012345';
            var lines = format.lines(input, config);

            it('has two lines', function() {
                expect(lines.length).to.equal(2);
            });

            it('first line', function() {
                expect(lines[0]).to.equal('  2345 789');
            });

            it('second line', function() {
                expect(lines[1]).to.equal('012345');
            });

        });

        describe('hanging indent', function() {
            var config = { hangingIndent: '  ', ansi: false, width: 10 };
            var input = '012345 789 2345';
            var lines = format.lines(input, config);

            it('has two lines', function() {
                expect(lines.length).to.equal(2);
            });

            it('first line', function() {
                expect(lines[0]).to.equal('012345 789');
            });

            it('second line', function() {
                expect(lines[1]).to.equal('  2345');
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
        var result = format.wrap(input, { width: 10 });

        it('has two lines', function() {
            expect(result.split('\n').length).to.be.equal(2);
        });

        it('has expected content', function() {
            expect(result).to.be.equal('123 56 \n890 2345');
        });

    });

});