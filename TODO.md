# todos

- Add man page to platform?
- '-c' and json 3 (see below)


# Feeling out '-c'

echo '{"age": 38}' | jsondev -c 'this.age > 30'
        {
          "age": 38
        }
echo '{"age": 38}' | jsondev -c 'this.age < 30'

# -c switches mode to look at each array item if top-level input is an array
echo '[{"age":38}, {"age": 42}, {"age":21}]' | jsondev -c 'this.age > 30'
        [
            {
              "age": 38
            },
            {
              "age": 42
            }
        ]

# -a still does its thing (flatten)
echo '[{"age":38}, {"age": 42}, {"age":21}]' | jsondev -a -c 'this.age > 30'
        {
          "age": 38
        }
        {
          "age": 42
        }
echo '[{"age":38}, {"age": 42}, {"age":21}]' | jsondev -a -c 'this.age > 30' age
        38
        42



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





# Intended json 3 behaviour

- '-j' means you'll always get JSON output (unless non-zero exit from
  invalid input)
- You have to have 'jsony' output mode to get tabular output from '-a'.
- '-e' and '-c' processing will switch to "array processing" automatically
  for array inputs. In *implicit* "array processing" the default output mode
  is switched to "json". Add '-a' to explicitly (a) switch to jsony output
  mode for tabular output and (b) set array processing. Use '-A' to
  explicitly do "object processing", i.e. treat the input as a single datum.
  Default output mode is "jsony" in this case.
- "lookups" do NOT automatically switch to array processing. Yes this is
  inconsistent from '-e' and '-c' handling but is required for backward
  compat with json 2. Hopefully using indexing `0.name` isn't too
  obtuse.
- More features:
  - DWIM `this` in '-e' and '-c' code when the datum is a simple type.
    Basically s/this/var/ and make 'var=item' the context? This gives
    possibility to:
        $ echo '["a","b","c"]' | jsondev -e 'this+=this'
        ["aa","bb","cc"]
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

Examples ("CHANGE" means different behaviour for same options from json 2):

    #CHANGE
    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -j -a name   # json
    [{"name": "trent"}, {"name": "ewan"}]

    # Can't break this from json 2.
    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -a name   # jsony
    trent
    ewan

    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -a    # jsony
    {
      "name": "trent",
      "age": 38
    }
    {
      "name": "ewan",
      "age": 4
    }

    #CHANGE
    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -aj   # json
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

    # Can't break this from json 2.
    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev 0  # jsony
    {
      "name": "trent",
      "age": 38
    }


    # Showing auto array processing (and change to 'json' output mode).
    #CHANGE
    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -e 'age++'   # auto json
    [{"name":"trent", "age":39}, {"name":"ewan", "age":5}]

    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -c 'age>30'  # auto json
    [{"name":"trent","age":38}]

    echo '[{"name":"trent", "age":38}, {"name":"ewan", "age":4}]' | jsondev -c 'age>30' 0  # auto json
    [{"name":"trent","age":38}]

    # Use '-A' to avoid auto array processing.
    # E.g., a list of input commands in an SMTP session.
    echo '[{"cmd":"EHLO"}, {"cmd":"..."}]' | jsondev -A -c 'this[0].cmd === "EHLO"'
    [{"cmd":"EHLO"}, {"cmd":"..."}]

    echo '[{"cmd":"GET /"}, {"cmd":"..."}]' | jsondev -A -c 'this[0].cmd === "EHLO"'  # not SMTP
    # (empty output)

    # E.g., append to an array.
    echo '["a","b","c"]' | jsondev -A -e 'this[3]="d"'
    ["a","b","c","d"]
