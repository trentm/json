Basic run:

    [22:53:45 trentm@grape:~/tm/json/perf (master)]
    $ time cat n200.log  | jq .msg >j

    real  0m0.014s
    user  0m0.012s
    sys   0m0.004s
    [22:53:48 trentm@grape:~/tm/json/perf (master)]
    $ time cat n200.log  | json -ga msg >j

    real  0m0.182s
    user  0m0.155s
    sys   0m0.029s

Ug. Hopefully this is just '-ga' being dog slow. Or might
be 'msg'

    $ time cat n200.log  | json -ga >j

    real  0m0.089s
    user  0m0.071s
    sys   0m0.020s

Better, but still 4 times slower than 'jq' here. My *hope* is that `json` could
get to comparable speed for basic lookup and -E/-C.


Q. Can a custom node.js script processing a stream of JSON objects do a 'msg'
   lookup anywhere near jq?
A. Yes. 'jsonstream.js' here is a minimal correct `json -ga msg` implementation:

        var p = console.log;
        var carry = require('carrier').carry;
        carry(process.stdin, function (line) {
            p(JSON.parse(line).msg);
        });

    And over a large file:

        $ wc -l cloud.log
           49586 cloud.log
        $ time (cat cloud.log | ./jsonstream.js msg >/dev/null)

        real	0m3.539s
        user	0m3.439s
        sys	0m0.194s
        $ time (cat cloud.log | jq .msg >/dev/null)

        real	0m2.989s
        user	0m2.955s
        sys	0m0.104s
        $ time (cat cloud.log | json -ga msg >/dev/null)

        real	0m27.496s
        user	0m25.626s
        sys	0m2.131s

    It can approach `jq`. Current `json -ga` is awful.

    FWIW, the minimal correct Python impl (with `simplejson`):

        #!/usr/bin/env python
        import simplejson as json   # **NOTE** This waaay better than built in `json` lib.
        import sys
        for line in sys.stdin:
            print json.loads(line)['msg']

    was very good:

        $ time (cat cloud.log | ./jsonstream.py msg >/dev/null)

        real	0m1.516s
        user	0m1.490s
        sys	0m0.092s



Q. Can we get *to* or better than `jq` speed for this case?

   Would be useful to understand what processing jq is doing here? It is
   proper JSON parsing up to the "msg" field? Is it cheating with string
   search for the simple case?

   TODO: Try to optimize the minimal 'jsonstream.js' above for this case.
   Try `line.indexOf('"msg"')` followed by whitespace, then ':'.

A. Yes! We can with this code that is cheating a lot (presumes no space
   before ':', only allows ' ' for whitespace):

        carry(process.stdin, function (line) {
            var idx = line.indexOf('"msg":');
            if (idx === -1) {
                p('');
            } else {
                var i = idx + 6;
                var len = line.length;
                while (true) {
                    if (i >= len) {
                        throw 'boom: bad JSON';
                    } else if (line[i] === ' ') {
                        i++
                    } else {
                        break;
                    }
                }
                if (line[i] !== '"') throw 'boom: bad JSON: expected \'"\'';
                i++;
                var chars = [];
                while (true) {
                    if (i >= len) {
                        throw 'boom: bad JSON';
                    }
                    var ch = line[i];
                    if (ch === '\\') {
                        chars.push(ch);
                        chars.push(line[i+1]);
                        i += 2;
                    } else if (line[i] !== '"') {
                        chars.push(ch);
                        i++
                    } else {
                        break;
                    }
                }
                p(chars.join(''));
            }
        });

   Timings:

        $ time (cat cloud.log | jq .msg >/dev/null)

        real	0m2.991s
        user	0m2.953s
        sys	0m0.108s
        $ time (cat cloud.log | ./jsonstream.js msg >/dev/null)

        real	0m0.995s
        user	0m0.916s
        sys	0m0.152s


Note that most of this jsonstream.js time is the "by line" reading from stdin:

    $ time (cat cloud.log | ./readlines.js msg >/dev/null)

    real	0m0.757s
    user	0m0.674s
    sys	0m0.155s

code:

    carry(process.stdin, function (line) {
        p('handled: 201');
    });

vs. the equiv in Python:

    $ time (cat cloud.log | ./readlines.py msg >/dev/null)

    real	0m0.207s
    user	0m0.177s
    sys	0m0.084s

code:

    import sys
    for line in sys.stdin:
        print 'handled: 201'

Merits looking into 'carry'. Calling a *function* for each line is
overkill. ... My attempt saves only a *little bit*:

    var left = '';
    process.stdin.on('data', function(s) {
        var lines = (left + s).split(/\r?\n/g);
        var len = lines.length - 1;
        for (var i = 0; i < len; i++) {
            p('handled: 201');
        }
        left = lines[len];
    });
    process.stdin.on('end', function () {
        if (left) {
            p('handled: 201');
        }
    });

Result:

    $ time (cat cloud.log | ./jsonstream.js msg >/dev/null)

    real	0m0.653s
    user	0m0.576s
    sys	0m0.149s



TODO:
- Get perf metrics to compare 1k, 1MiB, 10Mib, 100MiB, 1GiB size time comparisons
  for one field, two fields, three fields, complex lookups.
- Drop the `vm` module usage for just lookups in `json`.
- Quick optimization of 'json -qa FIELDS...' to use the minimal... if necessary
  given previous `vm` drop.
- Fast PATH optimization for simple field lookups... to beat jq for those.
- Does 'jq' have '-e/-c' equivalents that are worth beating?
- Implement -E/-C optimized replacements without 'vm' module.
- Seriously consider a `json` front that first tries a *Python* impl as a
  fast path. :)
