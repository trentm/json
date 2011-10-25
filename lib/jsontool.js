#!/usr/bin/env node
//
// json -- pipe in your JSON for nicer output and for extracting data bits
//
// See <https://github.com/trentm/json>.
//

var VERSION = "2.0.1";

var sys = require('sys');
var pathlib = require('path');
var runInNewContext;
try {
  runInNewContext = require('vm').runInNewContext;
} catch (e) {
  runInNewContext = process.binding('evals').Script.runInNewContext;  // node v0.2
}
var warn = console.warn;



//--- exports for module usage

exports.main = main;
exports.getVersion = getVersion;
exports.parseLookup = parseLookup;

// As an exported API, these are still experimental:
exports.lookupDatum = lookupDatum;
exports.printDatum = printDatum;



//---- globals and constants

// Output modes.
var OM_JSONY = 1;
var OM_JSON = 2;
var OM_INSPECT = 3;
var OM_COMPACT = 4;
var OM_FROM_NAME = {
  "jsony": OM_JSONY,
  "json": OM_JSON,
  "inspect": OM_INSPECT,
  "compact": OM_COMPACT
}



//---- support functions

function getVersion() {
  return VERSION;
}

function isArray(ar) {
  return ar instanceof Array ||
         Array.isArray(ar) ||
         (ar && ar !== Object.prototype && isArray(ar.__proto__));
}

function printHelp() {
  sys.puts("Usage: <something generating JSON on stdout> | json [options] [lookups...]");
  sys.puts("");
  sys.puts("Pipe in your JSON for nicer output or supply one or more `lookups`");
  sys.puts("to extract a subset of the JSON. HTTP header blocks (as from `curl -i`)");
  sys.puts("are skipped by default.");
  sys.puts("");
  sys.puts("Options:");  
  sys.puts("  -h, --help    print this help info and exit");
  sys.puts("  --version     print version of this command and exit");
  sys.puts("  -q, --quiet   don't warn if input isn't valid JSON");
  sys.puts("");
  sys.puts("  -H            drop any HTTP header block (as from `curl -i ...`)");
  sys.puts("  -a, --array   process input as an array of separate inputs");
  sys.puts("                and output in tabular form");
  sys.puts("  -d DELIM      delimiter string for tabular output (default is ' ')");
  sys.puts("");
  sys.puts("  -o, --output MODE   Specify an output mode. One of");
  sys.puts("                  jsony (default): JSON with string quotes elided");
  sys.puts("                  json: JSON output, 2-space indent");
  sys.puts("                  json-N: JSON output, N-space indent, e.g. 'json-4'");
  sys.puts("                  inspect: node.js `util.inspect` output");
  sys.puts("  -i            shortcut for `-o inspect`");
  sys.puts("  -j            shortcut for `-o json`");
  sys.puts("");
  sys.puts("Examples:");
  sys.puts("  curl -s http://search.twitter.com/search.json?q=node.js | json");
  sys.puts("  curl -s http://search.twitter.com/search.json?q=node.js | json results");
  sys.puts("");
  sys.puts("See <https://github.com/trentm/json> for more complete docs.");
}


/**
 * Parse the command-line options and arguments into an object.
 *
 *    {
 *      'args': [...]       // arguments
 *      'help': true,       // true if '-h' option given
 *       // etc.
 *    }
 *
 * @return {Object} The parsed options. `.args` is the argument list.
 * @throws {Error} If there is an error parsing argv.
 */
function parseArgv(argv) {
  var parsed = {
    args: [],
    help: false,
    quiet: false,
    dropHeaders: false,
    outputMode: OM_JSONY,
    jsonIndent: 2,
    delim: ' '
  };
  
  // Turn '-iH' into '-i -H', except for argument-accepting options.
  var args = argv.slice(2);  // drop ['node', 'scriptname']
  var newArgs = [];
  var optTakesArg = {'d': true, 'o': true};
  for (var i = 0; i < args.length; i++) {
    if (args[i].charAt(0) === "-" && args[i].charAt(1) !== '-' && args[i].length > 2) {
      var splitOpts = args[i].slice(1).split("");
      for (var j = 0; j < splitOpts.length; j++) {
        newArgs.push('-' + splitOpts[j])
        if (optTakesArg[splitOpts[j]]) {
          var optArg = splitOpts.slice(j+1).join("");
          if (optArg.length) {
            newArgs.push(optArg);
          }
          break;
        }
      }
    } else {
      newArgs.push(args[i]);
    }
  }
  args = newArgs;

  endOfOptions = false;
  while (args.length > 0) {
    var arg = args.shift();
    switch(arg) {
      case "--":
        endOfOptions = true;
        break;
      case "-h": // display help and exit
      case "--help":
        parsed.help = true;
        break;
      case "--version":
        parsed.version = true;
        break;
      case "-q":
      case "--quiet":
        parsed.quiet = true;
        break;
      case "-H": // drop any headers
        parsed.dropHeaders = true;
        break;
      case "-o":
      case "--output":
        var name = args.shift();
        var idx = name.lastIndexOf('-');
        if (idx !== -1) {
          var indent = Number(name.slice(idx+1));
          if (! isNaN(indent)) {
            parsed.jsonIndent = indent;
            name = name.slice(0, idx);
          }
        }
        parsed.outputMode = OM_FROM_NAME[name];
        if (parsed.outputMode === undefined) {
          throw new Error("unknown output mode: '"+name+"'");
        }
        break;
      case "-i": // output with sys.inspect
        parsed.outputMode = OM_INSPECT;
        break;
      case "-j": // output with JSON.stringify
        parsed.outputMode = OM_JSON;
        break;
      case "-a":
      case "--array":
        parsed.array = true;
        break;
      case "-d":
        parsed.delim = args.shift();
        break;
      default: // arguments
        if (!endOfOptions && arg.length > 0 && arg[0] === '-') {
          throw new Error("unknown option '"+arg+"'");
        }
        parsed.args.push(arg);
        break;
    } 
  }
  //TODO: '--' handling and error on a first arg that looks like an option.

  return parsed;
}



function isInteger(s) {
  return (s.search(/^-?[0-9]+$/) == 0);
}


// Parse a lookup string into a list of lookup bits. E.g.:
//    "a.b.c" -> ["a","b","c"]
//    "b['a']" -> ["b","['a']"]
function parseLookup(lookup) {
  //var debug = console.warn;
  var debug = function () {};
  
  var bits = [];
  debug("\n*** "+lookup+" ***")

  bits = [];
  var bit = "";
  var states = [null];
  var escaped = false;
  var ch = null;
  for (var i=0; i < lookup.length; ++i) {
    var escaped = (!escaped && ch === '\\');
    var ch = lookup[i];
    debug("-- i="+i+", ch="+JSON.stringify(ch)+" escaped="+JSON.stringify(escaped))
    debug("states: "+JSON.stringify(states))

    if (escaped) {
      bit += ch;
      continue;
    }

    switch (states[states.length-1]) {
    case null:
      switch (ch) {
      case '"':
      case "'":
        states.push(ch);
        bit += ch;
        break;
      case '[':
        states.push(ch);
        if (bit !== "") {
          bits.push(bit);
          bit = ""
        }
        bit += ch;
        break;
      case '.':
        if (bit !== "") {
          bits.push(bit);
          bit = ""
        }
        break;
      default:
        bit += ch;
        break;
      }
      break;

    case '[':
      bit += ch;
      switch (ch) {
      case '"':
      case "'":
      case '[':
        states.push(ch);
        break;
      case ']':
        states.pop();
        if (states[states.length-1] === null) {
          bits.push(bit);
          bit = ""
        }
        break;
      }
      break;

    case '"':
      bit += ch;
      switch (ch) {
      case '"':
        states.pop();
        if (states[states.length-1] === null) {
          bits.push(bit);
          bit = ""
        }
        break;
      }
      break;

    case "'":
      bit += ch;
      switch (ch) {
      case "'":
        states.pop();
        if (states[states.length-1] === null) {
          bits.push(bit);
          bit = ""
        }
        break;
      }
      break;
    }
    debug("bit: "+JSON.stringify(bit))
    debug("bits: "+JSON.stringify(bits))
  }

  if (bit !== "") {
    bits.push(bit);
    bit = ""
  }

  debug(JSON.stringify(lookup)+" -> "+JSON.stringify(bits))
  return bits
}


/**
 * Parse the given stdin input into:
 *  {
 *    "error": ... error object if there was an error ...,
 *    "datum": ... parsed object if content was JSON ...
 *   }
 */
function parseInput(buffer) {
  try {
    return {datum: JSON.parse(buffer)};
  } catch(e) {
    // Special case: allow a flat array of objects/arrays
    // ("flat-array-input" test case). This can be nice to process a
    // stream of JSON objects generated from multiple calls to another
    // tool or `cat *.json | json`.
    // Rules:
    // - Only JS objects and arrays. Don't see strong need for basic
    //   JS types right now and this limitation simplifies.
    // - The break between JS objects has to include a newline. I.e. good:
    //      {"one": 1}
    //      {"two": 2}
    //   bad:
    //      {"one": 1}{"two": 2}
    //   This condition should be fine for typical use cases and ensures
    //   no false matches inside JS strings.
    var pats = [
      /(})\s*\n\s*({)/g,
      /(\])\s*\n\s*(\[)/g,
      /(\])\s*\n\s*({)/g,
      /(})\s*\n\s*(\[)/g
    ];
    var newBuffer = buffer;
    pats.forEach(function (pat) {
      newBuffer = newBuffer.replace(pat, "$1,\n$2")
    })
    if (buffer !== newBuffer) {
      newBuffer = '[\n' + newBuffer + ']';
      try {
        return {datum: JSON.parse(newBuffer)};
      } catch (e2) {
      }
    }

    return {error: e}
  }
}


/**
 * Apply a lookup to the given datum.
 *
 * @argument datum {Object}
 * @argument lookup {Array} The parsed lookup (from
 *    `parseLookup(<string>)`). Might be empty.
 * @returns {Object} The result of the lookup.
 */
function lookupDatum(datum, lookup) {
  // Put it back together with some convenience transformations.
  var lookupCode = "";
  var isJSIdentifier = /^[$A-Za-z_][0-9A-Za-z_]*$/;
  for (var i=0; i < lookup.length; i++) {
    var bit = lookup[i];
    if (bit[0] === '[') {
      lookupCode += bit;
    } else if (! isJSIdentifier.exec(lookup[i])) {
      // Allow a non-JS-indentifier token, e.g. `json foo-bar`.
      lookupCode += '["' + lookup[i].replace('"', '\\"') + '"]';
    } else {
      lookupCode += '.' + lookup[i];
    }
  }
  return runInNewContext("(" + JSON.stringify(datum) + ")" + lookupCode);
}



/**
 * Print out a single result, considering input options.
 */
function printDatum(datum, opts, sep, alwaysPrintSep) {
  var output = null;
  switch (opts.outputMode) {
  case OM_INSPECT:
    output = sys.inspect(datum, false, Infinity, true);
    break;
  case OM_JSON:
    if (typeof datum !== 'undefined') {
      output = JSON.stringify(datum, null, opts.jsonIndent);
    }
    break;
  case OM_COMPACT:
    if (datum === undefined) {
      // pass
    } else if (isArray(datum)) {
      var bits = ['[\n'];
      datum.forEach(function (d) {
        bits.push('  ')
        bits.push(JSON.stringify(d, null, 0).replace(/,"(?![,:])/g, ', "'));
        bits.push(',\n');
      });
      bits.push(bits.pop().slice(0, -2) + '\n')  // drop last comma
      bits.push(']');
      output = bits.join('');
    } else {
      output = JSON.stringify(datum, null, 0);
    }
    break;
  case OM_JSONY:
    if (typeof datum === 'string') {
      output = datum;
    } else if (typeof datum !== 'undefined') {
      output = JSON.stringify(datum, null, opts.jsonIndent);
    }
    break;
  default:
    throw new Error("unknown output mode: "+opts.outputMode);
  }
  if (output && output.length) {
    emit(output);
    emit(sep);
  } else if (alwaysPrintSep) {
    emit(sep);
  }
}


function emit(s) {
  // TODO:PERF If this is try/catch is too slow (too granular): move up to
  //    mainline and be sure to only catch this particular error.
  try {
    process.stdout.write(s);
  } catch (e) {
    // Handle any exceptions in stdout writing in the "error" event above.
  }
}

process.stdout.on("error", function (err) {
  if (err.code === "EPIPE") {
    // Pass. See <https://github.com/trentm/json/issues/9>.
  } else {
    warn(err)
    process.exit(1);
  }
});



//---- mainline

function main(argv) {
  var opts;
  try {
    opts = parseArgv(argv);
  } catch (e) {
    warn("json: error: %s", e.message)
    process.exit(1);
  }
  //warn(opts);
  if (opts.help) {
    printHelp();
    return;
  }
  if (opts.version) {
    sys.puts("json " + getVersion());
    return;
  }
  var lookupStrs = opts.args;
  //XXX ditch this hack
  if (lookupStrs.length == 0) {
    lookupStrs.push("");
  }
  
  var buffer = "";
  
  var stdin = process.openStdin();
  stdin.setEncoding('utf8');
  stdin.on('data', function (chunk) {
      buffer += chunk;
  });
  
  stdin.on('end', function () {
    // Take off a leading HTTP header if any and pass it through.
    while (true) {
      if (buffer.slice(0,5) === "HTTP/") {
        var index = buffer.indexOf('\r\n\r\n');
        var sepLen = 4;
        if (index == -1) {
          index = buffer.indexOf('\n\n');
          sepLen = 2;
        }
        if (index != -1) {
          if (! opts.dropHeaders) {
            emit(buffer.slice(0, index+sepLen));
          }
          var is100Continue = (buffer.slice(0, 21) === "HTTP/1.1 100 Continue");
          buffer = buffer.slice(index+sepLen);
          if (is100Continue) {
            continue;
          }
        }
      }
      break;
    }

    // Expect the remainder to be JSON.
    if (! buffer.length) {
      return;
    }
    var input = parseInput(buffer); // -> {datum: <input object>, error: <error object>}
    if (input.error) {
      // Doesn't look like JSON. Just print it out and move on.
      if (! opts.quiet) {
        warn("json: error: doesn't look like JSON: %s (input='%s')",
          input.error, JSON.stringify(buffer));
      }
      emit(buffer);
      if (buffer.length && buffer[buffer.length-1] !== "\n") {
        emit('\n');
      }
      process.stdout.flush();
      process.exit(1);
    }

    // Process and output the input JSON.
    var lookups = lookupStrs.map(parseLookup);
    var results = [];
    if (opts.array) {
      var data = (isArray(input.datum) ? input.datum : [input.datum]);
      if (lookups.length === 0) {
        results = input.datum;
      } else {
        for (var j=0; j < data.length; j++) {
          var result = [];
          for (var i=0; i < lookups.length; i++) {
            result.push(lookupDatum(data[j], lookups[i]));
          }
          results.push(result);
        }
      }
      results.forEach(function (row) {
        var c;
        for (c = 0; c < row.length-1; c++) {
          printDatum(row[c], opts, opts.delim, true);
        }
        printDatum(row[c], opts, '\n', true);
      });
    } else {
      if (lookups.length === 0) {
        results = input.datum;
      } else {
        for (var i=0; i < lookups.length; i++) {
          results.push(lookupDatum(input.datum, lookups[i]));
        }
      }
      results.forEach(function (r) {
        printDatum(r, opts, '\n', false);
      });
    }
  });

  // TODO: this isn't sufficient to ensure all output is flushed.
  process.on('exit', function () {
    process.stdout.flush();
  });
}

if (require.main === module) {
  main(process.argv);
}
