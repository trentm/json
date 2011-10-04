# json (aka jsontool) Changelog

## json 2.0.0 (not yet released)

- Add '--' option processing support and error out if an unknown option is
  given.
- Support multiple top-level JSON objects as input to mean a list of
  these object:
  
    $ echo '{"one": 1}
    {"two": 1}' | ./lib/jsontool.js
    [
      {
        "one": 1
      },
      {
        "two": 1
      }
    ]
    
  This can be nice to process a stream of JSON objects generated from
  multiple calls to another tool or `cat *.json | json`. Rules:
    
  - Only JS objects and arrays. Don't see strong need for basic
    JS types right now and this limitation simplifies.
  - The break between JS objects has to include a newline. I.e. good:

       {"one": 1}
       {"two": 2}

    bad:

       {"one": 1}{"two": 2}

    This condition should be fine for typical use cases and ensures
    no false matches inside JS strings.


## json 1.4.1

- [issue #9] Gracefully handle EPIPE (i.e. stdout being closed on json before
  it is finished writing).


## json 1.4.0

- [issue #19] Allow multiple lookup arguments:

        $ echo '{"one": 1, "two": 2}' | json one two
        1
        2

  WARNING: This involve a backward incompatible change in the JS APIs
  `jsontool.processDatum` and `jsontool.processDatumExperimental`.


## json 1.3.4

- [issue #18] Fix `json --version` for standalone mode again (was broken in json 1.3.3).


## json 1.3.3

- WARNING: `json --version` is broken when running outside the source (or npm
  install'd) tree. I.e. this is a bad release for standalone.
- [issue #17] Ensure stdout is flushed on exit.


## json 1.3.2

- [issue #16] Fix to use `<regex object>.exec` instead of using the regex
  object as a function -- no longer allowed in the v8 used in node v0.5.x.


## json 1.3.1

- Make "jsontool" require'able as a module. For example, you can now:

        $ npm install jsontool
        $ node
        > var jsontool = require('jsontool')
        > jsontool.parseLookup('a.b.c')
        [ 'a', 'b', 'c' ]
        > jsontool.parseLookup('my-key.0["bar"]')
        [ 'my-key', '0', '["bar"]' ]
        > jsontool.main(['', '', '--help'])
        Usage: <something generating JSON on stdout> | json [options] [lookup]
        ...

  Currently other exported API is experimental and will likely change to be
  more generally useful (e.g. the current `processDatum` isn't all handy
  for module usage).

  Note: For command-line usage, the main module has moved from "json" to
  "lib/jsontool.js". So, if you are not using npm, you can setup the `json`
  command via something like:
  
        alias json='.../json/lib/jsontool.js'


## json 1.3.0

- package.json and publish to npm as "jsontool" ("json" name is taken)
- Add experimental support for '*' in the lookup. This will extract all
  the elements of an array. Examples:
        
        $ echo '["a", "b", "c"]' | json -x '*'
        a
        b
        c
        $ echo '[{"one": "un"}, {"two": "deux"}]' | json -x '*'
        {
          "one": "un"
        }
        {
          "two": "deux"
        }
        $ echo '[{"foo": "bar"}, {"foo": "baz"}]' | json -x '*.foo'
        bar
        baz
  
  This is still experimental because I want to feel it out (is it useful?
  does it cause problems for regular usage?) and it is incomplete. The
  second example above shows that with '\*', json can emit multiple JSON
  documents. `json` needs to change to support *accepting* multiple JSON
  documents.
  
  Also, a limitation: How to extract *multiple* fields from a list of
  objects? Is this even a necessary feature? Thinking out loud:
    
        '*.{name,version}'      # a la bash. Josh likes it. What else do you need?

- Add '-x|--experimental' option to turn on incomplete/experimental features.


## json 1.2.1

- [issue #12] Fix handling of output when result of lookup is `undefined`.


## json 1.2.0

- [issue #10] Fix for node v0.5.


## json 1.1.9

- [Issue 8] Don't emit a newline for empty output.


## json 1.1.8

- [Issue 7] Handle "HTTP/1.1 100 Continue" leading header block.
- [Issue 4] Add a man page (using ronnjs).


## json 1.1.7

- [Issue 5] Fix getting a key with a period. E.g.:

        echo '{"foo.bar": 42}' | json '["foo.bar"]'

  `json` is now doing much better lookup string parsing. Because escapes are
  now handled properly you can do the equivalent a little more easily:
  
        $ echo '{"foo.bar": 42}' | json foo\\.bar
        42


## json 1.1.6

- [Issue 6] Error exit value if invalid JSON.


## json 1.1.4

- [Issue 2] Fix bracket notation: `echo '{"foo-bar": "baz"}' | json '["foo-bar"]'`


(Started maintaining this log 19 March 2011. For earlier change information
you'll have to dig into the commit history.)
