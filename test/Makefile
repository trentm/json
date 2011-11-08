
NODEUNIT=../node_modules/nodeunit/bin/nodeunit

test:
	NODE_PATH=node_modules $(NODEUNIT) test.js

# Test will all node versions (presumes install locations I use on my machine).
testall: test06 test05 test04


test06:
	@echo "# Test node 0.6.x (with node `$(HOME)/opt/node-0.6/bin/node --version`)"
	PATH="$(HOME)/opt/node-0.6/bin:$(PATH)" $(NODEUNIT) test.js
test05:
	@echo "# Test node 0.5.x (with node `$(HOME)/opt/node-0.5/bin/node --version`)"
	PATH="$(HOME)/opt/node-0.5/bin:$(PATH)" $(NODEUNIT) test.js
test04:
	@echo "# Test node 0.4.x (with node `$(HOME)/opt/node-0.4/bin/node --version`)"
	PATH="$(HOME)/opt/node-0.4/bin:$(PATH)" $(NODEUNIT) test.js

.PHONY: test
