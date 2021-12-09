
    var Tokenizer = function (source) {
      this.source = source;
      this.position = 0; // current position (or current peekposition if peeking)

      this.peekPosition = []; // for storing current position when peeking
      this.indents = []; // for indents - significant whitespace

      this.endOfScript = function () {
        return this.position >= source.length;
      };

      // returns next char and advances position
      this.nextChar = function () {
        var result = this.currentChar();
        this.next();
        return result;
      };

      // advances position
      this.next = function () {
        this.position += 1;
      };

      // returns current char
      this.currentChar = function () {
        if (this.position >= this.source.length) {
          return "";
        }
        return this.source.substring(this.position, this.position + 1);
      };

      // returns if peeking is active
      this.peeking = function () {
        return this.peekPosition.length !== 0;
      };

      // push/start peeking
      this.peek = function () {
        this.peekPosition.push(this.position);
      };

      // pop/stop peeking
      this.unPeek = function () {
        if (this.peeking()) {
          this.position = this.peekPosition.pop();
        }
      };

      // checks for next token to be s and advances position
      this.nextIs = function (s, caseSensitive) {

        caseSensitive = (caseSensitive === undefined) ? true : caseSensitive;

        if (this.peekNextIs(s, caseSensitive)) {
          this.position += s.length;
          return true;
        }
        return false;
      };

      // checks for next token to be s
      this.peekNextIs = function (s, caseSensitive) {

        caseSensitive = (caseSensitive === undefined) ? true : caseSensitive;

        if (this.position + s.length > this.source.length) {
          return false;
        }

        var match = this.source.substring(this.position, this.position + s.length);

        if (caseSensitive) {
          return match === s;
        }

        return match.toLowerCase() === s.toLowerCase();
      };

      // inserts a string at mark
      this.insertFrom = function (mark, stringToInsert) {
        this.source = source.substring(0, mark) + stringToInsert + "
" + source.substring(this.position);
        this.position = mark;
      };
    };

    var tokenizer = new Tokenizer(source + "
");
this.alpha_char = function () {"A".."Z""a".."z"}this.numeric_char = function () {"0".."9"}this.hexadecimal_char = function () {numeric_char"A".."F""a".."f"}this.alphanumeric_char = function () {numeric_charalpha_char}this.any_char = function () {"\\\"""\\\'""\\t""\\r""\\n""\\\\""#".."+"" " | "!""(".."\0xFFFF""\\0x" hexadecimal_char"\\0x" hexadecimal_char hexadecimal_char hexadecimal_char hexadecimal_charnewlinewhitespace}this.whitespace = function () {" " | "\t"  { " " | "\t" }}this.optwhitespace = function () {[ whitespace ]}this.newline = function () {"\r" | "\n" | ";" { " " | "\t" | "\r" | "\n" | ";" }}this.optnewline = function () {[ newline ]}this.identifier = function () {alpha_char { alphanumeric_char | "_"}}this.newline = function () {"\r\n""\n\r""\r""\n"}this.newlines = function () {optwhitespace newline { optwhitespace newline }}this.entry = function () {identifier ":" newlines { definition newlines }    -> "this." identifier " = function () {" definition "}"identifier optwhitespace "=" definition newlines     -> "this." identifier " = function () {" definition "}"}this.literal = function () {"\"" { any_char } "\"""\'" { any_char } "\'"}this.range = function () {literal optwhitespace ".." literal}this.output_literal = function () {"\"" { any_char } "\"""\'" { any_char } "\'"}this.definition = function () {expression [ optwhitespace "->" optwhitespace output]}this.item = function () {rangeliteralidentifier"{" expression optwhitespace "}""[" expression optwhitespace "]""(" expression optwhitespace ")"}this.or_expression = function () {optwhitespace item { optwhitespace "|"  or_expression }}this.expression = function () {optwhitespace or_expression { optwhitespace or_expression }}this.output_item = function () {"#indent" | "#block"output_literalidentifier}this.output = function () {output_item { whitespace output_item }}this.body = function () {{ "#include" {whitespace} literal }{ entry }}this.script = function () {{ body } -> '
    var Tokenizer = function (source) {
      this.source = source;
      this.position = 0; // current position (or current peekposition if peeking)

      this.peekPosition = []; // for storing current position when peeking
      this.indents = []; // for indents - significant whitespace

      this.endOfScript = function () {
        return this.position >= source.length;
      };

      // returns next char and advances position
      this.nextChar = function () {
        var result = this.currentChar();
        this.next();
        return result;
      };

      // advances position
      this.next = function () {
        this.position += 1;
      };

      // returns current char
      this.currentChar = function () {
        if (this.position >= this.source.length) {
          return \"\";
        }
        return this.source.substring(this.position, this.position + 1);
      };

      // returns if peeking is active
      this.peeking = function () {
        return this.peekPosition.length !== 0;
      };

      // push/start peeking
      this.peek = function () {
        this.peekPosition.push(this.position);
      };

      // pop/stop peeking
      this.unPeek = function () {
        if (this.peeking()) {
          this.position = this.peekPosition.pop();
        }
      };

      // checks for next token to be s and advances position
      this.nextIs = function (s, caseSensitive) {

        caseSensitive = (caseSensitive === undefined) ? true : caseSensitive;

        if (this.peekNextIs(s, caseSensitive)) {
          this.position += s.length;
          return true;
        }
        return false;
      };

      // checks for next token to be s
      this.peekNextIs = function (s, caseSensitive) {

        caseSensitive = (caseSensitive === undefined) ? true : caseSensitive;

        if (this.position + s.length > this.source.length) {
          return false;
        }

        var match = this.source.substring(this.position, this.position + s.length);

        if (caseSensitive) {
          return match === s;
        }

        return match.toLowerCase() === s.toLowerCase();
      };

      // inserts a string at mark
      this.insertFrom = function (mark, stringToInsert) {
        this.source = source.substring(0, mark) + stringToInsert + \"\n\" + source.substring(this.position);
        this.position = mark;
      };
    };

    var tokenizer = new Tokenizer(source + \"\n\");
' body}