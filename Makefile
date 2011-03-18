test:
	(cd test && make test)

tag:
	grep "var VERSION =" json | awk -F'"' '{print $$2}' > VERSION
	git tag -a "`cat VERSION`" -m "version `cat VERSION`"
	rm VERSION
	@echo "* * * Remember to 'git push --tags origin master'. * * *"

.PHONY: test tag
