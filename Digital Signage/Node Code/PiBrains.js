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

//--------------------------------------------------------------------------------------------------
// Constants
var DATABASE = "C:\\DigitalSignage\\media\\digitalSignage.db";
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
// Database Initialization
var db = new sqlite3.Database(DATABASE);
//Try to open the database file for appending (or creation)
try {
    console.log('Opening Pidentities Database.');
    fs.openSync(DATABASE, 'a');

    //create Pidentities table if it doesn't exist
    //	pID  		INTEGER PRIMARY KEY		keeps the rowids unique and persistent through a VACUUM
    //	timestamp	TEXT					timestamp the last time the Pi called in
    //	ipaddress	TEXT					IP address of the Pi
    //	location	TEXT					Room Location of the Pi (set in XBMC)
    //	orgcode		TEXT					Organization the Pi should display images for (set in XBMC)
    //	pifolder	TEXT					The path the Pi is looking at for media
	//	mediapath 	TEXT					List of all the paths the Pi has media from
    db.run("CREATE TABLE IF NOT EXISTS Pidentities (pID INTEGER PRIMARY KEY, timestamp TEXT, ipaddress TEXT, location TEXT, orgcode TEXT, pifolder TEXT, mediapath TEXT)");
} catch (err) {
    console.log('Error creating database, potentially a permissions issue');
    console.log(err);
}

//-------------------------------------------------------------------------------------------------
// Hound Filesystem Watching
watcher = hound.watch(MEDIA_ROOT);
watcher.on('create',updateFoldersCreate);
watcher.on('delete',updateFoldersDelete);

try {
    db.serialize(function() {
		console.log('Opening Database Once Again.');
		fs.openSync(DATABASE, 'a');
		
		//Clear the current iptvTable. Then create a new iptvTable
		db.run("DROP TABLE IF EXISTS iptvTable");
		console.log("Creating iptvChannels.");
		db.run("CREATE TABLE iptvTable (channel_name TEXT,ip_address TEXT)");
		
		//fill iptvTable...make into function later...
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('NASA TV #1','udp://@239.15.15.1:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('NASA TV #2','udp://@239.15.15.2:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('NASA TV #3','udp://@239.15.15.2:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('Johnson TV','udp://@239.15.15.4:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('Quad Split ISS Downlink','udp://@239.15.15.5:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('ISS Downlink 1','udp://@239.15.15.6:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('Iss Downlink 2','udp://@239.15.15.7:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('ISS Downlink 3','udp://@239.15.15.8:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('Iss Downlink 4','udp://@239.15.15.9:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('FCR-Front Left','udp://@239.15.15.10:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('FCR-Left Side','udp://@239.15.15.11:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('FCR-Back Left','udp://@239.15.15.12:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('WFCR-Front Side','udp://@239.15.15.13:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('WFCR-Right Side','udp://@239.15.15.14:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('Weather Info','udp://@239.15.15.16:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('Weather Radar','udp://@239.15.15.17:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('CNN','udp://@239.15.15.35:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('NASA TV Guide','udp://@239.15.15.36:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('KUBE','udp://@239.15.15.38:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('KRIV 26 FOX','udp://@239.15.15.39:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('KHOU 11 CBS','udp://@239.15.15.40:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('KRPC 2 NBC','udp://@239.15.15.41:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('KTRK 13 ABC','udp://@239.15.15.42:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('Scola Germany','udp://@239.15.15.43:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('Satellite Map','udp://@239.15.15.45:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('NASA Channel','udp://@239.15.15.46:30120')");
		db.run("INSERT INTO iptvTable(channel_name, ip_address) VALUES ('NASA Educational','udp://@239.15.15.47:30120')");
		
		db.each("SELECT * FROM iptvTable", function(err, row) {
			console.log(row.channel_name + ", " + row.ip_address);
		});
		console.log("Table Created");
	});

} catch (err) {
	console.log('Error updating database, potentially a permissions issue');
    console.log(err);
}


function updateFolders(file){
	console.log('File Created:' +file);
	console.log('Path: '+ path.dirname(file.replace(/\//g, '\\')));
	//Search the db for all Pi's that rely on the path of the updated file
	db.each("SELECT pID, ipaddress, location, orgcode FROM Pidentities WHERE mediapath LIKE '%"+path.dirname(file.replace(/\//g, '\\'))+"%'", function(err,row){
		console.log(row);
		//Create "unique" filename
		//Parse out any improper path separators **WINDOWS SPECIFIC CODE**
		var pathArray = file.replace(/\//g, '\\').split("\\");
		var length = pathArray.length;
		var piFolder = PIFOLDERS_ROOT + path.sep + row.pID + path.sep;
		//Create a unique filename for each symlink by using the path
		if (length > 3) {
			filename = pathArray[length - 3] + "." + pathArray[length - 2] + "." + pathArray[length - 1];
		} else {
			filename = pathArray[pathArray.length - 1];
		}
		//Add the file to the given piFolder for persistence
		fs.symlink(file.replace(/\//g, '\\'), piFolder + filename, function (err) {
                        console.log("Trying ze link: " + piFolder + filename);
                        if (err) console.error(err.code);
                    });
		
		//populateFolders(row.pID, row.location, row.orgcode);
		
		//Inject into the Pi's Playlist for immediacy
		addToPlaylist(row.ipaddress, NFS_MNT_ROOT+'/piFolders/'+row.pID+'/'+filename);
	});
}

function addToPlaylist(piip, file){
	console.log(file);
	var data = {
		"jsonrpc": "2.0",id: "1",
        method: "Playlist.Add",
        params: {
            playlistid: 2,
			item:{"file":file}
        }
    };

	dataString = JSON.stringify(data);
	console.log('Add to Playlist JSON: '+dataString);
    var options = {
        host: piip,port: 80,path: "/jsonrpc",method: "POST",
        headers: {
			"Content-Type": "application/json",
			"Content-Length": dataString.length
		}
    };

	//Create the outgoing request object
    var outreq = http.request(options, function (res) {
        res.setEncoding('utf-8');
        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            console.log(JSON.parse(responseString));
        });
    });

    outreq.on('error', function (e) {
        // TODO: handle error. 
    });

	//Write the request
    outreq.write(dataString);
    outreq.end();
}

/*--------------------------------------------------------------------------------------------------	
// addNewPi : string, string, string -> integer
// Sends a notification to the given address with the given message and timeouts
// INPUT: loc - The location of the Pi
// INPUT: org - The organization whom owns the Pi
// INPUT: piip - IP address of the Pi
// CALLS: createNewFolder
// Examples:
//		createPidentity("30A","DD","192.168.0.1") -> Returns an integer representing the new row id in the database */
function addNewPi(loc, org, piip) {
	db.run("INSERT INTO Pidentities (ipaddress, location, orgcode, timestamp, pifolder, mediapath) VALUES ('" + piip + "', '" + loc + "', '" + org + "', Time('now'), 'c:/pifolder', 'c:/mediapath')", function (error) {
		if(error) console.log("Error inserting new Pi: " +error);
		id = this.lastID;
		console.log('New Row ID '+id);
		createNewFolder(id, loc, org, piip);
	});
}
/*--------------------------------------------------------------------------------------------------
// createNewFolder : integer -> integer
// Creates a new folder in the PIFOLDERS_ROOT with the given piDee and updates the database to reflect the change
// INPUT: piDee - the UUID of the Pi, generated by createPidentity
// INPUT: loc - The location of the Pi
// INPUT: org - The organization whom owns the Pi
// INPUT: piip - IP address of the Pi
// CALLS: populateFolder
// Examples:
//		createNewFolder(5, "30A", "DD", "192.168.0.1") -> A folder PIFOLDERS_ROOT\5 should exist and the 5th row pifolder will point to that entry */
function createNewFolder(piDee, loc, org, piip) {
	var folder_loc = PIFOLDERS_ROOT + path.sep + piDee;
    //Create the folder for the Pi symlinks, mkdirp
	console.log("Creating folder for "+piDee);
    mkdirp(folder_loc, function (error) {
		if(error){
			console.log(error);
		} else{
			console.log(folder_loc+' was created succesfully');
			populateFolder(piDee, loc, org, piip);
		}
    });
    //Update the DB to show where the pi is looking for media 
    db.run("UPDATE Pidentities SET pifolder = '" + folder_loc + "' WHERE rowid = " + piDee);
}
/*--------------------------------------------------------------------------------------------------	
// populateFolder : string, string, string
// Adds a new Pi to the Database, creates it's folder in PIFOLDERS_ROOT, and populates the folders
// INPUT: pidee - the UUID of the Pi, generated by createPidentity
// INPUT: loc - The location of the Pi
// INPUT: org - The organization whom owns the Pi
// INPUT: piip - IP address of the Pi
// CALLS: traverseFolders
// Examples:
//		populateFolder("7","30A","DD","192.168.0.1") -> Populates the given Pi's folders with the media */
function populateFolder(piDee,location, org, piip) {
	//Remove all previous entries in the folder
	fs.readdir(PIFOLDERS_ROOT+path.sep+piDee,function(err,hits){
		if(hits){
			hits.forEach(function(entry){
				fs.unlink(PIFOLDERS_ROOT+path.sep+piDee+path.sep+entry, function(err){
					if(err) console.log("Error unlinking "+entry+": "+err);
				});
			});
		}
		//Symlink the hierarchial media
		traverseFolders(piDee,location,org, piip);
	});	
}
function populateFolders(piDee, location, org){
	//Remove all previous entries in the folder
	fs.readdir(PIFOLDERS_ROOT+path.sep+piDee,function(err,hits){
		if(hits){
			hits.forEach(function(entry){
				fs.unlink(PIFOLDERS_ROOT+path.sep+piDee+path.sep+entry, function(err){
					if(err) console.log("Error unlinking "+entry+": "+err);
				});
			});
		}
		//Symlink the hierarchial media
		traverseFolders(piDee,location,org);

	});
}
/*--------------------------------------------------------------------------------------------------	
// traverseFolders : string, string, string, string
// Adds a new Pi to the Database, creates it's folder in PIFOLDERS_ROOT, and populates the folders
// INPUT: pidee - the UUID of the Pi, generated by createPidentity
// INPUT: loc - The location of the Pi
// INPUT: org - The organization whom owns the Pi
// INPUT: piip - [OPTIONAL] IP address of the Pi
// CALLS: sendPiDee with playPi callback
// Examples:
//		traverseFolder("7","30A","DD") -> Symlinks all files from all dirs about 30A and DD into PIFOLDERS_ROOT/7 */
function traverseFolders(piDee, location, org, piip) {
    var thisRoot = MEDIA_ROOT;
    var finder = findit2.find(thisRoot);	
	var foundPath = '';
	var piPath = '';
	
	//Find path to org and loc folders
    finder.on('directory', function (dir, stat) {
		//If the directory matches org or location, scan for the files
        if ((path.basename(dir) == org) || (path.basename(dir)==location)) {
            console.log("Matched with " + dir);					
			finder.on('file',function(file,stat){
				//Determine if the file's path resides in the dir path
				if (dir.indexOf(path.dirname(file)) > -1) {
					//If a file has been found in the directory, don't append it to the master list of 
					//	found directories. If it hasn't been found, append it.
					if(path.dirname(file.replace(/\//g, '\\'))!=foundPath){
						if(foundPath){piPath = piPath + foundPath + ';';}
						foundPath = path.dirname(file.replace(/\//g, '\\'));						
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
					fs.symlink(file.replace(/\//g, '\\'), PIFOLDERS_ROOT + path.sep + piDee + path.sep + filename, function (err) {
                        console.log("Trying ze link: " + PIFOLDERS_ROOT + path.sep + piDee + path.sep + filename);
                        if (err) console.error(err.code);
                    });
				}	
			});		
		}
	});
	
	finder.on('end',function(){
		//piip is only present in the initial "add new pi" sequence. The DB does not need updating
		//	when traverseFolders is called from the file system watchdog.
		if(piip){
			db.run("UPDATE Pidentities SET mediapath = '" + piPath + "' WHERE rowid = " + piDee);
			//Use the user callback in sendPiDee to playPi
			sendPiDee(piip, piDee, playPi); 
		}
	});
}

function playPi(piip){
	var data = {
        jsonrpc: "2.0",
        id: "0",
        method: "Addons.ExecuteAddon",
        params: {
            wait: true,
            addonid: "service.digital.signage",
            params: ["play"]
        }
    };

	dataString = JSON.stringify(data);
	
    var headers = {
        "Content-Type": "application/json",
        "Content-Length": dataString.length
    };

    var options = {
        host: piip,
        port: 80,
        path: "/jsonrpc",
        method: "POST",
        headers: headers
    };

	//Create the outgoing request object
    var outreq = http.request(options, function (res) {
        res.setEncoding('utf-8');
        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            var resultObject = JSON.parse(responseString);
        });
    });

    outreq.on('error', function (e) {
        // TODO: handle error. 
    });

	//Write the request
    outreq.write(dataString);
    outreq.end();
}
/*--------------------------------------------------------------------------------------------------	
// sendPiDee : string, string
// Sends the id the Pi should write to settings.xml 
//	It is up to the Pi to properly implement this, overrides.py currently handles it
// INPUT: piip - IP address of the Pi running XBMC
// INPUT: piDee - the piDee to reset the Pi to
// Examples:
//		sendPiDeeSetting("192.168.0.1","9") -> Sends a piDee of 9 to the Pi at 192.168.0.1 */
function sendPiDee(piip, piDee, callback) {
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

	dataString = JSON.stringify(data);
	
    var headers = {
        "Content-Type": "application/json",
        "Content-Length": dataString.length
    };

    var options = {
        host: piip,
        port: 80,
        path: "/jsonrpc",
        method: "POST",
        headers: headers
    };

	//Create the outgoing request object
    var outreq = http.request(options, function (res) {
        res.setEncoding('utf-8');
        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            var resultObject = JSON.parse(responseString);
			console.log(resultObject);
			if(callback){
				callback(piip);
			}
        });
    });

    outreq.on('error', function (e) {
        // TODO: handle error. 
    });

	//Write the request
    outreq.write(dataString);
    outreq.end();
}
/*--------------------------------------------------------------------------------------------------	
// sendNotification : string, string, integer -> boolean
// Sends a notification to the given address with the given message and timeouts
// INPUT: piip - IP address of the Pi running XBMC
// INPUT: message - [OPTIONAL] message to be displayed in the notification
// INPUT: timeout - [OPTIONAL] duration of notification on screen
// OUTPUT: returns true on succesful JSONRPC call, returns false on error
// Examples:
//		sendNotification("192.168.0.1") -> Sends default notification to IP with default timeout
//		sendNotification("192.168.0.1","Testing") -> Sends "Testing" as the notification to Pi at IP 192.168.0.1
//		sendNotification("192.168.0.1","Testing",500) -> Sends "Testing" as the notification with a timeout of .5 second */
function sendNotification(piip, message, duration) {
    var defaultMessage = "Please change your settings and restart your pi";
	var defaultDuration = 10000;
	var user = {
        jsonrpc: '2.0',
        id: '1',
        method: 'GUI.ShowNotification',
        params: {
            title: 'Error',
            message: message || defaultMessage,
            displaytime: duration || defaultDuration
        }
    };

    var userString = JSON.stringify(user);
    console.log(userString);
    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': userString.length
    };

    var options = {
        host: piip,
        port: 80,
        path: '/jsonrpc',
        method: 'POST',
        headers: headers
    };

    var outreq = http.request(options, function (res) {
        console.log('start of outgoing request');

        res.setEncoding('utf-8');
        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            var resultObject = JSON.parse(responseString);
        });
    });

    outreq.on('error', function (e) {
        // TODO: handle error. 
    });

    outreq.write(userString);
    outreq.end();
}

//--------------------------------------------------------------------------------------------------
function updateDatabase(piDee, loc, org, piip) {
    //updating the location and orgcode in the table if it does not match the location/org in XBMC
    var stmt = db.prepare("SELECT location, orgcode FROM Pidentities WHERE rowid = " + piDee);
	var update = false;
	
    stmt.get(function (err, row) {
        if (loc != row.location || org != row.orgcode || piip != row.ipaddress) {
			console.log('Updating information for '+piDee+' to '+loc+' '+org+' '+piip);
            update = true;
			db.run("UPDATE Pidentities SET location = '" + loc + "', orgcode = '" + org + "', ipaddress = '" + piip + "' WHERE rowid =  " + piDee);
        }
    });
    stmt.finalize(function () {
        //We need to repopulate all the folders and begin playing if the info changed
		if(update){populateFolder(piDee,loc, org, piip);}		
    });
}

/*--------------------------------------------------------------------------------------------------	
// emergencyOverride : string
// Checks if Emergency Override is "ON" or "OFF".
// If ON, Calls callEmergency() and Activate EmergencyOverride folder. 
// If OFF, Calls playPi() and Disables EmergencyOverride folder and activates standard playlist.   
// INPUT: emergencyDestination - The piipSelect value. aka IP address.
// Example:
//		emergencyOverride(row.ipaddress) */

function emergencyOverride(emergencyDestination)
{
	if (alertChunk.Control == "ON") {
		console.log("EMERGENCY OVERRIDE HAS BEEN ACTIVATED");
		callEmergency(alertChunk.Source, emergencyDestination);
	}
	else if (alertChunk.Control =="OFF"){
		console.log("EMERGENCY OVERRIDE HAS BEEN DISABLED");
		playPi(emergencyDestination);
		
	}
	else {
		console.log("ERROR! CAPTAIN MURPHY IS MIA FROM THE GREAT SPICE WARS!");
	}
}

/*--------------------------------------------------------------------------------------------------	
// callEmergency : string, string
// Checks the source of emergency content given from selected postData and then calls playEmergencyFolder() 
// INPUT: emergencyCall - Source of Emergency content(Emergency Folder or IPTV)
// INPUT: emergencyDestination -IP address passed from emergencyOverride.
// Examples:
//		callEmergency(alertChunk.Source, emergencyDestination) */
function callEmergency(emergencyCall, emergencyDestination) {
    if (emergencyCall == "EMERGENCY FOLDER") {
		playEmergencyFolder(emergencyDestination);
	}
	else if (emergencyCall == "IPTV") {
		playEmergencyIPTV(emergencyDestination);
	}
	else {
		console.log("Can't play from Emergency file source");
	}
}

/*--------------------------------------------------------------------------------------------------	
// playEmergencyFolder : string
// Passes the data as a json object to overrides.py which then handles the ExecuteAddon functionality to playEmergency
// INPUT: emergencyDestination - IPaddress of Pi's needing to be played
// Examples:
// 		playEmergencyFolder(emergencyDestination) -> calls playEmergency*/

function playEmergencyFolder(emergencyDestination) {
	var data = {
        jsonrpc: "2.0",
        id: "0",
        method: "Addons.ExecuteAddon",
        params: {
            wait: true,
            addonid: "service.digital.signage",
            params: ["emergency", emergencyDestination.toString()]
        }
    };

	dataString = JSON.stringify(data);
	
    var headers = {
        "Content-Type": "application/json",
        "Content-Length": dataString.length
    };

    var options = {
		host: emergencyDestination,
        port: 80,
        path: "/jsonrpc",
        method: "POST",
        headers: headers
    };

	//Create the outgoing request object
    var outreq = http.request(options, function (res) {
        res.setEncoding('utf-8');
        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            var resultObject = JSON.parse(responseString);
        });
    });

    outreq.on('error', function (e) {
        // TODO: handle error. 
    });

	//Write the request
    outreq.write(dataString);
    outreq.end();
}

/*--------------------------------------------------------------------------------------------------	
// playEmergencyFolder : string
// Passes the data as a json object to overrides.py which then handles the ExecuteAddon functionality to playEmergency
// INPUT: emergencyDestination - IPaddress of Pi's needing to be played
// Examples:
// 		playEmergencyIPTV(emergencyDestination) -> calls playIPTV*/
function playEmergencyIPTV(emergencyDestination) {
	var data = {
        jsonrpc: "2.0",
        id: "0",
        method: "Addons.ExecuteAddon",
        params: {
            wait: true,
            addonid: "service.digital.signage",
            params: ["iptv", emergencyDestination.toString()]
        }
    };

	dataString = JSON.stringify(data);
	
    var headers = {
        "Content-Type": "application/json",
        "Content-Length": dataString.length
    };

    var options = {
        host: emergencyDestination,
        port: 80,
        path: "/jsonrpc",
        method: "POST",
        headers: headers
    };

	//Create the outgoing request object
    var outreq = http.request(options, function (res) {
        res.setEncoding('utf-8');
        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            var resultObject = JSON.parse(responseString);
        });
    });

    outreq.on('error', function (e) {
        // TODO: handle error. 
    });

	//Write the request
    outreq.write(dataString);
    outreq.end();
}



http.createServer(function (inreq, res) {
	var body = '';
	
	console.log('Created server listening on port 8124');

	//Append all incoming data to 'body' which is flushed on inreq.end
    inreq.on('data', function (data) {
        body += data;
    });
	//When the Pi is doing sending it's pidentity, send back any changes or OK
    inreq.on('end', function () {
        var piChunk = '';
		var piDee = '';
		console.log('Server received Pi');
		piChunk = JSON.parse(body);
		body = ''; //Clear the HTML Request contents for incoming requests !!Not sure if this is necessary
        console.log(piChunk);
		
		//If the sent in piDee is the default -1, it needs a new piDee
		if(piChunk.piDee == -1){
			piDee = addNewPi(piChunk.location, piChunk.org, piChunk.piip); 
			console.log('Wrote new piDee of '+piDee+' to Pi"');
		} else{
			//If the Pi is already in the database, we potentially need to update it's settings
			updateDatabase(piChunk.piDee,piChunk.location, piChunk.org, piChunk.piip);			
		}
		res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        res.end();

        
    });
}).listen(8124);



//Create server for webpage
var HTMLserver=http.createServer(function(req,res){
	console.log('Server listening on port 80');
	
	//setup handler here
	if (req.method=='GET')
	{
		var displayChannels = '';
		var checkNames = '';


		var stmt = db.prepare("SELECT rowid AS piDee, * FROM Pidentities");
		var iptvstmt = db.prepare("SELECT * FROM iptvTable");

		//Creates a checkbox for each piDee
		stmt.each(function(err, row){
			checkNames += '<input type="checkbox" name="Destination" value="'+row.pID+'">'+ row.location + ', '+ row.orgcode +'<br>'
		});

		//Displays the channel name/ip_address
		iptvstmt.each(function(err,row){
			displayChannels += '<option value = "'+row.ip_address+'">' +row.channel_name+ '</option><br>'
		});



		//Creates a "Select All" option
		var selectAll = '<script language="JavaScript"> \
						function toggle(source) { \
							checkboxes = document.getElementsByName("Destination");\
							for(var i=0, n=checkboxes.length;i<n;i++) {\
							checkboxes[i].checked = source.checked;\
							}\
						}\
						</script>';



		//Display the data on webpage in an HTML form
		stmt.finalize(function() {
			res.end('<html> \
						<head> \
						</head> \
						<body bgcolor="#E6E6FA"> \
							<form action="/" method="POST" name="form1"> \
								<b>EMERGENCY OVERRIDE</b> \
								<input type="radio" name="Control" value="ON">ON \
								<input type="radio" name="Control" value="OFF" checked>OFF <br> <br>\
								<b>Select the Source of Notification</b> <br> <br> \
								<input type="radio" name="Source" value="IPTV">IPTV \
									<select name="Channels"> \
									<option value="Default">Select a Channel...</option>'
									+displayChannels+
									'</select> <br>\
								<input type="radio" name="Source" value="EMERGENCY FOLDER">EMERGENCY FOLDER <br>\
								<br> <b>Select the Destination(s) of Notification. </b><br>'
								+checkNames+ 
								'<input type="checkbox" onClick="toggle(this)" name="SelectAll" value="Select All"> Select All\
								<br><br>\
								<button type="submit" id="btnPost">Post Data</button> '
								+selectAll+ 
							'</form> \
						</body> \
					</html>');
		});
	}
	else {
		var alert = '';
		
		//Append all incoming data to 'alert'
		req.on('data', function (data){
		alert += data;
		});


		req.on('end', function () 
		{
			console.log(alert + "<-Posted Data");
			res.end(util.inspect(querystring.parse(alert)));
			alertChunk = querystring.parse(alert);
			console.log(alertChunk.Destination);
			
			var piipSelect = "SELECT ipaddress FROM Pidentities WHERE ";
			if (alertChunk.Destination.length == 1) {
				console.log(piipSelect);
				piipSelect += "rowid = 1";
			}
			else {
				alertChunk.Destination.forEach(function(currentIterationOfLoop)
				{
					piipSelect += "rowid = " + currentIterationOfLoop + " OR ";
				});
				console.log(piipSelect);
				piipSelect = S(piipSelect).chompRight(" OR ").s;
			}
			
			var stmt2= db.prepare(piipSelect);
			stmt2.each(function(err, row)
			{
				console.log(row.ipaddress);
			
				console.log("CALLING EMERGENCY OVERRIDE");
				emergencyOverride(row.ipaddress);
				console.log("EMERGENCY OVERRIDE COMPLETE");
			});




		});
	}
}).listen(8080);






