# json Changelog

## json v1.3.0

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
    
        '*' 'name,version'
        '*.name|version'
        '*.{name|version}'      # glob syntax? is this right?

- Add '-x|--experimental' option to turn on incomplete/experimental features.


## json v1.2.1

- [issue #12] Fix handling of output when result of lookup is `undefined`.


## json v1.2.0

- [issue #10] Fix for node v0.5.


## json v1.1.9

- [Issue 8] Don't emit a newline for empty output.


## json v1.1.8

- [Issue 7] Handle "HTTP/1.1 100 Continue" leading header block.
- [Issue 4] Add a man page (using ronnjs).


## json v1.1.7

- [Issue 5] Fix getting a key with a period. E.g.:

        echo '{"foo.bar": 42}' | json '["foo.bar"]'

  `json` is now doing much better lookup string parsing. Because escapes are
  now handled properly you can do the equivalent a little more easily:
  
        $ echo '{"foo.bar": 42}' | json foo\\.bar
        42


## json v1.1.6

- [Issue 6] Error exit value if invalid JSON.


## json v1.1.4

- [Issue 2] Fix bracket notation: `echo '{"foo-bar": "baz"}' | json '["foo-bar"]'`


(Started maintaining this log 19 March 2011. For earlier change information
you'll have to dig into the commit history.)
