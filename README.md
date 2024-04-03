BNFT
====
Backus Naur Format Transform

About BNFT
----------
BNFT is a tool for extraction information from text, checking against a BNF grammar (Backus-Naur-Form) and transform text into another text.
BNFT is pronounced B’ N’ F’ it, or Benefit and the abbreviation stands for Backus Naur Form Transformer. This document is not a tutorial on BNF or EBNF and familiarity with these subjects are assumed.

What BNFT adds to the BNF notation is the Transformation part. Conceptually all nonterminals "return" the value they match, except for when and alternative output is definced by adding the "->" operator at the end. This means that nonterminals and terminals can be changed into something else, and nonterminals can be inserted in the output in another order than they occur in the syntax matching.

BNFT Testbed
------------
Try out BNFT [here](https://jsfiddle.net/phook/h8evd5bj/embedded/result)

The Testbed sports 4 subwindows, with the BNFT source code, a sample input to run through the BNFT transformation, an output window and a console for error messages and optional console output from running programs. Buttons allow for translating input and running the output - provided it is written in javascript format.

For now available examples are Brainfuck and Turtle. The Brainfuck example is the "Hello World" example from wikipedia and Hello World gets output to the console. The Turtle example implements a simple version of Turtle and opens a popup window with the result. Both languages are interactive, which means you can write your own Brainfuck/Turtle program in the "Code to Interpret" window.

The whitespace option can be used to experiment with significant whitespace grammars, however this has become part of the BNFT spec, so it can be done implicitly.

How to call
-----------
To use BNFT instantiate it with your syntax BNFT `var bnft = new BNFT(BNFTSyntaxString)`.
To parse a source use `bnft.parse(sourceToParse)`. The converted file will be returned (or an error).
```
var bnft = new BNFT('allcharacters = \'A\'..\'Z\'->"!"\nfoo={allcharacters}' [, options]);
var result = bnft.parse("ABCD" [, options]);
```

Options
-------

Following options can be set in call:

option        | description
--------------|------------------------------------------------------------------------------------------------
alert         | a function to call for errors and alerts, typical console.log or alert
fileToString  | a function to call for #includes that loads a file and returns it as a string
nonTerminal   | a string that names the enty non terminal, overriding the default which is the last one defined

Significant Whitespace
----------------------
Languages like Python have made indenting replace blocksymbols, complicating BNF syntaxes. A preprocessor function `significantWhitespace(source,blockbegin,blockend,noindents)` has been added to convert indent style blocks to begin and style blocks. Simply call it with your source, define what you want to use for blockbegin and blockend, and specify if you want indents in the output by setting the spacing parameter.
```
significantWhitespace(*,"BEGIN","END","\t") // Use BEGIN and END as block delimiters and set tab as indent
significantWhitespace(*,"{","}","")         // Use curly brackets as block delimiters and skip indents
significantWhitespace(*,"__B","__E","  ")   // Just silly and double space pr. indent
```

The significant whitespace function can also be invoked from within the syntax specification itself by including the #significantwhitespace in the transformation part.

The BNFT specification
----------------------
The BNFT specification holds the transformation code, written in a modified EBNF form.

Using BNFT
==========
BNFT is a simple style parser that uses some shortcuts to enable its function. 
The rules are:

Literals
--------
A literal is enclosed in quotation marks “ or „. The double quotation mark means case sensitive, whereas the single quotation mark means case insensitive. Case insensitivity can be specified in the grammar itself and is only included as a convenience. Literals only advance the filepointer when the literal matches i.e. “Hello” will require “Hello” to be present at the current point in file.

Nonterminals
------------
Nonterminals are the variables of the BNF. They can be specified using the “:” notation and the “=” notation:
```
number = “0” | “1” | “2” | “3” | ”4” | “5” | “6” | “7” | “8” | ”9”
assignment:
 identifier “:=” value
```
Single Optional “[“ and “]”
---------------------------
A single optional part of the grammar is defined with the square brackets “[“ and “]”. BNFT will advance the filepointer if the optional expression inside it is true. This is regardless whether or not the following possibly non optional expression is true i.e. BNFT does not search the grammar for a correct interpretation.

Multiple Optional “{“ and “}”
-----------------------------
A multiple optional continues to advance the filepointer unless the first following nonoptional item is
true. This was introduced to prevent infinite loops i.e. `“\”” { any_char } “\””`. The
any_char would eat the terminator – so any_char would have to exempt the “\””.

Or expression “|”
-----------------
Or expressions can be constructed by using the “|” operator between arguments. A nonterminal using
the “:” notation allows Or expression to be put on separate lines without the “|” operator:
```
AB_Char = “a” |”b”
```
is the same as
```
AB_Char:
 “a”
 “b”
```
And expression
--------------
And expressions are default when a sequence is specified: “a” “b” “c” is that same as “abc” and
“a” foo “c” is only satisfied when all three are satisfied.

Transformations
---------------
The “->” operator signifies a transformation. It can be used to replace with, swap identifiers and
control indentation. On the right side of the “->” operator you can write literals, nonterminals and the indent processing keywords #indent and #block, and the urien/decoding #encodeuri and #decodeuri

```
String = “Hello” person -> “Goodbye “ person “ and have a nice day”
```

Note that nonterminals are concatenated so you just have to write them once:

```
Hex = hex hex hex hex -> “this is all the hexes “ hex
```

“#indent” will insert spaces that matches the current indentation (controlled by “#block”)
“#block” signifies a indentation so that nonterminals called from within this line will have 1 greater indentation.
```
statement:
 single_statement -> #indent single_statement
block:
 “{“ { statement } “}” -> #block “{“ statement “}”
```
“#encodeuri” will insert the encoding uri from the following literal or nonterminal
“#decodeuri” will insert the decoded uri from the following literal or nonterminal
```
statement:
 unescaped_chars -> #encodeuri unescaped_chars
 escaped_chars   -> #decodeuri escaped_chars
```
“#significantwhitespace allows the input to be processed before subjecting it to the BNF.
variables are insert_for_start_block, insert_for_end_block, indent_character (" " or "\t")
```
program:
 python_like -> #significantwhitespace "{" "}" " " python_like
```


Entry
-----
The last nonterminal specified in the BNFT spec is considered the entry point e.g. `program = { body }`, unless specified otherwise in options.

The Syntax BNF for the .BNFT spec
=================================
```
alpha_char:
 "A".."Z"
 "a".."z"
numeric_char:
 "0".."9"
hexadecimal_char:
 numeric_char
 "A".."F"
 "a".."f"
alphanumeric_char:
 numeric_char
 alpha_char
any_char:
 "\\t"
 "\\r"
 "\\n"
 "\\\\"
 "\\\""
 "\\\’"
 "#".."+"
 " " | "!"
 "(".."\0xFFFF"
 "\\0x" hexadecimal_char
 "\\0x" hexadecimal_char hexadecimal_char hexadecimal_char hexadecimal_char
whitespace:
 " "
 "\t"
whitespaces:
 { whitespace }
identifier:
 alpha_char { alphanumeric_char | "_"} { whitespace }
newline:
 "\r\n"
 "\n\r"
 "\r"
 "\n"
 ";"
newlines:
 whitespaces newline whitespaces { newlines }
entry:
 identifier ":" newlines { definition newlines }
 identifier whitespaces "=" definition newlines
literal:
 "\"" { any_char } "\"" whitespaces [".." whitespaces "\"" { any_char } "\""]
 "\’" { any_char } "\’" whitespaces [".." whitespaces "\'" { any_char } "\'"]
definition:
 expression [ {newline | whitespace} "->" {newline | whitespace} output]
item:
 literal
 identifier
 "{" expression "}"
 "[" expression "]"
 "(" expression ")"
or_expression:
 whitespaces item { whitespaces "|" or_expression }
expression:
 whitespaces or_expression { whitespaces or_expression }
output:
 "#block" | "#indent" | "#significantwhitespace" | "#decodeuri" | "#encodeuri" [output]
 literal [output]
 identifier [output]
body:
 { "#include" {whitespace} literal }
 { entry }
script:
 { body }
```
