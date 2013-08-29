var http = require('http'); 
var fs = require('fs'); 
var S = require('string');
var util=require('util');
var querystring=require('querystring');
var sqlite3 = require('sqlite3').verbose(); 
var mkdirp = require('mkdirp');
var path = require('path');
var file = "test1.db";
var piChunk = '';
var body = '';
var db = new sqlite3.Database(file);
var exists = fs.existsSync(file);
var ORG_ROOT = "/media/piFilling/Org"
var LOC_ROOT = "/media/piFilling/Location"  
var PIFOLDERS_ROOT = "/media/piFolders"    //this holds the folders with the symlinks the pi accesses
var SMB_MNT_ROOT = "smb://10.128.1.137/piFolders"




   //create the database if it has not been created 
	//if(!exists)
    //{
	
	db.serialize(function() {
	
		//create Pidentities db file
		console.log("Conditionally Creating Pidentities Database."); 
		fs.openSync(file, "w");
		//create Pidentities table
		db.run("CREATE TABLE IF NOT EXISTS Pidentities (timestamp TEXT, IP_address TEXT, Location TEXT, Orgcode TEXT, filelink TEXT)"); 
		
		//create iptvTable
		console.log("Creating iptvChannels Database.");
		//drop table first
		db.run("DROP TABLE IF EXISTS iptvTable");
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
	//}  
		db.each("SELECT * FROM iptvTable", function(err, row) {
		console.log(row.channel_name + ", " + row.ip_address);
		});
	});

function createNewFolder(piDee, org, loc)
{
	mkdirp(PIFOLDERS_ROOT + path.sep + piDee, function (err) {
	if (err) console.error(err)
	else console.log('pow!')
	db.run("UPDATE Pidentities SET filelink = '" + SMB_MNT_ROOT + "/" + piDee + "' WHERE rowid = " + piDee);
	populateFolder(org, loc, piDee);	
	//put in NASA Meatball
	fs.symlink("/media/piFilling/nasameatball.png", PIFOLDERS_ROOT + path.sep + piDee + path.sep + "nasameatball.png", 'file', function(err){
	if (err) console.error(err)
		});
	});
}	

function traverseFolders(traverseBy, piDee, target)
{
	var thisRoot = '';
	var targetLocation = '';
	if(traverseBy == "org")
	{
		thisRoot = ORG_ROOT;
	}
	else
	{
		thisRoot = LOC_ROOT;
	}
	console.log("Traversing by " + thisRoot);
	var finder = require('findit2').find(thisRoot);  
	finder.on('directory', function(dir, stat){
	
	if(path.basename(dir) == target)
	{
		targetLocation = dir;
		console.log("Matched with the : " + dir);
		console.log("Inside the walk up" + targetLocation);
		/*fs.symlink(targetLocation, PIFOLDERS_ROOT + path.sep + piDee + path.sep + path.basename(targetLocation), 'dir', function(err){
		if (err) console.error(err);
		});*/
		var innerFinder = require('findit2').find(thisRoot);
		innerFinder.on('file', function (file, stat) 
		{
			if(targetLocation.indexOf(path.dirname(file)) > -1 )
			{				  
				console.log(file);
				var pathTitle = path.dirname(file);
				//fs.symlink(file, PIFOLDERS_ROOT + path.sep + piDee + path.sep + path.basename(targetLocation), 'file', function(err){
				fs.link(file, PIFOLDERS_ROOT + path.sep + piDee + path.sep + pathTitle.replace(/\//g, '').replace(' ', '')  + '-' + path.basename(file), function(err){
				console.log("Trying ze link: " + PIFOLDERS_ROOT + path.sep + piDee + path.sep + pathTitle.replace(/\//g, '').replace(' ', '')  + '-' + path.basename(file));
				if (err) console.error(err);
				});
			}
			else console.log(file);
		});
		// targetLocation = path.normalize(targetLocation + path.sep + "..");
		//targetLocation = thisRoot;	
		  
  	    }
	}); 
   
   //targetLocation is a result of walking down
   console.log("Before Walking back up");
   //walking back up
}

function populateFolder(org, location, piDee)
{
	// delete all the links
	console.log("Traversing the org folders");
	traverseFolders('org', piDee, org)
	console.log("Traversing the location folders");
	traverseFolders('loc', piDee, location)
}

	
function sendpiDeeSetting(piip, piDee)
{
	//xbmc.sendCommand('{"jsonrpc": "2.0", "method": "Addons.ExecuteAddon", "params": { "wait": true, "addonid": "service.digital.signage", "params": ["' + piDee + '"]},  "id": 0}');
	var user = 
	{ 
		jsonrpc: '2.0', 
		id: '0', 
		method: 'Addons.ExecuteAddon',  
		params: 
		{
			wait: true,
			addonid: "service.digital.signage",
			params:[piDee.toString()]
		}
	}; 
	   
	var userString = JSON.stringify(user); 
	console.log(userString);
	var headers = 
	{ 
		'Content-Type': 'application/json', 
		'Content-Length': userString.length 
	};
	 
	var options = 
	{ 
		host: piip, 
		port: 80, 
		path: '/jsonrpc', 
		method: 'POST', 
		headers: headers 
	}; 
	
	var outreq = http.request(options, function(res) { 
		console.log('start of outgoing request in pisettings');
		
		res.setEncoding('utf-8'); 
		var responseString = ''; 
		  
		res.on('data', function(data) 
		{
			responseString += data;
		}); 

		res.on('end', function() 
		{ 
			var resultObject = JSON.parse(responseString); 
		}); 
	}); 

	outreq.on('error', function(e) 
	{ 
	// TODO: handle error. 
	});
	
	outreq.write(userString); 
	outreq.end();
   
}
	
function sendNotification(piip)
{
	console.log("made it to the printout");
	var user = 
	{ 
		jsonrpc: '2.0', 
		id: '1', 
		method: 'GUI.ShowNotification',  //eventually player.open
		params: 
		{
			title: 'Error',
			message: "Please change your settings and restart your pi",
			displaytime: 10000
		}
	}; 
	   
	var userString = JSON.stringify(user); 
    console.log(userString);
	var headers = 
	{ 
		'Content-Type': 'application/json', 
		'Content-Length': userString.length 
	};
	 
	var options = 
	{ 
		host: piip, 
		port: 80, 
		path: '/jsonrpc', 
		method: 'POST', 
		headers: headers 
	}; 
	
	var outreq = http.request(options, function(res) 
	{ 
		console.log('start of outgoing request');
		
		res.setEncoding('utf-8'); 
		var responseString = ''; 
		  
		res.on('data', function(data) 
		{
			responseString += data;
		}); 

		res.on('end', function() 
		{ 
			var resultObject = JSON.parse(responseString); 
		}); 
	}); 

	outreq.on('error', function(e) 
	{ 
		// TODO: handle error. 
	});

	outreq.write(userString); 
	outreq.end();
   
}
	
	
//NAME: createPidentity
//PARAMETERS: loc, org, piDee, piip are all parts of parsed JSON (piChunk)
//PURPOSE: 
function createPidentity(loc, org, piDee, piip)
{
	console.log("Entered the if piDee = 0 statement"); 
		db.run("INSERT INTO Pidentities (IP_address, Location, Orgcode, timestamp, filelink) VALUES ('" + piip + "', '" + loc + "', '" + org + "', Time('now'), 'c:/blahblahblah')", function(error)
		{
			piDee = this.lastID;
			//db.run("UPDATE Pidentities SET filelink = 'XXXXXXXXXXXXXXXX' WHERE rowid = "+ piDee);  
			console.log("inside");
			console.log(piDee);
			sendpiDeeSetting(piip, piDee);
			createNewFolder(piDee, org, loc); 
			playPiFilling(piDee, piip);
		});
   
		//stmt.run();
	    //stmt.finalize();
	    //sendpiDeeSetting(piip, piDee);
        
}

function updatePidentity(loc, org, piDee, piip)
{
	
	var locintab = '';
	var orgintab = '';
	//updating the location and orgcode in the table if it does not match the location/org in XBMC
	
	var stmt = db.prepare("SELECT Location, Orgcode FROM Pidentities WHERE rowid = " + piDee); 
	console.log("7. Before the stmt.get (running it)"); 
	
	stmt.get(function(err, row)
	{
		console.log("8. row.location, row.Orgcode: "+ row.Location, row.Orgcode);
		locintab = row.Location;
		orgintab = row.Orgcode;
		piipintab = row.IP_address;
		console.log("9. inside .run locintab and orgintab: "+ locintab, orgintab);
		
		if(loc != locintab || org != orgintab || piip != piipintab)
		{
			db.run("UPDATE Pidentities SET Location = '" +loc+"', Orgcode = '" +org+"', IP_address = '" +piip+ "' WHERE rowid =  "+ piDee);
			console.log("9.5 Lovely if statement about location and org");
			//db.run("UPDATE Pidentities SET Orgcode = '" +org +"' WHERE rowid = "+ piDee);
		}  
	
		console.log("10. After get, before finalize");
			
	});
	stmt.finalize(function()
	{
		playPiFilling(piDee, piip);
	});
		
	console.log("11. Outside stmt.get: " + loc, org);	   

	// piFile = db.run("SELECT filelink FROM Pidentities WHERE rowid = " +piChunk.piDee);
	// db.run("UPDATE Pidentities SET filelink = 'JAMES AND HAYLEY CAN DO IT!' WHERE rowid = 60");
	
}	
	
//NAME: piDeeFunction
//PARAMETERS: loc, org, piDee, piip are all parts of parsed JSON (piChunk)
//PURPOSE: This function works with the database. There are if-else statements
//         that check to make sure the piDee is set to the XBMC add-on. If there
//         is no piDee, it creates a new entry in the Pidentities table. If
//         there is a piDee, it checks to make sure everything in the table
//         is correct and updates the entries. Then the filepath is made and played.
function piDeeFunction(loc, org, piDee, piip)
{
	db.serialize(function()
	{
		console.log("5. Entering piDeeFunction");
		var piFile = '';
		var piDeez = piDee;
		//Location and Org Code are the default settings on the XBMC addon. They need to be set before anything can be run
		if(loc == "Location" || org == "Org Code")
		{
			setTimeout(sendNotification(piip), 5000);
		}
		else
		{
			//checks to see if piDee is the default value from XBMC. This means it needs to 
			//create a new entry into the Pidentities table and assign a new piDee to the Pi
			if(piDee == -1)
			{
				createPidentity(loc, org, piDeez, piip);
			}
	   
			else
			{
				console.log("6. Entering the else"); 
				updatePidentity(loc, org, piDeez, piip);
			}
			console.log("12. Random spot after the outside stmt.get but before table"); 
			//updating the filelink for specific piDee in the table
			//db.run("UPDATE Pidentities SET filelink = 'JAMES AND HAYLEY ARE CHIP AND DALE' WHERE rowid = "+ piDee);
		}
  
		//printing	
		// db.each("SELECT rowid AS piDee, * FROM Pidentities", function(err, row) 
		// {
		// console.log(row.piDee + ": " + row.Location, row.IP_address, row.Orgcode, row.timestamp, row.filelink);
		// });
	});
  
}

function playPiFilling(piDee, piip)
{

	var user = 
	{ 
		jsonrpc: '2.0', 
		id: '1', 
		method: 'Player.Open', 
		params: 
		{
			item: 
			{
				directory: SMB_MNT_ROOT + "/" + piDee
			}
		}
	}; 
	   
	var userString = JSON.stringify(user); 
	console.log(userString, piip);
	var headers = 
	{ 
		'Content-Type': 'application/json', 
		'Content-Length': userString.length 
	};
	 
	var options = 
	{ 
		host: piip, 
		port: 80, 
		path: '/jsonrpc', 
		method: 'POST', 
		headers: headers 
	}; 
	   
	var outreq = http.request(options, function(res) 
	{ 
		console.log('start of outgoing request');
		
		res.setEncoding('utf-8'); 
		var responseString = ''; 
		
		res.on('data', function(data) 
		{
			responseString += data;
		}); 
		
		console.log('Leaving outgoing request');
		
		res.on('end', function() 
		{ 
			var resultObject = JSON.parse(responseString); 
			responseString = '';
		}); 
	}); 

	outreq.on('error', function(e) 
	{ 
		// TODO: handle error. 
	});

	outreq.write(userString); 
	outreq.end();
}


http.createServer(function (inreq, res)
{
	
	console.log("1. SERVER SERVER");
	inreq.on('data', function (data)
	{
		body += data;
	});


	inreq.on('end', function()
	{
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end('{OK}\n');
	
		console.log("3. Parsing JSON"); 
		console.log("3.5" + body);
		piChunk = JSON.parse(body);
		console.log("4. Calling piDeeFunction");
		piDeeFunction(piChunk.location, piChunk.org, piChunk.piDee, piChunk.piip);

	  
		body='';	
   });

	console.log('2. This is the end');
    
	
}).listen(8124);



//EMERGENCY ALERT
var HTMLserver=http.createServer(function(req,res)
{
	console.log('collectDATA for Emergency Service');
	
	if (req.method=='GET')
	{
		console.log('INITIAL STATEMENT');
		var checkChannels = '';
		  var checkNames = '';
		var stmt = db.prepare("SELECT rowid AS piDee, * FROM Pidentities");
		var iptvstmt = db.prepare("SELECT * FROM iptvTable");

		stmt.each(function(err, row)
		{
			checkNames += '<input type="checkbox" name="Destination" value="'+row.piDee+'">'+ row.Location + ', '+ row.Orgcode +'<br>'
		});
		
		iptvstmt.each(function(err,row)
		{
			checkChannels += '<option value = "'+row.ipaddress+'">' + row.channel_name + '</option><br>'
		});
		
		//create a new stmt.each function for checkChannels
		
		var selectAll = '<script language="JavaScript"> \
                         function toggle(source) { \
							  checkboxes = document.getElementsByName("Destination");\
							  for(var i=0, n=checkboxes.length;i<n;i++) {\
								checkboxes[i].checked = source.checked;\
							   }\
					      }\
						</script>';
		
		
		stmt.finalize(function()
		{

			res.end('<html> \
						<body bgcolor="#E6E6FA"> \
							<form action="/" method="POST" name="form1"> \
								<b>TOGGLE CONTROL</b> \
								<input type="radio" name="Control" value="ON">ON \
								<input type="radio" name="Control" value="OFF">OFF <br> <br>\
								<b>Select the Source of Notification</b> <br> <br> \
								<input type="radio" name="Source" value="IPTV">IPTV \
									<select name="Channels"> \
									<option value="Default">Select a Channel...</option>'
								<input type="radio" name="Source" value="EMERGENCY FOLDER">EMERGENCY FOLDER <br>\
								<br> <b>Select the Destination(s) of Notification. </b><br>'
								+checkNames+ 
								'<input type="checkbox" onClick="toggle(this)" name="SelectAll" value="Select All"> Select All\
								<br><br>\
								<button type="submit" id="btnPost">Post Data</button> \
							</form> '
							+selectAll+
						'</body> \
					</html>');
		});
	}
	else
	{
		var alert = '';
			
		req.on('data', function (data)
		{
			alert += data;
	
		});
	
		req.on('end', function () 
		{

			console.log(alert + "<-Posted Data Test");
			res.end(util.inspect(querystring.parse(alert)));
			alertChunk = querystring.parse(alert);
			console.log(alertChunk.Destination);
			
			var piipSelect = "SELECT IP_Address FROM Pidentities WHERE ";
			alertChunk.Destination.forEach(function(currentIterationOfLoop)
			{
				piipSelect += "rowid = " + currentIterationOfLoop + " OR ";
			});
			console.log(piipSelect);
			piipSelect = S(piipSelect).chompRight(" OR ").s;
			console.log(piipSelect);
			var stmt2= db.prepare(piipSelect);
		
			stmt2.each(function(err, row)
			{
				console.log(row.IP_address);
				playEmergency(row.IP_address);
			});

		});
	}

	
}).listen(8080); 


function playEmergency(piip)
{
  
    var user = 
	{ 
		jsonrpc: '2.0', 
		id: '1', 
		method: 'Player.Open', 
		params: 
		{
			item: 
			{
				directory: SMB_MNT_ROOT + "/Emergency"
			}
		}
	}; 

	var userString = JSON.stringify(user); 
	console.log(userString, piip);
	var headers = 
	{ 
		'Content-Type': 'application/json', 
		'Content-Length': userString.length 
	};
	
	var options = 
	{ 
		host: piip, 
		port: 80, 
		path: '/jsonrpc', 
		method: 'POST', 
		headers: headers 
	}; 
	   
	var outreq = http.request(options, function(res) 
	{ 
		console.log('start of outgoing request');

		res.setEncoding('utf-8'); 
		var responseString = ''; 
		  
		res.on('data', function(data) 
		{
		responseString += data;
		}); 
		
		console.log('Leaving outgoing request');
		 
		res.on('end', function() 
		{ 
			var resultObject = JSON.parse(responseString); 
			responseString = '';
		}); 
	}); 

	outreq.on('error', function(e) 
	{ 
	// TODO: handle error.
	
	});

	outreq.write(userString); 
	outreq.end();
}
