#!/usr/bin/env python

"""Generate input files for perf testing.

Ranges to perf test:
- '\n'-separated JSON objects, number of lines: 1, 100, 1000, 10000, ...
  TODO: how big is 10000 lines? We want up to about 1GiB

    newline-1.log
    newline-10.log
    newline-100.log
    newline-1k.log
    newline-10k.log
    newline-100k.log

- single object: simple foo:bar, lot of keys, deeply nested, range of sizes
  up to 10MiB

    obj-1.json
    obj-10.json
    obj-100.json
    obj-1k.json
    obj-10k.json

- actual JSON array of objects

    array-1.json
    array-10.json
    array-100.json
    array-1k.json
    array-10k.json
    array-100k.json

- TODO: real world examples (anonymized)
"""

import time
import sys
import os
import simplejson as json
from random import randint, sample, shuffle
import math



#---- support stuff

#keysPool = ["name", "hostname", "pid", "component", "audit", "level",
#  "remoteAddress", "remotePort", "req_id", "req", "res", "latency",
#  "msg", "time", "v"]
keysPool = open('/usr/share/dict/words').read().splitlines(False)

corpus = open('../README.md').read()
valsPool = [True, False, '', 0, -42, math.pi]
for i in range(10):
    start = randint(0, len(corpus))
    end = randint(start, start + 512)
    valsPool.append(corpus[start:end])

nObjs = 0
objs = []
iObj = 0
def genObj():
    global nObjs, objs, iObj
    nObjs += 1
    if nObjs % 1000 == 0:
        sys.stdout.write('.')
        sys.stdout.flush()
    # After ~1000 generated objects, just re-use them.
    if len(objs) >= 1024:
        if iObj >= len(objs):
            iObj = 0
        if iObj == 0:
            shuffle(objs)
        iObj += 1
        return objs[iObj - 1]

    obj = {}
    s = time.time()
    n = randint(1, 10)
    s = time.time()
    keys = sample(keysPool, n)
    s = time.time()
    vals = sample(valsPool, n)
    for key, val in zip(keys, vals):
        obj[key] = val
    if nObjs % 100 == 0:
        valsPool.append(obj)
    objs.append(obj)
    return obj



#---- mainline

def main(argv):
    newlines = [
        ('newline-100k.log', 100000),
        ('newline-10k.log', 10000),
        ('newline-1k.log', 1000),
        ('newline-100.log', 100),
        ('newline-10.log', 10),
        ('newline-1.log', 1),
    ]
    for name, nlines in newlines:
        f = open(name, 'w')
        for i in range(nlines):
            f.write(json.dumps(genObj()))
            f.write('\n')
        f.close()
        print 'wrote "%s"' % name

    #objFiles = [
    #    ('obj-1.json', 1),
    #    ('obj-10.json', 10),
    #    ('obj-10.json', 100),
    #    ('obj-1k.json', 1000),
    #    ('obj-10k.json', 10000),
    #]
    #for name, nkeys in objFiles:
    #    f = open(name, 'w')
    #    if nkeys > len(keysPool):
    #        XXX # START HERE
    #    keys = sample(keysPool, nkeys)
    #    vals = sample(valsPool, nkeys)
    #    obj = {}
    #    for key, val in zip(keys, vals):
    #        obj[key] = val
    #    f.write(json.dumps(obj))
    #    f.write('\n')
    #    f.close()
    #    print 'wrote "%s"' % name



if __name__ == '__main__':
    sys.exit(main(sys.argv))
