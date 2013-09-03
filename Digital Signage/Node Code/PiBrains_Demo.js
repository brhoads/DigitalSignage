var http = require('http'); 
var fs = require('fs'); 
var S = require('string');
var util=require('util');
var querystring=require('querystring');
var sqlite3 = require('sqlite3').verbose(); 
var mkdirp = require('mkdirp');
var path = require('path');
var findit = require('findit2');

var file = "piDee.db";
var piChunk = '';
var body = '';
var db = new sqlite3.Database(file);
var exists = fs.existsSync(file);

var ORG_ROOT = "C:\\DigitalSignage\\media\\piFilling\\Org";//"media/piFilling/Org"
var LOC_ROOT = "C:\\DigitalSignage\\media\\piFilling\\Location";  
var PIFOLDERS_ROOT = "C:\\DigitalSignage\\media\\piFolders";    //this holds the folders with the symlinks the pi accesses

//Mount point for nfs share on the Pi
var NFS_MNT_ROOT = "/media" 

//create the database if it has not been created 
//if(!exists){
    //create Pidentities db file
    console.log("Creating Pidentities Database."); 
    fs.openSync(file, "a"); 
    //create Pidentities table
	db.run("CREATE TABLE IF NOT EXISTS Pidentities (timestamp TEXT, IP_address TEXT, Location TEXT, Orgcode TEXT, filelink TEXT)"); 
//}  


function createNewFolder(piDee, org, loc) {
    //Create the new folder
	mkdirp(PIFOLDERS_ROOT + path.sep + piDee, function (err) {
		err ? console.log(err) : console.log("No errors in creating new folder for "+piDee);
	});

	//Update the DB for pIDs to point to the newly created folder
	db.run("UPDATE Pidentities SET filelink = '" + PIFOLDERS_ROOT + path.sep + piDee + "' WHERE rowid = " + piDee);
	
	//Populate the folder with media
	populateFolder(org, loc, piDee);	
	
	//put in obligatory NASA Meatball
	fs.symlink("C:\\DigitalSignage\\media\\piFilling\\nasameatball.png", PIFOLDERS_ROOT + path.sep + piDee + path.sep + "nasameatball.png",
			   'file', function(err){
					err ? console.error(err) : console.log("No errors in linking NASA logo for "+piDee);
				}
	); 
}	

function traverseFolders(traverseBy, piDee, target)
{
	var thisRoot = '';
	var targetLocation = '';  

	//Determine which path to follow, organization or location
	if(traverseBy == "org"){
		thisRoot = ORG_ROOT;
	}
	else {
		thisRoot = LOC_ROOT;
	}
	
	console.log("Traversing by " + thisRoot);
	
	var finder = findit.find(thisRoot);
	finder.on('directory', function(dir, stat){
		if(path.basename(dir) == target)
		{
			targetLocation = dir;
			console.log("Matched with the : " + dir);
		
			console.log("Inside the walk up " + targetLocation);
			var innerFinder = findit.find(thisRoot);
			innerFinder.on('file', function (file, stat){
				if(targetLocation.indexOf(path.dirname(file)) > -1 ){				  
						var pathArray = file.replace(/\//g,'\\').split("\\");
						var length = pathArray.length;
						//Create a unique filename for each symlink by using the path
						if(length > 3){
							filename = pathArray[length-3]+"."+pathArray[length-2]+"."+pathArray[length-1];
						}
						else {
							filename=pathArray[pathArray.length-1];
						}
						fs.symlink(file.replace(/\//g,'\\'), PIFOLDERS_ROOT + path.sep + piDee + path.sep + filename, function(err){
							console.log(file.replace(/\//g,'\\'));
							console.log("Trying ze link: " + PIFOLDERS_ROOT + path.sep + piDee + path.sep + filename);
							if (err) console.error(err);
						});
				}
				else{
					console.log(file);
				}
			});
  		}
	}); 
}

function populateFolder(org, location, piDee)
{
  console.log("\nTraversing the org folders\n");
  traverseFolders('org', piDee, org)
  console.log("\nTraversing the location folders\n");
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
		  params: {
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

		  res.on('end', function() { 
			 var resultObject = JSON.parse(responseString); 
		   }); 
	   }); 

	   outreq.on('error', function(e) { 
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
		  params: {
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
   
   	   var outreq = http.request(options, function(res) { 
		  console.log('start of outgoing request');

		  res.setEncoding('utf-8'); 
		  var responseString = ''; 
		  
		  res.on('data', function(data) 
		  {
			 responseString += data;
		  }); 

		  res.on('end', function() { 
			 var resultObject = JSON.parse(responseString); 
		   }); 
	   }); 

	   outreq.on('error', function(e) { 
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
   console.log("Entered the if piDee = -1 statement"); 
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
	  //  stmt.finalize();
	    //sendpiDeeSetting(piip, piDee);
        
}

function updatePidentity(loc, org, piDee, piip)
{
   
    var locintab = '';
    var orgintab = '';
    //updating the location and orgcode in the table if it does not match the location/org in XBMC
	
	var stmt = db.prepare("SELECT Location, Orgcode FROM Pidentities WHERE rowid = " + piDee); 
	console.log("7. Before the stmt.get (running it)"); 
	console.log(stmt);
	
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
   db.serialize(function(){
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

    var user = { 
		  jsonrpc: '2.0', 
		  id: '1', 
		  method: 'Player.Open', 
		  params: {
			item: {
			    directory: NFS_MNT_ROOT + "/piFolders/" + piDee
			 }
		  }
		}; 
	   
	 var userString = JSON.stringify(user); 
       console.log(userString, piip);
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
	   
	    var outreq = http.request(options, function(res) { 
		  console.log('start of outgoing request');

		  res.setEncoding('utf-8'); 
		  var responseString = ''; 
		  
		  res.on('data', function(data) 
		  {
			 responseString += data;
		  }); 
		
		 console.log('Leaving outgoing request');
		 
		  res.on('end', function() { 
			 var resultObject = JSON.parse(responseString); 
			 responseString = '';
		   }); 
	   }); 

	   outreq.on('error', function(e) { 
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
	 console.log(piChunk);
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
		  var checkNames = '';
		var stmt = db.prepare("SELECT rowid AS piDee, * FROM Pidentities");

		stmt.each(function(err, row){
			checkNames += '<input type="checkbox" name="Destination" value="'+row.piDee+'">'+ row.Location + ', '+ row.Orgcode +'<br>'
		});
		
		var selectAll = '<script language="JavaScript"> \
                         function toggle(source) { \
							  checkboxes = document.getElementsByName("Destination");\
							  for(var i=0, n=checkboxes.length;i<n;i++) {\
								checkboxes[i].checked = source.checked;\
							   }\
					      }\
						</script>';
		
		
		stmt.finalize(function(){

			res.end('<html> \
						<body bgcolor="#E6E6FA"> \
							<form action="/" method="POST" name="form1"> \
								<b>TOGGLE CONTROL</b> \
								<input type="radio" name="Control" value="ON">ON \
								<input type="radio" name="Control" value="OFF">OFF <br> <br>\
								<b>Select the Source of Notification</b> <br> <br> \
								<input type="radio" name="Source" value="IPTV">IPTV \
									<select name="Channels"> \
									<option value="NASATV">NASATV</option> \
									<option value="ISS1">ISS1</option> \
									<option value="ISS2">ISS2</option> \
									<option value="ISS3">ISS3</option> \
									</select> <br>\
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
		
			stmt2.each(function(err, row){
			    console.log(row.IP_address);
				playEmergency(row.IP_address);
			});

		});
	}

	
}).listen(8080); 


function playEmergency(piip)
{
  
    var user = { 
		  jsonrpc: '2.0', 
		  id: '1', 
		  method: 'Player.Open', 
		  params: {
			item: {
			    directory: NFS_MNT_ROOT + "/Emergency"
			 }
		  }
		}; 
	   
	 var userString = JSON.stringify(user); 
       console.log(userString, piip);
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
	   
	    var outreq = http.request(options, function(res) { 
		  console.log('start of outgoing request');

		  res.setEncoding('utf-8'); 
		  var responseString = ''; 
		  
		  res.on('data', function(data) 
		  {
			 responseString += data;
		  }); 
		
		 console.log('Leaving outgoing request');
		 
		  res.on('end', function() { 
			 var resultObject = JSON.parse(responseString); 
			 responseString = '';
		   }); 
	   }); 

	   outreq.on('error', function(e) { 
		  // TODO: handle error. 
		});

	  outreq.write(userString); 
	  outreq.end();
}
