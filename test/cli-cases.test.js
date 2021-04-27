// Test each of the CLI test cases in subdirs. Each subdir has a bash `cmd`
// script that is run with optional `input`. Then the stdout, stderr, and
// exit code is compared to the `expected.*` files.

var exec = require('child_process').exec;
var fs = require('fs');
var os = require('os');
var path = require('path');

var ansidiff = require('ansidiff');
var tap = require('tap');

tap.jobs = os.cpus().length;

// Find all subdirs -- we assume they are cli cases with a 'cmd' file.
var names = fs.readdirSync(__dirname)
    .filter(function (name) {
        var dir = path.join(__dirname, name);
        return fs.statSync(dir).isDirectory();
    });

names.forEach(function (name) {
    tap.test(name, function (t) {
        var dir = path.join(__dirname, name);
        var p;
        var expectedExitCode = null;
        try {
            p = path.join(dir, 'expected.exitCode');
            if (fs.statSync(p)) {
                expectedExitCode = Number(fs.readFileSync(p));
            }
        } catch (e) {}

        var expectedStdout = null;
        try {
            p = path.join(dir, 'expected.stdout');
            if (fs.statSync(p)) {
                expectedStdout = fs.readFileSync(p, 'utf8');
            }
        } catch (e) {}

        var expectedStderr = null;
        try {
            p = path.join(dir, 'expected.stderr');
            if (fs.statSync(p)) {
                expectedStderr = fs.readFileSync(p, 'utf8');
            }
        } catch (e) {}

        exec('bash cmd', {
            'cwd': dir
        }, function (error, stdout, stderr) {
            if (expectedExitCode !== null) {
                t.equal(expectedExitCode, error && error.code || 0, 'exitCode');
            }
            if (expectedStdout !== null) {
                t.equal(stdout, expectedStdout, 'stdout');
            }
            if (expectedStderr !== null) {
                t.equal(stderr, expectedStderr, 'stderr');
            }
            t.end();
        });
    });
});
