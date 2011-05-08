- finish '*' handling
- The JSON syntax error sucks because it doesn't show where in the document the syntax error is. Sometimes it is hard to find.

        json: error: doesn't look like JSON: SyntaxError: Unexpected token { (buffer="{...

  Compare to Python's json module:

        ValueError: Expecting : delimiter: line 7 column 18 (char 216)

  Is the error location on the JSON exception object?
