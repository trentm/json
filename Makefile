
#
# Files, Vars, etc.
#

JSSTYLE_FILES := $(shell find lib test -name "*.js")
NODEOPT ?= $(HOME)/opt


#
# Targets
#

all:
	npm install

node_modules/.bin/uglifyjs:
	npm install
deps/JSON-js/json_parse.js:
	git submodule update --init


.PHONY: docs
docs:
	@[[ `which ronn` ]] || (echo "No 'ronn' on your PATH. Install with 'gem install ronn'" && exit 2)
	mkdir -p man/man1
	ronn --style=toc --manual="json tool manual" --date=$(shell git log -1 --pretty=format:%cd --date=short) --roff --html docs/json.1.ronn
	mv docs/json.1 man/man1/json.1
	python -c 'import sys; h = open("docs/json.1.html").read(); h = h.replace(".mp dt.flush {float:left;width:8ex}", ""); open("docs/json.1.html", "w").write(h)'
	python -c 'import sys; h = open("docs/json.1.html").read(); h = h.replace("</body>", """<a href="https://github.com/trentm/json"><img style="position: absolute; top: 0; right: 0; border: 0;" src="https://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png" alt="Fork me on GitHub"></a></body>"""); open("docs/json.1.html", "w").write(h)'
	@echo "# test with 'man ./man/man1/json.1' and 'open ./docs/json.1.html'"

.PHONY: publish
publish:
	mkdir -p tmp
	[[ -d tmp/json-gh-pages ]] || git clone git@github.com:trentm/json.git tmp/json-gh-pages
	cd tmp/json-gh-pages && git checkout gh-pages && git pull --rebase origin gh-pages
	cp docs/json.1.html tmp/json-gh-pages/index.html
	(cd tmp/json-gh-pages \
		&& git commit -a -m "publish latest docs" \
		&& git push origin gh-pages || true)

.PHONY: test
test:
	./node_modules/.bin/tap test/*.test.js

.PHONY: cutarelease
cutarelease: check-version
	[[ -z `git status --short` ]]  # If this fails, the working dir is dirty.
	@which json 2>/dev/null 1>/dev/null && \
	    ver=$(shell json -f package.json version) && \
	    name=$(shell json -f package.json name) && \
	    publishedVer=$(shell npm view -j $(shell json -f package.json name)@$(shell json -f package.json version) version 2>/dev/null) && \
	    if [[ -n "$$publishedVer" ]]; then \
		echo "error: $$name@$$ver is already published to npm"; \
		exit 1; \
	    fi && \
	    echo "** Are you sure you want to tag and publish $$name@$$ver to npm?" && \
	    echo "** Enter to continue, Ctrl+C to abort." && \
	    read
	ver=$(shell cat package.json | json version) && \
	    date=$(shell date -u "+%Y-%m-%d") && \
	    git tag -a "$$ver" -m "version $$ver ($$date)" && \
	    git push --tags origin && \
	    npm publish

# Update the embedded minified "function json_parse" in lib/json.js.
.PHONY: update_json_parse
update_json_parse: deps/JSON-js/json_parse.js node_modules/.bin/uglifyjs
	@./tools/update_json_parse.js


#---- check

.PHONY: check-jsstyle
check-jsstyle: $(JSSTYLE_FILES)
	./tools/jsstyle -o indent=2,doxygen,unparenthesized-return=0,blank-after-start-comment=0,leading-right-paren-ok $(JSSTYLE_FILES)

# Ensure json.js and package.json have the same version.
.PHONY: check-version
check-version:
	@echo version is: $(shell cat package.json | lib/json.js version)
	[[ `cat package.json | lib/json.js version` == `grep '^## ' CHANGES.md | head -2 | tail -1 | awk '{print $$2}'` ]]
	[[ `cat package.json | lib/json.js version` == `grep '^var VERSION' lib/json.js | awk -F"'" '{print $$2}'` ]]

.PHONY: check
check: check-jsstyle check-version
	@echo "Check ok."

.PHONY: prepush
prepush: check testall
	@echo "Okay to push."
