"use strict";
const ansi                  = require('./ansi');
const formatConfig          = require('./format-config');
const stringWidth           = require('string-width');




exports.columns = function(configuration) {
    var args = Array.prototype.slice.call(arguments, 0);
    var config;
    var columns = [];
    var i;
    var lineCount = 0;
    var strings;
    var strWidth = exports.stringWidth;
    var widths;
    var result = '';

    //get configuration and strings to process
    config = Object.assign({}, formatConfig.config, typeof args[args.length - 1] === 'object' ? args.pop() : {});
    strings = args;

    //determine widths to use
    widths = analyzeWidth(config.width, strings.length);

    //build each column
    strings.forEach(function(str, index) {
        var lines;
        var width = widths[index];
        var colConfig = Object.assign({}, config);

        //modify configuration for lines usage
        colConfig.width = width;
        if (index !== strings.length - 1) colConfig.paddingRight = '';
        if (index > 0) colConfig.paddingLeft = config.paddingMiddle;

        //get the lines
        lines = exports.lines(str, colConfig);
        if (lines.length > lineCount) lineCount = lines.length;

        columns.push({
            config: colConfig,
            lines: lines
        });
    });

    //put the columns together
    for (i = 0; i < lineCount; i++) {
        columns.forEach(function(column) {
            var config = column.config;
            var line = column.lines[i];

            if (!line) {
                line = config.paddingLeft + (i === 0 ? config.firstLineIndent : config.hangingIndent);
                line += getFiller(config.width - strWidth(line) - strWidth(config.paddingRight), config.filler) + config.paddingRight;
            }

            result += line;
        });
        result += '\n';
    }

    return result;
};

/**
 * Take a string, set a width to wrap out, and get back an array of strings.
 * @param {string} str The string to produced wrapped lines for.
 * @param {object} [configuration] Options to overwrite the default configuration.
 * @returns {string[]}
 */
exports.lines = function(str, configuration) {
    const config = Object.assign({}, formatConfig.config, configuration || {});
    const data = exports.words(str);
    const formats = data.format;
    const hardBreakWidth = exports.stringWidth(config.hardBreak);
    const lines = [];
    const words = data.words;
    var adjustPosition = 0;
    var availableWidth;
    var endOfLine;
    var format;
    var line;
    var lineWidth;
    var padRightWidth = exports.stringWidth(config.paddingRight);
    var strWidth = exports.stringWidth;
    var trimmed;
    var trimmedWidth;
    var width = config.width - strWidth(config.paddingLeft) - strWidth(config.paddingRight);
    var widthFull = config.width;
    var word;
    var wordWidth;

    function ansiEncode(codes) {
        var result;
        var uniqueCodes;
        if (!config.ansi) return '';
        result = ansi.escape[0] + '[0';
        if (codes.length > 0) {
            uniqueCodes = codes.reduce(function(p, c) {
                if (c !== 0 && p.indexOf(c) === -1) p.push(c);
                return p;
            }, []);
            if (uniqueCodes.length > 0) result += ';' + uniqueCodes.join(';');
        }
        return result + 'm'
    }

    function trimEnd(str) {
        return str.replace(/ $/, '')
    }

    format = (function() {

        //add initial and terminal format codes
        formats.unshift({ index: 0, codes: [0] });
        if (formats[0].index > 0) formats.push({ index: str.length, codes: [0] });

        var store = formats.slice(0);
        var active = store.shift();
        var next = store[0];
        var position = 0;

        function format(word, isNewLine) {
            var i;
            var result;
            var length = word.length;

            if (!config.ansi) {
                result = word;
            } else {
                result = '';
                if (isNewLine) {
                    result += ansiEncode(active ? active.codes : [0]) +
                        config.paddingLeft + config.hangingIndent;
                }
                for (i = 0; i < length; i++) {
                    if (next && next.index === position + i) {
                        result += ansiEncode(next.codes);
                        active = store.shift();
                        next = store[0];
                    }
                    if (word.length > i) result += word.charAt(i);
                }
            }

            position += length;

            return result;
        }

        format.adjustPosition = function(amount) {
            position += amount;
        };

        return format;
    })();

    line = ansiEncode([0]) + config.paddingLeft + config.firstLineIndent;
    while (words.length > 0) {
        word = words.shift();
        wordWidth = strWidth(word);
        trimmed = trimEnd(word);
        trimmedWidth = strWidth(trimmed);
        lineWidth = strWidth(line);
        availableWidth = widthFull - lineWidth - padRightWidth;

        //if the word is too long for a line then perform a hard break
        if (trimmedWidth > width) {
            words.unshift(word.substr(width - hardBreakWidth));
            words.unshift(word.substr(0, width - hardBreakWidth) + config.hardBreak);
            adjustPosition = -1 * strWidth(config.hardBreak);

        //perform a soft break
        } else if (wordWidth > availableWidth) {
            endOfLine = /\n$/.test(word);
            if (endOfLine) {
                word = word.replace(/\n$/, '');
                trimmed = trimmed.replace(/\n$/, '');
            }

            if (config.trimEndOfLine && trimmedWidth <= availableWidth) {
                line += format(trimmed, false) + ansiEncode([0]);
                format.adjustPosition(1);
                line += getFiller(widthFull - strWidth(line) - padRightWidth, config.filler);
                line += config.paddingRight;
                lines.push(line);
                line = format('', true);
            } else {
                if (config.trimEndOfLine) line = exports.trim(line, false, true);
                line += ansiEncode([0]);
                line += getFiller(widthFull - strWidth(line) - padRightWidth, config.filler) + config.paddingRight;
                lines.push(line);
                line = format(word, true);
            }

            if (endOfLine) words.unshift('\n');

        //perform a manual break
        } else if (/\n$/.test(word)) {
            word = word.replace(/\n$/, '');                             //remove newline from end of word
            line += format(word, false) + ansiEncode([0]);
            format.adjustPosition(1);

            if (config.trimEndOfLine) line = exports.trim(line, false, true);
            line += getFiller(widthFull - strWidth(line) - padRightWidth, config.filler) + config.paddingRight;
            lines.push(line);

            line = format('', true);

        //add to the current line
        } else {
            line += format(word, line.length === 0);

        }

        //do any after word position adjustments that are necessary
        if (adjustPosition !== 0) {
            format.adjustPosition(adjustPosition);
            adjustPosition = 0;
        }
    }

    if (line) {
        line += ansiEncode([0]) +
            getFiller(widthFull - strWidth(line) - padRightWidth, config.filler) + config.paddingRight;
        lines.push(line);
    }

    return lines;
};

exports.separate = function(str) {
    var activeCodes = [];
    var format = [];
    var map = getCodeMap();
    var match;
    var o;
    var result = '';
    var rx;

    //build the RegExp for finding ansi escape sequences
    rx = new RegExp('[' + ansi.escape.join('') + ']\\[((?:\\d;?)+)+m');

    //begin stripping
    while (str.length > 0) {
        match = rx.exec(str);
        if (match) {
            result += str.substr(0, match.index);
            str = str.substr(match.index + match[0].length);
            activeCodes = normalize(activeCodes, match[1].split(';'), map);
            o = {
                index: result.length,
                codes: activeCodes.slice(0).map(function(v) { return parseInt(v); })
            };
            format.push(o);
        } else {
            result += str;
            str = '';
        }
    }

    return {
        format: format,
        string: result
    }
};

exports.transform = function(str, configuration) {
    var config = Object.assign({}, formatConfig.transform, configuration);
    Object.keys(config).forEach(function(key) {
        var value = config[key];
        str = str.replace(RegExp(key.replace(/\\/g, '\\\\')), value);
    });
    return str;
};

/**
 * Trim spaces off the start or end of a string, but keep ansi formatting information.
 * @param {string} str The string to trim.
 * @param {boolean, number} start True to trim the start, a number to indicate how much to trim.
 * @param {boolean, number} end True to trim the end, a number to indicate how much to trim.
 * @returns {string}
 */
exports.trim = function(str, start, end) {
    var rx;
    var template = '([' + ansi.escape + ']\\[(?:(?:\\d;?)+)+m)?';

    //trim the start
    rx = RegExp('^' + template + ' ');
    if (typeof start == 'number' && start <= 0) start = false;
    while (rx.test(str) && start) {
        str = str.replace(rx, '$1');
        if (typeof start === 'number') {
            start--;
            if (start <= 0) start = false;
        }
    }

    //trim the end
    rx = RegExp(' ' + template + '$');
    if (typeof end == 'number' && end <= 0) end = false;
    while (rx.test(str) && end) {
        str = str.replace(rx, '$1');
        if (typeof end === 'number') {
            end--;
            if (end <= 0) end = false;
        }
    }

    return str;
};

exports.words = function(str) {
    const content = exports.separate(exports.transform(str));
    const words = [];
    var ch;
    var count = 0;
    var i;
    var word = '';

    for (i = 0; i < content.string.length; i++) {
        count++;
        ch = content.string.charAt(i);
        word += ch;
        if (formatConfig.breaks.indexOf(ch) !== -1) {
            words.push(word);
            word = '';
            count = 0;
        }
    }
    if (count > 0) words.push(word);

    return {
        words: words,
        format: content.format
    };
};

exports.wrap = function(str, configuration) {
    return exports.lines(str, configuration).join('\n');
};

/**
 * Get the width of a string (not it's length). Some characters
 * take more or less than one space.
 * @param str
 * @returns {*}
 */
exports.stringWidth = function(str) {
    var ch;
    var i;
    var width = stringWidth(str);
    for (i = 0; i < str.length; i++) {
        ch = str.charAt(i);
        if (formatConfig.lengths.hasOwnProperty(ch)) {
            width += -1 + formatConfig.lengths[ch];
        }
    }
    return width;
};



function analyzeWidth(widths, columnCount) {
    var autoColumnCount = 0;
    var autoWidth;
    var i;
    var modulusIndex;
    var result = [];
    var widthAvailable = formatConfig.config.availableWidth;

    //input is a single number
    if (typeof widths === 'number' && !isNaN(widths)) {
        for (i = 0; i < columnCount; i++) result.push(widths);

    //input is an array of numbers and non-numbers
    } else if (Array.isArray(widths)) {

        //figure out how much width is available after using assigned widths
        autoColumnCount = 0;
        widths.forEach(function(width, index) {
            if (typeof width === 'number' && !isNaN(width) && index < columnCount) {
                widthAvailable -= width;
            } else {
                autoColumnCount++;
            }
        });

        //determine auto width parameters
        if (autoColumnCount > 0) {
            autoWidth = widthAvailable > 0 ? Math.floor(widthAvailable / autoColumnCount) : 0;
            modulusIndex = widthAvailable > 0 ? widthAvailable % autoColumnCount : 0;
        }

        //start assigning widths
        widths.forEach(function(width, index) {
            if (index < columnCount) {
                if (typeof width === 'number' && !isNaN(width)) {
                    result.push(width);
                } else {
                    result.push(autoWidth + (modulusIndex >= index ? 1 : 0));
                }
            }
        });

    //input is not a number
    } else {
        autoWidth = widthAvailable > 0 ? Math.floor(widthAvailable / columnCount) : 0;
        modulusIndex = widthAvailable > 0 ? widthAvailable % columnCount : 0;
        for (i = 0; i < columnCount; i++) result.push(autoWidth + (modulusIndex >= i ? 1 : 0));
    }

    return result;
}

function getCodeMap() {
    const result = {
        supported: [],
        groups: {}
    };
    Object.keys(ansi.codes).forEach(function(group) {
        Object.keys(ansi.codes[group]).forEach(function(name) {
            var code = ansi.codes[group][name];
            result.supported.push(code);
            result.groups[code] = group;
        });
    });
    return result;
}

function getGroupCodes(group) {
    const result = [];
    if (ansi.codes.hasOwnProperty(group)) {
        Object.keys(ansi.codes[group]).forEach(function(name) {
            var code = ansi.codes[group][name];
            result.push(code);
        });
    }
    return result;
}

function getSpaces(count) {
    return getFiller(count, ' ');
}

function getFiller(count, filler) {
    var result = '';
    if (count < 0) count = 0;
    if (filler && typeof filler === 'string' && exports.stringWidth(filler) > 0) {
        while (exports.stringWidth(result) < count) {
            result += filler;
        }
        while (exports.stringWidth(result) > count) {
            result = result.substr(0, result.length - 1);
        }
    }
    return result;
}

function normalize(active, codes, map) {
    var index;
    active = active.slice(0);
    codes = codes.slice(0);

    //look for a reset code
    index = codes.indexOf('0');
    if (index !== -1) {
        active = [0];
        codes.splice(index, 1);
    }

    //add and remove codes to update the active group codes
    codes.forEach(function(code) {
        var group = map.groups[code];
        var index;
        if (group) {
            getGroupCodes(group).forEach(function(groupCode) {
                var index = active.indexOf(groupCode);
                if (index !== -1) active.splice(index, 1);
            });
            active.push(code);
        }
    });

    return active;
}

function normalizeConfig(config) {
    return Object.assign({
        firstLineIndent: 0,
        hangingIndent: 0,
        paddingLeft: '  ',
        paddingRight: '  ',
        width: process.stdout.columns || 80,
    }, config || {});
}