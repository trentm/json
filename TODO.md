# current

- BUG: this doesn't return all content. Need to use a real fix for all stdout flush!
    echo foo bar | xargs -n1 -I{} curl http://github.com/api/v2/json/issues/search/joyent/node/open/{} | bin/json
- also arrayification doesn't work for:
    echo foo bar | xargs -n1 -I{} curl http://github.com/api/v2/json/issues/search/joyent/node/open/{} | bin/json
  Need to consider allowing '}{' on the same line -- despite possible false positive

- update README for 'cat *.json | json' input handling

  

# top

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

