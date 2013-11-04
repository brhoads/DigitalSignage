// NASA MOD DD2 Digital Signage
//
// Ben Rhoads
//
// pi.js
// Object to represent a Pi
//
// Provides:
//	send - launches XBMC notification on the given Pi

function Pi(ip, location, org, piDee) {
	this.ip = ip;
	this.location = location;
	this.org = org;
	this.piDee = piDee;
	this.http = '';
}

Pi.http = require('http');

Pi.prototype.setDependencies = function(http){
	this.http = http;
};

Pi.prototype.createFromDB = function(piDee, db){
	var self = this;
	var stmt = db.prepare("SELECT ipaddress, location, orgcode FROM Pidentities WHERE rowid = "+piDee);
	stmt.get(function(err, row){
		self.ip = row.ipaddress;
		self.location = row.location;
		self.org = row.orgcode;
	});
};

Pi.prototype.setNewPidee = function(db, res){
	
	var self = this;

	try {
		db.run("INSERT INTO Pidentities (ipaddress, location, orgcode, timestamp, pifolder, mediapath) VALUES ('"+this.ip +"','"+this.loc+"','"+this.org+"', datetime('now'),'c:/pifolder','c:/mediapath')",function(error){
			if(error){
				console.log('ERROR: Error inserting Pi ('+self.ip+') into database: '+error);
				self.sendNotification("Error adding to database","Please contant DD2 for assistance",10000);
			}
			
			self.piDee = this.lastID;
			self.setPiDeeJSON(self.piDee);
			
			console.log('NOTICE: New piDee: '+self.piDee);
			res.type('application/json');
			res.send('{"piDee":'+self.piDee+'}');
		});
	} catch(e) {
		console.log("ERROR: Fatal error in setNewPidee");
	}
};

Pi.prototype.updateDB = function(piDee,db, ip, location, organization){	
	var piip = (this.ip || ip);
	var loc = (this.location || location);
	var org = (this.org || organization);	
	
	db.run("UPDATE Pidentities SET location = '" + loc + "', orgcode = '" + org + "', ipaddress = '" + piip + "' WHERE rowid =  " + piDee);
};

Pi.prototype.callJSONRPC = function(data, callback){
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
				throw "XBMC JSON Parsing Error" + dataString;
			}
			
			callback ? callback() : '';
			
		});
	});
	
	outreq.on('error',function(e) {
		console.log('ERROR: sending JSONRPC Request: '+dataString+' to '+options.host);
		console.log('ERROR: '+e);
	});
	
	outreq.write(dataString);
	outreq.end();
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
	
	try {
		this.callJSONRPC(data);
	} catch (e) {
		throw e;
	}
};
Pi.prototype.playMedia = function(){
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
	
	try {
		this.callJSONRPC(data);
	} catch (e) {
		throw e;
	}
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
	
	try {
		this.callJSONRPC(data);
	} catch (e) {
		throw e;
	}
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
	
	try {
		this.callJSONRPC(data);
	} catch (e) {
		throw e;
	}
};	
Pi.prototype.setPiDeeJSON = function(piDee){
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
	
	try {
		this.callJSONRPC(data);
	} catch (e) {
		throw e;
	}	
}
Pi.prototype.getIP = function(){return this.ip;}
Pi.prototype.getLoc = function(){return this.location;}
Pi.prototype.getOrg = function(){return this.org;}
Pi.prototype.getPiDee = function(){return this.piDee;}
Pi.prototype.setIP = function(){this.ip=ip;}
Pi.prototype.setLoc = function(){this.loc=loc;}
Pi.prototype.setOrg = function(){this.org=org;}

module.exports = Pi;