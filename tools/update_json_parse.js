#!/usr/bin/env node
//
// Update "json_parse" function block in "../lib/json.js".
//

var log = console.log;
var path = require('path');
var fs = require('fs');
var assert = require('assert');
var execFile = require('child_process').execFile;



//---- mainline

var startSep = "// START json_parse\n";
var endSep = "// END json_parse\n";
var jsonJs = path.resolve(__dirname, "..", "lib", "json.js");
var content = fs.readFileSync(jsonJs, 'utf8');

var startIdx = content.indexOf(startSep);
assert.ok(startIdx !== -1);
var endIdx = content.indexOf(endSep);
assert.ok(endIdx !== -1);

var uglifyjs = path.resolve(__dirname, "../node_modules/.bin/uglifyjs");
var jsonParseJs = path.resolve(__dirname, "../deps/JSON-js/json_parse.js");
execFile(process.execPath, [uglifyjs, "-nc", jsonParseJs],
  function (error, minified, stderr) {
    assert.ok(!error, error);
    var bits = [
      content.slice(0, startIdx),
      startSep,
      minified + '\n',
      endSep,
      content.slice(endIdx + endSep.length)
    ];
    var newContent = bits.join('');
    if (newContent === content) {
      log('"'+jsonJs+'" not changed.');
    } else {
      fs.writeFileSync(jsonJs, newContent, 'utf8');
      log('"'+jsonJs+'" updated.');
    }
  }
);
