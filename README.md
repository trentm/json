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

Read on for many more examples.

Follow <a href="https://twitter.com/intent/user?screen_name=trentmick" target="_blank">@trentmick</a>
for updates to jsontool.


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
    json 3.0.0


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

See `json --help` output for full details.



# Learn By Example

Let's use the Github API to look at [node](https://github/joyent/node):

    $ curl -s http://github.com/api/v2/json/repos/show/joyent/node
    {"repository":{"has_wiki":true,"forks":597,"language":"C++","pushed_at":"2011/03/18 15:19:24 -0700","homepage":"http://nodejs.org/","open_issues":271,"fork":false,"has_issues":true,"url":"https://github.com/joyent/node","created_at":"2009/05/27 09:29:46 -0700","size":20984,"private":false,"has_downloads":false,"name":"node","owner":"joyent","organization":"joyent","watchers":5584,"description":"evented I/O for v8 javascript"}}

**Nice output by default**:

    $ curl -s http://github.com/api/v2/json/repos/show/joyent/node | json
    {
      "repository": {
        "has_wiki": true,
        "language": "C++",
        "homepage": "http://nodejs.org/",
        "open_issues": 271,
        "fork": false,
        "has_issues": true,
        "url": "https://github.com/joyent/node",
        "forks": 597,
        "created_at": "2009/05/27 09:29:46 -0700",
        "pushed_at": "2011/03/18 15:19:24 -0700",
        "size": 20984,
        "private": false,
        "has_downloads": false,
        "name": "node",
        "owner": "joyent",
        "organization": "joyent",
        "watchers": 5584,
        "description": "evented I/O for v8 javascript"
      }
    }

Say you just want to **extract one value**:

    $ curl -s https://github.com/api/v2/json/repos/show/joyent/node | json repository.open_issues
    391

If you use `curl -i` to get HTTP headers (because perhaps they contain relevant information), **`json` will skip the HTTP headers automatically**:

    $ curl -is https://github.com/api/v2/json/repos/show/joyent/node | json repository
    HTTP/1.1 200 OK
    Server: nginx/0.7.67
    Date: Fri, 11 Feb 2011 06:45:02 GMT
    Content-Type: application/json; charset=utf-8
    Connection: keep-alive
    Status: 200 OK
    X-RateLimit-Limit: 60
    ETag: "2fcb49428e91d0823acf453b15ccc0b5"
    X-RateLimit-Remaining: 59
    X-Runtime: 13ms
    Content-Length: 398
    Cache-Control: private, max-age=0, must-revalidate

    {
      "forks": 514,
      "has_issues": true,
      "language": "C++",
      "url": "https://github.com/joyent/node",
      "homepage": "http://nodejs.org/",
      "has_downloads": false,
      "watchers": 4753,
      "fork": false,
      "created_at": "2009/05/27 09:29:46 -0700",
      "size": 15316,
      "private": false,
      "has_wiki": true,
      "name": "node",
      "owner": "joyent",
      "pushed_at": "2011/02/10 02:48:07 -0800",
      "description": "evented I/O for v8 javascript",
      "open_issues": 229
    }

Or, say you are stuck with the headers in your pipeline, **`json -H` will drop HTTP headers**:

    $ curl -is https://github.com/api/v2/json/repos/show/joyent/node | json -H repository.watchers
    4753

Here is **an example that shows indexing a list**. (The given "lookup"
argument is basically JavaScript code appended, with '.' if necessary, to the
JSON data and eval'd.)

    $ curl -s http://github.com/api/v2/json/repos/search/nodejs | json 'repositories[2].description'
    Connect is a middleware layer for Node.js


# Array processing with `-a`

`json` includes the `-a` (aka `--array`) option for **processing each element of
an input JSON array independently** and **using tabular output**. Continuing
our example above, let's first get a list of repositories for a "nodejs"
search on github:

    $ curl -s http://github.com/api/v2/json/repos/search/nodejs | json repositories
    [
      {
        "type": "repo",
        "followers": 3922,
        "watchers": 3922,
        "has_issues": true,
        "description": "Sinatra inspired web development framework for node.js -- insanely fast, flexible, and sexy",
        "url": "https://github.com/visionmedia/express",
        "has_downloads": true,
        "created_at": "2009/06/26 11:56:01 -0700",
        "pushed": "2011/09/28 10:27:26 -0700",
        "forks": 345,
    ...

We can then print a table with just some fields as follows:

    $ curl -s http://github.com/api/v2/json/repos/search/nodejs \
        | json repositories | json -a forks url
    345 https://github.com/visionmedia/express
    136 https://github.com/unconed/TermKit
    292 https://github.com/LearnBoost/socket.io

Ultimately this can be useful for then using other command-line tools. For
example, we could get the list of top-five most forked "nodejs" github
repos:

    $ curl -s http://github.com/api/v2/json/repos/search/nodejs \
        | json repositories | json -a forks url | sort -n | tail -5
    136 https://github.com/christkv/node-mongodb-native
    136 https://github.com/unconed/TermKit
    182 https://github.com/senchalabs/connect
    292 https://github.com/LearnBoost/socket.io
    345 https://github.com/visionmedia/express

Or get a breakdown by ISO language code of the recent tweets mentioning "nodejs":

    $ curl -s http://search.twitter.com/search.json?q=nodejs\&rpp=100 \
        | json results | json -a iso_language_code | sort | uniq -c | sort
       1 es
       1 no
       1 th
       4 ru
      12 ja
      23 pt
      58 en

The **`-d` option can be used to specify a delimiter**:

    $ curl -s http://github.com/api/v2/json/repos/search/nodejs \
        | json repositories | json -a forks url -d,

    $ curl -s http://github.com/api/v2/json/repos/search/nodejs \
        | json repositories | json -a forks watchers url -d,
    345,3922,https://github.com/visionmedia/express
    136,3128,https://github.com/unconed/TermKit
    292,2777,https://github.com/LearnBoost/socket.io
    104,1640,https://github.com/mishoo/UglifyJS
    ...


# Auto-arrayification

Adjacent objects or arrays are 'arrayified'. To attempt to avoid false
positives inside JSON strings, *adjacent* elements must have either no
whitespace separation or at least a newline separation. Examples:

    $ echo '{"a":1}{"b":2}' | json
    [
      {
        "a": 1
      },
      {
        "b": 2
      }
    ]
    $ echo '[1,2][3,4]' | json
    [
      1,
      2,
      3,
      4
    ]

This can be useful when processing a number of JSON files, e.g.:

    $ cat my_data/*.json | json ...

Or when composing multiple JSON API response, e.g. this somewhat contrived
search for node.js bugs mentioning "tty" or "windows":

    $ echo tty windows | xargs -n1 -I{} curl -s \
        http://github.com/api/v2/json/issues/search/joyent/node/open/{} \
        | json -a issues | json -a number title
    623 Non-userfacing native modules should be prefixed with _
    861 child_process fails after stdin close
    1157 `child_process` module should read / write password prompts
    1180 Ctrl+Shift+BS can't be input.
    ...


# Output formatting

You can use the '-o MODE' option (or '--output MODE') to control the output
flavour. By default the output is "jsony" (JSON, except that a simple string
is printed *without the quotes*):

    $ echo '[{"name": "Trent"},{"name": "Mark"}]' | json
    [
      {
        "name": "Trent"
      },
      {
        "name": "Mark"
      }
    ]

    $ echo '[{"name": "Trent"},{"name": "Mark"}]' | json '0.name'
    Trent

    $ echo '[{"name": "Trent"},{"name": "Mark"}]' | json '0.name' -o jsony
    Trent

Or for strict JSON output:

    $ echo '[{"name": "Trent"},{"name": "Mark"}]' | json -o json
    [
      {
        "name": "Trent"
      },
      {
        "name": "Mark"
      }
    ]

By default this uses a 2-space indent. That can be changed with a "-N" suffix:

    $ echo '[{"name": "Trent"},{"name": "Mark"}]' | json -o json-4
    [
        {
            "name": "Trent"
        },
        {
            "name": "Mark"
        }
    ]

    $ echo '[{"name": "Trent"},{"name": "Mark"}]' | json -o json-0
    [{"name":"Trent"},{"name":"Mark"}]

You can get colored (non-JSON) output using node.js's [`util.inspect`](http://nodejs.org/docs/latest/api/all.html#util.inspect):

    $ echo '[{"name": "Trent"},{"name": "Mark"}]' | json -o inspect
    [ { name: 'Trent' },
      { name: 'Mark' } ]


# Validating JSON

Since v1.2.0 `json` will give position information and context for JSON
syntax errors (`SyntaxError`). This can be handy for validating data and
config files:

    $ cat config.json | json
    json: error: input is not JSON: Unexpected ',' at line 17, column 5:
                , { "name": "smartos64-1.4.7"
            ....^
    {
        "use-proxy": false
    ...
    $ echo $?
    1


# Executing code snippets on input

You can use the `-e CODE` option to execute small code snippets to massage
the input data. Some examples (generally use `this.<key>` to refer to a key):

    $ echo '{"foo": "bar"}' | json -e 'this.foo="baz"'
    {"foo":"baz"}

Or omit the `this.` as a shortcut:

    $ echo '{"foo": "bar"}' | json -e 'foo="baz"'
    {"foo":"baz"}
    $ echo '{"age": 38}' | json -e 'age++'
    {"age":39}

Set a key to `undefined` to remove it:

    $ echo '{"one": 1, "two": 2}' | json -e 'this.one=undefined'
    {"two":2}

If the input is an array, then `-e` will automatically process each element
separately (use `-A` to override this):

    $ echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | json3 -e 'age++'
    [
      {
        "name": "trent",
        "age": 39
      },
      {
        "name": "ewan",
        "age": 5
      }
    ]


# Filtering with `-c CODE`

You can use the `-c CODE` option to filter the input:

    $ echo '{"name":"trent", "age":38}' | json3 -c 'age>21'
    {
      "name": "trent",
      "age": 38
    }
    $ echo '{"name":"trent", "age":38}' | json3 -c 'age==16'
    $

If the input is an array, then `-c` will automatically process each element
separately (use `-A` to override this):

    $ echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | json3 -c 'age>21'
    [
      {
        "name": "trent",
        "age": 38
      }
    ]


# Module Usage

Since v1.3.1 you can use "jsontool" as a node.js module:

    var jsontool = require('jsontool');

However, so far the module API isn't that useful. This will improve in
subsequent releases. For now the cli is the primary focus.



# Alternatives you might prefer

- json:select: <http://jsonselect.org/>
- jsonpipe: <https://github.com/dvxhouse/jsonpipe>
- json-command: <https://github.com/zpoley/json-command>
- JSONPath: <http://goessner.net/articles/JsonPath/>, <http://code.google.com/p/jsonpath/wiki/Javascript>
- jsawk: <https://github.com/micha/jsawk>
- jshon: <http://kmkeen.com/jshon/>
