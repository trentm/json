A "json" command for massaging JSON on your Unix command line. This
is a single-file node.js script.


# Installation

1. Get [node](http://nodejs.org) and [npm](http://npmjs.org).

2. `npm install -g jsontool`.

**OR manually**:

2. Get the 'json' script and put it on your PATH somewhere (it is a single file
   with no external dependencies). For example:

        cd ~/bin
        curl -L https://github.com/trentm/json/raw/master/lib/jsontool.js > json
        chmod 755 json


# Command-Line Usage

`json -h`:

    Usage: <something generating JSON on stdout> | json [options] [lookups...]

    Pipe in your JSON for nicer output or supply one or more `lookups`
    to extract a subset of the JSON. HTTP header blocks (as from `curl -i`)
    are skipped by default.

    Options:
      -h, --help    print this help info and exit
      --version     print version of this command and exit
      -q, --quiet   don't warn if input isn't valid JSON

      -H            drop any HTTP header block (as from `curl -i ...`)
      -a, --array   process input as an array of separate inputs
                    and output in tabular form
      -d DELIM      delimiter string for tabular output (default is ' ')

      -o, --output MODE   Specify an output mode. One of
                      jsony (default): JSON with string quotes elided
                      json: JSON output, 2-space indent
                      json-N: JSON output, N-space indent, e.g. 'json-4'
                      inspect: node.js `util.inspect` output
      -i            shortcut for `-o inspect`
      -j            shortcut for `-o json`

    Examples:
      curl -s http://search.twitter.com/search.json?q=node.js | json
      curl -s http://search.twitter.com/search.json?q=node.js | json results

    See <https://github.com/trentm/json#readme> for more complete docs.



# Module Usage

Since v1.3.1 you can using "jsontool" as a node.js module:

    var jsontool = require('jsontool');

However, so far the module API isn't that useful. This will improve in
subsequent releases. For now the cli is the primary focus.



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

`json` includes `-a` (aka `--array`) option for **processing each element of
an input JSON array independently** and **using tabular output**. Let'sContinuing
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
example, we could get the list of top-five most forks "nodejs" github
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


# Output flavours

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

    $ echo '[{"name": "Trent"},{"name": "Mark"}]' | json '[0].name'
    Trent

    $ echo '[{"name": "Trent"},{"name": "Mark"}]' | json '[0].name' -o jsony
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

    $ echo '[{"name": "Trent"},{"name": "Mark"}]' | json '[0].name' -o json
    "Trent"

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

Or a hacked up "compact" output mode which prints the elements of an array on their own line:

    $ echo '[{"name": "Trent"},{"name": "Mark"}]' | json -o compact
    [
      {"name":"Trent"},
      {"name":"Mark"}
    ]



# Test suite

    make test

Note that the 'utf8' test fails with a V8 build before  [revision
5399](http://code.google.com/p/v8/source/detail?r=5399), see
<http://code.google.com/p/v8/issues/detail?id=855>. I'm not sure exactly what
node versions this corresponds to, but at least: broken in node 0.2.5 and
working in node 0.4.0.

If you are stuck with an older node and don't want the utf8 failure in your face:

    TEST_ONLY=-utf8 make test



# Alternatives you might prefer

- json:select: <http://jsonselect.org/>
- jsonpipe: <https://github.com/dvxhouse/jsonpipe>
- json-command: <https://github.com/zpoley/json-command>
- JSONPath: <http://goessner.net/articles/JsonPath/>, <http://code.google.com/p/jsonpath/wiki/Javascript>
- jsawk: <https://github.com/micha/jsawk>
- jshon: <http://kmkeen.com/jshon/>
