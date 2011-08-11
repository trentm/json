
NODEUNIT=../node_modules/nodeunit/bin/nodeunit

test:
	NODE_PATH=node_modules $(NODEUNIT) test.js

# Test will all node versions (presumes install locations I use on my machine).
testall: test05 test04 test03


test05:
	@echo "# Test node 0.5.x (with node `$(HOME)/opt/node-0.5/bin/node --version`)"
	PATH="$(HOME)/opt/node-0.5/bin:$(PATH)" $(NODEUNIT) test.js
test04:
	@echo "# Test node 0.4.x (with node `$(HOME)/opt/node-0.4/bin/node --version`)"
	PATH="$(HOME)/opt/node-0.4/bin:$(PATH)" $(NODEUNIT) test.js
test03:
	@echo "# Test node 0.3.x (with node `$(HOME)/opt/node-0.3/bin/node --version`)"
	NODE_PATH=`pwd`/../node_modules PATH="$(HOME)/opt/node-0.3/bin:$(PATH)" $(NODEUNIT) test.js
test02:
	@echo "# Test node 0.2.x (with node `$(HOME)/opt/node-0.2/bin/node --version`)"
	@echo "* * *"
	@echo "It is a known issue that test 'utf8' fails with node 0.2. Don't use node 0.2. :)"
	@echo "* * *"
	NODE_PATH=`pwd`/../node_modules PATH="$(HOME)/opt/node-0.2/bin:$(PATH)" $(NODEUNIT) test.js

.PHONY: test
