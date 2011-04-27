test:
	NODE_PATH=node_modules node_modules/.bin/nodeunit test.js

# Test will all node versions (presumes install locations I use on my machine).
testall: test05 test04 test03


test05:
	NODE_PATH=node_modules PATH="$(HOME)/opt/node-0.5/bin:$(PATH)" node_modules/.bin/nodeunit test.js
test04:
	NODE_PATH=node_modules PATH="$(HOME)/opt/node-0.4/bin:$(PATH)" node_modules/.bin/nodeunit test.js
test03:
	NODE_PATH=node_modules PATH="$(HOME)/opt/node-0.3/bin:$(PATH)" node_modules/.bin/nodeunit test.js
test02:
	@echo "* * *"
	@echo "It is a known issue that test 'utf8' fails with node 0.2. Don't use node 0.2. :)"
	@echo "* * *"
	NODE_PATH=node_modules PATH="$(HOME)/opt/node-0.2/bin:$(PATH)" node_modules/.bin/nodeunit test.js

.PHONY: test
