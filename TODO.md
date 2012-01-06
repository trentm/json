# top

- 'make man'? Add to platform?
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
        $ echo '[{"age":38}, {"age": 42}, {"age":21}]' | json -a -c 'this.age > 30'
        {
          "age": 38
        }
        {
          "age": 42
        }


echo '{"foo": "bar"}' | jsondev -e 'this.foo="baz"'
        {
          "foo": "baz"
        }
echo '{"age": 38}' | jsondev -e 'this.age++'
        {
          "age": 39
        }

echo '{"age": 38}' | jsondev -c 'this.age > 30'
        {
          "age": 38
        }
echo '[{"age":38}, {"age": 42}, {"age":21}]' | jsondev -a -c 'this.age > 30'
        {
          "age": 38
        }
        {
          "age": 42
        }


