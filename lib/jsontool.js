#!/usr/bin/env node
//
// json -- a 'json' command for massaging JSON on the command line
//
// See <https://github.com/trentm/json>.
//

var VERSION = "3.0.4";

var util = require('util');
var pathlib = require('path');
var vm = require('vm');
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

/**
 * Return a *shallow* copy of the given object.
 *
 * Only support objects that you get out of JSON, i.e. no functions.
 */
function objCopy(obj) {
  var copy;
  if (Array.isArray(obj)) {
    copy = obj.slice();
  } else if (typeof(obj) === 'object') {
    copy = {};
    Object.keys(obj).forEach(function (k) {
      copy[k] = obj[k];
    });
  } else {
    copy = obj;  // immutable type
  }
  return copy;
}

/**
 * Parse the given string into a JS string. Basically: handle escapes.
 */
function _parseString(s) {
  var quoted = '"' + s.replace(/\\"/, '"').replace('"', '\\"') + '"';
  return eval(quoted);
}

// json_parse.js (<https://github.com/douglascrockford/JSON-js>)
// START json_parse
var json_parse=function(){"use strict";var a,b,c={'"':'"',"\\":"\\","/":"/",b:"\b",f:"\f",n:"\n",r:"\r",t:"\t"},d,e=function(b){throw{name:"SyntaxError",message:b,at:a,text:d}},f=function(c){return c&&c!==b&&e("Expected '"+c+"' instead of '"+b+"'"),b=d.charAt(a),a+=1,b},g=function(){var a,c="";b==="-"&&(c="-",f("-"));while(b>="0"&&b<="9")c+=b,f();if(b==="."){c+=".";while(f()&&b>="0"&&b<="9")c+=b}if(b==="e"||b==="E"){c+=b,f();if(b==="-"||b==="+")c+=b,f();while(b>="0"&&b<="9")c+=b,f()}a=+c;if(!isFinite(a))e("Bad number");else return a},h=function(){var a,d,g="",h;if(b==='"')while(f()){if(b==='"')return f(),g;if(b==="\\"){f();if(b==="u"){h=0;for(d=0;d<4;d+=1){a=parseInt(f(),16);if(!isFinite(a))break;h=h*16+a}g+=String.fromCharCode(h)}else if(typeof c[b]=="string")g+=c[b];else break}else g+=b}e("Bad string")},i=function(){while(b&&b<=" ")f()},j=function(){switch(b){case"t":return f("t"),f("r"),f("u"),f("e"),!0;case"f":return f("f"),f("a"),f("l"),f("s"),f("e"),!1;case"n":return f("n"),f("u"),f("l"),f("l"),null}e("Unexpected '"+b+"'")},k,l=function(){var a=[];if(b==="["){f("["),i();if(b==="]")return f("]"),a;while(b){a.push(k()),i();if(b==="]")return f("]"),a;f(","),i()}}e("Bad array")},m=function(){var a,c={};if(b==="{"){f("{"),i();if(b==="}")return f("}"),c;while(b){a=h(),i(),f(":"),Object.hasOwnProperty.call(c,a)&&e('Duplicate key "'+a+'"'),c[a]=k(),i();if(b==="}")return f("}"),c;f(","),i()}}e("Bad object")};return k=function(){i();switch(b){case"{":return m();case"[":return l();case'"':return h();case"-":return g();default:return b>="0"&&b<="9"?g():j()}},function(c,f){var g;return d=c,a=0,b=" ",g=k(),i(),b&&e("Syntax error"),typeof f=="function"?function h(a,b){var c,d,e=a[b];if(e&&typeof e=="object")for(c in e)Object.prototype.hasOwnProperty.call(e,c)&&(d=h(e,c),d!==undefined?e[c]=d:delete e[c]);return f.call(a,b,e)}({"":g},""):g}}();
// END json_parse

function printHelp() {
  util.puts("Usage:");
  util.puts("  <something generating JSON on stdout> | json [OPTIONS] [LOOKUPS...]");
  util.puts("");
  util.puts("Pipe in your JSON for pretty-printing, JSON validation, filtering, ");
  util.puts("and modification. Supply one or more `LOOKUPS` to extract a ");
  util.puts("subset of the JSON. HTTP header blocks are skipped by default.");
  util.puts("");
  util.puts("Auto-arrayification:");
  util.puts("  Adjacent objects or arrays separated by no space or by a");
  util.puts("  newline are 'arrayified'. This can be helpful for, e.g.: ");
  util.puts("     $ cat *.json | json ... ");
  util.puts("  and similar.");
  util.puts("");
  util.puts("Execution:");
  util.puts("  Use the '-e CODE' option to execute code on the input JSON.");
  util.puts("     $ echo '{\"name\":\"trent\",\"age\":38}' | json -e 'age++'");
  util.puts("     {");
  util.puts("       \"name\": \"trent\",");
  util.puts("       \"age\": 39");
  util.puts("     }");
  util.puts("  If input is an array, this will automatically process each");
  util.puts("  item separately.");
  util.puts("");
  util.puts("Conditional filtering:");
  util.puts("  Use the '-c CODE' option to filter the input JSON.");
  util.puts("     $ echo '[{\"age\":38},{\"age\":4}]' | jsondev -c 'age>21'");
  util.puts("     [{\"age\":38}]");
  util.puts("  If input is an array, this will automatically process each");
  util.puts("  item separately.");
  util.puts("");
  util.puts("Lookups:");
  util.puts("  Use lookup arguments to extract particular values:");
  util.puts("     $ echo '{\"name\":\"trent\",\"age\":38}' | json name");
  util.puts("     trent");
  util.puts("");
  util.puts("  Use '-a' for *array processing* of lookups and *tabular output*:");
  util.puts("     $ echo '{\"name\":\"trent\",\"age\":38}' | json name");
  util.puts("     trent");
  util.puts("     $ echo '[{\"name\":\"trent\",\"age\":38},");
  util.puts("              {\"name\":\"ewan\",\"age\":4}]' | json -a name age");
  util.puts("     trent 38");
  util.puts("     ewan 4");
  util.puts("");
  util.puts("Pretty-printing:");
  util.puts("  Output is 'jsony' by default: 2-space indented JSON, except a");
  util.puts("  single string value is printed without quotes.");
  util.puts("     $ echo '{\"name\": \"trent\", \"age\": 38}' | json");
  util.puts("     {");
  util.puts("       \"name\": \"trent\",");
  util.puts("       \"age\": 38");
  util.puts("     }");
  util.puts("");
  util.puts("  Use '-o json' for explicit JSON, '-o json-N' for N-space indent:");
  util.puts("     $ echo '{\"name\": \"trent\", \"age\": 38}' | json -o json-0");
  util.puts("     {\"name\":\"trent\",\"age\":38}");
  util.puts("");
  util.puts("  Use '-H' to exclude a leading HTTP header block as from `curl -i`.");
  util.puts("");
  util.puts("Options:");
  util.puts("  -h, --help    Print this help info and exit.");
  util.puts("  --version     Print version of this command and exit.");
  util.puts("  -q, --quiet   Don't warn if input isn't valid JSON.");
  util.puts("");
  util.puts("  -H            Drop any HTTP header block (as from `curl -i ...`).");
  util.puts("  -a, --array   Process input as an array of separate inputs");
  util.puts("                and output in tabular form.");
  util.puts("  -A            Process input as a single object, i.e. stop");
  util.puts("                '-e' and '-c' automatically processing each");
  util.puts("                item of an input array.");
  util.puts("  -d DELIM      Delimiter string for tabular output (default is ' ').");
  util.puts("  -D DELIM      Delimiter character between lookups (default is '.').");
  util.puts("");
  util.puts("  -e CODE       Execute the given code on the input. If input is an");
  util.puts("                array, then each item of the array is processed");
  util.puts("                separately (use '-A' to override).");
  util.puts("  -c CODE       Filter the input with `CODE`. If `CODE` returns");
  util.puts("                false-y, then the item is filtered out. If input");
  util.puts("                is an array, then each item of the array is ");
  util.puts("                processed separately (use '-A' to override).");
  util.puts("");
  util.puts("  -o, --output MODE   Specify an output mode. One of");
  util.puts("                  jsony (default): JSON with string quotes elided");
  util.puts("                  json: JSON output, 2-space indent");
  util.puts("                  json-N: JSON output, N-space indent, e.g. 'json-4'");
  util.puts("                  inspect: node.js `util.inspect` output");
  util.puts("  -i            shortcut for `-o inspect`");
  util.puts("  -j            shortcut for `-o json`");
  util.puts("");
  util.puts("See <https://github.com/trentm/json> for more complete docs.");
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
    exeSnippets: [],
    condSnippets: [],
    outputMode: OM_JSONY,
    jsonIndent: 2,
    array: null,
    delim: ' ',
    lookupDelim: '.'
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
      case "-i": // output with util.inspect
        parsed.outputMode = OM_INSPECT;
        break;
      case "-j": // output with JSON.stringify
        parsed.outputMode = OM_JSON;
        break;
      case "-a":
      case "--array":
        parsed.array = true;
        break;
      case "-A":
        parsed.array = false;
        break;
      case "-d":
        parsed.delim = _parseString(args.shift());
        break;
      case "-D":
        parsed.lookupDelim = args.shift()[0];
        break;
      case "-e":
        parsed.exeSnippets.push(args.shift());
        break;
      case "-c":
        parsed.condSnippets.push(args.shift());
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
// Optionally receives an alternative lookup delimiter (other than '.')
function parseLookup(lookup, lookupDelim) {
  //var debug = console.warn;
  var debug = function () {};

  var bits = [];
  debug("\n*** "+lookup+" ***")

  bits = [];
  lookupDelim = lookupDelim || ".";
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
      case lookupDelim:
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
    // Special case: Auto-arrayification of unjoined list of objects:
    //    {"one": 1}{"two": 2}
    // and auto-concatenation of unjoined list of arrays:
    //    ["a", "b"]["c", "d"]
    //
    // This can be nice to process a stream of JSON objects generated from
    // multiple calls to another tool or `cat *.json | json`.
    //
    // Rules:
    // - Only JS objects and arrays. Don't see strong need for basic
    //   JS types right now and this limitation simplifies.
    // - The break between JS objects has to include a newline:
    //      {"one": 1}
    //      {"two": 2}
    //   or no spaces at all:
    //      {"one": 1}{"two": 2}
    //   I.e., not this:
    //      {"one": 1}  {"two": 2}
    //   This condition should be fine for typical use cases and ensures
    //   no false matches inside JS strings.
    var newBuffer = buffer;
    [/(})\s*\n\s*({)/g, /(})({")/g].forEach(function (pat) {
      newBuffer = newBuffer.replace(pat, "$1,\n$2");
    });
    [/(\])\s*\n\s*(\[)/g, /(\])(\[)/g].forEach(function (pat) {
      newBuffer = newBuffer.replace(pat, ",\n");
    });
    if (buffer !== newBuffer) {
      newBuffer = newBuffer.trim();
      if (newBuffer[0] !== '[') {
        newBuffer = '[\n' + newBuffer;
      }
      if (newBuffer.slice(-1) !== ']') {
        newBuffer = newBuffer + '\n]\n';
      }
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
 *    `parseLookup(<string>, <string>)`). Might be empty.
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
      lookupCode += '["' + lookup[i].replace(/"/g, '\\"') + '"]';
    } else {
      lookupCode += '.' + lookup[i];
    }
  }
  try {
    return vm.runInNewContext("(" + JSON.stringify(datum) + ")" + lookupCode);
  } catch (e) {
    if (e.name === 'TypeError') {
      // Skip the following for a lookup 'foo.bar' where 'foo' is undefined:
      //    TypeError: Cannot read property 'bar' of undefined
      // TODO: Are there other potential TypeError's in here to avoid?
      return undefined;
    }
    throw e;
  }
}



/**
 * Print out a single result, considering input options.
 */
function printDatum(datum, opts, sep, alwaysPrintSep) {
  var output = null;
  switch (opts.outputMode) {
  case OM_INSPECT:
    output = util.inspect(datum, false, Infinity, true);
    break;
  case OM_JSON:
    if (typeof datum !== 'undefined') {
      output = JSON.stringify(datum, null, opts.jsonIndent);
    }
    break;
  case OM_COMPACT:
    // Dev Note: A still relatively experimental attempt at a more
    // compact ouput somewhat a la Python's repr of a dict. I.e. try to
    // fit elements on one line as much as reasonable.
    if (datum === undefined) {
      // pass
    } else if (Array.isArray(datum)) {
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


var stdoutFlushed = true;
function emit(s) {
  // TODO:PERF If this is try/catch is too slow (too granular): move up to
  //    mainline and be sure to only catch this particular error.
  try {
    stdoutFlushed = process.stdout.write(s);
  } catch (e) {
    // Handle any exceptions in stdout writing in the "error" event above.
  }
}

process.stdout.on("error", function (err) {
  if (err.code === "EPIPE") {
    // Pass. See <https://github.com/trentm/json/issues/9>.
  } else {
    warn(err)
    drainStdoutAndExit(1);
  }
});


/**
 * A hacked up version of "process.exit" that will first drain stdout
 * before exiting. *WARNING: This doesn't stop event processing.* IOW,
 * callers have to be careful that code following this call isn't
 * accidentally executed.
 *
 * In node v0.6 "process.stdout and process.stderr are blocking when they
 * refer to regular files or TTY file descriptors." However, this hack might
 * still be necessary in a shell pipeline.
 */
function drainStdoutAndExit(code) {
  process.stdout.on('drain', function () {
    process.exit(code);
  });
  if (stdoutFlushed) {
    process.exit(code);
  }
}



//---- mainline

function main(argv) {
  var opts;
  try {
    opts = parseArgv(argv);
  } catch (e) {
    warn("json: error: %s", e.message)
    return drainStdoutAndExit(1);
  }
  //warn(opts);
  if (opts.help) {
    printHelp();
    return;
  }
  if (opts.version) {
    util.puts("json " + getVersion());
    return;
  }
  var lookupStrs = opts.args;

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
        // Use JSON-js' "json_parse" parser to get more detail on the
        // syntax error.
        var details = "";
        var normBuffer = buffer.replace(/\r\n|\n|\r/, '\n');
        try {
          json_parse(normBuffer);
          details = input.error;
        } catch(err) {
          // err.at has the position. Get line/column from that.
          var at = err.at - 1;  // `err.at` looks to be 1-based.
          var lines = buffer.split('\n');
          var line, col, pos = 0;
          for (line = 0; line < lines.length; line++) {
            pos += lines[line].length + 1;
            if (pos > at) {
              col = at - (pos - lines[line].length - 1);
              break;
            }
          }
          var spaces = '';
          for (var i=0; i<col; i++) {
            spaces += '.';
          }
          details = err.message+" at line "+(line+1)+", column "+(col+1)
            + ":\n\t"+lines[line]+"\n\t"+spaces+"^";
        }
        warn("json: error: input is not JSON: %s", details);
      }
      emit(buffer);
      if (buffer.length && buffer[buffer.length-1] !== "\n") {
        emit('\n');
      }
      return drainStdoutAndExit(1);
    }
    var data = input.datum;

    // Process: executable (-e).
    var i, j;
    var exeScripts = [];
    for (i = 0; i < opts.exeSnippets.length; i++) {
      exeScripts[i] = vm.createScript(opts.exeSnippets[i]);
    }
    if (!exeScripts.length) {
      /* pass */
    } else if (opts.array || (opts.array === null && Array.isArray(data))) {
      var arrayified = false;
      if (!Array.isArray(data)) {
        arrayified = true;
        data = [data];
      }
      for (i = 0; i < data.length; i++) {
        var datum = data[i];
        for (j = 0; j < exeScripts.length; j++) {
          exeScripts[j].runInNewContext(datum);
        }
      }
      if (arrayified) {
        data = data[0];
      }
    } else {
      for (j = 0; j < exeScripts.length; j++) {
        exeScripts[j].runInNewContext(data);
      }
    }

    // Process: conditionals (-c).
    var condScripts = [];
    for (i = 0; i < opts.condSnippets.length; i++) {
      condScripts[i] = vm.createScript(opts.condSnippets[i]);
    }
    if (!condScripts.length) {
      /* pass */
    } else if (opts.array || (opts.array === null && Array.isArray(data))) {
      var arrayified = false;
      if (!Array.isArray(data)) {
        arrayified = true;
        data = [data];
      }
      var filtered = [];
      for (i = 0; i < data.length; i++) {
        var datum = data[i];
        var datumCopy = objCopy(datum);
        var keep = true;
        for (j = 0; j < condScripts.length; j++) {
          if (! condScripts[j].runInNewContext(datumCopy)) {
            keep = false;
            break;
          }
        }
        if (keep) {
          filtered.push(datum);
        }
      }
      if (arrayified) {
        data = (filtered.length ? filtered[0] : undefined);
      } else {
        data = filtered;
      }
    } else {
      var keep = true;
      var dataCopy = objCopy(data);
      for (j = 0; j < condScripts.length; j++) {
        if (! condScripts[j].runInNewContext(dataCopy)) {
          keep = false;
          break;
        }
      }
      if (!keep) {
        data = undefined;
      }
    }

    // Process: lookups
    var lookupsAreIndeces = false;
    var lookups = lookupStrs.map(function(lookup) {
        return parseLookup(lookup, opts.lookupDelim);
    });
    if (lookups.length) {
      if (opts.array) {
        if (!Array.isArray(data)) data = [data];
        var table = [];
        for (j=0; j < data.length; j++) {
          var datum = data[j];
          var row = {};
          for (i=0; i < lookups.length; i++) {
            var lookup = lookups[i];
            var value = lookupDatum(datum, lookup);
            if (value !== undefined) {
              row[lookup.join('.')] = value;
            }
          }
          table.push(row);
        }
        data = table;
      } else {
        // Special case handling: Note if the "lookups" are indeces into an
        // array. This may be used below to change the output representation.
        if (Array.isArray(data)) {
          lookupsAreIndeces = true;
          for (i = 0; i < lookups.length; i++) {
            if (lookups[i].length !== 1 || isNaN(Number(lookups[i]))) {
              lookupsAreIndeces = false;
              break;
            }
          }
        }
        var row = {};
        for (i = 0; i < lookups.length; i++) {
          var lookup = lookups[i];
          var value = lookupDatum(data, lookup);
          if (value !== undefined) {
            row[lookup.join('.')] = value;
          }
        }
        data = row;
      }
    }

    // Output
    if (opts.outputMode === OM_JSON) {
      if (lookupsAreIndeces) {
        // Special case: Lookups that are all indeces into an input array
        // are more likely to be wanted as an array of selected items rather
        // than a "JSON table" thing that we use otherwise.
        var flattened = [];
        for (i = 0; i < lookups.length; i++) {
          var lookupStr = lookups[i].join('.');
          if (data.hasOwnProperty(lookupStr)) {
            flattened.push(data[lookupStr])
          }
        }
        data = flattened;
      }
      // If JSON output mode, then always just output full set of data to
      // ensure valid JSON output.
      printDatum(data, opts, '\n', false);
    } else if (lookups.length) {
      if (opts.array) {
        // Output `data` as a "table" of lookup results.
        for (j = 0; j < data.length; j++) {
          var row = data[j];
          for (i = 0; i < lookups.length-1; i++) {
            printDatum(row[lookups[i].join('.')], opts, opts.delim, true);
          }
          printDatum(row[lookups[i].join('.')], opts, '\n', true);
        }
      } else {
        for (i = 0; i < lookups.length; i++) {
          printDatum(data[lookups[i].join('.')], opts, '\n', false);
        }
      }
    } else if (opts.array) {
      if (!Array.isArray(data)) data = [data];
      for (j = 0; j < data.length; j++) {
        printDatum(data[j], opts, '\n', false);
      }
    } else {
      // Output `data` as is.
      printDatum(data, opts, '\n', false);
    }
  });
}

if (require.main === module) {
  // HACK guard for <https://github.com/trentm/json/issues/24>.
  // We override the `process.stdout.end` guard that core node.js puts in
  // place. The real fix is that `.end()` shouldn't be called on stdout
  // in node core. Hopefully node v0.6.9 will fix that. Only guard
  // for v0.6.0..v0.6.8.
  var nodeVer = process.versions.node.split('.').map(Number);
  if ([0,6,0] <= nodeVer && nodeVer <= [0,6,8]) {
    var stdout = process.stdout;
    stdout.end = stdout.destroy = stdout.destroySoon = function() {
      /* pass */
    };
  }

  main(process.argv);
}
