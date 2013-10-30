// NASA MOD DD2 Digital Signage
//
// Ben Rhoads
//
// pi.js
// Object to represent a Pi
//
// Provides:
//	send - launches XBMC notification on the given Pi

http = require('http');

module.exports = (function() {

	var ip = "127.0.0.1";
	var piDee = "-1";
	var loc = "JSC";
	var org = "DD";

	callJSONRPC = function(data, callback){
		//HTTP Request Information
		var options = {
			host: ip,
			path: '/jsonrpc',
			method: 'POST',
			port: 80,
			headers: {
				"Content-Type":"application/json"
			}
		}
		var dataString = JSON.stringify(data);
		
		var outreq = http.request(options, function(res){
			var body =''; //Response body
			res.on('data',function(data){
				data ? body+=data : '';
			});
			res.on('end',function(){
				var returnedJSON = JSON.parse(body);
				if(returnedJSON.result != 'OK'){
					throw "XBMC JSON Parsing Error";
				}
				
				callback ? callback() : '';
				
			});
		});
		
		outreq.on('error',function(e) {
			throw "Error sending notification";
		});
		
		outreq.write(dataString);
		outreq.end();
	}

	// sendNotification: string, string, integer -> boolean
	// Sends a notification to the given address with the given message and timeouts
	// INPUT: ip - IP address of the Pi running XBMC
	// INPUT: message - [OPTIONAL] message to be displayed in the notification
	// INPUT: timeout - [OPTIONAL] duration of notification on screen
	// OUTPUT: returns true on successful JSONRPC call, returns false on error
	// Examples:
	//		sendNotification("192.168.0.1") -> Sends default notification to IP with default timeout
	//		sendNotification("192.168.0.1","Test",Testing") -> Sends "Testing" as the notification to Pi at IP 192.168.0.1 with title of "TesT"
	//		sendNotification("192.168.0.1","Test","Testing",500) -> Sends "Testing" as the notification with a timeout of .5 second
	sendNotification = function(ip, title, message, duration){
		//Defaults
		var defaultTitle = "Restart Required";
		var defaultMessage = "Please change your settings and restart your pi";
		var defaultDuration = 10000;
		
		var data = {
			jsonrpc: "2.0",
			id: "1",
			method: "GUI.ShowNotification",
			params: {
				title: title || defaultTitle,
				message: message || defaultMessage,
				displaytime: duration || defaultDuration
			}
		};

		callJSONRPC(data);		
	};
	
	playMedia = function(){
		var data = {
			jsonrpc: "2.0",
			id: "1",
			method: "Addons.ExecuteAddon",
			params: {
				wait: true,
				addonid: "service.diital.signage",
				params: ["play"]
			}
		};
		
		callJSONRPC(data);
	};
	
	playEmergency = function(){
		var data = {
			jsonrpc: "2.0",
			id: "0",
			method: "Addons.ExecuteAddon",
			params: {
				wait: true,
				addonid: "service.digital.signage",
				params: ["emergency"]
			}
		};
		
		callJSONRPC(data);
	};
	
	playIPTV = function(){
		var data = {
			jsonrpc: "2.0",
			id: "0",
			method: "Addons.ExecuteAddon",
			params: {
				wait: true,
				addonid: "service.digital.signage",
				params: ["iptv"]
			}
		};
		
		callJSONRPC(data);
	}	
	
	setPiDee = function(piDee){
		var data = {
			jsonrpc: "2.0",
			id: "0",
			method: "Addons.ExecuteAddon",
			params: {
				wait: true,
				addonid: "service.digital.signage",
				params: ["piDee", piDee.toString()]
			}
		};
		
		callJSONRPC(data);	
	}
	
	//Need test written for these 8
	getIP = function(){return ip;}
	getLoc = function(){return loc;}
	getOrg = function(){return org;}
	getPiDee = function(){return piDee;}
	setIP=function(){this.ip=ip;}
	setLoc=function(){this.loc=loc;}
	setOrg=function(){this.org=org;}
	
	return {
		sendNotification : sendNotification,
		playMedia : playMedia,
		playEmergency : playEmergency,
		playIPTV : playIPTV,
		setPiDee : setPiDee,
		getIP : getIP,
		getLoc : getLoc,
		getOrg : getOrg,
		getPiDee : getPiDee,
		setIP : setIP,
		setLoc : setLoc,
		setOrg : setOrg
	};
}());
