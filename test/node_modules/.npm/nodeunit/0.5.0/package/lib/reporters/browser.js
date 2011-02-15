/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 *
 * THIS FILE SHOULD BE BROWSER-COMPATIBLE JS!
 * You can use @REMOVE_LINE_FOR_BROWSER to remove code from the browser build.
 * Only code on that line will be removed, its mostly to avoid requiring code
 * that is node specific
 */


/**
 * NOTE: this test runner is not listed in index.js because it cannot be
 * used with the command-line tool, only inside the browser.
 */


/**
 * Reporter info string
 */

exports.info = "Browser-based test reporter";


exports.addStyles = function () {
    document.body.innerHTML += '<style type="text/css">' +
        'body {' +
            'font-size: 12px;' +
            'font-family: "Helvetica Neue", sans-serif;' +
            'border-bottom: 1px solid white;' +
            'padding: 0;' +
            'margin: 0;' +
        '}' +
        '#summary {' +
            'padding: 20px;' +
            'margin: 0;' +
            'background-color: #ccc;' +
            'color: black;' +
            'font-size: 20px;' +
            'font-family: "Helvetica Neue", sans-serif;' +
        '}' +
        '#summary.failures { background-color: red; }' +
        '#summary.ok { background-color: green; }' +
        'h2 {' +
            'margin: 0;' +
            'padding: 6px 20px;' +
        '}' +
        'pre {' +
            'font-size: 12px;' +
            'font-family: "Andale Mono", monospace;' +
            'margin-left: 12px;' +
            'padding-left: 12px;' +
            'margin: 0;' +
        '}' +
        '.assertion_message { margin-left: 12px; }' +
        'ol {' +
            'list-style: none;' +
            'margin: 0;' +
            'padding: 0;' +
        '}' +
        'ol li { padding: 6px 20px; }' +
        'ol li.pass { background-color: #eee; }' +
        'ol li.fail { background-color: red; }' +
        'ol li.pass:before { content: "\\2714 \\0020"; }' +
        'ol li.fail:before { content: "\\2716 \\0020"; }' +
    '</style>';
};


/**
 * Run all tests within each module, reporting the results
 *
 * @param {Array} files
 * @api public
 */

exports.run = function (modules, options) {
    var start = new Date().getTime();
    exports.addStyles();

    var results, module, summary;

    summary = document.createElement('div');
    summary.id = 'summary';
    summary.innerText = 'Running tests...';
    document.body.appendChild(summary);

    results = document.createElement('div');
    results.id = 'results';
    document.body.appendChild(results);

    nodeunit.runModules(modules, {
        moduleStart: function (name) {
            var mheading = document.createElement('h2');
            mheading.innerText = name;
            results.appendChild(mheading);
            module = document.createElement('ol');
            results.appendChild(module);
        },
        testDone: function (name, assertions) {
            var test = document.createElement('li');
            if (!assertions.failures()) {
                test.className = 'pass';
                test.innerText = name;
            }
            else {
                test.className = 'fail';
                var html = name;
                for (var i=0; i<assertions.length; i++) {
                    var a = assertions[i];
                    if (a.failed()) {
                        if (a.error instanceof assert.AssertionError && a.message) {
                            html += '<div class="assertion_message">' +
                                'Assertion Message: ' + a.message +
                            '</div>';
                        }
                        html += '<pre>';
                        html += a.error.stack || a.error;
                        html += '</pre>';
                    }
                };
                test.innerHTML = html;
            }
            module.appendChild(test);
        },
        done: function (assertions) {
            var end = new Date().getTime();
            var duration = end - start;

            if (assertions.failures()) {
                summary.className = 'failures';
                summary.innerText = 'FAILURES: '  + assertions.failures() +
                    '/' + assertions.length + ' assertions failed (' +
                    assertions.duration + 'ms)';
            }
            else {
                summary.className = 'ok';
                summary.innerText = 'OK: ' + assertions.length +
                    ' assertions (' + assertions.duration + 'ms)';
            }
        }
    });
};
