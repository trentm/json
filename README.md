A "json" command for massaging JSON on your Unix command line. This
is a single-file node.js script. `json -h`:

    Usage: <something generating JSON on stdout> | json [options] [fields]

    Pipe in your JSON for nicer output. Or supply `fields` to extract
    subsets of the JSON. This will skip over HTTP header blocks 
    (as from `curl -i`) by default.

    By default, the output is JSON-y: JSON expect for a simple string return
    value, which is printed without quotes. Use '-j' or '-i' to override.

    Options:
      -h        print this help info and exit
      -H        drop any HTTP header block
      -i        output using node's `sys.inspect`
      -j        output using `JSON.stringfy`, i.e. strict JSON

    Examples:
      curl -s http://search.twitter.com/search.json?q=node.js | json
      curl -s http://search.twitter.com/search.json?q=node.js | json results

    See <https://github.com/trentm/json> for more.


# TODO

- document the usage more
- Look at JSONPath: <http://goessner.net/articles/JsonPath/>, <http://code.google.com/p/jsonpath/wiki/Javascript>

