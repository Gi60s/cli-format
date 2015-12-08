# cli-format

A command line formatting that makes it easy to manage word wrapping, indents, padding, columns, and more. Also works with ansi-encoding libraries chalk, colors, and others.

## Installation

To install with npm

    npm install cli-format
    
## Features

 1. Word wrapping at any width you choose
 2. Line output (words in an array)
 3. Column output
 4. Ansi formatting (on or off)
 5. First line indent
 6. Hanging indent
 7. Trim start or end of line independently
 8. Automatic available width detection
 9. Hard breaks for long words
 10. Reusable utilities
    
## Example Usage

### Simple Word Wrap

    var cliFormat = require('cli-format');
    var result = cliFormat.wrap('This line will automatically wrap at column 20', { width: 20 });
    console.log(result);
    
    /*
    This line will
    automatically wrap at
    column 20
    */
    
### Lines for Word Wrap

    var cliFormat = require('cli-format');
    var config = {
        width: 20,
        filler: false,
        ansi: false
    };
    var result = cliFormat.lines('This line will automatically wrap at column 20', config);
    console.log(result);
    
    /*
    [ "This line will", "automatically wrap at", "column 20" ]
    */
    
### Column Wrapping

<pre>var str = 'T' + colors.underline('he') +
  	' quick brown fox jumped over the ' +
    colors.bold('lazy dog') +
    ' and the cow said moo to you too.';<br>
var config = {
    width: [20, 20, null],
    paddingLeft: '&gt;',
    paddingRight: '&lt;',
    paddingMiddle: ' | ',
    hangingIndent: '...',
    filler: '.'
};
    
var result = format.columns(str, str, str, config);
console.log(result);<br>
/*
&gt;T<u>he</u> quick brown fox | T<u>he</u> quick brown.. | T<u>he</u> quick brown fox jumped over the.&lt;
&gt;...jumped over the. | ...fox jumped.... | ...<strong>lazy dog</strong> and the cow said moo to.&lt;
&gt;...<strong>lazy dog</strong> and the | ...over the <strong>lazy</strong>. | ...you too..........................&lt;
&gt;...cow said moo to. | ...<strong>dog</strong> and the... | ....................................&lt;
&gt;...you too......... | ...cow said moo.. | ....................................&lt;
&gt;................... | ...to you too.... | ....................................&lt;
*/</pre>

### Advanced Column Wrapping

<pre>var str = 'T' + colors.underline('he') +
     ' quick brown fox jumped over the ' +
     colors.bold('lazy dog') +
     ' and the cow said moo to you too.';
 
 //custom column
 var column1 = format(str, {
     ansi: true,
     width: 20,
     paddingLeft: '/',
     paddingRight: '_'
 });
 
 //default config for all columns without a custom config
 var config = {
     ansi: false,
     paddingLeft: '&gt;',
     paddingRight: '&lt;',
     paddingMiddle: ' | ',
     hangingIndent: '...',
     filler: '.'
 };
 
 var result = format.columns(column1, str, config);
 console.log(result);<br>
/*
&gt;/T<u>he</u> quick brown fox _ | The quick brown fox jumped over the lazy dog and the.&lt;
&gt;/jumped over the <strong>lazy</strong>_ | ...cow said moo to you too...........................&lt;
&gt;/<strong>dog</strong> and the cow said_ | .....................................................&lt;
&gt;/moo to you too.     _ | .....................................................&lt;
*/</pre>
    
	

## Formatting Options

The functions `.wrap()`, `.lines()`, and `.columns()` each use a configuration object to define how the output should be provided. Below you'll see what configuration options exist.

| Option            | Default               | Description
| ----------------- | --------------------- | ---
| ansi              | true                  | Use true to keep ansi-encoding in content, false to strip ansi-encoding.
| availableWidth    | (console width or 80) | The width available for columns to use. This value is used if one or more columns do not have a width specified.
| filler            | (space)               | A repeatable sequence of characters to use from the last word in a line until the end of the line. This is a good way to have leader dots (...) at the end of your lines.
| firstLineIndent   | (empty string)        | A string to put at the beginning of the first line of your content.
| hangingIndent     | (empty string)        | A string to put at the beginning of all except the first line of your content.
| hardBreak         | -                     | A string to use to break a line that is too long for a single line onto multiple lines.
| paddingLeft       | (empty string)        | A string to put at the beginning of every line. 
| paddingMiddle     | (3 spaces)            | A string to place between columns.
| paddingRight      | (empty string)        | A string to put at the ending of every line.
| trimEndOfLine     | true                  | Use true to trim spaces off the end of each line or use false to keep spaces.
| trimStartOfLine   | false                 | Use true to trim spaces off the beginning of each line or use false to keep spaces.
| width             | (console width or 80) | The width to limit wrapped content (also individual columns) to. If using this for columns then use an array of numbers to specify the width of each column. If an item in the array is not a number then its column size will automatically be calculated based on remaining available width.

## API

The following methods and properties are exposed using `require('cli-format')`:

| Method / Property | Signature                             | Returns   | Description
| ----------------- | ------------------------------------- | --------- | ---
| ansi              |                                       | object    | See the **ansi** section below
| config            |                                       | object    | See the **config** section below
| columns           | .columns(content..., configuration)   | string    | Take one or more content strings and convert them into a column layout string. The configuration width should be an array of numbers (or non-numbers for automatic width fields).
| lines             | .lines(content, configuration)        | string[]  | Take a content string and convert it into an array of strings that contain enough content for the width provided through the configuration. 
| transform         | .transform(content, transformMap)     | string    | Run a string through the transform configuration map.
| words             | .words(content)                       | object[]  | Take a string and break it up into an array of words and also get ansi-formatting for each change in formatting. 
| wrap              | .wrap(content, configuration)         | string    | Take a content string and convert it into a wrapped string.
| separate          | .separate(content)                    | object    | Get an object that has the content without ansi formatting and an object that defines ansi-formatting changes and where they occur.
| stringWidth       | .stringWidth(content)                 | number    | Determine the width (not the length) of a string. Some characters have more or less than a width of one.
| trim              | .trim(content, start, end)            | string    | Trim spaces off the front and/or end of the content while preserving ansi-encoded formatting. Start and end can be either a boolean or a non-negative number that represents how much to trim.

### Ansi

The `require('cli-format').ansi` object has the following properties that may be of use to you. Generally you won't need to change these properties but you can if you want different behavior than what is default.

| Property          | Description
| ----------------- | ---
| escape            | An array of characters that are used to identify ansi-escape sequences.
| codes             | A map of ansi-escape codes and their groupings.

### Config

The `require('cli-format').config` object has the following properties that may be of use to you. Generally you won't need to change these properties but you can if you want different behavior than what is default.

| Property          | Description
| ----------------- | ---
| breaks            | An array of characters that are used to identify word breaks.
| config            | An object that defines the default configuration for format functions.
| lengths           | An object map that defines how wide a character is. This works in conjunction with the string-width module.
| transform         | A map that controls how the transform function executes. The key is a regular expression string that will be found to replace with the value assigned to the key.