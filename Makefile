help:
	@echo "jsontool Makefile"
	@echo ""
	@echo "docs     rebuild the man page (from ronn source)"
	@echo "test     run the test suite"
	@echo "tag      create a git tag for current version"

node_modules/.bin/ronn:
	npm install
node_modules/.bin/nodeunit:
	npm install

# Ensure jsontool.js and package.json have the same version.
versioncheck:
	@[[ `cat package.json | bin/json version` == `grep '^var VERSION' lib/jsontool.js | awk -F'"' '{print $$2}'` ]]

docs: node_modules/.bin/ronn
	mkdir -p man/man1
	node_modules/.bin/ronn -r json.1.ronn > man/man1/json.1
	@echo "# test with 'man man/man1/json.1'"

test: node_modules/.bin/nodeunit
	(cd test && make test)
testall:
	(cd test && make testall)

cut_a_release: versioncheck
	./support/cut_a_release.py -f package.json -f lib/jsontool.js

.PHONY: test cut_a_release
