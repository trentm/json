# current

- update README man page for -x, -d, -a changes
- -v|--verbose option that'll include warnings: first warning is that a
  lookup bit that is '*' and '-x' was used -> obsolete warning

  

# top

- npm/lib/utils/minimatch.js: fnmatch/glob implementation.
  Use that for more generic "*.foo" or "*.{foo,bar}" matching. Says Isaac: "it'd be cool :)".
    https://github.com/isaacs/npm/blob/master/lib/utils/minimatch.js
  Note: probably not using minimatch here. Just * ? [RANGE] and {CHOICES} support.
  Not sure of real value of "**" support.
- edit support:
    $ json -e foo=bar
    {
      "foo": "bar"
    }
    $ echo '{"foo": "bar"}' | json -e foo=baz
    {
      "foo": "baz"
    }
  jsawk is especially nice (https://github.com/micha/jsawk)
  Jsawk-y version here would be:
    $ echo '{"foo": "bar"}' | json -e 'this.foo="baz"'
    {
      "foo": "baz"
    }

  Think about conditionals as well. There is json-command
  (https://github.com/zpoley/json-command) but I'm having difficulty groking
  that.
    
        -c "js conditional"   js conditional to be run in the context of each object that determines whether an object is printed
    
        -C                    print the output fields as tab delimited columns in the order specified by fields
    
        -e "js expression"    execute arbitrary js in the context of each object.


    Yup that works:
    
        
        $ echo '{"foo": "bar"}' | json -e 'this.foo="baz"'
        {
          "foo": "baz"
        }
        $ echo '{"age": 38}' | json -e 'this.age++'
        {
          "age": 39
        }
        $ echo '{"age": 38}' | json -c 'this.age > 30'
        {
          "age": 38
        }
        $ echo '[{"age":38}, {"age":21}]' | json -c 'this.age > 30'
        {
          "age": 38
        }
        # or this (???):
        [
          {
            "age": 38
          }
        ]


- The JSON syntax error sucks because it doesn't show where in the document the syntax error is. Sometimes it is hard to find.

        json: error: doesn't look like JSON: SyntaxError: Unexpected token { (buffer="{...

  Compare to Python's json module:

        ValueError: Expecting : delimiter: line 7 column 18 (char 216)

  Is the error location on the JSON exception object? Don't think so.
  Consider using: https://github.com/jesusabdullah/json-san or the equivalent use of jshint
  for better error reporting.

