[![npm badge](https://nodei.co/npm/cli-format.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/cli-format.png?downloads=true&downloadRank=true&stars=true)

[![NPM version](https://img.shields.io/npm/v/binary-case.svg?style=flat)](https://npmjs.org/package/cli-format)
[![npm module downloads](http://img.shields.io/npm/dt/cli-format.svg)](https://www.npmjs.org/package/cli-format)
[![Build status](https://img.shields.io/travis/Gi60s/cli-format.svg?style=flat)](https://travis-ci.org/Gi60s/cli-format)
[![Test coverage](https://img.shields.io/coveralls/Gi60s/cli-format.svg?style=flat)](https://coveralls.io/r/Gi60s/cli-format?branch=master)

# cli-format

A command line formatting that makes it easy to manage word wrapping, indents, padding, columns, and more. Also works with ansi-encoding libraries chalk, colors, and others.

## Installation

To install with npm

    npm install cli-format
    
## Features

 1. Word wrapping
 2. Lines output
 3. Columns output
 4. Ansi support both [chalk](https://www.npmjs.com/package/chalk) and [colors](https://www.npmjs.com/package/colors)
 5. First line indent
 6. Hanging indent
 8. Automatic available width detection
 9. Hard breaks for long words
 10. Reusable utilities
    
## Example Usage

### Word Wrap

```js
var cliFormat = require('cli-format');
var result = cliFormat.wrap('This line will automatically wrap at column 20', { width: 20 });
console.log(result);

/*
This line will
automatically wrap at
column 20
*/
```
    
### Lines for Word Wrap

```js
var cliFormat = require('cli-format');
var config = {
    width: 20,
    filler: false,
    ansi: false
};
var result = cliFormat.lines('This line will automatically wrap at column 20', config);
console.log(result);

// [ "This line will", "automatically wrap at", "column 20" ]
```
    
### Column Wrapping

```js
var cliFormat = require('cli-format');

var col1 = 'This column uses defaults';
var col2 = {
    content: 'This column uses a custom configuration.',
    width: 15,
    filler: '.'
};

var config = { width: 40, paddingMiddle: ' | ' };

var result = cliFormat.columns.wrap([col1, col2], config);
console.log(result);

/*
This column uses      | This column....
defaults              | uses a custom..
                      | configuration..
*/
```

### Text Justification

```js
var cliFormat = require('cli-format');

var input = 'The quick brown fox jumped over the lazy ' +
    'dog and the cow said moo to you too.';
    
var result = cliFormat.wrap(input, { width: 20, justify: true });
console.log(result);

/*
The quick brown fox
jumped   over   the
lazy  dog  and  the
cow said moo to you
too.
*/
```

## Formatting Options

The functions `.wrap()`, `.lines()`, `.columns.wrap()`, and `.columns.lines()` each use a configuration object to define how the output should be formatted. Below is an explanation of each option.

- **ansi** - Use true to keep ansi-encoding in content, false to strip ansi-encoding. Defaults to `true`.
- **filler** - A repeatable sequence of characters to use from the last word in a line until the end of the line. This is a good way to have leader dots (…) at the end of your lines. Defaults to an empty string.
- **firstLineIndent** - A string to put at the beginning of the first line of your content. Defaults to an empty string.
- **justify** - Set to true to justify wrapped text. Defaults to `false`.
- **justifyLimit** - The maximum number of spaces to add between words when justifying.
- **hangingIndent** - A string to put at the beginning of all except the first line of your content. Defaults to an empty string.
- **paddingLeft** - A string to put at the beginning of every line, before the *firstLineIndent* and the *hangingIndent*.
- **paddingMiddle** - A string to place between columns. This option will only be recognized as a column configuration option. Defaults to three spaces.
- **paddingRight** - A string to put at the ending of every line. Defaults to an empty string.
- **trimEndOfLine** - Use true to trim spaces off the end of each line or use false to keep spaces. Defaults to `true`.
- **trimStartOfLine** - Use true to trim spaces off the beginning of each line or use false to keep spaces. Defaults to `false`.
- **width** - The total usable width for the content. Defaults to the available width for the console.

## API

The following methods and properties are exposed using `require('cli-format')`:

#### ansi.adjust ( previous, adjustment )

Convert from one ansi code array to another, overwriting codes where applicable. For example a code will be overwritten by codes in the same group. If the code for red text is specified followed by the code for blue text then the red text code will be removed leaving the blue text code.

**Parameters**

- **previous** - The array of codes to adjust from.
- **adjustment** - The array of codes to adjust to.

**Returns** an array of numbers.

#### ansi.clean ( codes )

Take an array of codes and remove any codes that are overwritten by later codes. Also, if a default code is applied when default is already set then it is not included.

**Parameters**

- **codes** - The ansi codes to process.

**Returns** an array of numbers.

#### ansi.clearDefaults ( codes )

Take an array of codes and remove any codes that are default codes.

**Parameters**

- **codes** - The ansi codes to process.

**Returns** an array of numbers.

#### ansi.id ( code )

Get the code group and name from the code number.

**Parameters**

- **codes** - The ansi codes.

**Returns** an object with the following format:

```js
{ fullName: 'group.name', group: 'group', name: 'name' }
```

**Example**

```js
var result = cliFormat.ansi.id(1);
console.log(result);

/*
{
    fullName: 'weight.bold',
    group: 'weight',
    name: 'bold'
}
*
```

### columns.lines ( columns [, configuration ] )

Wrap contents into columns and get back the wrapped lines.

**Parameters**

- **columns** - This is an array of string or object values. If an array item is a *string* then the string will be used to specify the content for the column and all other configuration options for that column will be inherited from the `defaultValues.config` options. If an array item is an *object* then the object must have a `content` property that specifies the content for the column. Other configuration options can also be placed here and will be merged with the `defaultValues.config` options.
- **configuration** - This configuration should be used to specify the total `width` of the columns area as well as what the `paddingMiddle` value should be. Any other options specified here will be merged into the options for each column provided in the first parameter.

**Returns** an array of strings.

### columns.wrap ( columns [, configuration ] )

Wrap contents into columns and get back a string with `\n` at the end of each lines. This function is a wrapper for `.columns.lines()`.

### defaultValues

This property contains default configuration instructions. If you'd like to change the default behavior of `cli-format` then you'll want to modify the proeprties on this object. Changes here will affect all future format function calls. Also, there are other configuration settings that are not documented here because you'll probably not need to alter those.

#### defaultValue.config

This object map has the default configuration values for `.wrap()` and `.lines()`.

#### defaultValue.columnConfig

This object map has the default configuration values for `.columns.wrap()` and `.columns.lines()`.

### justify ( content, width )

Specify a string with expand with spaces to meet the justified width. This function does not handle wrapping, but the `.wrap()` and `.lines()` functions do have an option to justify lines.

**Parameters**

- **content** - The text to justify. The width of the text must be less than the width specified.
- **width** - The width to expand the content to.

**Returns** a string.

### lines ( content [, configuration ] )

Wrap content into lines.

**Parameters**

- **content** - The text to wrap.
- **configuration** - The configuration instructions to apply to the wrap. The value provided by this parameter will be merged with the `defaultValues.config` options.

**Returns** an array of strings.

### separate ( content )

Take a string and seperate the content from ansi formatting. This function will return both the ansi free string as well as an object mapping the positions and codes for the ansi that was removed.

**Parameters**

- **content** - The text to separate from the ansi code.

**Returns** an object with the content `value` and ansi encoding `format` data as properties. The `format` property is an array of objects. Each of these objects lists the index from where the ansi encoding was removed as well as the ansi codes that were specified there.

### transform ( content, configuration )

Take a string and replace character sequences with new sequences.

**Parameters**

- **content** - The text to transform.
- **configuration** - An object that maps values that are into what they should be. For example, `{ '\t': '  '` will replace tab characters with two spaces. This configuration is merged with the `defaultValues.transform` configuration.

**Returns** a string.

### trim ( content, start, end )

Trim spaces off of the start and/or end of a string while maintaining ansi formatting that would otherwise have been trimmed off.

**Parameters**

- **content** - The text to trim.
- **start** - Set to `true` to trim the start of the string, or specify a number to specify up to how many spaces to trim.
- **end** - Set to `true` to trim the end of the string, or specify a number to specify up to how many spaces to trim.

**Returns** a string.