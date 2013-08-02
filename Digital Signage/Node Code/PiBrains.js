var http = require('http'); 
var fs = require("fs"); 
var sqlite3 = require("sqlite3").verbose(); 
var file = "test9.db";
var piChunk = '';
var body = '';
var db = new sqlite3.Database(file);
var exists = fs.existsSync(file);

   //create the database if it has not been created 
	if(!exists)
    {
      //create Pidentities db file
      console.log("Creating Pidentities Database."); 
      fs.openSync(file, "w"); 
      //create Pidentities table
	  db.run("CREATE TABLE IF NOT EXISTS Pidentities (PiD ROWID, timestamp TEXT, IP_address TEXT, Location TEXT, Orgcode TEXT, filelink TEXT)"); 
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
  
  //Location and Org Code are the default settings on the XBMC addon. They need to be set before anything can be run
  if(loc == "Location" || org == "Org Code")
  {
    console.log("Sending command to reset pi");
  }
  else
  {
    //checks to see if piDee is the default value from XBMC. This means it needs to 
	//create a new entry into the Pidentities table and assign a new piDee to the Pi
	if(piDee == 0)
	{
		console.log("Entered the if pjiDee = 0 statement"); 
		var stmt = db.prepare("INSERT INTO Pidentities (IP_address, Location, Orgcode, timestamp, filelink) VALUES ('" + piip + "', '" + loc + "', '" + org + "', Time('now'), 'c:/blahblahblah')", function(error)
            {
			    piDee = this.lastID;
		        //db.run("UPDATE Pidentities SET filelink = 'XXXXXXXXXXXXXXXX' WHERE rowid = "+ piDee);  
            });
        
		stmt.run();
	    stmt.finalize();
        //send JSON command with piDee back to XBMC
        //build file path = piFile
	         
        }
	else
	{
		console.log("6. Entering the else"); 
	     var locintab = '';
	     var orgintab = '';
         //updating the location and orgcode in the table if it does not match the location/org in XBMC
	    
		var stmt = db.prepare("SELECT Location, Orgcode FROM Pidentities WHERE rowid = 1"); 
		 console.log("7. Before the stmt.get (running it)"); 
	   
		  stmt.get(function(err, row)
		   {
				console.log("8. row.location, row.Orgcode: "+ row.Location, row.Orgcode);
				locintab = row.Location;
				orgintab = row.Orgcode;
				console.log("9. inside .run locintab and orgintab: "+ locintab, orgintab)
				
				if(loc != locintab || org != orgintab)
				{
				   db.run("UPDATE Pidentities SET Location = '" +loc+"', Orgcode = '" +org+"' WHERE rowid = "+ piDee).finalize();
				   console.log("Lovely if statement about location and org");
				   //db.run("UPDATE Pidentities SET Orgcode = '" +org +"' WHERE rowid = "+ piChunk.piDee);
				}  
			
			   console.log("10. After get, before finalize");
				
			});
			//stmt.finalize();
			
	      console.log("11. Outside stmt.get: " + loc, org);	   
	
		  // piFile = db.run("SELECT filelink FROM Pidentities WHERE rowid = " +piChunk.piDee);
		  // db.run("UPDATE Pidentities SET filelink = 'JAMES AND HAYLEY CAN DO IT!' WHERE rowid = 60");
		
	}
	console.log("12. Random spot after the outside stmt.get but before table"); 
  }
  	//updating the filelink for specific piDee in the table
	db.run("UPDATE Pidentities SET filelink = 'JAMES AND HAYLEY ARE CHIP AND DALE' WHERE rowid = "+ piDee);
	//printing	
	db.each("SELECT rowid AS piDee, * FROM Pidentities", function(err, row) 
	{
	   console.log(row.piDee + ": " + row.Location, row.IP_address, row.Orgcode, row.timestamp, row.filelink);
	});
});
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
	
	 console.log("3. Parsing JSON") 
     piChunk = JSON.parse(body);
	 console.log("4. Calling piDeeFunction")
     piDeeFunction(piChunk.location, piChunk.org, piChunk.piDee, piChunk.piip);
		
		var user = { 
		  jsonrpc: '2.0', 
		  id: '1', 
		  method: 'GUI.ShowNotification',  //eventually player.open
		  params: {
			 title: 'HAYLEY AND PETER ROCK!',
			 message: body 
		  }
		}; 
	   
	   var userString = JSON.stringify(user); 

	   var headers = { 
		  'Content-Type': 'application/json', 
		  'Content-Length': userString.length 
	   };
	 
	   var options = { 
		  host: '139.169.8.145', 
		  port: 80, 
		  path: '/jsonrpc', 
		  method: 'POST', 
		  headers: headers 
	   }; 
		console.log('Before outgoing request');
		
		//boolean values for error checking to keep clean
		//BELOW: old database code
	   //db.serialize(function() { 
		   //look to see if create needs to be in db.serialize
     	   //var stmt = db.prepare("INSERT INTO Pidentities (IP_address, Location, Orgcode, timestamp, filelink) VALUES ('" + piChunk.piip + "', '" + piChunk.location + "', '" + piChunk.org + "', Time('now'), 'c:/blahblahblah')");
		  // stmt.run();
		   
		   //error checks for now
		   //selecting and printing
		   //stmt.finalize();
		   //db.each("SELECT rowid AS piDee, * FROM Pidentities", function(err, row) {
			//     console.log(row.piDee + ": " + row.Location, row.IP_address, row.Orgcode, row.timestamp, row.filelink);
		//	});
		//}); 
           //db.close();
		
	   // Setup the request. The options parameter is 
	   // the object we defined above. 
	   var outreq = http.request(options, function(res) { 
		  console.log('start of outgoing request');

		  res.setEncoding('utf-8'); 
		  var responseString = ''; 
		  
		  res.on('data', function(data) {
			 responseString += data;
		  }); 
		 console.log(body);
		 console.log('Leaving outgoing request');
		 
          	 

		  res.on('end', function() { 
			 var resultObject = JSON.parse(responseString); 
		   }); 
	   }); 

	   outreq.on('error', function(e) { 
		  // TODO: handle error. 
		});

	   outreq.write(userString); 
	   outreq.end();

   });

	console.log('2. This is the end');
    

	//Close near server shut down
	//Google to find out what that http.COMMAND is
	
}).listen(8124);
