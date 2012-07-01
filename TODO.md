
# someday/maybe

- fix this in man page (ronn fix?):

        Index: /Users/trentm/tm/json/docs/json.1
        index 45f625f..7230bc5 100644
        --- a/docs/json.1
        +++ b/docs/json.1
        @@ -407,7 +407,7 @@ $ curl \-s http://github\.com/api/v2/json/repos/search/nodejs | json repositorie
             "created_at": "2009/06/26 11:56:01 \-0700",
             "pushed": "2011/09/28 10:27:26 \-0700",
             "forks": 345,
        -\.\.\.
        +\&\.\.\.
         .
         .fi
         .

  Tips from mdocml.

- json5.org support?

- jsontool.org?

-     This tool takes 2 json files and print out a merged version of the files
    with the right hand side file taking precedence (see impl in usb-headnode)

        ./json-merge left.json right.json

- '-f' arg to take a file to process

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

- Would -v|--values be useful?
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
