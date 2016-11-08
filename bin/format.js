"use strict";
const ansi                  = require('./ansi');
const formatConfig          = require('./format-config');
const stringWidth           = require('string-width');

var Format = {};

module.exports = Format;

Format.columns = {};

Format.columns.lines = function(columns, configuration) {
    var columnsLines;
    var columnsWithoutAssignedWidth = [];
    var config = Object.assign({}, formatConfig.columnConfig, configuration || {});
    var defaultColumnConfig;
    var i;
    var line;
    var middlePaddingWidth = Format.width(config.paddingMiddle);
    var result = [];
    var totalLines;
    var unclaimedWidth;
    var widthPerColumn;
    var widthPerColumnModulus;

    // build the default column configuration
    defaultColumnConfig = Object.assign({}, formatConfig.config, config);
    delete defaultColumnConfig.width;

    // turn all columns into objects
    columns = columns.map(function(column) {
        var result;
        if (typeof column === 'string') {
            result = { content: column };
        } else if (!column || typeof column !== 'object') {
            result = { content: '' };
        } else {
            result = column;
        }
        result = Object.assign({}, defaultColumnConfig, result);
        if (!result.filler) result.filler = ' ';
        return result;
    });

    // determine the amount of unclaimed width
    unclaimedWidth = columns.reduce(function(value, config, index) {
        if (typeof config.width === 'number') return value - config.width;
        columnsWithoutAssignedWidth.push(index);
        return value;
    }, config.width - middlePaddingWidth * (columns.length - 1));

    // distribute unclaimed width
    if (columnsWithoutAssignedWidth.length > 0) {
        widthPerColumn = Math.floor(unclaimedWidth / columnsWithoutAssignedWidth.length);
        widthPerColumnModulus = unclaimedWidth % columnsWithoutAssignedWidth.length;
        columnsWithoutAssignedWidth.forEach(function (index, i) {
            var config = columns[index];
            config.width = widthPerColumn + (i < widthPerColumnModulus ? 1 : 0);
        });
    }

    // get lines for individual columns
    columnsLines = columns.map(function(config) {
        return Format.lines(config.content, config);
    });

    // determine the number of lines
    totalLines = columnsLines.reduce(function(p, c) {
        return p > c.length ? p : c.length;
    }, 0);

    // make all column lines have the same number of lines
    columnsLines.forEach(function(lines, colIndex) {
        var diff = totalLines - lines.length;
        var i;
        var line;
        for (i = 0; i < diff; i++) {
            line = Format.lines('\u200B', columns[colIndex])[0].replace(/\u200B/, '');
            lines.push(line);
        }
    });

    // put together the result
    for (i = 0; i < totalLines; i++) {
        line = [];
        columnsLines.forEach(function(lines) {
            line.push(lines[i]);
        });
        result.push(line.join(config.paddingMiddle));
    }

    return result;
};

Format.columns.wrap = function(columns, configuration) {
    var config = Object.assign({}, formatConfig.columnConfig, configuration || {});
    config.width--;
    return Format.columns.lines(columns, config).join('\n');
};

/**
 * Take a string of text and extend it to the width specified by adding spaces beside existing spaces.
 * @param {string} string The string to justify
 * @param {number} width The width to stretch the string to
 * @returns {string}
 */
Format.justify = function(string, width) {
    var array = string.split(' ');
    var length;
    var modulus;
    var remaining = width - Format.width(string);
    var share;

    length = array.length - 1;
    modulus = remaining % length;
    share = Math.floor(remaining / length);

    if (remaining < 0) return string;
    return array.reduce(function(str, word, index) {
        var addCount = share + (index < modulus ? 1 : 0);
        if (index === length) return str + word;
        return str + word + ' ' + getFiller(addCount, ' ');
    }, '');
};

/**
 * Take a string, set a width to wrap out, and get back an array of strings.
 * @param {string} str The string to produced wrapped lines for.
 * @param {object} [configuration] Options to overwrite the default configuration.
 * @returns {string[]}
 */
Format.lines = function(str, configuration) {
    var activeFormat = [0];
    var availableWidth;
    var config = Object.assign({}, formatConfig.config, configuration || {});
    var data = Format.separate(str);
    var firstLineIndentWidth = Format.width(config.firstLineIndent);
    var formats = data.format;
    var hangingIndentWidth = Format.width(config.hangingIndent);
    var indentWidth = firstLineIndentWidth;
    var index = 0;
    var lastLineIndexes = {};
    var line = '';
    var lines = [];
    var lineWidth = 0;
    var newLine;
    var newLineRx = /\n$/;
    var o;
    var paddingLeftWidth = Format.width(config.paddingLeft);
    var paddingRightWidth = Format.width(config.paddingRight);
    var trimmedWord;
    var trimmedWordWidth;
    var width = config.width - paddingLeftWidth - paddingRightWidth;
    var wordWidth;
    var word;
    var words = Format.words(data.value);

    function ansiEncode(codes) {
        return config.ansi ? ansi.escape[0] + '[' + codes.join(';') + 'm' : '';
    }

    function adjustFormatIndexes(offset) {
        index += offset;
        if (offset !== 0) {
            formats.forEach(function (format) {
                if (format.index >= index) format.index += offset;
            });
        }
    }

    // separate words into lines
    while (word = words.shift()) {
        availableWidth = width - lineWidth - indentWidth;
        index += word.length;
        newLine = newLineRx.test(word);
        trimmedWord = word.replace(/ $/, '');
        trimmedWordWidth = Format.width(trimmedWord);
        wordWidth = Format.width(word);

        // word fits on line
        if (wordWidth <= availableWidth) {
            line += word;
            lineWidth += wordWidth;

        // trimmed word fits on the line
        } else if (trimmedWordWidth <= availableWidth) {
            adjustFormatIndexes(-1);

            lines.push(line + trimmedWord);
            line = '';
            lineWidth = 0;
            indentWidth = hangingIndentWidth;

        // word is too long for any line
        } else if (trimmedWordWidth > width - indentWidth) {

            // add to the end of the current line
            if (availableWidth > 3) {
                o = maximizeLargeWord(word, config.hardBreak, availableWidth);
                lines.push(line + o.start);

            // put on a new line
            } else {
                if (line.length > 0) lines.push(line);
                o = maximizeLargeWord(word, config.hardBreak, width - indentWidth);
                lines.push(o.start);
            }
            words.unshift(o.remaining);

            line = '';
            lineWidth = 0;
            indentWidth = hangingIndentWidth;

            adjustFormatIndexes(config.hardBreak.length);
            newLine = false;

        // send word to next line
        } else {
            lines.push(line);
            indentWidth = hangingIndentWidth;
            if (trimmedWordWidth === width - indentWidth) {
                lines.push(trimmedWord);
                line = '';
                lineWidth = 0;
            } else {
                line = word;
                lineWidth = wordWidth;
            }
        }

        // if there is a new line character at the end of the word then start a new line
        if (newLine) {
            lastLineIndexes[lines.length] = true;
            lines.push(line);
            line = '';
            lineWidth = 0;
            indentWidth = hangingIndentWidth;
        }
    }
    if (line.length > 0) lines.push(line);
    lastLineIndexes[lines.length - 1] = true;

    // add formatting to the lines
    if (config.ansi) {
        index = 0;
        lines = lines
            .map(function(line) {
                return line
                    .split('')
                    .map(function(ch, colIndex) {
                        var codes = [];
                        var result = '';

                        // determine what codes to add before the character
                        if (formats[0] && index === formats[0].index) {
                            activeFormat = formats.shift().codes;
                            codes = activeFormat;
                        }
                        if (colIndex === 0) {
                            codes = activeFormat;
                            codes.unshift(0);
                        }

                        // add codes before and after the character
                        if (codes.length > 0) result += ansiEncode(ansi.clean(codes));
                        result += ch;
                        if (colIndex === line.length - 1) result += ansiEncode([0]);

                        index++;
                        return result;
                    })
                    .join('');
            });
    }

    // add padding and indents to the lines
    lines = lines.map(function(line, index) {
        var firstLine = index === 0;
        var indent = firstLine ? config.firstLineIndent : config.hangingIndent;
        var indentWidth = firstLine ? firstLineIndentWidth : hangingIndentWidth;
        var isLastLine = lastLineIndexes[index];
        var prefix;
        var suffix;

        // remove all new line characters as they were accounted for during line creation
        line = line.replace(/\n/g, '');

        // trim the line and justify
        line = Format.trim(line, config.trimStartOfLine, config.trimEndOfLine || config.justify);
        if (!isLastLine && config.justify) line = Format.justify(line, width - indentWidth);

        // add padding and indents
        prefix = config.paddingLeft + indent;
        suffix = getFiller(width - Format.width(line) - indentWidth, config.filler) + config.paddingRight;

        // add encoding resets
        if (prefix.length > 0) prefix = ansiEncode([0]) + prefix;
        if (suffix.length > 0) suffix += ansiEncode([0]);

        // return the result
        return prefix + line + suffix;
    });

    return lines;
};

/**
 * Take a string and separate out the ansi characters from the content.
 * @param {string} str
 * @returns {object}
 */
Format.separate = function(str) {
    var activeCodes = [];
    var additionalCodes;
    var format = [];
    var match;
    var o;
    var prevIndex = -1;
    var prevCodes;
    var result = '';
    var rx;

    // build the RegExp for finding ansi escape sequences
    rx = new RegExp('[' + ansi.escape.join('') + ']\\[((?:\\d;?)+)+m');

    // begin separating codes from content
    while (str.length > 0) {
        match = rx.exec(str);
        if (match) {
            result += str.substr(0, match.index);
            str = str.substr(match.index + match[0].length);
            additionalCodes = match[1].split(';').map((v) => parseInt(v));

            if (prevIndex === result.length) {
                o = format[format.length - 1];
                o.codes = ansi.adjust(o.codes, additionalCodes);
            } else {
                prevCodes = ansi.clearDefaults(activeCodes);
                o = {
                    index: result.length,
                    codes: ansi.adjust(prevCodes, additionalCodes)
                };
                format.push(o);
            }

            activeCodes = o.codes;
            prevIndex = result.length;
        } else {
            result += str;
            str = '';
        }
    }

    return {
        format: format,
        value: result
    }
};

/**
 * Transform a string into a new string.
 * @param {string} str
 * @param {object} [configuration] A map of strings to replace (as properties) with values (as values).
 * @returns {string}
 */
Format.transform = function(str, configuration) {
    var config = Object.assign({}, formatConfig.transform, configuration || {});
    Object.keys(config).forEach(function(key) {
        var value = config[key];
        str = str.replace(new RegExp(key.replace(/\\/g, '\\\\')), value);
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
    var template = '([' + ansi.escape.join('') + ']\\[(?:(?:\\d;?)+)+m)?';

    //trim the start
    rx = new RegExp('^' + template + ' ');
    if (typeof start == 'number' && start <= 0) start = false;
    while (rx.test(str) && start) {
        str = str.replace(rx, '$1');
        if (typeof start === 'number') {
            start--;
            if (start <= 0) start = false;
        }
    }

    //trim the end
    rx = new RegExp(' ' + template + '$');
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

/**
 * Pass in a string and get back an array of words.
 * @param {string} content
 * @param {boolean} [keepAnsi=false]
 * @returns {string[]}
 */
Format.words = function(content, keepAnsi) {
    var ch;
    var count = 0;
    var i;
    var indexes = [0];
    var word = '';
    var words = [];

    // remove ansi formatting
    if (!keepAnsi) content = Format.separate(content).value;

    for (i = 0; i < content.length; i++) {
        count++;
        ch = content.charAt(i);
        word += ch;
        if (formatConfig.breaks.indexOf(ch) !== -1) {
            words.push(word);
            indexes.push(i + 1);
            word = '';
            count = 0;
        }
    }
    if (count > 0) words.push(word);

    return words;
};

/**
 * Get the width of a string (not it's length). Some characters
 * take more or less than one space.
 * @param str
 * @returns {*}
 */
Format.width = function(str) {
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

/**
 * Wrap a string.
 * @param str
 * @param configuration
 * @returns {string}
 */
Format.wrap = function(str, configuration) {
    var config = Object.assign({}, formatConfig.config, configuration || {});
    config.width--;     // decrement width since we're adding a \n to the end of each line
    return Format.lines(str, config).join('\n');
};




function getFiller(count, filler) {
    var result = '';
    if (count < 0) count = 0;
    if (filler && typeof filler === 'string' && Format.width(filler) > 0) {
        while (Format.width(result) < count) {
            result += filler;
        }
        while (Format.width(result) > count) {
            result = result.substr(0, result.length - 1);
        }
    }
    return result;
}

/**
 * If a word is too large for a line then find out how much will
 * fit on one line and return the result.
 * @param {string} word
 * @param {string} hardBreakStr
 * @param {number} maxWidth
 * @returns {object}
 */
function maximizeLargeWord(word, hardBreakStr, maxWidth) {
    var availableWidth;
    var ch;
    var chWidth;
    var i;

    availableWidth = maxWidth - Format.width(hardBreakStr);

    for (i = 0; i < word.length; i++) {
        ch = word.charAt(i);
        chWidth = Format.width(ch);
        if (availableWidth >= chWidth) {
            availableWidth -= chWidth;
        } else {
            break;
        }
    }

    return {
        start: word.substr(0, i) + hardBreakStr,
        remaining: word.substr(i)
    };
}