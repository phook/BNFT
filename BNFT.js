BNFT = function(source)
{	
	// SIGNIFICANT WHITESPACE VARIABLES
	this.outputblockbegin = "";
	this.outputblockend = "";

	this.Tokenizer = function(source) // CLASS Tokenizer
	{
		this.source = source;
		this.position = 0; // current position (or current peekposition if peeking)
		
		this.peekPosition = new Array(); // for storing current position when peeking
		this.indents = new Array(); // for indents - significant whitespace

		this.endOfScript = function() // tests for end of script
		{
			return this.position >= source.length;
		}
		
		this.nextChar = function() // returns next char and advances position
		{
			var result = this.currentChar();
			this.next();
			return result;
		}
		
		this.next = function() // advances position
		{
			this.position += 1;
		}
		
		this.currentChar = function() // returns current char
		{
			if (this.position >= this.source.length)
				return "";
			return this.source.substring(this.position,this.position + 1);
		}
		
		this.peeking = function() // tests for peeking
		{
			return this.peekPosition.length != 0;
		}
		
		this.peek = function() // enters peeking
		{
			this.peekPosition.push(this.position);
		}		
		
		this.unPeek = function() // exits 1 level of peeking
		{
			if (this.peeking())
				this.position = this.peekPosition.pop();
		}
		
		this.nextIs = function(s,caseSensitive) // checks for next token to be s and advances position
		{
			if (typeof(caseSensitive) == "undefined")
				caseSensitive = true;
			if (this.peekNextIs(s,caseSensitive))
			{
				this.position += s.length;
				return true;
			}
			return false;
		}
		
		this.peekNextIs = function(s, caseSensitive) // checks for next token to be s
		{
			if (typeof(caseSensitive) == "undefined")
				caseSensitive = true;
			
			if (this.position + s.length > this.source.length)
				return false;
			
			var match = this.source.substring(this.position,this.position + s.length);
			
			if (caseSensitive)
				return match == s;
			
			return match.toLowerCase() == s.toLowerCase();						
		}
		
		this.insertFrom = function(mark,stringToInsert) // inserts a string at mark
		{
			this.source = source.substring(0,mark) + stringToInsert + "\n" + source.substring(this.position);
			this.position = mark;
		} 		
	}	
	
	this.tokenizer = new this.Tokenizer(source + "\n");

	this.Result = function(identifier,result) // CLASS Result
	{
		this.identifier = identifier;
		this.myresult = result;
		this.next = null;
	
		this.add = function(item)
		{
			if (this.next == null)
				this.next = item;
			else
				this.next.add(item);
		}
	
		this.find = function(identifier,number)
		{
			if (typeof(number) == "undefined")
				number = -1;
			
			if (this.identifier == identifier)
				if (number == 0 || this.net == null)
					return this.myresult;
				else
					return this.myresult + this.next.find(identifier,number--);
					
			if (this.next != null)
				return this.next.find(identifier,number);
				
			return "";
		}
		
		this.result = function()
		{
			if (this.next != null)
				return this.myresult + this.next.result();
			return result;
		}
	}
	
	
	this.Expression = function() // INTERFACE Expression
	{
		this.folded = false;
		this.doparse = function(terminator)
		{
			if (typeof(terminator)=="undefined")
				terminator = null;
			this.parse(terminator);
		}
		this.isOptional = function()
		{
			return false;
		}
		this.isIdentifier = function()
		{
			return null;
		}
		this.fold = function() // fold is optimizing the syntax tree, by removing identifiers
		{
		}
		// parse is an "abstract" function, not specified so errors will occor if decendents dont implement it
		// parse function returns a result object and advances tokenizer if match is found, otherwise it returns null
	}
	
	this.entry = new Array();

	this.Literal = function(owner,literal,caseSensitive) // CLASS Literal
	{
		owner.Expression.call(this); // IMPLEMENT Expression
		
		this.literal = literal;
		this.caseSensitive = caseSensitive;
		this.owner = owner;
	
		this.parse = function(terminator)
		{
			if (this.owner.tokenizer.endOfScript())
				return null;
			if (this.owner.tokenizer.nextIs(this.literal,this.caseSensitive))
				return new this.owner.Result("",this.literal);
			return null;
		}		
	}

	this.Range = function(owner,char1,char2,caseSensitive) // CLASS Range
	{
		owner.Expression.call(this); // IMPLEMENT Expression

		if (char1 < char2)
		{
			this.char1 = char1;
			this.char2 = char2;
		}
		else
		{
			this.char1 = char2;
			this.char2 = char1;
		}
		this.caseSensitive = caseSensitive;
		this.owner = owner;
		
		this.parse = function(terminator)
		{
			if (this.owner.tokenizer.endOfScript())
				return null;
				
			var currentChar = this.owner.tokenizer.currentChar();
			if (caseSensitive)
			{
				if (currentChar >= char1 && currentChar <= char2)
				{
					this.owner.tokenizer.next();
					return new this.owner.Result("",currentChar);
				}
			}
			else
			{
				currentChar = currentChar.toLowerCase();
				if (currentChar >= char1.toLowerCase() && currentChar <= char2.toLowerCase())
				{
					this.owner.tokenizer.next();
					return new this.owner.Result("",currentChar);
				}
			}
			return null;
		}
	}
	
	this.OptionalExpression = function(owner,arg1) // CLASS OptionalExpression
	{
		owner.Expression.call(this); // IMPLEMENT Expression
		this.arg1 = arg1;
		this.owner = owner;
		
		this.isOptional = function()
		{
			return true;
		}
		
		this.fold = function()
		{
			if (this.folded)
				return;
			this.folded = true;
			if (this.arg1.isIdentifier() != null)
				this.arg1 = this.arg1.isIdentifier();
			this.arg1.fold();
		}
		
		this.parse = function(terminator)
		{
			this.owner.tokenizer.peek();
			if (this.arg1.parse(terminator) != null)
			{
				this.owner.tokenizer.unPeek();
				return this.arg1.parse(terminator);
			}
			this.owner.tokenizer.unPeek();
		}
	}

	this.OptionalExpressions = function(owner,arg1) // CLASS OptionalExpressions
	{
		owner.Expression.call(this);
		this.owner = owner;
		this.arg1 = arg1;
		 
		this.fold = function()
		{
			if (this.folded)
				return;
			this.folded = true;
			if (this.arg1.isIdentifier() != null)
				this.arg1 = this.arg1.isIdentifier();
			this.arg1.fold();
		}
		
		this.isOptional = function()
		{
			return true;
		}

		this.parse = function(terminator)
		{
			var result = null;
			while(true)
			{
				this.owner.tokenizer.peek();
				var test = this.arg1.parse(terminator);
				this.owner.tokenizer.unPeek();
				if (test != null)
				{
					if (result == null)
						result = new this.owner.Result("","");
					result.add(this.arg1.parse(terminator));
				}
				else
					return result;
					
				if (terminator != null)
				{
					this.owner.tokenizer.peek();
					if (terminator.parse(null) != null)
					{
						this.owner.tokenizer.unPeek();
						return result;
					}
					this.owner.tokenizer.unPeek();
				}
			}
		}
	}
	
	this.OrExpression = function(owner,nonterminal) // CLASS orExpression
	{
		owner.Expression.call(this);
		this.owner = owner;
		this.arg = new Array();
		this.nonterminal = nonterminal;
		
		if (nonterminal != "")
			owner.entry.push(this);
			
		this.fold = function()
		{
			if (this.folded)
				return;
			this.folded = true;
			for(var i=0; i < this.arg.length; i++)
			{
				var test = this.arg[i].isIdentifier();
				if (test != null)
				{
					this.arg.splice(i,0,test);
					this.arg.splice(i+1,1);
				}
				this.arg[i].fold();
			}
		}		
		
		this.isOptional = function()
		{
			for(var i=0; i < this.arg.length; i++)
			{
				if (this.arg[i].isOptional())
					return true;
			}			
			return false;
		}
		
		this.parse = function(terminator)
		{
			var result = null;
			for(var i=0; i < this.arg.length; i++)
			{
				result = this.arg[i].parse(terminator);
				if (result != null)
					return new this.owner.Result(nonterminal,result.result());
			}
			return null;			
		}
	}

	this.indent = 0;

	this.AndExpression = function(owner) // CLASS AndExpression
	{
		owner.Expression.call(this);
		this.owner = owner;
		this.arg = new Array();
		this.newOutputSpecification = new Array();
		this.indentate = false;
		
		this.isOptional = function()
		{
			for(var i=0; i < this.arg.length; i++)
			{
				if (!this.arg[i].isOptional())
					return false;
			}			
			return true;
		}
		
			
		this.fold = function()
		{
			if (this.folded)
				return;
			this.folded = true;
			for(var i=0; i < this.arg.length; i++)
			{
				var test = this.arg[i].isIdentifier();
				if (test != null)
				{
					this.arg.splice(i,0,test);
					this.arg.splice(i+1,1);
				}
				this.arg[i].fold();
			}
		}	
		
		this.parse = function(terminator)
		{
			var mark = this.owner.tokenizer.position;
			if (this.indentate)
				this.owner.indent++;
			var result = null;
			this.owner.tokenizer.peek();
			var success = true;
			for(var i=0; i < this.arg.length; i++)
			{
				var intermediateResult = null;
				if (!this.arg[i].isOptional())	// non optional elements does not have terminator
					intermediateResult = this.arg[i].parse(null);		
				else
				if (i+1 == this.arg.length) // last element reuses terminator
					intermediateResult = this.arg[i].parse(terminator);
				else
				if (this.arg[i+1].isOptional()) // if next element is optional, find first nonoptional and use it as terminator
				{
					var newTerminator = terminator;
					var j = i+1;
					for(;j<this.arg.length && this.arg[j].isOptional(); j++)
					{
						if (!this.arg[j].isOptional())
						{
							newTerminator = arg[j];
							break;
						}
					}
					intermediateResult = this.arg[i].parse(newTerminator);
				}
				else
					intermediateResult = this.arg[i].parse(this.arg[i+1]);

				if (!this.arg[i].isOptional() && intermediateResult == null)
				{
					this.owner.tokenizer.unPeek();
					success = false;
					i = this.arg.length;
				}					
				else
				if (intermediateResult != null)
				{
					if (result == null)
						result = new this.owner.Result("","");
					result.add(intermediateResult);
				}
			}
			
			if (success && result != null)
			{
				this.owner.tokenizer.peekPosition.pop();
				if (this.newOutputSpecification != null)
				{
					if (this.newOutputSpecification.length > 0)
					{
						var concat = "";
						for(var i=0; i<this.newOutputSpecification.length; i++)
						{
							var localEntry = this.newOutputSpecification[i];
							if (localEntry.length > 0)
							{
								if (localEntry == "#indent")
									for(var j=0; j<indent; j++)
										concat += " ";
								else
								if (localEntry == "#include")
								{
									if (i + 1 < this.newOutputSpecification.length)
									{
										var nextEntry = this.newOutputSpecification[i + 1];
										var fileToInclude = result.find(nextEntry);
										fileToInclude = fileToInclude.replace("\"","");
										fileToInclude = fileToInclude.replace("\'","");
										this.owner.tokenizer.insertFrom(mark,this.owner.fileToString(fileToInclude));
										i = i + 1;
									}
								}
								else
								if (localEntry[0] == '"')
									concat += localEntry.substring(1);
								else
									concat += result.find(localEntry);
							}
						}
						
						result = new this.owner.Result("",concat);
					}
				}
			}
			else
				result = null;
			
			if (this.indentate)
				this.owner.indent--;
				
			return result;
		}	
	}
		
	this.Identifier = function(owner,identifier) // CLASS Identifier
	{
		owner.Expression.call(this);
		this.owner = owner;
		this.identifier = identifier;
		this.passThrough = null;
		
		this.isIdentifier = function()
		{
			if (this.passThrough == null)
			{
				for(var i=0; i<this.owner.entry.length; i++)
					if (this.owner.entry[i].nonterminal == identifier)
					{
						this.passThrough = this.owner.entry[i];
						break;
					}
			}
			return this.passThrough;
		}
		
		this.isOptional = function()
		{
			if (this.isIdentifier() == null)
				return true;
			return this.passThrough.isOptional();
		}

		this.parse = function(terminator)
		{
			var result = null;
			if (this.isIdentifier() != null)
				result = this.passThrough.parse(terminator);

			if (result == null)
			{
				alert("Missing identifier: " + this.identifier); /// REPORT ERRORS?
				return null;
			}

			return result;
			
		}				
	}

	// BNF evaluator starting

	this.lastIndentate = false;
	this.lastValue = 0;
	this.lastChar = "";
	this.lastIdentifier = "";
	this.lastExpression = null;
	this.lastOutput = new Array();
	this.errorPosition = -1;
	this.erroreMessage = "";
	
	this.error = function(error)
	{
		if (!this.tokenizer.peeking() && this.errorPosition == -1)
		{
			this.errorMessage = error;
			this.errorPosition = this.tokenizer.position;
		}
		return false;
	}
	
	this._alpha_char = function()
	{
		var currentChar = this.tokenizer.currentChar().toLowerCase();
		if (currentChar >= "a" && currentChar <= "z")
		{
			this.lastChar = currentChar;
			this.tokenizer.next();
			return true;
		}
		return false;
	}

	this._numeric_char = function()
	{
		var currentChar = this.tokenizer.currentChar();
		if (currentChar >= "0" && currentChar <= "9")
		{
			this.lastChar = currentChar;
			this.lastValue = parseInt(currentChar);
			this.tokenizer.next();
			return true;
		}
		return false;
	}



	this._alphanumeric_char = function()
	{
		if (this._alpha_char())
			return true;
		if (this._numeric_char())
			return true;
		return false;
	}
	
	this._hexadecimal_char = function()
	{
		var currentChar = this.tokenizer.currentChar().toLowerCase();
		if ((currentChar >= "a" && currentChar <= "f") ||
			(currentChar >= "0" && currentChar <= "9"))
		{
			this.lastChar = currentChar;
			this.lastValue = parseInt("0x"+currentChar);
			this.tokenizer.next();
			return true;
		}
		return false;
	}
	
	this._any_char = function()
	{
		this.lastChar = this.tokenizer.nextChar();
	    if (this.lastChar == "\\")
		{
			if (this.tokenizer.currentChar() == "\\")
			{
				this.lastChar = "\\";
				this.tokenizer.next();
				return true;
			}
			if (this.tokenizer.currentChar() == "r")
			{
				this.lastChar = "\r";
				this.tokenizer.next();
				return true;
			}
			if (this.tokenizer.currentChar() == "n")
			{
				this.lastChar = "\n";
				this.tokenizer.next();
				return true;
			}
			if (this.tokenizer.currentChar() == "\"")
			{
				this.lastChar = "\"";
				this.tokenizer.next();
				return true;
			}
			if (this.tokenizer.currentChar() == "'")
			{
				this.lastChar = "'";
				this.tokenizer.next();
				return true;
			}
			if (this.tokenizer.nextIs("0x"))
			{
				var charValue = 0;
				for (var i=0; i<4; i++)
				{
					var result = this._hexadecimal_char();
					if (!result)
						return this.error("hexadecimal char expected");
					charValue = charValue * 16 + this.lastValue;
				}
				this.lastChar = charValue.toString();
				return true;
			}
			return false;
		}			
		else
			return true;
	}
	
	this._whitespace = function()
	{
		if (this.tokenizer.nextIs("\t"))
			return true;
		if (this.tokenizer.nextIs(" "))
			return true;
		return false;
	}

	this._underscore = function()
	{
		if (this.tokenizer.nextIs("_"))
		{
			this.lastChar = "_";
			return true;
		}
		return false;
	}
	
	this._identifier = function()
	{	
		this.lastIdentifier = "";
		if (this._alpha_char())
		{
			this.lastIdentifier = this.lastChar;
			while (this._alphanumeric_char() || this._underscore())
			{
				this.lastIdentifier += this.lastChar;
			}
			this._whitespace();
			return true;
		}
		return this.error("identifier expected");
	}
	
	this._newline = function()
	{
		if (this.tokenizer.nextIs("\r\n"))
			return true;
		if (this.tokenizer.nextIs("\n\r"))
			return true;
		if (this.tokenizer.nextIs("\r"))
			return true;
		if (this.tokenizer.nextIs("\n"))
			return true;
		if (this.tokenizer.nextIs(";"))
			return true;
		return false;
	}

	this._isnextnewline = function()
	{
		this.tokenizer.peek();
		var result = this._newline();
		this.tokenizer.unPeek();
		return result;
	}
	
	this._nextline = function()
	{
		while (this._whitespace())
		{
		}
		
		var result = this._newline();

		while (this._whitespace())
		{
		}		
		
		return result;
	}

	this._advanceline = function()
	{
		var result = false;
		while (this._nextline())
		{
			result = true;
		}
		return result;
	}
	
	this._finished_definition = function()
	{
		this.tokenizer.peek();
		if (this._definition())
		{
			this.tokenizer.unPeek();
			this._definition();
			return true;
		}
		this.tokenizer.unPeek();
		return false;
	}
	
	this._entry = function()
	{
		if (this._identifier())
		{
			var localEntry = new this.OrExpression(this,this.lastIdentifier);
			if (this.tokenizer.nextIs(":"))
			{
				if (!this._nextline())
					return false;
				if (!this._definition())
					return false;
				
				if (this.lastExpression != null)
					localEntry.arg.push(this.lastExpression);
				
				this.lastExpression = null;
				
				while (this._finished_definition())
				{
					if (this.lastExpression != null)
						localEntry.arg.push(this.lastExpression);
				}
				if (!this.tokenizer.peeking())
					this.lastExpression = localEntry;
				return true;
			}
			if (this.tokenizer.nextIs("="))
			{
				if (!this._definition())
					return false;
				if (this.lastExpression != null)
					localEntry.arg.push(this.lastExpression);
				if (!this.tokenizer.peeking())
					this.lastExpression = localEntry;
				return true;
			}
		}
		return this.error(": or = expected");
	}
	
	this._script = function()
	{
		var mark = this.tokenizer.position;
		if (this.tokenizer.nextIs("#include"))
		{
			if (!this.tokenizer.nextIs(" "))
				return false;
				
			while (this._whitespace())
			{
			}
			
			if (!this._output_literal())
				return false;	
			
			if (!this._advanceline())
				return false;

			this.tokenizer.insertFrom(mark,this.fileToString(this.lastIdentifier));
						
		}
		else
		if (this.tokenizer.nextIs("#significantwhitespace"))
		{
			if (!this.tokenizer.nextIs(" "))
				return false;
				
			while (this._whitespace())
			{
			}

			if (!this._output_literal())
				return this.error("string literal expected");;	

			this.outputblockbegin = this.lastidentifer;

			if (!this._output_literal())
				return this.error("string literal expected");	

			this.outputblockend = this.lastidentifer;

			if (!this._advanceline())
				return false;
				
			this.significantwhitespace = true;
		}
		else
		if (this.tokenizer.nextIs("#"))
		{
			while (!this._isnextnewline() && !this.tokenizer.endOfScript())
				this.tokenizer.next();
				
			if (!this._advanceline())
				return false;
		}
		else
		if (!this._entry())
			return this.tokenizer.endOfScript();
		return this._script();
	}
	
	this._literal = function() 
	{	
		var literalEnclosing = this.tokenizer.currentChar();
		if (literalEnclosing != "\"" && literalEnclosing != "'")
			return false;
		this.tokenizer.next();
		var literal = "";
		var enter = this.tokenizer.currentChar() == "\\";
		this._any_char();
		while (this.lastChar != literalEnclosing || enter)
		{
			literal += this.lastChar;
			enter = this.tokenizer.currentChar() == "\\";
			this._any_char();
		}
		if (this.lastChar != literalEnclosing)
			return this.error(literalEnclosing + " expected");
		while (this._whitespace())
		{
		}
		
		this.lastIdentifier = literal;
		
		if (this.tokenizer.nextIs(".."))
		{
			while (this._whitespace())
			{
			}
			if (!this.tokenizer.nextIs(literalEnclosing))
				return this.error(literalEnclosing + " expected");
			var secondLiteral = "";
			enter = this.tokenizer.currentChar() == "\\";
			this._any_char();
			while (this.lastChar != literalEnclosing || enter)
			{
				secondLiteral += this.lastChar;
				enter = this.tokenizer.currentChar() == "\\";
				this._any_char();
			}
			if (this.lastChar != literalEnclosing)
				return error(literalEnclosing + " expected");
			
			if (!this.tokenizer.peeking())
				this.lastExpression = new this.Range(this,literal,secondLiteral, literalEnclosing == "\"");
			return true;
		}
		
		if (!this.tokenizer.peeking())
			this.lastExpression = new this.Literal(this,literal, literalEnclosing == "\"");
		return true;
	}

	this._output_literal = function()
	{	
		if (!this.tokenizer.nextIs("\""))
			return this.error("\" expected");
		this.lastIdentifier = "";
		var enter = this.tokenizer.currentChar() == "\\";
		this._any_char();
		while (this.lastChar != "\"" || enter)
		{
			this.lastIdentifier += this.lastChar;
			enter = this.tokenizer.currentChar() == "\\";
			this._any_char();
		}
		if (this.lastChar != "\"")
			return this.error("\" expected");
		while (this._whitespace())
		{
		}	
		return true;
	}
	
	this._definition = function()
	{	
		while (this._whitespace())
		{
		}
			
		if (!this._expression())
			return false;
		
		var result = this._advanceline();
		
		if (this.tokenizer.nextIs("->"))
		{					
			this._advanceline();

			this.lastIndentate = false;
			this.lastOutput = new Array();
			var exp = this.lastExpression;
			
			this._output();

			if (!this.tokenizer.peeking())
			{
				this.lastExpression = new this.AndExpression(this);			
				this.lastExpression.newOutputSpecification = this.lastOutput;
				this.lastExpression.arg.push(exp);
				this.lastExpression.indentate = this.lastIndentate;
			}
			
			if (!this._advanceline())
				return this.error("newline expected");

			result = true;
		}

		if (!result)
			return this.error("newline expected");
		
		return true;
	}
	
	this._item = function()
	{
		if (this._literal())
			return true;
		else
			if (this._identifier())
			{		
				if (!this.tokenizer.peeking())
					this.lastExpression = new this.Identifier(this,this.lastIdentifier);
				return true;
			}
			else
				if (this.tokenizer.nextIs("{"))
				{						
					this._expression();
					
					if (!this.tokenizer.peeking())
						this.lastExpression = new this.OptionalExpressions(this,this.lastExpression);

					if (!this.tokenizer.nextIs("}"))
						return this.error(") expected");
					
					return true;
				}
				else
					if (this.tokenizer.nextIs("["))
					{
						this._expression();
														
						if (!this.tokenizer.peeking())
							this.lastExpression = new this.OptionalExpression(this,this.lastExpression);

						if (!this.tokenizer.nextIs("]"))
							return this.error("] expected");
						
						return true;
					}
					else
						if (this.tokenizer.nextIs("("))
						{
							this._expression();

							if (!this.tokenizer.nextIs(")"))
								return this.error("} expected");
							
							return true;
						}
		return false;
	}
	
	this._or_expression = function()
	{
		var orExpression = null;
		
		if (!this._item())
			return false;

		while (this._whitespace());
		
		
		while (this.tokenizer.nextIs("|"))
		{
			if (orExpression == null && this.lastExpression != null)
			{
				orExpression = new this.OrExpression(this,"");
				orExpression.arg.push(this.lastExpression);
			}

			while (this._whitespace())
			{
			}
			
			this._item();

			while (this._whitespace())
			{
			}

			if (orExpression != null && this.lastExpression != null)
				orExpression.arg.push(this.lastExpression);
		}

		if (orExpression != null && !this.tokenizer.peeking())
			this.lastExpression = orExpression;
				
		return true;
	}

	this._expression = function()
	{
		while (this._whitespace())
		{
		}

		var andExpression = null;
		
		if (!this._or_expression())
			return false;
		
		while (this._whitespace())
		{
		}
		
		this.tokenizer.peek();
		while (this._or_expression())
		{
			this.tokenizer.unPeek();

			if (andExpression == null && !this.tokenizer.peeking() && this.lastExpression != null)
			{
				andExpression = new this.AndExpression(this);
				andExpression.arg.push(this.lastExpression);
			}
			
			this._or_expression();

			if (andExpression != null && this.lastExpression != null)
				andExpression.arg.push(this.lastExpression);
						
			while (this._whitespace())
			{
			}
			
			this.tokenizer.peek();
		}
		this.tokenizer.unPeek();

		if (andExpression != null && !this.tokenizer.peeking())
			this.lastExpression = andExpression;
				
		return true;
	}
	
	this._output = function()
	{
		while (this._whitespace())
		{
		}
		
		if (this.tokenizer.nextIs("#block"))
		{
			this.lastIndentate = true;
			this._output();
			return true;		
		}
		else
		if (this.tokenizer.nextIs("#indent"))
		{
			this.lastOutput.push("#indent");
			this._output();
			return true;		
		}
		else
		if (this.tokenizer.nextIs("#include"))
		{
			this.lastOutput.push("#include");
			this._output();
			return true;		
		}
		else
		if (this._output_literal())
		{
			this.lastOutput.push("\"" + this.lastIdentifier);
			this._output();
			return true;
		}
		else
		if (this._identifier())
		{					
			this.lastOutput.push(this.lastIdentifier);
			this._output();
			return true;
        }
		return this.error("output definition expected");
	}
	
	
	
	this.errorFormatting = function(message) 
	{
		message += "\n";
		var source;
		if (this.errorPosition == -1)
		{
			this.errorPosition = this.tokenizer.position;
			this.errorMessage = "Unknown error";
		}
		source = this.tokenizer.source;
		var pos1 = this.errorPosition;
		while (pos1 > 0 && source[pos1] != '\n')
			pos1--;
		var pos2 = this.errorPosition;
		while (pos2 < source.length && source[pos2] != '\n')
			pos2++;
		message += source.substring(pos1,pos2);
		message += "\n";
		while (this.errorPosition-- != pos1)
			message += " ";
		message +="^\n" + this.errorMessage;
		return message;
	}

	this.parse = function(source)
	{
		if (!this._script())
		{
			alert(this.errorFormatting("BNFT Source parse fail")); // ERROR REPORTING
			return "ERROR";
		}
		else
		{
			this.tokenizer = new this.Tokenizer(source);
			if (this.lastExpression != null)
			{
				this.errorPosition = -1;
				this.lastExpression.fold();
				var result = this.lastExpression.parse(); 
				if (result != null)
					return result.result();
				
				alert(this.errorFormatting("BNFT parse fail"));
				return "ERROR";
			}
			alert(this.errorFormatting("BNFT parse fail"));
			return "ERROR";
		}
		return "";
	}
	

	this.fileToString = function(filePath)
	{
		/* some xmlhttp magic
		try
		{
	
			StringBuffer fileData = new StringBuffer(1000);
	        BufferedReader reader;
			if (filePath.equals("#in"))
				reader = new BufferedReader(new InputStreamReader(System.in));
			else
	        	reader = new BufferedReader(new FileReader(filePath));
	        char[] buf = new char[1024];
	        int numRead=0;
	        while((numRead=reader.read(buf)) != -1){
	            String readData = String.valueOf(buf, 0, numRead);
	            fileData.append(readData);
	            buf = new char[1024];
	        }
	        reader.close();
	        return fileData.toString();
	    }
		catch (Exception e)
		{
			System.err.println(filePath + " caused an error");
			java.lang.Runtime.getRuntime().exit(0);
			return "";
		}
		*/
	}

	this.stringToFile = function(filePath,string)
	{
		/* more magic
		try
		{
		    BufferedWriter out;
		    if (filePath.equals("#out")) 
			    out = new BufferedWriter(new OutputStreamWriter(System.out));
		    else
		    	out = new BufferedWriter(new FileWriter(filePath));
		    out.write(string);
		    out.close();
	    }
		catch (Exception e)
		{
			System.err.println(filePath + " caused an error");
			java.lang.Runtime.getRuntime().exit(0);
		}
		*/
	}
	
	this.significantWhitespace = function(source,blockbegin,blockend,noindents)
	{
		this.noindents = noindents;
		var indents = function(size)
		{
			if (noindents)
				return "";
			var result="";
			for(var i=0; i<size; i++)
				result += " ";
			return result;
		}
		var newsource = "";
		var lastchr = "";
		var spaces = 0;
		var indent = false;
		var insertBlockBegin = false;
		var currentlevel = [0];
		for(var i=0; i<source.length; i++)
		{
			var chr = source[i];
			if (chr == " ")
			{
				if (indent)
					spaces +=1;
				else
					newsource += chr;
			}
			else
			if (chr == "\r" || chr == "\n")
			{
				newsource += chr;
				indent = true;
				spaces = 0;
			}
			else
			{
				if (indent)
				{
					if (spaces != currentlevel[currentlevel.length-1])
					{
						if (spaces > currentlevel[currentlevel.length-1])
						{
							newsource += indents(currentlevel[currentlevel.length-1])
							newsource += blockbegin;
							newsource += indents(spaces);
							currentlevel.push(spaces);
							insertBlockBegin = true;
						}
						else
						{
							while (spaces < currentlevel[currentlevel.length-1])
							{
								currentlevel.pop()
								newsource += indents(currentlevel[currentlevel.length-1]) + blockend;
							}
							newsource += indents(currentlevel[currentlevel.length-1]);
						}
					}
					else
						newsource += indents(spaces);
				}
				indent = false;
				newsource += chr;
			}
			lastchr = chr;
		}
		while (0 < currentlevel[currentlevel.length-1])
		{
			currentlevel.pop()
			newsource += indents(currentlevel[currentlevel.length-1]) + blockend;
		}
		return newsource;
	}
	
	
	
/* how it is used
	public static void main(String[] args) {
		
		String BNFTFile = "";
		String inputFile = "#in";
		String outputFile = "#out";
		boolean showHelp = false; 
		int i=0;
		while (i < args.length)
		{
			if (i + 1 < args.length)
			{
				if (args[i].equals("-i")) {i++; inputFile = args[i];} else
					if (args[i].equals("-o")) {i++; outputFile = args[i];} else
						if (args[i].equals("-h")) showHelp=true; else
							BNFTFile = args[i];
			}
			else
				if (args[i].equals("-h")) showHelp=true; else
					BNFTFile = args[i];
			i++;
		}
			
		if (BNFTFile.equals("") || showHelp)
		{
			System.out.println("BNFT <BNFTfile> <-i inputfile> <-o ouputfile> <-h>");
			System.out.println("Example:");
			System.out.println("BNFT Example.BNFT -i source.src -o transformed.out");
			System.out.println("-i, -o will use stdin/stdout if not specified");
			return;
		}
		
		BNFT bnft = new BNFT(fileToString(BNFTFile));
		
		stringToFile(outputFile,bnft.parse(fileToString(inputFile)));
	}
*/
}

/* SIMPLE TEST

var bnft = new BNFT('allcharacters = \'A\'..\'Z\'->"!"\nfoo={allcharacters}');
document.write(bnft.parse("ABCD"));

*/