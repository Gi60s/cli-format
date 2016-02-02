"use strict";

var codeIdMap;

/**
 * Convert from one ansi code array to another, overwriting codes where applicable.
 * For example, if a code for red text has and adjustment to blue text then the red
 * text code will be replaced with the blue text code.
 * @param {number[]} previous
 * @param {number[]} adjustment
 * @returns {number[]}
 */
exports.adjust = function(previous, adjustment) {
    return exports.clean(previous.concat(adjustment));
};

/**
 * Take an array of codes and remove any codes that are overwritten by later codes. Also,
 * if a default code is applied when default is already set then it is not included.
 * @param {number[]} codes
 * @returns {number[]}
 */
exports.clean = function(codes) {
    var groups;
    var result = [];
    var zero = false;

    // get the initial grouping object
    groups = codes.reduce(function(prev, code) {
        var id;

        // code zero hit - reset
        if (code === 0) {
            zero = true;
            return {};
        }

        id = exports.id(code);
        if (id && (!(zero && id.name === 'default' && !prev.hasOwnProperty(id.group)))) {
            prev[id.group] = code;
        }

        return prev;
    }, {});

    // convert from groups back into array of codes
    Object.keys(groups).forEach(function(group) {
        result.push(groups[group]);
    });

    // if zero was hit then add to start
    if (zero) result.unshift(0);

    return result.length > 0 ? result : [0];
};

/**
 * Take an array of codes and remove any codes that are default codes.
 * @param {number[]} codes
 * @returns {number[]}
 */
exports.clearDefaults = function(codes) {
    return codes.filter(function(code) {
        var id = exports.id(code);
        return id !== null && id.name !== 'default';
    });
};

/**
 * Get the code group and name from it's number.
 * @param {number} code
 * @returns {object}
 */
exports.id = function(code) {
    return codeIdMap[code] || null;
};






//a list of codes to cater to, grouped and named
Object.defineProperty(exports, 'codes', {
    enumerable: false,
    configurable: true,
    writable: false,
    value: {
        bgcolor: {
            black: 30,
            red: 31,
            green: 32,
            yellow: 33,
            blue: 34,
            magenta: 35,
            cyan: 36,
            white: 37,
            default: 39,
            'intense-black': 90,
            'intense-red': 91,
            'intense-green': 92,
            'intense-yellow': 93,
            'intense-blue': 94,
            'intense-magenta': 95,
            'intense-cyan': 96,
            'intense-white': 97
        },
        blink: {
            slow: 5,
            fast: 6,
            default: 25         // none
        },
        color: {
            black: 40,
            red: 41,
            green: 42,
            yellow: 43,
            blue: 44,
            magenta: 45,
            cyan: 46,
            white: 47,
            default: 48,
            'intense-black': 100,
            'intense-red': 101,
            'intense-green': 102,
            'intense-yellow': 103,
            'intense-blue': 104,
            'intense-magenta': 105,
            'intense-cyan': 106,
            'intense-white': 107
        },
        display: {
            conceal: 8,
            default: 28         // reveal
        },
        emphasis: {
            italic: 3,
            fraktur: 20,
            default: 23         // normal
        },
        font: {
            default: 10,
            '1': 11,
            '2': 12,
            '3': 13,
            '4': 14,
            '5': 15,
            '6': 16,
            '7': 17,
            '8': 18,
            '9': 19
        },
        frame: {
            framed: 51,
            encircled: 52,
            overlined: 53,
            default: 54,        // none
            'not-overlined': 55
        },
        image: {
            negative: 7,
            default: 27         // positive
        },
        strikeout: {
            strikeout: 9,
            default: 29         // none
        },
        underline: {
            single: 4,
            default: 24         // none
        },
        weight: {
            bold: 1,
            faint: 2,
            default: 22         // none
        }
    }
});

//ansi escape sequences
Object.defineProperty(exports, 'escape', {
    enumerable: false,
    configurable: true,
    writable: false,
    value: [
        '\u001b',
        '\u009b'
    ]
});





codeIdMap = (function() {
    var result = [];
    Object.keys(exports.codes).forEach(function(groupName) {
        var group = exports.codes[groupName];
        Object.keys(group).forEach(function(codeName) {
            var code = group[codeName];
            result[code] = {
                fullName: groupName + '.' + codeName,
                group: groupName,
                name: codeName
            };
        });
    });
    return result;
})();