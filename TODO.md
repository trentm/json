- make testall: need a version of nodeunit that doesn't use "require.paths": no longer in v0.5
- npm/lib/utils/minimatch.js: fnmatch/glob implementation.
  Use that for more generic "*.foo" or "*.{foo,bar}" matching. Says Isaac: "it'd be cool :)".
    https://github.com/isaacs/npm/blob/master/lib/utils/minimatch.js
- finish '*' handling: support input of multiple json docs (see changelog entry for '*')
- The JSON syntax error sucks because it doesn't show where in the document the syntax error is. Sometimes it is hard to find.

        json: error: doesn't look like JSON: SyntaxError: Unexpected token { (buffer="{...

  Compare to Python's json module:

        ValueError: Expecting : delimiter: line 7 column 18 (char 216)

  Is the error location on the JSON exception object?

