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
var q = require('q');

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

//--------------------------------------------------------------------------------------------------
// Hound Filesystem Watching
watcher = hound.watch(MEDIA_ROOT);
fwd.init(fs, db, path);
watcher.on('create',fwd.updateFoldersCreate);
watcher.on('delete',fwd.updateFoldersDelete);

//Create the HTTP servers for the Emergency webpage and the Pi HTTP requests
var emergencyServer = express();
var piServer = express();

function createNewFolder(aPi){
	var promise = q.defer();
	
	var folder_loc = PIFOLDERS_ROOT + path.sep + aPi.getPiDee();
	console.log('Creating folder for '+aPi.getPiDee());
	mkdirp(folder_loc, function(error){
		if(error){
			promise.reject(error);
			console.log('ERROR: '+error);
		} else {
			promise.resolve(true);
		}
	});

	return promise.promise;
}

function deleteFolderMedia(aPi){
	var promise = q.defer();
	console.log('Deleting Media from '+aPi.getPiDee());
	
	//Remove all previous entries in the folder
	fs.readdir(PIFOLDERS_ROOT+path.sep+aPi.getPiDee(),function(err,hits){
		if(hits){
			hits.forEach(function(entry){
				fs.unlink(PIFOLDERS_ROOT+path.sep+aPi.getPiDee()+path.sep+entry, function(err){
					if(err){
						console.log("Error unlinking "+entry+": "+err);
						promise.reject(err);
					}
				});
			});
		}		
		promise.resolve(true);
	});
	
	return promise.promise;
}

function linkFile(aPi, file){
	//If file is Thumbs.db Hulk Smash it (aka drop it)
	if(file.substr(file.length-9) === 'Thumbs.db'){
		return;
	}
	
	//Parse out any improper path separators **WINDOWS SPECIFIC CODE**
	var pathArray = file.replace(/\//g, '\\').split("\\");
	var length = pathArray.length;
	
	//Create a unique filename for each symlink by using the path
	if (length > 3) {
		filename = pathArray[length - 3] + "." + pathArray[length - 2] + "." + pathArray[length - 1];
	} else {
		filename = pathArray[pathArray.length - 1];
	}
	
	//Symlink
	fs.symlink(file.replace(/\//g, '\\'), PIFOLDERS_ROOT + path.sep + aPi.getPiDee() + path.sep + filename, function (err) {
		console.log("Linking: " + PIFOLDERS_ROOT + path.sep + aPi.getPiDee() + path.sep + filename);
		if (err) console.error(err.code);
	});	
}

function findPath(parentDirectory,targetPath){
	var promise = q.defer();
	
	var finder = findit2.find(parentDirectory);
	var foundPath = '';
	
	//Find relative path to org, save in targetPath
    finder.on('directory', function (dir, stat) {
		//Normalize the path
		dir = dir.replace(/\//g, '\\');
		//Break into chunks to check the last appendage
		// C:\\Users\\Someone\\Special = C:,Users,Someone,Special
		pathArray = dir.split('\\');

		//If the directory matches org return
        if (pathArray[pathArray.length-1] == targetPath){
            //We found a match
			foundPath = dir;			
		}
	});
	
	finder.on('end',function(){
		console.log(foundPath);
		foundPath ? promise.resolve(foundPath) : promise.reject('No Path Found');
	});
	
	return promise.promise;
}

function populateOrg(aPi){    
	var paths = new Array();
	var fileFinder = '';
	var targetPath = '';
	var foundPath = '';
	var promise = q.defer();
	console.log('Populating Org...');

	findPath(ORG_ROOT,aPi.getOrg())
	.then(function(data){
		var finder = findit2.find(ORG_ROOT);
		var targetPath = data;
		console.log('We have '+targetPath);
		
		if(aPi.getIsolated()==1){
			//We just store our ONE path
			console.log('Pi was isolated');
			foundPath = targetPath;
			paths.push(targetPath);
		} else {			
			console.log('Pi was not isolated');
			while(targetPath != ORG_ROOT){
				paths.push(targetPath);
				foundPath = targetPath + ';'+foundPath;
				targetPath = path.normalize(targetPath+'\\..');
			}
		}		
	
		finder.on('file',function(file,stat){
			//Normalize the path
			file = file.replace(/\//g, '\\');
			//Check to see if the dirname of the file matches our path
			for(item in paths){
				if(path.dirname(file) === paths[item]){
					linkFile(aPi, file);
				}
			}		
		});

		finder.on('end',function(){
			promise.resolve(foundPath);
		});		
	});
	
	return promise.promise;	
}

function populateLoc(aPi){
	var paths = new Array();
	var fileFinder = '';
	var targetPath = '';
	var foundPath = '';
	var promise = q.defer();
	console.log('Populating Loc...');

	findPath(LOC_ROOT,aPi.getLoc())
	.then(function(data){
		var finder = findit2.find(LOC_ROOT);
		var targetPath = data;
		console.log('We have '+targetPath);
		
		if(aPi.getIsolated()==1){
			//We just store our ONE path
			foundPath = targetPath;
			paths.push(targetPath);
		}
		else {			
			while(targetPath != LOC_ROOT){
				paths.push(targetPath);
				foundPath = targetPath + ';'+foundPath;
				targetPath = path.normalize(targetPath+'\\..');
			}
		}
	
		finder.on('file',function(file,stat){
			//Normalize the path
			file = file.replace(/\//g, '\\');
			//Check to see if the dirname of the file matches our path
			for(item in paths){
				if(path.dirname(file) === paths[item]){
					linkFile(aPi, file);
				}
			}		
		});

		finder.on('end',function(){
			promise.resolve(foundPath);
		});		
	})
	
	return promise.promise;
	
}

function populateFolder(aPi){
	var promise = q.defer();
	var foundPath = '';
	console.log('Populating the folder for '+aPi.getPiDee());
	
	//Clear everything that was in it
	deleteFolderMedia(aPi)
	.then(function(data){
		//Symlink the stuff from Org
		return populateOrg(aPi);
	})
	.then(function(data){
		//Symlink the stuff from Location
		foundPath = foundPath + data;
		return populateLoc(aPi, data);
	})
	.then(function(data){
		console.log('Finshing population');
		foundPath = foundPath + data;
		console.log(foundPath);
		console.log('Updating Database with Media Path');
		db.run("UPDATE Pidentities SET mediapath = '" + foundPath + "' WHERE rowid = " + aPi.getPiDee());
		promise.resolve(true);
	});

	return promise.promise;
}
	
//--------------------------------------------------------------------------------------------------
// Pi JSON Server
piServer.listen(8124);
piServer.use(express.bodyParser());
piServer.post('/',function(request, response){
	//Check for Proper request from Pi
	if(request.body.hasOwnProperty('location') &&
	   request.body.hasOwnProperty('org') &&
	   request.body.hasOwnProperty('piip') &&
	   request.body.hasOwnProperty('piDee')){
		//We have a good request
		
		var newPi = new Pi(request.body.piip, request.body.location, request.body.org, request.body.piDee, request.body.isolated);
		//
		// PIDEE == -1
		//
		if(newPi.getPiDee() === "-1"){
			console.log('New Pi at '+request.body.piip);
			//Yes, I nearly remove the asynchronousity out of javascript. Get over it. 				
			newPi.getNewPidee(db)
				.then(function(data){
					promise = q.defer();					
					console.log('New Pi has a piDee of '+data);
					//Set this Pi to have that piDee
					newPi.piDee = data;					
					response.type('application/json');
					response.send('{"piDee":'+newPi.piDee+'}');					
					promise.resolve(true);					
					return promise.promise;				
				})
				//Send the piDee via JSONRPC
				.then(function(data){
					console.log('Setting piDee via JSON');
					return newPi.setPiDeeJSON();
				})
				//Create a new Folder for the Pi
				.then(function(data){
					return createNewFolder(newPi);
				})
				//Populate the Folder with Media
				.then(function(data){
					return populateFolder(newPi);
				})
				//Tell the Pi that it can play the Media now
				.then(function(data){
					console.log('Playing Pi');
					return newPi.playMedia();
				});			
		}
		//
		// PIDEE != -1
		//		
		else {
			//Compare the new Pi JSON we received to what was in the DB
			var oldPi = new Pi();
			
			oldPi.createFromDB(newPi.getPiDee(), db)
			function wait(){
				console.log('waiting');
				if(!oldPi.getPiDee()){
						setTimeout(wait,100);
				} else {
						console.log('Old Pi: '+oldPi.getPiDee()+oldPi.getLoc()+oldPi.getOrg());
						console.log('New Pi: '+newPi.getPiDee()+newPi.getLoc()+newPi.getOrg());
						
						if((oldPi.getIP() === newPi.getIP()) &&
						 (oldPi.getLoc() === newPi.getLoc()) &&
						 (oldPi.getOrg() === newPi.getOrg())){
								console.log(newPi.getPiDee()+' hasn\'t changed');
								newPi.playMedia();
						} else {
								console.log('Pi '+newPi.getPiDee()+' has different settings, updating');
								//newPi.updateDB(db); //Update database to reflect the new settings
								newPi.playMedia();
						}
				}
			}
		
			wait();

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

