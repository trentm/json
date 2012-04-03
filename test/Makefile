
NODEUNIT=../node_modules/nodeunit/bin/nodeunit

.PHONY: test
test:
	NODE_PATH=node_modules $(NODEUNIT) test.js

# Test will all node versions (presumes install locations I use on my machine).
.PHONY: testall
testall: test06 test04 test07 testmaster


.PHONY: testmaster
testmaster:
	@echo "# Test node master (with node `$(HOME)/opt/node-master/bin/node --version`)"
	PATH="$(HOME)/opt/node-master/bin:$(PATH)" $(NODEUNIT) test.js
.PHONY: test07
test07:
	@echo "# Test node 0.7.x (with node `$(HOME)/opt/node-0.7/bin/node --version`)"
	PATH="$(HOME)/opt/node-0.7/bin:$(PATH)" $(NODEUNIT) test.js
.PHONY: test06
test06:
	@echo "# Test node 0.6.x (with node `$(HOME)/opt/node-0.6/bin/node --version`)"
	PATH="$(HOME)/opt/node-0.6/bin:$(PATH)" $(NODEUNIT) test.js
.PHONY: test04
test04:
	@echo "# Test node 0.4.x (with node `$(HOME)/opt/node-0.4/bin/node --version`)"
	PATH="$(HOME)/opt/node-0.4/bin:$(PATH)" $(NODEUNIT) test.js
