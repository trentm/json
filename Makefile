all:

node_modules/.bin/nodeunit:
	npm install
node_modules/.bin/uglifyjs:
	npm install
deps/JSON-js/json_parse.js:
	git submodule update --init


# Ensure jsontool.js and package.json have the same version.
.PHONY: versioncheck
versioncheck:
	[[ `cat package.json | bin/json version` == `grep '^var VERSION' lib/jsontool.js | awk -F'"' '{print $$2}'` ]]

.PHONY: docs
docs:
	@[[ `which ronn` ]] || (echo "No 'ronn' on your PATH. Install with 'gem install ronn'" && exit 2)
	mkdir -p man/man1
	ronn --date=$(shell git log -1 --pretty=format:%cd --date=short) --roff --html docs/json.1.ronn
	@echo "# test with 'man ./docs/json.1' and 'open ./docs/json.1.html'"

.PHONY: test testall
test: node_modules/.bin/nodeunit
	(cd test && make test)
testall:
	(cd test && make testall)

.PHONY: cutarelease
cutarelease: versioncheck
	./support/cutarelease.py -f package.json -f lib/jsontool.js

# Update the embedded minified "function json_parse" in lib/jsontool.js.
.PHONY: update_json_parse
update_json_parse: deps/JSON-js/json_parse.js node_modules/.bin/uglifyjs
	@./support/update_json_parse.js
