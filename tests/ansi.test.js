"use strict";
var ansi            = require('../bin/ansi');
var expect          = require('chai').expect;

describe('ansi', function() {

    describe('#adjust', function() {

        it('adjusts background color', function() {
            expect(ansi.adjust([30], [31,32])).to.be.deep.equal([32]);
        });

        it('adjusts multiple', function() {
            var adj = ansi.adjust([30, 5, 44], [48, 39]);
            adj.sort(function(a, b) { return a > b ? 1 : -1});
            expect(adj).to.be.deep.equal([5, 39, 48]);
        });

        it('is reset by zero from previous', function() {
            expect(ansi.adjust([30, 0, 44], [36])).to.be.deep.equal([0, 44, 36]);
        });

        it('is reset by zero from adjustment', function() {
            expect(ansi.adjust([30, 44], [0, 36])).to.be.deep.equal([0, 36]);
        });

    });

    describe('#clean', function() {

        it('removes duplicates', function() {
            expect(ansi.clean([5, 5, 5, 5])).to.be.deep.equal([5]);
        });

        it('manages overlapping styles', function() {
            expect(ansi.clean([32, 95, 37])).to.be.deep.equal([37]);
        });

        it('is reset by zero', function() {
            expect(ansi.clean([30, 45, 0, 1])).to.be.deep.equal([0, 1]);
        });

        it('can reset', function() {
            expect(ansi.clean([30, 45, 0])).to.be.deep.equal([0]);
        });

        it('does not apply default over rest', function() {
            expect(ansi.clean([0, 22, 23, 29])).to.be.deep.equal([0]);
        })

    });

    describe('#clearDefaults', function() {

        it('removes defaults', function() {
            expect(ansi.clearDefaults([30, 39, 54, 4])).to.be.deep.equal([30, 4]);
        });

    });

    describe('#codes', function() {

        it('is an object map', function() {
            expect(ansi.codes).to.be.an('object');
        });

        it('defines bgcolor group', function() {
            expect(ansi.codes.bgcolor).to.be.an('object');
        });

        it('defines blink group', function() {
            expect(ansi.codes.blink).to.be.an('object');
        });

        it('defines color group', function() {
            expect(ansi.codes.color).to.be.an('object');
        });

        it('defines display group', function() {
            expect(ansi.codes.display).to.be.an('object');
        });

        it('defines emphasis group', function() {
            expect(ansi.codes.emphasis).to.be.an('object');
        });

        it('defines font group', function() {
            expect(ansi.codes.font).to.be.an('object');
        });

        it('defines frame group', function() {
            expect(ansi.codes.frame).to.be.an('object');
        });

        it('defines image group', function() {
            expect(ansi.codes.bgcolor).to.be.an('object');
        });

        it('defines strikeout group', function() {
            expect(ansi.codes.strikeout).to.be.an('object');
        });

        it('defines underline group', function() {
            expect(ansi.codes.underline).to.be.an('object');
        });

        it('defines weight group', function() {
            expect(ansi.codes.weight).to.be.an('object');
        });

        it('has unique codes', function() {
            var codes = [];
            var unique = true;
            Object.keys(ansi.codes).forEach(function(groupName) {
                var group = ansi.codes[groupName];
                Object.keys(group).forEach(function(codeName) {
                    var value = group[codeName];
                    if (codes.indexOf(value) !== -1) unique = false;
                    codes.push(value);
                });
            });
            expect(unique).to.be.equal(true);
        });

    });

    describe('#escape', function() {

        it('is an array of strings', function() {
            var nonStrings = ansi.escape.filter((v) => typeof v !== 'string');
            expect(nonStrings.length).to.be.equal(0);
        });

    });

    describe('#id', function() {

        it('gets background color', function() {
            expect(ansi.id(32).fullName).to.be.equal('bgcolor.green');
        });

        it('gets blink', function() {
            expect(ansi.id(6).fullName).to.be.equal('blink.fast');
        });

        it('gets color', function() {
            expect(ansi.id(101).fullName).to.be.equal('color.intense-red');
        });

        it('gets display', function() {
            expect(ansi.id(8).fullName).to.be.equal('display.conceal');
        });

        it('gets emphasis', function() {
            expect(ansi.id(3).fullName).to.be.equal('emphasis.italic');
        });

        it('gets font', function() {
            expect(ansi.id(14).fullName).to.be.equal('font.4');
        });

        it('gets frame', function() {
            expect(ansi.id(53).fullName).to.be.equal('frame.overlined');
        });

        it('gets image', function() {
            expect(ansi.id(7).fullName).to.be.equal('image.negative');
        });

        it('gets strikeout', function() {
            expect(ansi.id(29).fullName).to.be.equal('strikeout.default');
        });

        it('gets underline', function() {
            expect(ansi.id(4).fullName).to.be.equal('underline.single');
        });

        it('gets weight', function() {
            expect(ansi.id(1).fullName).to.be.equal('weight.bold');
        });

    });

});