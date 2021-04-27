var tap = require('tap');

var parseLookup = require('../lib/json.js').parseLookup;

tap.test('parseLookup', function (t) {
    t.same(parseLookup('a'), ['a']);
    t.same(parseLookup('a.b'), ['a', 'b']);
    t.same(parseLookup('a.b.c'), ['a', 'b', 'c']);

    t.same(parseLookup('["a"]'), ['a']);

    t.same(parseLookup('b["a"]'), ['b', 'a']);
    t.same(parseLookup('b["a"]'), ['b', 'a']);

    t.same(parseLookup('["a"].b'), ['a', 'b']);

    t.same(parseLookup('["a-b"]'), ['a-b']);
    t.same(parseLookup('["a-b"]'), ['a-b']);
    t.same(parseLookup('["a.b"]'), ['a.b']);
    t.same(parseLookup('["a.b"]'), ['a.b']);
    t.same(parseLookup('["a[b"]'), ['a[b']);
    t.same(parseLookup('["a[b"]'), ['a[b']);
    t.same(parseLookup('["a]b"]'), ['a]b']);
    t.same(parseLookup('["a]b"]'), ['a]b']);

    /* BEGIN JSSTYLED */
    t.same(parseLookup("['a\\'[b']"), ["a'[b"]);
    t.same(parseLookup("['a\\'[b'].c"), ["a'[b", "c"]);
    /* END JSSTYLED */

    t.same(parseLookup('a/b', '/'), ['a', 'b']);
    t.same(parseLookup('a.b/c', '/'), ['a.b', 'c']);
    t.same(parseLookup('a.b/c["d"]', '/'), ['a.b', 'c', 'd']);
    t.same(parseLookup('["a/b"]', '/'), ['a/b']);

    t.end();
});
