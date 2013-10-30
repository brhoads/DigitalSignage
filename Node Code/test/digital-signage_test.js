'use strict';

var pi = require('../lib/pi.js');
var nock = require('nock');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['Checking JSONRPC Calls'] = {
  setUp: function(done) {
    //Setup JSON RPC
	var jsonsuccess = nock('http://127.0.0.1')
			.filteringRequestBody(function(path){
				return '*';
			})
			.post('/jsonrpc','*')
			.times(4)
			.reply(200,{id:1,jsonrpc:"2.0",result:"OK"});

			var jsonfailure = nock('http://127.0.0.2')
			.filteringRequestBody(function(path){
				return '*';
			})
			.post('/jsonrpc','*')
			.times(4)
			.reply(200,{"error":{"code":-32601,"message":"Method not found."},"id":"1","jsonrpc":"2.0"});
			
    done();
  },
  'correctly sends JSONRPC notification': function(test) {
    test.expect(5);
    // Test should be added to check for proper JSON going out
	pi.setIP('127.0.0.1');
    test.doesNotThrow(function(){pi.sendNotification();});
	test.doesNotThrow(function(){pi.playMedia();});
	test.doesNotThrow(function(){pi.playEmergency();});
	test.doesNotThrow(function(){pi.playIPTV();});
	test.doesNotThrow(function(){pi.setPiDee(5);});
    test.done();
  },
  'knows JSONRPC error occured': function(test) {
	test.expect(5);
	pi.setIP('127.0.0.2');
	test.throws(pi.sendNotification());
	test.throws(pi.playMedia());
	test.throws(pi.playEmergency());
	test.throws(pi.playIPTV());
	test.throws(pi.setPiDee(5));
	test.done();
  },
  
  
};