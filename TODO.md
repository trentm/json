# todos

- update man page
- pick off extra intended json 3 features:
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
  - Support a negative index into an array:
        $ echo '["a","b","c"]' | jsondev -- -1    # ditto `json '[-1]'`
        c
  - Support slice indexing into an array:
        $ echo '["a","b","c"]' | jsondev '[1:]'
        ["b", "c"]
  - Add -k|--keys to extract the keys:
        echo '{"name":"trent", "age":38}' | jsondev -k
        ["name", "age"]
    Would -v|--values be useful?
        echo '{"name":"trent", "age":38}' | jsondev -v
        ["trent", 38]
  - Add '-s' (or '-S'?) option for 'starting point' in the given JSON doc.
    The use case is that you care about a subfield of an object and want to
    do array processing on it
        echo '{"errors":[{"code":42,"msg":"boom"},{"code":3,"msg":"hi"}]}' | jsondev -s errors -a code msg
        42 boom
        3 hi
  - '-f' arg to take a file to process
  - '-C CODE' to exclude the matching items?
- Add man page to platform



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


# json 3 planning

Thinking out loud in this section.

This behaviour cannot change:

    $ echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -a name age
    trent 38
    ewan 4
    $ echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -a name
    trent
    ewan

Perhaps:

    $ echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -a name -j
    [{"name": "trent"},
     {"name": "ewan"}]

What it should have been (i.e. `-t` for tabular output):

    $ echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -a name
    [{"name": "trent"},
     {"name": "ewan"}]

    $ echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -at name
    trent
    ewan

*Maybe* it should have been that. Maybe *not* because '-a' is a handy, '-at'
is more cumbersome (and less discoverable). IOW, perhaps DWIM is justified
here.

I like the "perhaps" above, i.e. that you have to be in 'jsony' output mode
(we could change the name to shell or flat or schizo :) for tabular output
and that with '-j' it is always valid JSON output.

So:

    #CHANGE
    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -j -a name
    [{"name": "trent"},
     {"name": "ewan"}]

    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -a name
    trent
    ewan

    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -aj
    {
      "name": "trent",
      "age": 38
    }
    {
      "name": "ewan",
      "age": 4
    }

    #CHANGE: Basically '-a' is becoming a *hint* for processing (lookup, exe, cond)
    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -aj
    [
      {
        "name": "trent",
        "age": 38
      },
      {
        "name": "ewan",
        "age": 4
      }
    ]

    # If proposing cond auto '-a's for array input, should lookup and exe do
    # as well? Can't b/c that would break this:
    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev 0
    {
      "name": "trent",
      "age": 38
    }

    # Can we still get away with it for '-e' and '-c'? It means this:
    #NEW
    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -e 'age++'
    [{"name":"trent", "age":39}, {"name":"ewan", "age":5}]
    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -c 'age>30'
    {"name":"trent", "age":38}

    # vs. this (a bit frustrating):
    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -e 'this.age++'  # no-op
    [{"name":"trent", "age":38}, {"name":"ewan", "age":4}]

    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -e 'age++'  # error
    ...
    ReferenceError: age is not defined

    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -e 'age++' -a # non-JSON output
    {"name":"trent", "age":38}
    {"name":"ewan", "age":4}

    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -e 'age++' -a | jsondev
    [{"name":"trent", "age":39}, {"name":"ewan", "age":5}]

    #NEW: or at best
    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -e 'age++' -aj
    [{"name":"trent", "age":39}, {"name":"ewan", "age":5}]

I think we can get away with it. This means that lookup requires explicit -a
to work on array items (required for backward compat). However, '-e' and
'-c' will automatically switch to "array processing" if input is an array.

What about '-e' or '-c' when *want* to treat array as one unit? Use '-A'
to force "treat array as a single object".

    echo '["a","b","c"]' | jsondev -A -e 'this[3]="d"'
    ["a","b","c","d"]

    echo '["a","b","c"]' | jsondev -e 'this[3]="d"'   # isn't meaningful
    ["a","b","c","d"]

    #XXX Separate change for this.
    #CHANGE: An aside: we could DWIM this last so that if 'datum' for
    # '-e' is a simple type (not object or array), then s/this/var/ and
    # make 'var=item' the context? This gives possibility to:
    echo '["a","b","c"]' | jsondev -A -e 'this=this+this'
    ["aa","bb","cc"]


# Still fuzzy on '-j -a field'

    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -j -a name   # json
    [{"name": "trent"}, {"name": "ewan"}]  # yes
    # OR
    ["trent", "ewan"]
    [["trent"], ["ewan"]]

    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -j -a name age
    # One of:
    [{"name":"trent", "age":38}, {"name":"ewan", "age":4}]   # yes. useful? for '-e' and '-c' usage, yes
    ["trent", 38, "ewan", 4]  # no
    [["trent", 38], ["ewan", 4]]  # awkward?

    echo '[{"name":{"first":"trent","last":"mick"}, "age":38}]' | jsondev -j -a name.first   # json
    [{"name": {"first": "trent"}}]
    ["trent"]
    [["trent"]]
    [{"name.first": "trent"}]   # yes

So '-a' processing first builds the table: array of row items, each is
an object with `{<lookup-string>: <lookup-result>}`. Then passes that
table to output. If in "table" output mode (or just in 'jsony'???), then
output as currently. Else output as normal: JSON, inspect, whatever.

How should this change then too?

    # json2
    $ echo '{"name":"trent", "age":38}' | jsondev name age
    trent
    38
    $ echo '{"name":"trent", "age":38}' | jsondev name age -j
    "trent"
    38

    # json3: Can't break this from json2
    $ echo '{"name":"trent", "age":38}' | jsondev name age
    trent
    38

    #CHANGE XXX add to json3 test
    $ echo '{"name":"trent", "age":38, "lang": "english"}' | jsondev name age -j
    {"name":"trent", "age":38}

    # Essentially then, '-kv' is the default (emit whole item).
    # XXX add to json3 test when implemented
    $ echo '{"name":"trent", "age":38, "lang": "english"}' | jsondev name age -j -k
    ["name", "age"]
    $ echo '{"name":"trent", "age":38, "lang": "english"}' | jsondev name age -j -v
    ["trent", 38]
