help:
	@echo "json Makefile"
	@echo ""
	@echo "test     run the test suite"
	@echo "tag      create a git tag for current version"

test:
	(cd test && make test)

tag:
	grep "var VERSION =" json | awk -F'"' '{print $$2}' > VERSION
	git tag -a "`cat VERSION`" -m "version `cat VERSION`"
	rm VERSION
	@echo "* * * Remember to 'git push --tags origin master'. * * *"

.PHONY: test tag
