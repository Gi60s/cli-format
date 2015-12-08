"use strict";
const ansi                  = require('./ansi');
const formatConfig          = require('./format-config');
const stringWidth           = require('string-width');

module.exports = Format;


function Format(str, configuration) {
    var config = Object.assign({}, formatConfig.config, configuration);

    //force instance creation
    if (!(this instanceof Format)) return new Format(str, config);

    this.configuration = config;
    this.lines = Format.lines(str, config);
    this.wrap = this.lines.join('\n');

}

Format.columns = function(configuration) {
    var args = Array.prototype.slice.call(arguments, 0);
    var config;
    var columns = [];
    var lineCount = 0;
    var row;
    var rowIndex;
    var strings;
    var strWidth = Format.stringWidth;
    var widths;
    var result = '';

    //get configuration and strings to process
    config = Object.assign({}, formatConfig.config, typeof args[args.length - 1] === 'object' ? args.pop() : {});
    strings = args;

    //determine widths to use
    widths = analyzeWidth(strings, config);

    //build lines for each column
    strings.forEach(function(str, colIndex) {
        var colConfig;
        var lines;
        var width = widths[colIndex];

        //get lines for column
        if (str instanceof Format) {
            colConfig = str.configuration;
            lines = str.lines;
        } else {
            colConfig = Object.assign({}, config, { paddingLeft: '', paddingRight: '', width: width });
            lines = Format.lines(str, colConfig);
        }

        //store lines and number of lines
        if (lineCount < lines.length) lineCount = lines.length;
        columns[colIndex] = {
            config: colConfig,
            lines: lines
        };
    });

    //iterate through rows and columns to build the string
    for (rowIndex = 0; rowIndex < lineCount; rowIndex++) {
        columns.forEach(function(column, colIndex) {
            var filler = strings[colIndex] instanceof Format ? strings[colIndex].configuration.filler : config.filler;
            var line = column.lines[rowIndex] || '';
            var paddingWidth = strWidth(column.config.paddingLeft + column.config.paddingRight);
            result += colIndex === 0 ? config.paddingLeft : config.paddingMiddle;
            if (line.length === 0) result += column.config.paddingLeft;
            result += line + getFiller(widths[colIndex] - strWidth(line) - paddingWidth, filler);
            if (line.length === 0) result += column.config.paddingRight;
            if (colIndex === columns.length - 1) result += config.paddingRight;
        });
        result += '\n';
    };

    return result;
};

/**
 * Take a string, set a width to wrap out, and get back an array of strings.
 * @param {string} str The string to produced wrapped lines for.
 * @param {object} [configuration] Options to overwrite the default configuration.
 * @returns {string[]}
 */
Format.lines = function(str, configuration) {
    const config = Object.assign({}, formatConfig.config, configuration || {});
    const data = Format.words(str);
    const formats = data.format;
    const hardBreakWidth = Format.stringWidth(config.hardBreak);
    const lines = [];
    const words = data.words;
    var adjustPosition = 0;
    var availableWidth;
    var endOfLine;
    var format;
    var line;
    var lineWidth;
    var padRightWidth = Format.stringWidth(config.paddingRight);
    var strWidth = Format.stringWidth;
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
            var result = '';
            var length = word.length;

            if (!config.ansi) {
                if (isNewLine) result += config.paddingLeft + config.hangingIndent;
                result += word;
            } else {
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
                if (config.trimEndOfLine) line = Format.trim(line, false, true);
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

            if (config.trimEndOfLine) line = Format.trim(line, false, true);
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

/**
 * Take a string and separate out the ansi characters from the content.
 * @param {string} str
 * @returns {{format: {index: number, codes: number[]}, string: string}}
 */
Format.separate = function(str) {
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

/**
 * Transform a string into a new string.
 * @param {string} str
 * @param {object} configuration A map of strings to replace (as properties) with values (as values).
 * @returns {string}
 */
Format.transform = function(str, configuration) {
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
Format.trim = function(str, start, end) {
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

Format.words = function(str) {
    const content = Format.separate(Format.transform(str));
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

/**
 * Wrap a string.
 * @param str
 * @param configuration
 * @returns {string}
 */
Format.wrap = function(str, configuration) {
    return Format.lines(str, configuration).join('\n');
};

/**
 * Get the width of a string (not it's length). Some characters
 * take more or less than one space.
 * @param str
 * @returns {*}
 */
Format.stringWidth = function(str) {
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



function analyzeWidth(strings, config) {
    var autoColumnCount = 0;
    var autoWidth;
    var columnCount = strings.length;
    var i;
    var modulusIndex;
    var result = [];
    var strWidth = Format.stringWidth;
    var widths = config.width;
    var widthAvailable = config.availableWidth -
        strWidth(config.paddingLeft + config.paddingRight) -
        ((columnCount - 1 ) * strWidth(config.paddingMiddle));

    //if input is a single number then set all widths to the number specified
    if (typeof widths === 'number' && !isNaN(widths)) {
        widths = [];
        for (i = 0; i < columnCount; i++) widths.push(widths);
    }

    //if widths isn't an array then make it into one
    if (!Array.isArray(widths)) {
        widths = [];
        for (i = 0; i < columnCount; i++) widths.push(null);
    }

    //set widths from an Format instances because those take priority
    strings.forEach(function(item, index) {
        if (item instanceof Format) widths[index] = item.configuration.width;
    });

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
                result.push(autoWidth + (modulusIndex > index ? 1 : 0));
            }
        }
    });

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
    if (filler && typeof filler === 'string' && Format.stringWidth(filler) > 0) {
        while (Format.stringWidth(result) < count) {
            result += filler;
        }
        while (Format.stringWidth(result) > count) {
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