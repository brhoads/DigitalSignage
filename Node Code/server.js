//--------------------------------------------------------------------------------------------------
// Dependencies
var http = require('http');
var fs = require('fs');
var S = require('string');
var util = require('util');
var querystring = require('querystring');
var sqlite3 = require('sqlite3').verbose();
var mkdirp = require('mkdirp');
var path = require('path');
var findit2 = require('findit2');
var hound = require('hound');
var fwd = require('./lib/filewatchdog.js');
var database = require('./lib/database.js');
var express = require('express');
var Pi = require('./lib/pi.js');

//--------------------------------------------------------------------------------------------------
// Constants
var DATABASE = "C:\\DigitalSignage\\media\\digitalSignage_dev.db";
//Location on machine running Node.js server
var MEDIA_ROOT = "C:\\DigitalSignage\\media\\piFilling";
var ORG_ROOT = "C:\\DigitalSignage\\media\\piFilling\\Org";
var LOC_ROOT = "C:\\DigitalSignage\\media\\piFilling\\Location";
var EMERG_ROOT = "C:\\DigitalSignage\\media\\piFilling\\EmergencyOverride";
var NASA_LOGO = "C:\\DigitalSignage\\media\\piFilling\\nasameatball.png";
//this holds the folders with the symlinks the pi accesses  
var PIFOLDERS_ROOT = "C:\\DigitalSignage\\media\\piFolders";
//Location where the Pi can access the folders above, either SMB share or NFS
//	If NFS, the share must be mounted
var NFS_MNT_ROOT = "/media"

//--------------------------------------------------------------------------------------------------
// Pi Database Initialization
var db = new sqlite3.Database(DATABASE);
//Create Pidentiies if it is missing and add IPTV table & channels
database.init(DATABASE, fs, db);

//-------------------------------------------------------------------------------------------------
// Hound Filesystem Watching
watcher = hound.watch(MEDIA_ROOT);
fwd.init(fs, db, path);
watcher.on('create',fwd.updateFoldersCreate);
watcher.on('delete',fwd.updateFoldersDelete);

//Create the HTTP servers for the Emergency webpage and the Pi HTTP requests
var emergencyServer = express();
var piServer = express();

//--------------------------------------------------------------------------------------------------
// Pi JSON Server
piServer.listen(8123);
piServer.use(express.bodyParser());
piServer.post('/',function(request, response){
	//Check for Proper request from Pi
	if(request.body.hasOwnProperty('location') &&
	   request.body.hasOwnProperty('org') &&
	   request.body.hasOwnProperty('piip') &&
	   request.body.hasOwnProperty('piDee')){
		//We have a good request
		
		var newPi = new Pi(request.body.piip, request.body.location, request.body.org, request.body.piDee);
		//If the piDee === -1 we have a fresh Pi
		if(newPi.getPiDee === "-1"){
			console.log('New Pi at '+request.body.piip);
			
			db.serialize(function(){
				newPi.setNewPidee(db, response);
				
			});
			
		} else {
			//Compare the new Pi JSON we received to what was in the DB
			var oldPi = new Pi();
			db.serialize(function(){
				oldPi.createFromDB(newPi.getPiDee(), db);
				while(!oldPi.getOrg()){
					setcontinue;
				}
				console.log('Old Pi: '+oldPi.getIP()+oldPi.getLoc()+oldPi.getOrg());
				console.log('New Pi: '+newPi.getIP()+newPi.getLoc()+newPi.getOrg());
			});
			
			response.send('Many of the truths we cling to depend on our point of view - Yoda');
		}
	} else {
		//We have a bad request
		console.log('ERROR: Bad Request on port 8124\n\t'+JSON.stringify(request.body));
		response.send('ERROR: Bad Request on port 8124\n\t'+JSON.stringify(request.body));
	}
});

//--------------------------------------------------------------------------------------------------
// Emergency Web Server
emergencyServer.listen(8080);
emergencyServer.get('/',function(request, response){
	response.send('<html><body>Testing Emergency</body></html>');
});

