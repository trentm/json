# json Changelog

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
