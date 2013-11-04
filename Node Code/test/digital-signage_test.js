'use strict';

var http = require('http');
var nock = require('nock');
var Pi = require('../lib/pi.js');

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

var pi1;
var pi2;

exports['Checking JSONRPC Calls'] = {
  setUp: function(done) {
    //Setup JSON RPC Nocking
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
	//Initialize the Pis
	pi1 = new Pi('127.0.0.1','JSC','DD','-1');
	pi2 = new Pi('127.0.0.2','JSC','DD','-1');
	pi1.setDependencies(http);
	pi2.setDependencies(http);
	
    done();
  },
  'correctly sends JSONRPC notification': function(test) {
    test.expect(5);
    // Test should be added to check for proper JSON going out
    test.doesNotThrow(function(){pi1.sendNotification();});
	test.doesNotThrow(function(){pi1.playMedia();});
	test.doesNotThrow(function(){pi1.playEmergency();});
	test.doesNotThrow(function(){pi1.playIPTV();});
	test.doesNotThrow(function(){pi1.setPiDeeJSON(5);});
    test.done();
  },
  'knows JSONRPC error occured': function(test) {
	test.expect(4);
	test.throws(pi2.sendNotification);
	test.throws(pi2.playMedia);
	test.throws(pi2.playEmergency);
	test.throws(pi2.playIPTV);
	//test.throws(function(){pi2.setPiDeeJSON(5);});
	test.done();
  },
  'Property Getters return expected Defaults':function(test) {
	test.expect(4);
	test.equal(pi1.getIP(),'127.0.0.1');
	test.equal(pi1.getLoc(),'JSC');
	test.equal(pi1.getOrg(),'DD');
	test.equal(pi1.getPiDee(),'-1');
	test.done();
  }  
};