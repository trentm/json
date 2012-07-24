A "json" command for working with JSON on the command line. It is a
single-file node.js script with no external deps (other than
[node](https://github.com/joyent/node) itself). Here is a taste:

    $ echo '{"foo":"bar"}' | json
    {
      "foo": "bar"
    }
    $ echo '{"foo":"bar"}' | json foo
    bar

Use it to:

- pretty-print JSON to help read it
- extract particular values (see `LOOKUPS` in usage)
- get details on JSON syntax errors (handy for config files)
- filter input JSON (see `-e` and `-c` options)

Follow <a href="https://twitter.com/intent/user?screen_name=trentmick" target="_blank">@trentmick</a>
for updates to jsontool.

See <http://trentm.com/json> for full docs and many examples.


# Installation

1. Get [node](http://nodejs.org).

2. `npm install -g jsontool`

**OR manually**:

2. Get the 'json' script and put it on your PATH somewhere (it is a single file
   with no external dependencies). For example:

        cd ~/bin
        curl -L https://github.com/trentm/json/raw/master/lib/jsontool.js > json
        chmod 755 json

You should now have "json" on your PATH:

    $ json --version
    json 3.1.2


# Test suite

    make test

You can also limit (somewhat) which tests are run with the `TEST_ONLY` envvar,
e.g.:

    cd test && TEST_ONLY=executable nodeunit test.js

I test against node 0.4, 0.6, 0.7 and (occassionally) node master.


# License

MIT (see the fine LICENSE.txt file).


# Command-Line Usage

    <something generating JSON on stdout> | json [OPTIONS] [LOOKUPS...]
    json -f FILE [OPTIONS] [LOOKUPS...]

See `json --help` output for full details.



# Module Usage

Since v1.3.1 you can use "jsontool" as a node.js module:

    var jsontool = require('jsontool');

However, so far the module API isn't that useful and the CLI is the primary
focus.


# Alternatives you might prefer

- json:select: <http://jsonselect.org/>
- jsonpipe: <https://github.com/dvxhouse/jsonpipe>
- json-command: <https://github.com/zpoley/json-command>
- JSONPath: <http://goessner.net/articles/JsonPath/>, <http://code.google.com/p/jsonpath/wiki/Javascript>
- jsawk: <https://github.com/micha/jsawk>
- jshon: <http://kmkeen.com/jshon/>
