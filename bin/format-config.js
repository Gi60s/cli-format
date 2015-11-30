
// An array of characters to identify as soft break locations
exports.breaks = [
    ' ',
    '-',
    '\n',
    '\u2007',   //figure space
    '\u2060'    //word joiner
];

exports.config = {
    ansi: true,                                     //set to false to remove ansi formatting
    availableWidth: process.stdout.columns || 80,   //the amount of width the console provides
    filler: ' ',                                    //content to add to the end of the line
    firstLineIndent: '',                            //content to add to the start of first line
    hangingIndent: '',                              //content to add to the start of all but the first line
    hardBreak: '-',                                 //if a word is longer than the width this hard break is used to split the word
    paddingLeft: '',                                //padding to add to the left of output
    paddingMiddle: '   ',                           //padding to place between columns
    paddingRight: '',                               //padding to add to the right of output
    trimEndOfLine: true,                            //true to trim end of line or a number to indicate how much to trim
    trimStartOfLine: false,                         //true to trim start of line or a number to indicate how much to trim
    width: process.stdout.columns || 80             //the width before wrapping occurs
};

// A map of characters with special widths
// The string-width module takes care of most of this
exports.lengths = {
    '\u200B': 0
};

// A map of sequences to transform into the value sequence
// The key is a regular expression
exports.transform = {
    '\r\n': '\n',
    '\t': '  '
};