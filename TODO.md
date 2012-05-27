# node-master diff

    $ nodemaster    # build in node "master"
    > a = ['a', 'b', 'c', 'd']
    [ 'a', 'b', 'c', 'd' ]
    > var vm = require('vm')
    undefined
    > vm.runInNewContext('this[4]="e"', a);
    'e'
    > a
    [ 'a', 'b', 'c', 'd' ]

    $ node6       # node v0.6.11
    > var vm = require('vm')
    undefined
    > a = ["a", 'b', 'c', 'd']
    [ 'a', 'b', 'c', 'd' ]
    > vm.runInNewContext('this[4]="e"', a);
    'e'
    > a
    [ 'a',
      'b',
      'c',
      'd',
      'e' ]

TODO: implement the "var" DWIM below to see if can avoid this. Yup, works fine:

    $ nodemaster
    > a = ['a', 'b', 'c', 'd']
    [ 'a', 'b', 'c', 'd' ]
    > var vm = require('vm')
    undefined
    > sandbox = {_VAR: a};
    { _VAR: [ 'a', 'b', 'c', 'd' ] }
    > vm.runInNewContext('_VAR[4] = "e"', sandbox, 'foo.vm');
    'e'
    > a
    [ 'a',
      'b',
      'c',
      'd',
      'e' ]


# someday/maybe

- '-f' arg to take a file to process

- Support a negative index into an array:
      $ echo '["a","b","c"]' | jsondev -- -1    # ditto `json '[-1]'`
      c

- Support slice indexing into an array:
      $ echo '["a","b","c"]' | jsondev '[1:]'
      ["b", "c"]

- DWIM `this` in '-e' and '-c' code when the datum is a simple type.
  Basically s/this/var/ and make 'var=item' the context? This gives
  possibility to:
      $ echo '["a","b","c"]' | jsondev -e 'this+=this'
      ["aa","bb","cc"]
      $ echo '["a","b","c"]' | jsondev -A -e 'this[3]="d"'
      ["a","b","c","d"]

- DWIM the same so this works:
      $ echo '["a", "b"]' | node6 ../lib/jsontool.js -e 'this.push("c")'

      /Users/trentm/tm/json/lib/jsontool.js:678
              vm.runInNewContext(code, datum);
                 ^
      TypeError: Object #<error> has no method 'push'

- Add -k|--keys to extract the keys:
        echo '{"name":"trent", "age":38}' | jsondev -k
        ["name", "age"]
  Would -v|--values be useful?
        echo '{"name":"trent", "age":38}' | jsondev -v
        ["trent", 38]
  Essentially then, '-kv' is the default (emit whole item).
        $ echo '{"name":"trent", "age":38, "lang": "english"}' | jsondev name age -j -k
        ["name", "age"]
        $ echo '{"name":"trent", "age":38, "lang": "english"}' | jsondev name age -j -v
        ["trent", 38]

- Add '-s' (or '-S'?) option for 'starting point' in the given JSON doc.
  The use case is that you care about a subfield of an object and want to
  do array processing on it
      echo '{"errors":[{"code":42,"msg":"boom"},{"code":3,"msg":"hi"}]}' | jsondev -s errors -a code msg
      42 boom
      3 hi
