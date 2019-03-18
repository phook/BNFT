/*jslint nomen: true, plusplus: true, vars: true, indent: 2*/
(function () {

  "use strict";

  var root = this;
  var previous_BNFT = root.BNFT;


  var BNFT = function (source,alert) {
    // SIGNIFICANT WHITESPACE VARIABLES
    this.outputblockbegin = "";
    this.outputblockend = "";

    this.Tokenizer = function (source) {
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
        this.source = source.substring(0, mark) + stringToInsert + "\n" + source.substring(this.position);
        this.position = mark;
      };
    };

    this.tokenizer = new this.Tokenizer(source + "\n");

    // Class Result
    this.Result = function (identifier, result) {
      this.identifier = identifier;
      this.myresult = result;
      this.next = null;

      this.add = function (item) {
        if (this.next) {
          this.next.add(item);
        } else {
          this.next = item;
        }
      };

      this.find = function (identifier, number) {
        number = number === undefined ? -1 : number;

        if (this.identifier === identifier) {
          if (number === 0 || this.next === null) {
            return this.myresult;
          }
          return this.myresult + this.next.find(identifier, number--);
        }

        if (this.next) {
          return this.next.find(identifier, number);
        }

        return "";
      };

      this.result = function () {
        if (this.next) {
          return this.myresult + this.next.result();
        }
        return result;
      };
    };

    // Interface Expression
    this.Expression = function () {
      this.folded = false;

      // test for optionality - default return value
      this.isOptional = function () {
        return false;
      };

      // test for identifierity - default return value
      this.isIdentifier = function () {
        return null;
      };

      // fold is optimizing the syntax tree, by removing identifiers - returns value to please JSLint
      this.fold = function () {
        return false;
      };

      // parse is an "abstract" function, not specified so errors will occor if decendents dont implement it
      // parse function returns a result object and advances tokenizer if match is found, otherwise it returns null
    };

    this.entry = [];

    // Class Literal implements Expression
    this.Literal = function (owner, literal, caseSensitive) {
      owner.Expression.call(this);

      this.literal = literal;
      this.caseSensitive = caseSensitive;
      this.owner = owner;

      // parse a literal
      this.parse = function () {

        if (this.owner.tokenizer.endOfScript()) {
          return null;
        }

        if (this.owner.tokenizer.nextIs(this.literal, this.caseSensitive)) {
          return new this.owner.Result("", this.literal);
        }

        return null;
      };
    };

    // Class Range implements Expression
    this.Range = function (owner, char1, char2, caseSensitive) {
      owner.Expression.call(this);

      if (char1 < char2) {
        this.char1 = char1;
        this.char2 = char2;
      } else {
        this.char1 = char2;
        this.char2 = char1;
      }

      this.caseSensitive = caseSensitive;
      this.owner = owner;

      // parse a range
      this.parse = function () {
        if (this.owner.tokenizer.endOfScript()) {
          return null;
        }

        var currentChar = this.owner.tokenizer.currentChar();
        if (caseSensitive) {
          if (currentChar >= char1 && currentChar <= char2) {
            this.owner.tokenizer.next();
            return new this.owner.Result("", currentChar);
          }
        } else {
          if (currentChar.toLowerCase() >= char1.toLowerCase() && currentChar.toLowerCase() <= char2.toLowerCase()) {
            this.owner.tokenizer.next();
            return new this.owner.Result("", currentChar);
          }
        }

        return null;
      };
    };

    // Class OptionalExpression implements Expression
    this.OptionalExpression = function (owner, arg1) {
      owner.Expression.call(this);
      this.arg1 = arg1;
      this.owner = owner;

      // Override optionality since this one is
      this.isOptional = function () {
        return true;
      };

      // Override fold
      this.fold = function () {

        if (this.folded) {
          return;
        }

        this.folded = true;

        if (this.arg1.isIdentifier() !== null) {
          this.arg1 = this.arg1.isIdentifier();
        }

        this.arg1.fold();
      };

      // parse an optional expression
      this.parse = function (terminator) {

        this.owner.tokenizer.peek();

        if (this.arg1.parse(terminator) !== null) {
          this.owner.tokenizer.unPeek();
          return this.arg1.parse(terminator);
        }

        this.owner.tokenizer.unPeek();
        return null;
      };
    };

    // Class OptionalExpressions implements Expression
    this.OptionalExpressions = function (owner, arg1) {
      owner.Expression.call(this);
      this.owner = owner;
      this.arg1 = arg1;

      // override fold
      this.fold = function () {

        if (this.folded) {
          return;
        }

        this.folded = true;

        if (this.arg1.isIdentifier() !== null) {
          this.arg1 = this.arg1.isIdentifier();
        }

        this.arg1.fold();
      };

      // override since this is optional
      this.isOptional = function () {
        return true;
      };

      // parse a set of optional expressions
      this.parse = function (terminator) {
        var result = null;
        var test = null;
        while (true) {
          this.owner.tokenizer.peek();
          test = this.arg1.parse(terminator);
          this.owner.tokenizer.unPeek();
          if (test !== null) {
            if (result === null) {
              result = new this.owner.Result("", "");
            }
            result.add(this.arg1.parse(terminator));
          } else {
            return result;
          }

          if (terminator) {
            this.owner.tokenizer.peek();
            if (terminator.parse(null) !== null) {
              this.owner.tokenizer.unPeek();
              return result;
            }
            this.owner.tokenizer.unPeek();
          }
        }
        return null;
      };
    };

    // Class OrExpression implements Expression
    this.OrExpression = function (owner, nonterminal) {
      owner.Expression.call(this);
      this.owner = owner;
      this.arg = [];
      this.nonterminal = nonterminal;

      if (nonterminal !== "") {
        owner.entry.push(this);
      }

      // override fold
      this.fold = function () {
        var i = 0;
        if (this.folded) {
          return;
        }

        this.folded = true;
        var test = null;
        for (i = 0; i < this.arg.length; i++) {
          test = this.arg[i].isIdentifier();
          if (test !== null) {
            this.arg.splice(i, 0, test);
            this.arg.splice(i + 1, 1);
          }
          this.arg[i].fold();
        }
      };

      // override since this might be optional
      this.isOptional = function () {
        var i = 0;
        for (i = 0; i < this.arg.length; i++) {
          if (this.arg[i].isOptional()) {
            return true;
          }
        }
        return false;
      };

      // parse an Or Expression
      this.parse = function (terminator) {
        var result = null;
        var i = 0;
        for (i = 0; i < this.arg.length; i++) {
          result = this.arg[i].parse(terminator);
          if (result !== null) {
            return new this.owner.Result(nonterminal, result.result());
          }
        }
        return null;
      };
    };

    this.indent = 0;

    // Class AndExpression implements Expression
    this.AndExpression = function (owner) {
      owner.Expression.call(this);
      this.owner = owner;
      this.arg = [];
      this.newOutputSpecification = [];
      this.indentate = false;

      // override since this might be optional
      this.isOptional = function () {
        var i = 0;
        for (i = 0; i < this.arg.length; i++) {
          if (!this.arg[i].isOptional()) {
            return false;
          }
        }
        return true;
      };

      // override fold
      this.fold = function () {
        if (this.folded) {
          return;
        }
        var i = 0;
        var test = null;
        this.folded = true;
        for (i = 0; i < this.arg.length; i++) {
          test = this.arg[i].isIdentifier();
          if (test !== null) {
            this.arg.splice(i, 0, test);
            this.arg.splice(i + 1, 1);
          }
          this.arg[i].fold();
        }
      };

      // parse an And Expression
      this.parse = function (terminator) {
        var mark = this.owner.tokenizer.position;
        if (this.indentate) {
          this.owner.indent++;
        }
        var result = null;
        this.owner.tokenizer.peek();
        var success = true;
        var i, j = 0;
        var intermediateResult = null;
        var newTerminator = terminator;
        for (i = 0; i < this.arg.length; i++) {
          if (!this.arg[i].isOptional()) { // non optional elements does not have terminator
            intermediateResult = this.arg[i].parse(null);
          } else {
            if (i + 1 === this.arg.length) { // last element reuses terminator
              intermediateResult = this.arg[i].parse(terminator);
            } else {
              if (this.arg[i + 1].isOptional()) { // if next element is optional, find first nonoptional and use it as terminator
                newTerminator = terminator;
                for (j = i + 1; j < this.arg.length && this.arg[j].isOptional(); j++) {
                  if (!this.arg[j].isOptional()) {
                    newTerminator = this.arg[j];
                    break;
                  }
                }
                intermediateResult = this.arg[i].parse(newTerminator);
              } else {
                intermediateResult = this.arg[i].parse(this.arg[i + 1]);
              }
            }
          }
          if (!this.arg[i].isOptional() && intermediateResult === null) {
            this.owner.tokenizer.unPeek();
            success = false;
            i = this.arg.length;
          } else {
            if (intermediateResult !== null) {
              if (result === null) {
                result = new this.owner.Result("", "");
              }
              result.add(intermediateResult);
            }
          }
        }

        if (success && result !== null) {
          this.owner.tokenizer.peekPosition.pop();
          if (this.newOutputSpecification !== null) {
            if (this.newOutputSpecification.length > 0) {
              var concat = "", localEntry = "", nextEntry = "", fileToInclude = "";
              for (i = 0; i < this.newOutputSpecification.length; i++) {
                localEntry = this.newOutputSpecification[i];
                if (localEntry.length > 0) {
                  if (localEntry === "#indent") {
                    for (j = 0; j < this.owner.indent; j++) {
                      concat += " ";
                    }
                  } else {
                    if (localEntry === "#include") {
                      if (i + 1 < this.newOutputSpecification.length) {
                        nextEntry = this.newOutputSpecification[i + 1];
                        fileToInclude = result.find(nextEntry);
                        fileToInclude = fileToInclude.replace("\"", "");
                        fileToInclude = fileToInclude.replace("\'", "");
                        this.owner.tokenizer.insertFrom(mark, this.owner.fileToString(fileToInclude));
                        i = i + 1;
                      }
                    } else {
                      if (localEntry[0] === '"') {
                        concat += localEntry.substring(1);
                      } else {
                        concat += result.find(localEntry);
                      }
                    }
                  }
                }
              }
              result = new this.owner.Result("", concat);
            }
          }
        } else {
          result = null;
        }

        if (this.indentate) {
          this.owner.indent--;
        }

        return result;
      };
    };

    // CLASS Identifier implements Expression
    this.Identifier = function (owner, identifier) {
      owner.Expression.call(this);
      this.owner = owner;
      this.identifier = identifier;
      this.passThrough = null;

      // override since this might be identifier
      this.isIdentifier = function () {
        if (this.passThrough === null) {
          var i;
          for (i = 0; i < this.owner.entry.length; i++) {
            if (this.owner.entry[i].nonterminal === identifier) {
              this.passThrough = this.owner.entry[i];
              break;
            }
          }
        }
        return this.passThrough;
      };

      // override since this might be optional
      this.isOptional = function () {
        if (this.isIdentifier() === null) {
          return true;
        }
        return this.passThrough.isOptional();
      };

      this.parse = function (terminator) {
        var result = null;
        if (this.isIdentifier() !== null) {
          result = this.passThrough.parse(terminator);
        }

        if (result === null) {
          if (typeof(alert) == "function")
            alert("Missing identifier: " + this.identifier); /// REPORT ERRORS?
          return null;
        }

        return result;
      };
    };

    // BNF evaluator starting
    this.lastIndentate = false;
    this.lastValue = 0;
    this.lastChar = "";
    this.lastIdentifier = "";
    this.lastExpression = null;
    this.lastOutput = [];
    this.errorPosition = -1;
    this.erroreMessage = "";

    this.error = function (error) {
      if (!this.tokenizer.peeking() && this.errorPosition === -1) {
        this.errorMessage = error;
        this.errorPosition = this.tokenizer.position;
      }
      return false;
    };

    this._alpha_char = function () {
      var currentChar = this.tokenizer.currentChar();
      if (currentChar.toLowerCase() >= "a" && currentChar.toLowerCase() <= "z") {
        this.lastChar = currentChar;
        this.tokenizer.next();
        return true;
      }
      return false;
    };

    this._numeric_char = function () {
      var currentChar = this.tokenizer.currentChar();
      if (currentChar >= "0" && currentChar <= "9") {
        this.lastChar = currentChar;
        this.lastValue = parseInt(currentChar, 10);
        this.tokenizer.next();
        return true;
      }
      return false;
    };

    this._alphanumeric_char = function () {
      if (this._alpha_char()) {
        return true;
      }
      if (this._numeric_char()) {
        return true;
      }
      return false;
    };

    this._hexadecimal_char = function () {
      var currentChar = this.tokenizer.currentChar();
      if ((currentChar.toLowerCase() >= "a" && currentChar.toLowerCase() <= "f") || (currentChar.toLowerCase() >= "0" && currentChar.toLowerCase() <= "9")) {
        this.lastChar = currentChar;
        this.lastValue = parseInt(currentChar, 16);
        this.tokenizer.next();
        return true;
      }
      return false;
    };

    this._any_char = function () {
      var i;
      this.lastChar = this.tokenizer.nextChar();
      if (this.lastChar === "\\") {
        if (this.tokenizer.currentChar() === "\\") {
          this.lastChar = "\\";
          this.tokenizer.next();
          return true;
        }
        if (this.tokenizer.currentChar() === "r") {
          this.lastChar = "\r";
          this.tokenizer.next();
          return true;
        }
        if (this.tokenizer.currentChar() === "n") {
          this.lastChar = "\n";
          this.tokenizer.next();
          return true;
        }
        if (this.tokenizer.currentChar() === "\"") {
          this.lastChar = "\"";
          this.tokenizer.next();
          return true;
        }
        if (this.tokenizer.currentChar() === "'") {
          this.lastChar = "'";
          this.tokenizer.next();
          return true;
        }
        if (this.tokenizer.nextIs("0x")) {
          var charValue = 0, result = "";
          for (i = 0; i < 4; i++) {
            result = this._hexadecimal_char();
            if (!result) {
              return this.error("hexadecimal char expected");
            }
            charValue = charValue * 16 + this.lastValue;
          }
          this.lastChar = String.fromCharCode(charValue);
          return true;
        }
        return false;
      }
      return true;
    };

    this._whitespace = function () {
      if (this.tokenizer.nextIs("\t")) {
        return true;
      }
      if (this.tokenizer.nextIs(" ")) {
        return true;
      }
      return false;
    };

    this._underscore = function () {
      if (this.tokenizer.nextIs("_")) {
        this.lastChar = "_";
        return true;
      }
      return false;
    };

    this._identifier = function () {
      this.lastIdentifier = "";
      if (this._alpha_char()) {
        this.lastIdentifier = this.lastChar;
        while (this._alphanumeric_char() || this._underscore()) {
          this.lastIdentifier += this.lastChar;
        }
        this._whitespace();
        return true;
      }
      return this.error("identifier expected");
    };

    this._newline = function () {
      if (this.tokenizer.nextIs("\r\n")) {
        return true;
      }
      if (this.tokenizer.nextIs("\n\r")) {
        return true;
      }
      if (this.tokenizer.nextIs("\r")) {
        return true;
      }
      if (this.tokenizer.nextIs("\n")) {
        return true;
      }
      if (this.tokenizer.nextIs(";")) {
        return true;
      }
      return false;
    };

    this._isnextnewline = function () {
      this.tokenizer.peek();
      var result = this._newline();
      this.tokenizer.unPeek();
      return result;
    };

    this._eat_whitespaces = function () {
      var to_please_mr_crockford = true;
      while (to_please_mr_crockford) {
        to_please_mr_crockford = this._whitespace();
      }
    };

    this._nextline = function () {
      this._eat_whitespaces();
      var result = this._newline();
      this._eat_whitespaces();
      return result;
    };

    this._advanceline = function () {
      var result = false;
      while (this._nextline()) {
        result = true;
      }
      return result;
    };

    this._finished_definition = function () {
      this.tokenizer.peek();
      if (this._definition()) {
        this.tokenizer.unPeek();
        this._definition();
        return true;
      }
      this.tokenizer.unPeek();
      return false;
    };

    this._entry = function () {
      if (this._identifier()) {
        var localEntry = new this.OrExpression(this, this.lastIdentifier);
        if (this.tokenizer.nextIs(":")) {
          if (!this._nextline()) {
            return false;
          }
          if (!this._definition()) {
            return false;
          }

          if (this.lastExpression !== null) {
            localEntry.arg.push(this.lastExpression);
          }

          this.lastExpression = null;

          while (this._finished_definition()) {
            if (this.lastExpression !== null) {
              localEntry.arg.push(this.lastExpression);
            }
          }
          if (!this.tokenizer.peeking()) {
            this.lastExpression = localEntry;
          }
          return true;
        }
        if (this.tokenizer.nextIs("=")) {
          if (!this._definition()) {
            return false;
          }
          if (this.lastExpression !== null) {
            localEntry.arg.push(this.lastExpression);
          }
          if (!this.tokenizer.peeking()) {
            this.lastExpression = localEntry;
          }
          return true;
        }
      }
      return this.error(": or = expected");
    };

    this._script = function () {
      var mark = this.tokenizer.position;
      if (this.tokenizer.nextIs("#include")) {
        if (!this.tokenizer.nextIs(" ")) {
          return false;
        }

        this._eat_whitespaces();

        if (!this._output_literal()) {
          return false;
        }

        if (!this._advanceline()) {
          return false;
        }

        this.tokenizer.insertFrom(mark, this.fileToString(this.lastIdentifier));
      } else {
        if (this.tokenizer.nextIs("#significantwhitespace")) {
          if (!this.tokenizer.nextIs(" ")) {
            return false;
          }

          this.eat_whitepspaces();

          if (!this._output_literal()) {
            return this.error("string literal expected");
          }
          this.outputblockbegin = this.lastidentifer;

          if (!this._output_literal()) {
            return this.error("string literal expected");
          }
          this.outputblockend = this.lastidentifer;

          if (!this._advanceline()) {
            return false;
          }
          this.significantwhitespace = true;
        } else {
          if (this.tokenizer.nextIs("#")) {
            while (!this._isnextnewline() && !this.tokenizer.endOfScript()) {
              this.tokenizer.next();
            }

            if (!this._advanceline()) {
              return false;
            }
          } else {
            if (!this._entry()) {
              return this.tokenizer.endOfScript();
            }
          }
        }
      }
      return this._script();
    };

    this._literal = function () {
      var literalEnclosing = this.tokenizer.currentChar();
      if (literalEnclosing !== "\"" && literalEnclosing !== "'") {
        return false;
      }
      this.tokenizer.next();
      var literal = "";
      var enter = this.tokenizer.currentChar() === "\\";
      this._any_char();
      while (this.lastChar !== literalEnclosing || enter) {
        literal += this.lastChar;
        enter = this.tokenizer.currentChar() === "\\";
        this._any_char();
      }
      if (this.lastChar !== literalEnclosing) {
        return this.error(literalEnclosing + " expected");
      }
      this._eat_whitespaces();

      this.lastIdentifier = literal;

      if (this.tokenizer.nextIs("..")) {
        this._eat_whitespaces();
        if (!this.tokenizer.nextIs(literalEnclosing)) {
          return this.error(literalEnclosing + " expected");
        }
        var secondLiteral = "";
        enter = this.tokenizer.currentChar() === "\\";
        this._any_char();
        while (this.lastChar !== literalEnclosing || enter) {
          secondLiteral += this.lastChar;
          enter = this.tokenizer.currentChar() === "\\";
          this._any_char();
        }
        if (this.lastChar !== literalEnclosing) {
          return this.error(literalEnclosing + " expected");
        }

        if (!this.tokenizer.peeking()) {
          this.lastExpression = new this.Range(this, literal, secondLiteral, literalEnclosing === "\"");
        }

        return true;
      }

      if (!this.tokenizer.peeking()) {
        this.lastExpression = new this.Literal(this, literal, literalEnclosing === "\"");
      }

      return true;
    };

    this._output_literal = function () {
      if (!this.tokenizer.nextIs("\"")) {
        return this.error("\" expected");
      }
      this.lastIdentifier = "";
      var enter = this.tokenizer.currentChar() === "\\";
      this._any_char();
      while (this.lastChar !== "\"" || enter) {
        this.lastIdentifier += this.lastChar;
        enter = this.tokenizer.currentChar() === "\\";
        this._any_char();
      }
      if (this.lastChar !== "\"") {
        return this.error("\" expected");
      }
      this._eat_whitespaces();
      return true;
    };

    this._definition = function () {
      this._eat_whitespaces();
      if (!this._expression()) {
        return false;
      }

      var result = this._advanceline();

      if (this.tokenizer.nextIs("->")) {
        this._advanceline();

        this.lastIndentate = false;
        this.lastOutput = [];
        var exp = this.lastExpression;

        this._output();

        if (!this.tokenizer.peeking()) {
          this.lastExpression = new this.AndExpression(this);
          this.lastExpression.newOutputSpecification = this.lastOutput;
          this.lastExpression.arg.push(exp);
          this.lastExpression.indentate = this.lastIndentate;
        }

        if (!this._advanceline()) {
          return this.error("newline expected");
        }

        result = true;
      }

      if (!result) {
        return this.error("newline expected");
      }

      return true;
    };

    this._item = function () {

      if (this._literal()) {
        return true;
      }

      if (this._identifier()) {
        if (!this.tokenizer.peeking()) {
          this.lastExpression = new this.Identifier(this, this.lastIdentifier);
        }
        return true;
      }

      if (this.tokenizer.nextIs("{")) {
        this._expression();

        if (!this.tokenizer.peeking()) {
          this.lastExpression = new this.OptionalExpressions(this, this.lastExpression);
        }

        if (!this.tokenizer.nextIs("}")) {
          return this.error(") expected");
        }

        return true;
      }

      if (this.tokenizer.nextIs("[")) {
        this._expression();

        if (!this.tokenizer.peeking()) {
          this.lastExpression = new this.OptionalExpression(this, this.lastExpression);
        }

        if (!this.tokenizer.nextIs("]")) {
          return this.error("] expected");
        }

        return true;
      }

      if (this.tokenizer.nextIs("(")) {
        this._expression();

        if (!this.tokenizer.nextIs(")")) {
          return this.error("} expected");
        }

        return true;
      }
      return false;
    };

    this._or_expression = function () {
      var orExpression = null;

      if (!this._item()) {
        return false;
      }

      this._eat_whitespaces();

      while (this.tokenizer.nextIs("|")) {
        if (orExpression === null && this.lastExpression !== null) {
          orExpression = new this.OrExpression(this, "");
          orExpression.arg.push(this.lastExpression);
        }

        this._eat_whitespaces();
        this._item();
        this._eat_whitespaces();

        if (orExpression !== null && this.lastExpression !== null) {
          orExpression.arg.push(this.lastExpression);
        }
      }

      if (orExpression !== null && !this.tokenizer.peeking()) {
        this.lastExpression = orExpression;
      }

      return true;
    };

    this._expression = function () {
      this._eat_whitespaces();

      var andExpression = null;

      if (!this._or_expression()) {
        return false;
      }

      this._eat_whitespaces();

      this.tokenizer.peek();

      while (this._or_expression()) {
        this.tokenizer.unPeek();

        if (andExpression === null && !this.tokenizer.peeking() && this.lastExpression !== null) {
          andExpression = new this.AndExpression(this);
          andExpression.arg.push(this.lastExpression);
        }

        this._or_expression();

        if (andExpression !== null && this.lastExpression !== null) {
          andExpression.arg.push(this.lastExpression);
        }

        this._eat_whitespaces();

        this.tokenizer.peek();
      }
      this.tokenizer.unPeek();

      if (andExpression !== null && !this.tokenizer.peeking()) {
        this.lastExpression = andExpression;
      }

      return true;
    };

    this._output = function () {
      this._eat_whitespaces();

      if (this.tokenizer.nextIs("#block")) {
        this.lastIndentate = true;
        this._output();
        return true;
      }

      if (this.tokenizer.nextIs("#indent")) {
        this.lastOutput.push("#indent");
        this._output();
        return true;
      }

      if (this.tokenizer.nextIs("#include")) {
        this.lastOutput.push("#include");
        this._output();
        return true;
      }

      if (this._output_literal()) {
        this.lastOutput.push("\"" + this.lastIdentifier);
        this._output();
        return true;
      }

      if (this._identifier()) {
        this.lastOutput.push(this.lastIdentifier);
        this._output();
        return true;
      }
      return this.error("output definition expected");
    };

    this.errorFormatting = function (message) {
      message += "\n";
      if (this.errorPosition === -1) {
        this.errorPosition = this.tokenizer.position;
        this.errorMessage = "Unknown error";
      }
      var pos1 = this.errorPosition;
      while (pos1 > 0 && this.tokenizer.source[pos1] !== '\n') {
        pos1--;
      }
      var pos2 = this.errorPosition;
      while (pos2 < this.tokenizer.source.length && this.tokenizer.source[pos2] !== '\n') {
        pos2++;
      }
      message += this.tokenizer.source.substring(pos1, pos2);
      message += "\n";
      while (this.errorPosition-- !== pos1) {
        message += " ";
      }
      message += "^\n" + this.errorMessage;
      return message;
    };

      if (!this._script()) {
        if (typeof(alert) == "function")
			alert(this.errorFormatting("BNFT Source parse fail")); // ERROR REPORTING
        return "ERROR";
      }


    this.parse = function (source, alert) {
      this.tokenizer = new this.Tokenizer(source);
      if (this.lastExpression !== null) {
        this.errorPosition = -1;
        this.lastExpression.fold();
        var result = this.lastExpression.parse();
        if (result !== null) {
          return result.result();
        }
        if (typeof(alert) == "function")
          alert(this.errorFormatting("BNFT parse fail"));
        return "ERROR";
      }
        if (typeof(alert) == "function")
          alert(this.errorFormatting("BNFT parse fail"));
      return "ERROR";
    };
/*
    this.fileToString = function (filePath) {
    // some xmlhttp magic
    }

    this.stringToFile = function (filePath, string) {
    // more magic
    }
*/
    this.significantWhitespace = function (source, blockbegin, blockend, noindents) {
      this.noindents = noindents;
      var indents = function (size) {
        if (noindents) {
          return "";
        }
        var result = "";
        var i = 0;
        for (i = 0; i < size; i++) {
          result += " ";
        }
        return result;
      };
      var newsource = "";
      var spaces = 0;
      var indent = false;
      var currentlevel = [0];
      var i = 0;
      var chr = "";
      for (i = 0; i < source.length; i++) {
        chr = source[i];
        if (chr === " ") {
          if (indent) {
            spaces += 1;
          } else {
            newsource += chr;
          }
        } else {
          if (chr === "\r" || chr === "\n") {
            newsource += chr;
            indent = true;
            spaces = 0;
          } else {
            if (indent) {
              if (spaces !== currentlevel[currentlevel.length - 1]) {
                if (spaces > currentlevel[currentlevel.length - 1]) {
                  newsource += indents(currentlevel[currentlevel.length - 1]);
                  newsource += blockbegin;
                  newsource += indents(spaces);
                  currentlevel.push(spaces);
                } else {
                  while (spaces < currentlevel[currentlevel.length - 1]) {
                    currentlevel.pop();
                    newsource += indents(currentlevel[currentlevel.length - 1]) + blockend;
                  }
                  newsource += indents(currentlevel[currentlevel.length - 1]);
                }
              } else {
                newsource += indents(spaces);
              }
            }
            indent = false;
            newsource += chr;
          }
        }
      }
      while (0 < currentlevel[currentlevel.length - 1]) {
        currentlevel.pop();
        newsource += indents(currentlevel[currentlevel.length - 1]) + blockend;
      }
      return newsource;
    };
  };

/* SIMPLE TEST

var bnft = new BNFT('allcharacters = \'A\'..\'Z\'->"!"\nfoo={allcharacters}');
document.write(bnft.parse("ABCD"));

*/

  BNFT.noConflict = function () {
    root.mymodule = previous_BNFT;
    return BNFT;
  };

  if (typeof exports !== "undefined") {
    if (typeof module !== "undefined" && module.exports) {
      exports = module.exports = BNFT;
    }
    exports.BNFT = BNFT;
  } else {
    root.BNFT = BNFT;
  }
  
}).call(this);
