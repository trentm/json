#!/usr/bin/env node
/*
 * Time some usages of json against node versions, old json
 * releases and a number of commands.
 *
 * Usage:
 *      ./tools/get-jsons
 *      ./tools/perf.js
 */

var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var ben = require('ben');  // npm install ben
var async = require('async');
var semver = require('semver');



var TOP = path.resolve(__dirname, '..');
var JSONS = path.resolve(TOP, 'tmp', 'jsons');
var versions = fs.readdirSync(JSONS);
versions.push('dev');
versions.reverse();

var nodes = [
    'node8',
    'node6',
    'node4'
];

var cmds = [
    // [VERSION-RANGE, CMD-TEMPLATE]
    ['>=3', 'cat TOP/tools/perf/1k.json | JSON UUID'],
    ['>=3', 'echo \'{"foo":"bar"}\' | JSON -e "foo=\'baz\'" foo'],
    ['>=3', 'echo \'{"foo":"bar"}\' | JSON -c "true" foo'],
    ['*', 'echo \'{"foo":"bar"}\' | JSON foo'],
    ['*', 'echo \'{"foo":"bar"}\' | JSON'],
];

async.forEachSeries(cmds, function (cmdInfo, nextCmd) {
    var cmdVerRange = cmdInfo[0];
    var cmdTemplate = cmdInfo[1];
    console.log("");
    console.log("# `%s`", cmdTemplate);
    async.forEachSeries(nodes, function (node, nextNode) {
        console.log("");
        async.forEachSeries(versions, function (version, nextVer) {
            if (version !== 'dev' && !semver.satisfies(version, cmdVerRange)) {
                return nextVer();
            }

            var json = (version === 'dev'
                ? path.resolve(TOP, 'lib', 'jsontool.js')
                : path.resolve(JSONS, version, 'json'));
            if (!fs.existsSync(json)) {
                return nextVer();
            }

            var fail = false;
            function runCmd(done) {
                var cmd = (cmdTemplate
                    .replace(/\bJSON\b/g, node + ' ' + json)
                    .replace(/\bTOP\b/, TOP));
                exec(cmd, function (err, stdout, stderr) {
                    if (err) {
                        console.log('error with cmd `%s`: %s', cmd, err);
                        fail = true;
                    }
                    done()
                });
            }
            ben.async(runCmd, function (ms) {
                var space = (version === 'dev' ? '  ' : ''); // HACK
                console.log('- %s, json %s%s: %dms per iteration%s', node,
                    space, version, ms, (fail ? ' (fail)' : ''));
                nextVer();
            });
        }, nextNode);
    }, nextCmd);
});
