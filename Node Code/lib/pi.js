// NASA MOD DD2 Digital Signage
//
// Ben Rhoads
//
// pi.js
// Object to represent a Pi
//
// Provides:
//	send - launches XBMC notification on the given Pi

q = require('q');
Pi.http = require('http');

function Pi(ip, location, org, piDee, isolated) {
	this.ip = ip;
	this.location = location;
	this.org = org;
	this.piDee = piDee;
	this.http = '';
	
	if(typeof isolated !== 'undefined'){
		if(isolated === 'true'){
			this.isolated=1;
		} else {
			this.isolated=0;
		}
	} else {
		this.isolated=0;
	}
}

Pi.prototype.setDependencies = function(http){
	this.http = http;
};

Pi.prototype.createFromDB = function(piDee, db){
	var self = this;
	
	var promise = q.defer();
	
	var stmt = db.prepare("SELECT ipaddress, location, orgcode, isolated FROM Pidentities WHERE rowid = "+piDee);
	stmt.get(function(err, row){
		
		if(err){
			console.log('ERROR: Could not recreate from DB'+err);
			promise.reject(err);
		}
		
		self.ip = row.ipaddress;
		self.location = row.location;
		self.org = row.orgcode;
		self.isolated = row.isolated;
		self.piDee = piDee;
		promise.resolve(self);
	});
	
	return promise.promise	
};

Pi.prototype.getNewPidee = function(db, res){
	
	var self = this;
	
	var promise = q.defer();
	
	try {
		db.run("INSERT INTO Pidentities (ipaddress, location, orgcode, timestamp, pifolder, mediapath, isolated) VALUES ('"+this.ip +"','"+this.location+"','"+this.org+"', datetime('now'),'c:/pifolder','c:/mediapath','"+this.isolated+"')",function(error){
			if(error){
				console.log('ERROR: Error inserting Pi ('+self.ip+') into database: '+error);
				self.sendNotification("Error adding to database","Please contant DD2 for assistance",10000);
				promise.reject(error);
			}

			promise.resolve(this.lastID);
		});
	} catch(e) {
		console.log("ERROR: Fatal error in setNewPidee");
	}
	
	return promise.promise;
};

Pi.prototype.updateDB = function(db, ip, location, organization){	
	
	var promise = q.defer();
	
	var piip = (this.ip || ip);
	var loc = (this.location || location);
	var org = (this.org || organization);	
	
	var self = this;
	
	db.run("UPDATE Pidentities SET location = '" + loc + "', orgcode = '" + org + "', ipaddress = '" + piip + "' WHERE rowid =  " + this.piDee, function(){
		promise.resolve(self);
	});
	
	return promise.promise;
};

Pi.prototype.callJSONRPC = function(data){
	
	var promise = q.defer();
	
	//HTTP Request Information
	var options = {
		host: this.ip,
		path: '/jsonrpc',
		method: 'POST',
		port: 80,
		headers: {
			"Content-Type":"application/json"
		}
	}
	var dataString = JSON.stringify(data);
	
	var outreq = Pi.http.request(options, function(res){
		var body =''; //Response body
		res.on('data',function(data){
			data ? body+=data : '';
		});
		res.on('end',function(){
			var returnedJSON = JSON.parse(body);
			if(returnedJSON.result != 'OK'){
				promise.reject('XBMC JSON Error');
				throw "XBMC JSON Parsing Error" + dataString + body;
			}
			promise.resolve(true);
		});
	});
	
	outreq.on('error',function(e) {
		console.log('ERROR: sending JSONRPC Request: '+dataString+' to '+options.host);
		console.log('ERROR: '+e);
		promise.reject(e);
	});
	
	outreq.write(dataString);
	outreq.end();
	
	return promise.promise;
};

/* sendNotification: string, string, integer -> boolean
// Sends a notification to the given address with the given message and timeouts
// INPUT: ip - IP address of the Pi running XBMC
// INPUT: message - [OPTIONAL] message to be displayed in the notification
// INPUT: timeout - [OPTIONAL] duration of notification on screen
// OUTPUT: returns true on successful JSONRPC call, returns false on error
// Examples:
//		sendNotification("192.168.0.1") -> Sends default notification to IP with default timeout
//		sendNotification("192.168.0.1","Test",Testing") -> Sends "Testing" as the notification to Pi at IP 192.168.0.1 with title of "TesT"
//		sendNotification("192.168.0.1","Test","Testing",500) -> Sends "Testing" as the notification with a timeout of .5 second */
Pi.prototype.sendNotification = function(title, message, duration){
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
	
	return this.callJSONRPC(data);
};
Pi.prototype.playMedia = function(){
	var data = {
		jsonrpc: "2.0",
		id: "1",
		method: "Addons.ExecuteAddon",
		params: {
			wait: true,
			addonid: "service.digital.signage",
			params: ["play"]
		}
	};
	
	return this.callJSONRPC(data);
};
Pi.prototype.playEmergency = function(){
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
	
	return this.callJSONRPC(data);
};
Pi.prototype.playIPTV = function(){
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
	
	return this.callJSONRPC(data);
};	
Pi.prototype.setPiDeeJSON = function(){
	var data = {
		jsonrpc: "2.0",
		id: "0",
		method: "Addons.ExecuteAddon",
		params: {
			wait: true,
			addonid: "service.digital.signage",
			params: ["piDee", this.piDee.toString()]
		}
	};
	
	return this.callJSONRPC(data);		
}
Pi.prototype.getIP = function(){return this.ip;}
Pi.prototype.getLoc = function(){return this.location;}
Pi.prototype.getOrg = function(){return this.org;}
Pi.prototype.getPiDee = function(){return this.piDee;}
Pi.prototype.setIP = function(){this.ip=ip;}
Pi.prototype.setLoc = function(){this.loc=loc;}
Pi.prototype.setOrg = function(){this.org=org;}
Pi.prototype.getIsolated = function(){return this.isolated;}

module.exports = Pi;